"""
Prompts API — Capture, analyze, and retrieve prompt interactions.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, status, Depends, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import PromptRecordDb, User
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
async def analyze_prompt(
    request: AnalyzePromptRequest,
    db: Session = Depends(get_db)
) -> AnalyzePromptResponse:
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

    # ── Ensure user exists in database to prevent Foreign Key errors ──
    user_exists = db.query(User).filter(User.id == request.user_id).first()
    if not user_exists:
        placeholder_user = User(
            id=request.user_id,
            email=f"{request.user_id}@promptiq.dev",
            name=f"Developer {request.user_id}",
            picture="https://lh3.googleusercontent.com/a/default-user"
        )
        db.add(placeholder_user)
        db.commit()
        db.refresh(placeholder_user)

    # ── Build and store record in PostgreSQL ──────────────────────
    record = PromptRecord(
        prompt_data=prompt_data,
        analysis=analysis,
        necessity_score=necessity.score,
        recommended_model=model_rec.model_name,
        recommendation_text=necessity.recommendation,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db_record = PromptRecordDb(
        id=record.id,
        user_id=request.user_id,
        prompt_text=request.prompt_text,
        response_summary=request.response_summary,
        category=analysis.category.value,
        skill_domain=analysis.skill_domain.value,
        complexity_score=analysis.complexity_score,
        necessity_score=necessity.score,
        model_used=request.model_used,
        recommended_model=model_rec.model_name,
        estimated_cost=analysis.estimated_ai_cost_usd,
        token_count=request.token_count_input + request.token_count_output,
        created_at=record.created_at,
    )
    db.add(db_record)
    db.commit()

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


def _db_record_to_dict(db_record: PromptRecordDb) -> dict:
    """Helper to convert flat database prompt record to standard Pydantic schema dictionary."""
    return {
        "id": db_record.id,
        "created_at": db_record.created_at.isoformat() if isinstance(db_record.created_at, datetime) else db_record.created_at,
        "updated_at": db_record.created_at.isoformat() if isinstance(db_record.created_at, datetime) else db_record.created_at,
        "prompt_data": {
            "prompt_text": db_record.prompt_text,
            "response_summary": db_record.response_summary,
            "user_id": db_record.user_id,
            "org_id": "default_org",
            "project": "default_project",
            "ide_source": "vs_code",
            "model_used": db_record.model_used,
            "token_count_input": db_record.token_count // 2,
            "token_count_output": db_record.token_count // 2,
        },
        "analysis": {
            "complexity_score": db_record.complexity_score,
            "category": db_record.category,
            "skill_domain": db_record.skill_domain,
            "estimated_manual_minutes": int(db_record.complexity_score * 10),
            "estimated_ai_cost_usd": db_record.estimated_cost,
            "keywords": [],
        },
        "necessity_score": db_record.necessity_score,
        "recommended_model": db_record.recommended_model,
        "recommendation_text": "",
    }


@router.get(
    "/",
    response_model=APIResponse,
    summary="List stored prompts",
    description="Retrieve all stored prompt records with optional filtering.",
)
async def list_prompts(
    request: Request,
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(50, ge=1, le=200, description="Max results"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db)
) -> APIResponse:
    """List stored prompts with optional filters."""
    query = db.query(PromptRecordDb)

    # Filter by user ID (defaulting to requesting user)
    user_id_filter = user_id or getattr(request.state, "user_id", None)
    if user_id_filter:
        query = query.filter(PromptRecordDb.user_id == user_id_filter)
    if category:
        query = query.filter(PromptRecordDb.category == category)

    total = query.count()
    
    # Sort by creation time descending, and paginate
    db_records = query.order_by(PromptRecordDb.created_at.desc()).offset(offset).limit(limit).all()
    
    serialized = [_db_record_to_dict(r) for r in db_records]

    return APIResponse(
        success=True,
        data={
            "prompts": serialized,
            "total": total,
            "limit": limit,
            "offset": offset,
        },
        message=f"Found {total} prompts",
    )


@router.get(
    "/{prompt_id}",
    response_model=APIResponse,
    summary="Get single prompt",
    description="Retrieve a single prompt record by its ID.",
)
async def get_prompt(
    prompt_id: str,
    db: Session = Depends(get_db)
) -> APIResponse:
    """Get a specific prompt record by ID."""
    db_record = db.query(PromptRecordDb).filter(PromptRecordDb.id == prompt_id).first()
    if not db_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prompt {prompt_id} not found",
        )

    return APIResponse(
        success=True,
        data=_db_record_to_dict(db_record),
        message="Prompt found",
    )
