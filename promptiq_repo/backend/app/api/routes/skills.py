"""
Skills API — Developer skill profiles, timelines, and learning recommendations.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Query, status

from app.models.schemas import (
    APIResponse,
    SkillDomain,
)
from app.services.cognee_memory import get_memory_service
from app.services.learning_recommender import LearningRecommender
from app.services.skill_tracker import SkillTracker

logger = logging.getLogger("promptiq.routes.skills")

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.get(
    "/{user_id}",
    response_model=APIResponse,
    summary="Developer skill profile",
    description="Retrieve the complete skill profile for a developer, computed from Cognee memory.",
)
async def get_skill_profile(user_id: str) -> APIResponse:
    """
    Get the full skill profile for a developer.
    Queries Cognee for skill data across all domains.
    """
    memory = get_memory_service()
    tracker = SkillTracker(memory)

    try:
        profile = await tracker.get_skill_profile(user_id)

        return APIResponse(
            success=True,
            data=profile.model_dump(),
            message=f"Skill profile for {user_id}",
        )

    except Exception as exc:
        logger.error("Failed to get skill profile for %s: %s", user_id, exc)
        return APIResponse(
            success=False,
            data=None,
            message="Failed to retrieve skill profile",
            error=str(exc),
        )


@router.get(
    "/{user_id}/timeline",
    response_model=APIResponse,
    summary="Skill progression timeline",
    description="Track skill progression over time for a developer.",
)
async def get_skill_timeline(
    user_id: str,
    domain: Optional[SkillDomain] = Query(None, description="Filter by skill domain"),
) -> APIResponse:
    """
    Get skill progression over time.
    Shows temporal evolution of skills from Cognee's knowledge graph.
    """
    memory = get_memory_service()
    tracker = SkillTracker(memory)

    try:
        timelines = await tracker.get_skill_timeline(user_id, domain)

        return APIResponse(
            success=True,
            data={
                "user_id": user_id,
                "timelines": [t.model_dump() for t in timelines],
                "filtered_domain": domain.value if domain else "all",
            },
            message=f"Skill timeline for {user_id}",
        )

    except Exception as exc:
        logger.error("Failed to get skill timeline for %s: %s", user_id, exc)
        return APIResponse(
            success=False,
            data=None,
            message="Failed to retrieve skill timeline",
            error=str(exc),
        )


@router.get(
    "/{user_id}/recommendations",
    response_model=APIResponse,
    summary="Learning recommendations",
    description="Personalized learning recommendations based on skill gaps from Cognee pattern analysis.",
)
async def get_learning_recommendations(user_id: str) -> APIResponse:
    """
    Get personalized learning recommendations.
    Identifies recurring prompt patterns and suggests resources.
    """
    memory = get_memory_service()
    recommender = LearningRecommender(memory)

    try:
        recommendations = await recommender.get_recommendations(user_id)

        return APIResponse(
            success=True,
            data=recommendations.model_dump(),
            message=f"Learning recommendations for {user_id}",
        )

    except Exception as exc:
        logger.error("Failed to get recommendations for %s: %s", user_id, exc)
        return APIResponse(
            success=False,
            data=None,
            message="Failed to generate recommendations",
            error=str(exc),
        )
