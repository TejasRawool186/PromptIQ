"""
PromptAnalyzer — Classifies complexity, category, skill domain, cost, and time.

All analysis is rule-based (no external LLM calls) for speed.
Results are stored back into Cognee via CogneeMemoryService.
"""

from __future__ import annotations

import logging
import math
import re
from typing import Dict, List, Tuple

from app.models.schemas import (
    PromptAnalysis,
    PromptCategory,
    PromptData,
    SkillDomain,
)

logger = logging.getLogger("promptiq.prompt_analyzer")

# ─── Keyword dictionaries for classification ────────────────────────────────

CATEGORY_KEYWORDS: Dict[PromptCategory, List[str]] = {
    PromptCategory.CODE_GENERATION: [
        "write", "create", "generate", "implement", "build", "make",
        "function", "class", "component", "module", "endpoint", "api",
        "scaffold", "setup", "initialize", "new file", "add feature",
    ],
    PromptCategory.DEBUGGING: [
        "fix", "debug", "error", "bug", "issue", "broken", "crash",
        "traceback", "exception", "not working", "fails", "wrong output",
        "undefined", "null", "segfault", "stack trace", "why does",
    ],
    PromptCategory.REFACTORING: [
        "refactor", "restructure", "clean up", "simplify", "optimize",
        "improve", "reorganize", "extract", "rename", "move", "split",
        "merge", "decouple", "reduce complexity", "dry",
    ],
    PromptCategory.DOCUMENTATION: [
        "document", "docstring", "comment", "readme", "explain",
        "describe", "annotation", "jsdoc", "typedoc", "changelog",
        "api docs", "swagger", "openapi", "specification",
    ],
    PromptCategory.ARCHITECTURE: [
        "architecture", "design pattern", "system design", "microservice",
        "monolith", "scalab", "database schema", "erd", "data model",
        "infrastructure", "deployment", "ci/cd", "pipeline", "trade-off",
    ],
    PromptCategory.LEARNING: [
        "how does", "what is", "explain", "difference between",
        "when to use", "best practice", "tutorial", "learn", "concept",
        "understand", "why", "compare", "pros and cons", "recommend",
    ],
    PromptCategory.BOILERPLATE: [
        "boilerplate", "template", "starter", "scaffold", "config",
        "configuration", "setup", "init", ".gitignore", "dockerfile",
        "docker-compose", "package.json", "tsconfig", "eslint", "prettier",
    ],
}

SKILL_DOMAIN_KEYWORDS: Dict[SkillDomain, List[str]] = {
    SkillDomain.FRONTEND: [
        "react", "vue", "angular", "svelte", "next.js", "nuxt", "html",
        "css", "tailwind", "sass", "scss", "webpack", "vite", "dom",
        "component", "jsx", "tsx", "responsive", "animation", "ui", "ux",
        "redux", "zustand", "state management", "browser",
    ],
    SkillDomain.BACKEND: [
        "fastapi", "flask", "django", "express", "nest.js", "spring",
        "api", "rest", "graphql", "grpc", "server", "middleware",
        "authentication", "authorization", "jwt", "oauth", "session",
        "endpoint", "route", "controller", "service", "node.js", "python",
    ],
    SkillDomain.DATABASE: [
        "sql", "postgres", "mysql", "sqlite", "mongodb", "redis",
        "database", "query", "migration", "schema", "orm", "prisma",
        "sqlalchemy", "sequelize", "index", "join", "transaction",
        "nosql", "dynamodb", "cassandra", "elasticsearch",
    ],
    SkillDomain.DEVOPS: [
        "docker", "kubernetes", "k8s", "terraform", "ansible", "ci/cd",
        "github actions", "jenkins", "gitlab", "deploy", "nginx",
        "load balancer", "cloud", "aws", "gcp", "azure", "helm",
        "monitoring", "prometheus", "grafana", "linux", "bash", "shell",
    ],
    SkillDomain.TESTING: [
        "test", "jest", "pytest", "mocha", "cypress", "playwright",
        "unit test", "integration test", "e2e", "mock", "stub", "spy",
        "coverage", "tdd", "bdd", "assertion", "fixture", "snapshot",
    ],
    SkillDomain.SECURITY: [
        "security", "vulnerability", "xss", "csrf", "sql injection",
        "sanitize", "escape", "encrypt", "decrypt", "hash", "salt",
        "cors", "helmet", "rate limit", "firewall", "audit", "penetration",
        "owasp", "certificate", "ssl", "tls",
    ],
    SkillDomain.ML_AI: [
        "machine learning", "deep learning", "neural network", "pytorch",
        "tensorflow", "model", "training", "inference", "dataset",
        "classification", "regression", "nlp", "transformer", "bert",
        "gpt", "embedding", "vector", "llm", "fine-tune", "rag",
        "langchain", "ai", "prompt engineering",
    ],
}

# ─── Token-based pricing (USD per 1K tokens) ────────────────────────────────

