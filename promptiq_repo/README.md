# 🧠 PromptIQ

> **The Memory-Powered AI Governance Layer for Engineering Teams**
> Built with [Cognee](https://github.com/topoteretes/cognee) — the open-source AI memory platform.

---

## 🎯 What is PromptIQ?

PromptIQ is an intelligent AI gateway that sits between your engineering team and their AI coding tools (Claude Code, Cursor, Copilot, ChatGPT, Gemini, Codex). It captures every AI interaction, evaluates prompt quality, calculates AI necessity, routes prompts to optimal models, and generates ROI analytics — all powered by **Cognee's persistent memory**.

Unlike traditional logging tools, PromptIQ **remembers**. It builds a living knowledge graph of every developer's skills, prompt patterns, project contexts, and team knowledge using Cognee's memory lifecycle APIs.

## 🧠 Cognee Integration Highlights

PromptIQ uses **every major Cognee API**:

| Cognee API | PromptIQ Feature |
|---|---|
| `cognee.remember()` | Stores prompts, skills, and learning events as graph nodes |
| `cognee.recall()` | Powers necessity scoring, model routing, and analytics queries |
| `cognee.improve()` | Nightly job that refines the knowledge graph |
| `cognee.forget()` | GDPR-compliant user data deletion |
| `cognee.cognify()` | Extracts entities and relationships during ingestion |

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- An OpenAI API key (for Cognee's LLM)

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/promptiq.git
cd promptiq/app_build

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Launch everything
docker-compose up --build
```

- **Dashboard**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

### Option 2: Local Development

**Backend:**
```bash
cd app_build/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd app_build/frontend
npm install
npm run dev
```

## 📡 MCP Server

PromptIQ exposes an MCP (Model Context Protocol) server for IDE integration:

```bash
cd app_build/backend
python -m app.mcp.server
```

**Available Tools:**
- `analyze_prompt` — Full analysis pipeline
- `store_memory` — Store data in Cognee
- `recall_memory` — Query the knowledge graph
- `recommend_model` — Get optimal model recommendation
- `calculate_necessity` — Compute AI necessity score
- `get_skill_profile` — Retrieve developer skills
- `get_analytics` — Get usage analytics

## 🏗️ Architecture

```
PromptIQ
├── backend/          # FastAPI + Cognee (Python)
│   ├── app/
│   │   ├── services/
│   │   │   ├── cognee_memory.py    # 🧠 Core Cognee wrapper
│   │   │   ├── prompt_analyzer.py  # Prompt classification
│   │   │   ├── necessity_scorer.py # AI necessity scoring
│   │   │   ├── model_router.py     # Intelligent routing
│   │   │   ├── skill_tracker.py    # Skill evolution
│   │   │   └── learning_recommender.py
│   │   ├── api/routes/             # REST endpoints
│   │   └── mcp/server.py          # MCP tool server
│   └── requirements.txt
├── frontend/         # Next.js 14 Dashboard
│   ├── app/          # App Router pages
│   ├── components/   # UI + chart components
│   └── lib/api.ts    # Typed API client
└── docker-compose.yml
```

## 📊 Features

- **Prompt Analysis**: Complexity, category, and skill domain classification
- **AI Necessity Scoring**: 0-100 score powered by Cognee's graph reasoning
- **Model Routing**: Intelligent model selection based on historical performance
- **Analytics Dashboard**: Cost tracking, usage trends, and team insights
- **Skill Tracking**: Developer competency mapping and growth timelines
- **Memory Explorer**: Visual Cognee knowledge graph browser
- **MCP Integration**: Use PromptIQ directly from your IDE

## 🏆 Hackathon: Best Use of Cognee

PromptIQ was built for the Cognee Hackathon with a singular focus: **Cognee is not a bolt-on — it IS the product.** Every feature flows through Cognee's memory APIs:

1. **remember()** stores every prompt, skill update, and learning event
2. **recall()** powers every intelligent query — necessity scores, model routing, skill profiles
3. **improve()** continuously refines the knowledge graph
4. **forget()** ensures GDPR compliance

## 📝 License

MIT
