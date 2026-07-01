"""
Prompts API — Capture, analyze, and retrieve prompt interactions.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.models.schemas import (
    AnalyzePromptRequest,
    AnalyzePromptResponse,
    APIResponse,
    PromptData,
    PromptRecord,
)
from app.services.cognee_memory import get_memory_service
from app.services.learning_recommender import LearningRecommender
from app.services.model_router import ModelRouter
from app.services.necessity_scorer import NecessityScorer
from app.services.prompt_analyzer import get_prompt_analyzer
from app.services.skill_tracker import SkillTracker

logger = logging.getLogger("promptiq.routes.prompts")

router = APIRouter(prefix="/api/prompts", tags=["prompts"])

# In-memory store for prompt records (Cognee is the source of truth,
# but we keep a local cache for fast list/get operations)
_prompt_store: Dict[str, PromptRecord] = {}


@router.post(
    "/analyze",
    response_model=AnalyzePromptResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze a prompt — full pipeline",
    description=(
        "Runs the complete PromptIQ analysis pipeline: "
        "classify → store in Cognee → score necessity → route model → suggest learning."
    ),
)
async def analyze_prompt(request: AnalyzePromptRequest) -> AnalyzePromptResponse:
    """
    Full analysis pipeline:
    1. Analyze prompt (complexity, category, domain, cost, time)
    2. Store in Cognee via cognee.remember()
    3. Compute AI Necessity Score via cognee.recall()
    4. Route to optimal model via cognee.recall()
    5. Update developer skills
    6. Generate learning suggestions
    """
    memory = get_memory_service()
    analyzer = get_prompt_analyzer()

    # ── Step 1: Build PromptData and analyze ──────────────────────
    prompt_data = PromptData(
        prompt_text=request.prompt_text,
        response_summary=request.response_summary,
        user_id=request.user_id,
        org_id=request.org_id,
        project=request.project,
        ide_source=request.ide_source,
        model_used=request.model_used,
        token_count_input=request.token_count_input,
        token_count_output=request.token_count_output,
        session_id=request.session_id,
    )

    analysis = analyzer.analyze(prompt_data)
    logger.info(
        "Prompt analyzed: category=%s domain=%s complexity=%.1f",
        analysis.category.value,
        analysis.skill_domain.value,
        analysis.complexity_score,
    )

    # ── Step 2: Store in Cognee ───────────────────────────────────
    try:
        prompt_dict = prompt_data.model_dump()
        prompt_dict["analysis"] = analysis.model_dump()
        prompt_dict["created_at"] = datetime.utcnow().isoformat()
        await memory.store_prompt(prompt_dict)
    except Exception as exc:
        logger.error("Failed to store prompt in Cognee: %s", exc)
        # Continue — analysis results are still valuable even if storage fails

    # ── Step 3: Compute AI Necessity Score ─────────────────────────
    scorer = NecessityScorer(memory)
    necessity = await scorer.score(analysis, request.user_id, request.prompt_text)
    logger.info("Necessity score: %.1f (%s)", necessity.score, necessity.tier)

    # ── Step 4: Route to optimal model ────────────────────────────
    router_svc = ModelRouter(memory)
    model_rec = await router_svc.recommend(analysis, request.prompt_text)
    logger.info("Model recommendation: %s (%s tier)", model_rec.model_name, model_rec.model_tier.value)

    # ── Step 5: Update developer skills ───────────────────────────
    skill_tracker = SkillTracker(memory)
    try:
        await skill_tracker.update_skills(
            user_id=request.user_id,
            analysis=analysis,
            necessity_score=necessity.score,
        )
    except Exception as exc:
        logger.warning("Skill update failed: %s", exc)

    # ── Step 6: Find similar prompts & learning suggestions ───────
    similar: List[Dict[str, Any]] = []
    learning_suggestions: List[str] = []

    try:
        similar = await memory.find_similar_prompts(request.prompt_text, limit=5)
    except Exception as exc:
        logger.warning("Similar prompt search failed: %s", exc)

    try:
        recommender = LearningRecommender(memory)
        learning_suggestions = await recommender.get_suggestions_for_prompt(
            analysis.skill_domain, analysis.keywords
        )
    except Exception as exc:
        logger.warning("Learning suggestion failed: %s", exc)

    # ── Build and store record ────────────────────────────────────
    record = PromptRecord(
        prompt_data=prompt_data,
        analysis=analysis,
        necessity_score=necessity.score,
        recommended_model=model_rec.model_name,
        recommendation_text=necessity.recommendation,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    _prompt_store[record.id] = record

    response = AnalyzePromptResponse(
        prompt_id=record.id,
        analysis=analysis,
        necessity=necessity,
        model_recommendation=model_rec,
        similar_prompts=similar,
        learning_suggestions=learning_suggestions,
        created_at=record.created_at,
    )

    return response


@router.get(
    "/",
    response_model=APIResponse,
    summary="List stored prompts",
    description="Retrieve all stored prompt records with optional filtering.",
)
async def list_prompts(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(50, ge=1, le=200, description="Max results"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
) -> APIResponse:
    """List stored prompts with optional filters."""
    records = list(_prompt_store.values())

    # Apply filters
    if user_id:
        records = [r for r in records if r.prompt_data.user_id == user_id]
    if category:
        records = [r for r in records if r.analysis.category.value == category]

    # Sort by creation time descending
    records.sort(key=lambda r: r.created_at, reverse=True)

    # Paginate
    paginated = records[offset: offset + limit]

    return APIResponse(
        success=True,
        data={
            "prompts": [r.model_dump() for r in paginated],
            "total": len(records),
            "limit": limit,
            "offset": offset,
        },
        message=f"Found {len(records)} prompts",
    )


@router.get(
    "/{prompt_id}",
    response_model=APIResponse,
    summary="Get single prompt",
    description="Retrieve a single prompt record by its ID.",
)
async def get_prompt(prompt_id: str) -> APIResponse:
    """Get a specific prompt record by ID."""
    record = _prompt_store.get(prompt_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prompt {prompt_id} not found",
        )

    return APIResponse(
        success=True,
        data=record.model_dump(),
        message="Prompt found",
    )
