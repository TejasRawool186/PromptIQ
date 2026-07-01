"""
NecessityScorer — Computes AI Necessity Score (0-100).

Determines whether a developer truly needs AI for a given prompt,
using their skill history from Cognee and the prompt's characteristics.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.models.schemas import (
    NecessityScore,
    PromptAnalysis,
    PromptCategory,
    SkillDomain,
)
from app.services.cognee_memory import CogneeMemoryService

logger = logging.getLogger("promptiq.necessity_scorer")


class NecessityScorer:
    """
    Computes AI Necessity Score using:
    1. Complexity of the current prompt
    2. Developer's skill history (from Cognee recall)
    3. Similar past prompt frequency
    4. Time since last independent solve
    """

    def __init__(self, memory_service: CogneeMemoryService) -> None:
        self.memory = memory_service

    async def score(
        self,
        analysis: PromptAnalysis,
        user_id: str,
        prompt_text: str,
    ) -> NecessityScore:
        """
        Compute the AI Necessity Score for a prompt.

        Returns a score 0-100 with:
          0-30  → Developer likely knows this — suggest self-solve
          31-70 → AI can help but developer should learn
          71-100→ Highly complex — AI is the right tool
        """
        # Gather intelligence from Cognee memory
        skill_data = await self._get_skill_context(user_id, analysis.skill_domain)
        similar_prompts = await self._get_similar_prompt_frequency(prompt_text)
        independent_data = await self._get_independent_solve_recency(user_id, analysis.skill_domain)

        # Compute individual factor scores
        complexity_factor = self._score_complexity(analysis)
        skill_factor = self._score_skill_gap(skill_data, analysis.skill_domain)
        frequency_factor = self._score_repetition(similar_prompts)
        recency_factor = self._score_recency(independent_data)
        category_factor = self._score_category_need(analysis.category)

        factors = {
            "complexity": round(complexity_factor, 2),
            "skill_gap": round(skill_factor, 2),
            "repetition_penalty": round(frequency_factor, 2),
            "independent_recency": round(recency_factor, 2),
            "category_inherent_need": round(category_factor, 2),
        }

        # Weighted combination
        raw_score = (
            complexity_factor * 0.30
            + skill_factor * 0.25
            + frequency_factor * 0.15
            + recency_factor * 0.15
            + category_factor * 0.15
        )

        # Clamp to 0-100
        final_score = max(0.0, min(100.0, raw_score))

        # Determine tier and recommendation
        tier, recommendation = self._generate_recommendation(final_score, analysis, factors)

        return NecessityScore(
            score=round(final_score, 1),
            recommendation=recommendation,
            tier=tier,
            factors=factors,
        )

    # ──── Factor Computations ────────────────────────────────────────

    def _score_complexity(self, analysis: PromptAnalysis) -> float:
        """Higher complexity → higher necessity score."""
        # Complexity is 1-10, map to 0-100 range with non-linear scaling
        c = analysis.complexity_score
        if c <= 3:
            return c * 8  # Low complexity → low need (0-24)
        elif c <= 6:
            return 24 + (c - 3) * 12  # Medium → moderate (24-60)
        else:
            return 60 + (c - 6) * 10  # High → high need (60-100)

    def _score_skill_gap(self, skill_data: Dict[str, Any],
                          domain: SkillDomain) -> float:
        """Higher skill → lower necessity (developer can do it themselves)."""
        skill_level = skill_data.get("skill_level", 50.0)
        # Invert: high skill = low necessity
        # skill_level 0 → necessity 100, skill_level 100 → necessity 10
        return max(10.0, 100.0 - skill_level * 0.9)

    def _score_repetition(self, similar_prompts: List[Dict[str, Any]]) -> float:
        """
        If the developer asks this type of question repeatedly,
        they should learn it — lower necessity score (penalty).
        """
        count = len(similar_prompts)
        if count == 0:
            return 70.0  # First time asking → AI is helpful
        elif count <= 2:
            return 50.0  # Asked a couple times → moderate
        elif count <= 5:
            return 30.0  # Repeated pattern → should learn
        else:
            return 10.0  # Very repetitive → definitely learn this

    def _score_recency(self, independent_data: Dict[str, Any]) -> float:
        """
        If the developer recently solved similar problems independently,
        they probably don't need AI for this.
        """
        days_since_independent = independent_data.get("days_since_last_independent", 999)
        has_solved_independently = independent_data.get("has_solved_independently", False)

        if not has_solved_independently:
            return 80.0  # Never solved independently → AI needed
        elif days_since_independent <= 7:
            return 20.0  # Recently solved → they know this
        elif days_since_independent <= 30:
            return 40.0  # Solved within a month → might need refresher
        else:
            return 60.0  # Long time ago → may have forgotten

    def _score_category_need(self, category: PromptCategory) -> float:
        """Some categories inherently benefit more from AI than others."""
        inherent_scores = {
            PromptCategory.BOILERPLATE: 85.0,       # AI great for boilerplate
            PromptCategory.CODE_GENERATION: 60.0,    # Depends on complexity
            PromptCategory.DEBUGGING: 50.0,          # Sometimes better to debug yourself
            PromptCategory.REFACTORING: 45.0,        # Good exercise to refactor yourself
            PromptCategory.DOCUMENTATION: 70.0,      # AI good for docs
            PromptCategory.ARCHITECTURE: 40.0,       # Should understand architecture yourself
            PromptCategory.LEARNING: 30.0,           # Asking AI to learn defeats the purpose
        }
        return inherent_scores.get(category, 50.0)

    # ──── Cognee-backed context retrieval ────────────────────────────

    async def _get_skill_context(self, user_id: str,
                                  domain: SkillDomain) -> Dict[str, Any]:
        """Retrieve developer's skill level in this domain from Cognee."""
        try:
            results = await self.memory.get_developer_skills(user_id)
            raw = results.get("raw_results", [])

            # Extract skill level from Cognee results
            skill_level = 50.0  # Default mid-level
            for item in raw:
                content = str(item.get("content", "")) if isinstance(item, dict) else str(item)
                if domain.value in content.lower():
                    # Try to extract a numeric skill level
                    import re
                    numbers = re.findall(r"(\d+(?:\.\d+)?)", content)
                    if numbers:
                        extracted = float(numbers[0])
                        if 0 <= extracted <= 100:
                            skill_level = extracted
                            break

            return {"skill_level": skill_level, "raw": raw}

        except Exception as exc:
            logger.warning("Failed to get skill context: %s", exc)
            return {"skill_level": 50.0, "raw": []}

    async def _get_similar_prompt_frequency(self, prompt_text: str) -> List[Dict[str, Any]]:
        """Check how often the developer has asked similar questions."""
        try:
            return await self.memory.find_similar_prompts(prompt_text, limit=10)
        except Exception as exc:
            logger.warning("Failed to get similar prompts: %s", exc)
            return []

    async def _get_independent_solve_recency(self, user_id: str,
                                               domain: SkillDomain) -> Dict[str, Any]:
        """Check when the developer last solved a similar problem without AI."""
        try:
            query = (
                f"When did developer {user_id} last solve a {domain.value} "
                f"problem independently without AI assistance?"
            )
            results = await self.memory.recall_memory(query, limit=5)
            raw = results.get("results", [])

            return {
                "has_solved_independently": len(raw) > 0,
                "days_since_last_independent": 30 if raw else 999,
                "raw": raw,
            }
        except Exception as exc:
            logger.warning("Failed to check independent solve recency: %s", exc)
            return {"has_solved_independently": False, "days_since_last_independent": 999}

    # ──── Recommendation generation ──────────────────────────────────

    def _generate_recommendation(
        self,
        score: float,
        analysis: PromptAnalysis,
        factors: Dict[str, float],
    ) -> tuple[str, str]:
        """Generate tier label and human-readable recommendation."""
        domain = analysis.skill_domain.value.replace("_", " ").title()
        category = analysis.category.value.replace("_", " ").title()

        if score <= 30:
            tier = "self_solve"
            recommendation = (
                f"You likely have the skills to handle this {category} task in {domain} "
                f"on your own. Solving it independently will reinforce your expertise. "
                f"Try tackling it first — you can always ask AI if you get stuck."
            )
        elif score <= 70:
            tier = "learn_and_use"
            if factors.get("repetition_penalty", 50) < 40:
                recommendation = (
                    f"You've asked similar {category} questions in {domain} before. "
                    f"AI can help now, but consider investing time to learn this area. "
                    f"This would reduce your AI dependency and boost your {domain} skills."
                )
            else:
                recommendation = (
                    f"This {category} task has moderate complexity. AI assistance is reasonable, "
                    f"but take time to understand the solution rather than just copying it. "
                    f"This is a good learning opportunity in {domain}."
                )
        else:
            tier = "ai_recommended"
            recommendation = (
                f"This is a complex {category} task in {domain} (complexity: "
                f"{analysis.complexity_score}/10). AI assistance is the right choice here — "
                f"it will save significant time and the task complexity justifies the cost."
            )

        return tier, recommendation
