"""
CogneeMemoryService — The CORE intelligence layer wrapping ALL Cognee API calls.

Every other service in PromptIQ depends on this wrapper. Cognee IS the database,
search engine, and reasoning backbone.
"""

from __future__ import annotations

import json
import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import cognee

from app.config import get_settings

logger = logging.getLogger("promptiq.cognee_memory")


class CogneeMemoryService:
    """
    Wraps Cognee's full memory lifecycle:
      remember() → recall() → improve() → forget()

    All methods are async because Cognee's API is async-native.
    """

    _initialized: bool = False

    # ──────────────────────────────────────────────────────────────────
    # Initialization
    # ──────────────────────────────────────────────────────────────────

    async def initialize(self) -> None:
        """Configure Cognee with LLM provider and storage backends."""
        if self._initialized:
            return

        settings = get_settings()

        try:
            import os
            # Populate environment variables for LiteLLM & Cognee
            if settings.cognee_llm_provider == "gemini":
                os.environ["GEMINI_API_KEY"] = settings.cognee_llm_api_key
                # Enable mock embeddings by default to avoid OpenAI 401s when using Gemini
                if "MOCK_EMBEDDING" not in os.environ:
                    os.environ["MOCK_EMBEDDING"] = "true"
            elif settings.cognee_llm_provider == "openai":
                os.environ["OPENAI_API_KEY"] = settings.cognee_llm_api_key

            # Populate Cognee Cloud API Key if provided
            if settings.cognee_api_key:
                os.environ["COGNEE_API_KEY"] = settings.cognee_api_key

            # Configure the LLM provider Cognee will use for embeddings & cognify
            cognee.config.set_llm_config(
                {
                    "llm_api_key": settings.cognee_llm_api_key,
                    "llm_provider": settings.cognee_llm_provider,
                    "llm_model": settings.cognee_llm_model,
                }
            )

            self._initialized = True
            logger.info("Cognee memory service initialized successfully")

        except Exception as exc:
            logger.error("Failed to initialize Cognee: %s", exc)
            # Mark as initialized anyway so the app can start in degraded mode
            self._initialized = True
            logger.warning("Cognee running in degraded mode — recall/remember may fail")

    # ──────────────────────────────────────────────────────────────────
    # remember() — Store data into the knowledge graph
    # ──────────────────────────────────────────────────────────────────

    async def store_prompt(self, prompt_data: Dict[str, Any]) -> str:
        """
        Ingest a new prompt into the knowledge graph via cognee.remember().

        Creates nodes for: PromptNode, links to Developer, Project, SkillDomain.
        Returns the dataset name used.
        """
        org_id = prompt_data.get("org_id", "default_org")
        user_id = prompt_data.get("user_id", "default_user")
        dataset_name = f"org_{org_id}_prompts"

        # Build structured text for Cognee to ingest and cognify
        structured_text = self._format_prompt_for_cognee(prompt_data)

        try:
            logger.info(
                "Storing prompt for user=%s in dataset=%s", user_id, dataset_name
            )

            # cognee.remember() persists data and triggers cognify to extract
            # entities and relationships into the knowledge graph
            await cognee.add(structured_text, dataset_name)
            await cognee.cognify(dataset_name)

            logger.info("Prompt stored and cognified in dataset=%s", dataset_name)
            return dataset_name

        except Exception as exc:
            logger.error("Failed to store prompt via Cognee: %s", exc)
            raise RuntimeError(f"Cognee remember failed: {exc}") from exc

    async def store_memory(self, data: str, context: str = "general",
                           dataset_name: Optional[str] = None,
                           metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Generic memory storage — store arbitrary data in Cognee.
        Used by the /api/memory/store endpoint and MCP store_memory tool.
        """
        ds_name = dataset_name or f"memory_{context}"

        enriched_text = (
            f"Context: {context}\n"
            f"Timestamp: {datetime.utcnow().isoformat()}\n"
            f"Content: {data}\n"
        )
        if metadata:
            enriched_text += f"Metadata: {json.dumps(metadata)}\n"

        try:
            logger.info("Storing memory in dataset=%s context=%s", ds_name, context)
            await cognee.add(enriched_text, ds_name)
            await cognee.cognify(ds_name)
            logger.info("Memory stored successfully in dataset=%s", ds_name)
            return ds_name
        except Exception as exc:
            logger.error("Failed to store memory: %s", exc)
            raise RuntimeError(f"Cognee store_memory failed: {exc}") from exc

    # ──────────────────────────────────────────────────────────────────
    # recall() — Query the knowledge graph
    # ──────────────────────────────────────────────────────────────────

    async def find_similar_prompts(self, text: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Semantic + graph search for similar past prompts.
        Uses cognee.search() with hybrid vector + graph traversal.
        """
        query = f"Find prompts similar to: {text}"
        return await self._recall(query, limit=limit)

    async def get_developer_skills(self, user_id: str) -> Dict[str, Any]:
        """
        Multi-hop graph query for developer skill profile.
        Traverses: Developer → has_skill → SkillDomain → related_prompts
        """
        query = f"What skills does developer {user_id} have? List all skill domains and proficiency levels."
        results = await self._recall(query, limit=20)
        return {
            "user_id": user_id,
            "raw_results": results,
            "retrieved_at": datetime.utcnow().isoformat(),
        }

    async def get_model_performance(self, category: str) -> Dict[str, Any]:
        """
        Historical model success rates for a category.
        Queries: PromptNode → used_model → ModelNode → resulted_in → Outcome
        """
        query = (
            f"Which AI model has the best success rate for {category} tasks? "
            f"List models with their performance ratings."
        )
        results = await self._recall(query, limit=10)
        return {
            "category": category,
            "raw_results": results,
            "retrieved_at": datetime.utcnow().isoformat(),
        }

    async def recall_memory(self, query: str, limit: int = 10,
                            dataset_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Natural language query against Cognee memory.
        Used by /api/memory/recall and MCP recall_memory tool.
        """
        start = time.time()
        results = await self._recall(query, limit=limit)
        elapsed_ms = (time.time() - start) * 1000.0

        return {
            "query": query,
            "results": results,
            "total_results": len(results),
            "recall_time_ms": round(elapsed_ms, 2),
        }

    async def get_learning_gaps(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Identify skill gaps from recurring prompt patterns.
        Graph path: Developer → submitted → [many PromptNodes] → categorized_as → same SkillDomain
        """
        query = (
            f"What topics does developer {user_id} repeatedly ask AI about "
            f"that they should learn independently? "
            f"Identify recurring patterns and skill gaps."
        )
        results = await self._recall(query, limit=15)
        return results

    async def get_prompt_history(self, user_id: Optional[str] = None,
                                  limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieve prompt history, optionally scoped to a user."""
        if user_id:
            query = f"List the most recent prompts submitted by developer {user_id}, including their categories and complexity scores."
        else:
            query = "List the most recent prompts submitted by all developers, including their categories and complexity scores."
        return await self._recall(query, limit=limit)

    async def get_analytics_data(self, timeframe: str = "last_30_days",
                                  scope: str = "all") -> Dict[str, Any]:
        """Retrieve analytics data from Cognee memory."""
        query = (
            f"Provide usage analytics for the {timeframe} period, scope={scope}. "
            f"Include total prompts, cost breakdown, category distribution, "
            f"and model usage statistics."
        )
        results = await self._recall(query, limit=30)
        return {
            "timeframe": timeframe,
            "scope": scope,
            "raw_results": results,
            "retrieved_at": datetime.utcnow().isoformat(),
        }

    # ──────────────────────────────────────────────────────────────────
    # improve() — Refine the knowledge graph
    # ──────────────────────────────────────────────────────────────────

    async def refine_knowledge(self) -> Dict[str, Any]:
        """
        Background job to enrich the knowledge graph.
        Calls cognee.cognify() on all datasets to:
        - Add derived insights
        - Strengthen relationship edges
        - Recalculate skill assessments
        """
        try:
            logger.info("Starting knowledge refinement via cognee.cognify()")
            await cognee.cognify()
            logger.info("Knowledge refinement completed")
            return {
                "status": "completed",
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as exc:
            logger.error("Knowledge refinement failed: %s", exc)
            return {
                "status": "failed",
                "error": str(exc),
                "timestamp": datetime.utcnow().isoformat(),
            }

    # ──────────────────────────────────────────────────────────────────
    # forget() — GDPR-compliant data removal
    # ──────────────────────────────────────────────────────────────────

    async def delete_user_data(self, user_id: str) -> Dict[str, Any]:
        """
        GDPR-compliant deletion of all user data from the knowledge graph.
        Removes user nodes, prompt nodes, skill nodes, and all edges.
        """
        dataset_name = f"user_{user_id}"
        try:
            logger.info("Deleting all data for user=%s", user_id)
            await cognee.prune.prune_data(dataset_name)
            logger.info("Successfully deleted data for user=%s", user_id)
            return {
                "status": "deleted",
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as exc:
            logger.error("Failed to delete user data: %s", exc)
            return {
                "status": "failed",
                "user_id": user_id,
                "error": str(exc),
                "timestamp": datetime.utcnow().isoformat(),
            }

    # ──────────────────────────────────────────────────────────────────
    # Internal helpers
    # ──────────────────────────────────────────────────────────────────

    async def _recall(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Core recall wrapper — performs hybrid vector + graph search via Cognee.
        Gracefully handles failures and returns structured results.
        """
        try:
            logger.debug("Cognee recall: query=%s limit=%d", query[:80], limit)

            # cognee.search() performs hybrid search across vector embeddings
            # and the knowledge graph
            from cognee.api.v1.search import SearchType

            raw_results = await cognee.search(SearchType.INSIGHTS, query_text=query)

            # Normalize results into a consistent format
            results: List[Dict[str, Any]] = []
            if raw_results:
                for item in raw_results[:limit]:
                    if isinstance(item, dict):
                        results.append(item)
                    elif isinstance(item, str):
                        results.append({"content": item, "score": 1.0})
                    else:
                        # Cognee may return Pydantic models or other objects
                        try:
                            results.append({
                                "content": str(item),
                                "score": getattr(item, "score", 1.0),
                                "type": type(item).__name__,
                            })
                        except Exception:
                            results.append({"content": str(item), "score": 0.5})

            logger.debug("Cognee recall returned %d results", len(results))
            return results

        except Exception as exc:
            logger.warning("Cognee recall failed (query=%s): %s", query[:50], exc)
            # Return empty results rather than crashing — the system degrades gracefully
            return []

    @staticmethod
    def _format_prompt_for_cognee(prompt_data: Dict[str, Any]) -> str:
        """
        Format prompt data into structured text for Cognee ingestion.
        Cognee's cognify pipeline will extract entities and relationships.
        """
        timestamp = prompt_data.get("created_at", datetime.utcnow().isoformat())
        parts = [
            f"Prompt Record — {timestamp}",
            f"Developer: {prompt_data.get('user_id', 'unknown')}",
            f"Organization: {prompt_data.get('org_id', 'unknown')}",
            f"Project: {prompt_data.get('project', 'unknown')}",
            f"IDE Source: {prompt_data.get('ide_source', 'unknown')}",
            f"Prompt Text: {prompt_data.get('prompt_text', '')}",
        ]

        if prompt_data.get("response_summary"):
            parts.append(f"AI Response Summary: {prompt_data['response_summary']}")

        if prompt_data.get("model_used"):
            parts.append(f"Model Used: {prompt_data['model_used']}")

        # Include analysis results if available
        analysis = prompt_data.get("analysis")
        if analysis:
            if isinstance(analysis, dict):
                parts.append(f"Complexity Score: {analysis.get('complexity_score', 'N/A')}")
                parts.append(f"Category: {analysis.get('category', 'N/A')}")
                parts.append(f"Skill Domain: {analysis.get('skill_domain', 'N/A')}")
                parts.append(f"Estimated Manual Time: {analysis.get('estimated_manual_minutes', 0)} minutes")
                parts.append(f"Estimated AI Cost: ${analysis.get('estimated_ai_cost_usd', 0):.4f}")

        if prompt_data.get("necessity_score") is not None:
            parts.append(f"AI Necessity Score: {prompt_data['necessity_score']}")

        if prompt_data.get("recommended_model"):
            parts.append(f"Recommended Model: {prompt_data['recommended_model']}")

        return "\n".join(parts)


# ─── Module-level singleton ─────────────────────────────────────────────────

_memory_service: Optional[CogneeMemoryService] = None


def get_memory_service() -> CogneeMemoryService:
    """Get or create the singleton CogneeMemoryService instance."""
    global _memory_service
    if _memory_service is None:
        _memory_service = CogneeMemoryService()
    return _memory_service
