# 🧠 PromptIQ — Technical Specification

> **The Memory-Powered AI Governance Layer for Engineering Teams**
> *Cognee Hackathon Submission*

---

## Executive Summary

PromptIQ is an intelligent AI gateway that sits between engineering teams and their AI coding tools (Claude Code, Cursor, Copilot, ChatGPT, Gemini, Codex). It captures every AI interaction, evaluates prompt quality, calculates AI necessity, routes prompts to optimal models, and generates ROI analytics — all powered by **Cognee as the persistent memory backbone**.

Unlike traditional logging or monitoring tools, PromptIQ **remembers**. It builds a living knowledge graph of every developer's skills, prompt patterns, project contexts, and team knowledge using Cognee's `remember → recall → improve → forget` memory lifecycle. This means PromptIQ doesn't just track data — it *learns* from it and gets smarter over time.

### Why Cognee is Central

Cognee is not a "nice-to-have" in PromptIQ — it **IS** the intelligence layer. Every core feature depends on Cognee's memory APIs:

| Feature | Cognee API Used | Why Cognee |
|---|---|---|
| Prompt History | `cognee.remember()` | Persists prompts as structured graph nodes with relationships |
| Skill Tracking | `cognee.remember()` + `cognee.cognify()` | Extracts skill entities and tracks evolution over time |
| Similar Prompt Detection | `cognee.recall()` | Hybrid vector+graph search finds semantically similar past prompts |
| Necessity Scoring | `cognee.recall()` | Retrieves developer history to compute AI necessity |
| Model Routing | `cognee.recall()` | Queries historical success rates per model per complexity tier |
| Learning Recommendations | `cognee.recall()` + graph traversal | Identifies skill gaps from recurring prompt patterns |
| Data Cleanup / GDPR | `cognee.forget()` | Cleanly removes user data from graph and vector stores |
| Knowledge Refinement | `cognee.improve()` | Periodically enriches the knowledge graph with derived insights |

---

## Requirements

### Functional Requirements

