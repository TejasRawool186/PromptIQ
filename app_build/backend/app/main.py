"""
PromptIQ Backend — Main FastAPI Application entry point.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.middleware.auth import APIKeyAuthMiddleware
from app.api.routes.prompts import router as prompts_router
from app.api.routes.memory import router as memory_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.skills import router as skills_router
from app.api.routes.models import router as models_router
from app.api.routes.auth import router as auth_router
from app.services.cognee_memory import get_memory_service
from app.db.session import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("promptiq.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for FastAPI, handling startup and shutdown events."""
    logger.info("Starting up PromptIQ database and services...")
    init_db()
    
    settings = get_settings()
    
    # Initialize Cognee memory service
    try:
        memory = get_memory_service()
        await memory.initialize()
        logger.info("Cognee initialized successfully during startup.")
    except Exception as e:
        logger.error("Failed to initialize Cognee on startup: %s", e)
        logger.warning("Continuing startup in degraded memory mode...")
        
    yield
    logger.info("Shutting down PromptIQ services...")


# Create FastAPI application
settings = get_settings()
app = FastAPI(
    title="PromptIQ",
    description="The Memory-Powered AI Governance Layer for Engineering Teams (Cognee Hackathon)",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.debug,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add API Key authentication middleware
app.add_middleware(APIKeyAuthMiddleware)

# Register API routes
app.include_router(auth_router)
app.include_router(prompts_router)
app.include_router(memory_router)
app.include_router(analytics_router)
app.include_router(skills_router)
app.include_router(models_router)


# Health check endpoint
@app.get(
    "/health",
    status_code=status.HTTP_200_OK,
    tags=["system"],
    summary="Health check endpoint",
)
async def health_check():
    """Verify that the FastAPI server is running and check Cognee connection."""
    memory = get_memory_service()
    cognee_status = "connected" if memory._initialized else "degraded"
    
    return {
        "status": "healthy",
        "service": "PromptIQ Backend API",
        "cognee_memory": cognee_status,
        "debug_mode": settings.debug,
    }


# Root endpoint
@app.get(
    "/",
    status_code=status.HTTP_200_OK,
    tags=["system"],
    summary="Root landing page info",
)
async def root():
    return {
        "name": "PromptIQ Gateway API",
        "tagline": "AI Governance that Remembers",
        "version": "1.0.0",
        "docs_url": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
