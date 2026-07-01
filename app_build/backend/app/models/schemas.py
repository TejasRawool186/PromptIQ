"""
PromptIQ — All Pydantic v2 data models & schemas.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


# ─── Enums ──────────────────────────────────────────────────────────────────

class PromptCategory(str, Enum):
    CODE_GENERATION = "code_generation"
    DEBUGGING = "debugging"
    REFACTORING = "refactoring"
    DOCUMENTATION = "documentation"
    ARCHITECTURE = "architecture"
    LEARNING = "learning"
    BOILERPLATE = "boilerplate"


class SkillDomain(str, Enum):
    FRONTEND = "frontend"
    BACKEND = "backend"
    DATABASE = "database"
    DEVOPS = "devops"
    TESTING = "testing"
    SECURITY = "security"
    ML_AI = "ml_ai"


class ModelTier(str, Enum):
    LOCAL = "local"
    MID_TIER = "mid_tier"
    PREMIUM = "premium"
    SPECIALIZED = "specialized"


# ─── Prompt Models ──────────────────────────────────────────────────────────

class PromptData(BaseModel):
    """Raw prompt input captured from an AI interaction."""
    prompt_text: str = Field(..., min_length=1, description="The developer's prompt text")
    response_summary: Optional[str] = Field(None, description="AI response summary (truncated)")
    user_id: str = Field(default="default_user", description="Developer identifier")
    org_id: str = Field(default="default_org", description="Organization identifier")
    project: str = Field(default="unknown", description="Project or repository name")
    ide_source: str = Field(default="unknown", description="Source IDE or tool")
    model_used: Optional[str] = Field(None, description="AI model that was used")
    token_count_input: int = Field(default=0, ge=0, description="Input token count")
    token_count_output: int = Field(default=0, ge=0, description="Output token count")
    session_id: Optional[str] = Field(None, description="Session identifier for context grouping")


class PromptAnalysis(BaseModel):
    """Analysis results for a single prompt."""
    complexity_score: float = Field(..., ge=1.0, le=10.0, description="Complexity 1-10")
    category: PromptCategory = Field(..., description="Prompt category classification")
    skill_domain: SkillDomain = Field(..., description="Primary skill domain")
    secondary_domains: List[SkillDomain] = Field(default_factory=list, description="Additional domains")
    estimated_manual_minutes: float = Field(..., ge=0, description="Estimated manual time in minutes")
    estimated_ai_cost_usd: float = Field(..., ge=0, description="Estimated AI cost in USD")
    token_count: int = Field(default=0, ge=0, description="Total token count")
    keywords: List[str] = Field(default_factory=list, description="Extracted keywords")


class PromptRecord(BaseModel):
    """Stored prompt with full metadata."""
    id: str = Field(default_factory=lambda: str(uuid4()), description="Unique prompt ID")
    prompt_data: PromptData
    analysis: PromptAnalysis
    necessity_score: Optional[float] = Field(None, ge=0, le=100)
    recommended_model: Optional[str] = None
    recommendation_text: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Necessity Scoring ──────────────────────────────────────────────────────

class NecessityScore(BaseModel):
    """AI Necessity Score result (0-100)."""
    score: float = Field(..., ge=0, le=100, description="AI necessity score 0-100")
    recommendation: str = Field(..., description="Human-readable recommendation")
    tier: str = Field(..., description="self_solve | learn_and_use | ai_recommended")
    factors: Dict[str, float] = Field(default_factory=dict, description="Individual factor scores")


# ─── Model Routing ──────────────────────────────────────────────────────────

class ModelRecommendation(BaseModel):
    """Optimal model recommendation result."""
    model_name: str = Field(..., description="Recommended model identifier")
    model_tier: ModelTier = Field(..., description="Model cost tier")
    confidence: float = Field(default=0.8, ge=0, le=1, description="Routing confidence")
    reasoning: str = Field(..., description="Why this model was chosen")
    estimated_cost_usd: float = Field(default=0.0, ge=0, description="Estimated cost for this prompt")
    alternatives: List[str] = Field(default_factory=list, description="Alternative model options")
    historical_success_rate: Optional[float] = Field(None, ge=0, le=1, description="Past success rate")


# ─── Skill Tracking ─────────────────────────────────────────────────────────

class SkillNode(BaseModel):
    """Single skill data point."""
    domain: SkillDomain
    level: float = Field(default=0.0, ge=0, le=100, description="Skill level 0-100")
    prompt_count: int = Field(default=0, ge=0, description="Number of prompts in this domain")
    ai_dependency_ratio: float = Field(default=0.5, ge=0, le=1, description="How much the dev relies on AI")
    last_activity: Optional[datetime] = None
    trend: str = Field(default="stable", description="improving | declining | stable")


class DeveloperSkillProfile(BaseModel):
    """Complete skill profile for a developer."""
    user_id: str
    skills: List[SkillNode] = Field(default_factory=list)
    overall_level: float = Field(default=0.0, ge=0, le=100)
    total_prompts: int = Field(default=0, ge=0)
    ai_dependency_score: float = Field(default=50.0, ge=0, le=100)
    learning_velocity: float = Field(default=0.0, description="Rate of skill acquisition")
    strongest_domain: Optional[SkillDomain] = None
    weakest_domain: Optional[SkillDomain] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class SkillTimeline(BaseModel):
    """Skill progression over time."""
    user_id: str
    domain: SkillDomain
    data_points: List[Dict[str, Any]] = Field(default_factory=list)
    trend_direction: str = Field(default="stable")
    velocity: float = Field(default=0.0)


# ─── Analytics ───────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    """Aggregate dashboard statistics."""
    total_prompts: int = 0
    total_cost_usd: float = 0.0
    total_time_saved_minutes: float = 0.0
    average_complexity: float = 0.0
    average_necessity_score: float = 0.0
    active_users: int = 0
    top_categories: List[Dict[str, Any]] = Field(default_factory=list)
    top_skill_domains: List[Dict[str, Any]] = Field(default_factory=list)
    model_distribution: List[Dict[str, Any]] = Field(default_factory=list)
    cognee_memory_health: Dict[str, Any] = Field(default_factory=dict)


class CostAnalytics(BaseModel):
    """Cost breakdown analytics."""
    total_cost_usd: float = 0.0
    cost_by_model: Dict[str, float] = Field(default_factory=dict)
    cost_by_user: Dict[str, float] = Field(default_factory=dict)
    cost_by_project: Dict[str, float] = Field(default_factory=dict)
    cost_by_category: Dict[str, float] = Field(default_factory=dict)
    estimated_savings_usd: float = 0.0
    cost_trend: List[Dict[str, Any]] = Field(default_factory=list)
    period: str = "last_30_days"


class UsageTrends(BaseModel):
    """Usage trend data over time."""
    period: str = "last_30_days"
    prompts_per_day: List[Dict[str, Any]] = Field(default_factory=list)
    category_breakdown: Dict[str, int] = Field(default_factory=dict)
    skill_domain_breakdown: Dict[str, int] = Field(default_factory=dict)
    model_usage: Dict[str, int] = Field(default_factory=dict)
    peak_hours: List[int] = Field(default_factory=list)
    busiest_day: Optional[str] = None


# ─── Memory API ──────────────────────────────────────────────────────────────

class MemoryStoreRequest(BaseModel):
    """Request to store data in Cognee memory."""
    data: str = Field(..., min_length=1, description="Text data to store")
    context: str = Field(default="general", description="Context label for organization")
    user_id: str = Field(default="default_user")
    dataset_name: Optional[str] = Field(None, description="Optional Cognee dataset name")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class MemoryRecallRequest(BaseModel):
    """Request to query Cognee memory."""
    query: str = Field(..., min_length=1, description="Natural language query")
    user_id: Optional[str] = Field(None, description="Scope to a specific user")
    limit: int = Field(default=10, ge=1, le=100, description="Max results to return")
    dataset_name: Optional[str] = Field(None, description="Optional Cognee dataset name")


class MemoryRecallResponse(BaseModel):
    """Response from Cognee memory recall."""
    query: str
    results: List[Dict[str, Any]] = Field(default_factory=list)
    total_results: int = 0
    recall_time_ms: float = 0.0


# ─── API Request/Response Wrappers ──────────────────────────────────────────

class AnalyzePromptRequest(BaseModel):
    """Full prompt analysis request."""
    prompt_text: str = Field(..., min_length=1, description="The prompt to analyze")
    user_id: str = Field(default="default_user")
    org_id: str = Field(default="default_org")
    project: str = Field(default="unknown")
    ide_source: str = Field(default="unknown")
    model_used: Optional[str] = None
    response_summary: Optional[str] = None
    token_count_input: int = Field(default=0, ge=0)
    token_count_output: int = Field(default=0, ge=0)
    session_id: Optional[str] = None


class AnalyzePromptResponse(BaseModel):
    """Full prompt analysis response with all enrichments."""
    prompt_id: str
    analysis: PromptAnalysis
    necessity: NecessityScore
    model_recommendation: ModelRecommendation
    similar_prompts: List[Dict[str, Any]] = Field(default_factory=list)
    learning_suggestions: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Learning Recommendations ───────────────────────────────────────────────

class LearningRecommendation(BaseModel):
    """A learning resource recommendation."""
    domain: SkillDomain
    topic: str
    reason: str
    resource_type: str = Field(default="article", description="article | course | docs | tutorial")
    url: Optional[str] = None
    priority: str = Field(default="medium", description="high | medium | low")


class LearningRecommendations(BaseModel):
    """Collection of learning recommendations for a user."""
    user_id: str
    recommendations: List[LearningRecommendation] = Field(default_factory=list)
    skill_gaps: List[Dict[str, Any]] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Generic API Envelope ───────────────────────────────────────────────────

class APIResponse(BaseModel):
    """Standard API response wrapper."""
    success: bool = True
    data: Any = None
    message: str = "OK"
    error: Optional[str] = None
