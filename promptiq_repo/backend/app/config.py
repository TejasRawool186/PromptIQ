"""
PromptIQ Configuration — Pydantic Settings loaded from .env
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide configuration backed by environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- LLM Provider ---
    llm_api_key: str = "sk-placeholder"
    llm_provider: str = "openai"
    llm_model: str = "gpt-4o-mini"

    # --- Cognee ---
    cognee_llm_api_key: str = "sk-placeholder"
    cognee_llm_provider: str = "openai"
    cognee_llm_model: str = "gpt-4o-mini"
    cognee_vector_db: str = "lancedb"
    cognee_graph_db: str = "networkx"

    # --- API Auth ---
    api_key: str = "promptiq-dev-key-change-me"
    secret_key: str = "super-secret-jwt-key-change-me-in-production"

    # --- Server ---
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    # --- Defaults ---
    default_org_id: str = "default_org"
    default_user_id: str = "default_user"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    """Singleton settings instance, cached after first call."""
    return Settings()
