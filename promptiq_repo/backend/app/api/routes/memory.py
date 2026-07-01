"""
Memory API — Direct Cognee memory operations (store, recall, forget).
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import (
    APIResponse,
    MemoryRecallRequest,
    MemoryRecallResponse,
    MemoryStoreRequest,
)
from app.services.cognee_memory import get_memory_service

logger = logging.getLogger("promptiq.routes.memory")

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.post(
    "/store",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Store data in Cognee memory",
    description="Store arbitrary data in Cognee's knowledge graph via cognee.remember().",
)
async def store_memory(request: MemoryStoreRequest) -> APIResponse:
    """
    Store data into Cognee's persistent knowledge graph.
    Creates nodes and extracts relationships via cognify.
    """
    memory = get_memory_service()

    try:
        dataset_name = await memory.store_memory(
            data=request.data,
            context=request.context,
            dataset_name=request.dataset_name,
            metadata=request.metadata,
        )

        logger.info("Memory stored: context=%s dataset=%s", request.context, dataset_name)

        return APIResponse(
            success=True,
            data={
                "dataset_name": dataset_name,
                "context": request.context,
                "stored": True,
            },
            message="Data stored in Cognee memory successfully",
        )

    except Exception as exc:
        logger.error("Memory store failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store in Cognee: {exc}",
        )


@router.post(
    "/recall",
    response_model=MemoryRecallResponse,
    summary="Query Cognee memory",
    description="Natural language query against Cognee's knowledge graph via cognee.recall().",
)
async def recall_memory(request: MemoryRecallRequest) -> MemoryRecallResponse:
    """
    Query Cognee's knowledge graph with natural language.
    Uses hybrid vector + graph search for accurate results.
    """
    memory = get_memory_service()

    try:
        result = await memory.recall_memory(
            query=request.query,
            limit=request.limit,
            dataset_name=request.dataset_name,
        )

        logger.info(
            "Memory recall: query='%s' results=%d time=%.1fms",
            request.query[:50],
            result["total_results"],
            result["recall_time_ms"],
        )

        return MemoryRecallResponse(
            query=result["query"],
            results=result["results"],
            total_results=result["total_results"],
            recall_time_ms=result["recall_time_ms"],
        )

    except Exception as exc:
        logger.error("Memory recall failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cognee recall failed: {exc}",
        )


@router.delete(
    "/{user_id}",
    response_model=APIResponse,
    summary="Forget user data (GDPR)",
    description=(
        "GDPR-compliant deletion of all user data from Cognee's knowledge graph "
        "via cognee.forget()."
    ),
)
async def forget_user_data(user_id: str) -> APIResponse:
    """
    Delete all data for a specific user from Cognee.
    GDPR right-to-deletion compliance.
    """
    memory = get_memory_service()

    try:
        result = await memory.delete_user_data(user_id)

        if result["status"] == "deleted":
            logger.info("User data deleted: user_id=%s", user_id)
            return APIResponse(
                success=True,
                data=result,
                message=f"All data for user {user_id} has been deleted",
            )
        else:
            logger.warning("User data deletion may have failed: %s", result)
            return APIResponse(
                success=False,
                data=result,
                message=f"Data deletion for user {user_id} encountered issues",
                error=result.get("error"),
            )

    except Exception as exc:
        logger.error("User data deletion failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user data: {exc}",
        )


@router.post(
    "/improve",
    response_model=APIResponse,
    summary="Trigger Cognee memory improvement",
    description="Manually trigger Cognee's knowledge graph refinement pipeline.",
)
async def improve_memory() -> APIResponse:
    """Trigger background knowledge graph refinement."""
    memory = get_memory_service()
    try:
        result = await memory.refine_knowledge()
        return APIResponse(
            success=True,
            data=result,
            message="Cognee memory improvement triggered successfully",
        )
    except Exception as exc:
        logger.error("Memory improvement failed: %s", exc)
        return APIResponse(
            success=False,
            message="Failed to trigger memory improvement",
            error=str(exc),
        )


@router.post(
    "/seed",
    response_model=APIResponse,
    summary="Seed mock developer prompts",
    description="Seed Cognee memory and in-memory cache with 20 realistic developer prompts.",
)
async def seed_database_route() -> APIResponse:
    """Seed the database with mock records."""
    from app.services.seeding import seed_database
    try:
        count = await seed_database()
        return APIResponse(
            success=True,
            data={"seeded_count": count},
            message=f"Successfully seeded database with {count} prompts",
        )
    except Exception as exc:
        logger.error("Database seeding failed: %s", exc)
        return APIResponse(
            success=False,
            message="Failed to seed database",
            error=str(exc),
        )