MODEL_PRICING: Dict[str, Dict[str, float]] = {
    # --- Anthropic ---
    "claude-opus": {"input": 0.005, "output": 0.025},       # Claude Opus 4.8 ($5.00/$25.00 per 1M)
    "claude-sonnet": {"input": 0.003, "output": 0.015},     # Claude Sonnet 4.6 ($3.00/$15.00 per 1M)
    "claude-haiku": {"input": 0.001, "output": 0.005},       # Claude Haiku 4.5 ($1.00/$5.00 per 1M)
    
    # --- OpenAI ---
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},    # GPT-4o mini ($0.15/$0.60 per 1M)
    "gpt-4.1-mini": {"input": 0.0004, "output": 0.0016},    # GPT-4.1 mini ($0.40/$1.60 per 1M)
    "gpt-5.2": {"input": 0.00175, "output": 0.014},        # GPT-5.2 ($1.75/$14.00 per 1M)
    "gpt-5.4-pro": {"input": 0.03, "output": 0.18},         # GPT-5.4 Pro ($30.00/$180.00 per 1M)
    "gpt-5.5-pro": {"input": 0.03, "output": 0.18},         # GPT-5.5 Pro ($30.00/$180.00 per 1M)
    "o3-pro": {"input": 0.02, "output": 0.08},              # o3-pro ($20.00/$80.00 per 1M)
    
    # --- Google ---
    "gemini-flash": {"input": 0.0015, "output": 0.009},     # Gemini 3.5 Flash ($1.50/$9.00 per 1M)
    "gemini-pro": {"input": 0.0025, "output": 0.015},       # Gemini 2.5 Pro ($2.50/$15.00 per 1M)
    
    # --- DeepSeek ---
    "deepseek-v4-pro": {"input": 0.000435, "output": 0.00087}, # DeepSeek V4 Pro ($0.435/$0.87 per 1M)
    
    # --- Groq / OSS ---
    "openai-gpt-oss-120b": {"input": 0.00015, "output": 0.0006}, # OpenAI GPT OSS 120b ($0.15/$0.60 per 1M)
    
    # --- Legacy/Fallback ---
    "gpt-4o": {"input": 0.005, "output": 0.015},
    "codex": {"input": 0.01, "output": 0.03},
    "copilot": {"input": 0.0, "output": 0.0},
    "ollama": {"input": 0.0, "output": 0.0},
    "default": {"input": 0.001, "output": 0.002},
}

# Complexity keywords that raise the score
COMPLEXITY_MARKERS: List[str] = [
    "concurren", "parallel", "async", "distributed", "microservice",
    "optimization", "algorithm", "data structure", "design pattern",
    "security", "authentication", "encryption", "scalab",
    "real-time", "websocket", "streaming", "migration",
    "multi-tenant", "caching", "performance", "deadlock",
    "race condition", "memory leak", "garbage collection",
]


