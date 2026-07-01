import logging
from fastapi import APIRouter, Query, status, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import PromptRecordDb
from app.models.schemas import (
    APIResponse,
    ModelRecommendation,
    PromptCategory,
    PromptData,
)
from app.services.cognee_memory import get_memory_service
from app.services.model_router import ModelRouter
from app.services.prompt_analyzer import get_prompt_analyzer

logger = logging.getLogger("promptiq.routes.models")

router = APIRouter(prefix="/api/models", tags=["models"])


class ModelRecommendRequest(BaseModel):
    """Request body for model recommendation."""
    prompt_text: str = Field(..., min_length=1, description="The prompt to route")
    user_id: str = Field(default="default_user")
    model_used: Optional[str] = None


@router.post(
    "/recommend",
    response_model=APIResponse,
    summary="Get optimal model recommendation",
    description="Analyze a prompt and recommend the optimal AI model based on complexity and history.",
)
async def recommend_model(request: ModelRecommendRequest) -> APIResponse:
    """
    Get the optimal model recommendation for a prompt.
    Uses prompt analysis + Cognee historical performance data.
    """
    memory = get_memory_service()
    analyzer = get_prompt_analyzer()
    router_svc = ModelRouter(memory)

    # Analyze the prompt first
    prompt_data = PromptData(
        prompt_text=request.prompt_text,
        user_id=request.user_id,
        model_used=request.model_used,
    )
    analysis = analyzer.analyze(prompt_data)

    # Get model recommendation
    recommendation = await router_svc.recommend(analysis, request.prompt_text)

    return APIResponse(
        success=True,
        data=recommendation.model_dump(),
        message=f"Recommended model: {recommendation.model_name}",
    )


@router.get(
    "/performance",
    response_model=APIResponse,
    summary="Model performance stats",
    description="Historical model performance data from Cognee's knowledge graph.",
)
async def get_model_performance(
    category: Optional[str] = Query(None, description="Filter by prompt category"),
    db: Session = Depends(get_db)
) -> APIResponse:
    """
    Get historical model performance statistics.
    Queries Cognee for model success rates across categories.
    """
    memory = get_memory_service()

    # Get performance data from Cognee
    categories_to_query = (
        [category] if category
        else [c.value for c in PromptCategory]
    )

    performance_data = {}
    for cat in categories_to_query:
        try:
            result = await memory.get_model_performance(cat)
            performance_data[cat] = {
                "raw_results": result.get("raw_results", []),
                "has_data": len(result.get("raw_results", [])) > 0,
            }
        except Exception as exc:
            logger.warning("Failed to get performance for %s: %s", cat, exc)
            performance_data[cat] = {"raw_results": [], "has_data": False}

    # Also compute from PostgreSQL database
    db_records = db.query(PromptRecordDb).all()
    model_stats = {}
    for r in db_records:
        model = r.recommended_model or "unknown"
        if model not in model_stats:
            model_stats[model] = {
                "total_prompts": 0,
                "total_cost_usd": 0.0,
                "avg_complexity": 0.0,
                "categories": {},
                "complexity_sum": 0.0,
            }
        stats = model_stats[model]
        stats["total_prompts"] += 1
        stats["total_cost_usd"] += r.estimated_cost
        stats["complexity_sum"] += r.complexity_score

        cat = r.category or "unknown"
        stats["categories"][cat] = stats["categories"].get(cat, 0) + 1

    # Finalize averages
    for model, stats in model_stats.items():
        if stats["total_prompts"] > 0:
            stats["avg_complexity"] = round(
                stats["complexity_sum"] / stats["total_prompts"], 1
            )
        stats["total_cost_usd"] = round(stats["total_cost_usd"], 4)
        del stats["complexity_sum"]

    return APIResponse(
        success=True,
        data={
            "cognee_performance": performance_data,
            "local_stats": model_stats,
        },
        message="Model performance data",
    )
