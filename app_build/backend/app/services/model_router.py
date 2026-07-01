"""
ModelRouter — Routes prompts to the optimal AI model.

Uses prompt complexity, category, and Cognee-backed historical
success rates to select the best model tier.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.models.schemas import (
    ModelRecommendation,
    ModelTier,
    PromptAnalysis,
    PromptCategory,
    SkillDomain,
)
from app.services.cognee_memory import CogneeMemoryService

logger = logging.getLogger("promptiq.model_router")

# ─── Model definitions ──────────────────────────────────────────────────────

MODEL_REGISTRY: Dict[ModelTier, List[Dict[str, Any]]] = {
    ModelTier.LOCAL: [
        {
            "name": "ollama/llama3",
            "cost_per_1k_input": 0.0,
            "cost_per_1k_output": 0.0,
            "strengths": ["boilerplate", "simple code", "formatting"],
            "max_complexity": 3,
        },
        {
            "name": "ollama/codellama",
            "cost_per_1k_input": 0.0,
            "cost_per_1k_output": 0.0,
            "strengths": ["code completion", "simple generation"],
            "max_complexity": 4,
        },
    ],
    ModelTier.MID_TIER: [
        {
            "name": "gpt-4o-mini",
            "cost_per_1k_input": 0.00015,
            "cost_per_1k_output": 0.0006,
            "strengths": ["code generation", "debugging", "refactoring"],
            "max_complexity": 6,
        },
        {
            "name": "openai-gpt-oss-120b",
            "cost_per_1k_input": 0.00015,
            "cost_per_1k_output": 0.0006,
            "strengths": ["general text", "simple logic"],
            "max_complexity": 5,
        },
        {
            "name": "gpt-4.1-mini",
            "cost_per_1k_input": 0.0004,
            "cost_per_1k_output": 0.0016,
            "strengths": ["code generation", "refactoring", "debugging"],
            "max_complexity": 7,
        },
        {
            "name": "deepseek-v4-pro",
            "cost_per_1k_input": 0.000435,
            "cost_per_1k_output": 0.00087,
            "strengths": ["complex coding", "reasoning", "math"],
            "max_complexity": 8,
        },
        {
            "name": "claude-haiku",
            "cost_per_1k_input": 0.001,
            "cost_per_1k_output": 0.005,
            "strengths": ["fast suggestions", "documentation"],
            "max_complexity": 5,
        },
        {
            "name": "gemini-flash",
            "cost_per_1k_input": 0.0015,
            "cost_per_1k_output": 0.009,
            "strengths": ["multimodal", "fast code generation"],
            "max_complexity": 7,
        },
    ],
    ModelTier.PREMIUM: [
        {
            "name": "gpt-5.2",
            "cost_per_1k_input": 0.00175,
            "cost_per_1k_output": 0.014,
            "strengths": ["agentic workflows", "complex reasoning"],
            "max_complexity": 9,
        },
        {
            "name": "gemini-pro",
            "cost_per_1k_input": 0.0025,
            "cost_per_1k_output": 0.015,
            "strengths": ["long context tasks", "complex system design"],
            "max_complexity": 9,
        },
        {
            "name": "claude-sonnet",
            "cost_per_1k_input": 0.003,
            "cost_per_1k_output": 0.015,
            "strengths": ["architecture", "complex debugging", "refactoring"],
            "max_complexity": 9,
        },
        {
            "name": "claude-opus",
            "cost_per_1k_input": 0.005,
            "cost_per_1k_output": 0.025,
            "strengths": ["architecture", "complex debugging", "research"],
            "max_complexity": 10,
        },
        {
            "name": "o3-pro",
            "cost_per_1k_input": 0.02,
            "cost_per_1k_output": 0.08,
            "strengths": ["advanced math", "competitive coding"],
            "max_complexity": 10,
        },
        {
            "name": "gpt-5.4-pro",
            "cost_per_1k_input": 0.03,
            "cost_per_1k_output": 0.18,
            "strengths": ["autonomous systems", "enterprise architectures"],
            "max_complexity": 10,
        },
        {
            "name": "gpt-5.5-pro",
            "cost_per_1k_input": 0.03,
            "cost_per_1k_output": 0.18,
            "strengths": ["autonomous systems", "enterprise architectures"],
            "max_complexity": 10,
        },
    ],
    ModelTier.SPECIALIZED: [
        {
            "name": "copilot",
            "cost_per_1k_input": 0.0,
            "cost_per_1k_output": 0.0,
            "strengths": ["code completion", "inline suggestions"],
            "max_complexity": 5,
        },
        {
            "name": "codex",
            "cost_per_1k_input": 0.01,
            "cost_per_1k_output": 0.03,
            "strengths": ["code generation", "code completion", "autonomous coding"],
            "max_complexity": 8,
        },
    ],
}

# Category → preferred model tier mapping
CATEGORY_TIER_PREFERENCES: Dict[PromptCategory, List[ModelTier]] = {
    PromptCategory.BOILERPLATE: [ModelTier.LOCAL, ModelTier.SPECIALIZED],
    PromptCategory.CODE_GENERATION: [ModelTier.MID_TIER, ModelTier.PREMIUM],
    PromptCategory.DEBUGGING: [ModelTier.MID_TIER, ModelTier.PREMIUM],
    PromptCategory.REFACTORING: [ModelTier.MID_TIER, ModelTier.PREMIUM],
    PromptCategory.DOCUMENTATION: [ModelTier.MID_TIER, ModelTier.LOCAL],
    PromptCategory.ARCHITECTURE: [ModelTier.PREMIUM],
    PromptCategory.LEARNING: [ModelTier.MID_TIER],
}


class ModelRouter:
    """Routes prompts to the optimal AI model based on analysis and history."""

    def __init__(self, memory_service: CogneeMemoryService) -> None:
        self.memory = memory_service

    async def recommend(
        self,
        analysis: PromptAnalysis,
        prompt_text: str,
    ) -> ModelRecommendation:
        """
        Determine the optimal model for a prompt.

        Routing strategy:
          - Complexity 1-3  → Local/Ollama
          - Complexity 4-6  → Mid-tier (Gemini Flash / GPT-4o-mini)
          - Complexity 7-10 → Premium (Claude Opus / GPT-4o)
          - Code completion category → Specialized (Copilot / Codex)

        Enhanced with Cognee recall for historical success rates.
        """
        # Step 1: Determine tier from complexity and category
        tier = self._select_tier(analysis)

        # Step 2: Get historical performance from Cognee
        history = await self._get_historical_performance(
            analysis.category.value, analysis.skill_domain.value
        )

        # Step 3: Select the best model within the tier
        model_info = self._select_model_in_tier(tier, analysis, history)

        # Step 4: Compute estimated cost
        estimated_cost = self._compute_cost(
            model_info, analysis.token_count
        )

        # Step 5: Generate alternatives
        alternatives = self._get_alternatives(tier, model_info["name"])

        # Step 6: Build the recommendation
        reasoning = self._build_reasoning(tier, analysis, model_info, history)

        return ModelRecommendation(
            model_name=model_info["name"],
            model_tier=tier,
            confidence=self._compute_confidence(analysis, history),
            reasoning=reasoning,
            estimated_cost_usd=round(estimated_cost, 6),
            alternatives=alternatives,
            historical_success_rate=history.get("success_rate"),
        )

    # ──── Tier selection ─────────────────────────────────────────────

    def _select_tier(self, analysis: PromptAnalysis) -> ModelTier:
        """Select model tier based on complexity and category."""
        complexity = analysis.complexity_score
        category = analysis.category

        # Specialized tier for code completion patterns
        if category == PromptCategory.BOILERPLATE and complexity <= 3:
            return ModelTier.LOCAL

        # Category-based preferences
        preferred_tiers = CATEGORY_TIER_PREFERENCES.get(
            category, [ModelTier.MID_TIER]
        )

        # Complexity override
        if complexity <= 3:
            return ModelTier.LOCAL
        elif complexity <= 6:
            # Use category preference if it includes mid-tier, else default
            if ModelTier.MID_TIER in preferred_tiers:
                return ModelTier.MID_TIER
            return preferred_tiers[0]
        elif complexity <= 8:
            # Prefer premium for high complexity
            if ModelTier.PREMIUM in preferred_tiers:
                return ModelTier.PREMIUM
            return ModelTier.MID_TIER  # Fallback for categories that don't need premium
        else:
            return ModelTier.PREMIUM

    # ──── Model selection within tier ────────────────────────────────

    def _select_model_in_tier(
        self,
        tier: ModelTier,
        analysis: PromptAnalysis,
        history: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Pick the best model within the selected tier."""
        models = MODEL_REGISTRY.get(tier, MODEL_REGISTRY[ModelTier.MID_TIER])

        # Check if Cognee history recommends a specific model
        historical_best = history.get("best_model")
        if historical_best:
            for model in models:
                if model["name"] == historical_best:
                    return model

        # Score each model by strength alignment
        category_str = analysis.category.value.replace("_", " ")
        best_model = models[0]
        best_score = 0.0

        for model in models:
            score = 0.0
            for strength in model["strengths"]:
                if strength in category_str or category_str in strength:
                    score += 2.0
                # Partial word overlap
                for word in category_str.split():
                    if word in strength:
                        score += 0.5

            # Complexity fit bonus
            if analysis.complexity_score <= model["max_complexity"]:
                score += 1.0

            if score > best_score:
                best_score = score
                best_model = model

        return best_model

    # ──── Historical performance from Cognee ─────────────────────────

    async def _get_historical_performance(
        self, category: str, domain: str
    ) -> Dict[str, Any]:
        """Query Cognee for historical model performance data."""
        try:
            result = await self.memory.get_model_performance(category)
            raw_results = result.get("raw_results", [])

            if raw_results:
                # Extract structured data from Cognee results
                return {
                    "has_history": True,
                    "raw": raw_results,
                    "success_rate": None,  # Will be populated as data accumulates
                    "best_model": None,
                }

            return {"has_history": False, "raw": [], "success_rate": None, "best_model": None}

        except Exception as exc:
            logger.warning("Failed to get model performance history: %s", exc)
            return {"has_history": False, "raw": [], "success_rate": None, "best_model": None}

    # ──── Cost computation ───────────────────────────────────────────

    @staticmethod
    def _compute_cost(model_info: Dict[str, Any], token_count: int) -> float:
        """Estimate cost for this prompt with the selected model."""
        input_tokens = token_count
        output_tokens = int(token_count * 1.5)  # Rough estimate

        input_cost = (input_tokens / 1000.0) * model_info.get("cost_per_1k_input", 0.001)
        output_cost = (output_tokens / 1000.0) * model_info.get("cost_per_1k_output", 0.002)

        return input_cost + output_cost

    # ──── Alternatives ───────────────────────────────────────────────

    def _get_alternatives(self, primary_tier: ModelTier,
                           selected_model: str) -> List[str]:
        """Get alternative model names from the same and adjacent tiers."""
        alternatives: List[str] = []

        # Same tier alternatives
        for model in MODEL_REGISTRY.get(primary_tier, []):
            if model["name"] != selected_model:
                alternatives.append(model["name"])

        # Adjacent tier (one tier up or down)
        tier_order = [ModelTier.LOCAL, ModelTier.MID_TIER, ModelTier.PREMIUM, ModelTier.SPECIALIZED]
        try:
            idx = tier_order.index(primary_tier)
            adjacent_tiers = []
            if idx > 0:
                adjacent_tiers.append(tier_order[idx - 1])
            if idx < len(tier_order) - 1:
                adjacent_tiers.append(tier_order[idx + 1])

            for adj_tier in adjacent_tiers:
                for model in MODEL_REGISTRY.get(adj_tier, [])[:1]:  # Top 1 from adjacent
                    alternatives.append(model["name"])
        except ValueError:
            pass

        return alternatives[:4]

    # ──── Confidence ─────────────────────────────────────────────────

    @staticmethod
    def _compute_confidence(analysis: PromptAnalysis,
                             history: Dict[str, Any]) -> float:
        """Compute routing confidence (0-1)."""
        base_confidence = 0.7

        # Higher confidence for clear-cut complexity
        if analysis.complexity_score <= 2 or analysis.complexity_score >= 9:
            base_confidence += 0.15
        elif analysis.complexity_score >= 4 and analysis.complexity_score <= 6:
            base_confidence += 0.05

        # Historical data increases confidence
        if history.get("has_history"):
            base_confidence += 0.1

        if history.get("success_rate") is not None:
            base_confidence += 0.05

        return min(1.0, base_confidence)

    # ──── Reasoning ──────────────────────────────────────────────────

    @staticmethod
    def _build_reasoning(
        tier: ModelTier,
        analysis: PromptAnalysis,
        model_info: Dict[str, Any],
        history: Dict[str, Any],
    ) -> str:
        """Build a human-readable explanation for the recommendation."""
        parts = [
            f"Complexity {analysis.complexity_score}/10 "
            f"({analysis.category.value.replace('_', ' ')}) → {tier.value} tier."
        ]

        if tier == ModelTier.LOCAL:
            parts.append(
                f"{model_info['name']} is free and fast — ideal for this "
                f"low-complexity task."
            )
        elif tier == ModelTier.MID_TIER:
            parts.append(
                f"{model_info['name']} offers a great balance of quality and cost "
                f"for standard {analysis.category.value.replace('_', ' ')} tasks."
            )
        elif tier == ModelTier.PREMIUM:
            parts.append(
                f"{model_info['name']} is recommended for this complex task "
                f"requiring deep reasoning and high-quality output."
            )
        elif tier == ModelTier.SPECIALIZED:
            parts.append(
                f"{model_info['name']} is optimized for code-specific tasks "
                f"like completion and inline suggestions."
            )

        if history.get("has_history"):
            parts.append("Recommendation enhanced with historical performance data from Cognee.")

        return " ".join(parts)
