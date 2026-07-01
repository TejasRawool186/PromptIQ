"""
Database Seeding Service — Populates PromptIQ with realistic initial data.
Ingests mock developer prompts through the real analysis and Cognee pipelines.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any

from app.models.schemas import AnalyzePromptRequest
from app.api.routes.prompts import analyze_prompt, _prompt_store
from app.services.cognee_memory import get_memory_service

logger = logging.getLogger("promptiq.seeding")

# 20 Realistic developer prompts matching the frontend mock data
SEED_PROMPTS: List[Dict[str, Any]] = [
    {
        "prompt_text": "Refactor the useAuth hook to use React Context with TypeScript generics instead of prop drilling through 5 component layers.",
        "category": "refactoring",
        "user_id": "dev1", # Alice Chen
        "project": "PromptIQ",
        "ide_source": "vscode",
        "model_used": "claude-opus",
        "response_summary": "Provided a complete Context-based auth implementation with typed Provider, custom hook, and migration guide.",
        "token_count_input": 1200,
        "token_count_output": 642,
        "offset_minutes": 12
    },
    {
        "prompt_text": "Debug this PostgreSQL query that's causing a sequential scan on a 10M row table instead of using the composite index on (user_id, created_at).",
        "category": "debugging",
        "user_id": "dev2", # Bob Kumar
        "project": "DataPipeline",
        "ide_source": "cursor",
        "model_used": "gpt-4o",
        "response_summary": "Identified implicit type casting preventing index usage. Suggested EXPLAIN ANALYZE and provided corrected query.",
        "token_count_input": 800,
        "token_count_output": 456,
        "offset_minutes": 35
    },
    {
        "prompt_text": "Generate a multi-stage Dockerfile for Next.js 14 with standalone output, non-root user, and proper layer caching for node_modules.",
        "category": "code_generation",
        "user_id": "dev2",
        "project": "DataPipeline",
        "ide_source": "vscode",
        "model_used": "gemini-flash",
        "response_summary": "Generated optimized Dockerfile with 3 stages: deps, build, runtime. Image size reduced to ~180MB.",
        "token_count_input": 400,
        "token_count_output": 490,
        "offset_minutes": 90
    },
    {
        "prompt_text": "Write comprehensive Jest unit tests for the PaymentService class that mocks the Stripe SDK, handles webhook signature verification, and tests all error paths.",
        "category": "code_generation",
        "user_id": "dev1",
        "project": "PromptIQ",
        "ide_source": "vscode",
        "model_used": "claude-opus",
        "response_summary": "Created 12 test cases covering payment creation, refunds, webhook handling, and error scenarios with full Stripe mock setup.",
        "token_count_input": 1500,
        "token_count_output": 1390,
        "offset_minutes": 180
    },
    {
        "prompt_text": "Design a microservices architecture for an e-commerce platform with event-driven communication using RabbitMQ, CQRS pattern, and saga orchestration for orders.",
        "category": "architecture",
        "user_id": "dev2",
        "project": "DataPipeline",
        "ide_source": "cursor",
        "model_used": "gpt-4o",
        "response_summary": "Detailed architecture with 6 bounded contexts, event schemas, saga flow diagrams, and infrastructure recommendations.",
        "token_count_input": 2000,
        "token_count_output": 1456,
        "offset_minutes": 300
    },
    {
        "prompt_text": "Create a custom React hook useInfiniteScroll that uses IntersectionObserver for efficient infinite scrolling with proper cleanup and loading states.",
        "category": "code_generation",
        "user_id": "dev1",
        "project": "PromptIQ",
        "ide_source": "vscode",
        "model_used": "gpt-4o-mini",
        "response_summary": "Hook with IntersectionObserver, cleanup logic, configurable threshold, and TypeScript types.",
        "token_count_input": 600,
        "token_count_output": 500,
        "offset_minutes": 420
    },
    {
        "prompt_text": "Explain the difference between optimistic and pessimistic locking in PostgreSQL and when to use each in a high-concurrency booking system.",
        "category": "learning",
        "user_id": "dev2",
        "project": "DataPipeline",
        "ide_source": "cursor",
        "model_used": "gemini-flash",
        "response_summary": "Clear explanation with code examples for SELECT FOR UPDATE (pessimistic) and version column (optimistic) approaches.",
        "token_count_input": 450,
        "token_count_output": 330,
        "offset_minutes": 500
    },
    {
        "prompt_text": "Set up a GitHub Actions CI/CD pipeline with matrix testing for Node 18/20, Docker build and push to ECR, and automatic ECS deployment on main branch.",
        "category": "code_generation",
        "user_id": "dev1",
        "project": "PromptIQ",
        "ide_source": "vscode",
        "model_used": "claude-opus",
        "response_summary": "Complete workflow YAML with test, build, and deploy jobs. Includes AWS credential management and rollback strategy.",
        "token_count_input": 1100,
        "token_count_output": 1000,
        "offset_minutes": 600
    },
    {
        "prompt_text": "Generate boilerplate CRUD endpoints for a User resource in FastAPI with Pydantic v2 models, SQLAlchemy async, and proper error handling.",
        "category": "boilerplate",
        "user_id": "dev2",
        "project": "DataPipeline",
        "ide_source": "cursor",
        "model_used": "gpt-4o-mini",
        "response_summary": "Complete CRUD with router, schemas, service layer, and HTTP exception handling. Includes pagination.",
        "token_count_input": 850,
        "token_count_output": 600,
        "offset_minutes": 720
    },
    {
        "prompt_text": "Help me understand and fix this race condition in our WebSocket connection manager where simultaneous disconnects cause a ConcurrentModificationError.",
        "category": "debugging",
        "user_id": "dev2",
        "project": "DataPipeline",
        "ide_source": "cursor",
        "model_used": "claude-opus",
        "response_summary": "Identified dict mutation during iteration. Solution: asyncio.Lock + connection snapshot pattern.",
        "token_count_input": 1340,
        "token_count_output": 1000,
        "offset_minutes": 840
    },
    {
        "prompt_text": "Write API documentation in OpenAPI 3.0 format for our authentication endpoints including OAuth2, JWT refresh, and API key flows.",
        "category": "documentation",
        "user_id": "dev2",
        "project": "DataPipeline",
        "ide_source": "cursor",
        "model_used": "gpt-4o",
        "response_summary": "Complete OpenAPI spec with security schemes, request/response schemas, and example values.",
        "token_count_input": 980,
        "token_count_output": 700,
        "offset_minutes": 960
    },
    {
        "prompt_text": "Implement a Redis-backed rate limiter middleware for Express.js using sliding window algorithm with configurable limits per API key.",
        "category": "code_generation",
        "user_id": "dev2",
        "project": "DataPipeline",
        "ide_source": "cursor",
        "model_used": "gpt-4o",
        "response_summary": "Sliding window rate limiter with Redis sorted sets, configurable window and max requests, and proper headers.",
        "token_count_input": 1020,
        "token_count_output": 900,
        "offset_minutes": 1080
    },
    {
        "prompt_text": "Add ARIA labels, keyboard navigation, and screen reader support to our dropdown menu component built with Headless UI.",
        "category": "refactoring",
        "user_id": "dev1",
        "project": "PromptIQ",
        "ide_source": "vscode",
        "model_used": "claude-opus",
        "response_summary": "Added proper ARIA roles, keyboard handlers (Arrow/Escape/Enter), focus management, and live region announcements.",
        "token_count_input": 740,
        "token_count_output": 800,
        "offset_minutes": 1200
    },
    {
        "prompt_text": "Configure Terraform modules for a production AWS VPC with public/private subnets, NAT gateway, security groups, and VPC flow logs to CloudWatch.",
        "category": "code_generation",
        "user_id": "dev2",
        "project": "DataPipeline",
        "ide_source": "cursor",
        "model_used": "gpt-4o",
        "response_summary": "Modular Terraform with variables for CIDR blocks, AZ count, and tagging strategy. Includes outputs for subnet IDs.",
        "token_count_input": 1280,
        "token_count_output": 1400,
        "offset_minutes": 1320
    },
    {
        "prompt_text": "Implement input validation and sanitization for our Express API to prevent XSS, SQL injection, and prototype pollution attacks.",
        "category": "code_generation",
        "user_id": "dev1",
        "project": "PromptIQ",
        "ide_source": "vscode",
        "model_used": "claude-opus",
        "response_summary": "Middleware chain with express-validator, DOMPurify for HTML, parameterized queries, and prototype pollution guard.",
        "token_count_input": 1090,
        "token_count_output": 800,
        "offset_minutes": 1440
    },
    {
        "prompt_text": "Build a real-time collaborative text editor component using Yjs CRDT with WebSocket provider and awareness (cursor/selection sync).",
        "category": "code_generation",
        "user_id": "dev1",
        "project": "PromptIQ",
        "ide_source": "vscode",
        "model_used": "claude-opus",
        "response_summary": "Complete implementation with Yjs document, WebSocket provider, cursor awareness, undo/redo, and conflict-free merging.",
        "token_count_input": 1600,
        "token_count_output": 1600,
        "offset_minutes": 1560
    },
    {
        "prompt_text": "Create a Python script to migrate data from MongoDB to PostgreSQL, mapping nested documents to normalized tables with foreign key relationships.",
        "category": "code_generation",
        "user_id": "dev2",
        "project": "DataPipeline",
        "ide_source": "cursor",
        "model_used": "gpt-4o",
        "response_summary": "Migration script with pymongo reader, SQLAlchemy writer, document flattening, and batch insert with error recovery.",
        "token_count_input": 1100,
        "token_count_output": 1000,
        "offset_minutes": 1680
    },
    {
        "prompt_text": "Set up a machine learning pipeline with scikit-learn for customer churn prediction including feature engineering, model selection, and cross-validation.",
        "category": "code_generation",
        "user_id": "dev1",
        "project": "PromptIQ",
        "ide_source": "vscode",
        "model_used": "gpt-4o",
        "response_summary": "End-to-end pipeline with feature scaling, encoding, model comparison (RF, XGBoost, LR), GridSearchCV, and evaluation metrics.",
        "token_count_input": 1350,
        "token_count_output": 1400,
        "offset_minutes": 1800
    },
    {
        "prompt_text": "Generate TypeScript types and Zod validation schemas from our existing OpenAPI specification for the frontend API client.",
        "category": "boilerplate",
        "user_id": "dev1",
        "project": "PromptIQ",
        "ide_source": "vscode",
        "model_used": "gpt-4o-mini",
        "response_summary": "Generated 15 type interfaces and Zod schemas with proper optional fields and enum types.",
        "token_count_input": 480,
        "token_count_output": 500,
        "offset_minutes": 1920
    },
    {
        "prompt_text": "Write a comprehensive README.md for our open-source project including badges, installation, API reference, contributing guide, and architecture diagram in Mermaid.",
        "category": "documentation",
        "user_id": "dev2",
        "project": "DataPipeline",
        "ide_source": "cursor",
        "model_used": "gemini-flash",
        "response_summary": "Full README with shields.io badges, quickstart guide, API docs table, Mermaid architecture diagram, and MIT license.",
        "token_count_input": 600,
        "token_count_output": 500,
        "offset_minutes": 2040
    }
]

async def seed_database() -> int:
    """
    Ingests all SEED_PROMPTS.
    """
    logger.info("Starting database seeding...")
    memory = get_memory_service()
    
    # Initialize Cognee if not done
    await memory.initialize()
    
    # Clear local cache first to prevent duplicates
    _prompt_store.clear()
    
    count = 0
    now = datetime.utcnow()
    
    for prompt_info in SEED_PROMPTS:
        try:
            req = AnalyzePromptRequest(
                prompt_text=prompt_info["prompt_text"],
                user_id=prompt_info["user_id"],
                project=prompt_info["project"],
                ide_source=prompt_info["ide_source"],
                model_used=prompt_info["model_used"],
                response_summary=prompt_info["response_summary"],
                token_count_input=prompt_info["token_count_input"],
                token_count_output=prompt_info["token_count_output"]
            )
            
            # Submit through the full analyze route function
            response = await analyze_prompt(req)
            
            # Backdate in the local store so it builds a realistic timeline
            prompt_id = response.prompt_id
            if prompt_id in _prompt_store:
                backdated_time = now - timedelta(minutes=prompt_info["offset_minutes"])
                _prompt_store[prompt_id].created_at = backdated_time
                _prompt_store[prompt_id].updated_at = backdated_time
            
            count += 1
            logger.info("Successfully seeded prompt: %s", prompt_info["prompt_text"][:40])
            
        except Exception as exc:
            logger.error("Failed to seed prompt %s: %s", prompt_info["prompt_text"][:40], exc)
            
    # Trigger final cognify or improve to structure the graph
    try:
        await memory.refine_knowledge()
    except Exception as exc:
        logger.warning("Post-seed Cognee refine failed: %s", exc)
        
    logger.info("Seeding completed. Ingested %d / %d prompts.", count, len(SEED_PROMPTS))
    return count
