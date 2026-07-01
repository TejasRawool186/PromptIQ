import logging
from datetime import datetime, timedelta
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlalchemy.orm import Session
import httpx
from jose import jwt

from app.config import get_settings
from app.db.session import get_db
from app.db.models import User
from app.services.cognee_memory import get_memory_service

logger = logging.getLogger("promptiq.routes.auth")
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

def create_access_token(subject: str, expires_delta: timedelta = None) -> str:
    """Generate a secure JWT session token signed with SECRET_KEY."""
    settings = get_settings()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7) # 7-day session duration
    
    to_encode = {"sub": str(subject), "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm="HS256")
    return encoded_jwt


@router.get(
    "/google/url",
    summary="Get Google Authorize URL",
    description="Returns the Google OAuth redirect URL for the frontend login page."
)
async def get_google_auth_url():
    settings = get_settings()
    if not settings.google_client_id:
        # Mock mode when keys aren't set yet (helps during setup/testing)
        logger.warning("GOOGLE_CLIENT_ID not set. Running Auth in Mock Sandbox Mode.")
        return {
            "url": "mock_login_sandbox",
            "mock": True
        }

    # Construct standard stateless Google Authorize URL
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?response_type=code"
        f"&client_id={settings.google_client_id}"
        f"&redirect_uri={settings.google_redirect_uri}"
        f"&scope=openid%20email%20profile"
        f"&access_type=offline"
        f"&prompt=select_account"
    )
    return {"url": auth_url, "mock": False}


@router.get(
    "/google/callback",
    summary="Google Authentication Callback",
    description="Exchanges the Google authorization code for a session JWT token."
)
async def google_callback(
    code: str = Query(..., description="Authorization code from Google"),
    db: Session = Depends(get_db)
):
    settings = get_settings()
    
    # ── Handle Sandbox Mock Login ──────────────────────────
    if code == "mock_code_dev_sandbox":
        logger.info("Executing Sandbox Mock Auth registration")
        user_id = "default_user"
        email = "developer@promptiq.dev"
        name = "PromptIQ Developer"
        picture = "https://lh3.googleusercontent.com/a/default-user"
        
        # Register user in DB
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            db_user = User(id=user_id, email=email, name=name, picture=picture)
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            
        token = create_access_token(user_id)
        return {
            "success": True,
            "token": token,
            "user": {
                "id": db_user.id,
                "email": db_user.email,
                "name": db_user.name,
                "picture": db_user.picture
            }
        }

    # ── Standard Live Token Exchange ────────────────────────
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google Client Credentials are not configured."
        )

    # Swap code for Google tokens
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "redirect_uri": settings.google_redirect_uri,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        try:
            # 1. Post code to Google OAuth Token Endpoint
            res = await client.post(token_url, data=token_data)
            if res.status_code != 200:
                logger.error("Google token swap failed: %s", res.text)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange authorization code with Google."
                )
            
            tokens = res.json()
            access_token = tokens.get("access_token")
            
            # 2. Fetch User Profile Info using the access token
            userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            headers = {"Authorization": f"Bearer {access_token}"}
            profile_res = await client.get(userinfo_url, headers=headers)
            if profile_res.status_code != 200:
                logger.error("Google profile fetch failed: %s", profile_res.text)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to fetch user profile from Google."
                )
            
            profile = profile_res.json()
            google_id = profile.get("sub")
            email = profile.get("email")
            name = profile.get("name")
            picture = profile.get("picture")
            
            if not google_id or not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Profile payload missing ID or email."
                )

            # 3. Register or Retrieve user from PostgreSQL
            db_user = db.query(User).filter(User.id == google_id).first()
            if not db_user:
                # Add to DB
                db_user = User(id=google_id, email=email, name=name, picture=picture)
                db.add(db_user)
                db.commit()
                db.refresh(db_user)
                
                # Ingest new user into Cognee Graph Memory
                try:
                    memory = get_memory_service()
                    user_description = f"User profile registered: ID={google_id}, Name={name}, Email={email}"
                    await memory.store_memory(
                        data=user_description,
                        context="users",
                        dataset_name=f"user_{google_id}",
                        metadata={"user_id": google_id, "email": email}
                    )
                except Exception as exc:
                    logger.warning("Failed to store user profile in Cognee: %s", exc)

            # 4. Generate local secure JWT session token
            token = create_access_token(db_user.id)
            return {
                "success": True,
                "token": token,
                "user": {
                    "id": db_user.id,
                    "email": db_user.email,
                    "name": db_user.name,
                    "picture": db_user.picture
                }
            }

        except Exception as exc:
            logger.error("OAuth flow exception: %s", exc)
            if isinstance(exc, HTTPException):
                raise exc
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"OAuth verification failed: {exc}"
            )
