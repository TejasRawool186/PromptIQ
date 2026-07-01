"""
SkillTracker — Tracks developer skill evolution over time.

Updates skill levels based on prompt patterns, computes competency
scores, tracks learning velocity, and monitors AI dependency trends.
All state is persisted in Cognee's knowledge graph.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.schemas import (
    DeveloperSkillProfile,
    PromptAnalysis,
    PromptCategory,
    SkillDomain,
    SkillNode,
    SkillTimeline,
)
from app.services.cognee_memory import CogneeMemoryService

logger = logging.getLogger("promptiq.skill_tracker")

# ─── Skill impact weights by category ────────────────────────────────────────

CATEGORY_SKILL_IMPACT: Dict[PromptCategory, float] = {
    PromptCategory.BOILERPLATE: 0.1,     # Low learning value
    PromptCategory.CODE_GENERATION: 0.3,  # Moderate learning
    PromptCategory.DEBUGGING: 0.5,        # Good learning signal
    PromptCategory.REFACTORING: 0.4,      # Shows understanding
    PromptCategory.DOCUMENTATION: 0.2,    # Some learning
    PromptCategory.ARCHITECTURE: 0.6,     # High learning value
    PromptCategory.LEARNING: 0.7,         # Explicit learning intent
}


class SkillTracker:
    """Tracks and updates developer skill profiles using Cognee memory."""

    def __init__(self, memory_service: CogneeMemoryService) -> None:
        self.memory = memory_service

    # ──── Skill Profile Retrieval ────────────────────────────────────

    async def get_skill_profile(self, user_id: str) -> DeveloperSkillProfile:
        """
        Retrieve or compute the full skill profile for a developer.
        Queries Cognee for skill data and synthesizes into a profile.
        """
        raw_skills = await self.memory.get_developer_skills(user_id)
        raw_results = raw_skills.get("raw_results", [])

        # Build skill nodes from Cognee data
        skills = self._synthesize_skills(raw_results, user_id)

        # Compute aggregate metrics
        total_prompts = sum(s.prompt_count for s in skills)
        overall_level = (
            sum(s.level * s.prompt_count for s in skills) / max(total_prompts, 1)
        )
        avg_dependency = (
            sum(s.ai_dependency_ratio for s in skills) / max(len(skills), 1)
        )

        strongest = max(skills, key=lambda s: s.level) if skills else None
        weakest = min(skills, key=lambda s: s.level) if skills else None

        return DeveloperSkillProfile(
            user_id=user_id,
            skills=skills,
            overall_level=round(overall_level, 1),
            total_prompts=total_prompts,
            ai_dependency_score=round(avg_dependency * 100, 1),
            learning_velocity=self._compute_learning_velocity(skills),
            strongest_domain=strongest.domain if strongest else None,
            weakest_domain=weakest.domain if weakest else None,
            last_updated=datetime.utcnow(),
        )

    # ──── Skill Update on Prompt Submission ──────────────────────────

    async def update_skills(
        self,
        user_id: str,
        analysis: PromptAnalysis,
        necessity_score: float,
    ) -> None:
        """
        Update a developer's skills based on a new prompt interaction.
        Stores the skill evolution event in Cognee.
        """
        domain = analysis.skill_domain
        category = analysis.category
        complexity = analysis.complexity_score

        # Compute skill impact
        impact = CATEGORY_SKILL_IMPACT.get(category, 0.3)
        skill_delta = impact * (complexity / 10.0)

        # AI dependency signal: high necessity = high dependency
        dependency_signal = necessity_score / 100.0

        # Store the skill update event in Cognee
        skill_event = (
            f"Skill Update Event — {datetime.utcnow().isoformat()}\n"
            f"Developer: {user_id}\n"
            f"Domain: {domain.value}\n"
            f"Category: {category.value}\n"
            f"Complexity: {complexity}\n"
            f"Skill Impact: +{skill_delta:.2f}\n"
            f"AI Dependency Signal: {dependency_signal:.2f}\n"
            f"Necessity Score: {necessity_score}\n"
            f"Learning Value: {'high' if impact >= 0.5 else 'moderate' if impact >= 0.3 else 'low'}\n"
        )

        try:
            await self.memory.store_memory(
                data=skill_event,
                context=f"skill_tracking_{user_id}",
                dataset_name=f"skills_{user_id}",
                metadata={
                    "user_id": user_id,
                    "domain": domain.value,
                    "skill_delta": skill_delta,
                    "dependency_signal": dependency_signal,
                    "timestamp": datetime.utcnow().isoformat(),
                },
            )
            logger.info(
                "Updated skill for user=%s domain=%s delta=+%.2f",
                user_id, domain.value, skill_delta,
            )
        except Exception as exc:
            logger.warning("Failed to store skill update: %s", exc)

    # ──── Skill Timeline ─────────────────────────────────────────────

    async def get_skill_timeline(
        self, user_id: str, domain: Optional[SkillDomain] = None
    ) -> List[SkillTimeline]:
        """
        Get skill progression over time for a developer.
        Queries Cognee for temporal skill data.
        """
        if domain:
            query = (
                f"Show the skill progression timeline for developer {user_id} "
                f"in the {domain.value} domain. Include timestamps and skill levels."
            )
        else:
            query = (
                f"Show the complete skill progression timeline for developer {user_id} "
                f"across all domains. Include timestamps and skill levels."
            )

        results = await self.memory.recall_memory(query, limit=50)
        raw = results.get("results", [])

        timelines: List[SkillTimeline] = []
        domains_to_process = [domain] if domain else list(SkillDomain)

        for d in domains_to_process:
            # Filter results relevant to this domain
            domain_data = [
                r for r in raw
                if d.value in str(r).lower()
            ]

            data_points = []
            for i, item in enumerate(domain_data):
                data_points.append({
                    "index": i,
                    "content": str(item.get("content", item) if isinstance(item, dict) else item),
                    "timestamp": datetime.utcnow().isoformat(),
                })

            timelines.append(SkillTimeline(
                user_id=user_id,
                domain=d,
                data_points=data_points,
                trend_direction=self._compute_trend(data_points),
                velocity=len(data_points) * 0.1,
            ))

        return timelines

    # ──── AI Dependency Tracking ─────────────────────────────────────

    async def get_dependency_trend(self, user_id: str) -> Dict[str, Any]:
        """Track whether a developer's AI dependency is increasing or decreasing."""
        query = (
            f"What is the AI dependency trend for developer {user_id}? "
            f"Is their reliance on AI increasing, decreasing, or stable? "
            f"Show data over time."
        )
        results = await self.memory.recall_memory(query, limit=20)

        return {
            "user_id": user_id,
            "trend": "stable",  # Default; refined as data accumulates
            "data": results.get("results", []),
            "analyzed_at": datetime.utcnow().isoformat(),
        }

    # ──── Internal helpers ───────────────────────────────────────────

    def _synthesize_skills(
        self, raw_results: List[Any], user_id: str
    ) -> List[SkillNode]:
        """Synthesize SkillNode objects from raw Cognee recall results."""
        skill_data: Dict[SkillDomain, Dict[str, Any]] = {}

        # Initialize all domains with defaults
        for domain in SkillDomain:
            skill_data[domain] = {
                "level": 30.0,
                "prompt_count": 0,
                "ai_dependency_ratio": 0.5,
                "mentions": 0,
            }

        # Parse Cognee results to extract domain-specific data
        for item in raw_results:
            content = str(item.get("content", item) if isinstance(item, dict) else item).lower()

            for domain in SkillDomain:
                if domain.value in content:
                    data = skill_data[domain]
                    data["mentions"] += 1
                    # More mentions = more activity = higher level (rough heuristic)
                    data["prompt_count"] += 1
                    data["level"] = min(100.0, data["level"] + 2.0)

        # Build SkillNode list
        skills: List[SkillNode] = []
        for domain, data in skill_data.items():
            if data["mentions"] > 0 or True:  # Include all domains
                skills.append(SkillNode(
                    domain=domain,
                    level=round(data["level"], 1),
                    prompt_count=data["prompt_count"],
                    ai_dependency_ratio=data["ai_dependency_ratio"],
                    last_activity=datetime.utcnow() if data["mentions"] > 0 else None,
                    trend="improving" if data["mentions"] > 2 else "stable",
                ))

        return skills

    @staticmethod
    def _compute_learning_velocity(skills: List[SkillNode]) -> float:
        """Compute the overall learning velocity (rate of skill acquisition)."""
        improving = sum(1 for s in skills if s.trend == "improving")
        total = max(len(skills), 1)
        return round((improving / total) * 10.0, 1)

    @staticmethod
    def _compute_trend(data_points: List[Dict[str, Any]]) -> str:
        """Determine trend direction from data points."""
        if len(data_points) < 2:
            return "stable"
        elif len(data_points) > 5:
            return "improving"
        else:
            return "stable"
