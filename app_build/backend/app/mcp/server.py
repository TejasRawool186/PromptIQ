"""
PromptIQ MCP Server — Exposes PromptIQ governance tools to IDEs.
Uses FastMCP to implement Model Context Protocol tools.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional

from mcp.server.fastmcp import FastMCP

from app.services.cognee_memory import get_memory_service
from app.services.prompt_analyzer import get_prompt_analyzer
from app.services.necessity_scorer import NecessityScorer
from app.services.model_router import ModelRouter
from app.services.skill_tracker import SkillTracker
from app.services.learning_recommender import LearningRecommender
from app.models.schemas import AnalyzePromptRequest, PromptData

logger = logging.getLogger("promptiq.mcp")

# Initialize FastMCP app
mcp = FastMCP("PromptIQ")

# Cache services
_initialized = False

async def get_initialized_services() -> Dict[str, Any]:
    """Helper to lazily initialize Cognee and cache service instances."""
    global _initialized
    memory = get_memory_service()
    if not _initialized:
        await memory.initialize()
        _initialized = True
        
    analyzer = get_prompt_analyzer()
    scorer = NecessityScorer(memory)
    router = ModelRouter(memory)
    tracker = SkillTracker(memory)
    recommender = LearningRecommender(memory)
    
    return {
        "memory": memory,
        "analyzer": analyzer,
        "scorer": scorer,
        "router": router,
        "tracker": tracker,
        "recommender": recommender
    }


# ─── MCP Tools ──────────────────────────────────────────────────────────────

@mcp.tool()
async def analyze_prompt(
    prompt_text: str,
    user_id: str = "default_user",
    project: str = "unknown",
    model_used: str = "unknown",
    ide_source: str = "mcp_client"
) -> str:
    """
    Run the full PromptIQ analysis pipeline on a developer prompt.
    Returns: category, complexity, necessity score, model recommendation, and learning recommendations.
    """
    try:
        srv = await get_initialized_services()
        
        # 1. Analyze prompt
        prompt_data = PromptData(
            prompt_text=prompt_text,
            user_id=user_id,
            project=project,
            model_used=model_used,
            ide_source=ide_source
        )
        
        # Analyze using prompt analyzer
        analysis = srv["analyzer"].analyze(prompt_data)
        
        # 2. Store prompt in Cognee memory
        prompt_dict = prompt_data.model_dump()
        prompt_dict["analysis"] = analysis.model_dump()
        prompt_dict["created_at"] = datetime.utcnow().isoformat()
        
        await srv["memory"].store_prompt(prompt_dict)
        
        # 3. Compute Necessity Score
        necessity = await srv["scorer"].score(analysis, user_id, prompt_text)
        
        # 4. Route to optimal model
        routing = await srv["router"].recommend(analysis, prompt_text)
        
        # 5. Update developer skills
        await srv["tracker"].update_skills(user_id, analysis, necessity.score)
        
        # 6. Retrieve learning recommendations
        learn_recs = await srv["recommender"].get_recommendations(user_id)
        
        # Format response
        result = {
            "prompt_text": prompt_text,
            "category": analysis.category.value,
            "skill_domain": analysis.skill_domain.value,
            "complexity_score": analysis.complexity_score,
            "estimated_manual_time_minutes": analysis.estimated_manual_time_minutes,
            "necessity_score": necessity.score,
            "necessity_label": necessity.recommendation,
            "recommended_model": routing.model_name,
            "estimated_cost_usd": routing.estimated_cost_usd,
            "learning_recommendations": [r.title for r in learn_recs.recommendations[:2]]
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        logger.error("Error in analyze_prompt tool: %s", e)
        return json.dumps({"error": str(e), "status": "failed"})


@mcp.tool()
async def store_memory(
    data: str,
    context: str = "general",
    user_id: str = "default_user"
) -> str:
    """
    Store custom data or facts into Cognee knowledge graph memory.
    """
    try:
        srv = await get_initialized_services()
        dataset = f"user_{user_id}_memory"
        node_id = await srv["memory"].store_memory(data, context, dataset_name=dataset)
        return json.dumps({
            "status": "success",
            "message": "Data stored in Cognee graph",
            "node_id": node_id,
            "dataset": dataset
        }, indent=2)
    except Exception as e:
        logger.error("Error in store_memory tool: %s", e)
        return json.dumps({"error": str(e), "status": "failed"})


@mcp.tool()
async def recall_memory(
    query: str,
    user_id: str = "default_user"
) -> str:
    """
    Query Cognee knowledge graph memory. Matches vector embeddings and returns graph relations.
    """
    try:
        srv = await get_initialized_services()
        results = await srv["memory"].recall_memory(query)
        return json.dumps({
            "query": query,
            "results": results
        }, indent=2)
    except Exception as e:
        logger.error("Error in recall_memory tool: %s", e)
        return json.dumps({"error": str(e), "status": "failed"})


@mcp.tool()
async def recommend_model(
    prompt_text: str,
    user_id: str = "default_user"
) -> str:
    """
    Determine the optimal LLM model to use for a prompt based on its complexity and history.
    """
    try:
        srv = await get_initialized_services()
        prompt_data = PromptData(prompt_text=prompt_text, user_id=user_id)
        analysis = srv["analyzer"].analyze(prompt_data)
        recommendation = await srv["router"].recommend(analysis, prompt_text)
        return json.dumps(recommendation.model_dump(), indent=2)
    except Exception as e:
        logger.error("Error in recommend_model tool: %s", e)
        return json.dumps({"error": str(e), "status": "failed"})


@mcp.tool()
async def calculate_necessity(
    prompt_text: str,
    user_id: str = "default_user"
) -> str:
    """
    Calculate the AI Necessity Score (0-100) for a prompt. Tells you if a developer can self-solve it.
    """
    try:
        srv = await get_initialized_services()
        prompt_data = PromptData(prompt_text=prompt_text, user_id=user_id)
        analysis = srv["analyzer"].analyze(prompt_data)
        necessity = await srv["scorer"].score(analysis, user_id, prompt_text)
        return json.dumps(necessity.model_dump(), indent=2)
    except Exception as e:
        logger.error("Error in calculate_necessity tool: %s", e)
        return json.dumps({"error": str(e), "status": "failed"})


@mcp.tool()
async def get_skill_profile(
    user_id: str = "default_user"
) -> str:
    """
    Get the complete Cognee-derived developer skill profile.
    """
    try:
        srv = await get_initialized_services()
        profile = await srv["tracker"].get_skill_profile(user_id)
        return json.dumps(profile.model_dump(), indent=2)
    except Exception as e:
        logger.error("Error in get_skill_profile tool: %s", e)
        return json.dumps({"error": str(e), "status": "failed"})


@mcp.tool()
async def get_analytics(
    user_id: str = "default_user"
) -> str:
    """
    Get prompt analytics and AI spend metrics for a developer.
    """
    try:
        from app.db.session import SessionLocal
        from app.db.models import PromptRecordDb
        
        db = SessionLocal()
        try:
            records = db.query(PromptRecordDb).filter(PromptRecordDb.user_id == user_id).all()
            
            total_prompts = len(records)
            total_cost = sum(r.estimated_cost for r in records)
            avg_necessity = (
                sum(r.necessity_score for r in records if r.necessity_score is not None)
                / max(sum(1 for r in records if r.necessity_score is not None), 1)
            ) if records else 0.0
            
            category_counts: Dict[str, int] = {}
            for r in records:
                cat = r.category or "unknown"
                category_counts[cat] = category_counts.get(cat, 0) + 1
                
            result = {
                "user_id": user_id,
                "total_prompts": total_prompts,
                "total_cost_usd": round(total_cost, 4),
                "estimated_savings_usd": round(total_cost * 0.4, 4),
                "average_necessity_score": round(avg_necessity, 1),
                "top_categories": category_counts
            }
            return json.dumps(result, indent=2)
        finally:
            db.close()
    except Exception as e:
        logger.error("Error in get_analytics tool: %s", e)
        return json.dumps({"error": str(e), "status": "failed"})


if __name__ == "__main__":
    # MCP server can be run as standard python process communicating via stdin/stdout
    mcp.run()