class PromptAnalyzer:
    """Analyzes prompts for complexity, category, skill domain, cost, and time."""

    def analyze(self, prompt: PromptData) -> PromptAnalysis:
        """Run the full analysis pipeline on a prompt."""
        text = prompt.prompt_text.lower()
        token_count = self._estimate_tokens(prompt.prompt_text)

        complexity = self._compute_complexity(text, token_count)
        category = self._classify_category(text)
        primary_domain, secondary_domains = self._detect_skill_domains(text)
        manual_minutes = self._estimate_manual_time(complexity, category, token_count)
        ai_cost = self._estimate_ai_cost(
            prompt.model_used or "default",
            prompt.token_count_input or token_count,
            prompt.token_count_output or int(token_count * 1.5),
        )
        keywords = self._extract_keywords(text)

        return PromptAnalysis(
            complexity_score=round(complexity, 1),
            category=category,
            skill_domain=primary_domain,
            secondary_domains=secondary_domains,
            estimated_manual_minutes=round(manual_minutes, 1),
            estimated_ai_cost_usd=round(ai_cost, 6),
            token_count=token_count,
            keywords=keywords,
        )

    # ──── Complexity scoring (1-10) ──────────────────────────────────

    def _compute_complexity(self, text: str, token_count: int) -> float:
        """
        Complexity score based on:
        - Token count (length proxy)
        - Concept density (complexity markers)
        - Multi-step indicators
        - Code structure presence
        """
        # Base score from token length (log scale)
        if token_count <= 10:
            length_score = 1.0
        elif token_count <= 50:
            length_score = 2.0
        elif token_count <= 150:
            length_score = 3.5
        elif token_count <= 400:
            length_score = 5.0
        else:
            length_score = min(7.0, 5.0 + math.log2(token_count / 400))

        # Complexity markers
        marker_hits = sum(1 for m in COMPLEXITY_MARKERS if m in text)
        marker_score = min(3.0, marker_hits * 0.5)

        # Multi-step reasoning indicators
        step_patterns = [
            r"\b(first|then|next|after|finally|step \d)\b",
            r"\b(and also|additionally|furthermore|moreover)\b",
            r"\b(compare|contrast|trade-?off|versus|vs\.?)\b",
        ]
        step_hits = sum(1 for p in step_patterns if re.search(p, text))
        step_score = min(2.0, step_hits * 0.7)

        # Code presence (increases complexity)
        code_patterns = [r"```", r"def\s+\w+", r"function\s+\w+", r"class\s+\w+", r"import\s+"]
        code_hits = sum(1 for p in code_patterns if re.search(p, text))
        code_score = min(1.5, code_hits * 0.4)

        total = length_score + marker_score + step_score + code_score
        return max(1.0, min(10.0, total))

    # ──── Category classification ────────────────────────────────────

    def _classify_category(self, text: str) -> PromptCategory:
        """Classify prompt into a category by keyword matching with scoring."""
        scores: Dict[PromptCategory, float] = {}

        for category, keywords in CATEGORY_KEYWORDS.items():
            score = sum(1.0 for kw in keywords if kw in text)
            # Boost exact matches at word boundaries
            for kw in keywords:
                if re.search(rf"\b{re.escape(kw)}\b", text):
                    score += 0.5
            scores[category] = score

        if not scores or max(scores.values()) == 0:
            return PromptCategory.CODE_GENERATION  # sensible default

        return max(scores, key=scores.get)  # type: ignore[arg-type]

    # ──── Skill domain detection ─────────────────────────────────────

    def _detect_skill_domains(self, text: str) -> Tuple[SkillDomain, List[SkillDomain]]:
        """Detect primary and secondary skill domains."""
        scores: Dict[SkillDomain, float] = {}

        for domain, keywords in SKILL_DOMAIN_KEYWORDS.items():
            score = sum(1.0 for kw in keywords if kw in text)
            for kw in keywords:
                if re.search(rf"\b{re.escape(kw)}\b", text):
                    score += 0.5
            scores[domain] = score

        sorted_domains = sorted(scores.items(), key=lambda x: x[1], reverse=True)

        primary = sorted_domains[0][0] if sorted_domains[0][1] > 0 else SkillDomain.BACKEND
        secondary = [
            d for d, s in sorted_domains[1:4] if s > 0 and s >= sorted_domains[0][1] * 0.3
        ]

        return primary, secondary

    # ──── Time estimation ────────────────────────────────────────────

    def _estimate_manual_time(self, complexity: float, category: PromptCategory,
                               token_count: int) -> float:
        """Estimate how many minutes this task would take manually."""
        # Base time by category
        base_minutes: Dict[PromptCategory, float] = {
            PromptCategory.BOILERPLATE: 5.0,
            PromptCategory.DOCUMENTATION: 10.0,
            PromptCategory.CODE_GENERATION: 20.0,
            PromptCategory.DEBUGGING: 30.0,
            PromptCategory.REFACTORING: 25.0,
            PromptCategory.LEARNING: 15.0,
            PromptCategory.ARCHITECTURE: 45.0,
        }
        base = base_minutes.get(category, 15.0)

        # Scale by complexity (exponential growth for hard tasks)
        complexity_factor = 1.0 + (complexity - 1.0) * 0.4
        if complexity > 7:
            complexity_factor *= 1.5

        # Token length adds some time
        length_bonus = min(20.0, token_count * 0.02)

        return base * complexity_factor + length_bonus

    # ──── Cost estimation ────────────────────────────────────────────

    def _estimate_ai_cost(self, model: str, input_tokens: int,
                           output_tokens: int) -> float:
        """Estimate AI cost in USD based on model pricing."""
        model_key = model.lower().replace(" ", "-")
        pricing = MODEL_PRICING.get(model_key, MODEL_PRICING["default"])

        input_cost = (input_tokens / 1000.0) * pricing["input"]
        output_cost = (output_tokens / 1000.0) * pricing["output"]

        return input_cost + output_cost

    # ──── Token estimation ───────────────────────────────────────────

    @staticmethod
    def _estimate_tokens(text: str) -> int:
        """Rough token count: ~4 chars per token for English."""
        return max(1, len(text) // 4)

    # ──── Keyword extraction ─────────────────────────────────────────

    @staticmethod
    def _extract_keywords(text: str) -> List[str]:
        """Extract notable keywords from the prompt text."""
        # Combine all keyword lists
        all_keywords = set()
        for keywords in CATEGORY_KEYWORDS.values():
            all_keywords.update(keywords)
        for keywords in SKILL_DOMAIN_KEYWORDS.values():
            all_keywords.update(keywords)

        found = [kw for kw in all_keywords if kw in text]
        # Sort by length descending to prefer more specific terms
        found.sort(key=len, reverse=True)
        return found[:15]


# ─── Module-level singleton ─────────────────────────────────────────────────

_analyzer: PromptAnalyzer | None = None


def get_prompt_analyzer() -> PromptAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = PromptAnalyzer()
    return _analyzer