#### FR-1: Prompt Capture & Ingestion
The system shall capture AI interactions including:
- **Prompt text** (the user's query)
- **Response summary** (AI's answer, truncated)
- **Timestamp**, **User ID**, **Project/Repo**, **IDE Source**, **Model Used**
- **Token count** (input + output)
- **Estimated cost** (calculated from model pricing)

**Cognee Integration:** Each captured prompt is immediately stored via `cognee.remember()` with structured metadata, creating nodes in the knowledge graph linked to the developer, project, and skill domain entities.

#### FR-2: Prompt Analysis Engine
The system shall analyze each prompt for:
- **Complexity Score** (1-10): Based on token count, concept density, multi-step reasoning
- **Category**: `code_generation`, `debugging`, `refactoring`, `documentation`, `architecture`, `learning`, `boilerplate`
- **Skill Domain**: `frontend`, `backend`, `database`, `devops`, `testing`, `security`, `ml/ai`
- **Estimated Manual Time**: How long this task would take a developer manually
- **Estimated AI Cost**: Token cost at current model pricing

**Cognee Integration:** Analysis results are fed back into `cognee.remember()` to enrich the prompt node with structured attributes. Over time, `cognee.improve()` refines category accuracy by learning from correction patterns.

#### FR-3: AI Necessity Scoring
The system shall compute an **AI Necessity Score (0-100)** for each prompt:
- **0-30**: Developer likely knows this — suggest self-solve
- **31-70**: AI can help but developer should learn — suggest with learning resources
- **71-100**: Highly complex — AI is the right tool

**Factors** (retrieved via `cognee.recall()`):
- Developer's historical performance in this skill domain
- Frequency of similar past prompts
- Complexity relative to developer's experience level
- Time since developer last solved similar problems independently

**Cognee Integration:** This is where Cognee's graph reasoning shines. The system performs a multi-hop graph traversal: `Developer → has_skill → SkillDomain → related_prompts → similar_to → current_prompt`, using both vector similarity and graph structure to compute the score.

#### FR-4: Organizational Memory (Cognee Core)
The system shall maintain a **living knowledge graph** via Cognee containing:

```
Developer ──has_skill──► SkillNode ──belongs_to──► SkillDomain
    │                        │
    │──submitted──►  PromptNode ──categorized_as──► Category
    │                    │
    │                    │──part_of──► ProjectNode
    │                    │──used_model──► ModelNode
    │                    │──similar_to──► PromptNode (other)
    │
    │──learned──► LearningEvent ──triggered_by──► PromptPattern
```

**Memory Operations:**
- `cognee.remember(prompt_data)` — Store new interactions with full context
- `cognee.recall("What skills does developer X have?")` — Natural language queries over the graph
- `cognee.recall("Find similar prompts to: {text}")` — Semantic + structural similarity search
- `cognee.improve()` — Periodic background job to refine graph structure, add summaries, and strengthen connections
- `cognee.forget(user_id=X)` — GDPR-compliant complete data removal

#### FR-5: Memory Recall & Querying
The system shall support natural-language queries against Cognee's memory:
- "What skills does developer X know?"
- "What topics repeat frequently for team Y?"
- "What projects were completed this quarter?"
- "Which tasks are repetitive across the team?"
- "What model works best for React debugging prompts?"

**Cognee Integration:** Uses `cognee.recall()` which performs hybrid search — combining vector embeddings for semantic relevance with graph traversal for structural accuracy. This enables multi-hop reasoning that pure vector search cannot achieve.

#### FR-6: Intelligent Model Routing
The system shall recommend the optimal AI model for each prompt:

| Tier | Criteria | Recommended Model |
|---|---|---|
| **Local** | Simple, boilerplate, low complexity | Ollama / Local LLM |
| **Mid-tier** | Standard code generation | Gemini Flash / GPT-4o-mini |
| **Premium** | Complex architecture, debugging | Claude Opus / GPT-4o |
| **Specialized** | Code completion, inline | Copilot / Codex |

**Cognee Integration:** Model routing queries `cognee.recall()` for historical success rates — "For prompts similar to X, which model produced accepted results?" The knowledge graph tracks `PromptNode ──used_model──► ModelNode ──resulted_in──► Outcome` edges.

#### FR-7: Dashboard & Analytics
The system shall provide a web dashboard showing:
- **Cost Center**: Total AI spend, cost per developer, cost per project, savings generated
- **Usage Trends**: Prompts per day/week/month, model distribution, category breakdown
- **Team Heatmap**: Which skill domains are most AI-dependent
- **Prompt Quality Index**: Average prompt complexity, improvement trends
- **Cognee Memory Health**: Graph node count, relationship density, recall accuracy

#### FR-8: Learning Recommendations
The system shall surface learning recommendations based on recurring prompt patterns:
- If a developer repeatedly asks AI for React state management → suggest React course
- If a team consistently uses AI for SQL queries → recommend SQL training

**Cognee Integration:** `cognee.recall()` identifies skill gap patterns through graph analysis: `Developer ──submitted──► [many PromptNodes] ──categorized_as──► same SkillDomain` triggers a learning recommendation node creation via `cognee.remember()`.

#### FR-9: Skill Growth Tracking
The system shall maintain per-developer skill timelines:
- Skill level progression over time
- Competency scores per domain
- Learning velocity (rate of skill acquisition)
- AI dependency trend (increasing or decreasing reliance)

**Cognee Integration:** Skill evolution is tracked as temporal edges in the graph: `Developer ──had_skill_at(timestamp)──► SkillLevel`. `cognee.improve()` periodically recalculates skill assessments.

#### FR-10: MCP Tool Interface
The system shall expose an **MCP (Model Context Protocol) server** with tools:
- `analyze_prompt(text, user_id, project)` — Full analysis pipeline
- `store_memory(data, context)` — Direct memory storage via Cognee
- `recall_memory(query)` — Natural language memory retrieval
- `recommend_model(prompt_text)` — Get optimal model recommendation
- `calculate_necessity(prompt_text, user_id)` — Get necessity score
- `get_skill_profile(user_id)` — Retrieve developer's skill graph
- `get_analytics(timeframe, scope)` — Retrieve usage analytics

---

### Non-Functional Requirements

| Requirement | Target | Implementation |
|---|---|---|
| Response Time | < 2 seconds | FastAPI async handlers, Cognee async API |
| Memory Retrieval | < 3 seconds | Cognee's hybrid vector+graph search |
| Availability | > 99% | Docker deployment, health checks |
| Deployability | Docker-first | Single `docker-compose up` |
| Scalability | Horizontal | Stateless API, Cognee handles state |
| Security | API key auth | JWT tokens, API key middleware |
| GDPR | Right to deletion | `cognee.forget()` per user/dataset |
| Observability | Full traces | Structured logging, Cognee metrics |

---

## Architecture & Tech Stack

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PromptIQ System                       │
│                                                         │
│  ┌──────────────┐    ┌──────────────────────────────┐   │
│  │   Frontend    │    │     MCP Server (Python)      │   │
│  │   (Next.js)   │◄──►│  analyze_prompt              │   │
│  │              │    │  store_memory                 │   │
│  │  Dashboard    │    │  recall_memory               │   │
│  │  Analytics    │    │  recommend_model             │   │
│  │  Skill Graphs │    │  calculate_necessity         │   │
│  └──────┬───────┘    └──────────┬───────────────────┘   │
│         │                       │                        │
│         ▼                       ▼                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │              FastAPI Backend (Python)             │   │
│  │                                                    │   │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────────┐  │   │
│  │  │  Prompt    │ │ Necessity  │ │   Model      │  │   │
│  │  │  Analyzer  │ │  Scorer    │ │   Router     │  │   │
│  │  └─────┬──────┘ └─────┬──────┘ └──────┬───────┘  │   │
│  │        │               │               │          │   │
│  │        ▼               ▼               ▼          │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │          Cognee Memory Service             │   │   │
│  │  │                                            │   │   │
│  │  │  remember()  recall()  improve()  forget() │   │   │
│  │  │                                            │   │   │
│  │  │  ┌─────────────┐    ┌─────────────────┐   │   │   │
│  │  │  │ Knowledge   │    │   Vector Store   │   │   │   │
│  │  │  │   Graph     │    │   (LanceDB)      │   │   │   │
│  │  │  │ (NetworkX/  │    │                   │   │   │   │
│  │  │  │  SQLite)    │    │   Embeddings for  │   │   │   │
│  │  │  │             │    │   semantic search │   │   │   │
│  │  │  └─────────────┘    └─────────────────┘   │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Justification |
|---|---|---|
| **Memory Engine** | **Cognee** (`pip install cognee`) | 🏆 **THE** core dependency. Persistent knowledge graph + vector search. Entire intelligence layer. |
| **Backend API** | **FastAPI** (Python 3.11+) | Async-native, perfect match for Cognee's async API. OpenAPI auto-docs. |
| **Frontend** | **Next.js 14** (React + TypeScript) | SSR dashboard, API routes as BFF, modern UI with App Router. |
| **Styling** | **Tailwind CSS** + **shadcn/ui** | Premium, consistent design system for analytics dashboards. |
| **Charts** | **Recharts** | React-native charting for analytics visualizations. |
| **MCP Server** | **Python MCP SDK** | Exposes tools for IDE integration. |
| **Database** | **SQLite** (via Cognee defaults) | Zero-config, embedded. Cognee manages its own storage. |
| **Vector Store** | **LanceDB** (via Cognee defaults) | Cognee's default embedded vector store. Zero external dependencies. |
| **Auth** | **API Key + JWT** | Simple but effective for MVP. |
| **Deployment** | **Docker + docker-compose** | Single command deployment. |

### Why This Stack Maximizes Cognee Usage

1. **Cognee IS the database** — No separate PostgreSQL or MongoDB. All persistent state flows through Cognee's `remember()` / `recall()` APIs.
2. **Cognee IS the search engine** — No Elasticsearch or Algolia. Cognee's hybrid vector+graph search handles all queries.
3. **Cognee IS the analytics engine** — Skill trends, usage patterns, and model performance all derived from graph traversals.
4. **Cognee IS the AI brain** — Necessity scoring and model routing use Cognee's `recall()` for intelligent, context-aware decisions.

---

## State Management & Data Flow

### Data Flow: Prompt Lifecycle

```
Developer uses AI Tool
        │
        ▼
   PromptIQ Capture (API endpoint or MCP tool)
        │
        ▼
   Prompt Analyzer
   ├── Classify complexity (1-10)
   ├── Categorize (code_gen, debug, etc.)
   ├── Identify skill domain
   └── Estimate cost & manual time
        │
        ▼
   cognee.remember(prompt_data)
   ├── Creates PromptNode in knowledge graph
   ├── Links to DeveloperNode, ProjectNode, SkillNode
   ├── Generates vector embeddings for similarity search
   └── Triggers relationship extraction via cognify
        │
        ▼
   cognee.recall() — Retrieve Context
   ├── Find similar past prompts (vector search)
   ├── Get developer skill history (graph traversal)
   └── Get model performance data (graph query)
        │
        ▼
   Necessity Scorer + Model Router
   ├── Compute AI Necessity Score (0-100)
   └── Recommend optimal model
        │
        ▼
   Return enriched response to developer
   ├── Analysis results
   ├── Necessity score + recommendation
   ├── Suggested model
   └── Learning recommendations (if applicable)
```

### Cognee Session Management

```python
# Short-term session memory (per-interaction context)
await cognee.remember(
    prompt_text,
    session_id=f"user_{user_id}_session_{session_id}"
)

# Long-term organizational memory (permanent graph)
await cognee.remember(
    structured_prompt_data,
    dataset_name=f"org_{org_id}_prompts"
)

# Periodic knowledge refinement (background job)
await cognee.improve()  # Enriches graph with derived insights
```

### Frontend State (Next.js)

- **Server Components**: Dashboard pages fetch data from FastAPI at request time
- **Client State**: React Query for caching + real-time updates
- **URL State**: Search filters, date ranges, user selections persisted in URL params

---

## Project Structure

```
promptiq/
├── backend/                    # Python FastAPI + Cognee
│   ├── app/
│   │   ├── main.py             # FastAPI app entry point
│   │   ├── config.py           # Environment config
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── prompts.py   # Prompt capture & analysis endpoints
│   │   │   │   ├── memory.py    # Cognee memory endpoints
│   │   │   │   ├── analytics.py # Dashboard data endpoints
│   │   │   │   ├── skills.py    # Skill tracking endpoints
│   │   │   │   └── models.py    # Model routing endpoints
│   │   │   └── middleware/
│   │   │       └── auth.py      # API key authentication
│   │   ├── services/
│   │   │   ├── cognee_memory.py # 🧠 Cognee wrapper service
│   │   │   ├── prompt_analyzer.py
│   │   │   ├── necessity_scorer.py
│   │   │   ├── model_router.py
│   │   │   ├── skill_tracker.py
│   │   │   └── learning_recommender.py
│   │   ├── models/
│   │   │   ├── prompt.py        # Pydantic models
│   │   │   ├── developer.py
│   │   │   ├── skill.py
│   │   │   └── analytics.py
│   │   └── mcp/
│   │       └── server.py        # MCP tool server
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                   # Next.js Dashboard
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Dashboard home
│   │   ├── prompts/
│   │   │   └── page.tsx        # Prompt history & analysis
│   │   ├── analytics/
│   │   │   └── page.tsx        # Cost & usage analytics
│   │   ├── skills/
│   │   │   └── page.tsx        # Skill growth tracking
│   │   ├── memory/
│   │   │   └── page.tsx        # Cognee memory explorer
│   │   └── settings/
│   │       └── page.tsx        # Configuration
│   ├── components/
│   │   ├── ui/                 # shadcn components
│   │   ├── charts/             # Analytics charts
│   │   ├── prompt-card.tsx
│   │   ├── skill-radar.tsx
│   │   ├── necessity-gauge.tsx
│   │   └── memory-graph.tsx    # 🧠 Cognee graph visualizer
│   ├── lib/
│   │   └── api.ts              # API client
│   ├── package.json
│   ├── Dockerfile
│   └── tailwind.config.ts
│
├── docker-compose.yml          # One-command deployment
├── .env.example
└── README.md
```

---

## Cognee Integration Deep Dive

### CogneeMemoryService (Core Service)

This is the central service that wraps all Cognee operations. Every other service depends on it.

```python
# backend/app/services/cognee_memory.py (Conceptual API Surface)

class CogneeMemoryService:
    """The brain of PromptIQ — wraps Cognee's memory lifecycle."""

    async def store_prompt(self, prompt: PromptData) -> None:
        """remember() — Ingest a new prompt into the knowledge graph."""
        structured_data = self._format_for_cognee(prompt)
        await cognee.remember(structured_data, dataset_name=f"org_{prompt.org_id}")

    async def find_similar_prompts(self, text: str, limit: int = 5) -> list:
        """recall() — Semantic + graph search for similar past prompts."""
        return await cognee.recall(f"Find prompts similar to: {text}")

    async def get_developer_skills(self, user_id: str) -> dict:
        """recall() — Multi-hop graph query for developer skill profile."""
        return await cognee.recall(f"What skills does developer {user_id} have?")

    async def get_model_performance(self, category: str) -> dict:
        """recall() — Historical model success rates for a category."""
        return await cognee.recall(
            f"Which AI model has the best success rate for {category} tasks?"
        )

    async def refine_knowledge(self) -> None:
        """improve() — Background job to enrich the knowledge graph."""
        await cognee.improve()

    async def delete_user_data(self, user_id: str) -> None:
        """forget() — GDPR-compliant data removal."""
        await cognee.forget(dataset=f"user_{user_id}")

    async def get_learning_gaps(self, user_id: str) -> list:
        """recall() — Identify skill gaps from prompt patterns."""
        return await cognee.recall(
            f"What topics does developer {user_id} repeatedly ask AI about "
            f"that they should learn independently?"
        )
```

### Cognee API Usage Map

| Cognee API | PromptIQ Usage | Frequency |
|---|---|---|
| `cognee.remember()` | Every prompt capture, skill updates, learning events | Per-request |
| `cognee.recall()` | Necessity scoring, model routing, analytics queries, skill profiles | Per-request |
| `cognee.cognify()` | Extract entities/relationships during prompt ingestion | Per-request (via remember) |
| `cognee.improve()` | Nightly batch job to refine graph, add summaries | Scheduled (cron) |
| `cognee.forget()` | User data deletion, old data cleanup | On-demand |

---

## MVP Scope (Hackathon Build)

### Phase 1 — Hackathon Deliverables ✅

1. **Prompt Capture API** → FastAPI endpoint + `cognee.remember()`
2. **Prompt Analysis** → Complexity, category, skill domain classification
3. **Necessity Scoring** → AI Necessity Score powered by `cognee.recall()`
4. **Model Routing** → Intelligent model recommendation via memory
5. **Analytics Dashboard** → Next.js dashboard with cost, usage, and skill charts
6. **Cognee Memory Explorer** → Visual graph explorer showing the knowledge graph
7. **MCP Server** → 5 tools for IDE integration
8. **Docker Deployment** → `docker-compose up` and go

### Phase 2 — Post-Hackathon 🔮

- Team management & multi-org support
- IDE plugins (VS Code extension)
- Real-time WebSocket streaming
- Advanced RBAC & SSO
- Custom ontology support in Cognee
- Automated learning path generation

---

## Success Criteria (Hackathon Judging Alignment)

| Criterion | How PromptIQ Excels |
|---|---|
| **Best Use of Cognee** | Cognee powers ALL 5 core features — it's not a bolt-on, it IS the product |
| **Potential Impact** | Solves a $50B+ problem: AI cost governance for engineering teams |
| **Technical Excellence** | Clean async Python, typed APIs, Docker deployment |
| **Creativity & Innovation** | First AI Governance tool with persistent memory — "AI that remembers your team" |
| **User Experience** | Premium Next.js dashboard with real-time analytics |
| **Presentation Quality** | Live demo: submit prompt → see graph grow → get intelligent routing |

---

> **NOTE**: This specification is designed to maximize Cognee integration depth. Every feature touches Cognee's APIs. The knowledge graph is not just storage — it's the reasoning engine behind necessity scoring, model routing, and learning recommendations.
