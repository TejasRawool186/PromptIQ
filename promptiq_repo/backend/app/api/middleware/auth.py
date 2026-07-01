"""
API Key Authentication Middleware.

Validates the X-API-Key header against the configured API_KEY.
The /health and /docs endpoints are exempted.
"""

from __future__ import annotations

import logging
from typing import Callable

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings

logger = logging.getLogger("promptiq.auth")

# Paths that do NOT require authentication
PUBLIC_PATHS: set[str] = {
    "/",
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/favicon.ico",
}


class APIKeyAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware that checks the X-API-Key header on every request.
    Rejects unauthorized requests with 401.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Starlette handles CORS preflight using OPTIONS requests; bypass auth check
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path

        # Skip auth for public endpoints
        if path in PUBLIC_PATHS or path.startswith("/docs") or path.startswith("/redoc"):
            return await call_next(request)

        # Extract API key from header
        api_key = request.headers.get("X-API-Key") or request.headers.get("x-api-key")

        if not api_key:
            # Also check query param for WebSocket / simple GET requests
            api_key = request.query_params.get("api_key")

        settings = get_settings()

        if not api_key:
            logger.warning("Missing API key from %s %s", request.method, path)
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "success": False,
                    "error": "Missing API key. Provide X-API-Key header.",
                    "message": "Unauthorized",
                },
            )

        if api_key != settings.api_key:
            logger.warning("Invalid API key attempt from %s %s", request.method, path)
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "success": False,
                    "error": "Invalid API key.",
                    "message": "Unauthorized",
                },
            )

        # Valid API key — proceed
        return await call_next(request)
