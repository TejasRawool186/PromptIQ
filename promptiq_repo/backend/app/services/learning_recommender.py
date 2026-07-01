"""
LearningRecommender — Recommends learning resources based on skill gaps.

Identifies recurring prompt patterns per skill domain and suggests
courses, articles, and documentation when patterns indicate gaps.
All pattern analysis is powered by Cognee recall.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List

from app.models.schemas import (
    LearningRecommendation,
    LearningRecommendations,
    SkillDomain,
)
from app.services.cognee_memory import CogneeMemoryService

logger = logging.getLogger("promptiq.learning_recommender")

# ─── Learning resource database ─────────────────────────────────────────────

LEARNING_RESOURCES: Dict[SkillDomain, List[Dict[str, Any]]] = {
    SkillDomain.FRONTEND: [
        {
            "topic": "React Fundamentals & Hooks",
            "resource_type": "course",
            "url": "https://react.dev/learn",
            "triggers": ["react", "hooks", "useState", "useEffect", "component"],
        },
        {
            "topic": "CSS Layout & Flexbox/Grid",
            "resource_type": "tutorial",
            "url": "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
            "triggers": ["css", "layout", "flexbox", "grid", "responsive"],
        },
        {
            "topic": "TypeScript for React Developers",
            "resource_type": "docs",
            "url": "https://www.typescriptlang.org/docs/handbook/react.html",
            "triggers": ["typescript", "tsx", "type", "interface", "generic"],
        },
        {
            "topic": "Next.js App Router & Server Components",
            "resource_type": "course",
            "url": "https://nextjs.org/learn",
            "triggers": ["next.js", "server component", "app router", "ssr"],
        },
        {
            "topic": "State Management Patterns",
            "resource_type": "article",
            "url": "https://redux.js.org/tutorials/fundamentals/part-1-overview",
            "triggers": ["state management", "redux", "zustand", "context"],
        },
    ],
    SkillDomain.BACKEND: [
        {
            "topic": "FastAPI Deep Dive",
            "resource_type": "docs",
            "url": "https://fastapi.tiangolo.com/tutorial/",
            "triggers": ["fastapi", "endpoint", "route", "api", "async"],
        },
        {
            "topic": "RESTful API Design Best Practices",
            "resource_type": "article",
            "url": "https://restfulapi.net/",
            "triggers": ["rest", "api design", "endpoint", "http method"],
        },
        {
            "topic": "Authentication & Authorization Patterns",
            "resource_type": "course",
            "url": "https://auth0.com/docs/get-started",
            "triggers": ["auth", "jwt", "oauth", "session", "token"],
        },
        {
            "topic": "Python Async/Await Patterns",
            "resource_type": "tutorial",
            "url": "https://docs.python.org/3/library/asyncio.html",
            "triggers": ["async", "await", "asyncio", "concurrent"],
        },
        {
            "topic": "Microservices Architecture",
            "resource_type": "course",
            "url": "https://microservices.io/",
            "triggers": ["microservice", "service mesh", "api gateway"],
        },
    ],
    SkillDomain.DATABASE: [
        {
            "topic": "SQL Fundamentals & Advanced Queries",
            "resource_type": "course",
            "url": "https://www.postgresql.org/docs/current/tutorial.html",
            "triggers": ["sql", "query", "join", "index", "subquery"],
        },
        {
            "topic": "Database Design & Normalization",
            "resource_type": "article",
            "url": "https://www.guru99.com/database-normalization.html",
            "triggers": ["schema", "normalization", "erd", "data model"],
        },
        {
            "topic": "ORM Best Practices (SQLAlchemy/Prisma)",
            "resource_type": "docs",
            "url": "https://docs.sqlalchemy.org/en/20/tutorial/",
            "triggers": ["orm", "sqlalchemy", "prisma", "migration"],
        },
        {
            "topic": "Redis & Caching Strategies",
            "resource_type": "tutorial",
            "url": "https://redis.io/docs/getting-started/",
            "triggers": ["redis", "cache", "caching", "session store"],
        },
    ],
    SkillDomain.DEVOPS: [
        {
            "topic": "Docker & Container Fundamentals",
            "resource_type": "course",
            "url": "https://docs.docker.com/get-started/",
            "triggers": ["docker", "container", "dockerfile", "compose"],
        },
        {
            "topic": "CI/CD Pipeline Design",
            "resource_type": "tutorial",
            "url": "https://docs.github.com/en/actions",
            "triggers": ["ci/cd", "pipeline", "github actions", "deploy"],
        },
        {
            "topic": "Kubernetes Essentials",
            "resource_type": "course",
            "url": "https://kubernetes.io/docs/tutorials/",
            "triggers": ["kubernetes", "k8s", "pod", "helm", "cluster"],
        },
        {
            "topic": "Infrastructure as Code with Terraform",
            "resource_type": "docs",
            "url": "https://developer.hashicorp.com/terraform/tutorials",
            "triggers": ["terraform", "infrastructure", "iac", "cloud"],
        },
    ],
    SkillDomain.TESTING: [
        {
            "topic": "Testing Strategies & TDD",
            "resource_type": "article",
            "url": "https://martinfowler.com/articles/practical-test-pyramid.html",
            "triggers": ["test", "tdd", "unit test", "testing strategy"],
        },
        {
            "topic": "Pytest Complete Guide",
            "resource_type": "docs",
            "url": "https://docs.pytest.org/en/stable/getting-started.html",
            "triggers": ["pytest", "fixture", "mock", "parametrize"],
        },
        {
            "topic": "E2E Testing with Playwright",
            "resource_type": "course",
            "url": "https://playwright.dev/docs/intro",
            "triggers": ["e2e", "playwright", "cypress", "integration test"],
        },
    ],
    SkillDomain.SECURITY: [
        {
            "topic": "OWASP Top 10 Security Risks",
            "resource_type": "article",
            "url": "https://owasp.org/www-project-top-ten/",
            "triggers": ["security", "owasp", "vulnerability", "xss", "csrf"],
        },
        {
            "topic": "Web Application Security Fundamentals",
            "resource_type": "course",
            "url": "https://portswigger.net/web-security",
            "triggers": ["injection", "sanitize", "encrypt", "cors"],
        },
        {
            "topic": "Cryptography & Hashing Best Practices",
            "resource_type": "tutorial",
            "url": "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html",
            "triggers": ["hash", "salt", "encrypt", "decrypt", "bcrypt"],
        },
    ],
    SkillDomain.ML_AI: [
        {
            "topic": "Machine Learning Fundamentals",
            "resource_type": "course",
            "url": "https://www.coursera.org/learn/machine-learning",
            "triggers": ["machine learning", "model", "training", "classification"],
        },
        {
            "topic": "LLM & Prompt Engineering",
            "resource_type": "article",
            "url": "https://platform.openai.com/docs/guides/prompt-engineering",
            "triggers": ["llm", "prompt", "gpt", "transformer", "fine-tune"],
        },
        {
            "topic": "PyTorch Deep Learning",
            "resource_type": "course",
            "url": "https://pytorch.org/tutorials/",
            "triggers": ["pytorch", "deep learning", "neural network", "tensor"],
        },
        {
            "topic": "RAG Architecture & Vector Databases",
            "resource_type": "tutorial",
            "url": "https://python.langchain.com/docs/tutorials/rag/",
            "triggers": ["rag", "vector", "embedding", "langchain", "retrieval"],
        },
    ],
}


class LearningRecommender:
    """Generates personalized learning recommendations from Cognee-backed pattern analysis."""

    def __init__(self, memory_service: CogneeMemoryService) -> None:
        self.memory = memory_service

    async def get_recommendations(self, user_id: str) -> LearningRecommendations:
        """
        Generate learning recommendations for a developer.

        Process:
        1. Query Cognee for recurring prompt patterns
        2. Identify skill gaps (domains with high AI dependency)
        3. Match gaps to learning resources
        4. Prioritize by frequency and impact
        """
        # Step 1: Get learning gaps from Cognee
        gaps = await self._identify_gaps(user_id)

        # Step 2: Get recurring patterns
        patterns = await self._get_recurring_patterns(user_id)

        # Step 3: Generate recommendations
        recommendations = self._match_resources(gaps, patterns)

        # Step 4: Prioritize
        recommendations.sort(key=lambda r: {"high": 0, "medium": 1, "low": 2}.get(r.priority, 1))

        return LearningRecommendations(
            user_id=user_id,
            recommendations=recommendations,
            skill_gaps=[
                {"domain": g["domain"], "frequency": g["frequency"], "severity": g["severity"]}
                for g in gaps
            ],
            generated_at=datetime.utcnow(),
        )

    async def get_suggestions_for_prompt(
        self, analysis_domain: SkillDomain, analysis_keywords: List[str]
    ) -> List[str]:
        """
        Get quick learning suggestions based on a single prompt's analysis.
        Returns a list of suggestion strings for inline display.
        """
        suggestions: List[str] = []
        resources = LEARNING_RESOURCES.get(analysis_domain, [])

        for resource in resources:
            # Check if any trigger keywords match
            matching = [
                t for t in resource["triggers"]
                if any(kw for kw in analysis_keywords if t in kw or kw in t)
            ]
            if matching:
                suggestions.append(
                    f"📚 {resource['topic']} ({resource['resource_type']}) — {resource['url']}"
                )

        # Limit to top 3 most relevant
        return suggestions[:3]

    # ──── Gap identification ─────────────────────────────────────────

    async def _identify_gaps(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Identify skill gaps using Cognee's pattern analysis.
        Looks for: Developer → submitted → [many PromptNodes] → same SkillDomain
        """
        gaps: List[Dict[str, Any]] = []

        try:
            raw_gaps = await self.memory.get_learning_gaps(user_id)

            # Parse Cognee results into structured gap data
            domain_frequency: Dict[str, int] = {}
            for item in raw_gaps:
                content = str(item.get("content", item) if isinstance(item, dict) else item).lower()
                for domain in SkillDomain:
                    if domain.value in content:
                        domain_frequency[domain.value] = domain_frequency.get(domain.value, 0) + 1

            for domain_str, freq in domain_frequency.items():
                severity = "high" if freq >= 5 else "medium" if freq >= 2 else "low"
                gaps.append({
                    "domain": domain_str,
                    "frequency": freq,
                    "severity": severity,
                })

        except Exception as exc:
            logger.warning("Failed to identify gaps from Cognee: %s", exc)

        # If no gaps found from Cognee, add default suggestions for all domains
        if not gaps:
            for domain in SkillDomain:
                gaps.append({
                    "domain": domain.value,
                    "frequency": 0,
                    "severity": "low",
                })

        return gaps

    async def _get_recurring_patterns(self, user_id: str) -> List[Dict[str, Any]]:
        """Get recurring prompt patterns for a developer from Cognee."""
        try:
            query = (
                f"What are the most common topics and patterns in prompts "
                f"submitted by developer {user_id}? Group by skill domain."
            )
            results = await self.memory.recall_memory(query, limit=20)
            return results.get("results", [])
        except Exception as exc:
            logger.warning("Failed to get recurring patterns: %s", exc)
            return []

    # ──── Resource matching ──────────────────────────────────────────

    def _match_resources(
        self,
        gaps: List[Dict[str, Any]],
        patterns: List[Dict[str, Any]],
    ) -> List[LearningRecommendation]:
        """Match identified gaps to learning resources."""
        recommendations: List[LearningRecommendation] = []
        seen_topics: set = set()

        for gap in gaps:
            domain_str = gap["domain"]
            severity = gap["severity"]

            # Find matching SkillDomain
            try:
                domain = SkillDomain(domain_str)
            except ValueError:
                continue

            resources = LEARNING_RESOURCES.get(domain, [])

            # Add resources based on severity
            max_resources = 3 if severity == "high" else 2 if severity == "medium" else 1

            for resource in resources[:max_resources]:
                if resource["topic"] in seen_topics:
                    continue
                seen_topics.add(resource["topic"])

                # Check pattern alignment for priority boost
                priority = severity
                pattern_content = " ".join(
                    str(p.get("content", p) if isinstance(p, dict) else p)
                    for p in patterns
                ).lower()

                if any(t in pattern_content for t in resource["triggers"]):
                    # Pattern confirms the gap — boost priority
                    priority = "high" if severity != "low" else "medium"

                reason = self._generate_reason(domain, gap, resource)

                recommendations.append(LearningRecommendation(
                    domain=domain,
                    topic=resource["topic"],
                    reason=reason,
                    resource_type=resource["resource_type"],
                    url=resource["url"],
                    priority=priority,
                ))

        return recommendations

    @staticmethod
    def _generate_reason(
        domain: SkillDomain,
        gap: Dict[str, Any],
        resource: Dict[str, Any],
    ) -> str:
        """Generate a human-readable reason for the recommendation."""
        domain_name = domain.value.replace("_", " ").title()
        frequency = gap.get("frequency", 0)

        if frequency >= 5:
            return (
                f"You've asked AI about {domain_name} topics frequently ({frequency}+ times). "
                f"Learning {resource['topic']} will help you handle these tasks independently "
                f"and reduce your AI dependency."
            )
        elif frequency >= 2:
            return (
                f"You've had several AI interactions related to {domain_name}. "
                f"Strengthening your knowledge of {resource['topic']} will boost "
                f"your confidence and speed."
            )
        else:
            return (
                f"Proactive recommendation: {resource['topic']} is a valuable skill "
                f"in {domain_name} that can make you more effective."
            )
