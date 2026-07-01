"""
Analytics API — Dashboard stats, cost breakdown, and usage trends.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query, status, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import PromptRecordDb
from app.models.schemas import (
    APIResponse,
    CostAnalytics,
    DashboardStats,
    UsageTrends,
)
from app.services.cognee_memory import get_memory_service

logger = logging.getLogger("promptiq.routes.analytics")

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get(
    "/dashboard",
    response_model=APIResponse,
    summary="Dashboard statistics",
    description="Aggregate dashboard stats including costs, usage, and Cognee memory health.",
)
async def get_dashboard_stats(
    timeframe: str = Query("last_30_days", description="Time range for stats"),
    org_id: Optional[str] = Query(None, description="Filter by organization"),
    db: Session = Depends(get_db)
) -> APIResponse:
    """
    Compute aggregate dashboard statistics.
    Pulls data from Cognee memory and the PostgreSQL database.
    """
    memory = get_memory_service()

    # Query Cognee for analytics data
    try:
        analytics_data = await memory.get_analytics_data(timeframe=timeframe, scope=org_id or "all")
        raw_results = analytics_data.get("raw_results", [])
    except Exception as exc:
        logger.warning("Cognee analytics query failed: %s", exc)
        raw_results = []

    # Get prompt records from database
    records = db.query(PromptRecordDb).all()

    # Compute stats from database records
    total_prompts = len(records)
    total_cost = sum(r.estimated_cost for r in records)
    total_time_saved = sum(int(r.complexity_score * 10) for r in records)
    avg_complexity = (
        sum(r.complexity_score for r in records) / max(total_prompts, 1)
    )
    avg_necessity = (
        sum(r.necessity_score for r in records if r.necessity_score is not None)
        / max(sum(1 for r in records if r.necessity_score is not None), 1)
    )

    # Category distribution
    category_counts: Dict[str, int] = {}
    for r in records:
        cat = r.category or "unknown"
        category_counts[cat] = category_counts.get(cat, 0) + 1
    top_categories = [
        {"category": k, "count": v}
        for k, v in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    # Skill domain distribution
    domain_counts: Dict[str, int] = {}
    for r in records:
        dom = r.skill_domain or "unknown"
        domain_counts[dom] = domain_counts.get(dom, 0) + 1
    top_domains = [
        {"domain": k, "count": v}
        for k, v in sorted(domain_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    # Model distribution
    model_counts: Dict[str, int] = {}
    for r in records:
        model = r.recommended_model or "unknown"
        model_counts[model] = model_counts.get(model, 0) + 1
    model_dist = [
        {"model": k, "count": v}
        for k, v in sorted(model_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    # Active users
    unique_users = set(r.user_id for r in records)

    stats = DashboardStats(
        total_prompts=total_prompts,
        total_cost_usd=round(total_cost, 4),
        total_time_saved_minutes=round(total_time_saved, 1),
        average_complexity=round(avg_complexity, 1),
        average_necessity_score=round(avg_necessity, 1),
        active_users=len(unique_users),
        top_categories=top_categories,
        top_skill_domains=top_domains,
        model_distribution=model_dist,
        cognee_memory_health={
            "status": "healthy",
            "cognee_results_available": len(raw_results) > 0,
            "last_query": datetime.utcnow().isoformat(),
        },
    )

    return APIResponse(
        success=True,
        data=stats.model_dump(),
        message="Dashboard stats computed",
    )


@router.get(
    "/costs",
    response_model=APIResponse,
    summary="Cost breakdown",
    description="Detailed cost analytics by model, user, project, and category.",
)
async def get_cost_analytics(
    period: str = Query("last_30_days", description="Time period"),
    org_id: Optional[str] = Query(None, description="Filter by organization"),
    db: Session = Depends(get_db)
) -> APIResponse:
    """Cost breakdown analytics."""
    records = db.query(PromptRecordDb).all()

    # Cost by model
    cost_by_model: Dict[str, float] = {}
    for r in records:
        model = r.recommended_model or "unknown"
        cost_by_model[model] = cost_by_model.get(model, 0) + r.estimated_cost

    # Cost by user
    cost_by_user: Dict[str, float] = {}
    for r in records:
        user = r.user_id
        cost_by_user[user] = cost_by_user.get(user, 0) + r.estimated_cost

    # Cost by project
    cost_by_project: Dict[str, float] = {}
    for r in records:
        project = "default_project"
        cost_by_project[project] = cost_by_project.get(project, 0) + r.estimated_cost

    # Cost by category
    cost_by_category: Dict[str, float] = {}
    for r in records:
        cat = r.category or "unknown"
        cost_by_category[cat] = cost_by_category.get(cat, 0) + r.estimated_cost

    total_cost = sum(r.estimated_cost for r in records)

    # Estimate savings: cost if all used premium model vs actual
    premium_cost = sum(
        (r.token_count / 1000.0) * 0.015 * 2.5  # rough premium estimate
        for r in records
    )
    savings = max(0.0, premium_cost - total_cost)

    # Cost trend (group by day)
    cost_trend: List[Dict[str, Any]] = []
    day_costs: Dict[str, float] = {}
    for r in records:
        day = r.created_at.strftime("%Y-%m-%d")
        day_costs[day] = day_costs.get(day, 0) + r.estimated_cost
    cost_trend = [
        {"date": k, "cost_usd": round(v, 4)}
        for k, v in sorted(day_costs.items())
    ]

    analytics = CostAnalytics(
        total_cost_usd=round(total_cost, 4),
        cost_by_model={k: round(v, 4) for k, v in cost_by_model.items()},
        cost_by_user={k: round(v, 4) for k, v in cost_by_user.items()},
        cost_by_project={k: round(v, 4) for k, v in cost_by_project.items()},
        cost_by_category={k: round(v, 4) for k, v in cost_by_category.items()},
        estimated_savings_usd=round(savings, 4),
        cost_trend=cost_trend,
        period=period,
    )

    return APIResponse(
        success=True,
        data=analytics.model_dump(),
        message="Cost analytics computed",
    )


@router.get(
    "/usage",
    response_model=APIResponse,
    summary="Usage trends",
    description="Usage trends over time including prompts per day, category/model distribution.",
)
async def get_usage_trends(
    period: str = Query("last_30_days", description="Time period"),
    db: Session = Depends(get_db)
) -> APIResponse:
    """Usage trend data over time."""
    records = db.query(PromptRecordDb).all()

    # Prompts per day
    day_counts: Dict[str, int] = {}
    hour_counts: Dict[int, int] = {}
    for r in records:
        day = r.created_at.strftime("%Y-%m-%d")
        day_counts[day] = day_counts.get(day, 0) + 1
        hour = r.created_at.hour
        hour_counts[hour] = hour_counts.get(hour, 0) + 1

    prompts_per_day = [
        {"date": k, "count": v}
        for k, v in sorted(day_counts.items())
    ]

    # Category breakdown
    category_breakdown: Dict[str, int] = {}
    for r in records:
        cat = r.category or "unknown"
        category_breakdown[cat] = category_breakdown.get(cat, 0) + 1

    # Skill domain breakdown
    domain_breakdown: Dict[str, int] = {}
    for r in records:
        dom = r.skill_domain or "unknown"
        domain_breakdown[dom] = domain_breakdown.get(dom, 0) + 1

    # Model usage
    model_usage: Dict[str, int] = {}
    for r in records:
        model = r.recommended_model or "unknown"
        model_usage[model] = model_usage.get(model, 0) + 1

    # Peak hours
    peak_hours = sorted(hour_counts, key=lambda h: hour_counts[h], reverse=True)[:5]

    # Busiest day
    busiest = max(day_counts.items(), key=lambda x: x[1]) if day_counts else None

    trends = UsageTrends(
        period=period,
        prompts_per_day=prompts_per_day,
        category_breakdown=category_breakdown,
        skill_domain_breakdown=domain_breakdown,
        model_usage=model_usage,
        peak_hours=peak_hours,
        busiest_day=busiest[0] if busiest else None,
    )

    return APIResponse(
        success=True,
        data=trends.model_dump(),
        message="Usage trends computed",
    )
