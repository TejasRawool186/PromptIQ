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
from jose import jwt, JWTError
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
    "/api/v1/auth/google/url",
    "/api/v1/auth/google/callback",
}


class APIKeyAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware that checks either X-API-Key (CLI/IDE) or Authorization Bearer JWT (Dashboard).
    Rejects unauthorized requests with 401.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path

        # Skip auth for public endpoints
        if path in PUBLIC_PATHS or path.startswith("/docs") or path.startswith("/redoc") or path.startswith("/api/v1/auth/google"):
            return await call_next(request)

        settings = get_settings()

        # 1. Try JWT Bearer Token authentication (Dashboard UI)
        auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
                user_id = payload.get("sub")
                if user_id:
                    request.state.user_id = user_id
                    return await call_next(request)
            except JWTError:
                logger.warning("Invalid JWT Token attempt from %s %s", request.method, path)
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={
                        "success": False,
                        "error": "Invalid or expired JWT token.",
                        "message": "Unauthorized",
                    },
                )

        # 2. Try X-API-Key authentication (CLI / IDE Extensions)
        api_key = request.headers.get("X-API-Key") or request.headers.get("x-api-key")
        if not api_key:
            api_key = request.query_params.get("api_key")

        if api_key:
            if api_key == settings.api_key:
                # API Key verified — map to default_user (or as supplied by request payload)
                request.state.user_id = settings.default_user_id
                return await call_next(request)
            
            logger.warning("Invalid API key attempt from %s %s", request.method, path)
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "success": False,
                    "error": "Invalid API key.",
                    "message": "Unauthorized",
                },
            )

        # 3. No authentication credentials provided
        logger.warning("Missing authentication credentials from %s %s", request.method, path)
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "success": False,
                "error": "Authentication required. Provide X-API-Key or Authorization Bearer JWT.",
                "message": "Unauthorized",
            },
        )
