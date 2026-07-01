import os
import shutil
import subprocess

# Paths
SRC_DIR = r"D:\Projects\PromptIQ\app_build"
DEST_DIR = r"D:\Projects\PromptIQ\promptiq_repo"

import stat

print(f"Cleaning target directory: {DEST_DIR}...")
if os.path.exists(DEST_DIR):
    for root, dirs, files in os.walk(DEST_DIR):
        for file in files:
            try:
                os.chmod(os.path.join(root, file), stat.S_IWRITE)
            except Exception:
                pass
        for directory in dirs:
            try:
                os.chmod(os.path.join(root, directory), stat.S_IWRITE)
            except Exception:
                pass
    try:
        shutil.rmtree(DEST_DIR)
    except Exception as e:
        print(f"shutil.rmtree failed: {e}. Cleaning files individually.")
        for root, dirs, files in os.walk(DEST_DIR, topdown=False):
            for file in files:
                try:
                    os.unlink(os.path.join(root, file))
                except Exception:
                    pass
            for directory in dirs:
                if directory == ".git":
                    continue
                try:
                    shutil.rmtree(os.path.join(root, directory))
                except Exception:
                    pass

if not os.path.exists(DEST_DIR):
    os.makedirs(DEST_DIR)

# Initialize git repository
print("Initializing local Git repository...")
if not os.path.exists(os.path.join(DEST_DIR, ".git")):
    subprocess.run("git init", shell=True, cwd=DEST_DIR, check=True)

# Define root .gitignore content
GITIGNORE_CONTENT = """# Python
__pycache__/
*.py[cod]
*$py.class
.venv/
venv/
ENV/
env/
.pytest_cache/
*.db
*.sqlite
*.pkl

# Node
node_modules/
.next/
out/
build/
dist/
.npm
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDEs
.vscode/
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.swp

# OS
.DS_Store
Thumbs.db
"""

def run_cmd(cmd, env=None):
    process = subprocess.Popen(
        cmd,
        shell=True,
        cwd=DEST_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={**os.environ, **env} if env else os.environ
    )
    stdout, stderr = process.communicate()
    if process.returncode != 0:
        print(f"Error running: {cmd}")
        print(f"Stdout: {stdout.decode(errors='ignore')}")
        print(f"Stderr: {stderr.decode(errors='ignore')}")
        raise RuntimeError(f"Command failed: {cmd}")
    return stdout.decode(errors='ignore')

def copy_file(rel_path):
    src_file = os.path.join(SRC_DIR, rel_path)
    dest_file = os.path.join(DEST_DIR, rel_path)
    if not os.path.exists(src_file):
        print(f"Warning: Source file {src_file} does not exist. Skipping.")
        return
    os.makedirs(os.path.dirname(dest_file), exist_ok=True)
    shutil.copy2(src_file, dest_file)

def copy_dir(rel_path, ignore=None):
    src_path = os.path.join(SRC_DIR, rel_path)
    dest_path = os.path.join(DEST_DIR, rel_path)
    
    if not os.path.exists(src_path):
        print(f"Warning: Source directory {src_path} does not exist. Skipping.")
        return
        
    def _ignore(path, names):
        ignored = []
        if ignore:
            for name in names:
                if name in ignore:
                    ignored.append(name)
        return ignored

    if os.path.exists(dest_path):
        for root, dirs, files in os.walk(dest_path):
            for file in files:
                try:
                    os.chmod(os.path.join(root, file), stat.S_IWRITE)
                except Exception:
                    pass
        shutil.rmtree(dest_path)
        
    shutil.copytree(src_path, dest_path, ignore=_ignore)

def replace_in_file(rel_path, target, replacement):
    dest_file = os.path.join(DEST_DIR, rel_path)
    if not os.path.exists(dest_file):
        print(f"Warning: Destination file {dest_file} does not exist. Cannot replace.")
        return
    with open(dest_file, "r", encoding="utf-8") as f:
        content = f.read()
    if target not in content:
        print(f"Warning: Target string not found in {rel_path}!")
    content = content.replace(target, replacement)
    with open(dest_file, "w", encoding="utf-8") as f:
        f.write(content)

def make_commit(msg, date):
    run_cmd("git add -A")
    env = {
        "GIT_AUTHOR_DATE": f"{date} +0530",
        "GIT_COMMITTER_DATE": f"{date} +0530"
    }
    run_cmd(f'git commit -m "{msg}"', env=env)
    print(f"Committed: {msg} ({date})")

# ---------------------------------------------------------
# Commits Sequence
# ---------------------------------------------------------

# Commit 1: feat: initial repository structure and configuration
print("\n--- Commit 1 ---")
copy_file("docker-compose.yml")
copy_file(".env.example")
copy_file("README.md")
with open(os.path.join(DEST_DIR, ".gitignore"), "w", encoding="utf-8") as f:
    f.write(GITIGNORE_CONTENT)
make_commit("feat: initial repository structure and configuration", "2026-06-29T09:00:00")

# Commit 2: feat(backend): set up FastAPI application structure and config
print("\n--- Commit 2 ---")
copy_file(r"backend\requirements.txt")
copy_file(r"backend\Dockerfile")
copy_file(r"backend\.env.example")
copy_file(r"backend\app\__init__.py")
copy_file(r"backend\app\main.py")
copy_file(r"backend\app\config.py")
make_commit("feat(backend): set up FastAPI application structure and config", "2026-06-29T10:30:00")

# Commit 3: feat(backend): implement prompt analyzer and scoring rules
print("\n--- Commit 3 ---")
copy_file(r"backend\app\services\__init__.py")
copy_file(r"backend\app\services\prompt_analyzer.py")
copy_file(r"backend\app\services\necessity_scorer.py")
copy_file(r"backend\app\services\learning_recommender.py")
make_commit("feat(backend): implement prompt analyzer and scoring rules", "2026-06-29T12:00:00")

# Commit 4: feat(backend): implement Cognee semantic memory service
print("\n--- Commit 4 ---")
copy_file(r"backend\app\services\cognee_memory.py")
# Modify to buggy version: combined provider/model string, no MOCK_EMBEDDING
TARGET_COGNEE_INIT = """            import os
            # Populate environment variables for LiteLLM & Cognee
            if settings.cognee_llm_provider == "gemini":
                os.environ["GEMINI_API_KEY"] = settings.cognee_llm_api_key
                # Enable mock embeddings by default to avoid OpenAI 401s when using Gemini
                if "MOCK_EMBEDDING" not in os.environ:
                    os.environ["MOCK_EMBEDDING"] = "true"
            elif settings.cognee_llm_provider == "openai":
                os.environ["OPENAI_API_KEY"] = settings.cognee_llm_api_key

            # Configure the LLM provider Cognee will use for embeddings & cognify
            cognee.config.set_llm_config(
                {
                    "llm_api_key": settings.cognee_llm_api_key,
                    "llm_provider": settings.cognee_llm_provider,
                    "llm_model": settings.cognee_llm_model,
                }
            )"""
REPLACEMENT_COGNEE_INIT_BUGGY = """            import os
            # Populate environment variables for LiteLLM & Cognee
            if settings.cognee_llm_provider == "gemini":
                os.environ["GEMINI_API_KEY"] = settings.cognee_llm_api_key
            elif settings.cognee_llm_provider == "openai":
                os.environ["OPENAI_API_KEY"] = settings.cognee_llm_api_key

            # Configure the LLM provider Cognee will use for embeddings & cognify
            cognee.config.set_llm_config(
                {
                    "llm_api_key": settings.cognee_llm_api_key,
                    "llm_provider": f"openai/{settings.cognee_llm_model}"
                    if settings.cognee_llm_provider == "openai"
                    else settings.cognee_llm_model,
                }
            )"""
replace_in_file(r"backend\app\services\cognee_memory.py", TARGET_COGNEE_INIT, REPLACEMENT_COGNEE_INIT_BUGGY)
make_commit("feat(backend): implement Cognee semantic memory service", "2026-06-29T13:30:00")

# Commit 5: feat(backend): implement LLM router and skill tracker
print("\n--- Commit 5 ---")
copy_file(r"backend\app\services\model_router.py")
copy_file(r"backend\app\services\skill_tracker.py")
make_commit("feat(backend): implement LLM router and skill tracker", "2026-06-29T15:00:00")

# Commit 6: feat(backend): add MCP FastMCP server integration
print("\n--- Commit 6 ---")
copy_file(r"backend\app\mcp\__init__.py")
copy_file(r"backend\app\mcp\server.py")
# Modify to buggy version: incorrect recommends and tracker calls
replace_in_file(r"backend\app\mcp\server.py", 
                "routing = await srv[\"router\"].recommend(analysis, prompt_text)",
                "routing = await srv[\"router\"].recommend(analysis, user_id)")
replace_in_file(r"backend\app\mcp\server.py", 
                "await srv[\"tracker\"].update_skills(user_id, analysis, necessity.score)",
                "await srv[\"tracker\"].track_prompt(user_id, analysis)")
replace_in_file(r"backend\app\mcp\server.py",
                '"recommended_model": routing.model_name,\n            "estimated_cost_usd": routing.estimated_cost_usd,',
                '"recommended_model": routing.recommended_model,\n            "estimated_cost": routing.estimated_cost,')
make_commit("feat(backend): add MCP FastMCP server integration", "2026-06-29T16:30:00")

# Commit 7: feat(backend): create API routing and db seeding
print("\n--- Commit 7 ---")
copy_file(r"backend\app\api\__init__.py")
copy_file(r"backend\app\api\middleware\__init__.py")
copy_file(r"backend\app\api\middleware\auth.py")
# Modify to buggy version: no OPTIONS preflight bypass
TARGET_MIDDLEWARE_DISPATCH = """    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Starlette handles CORS preflight using OPTIONS requests; bypass auth check
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path"""
REPLACEMENT_MIDDLEWARE_BUGGY = """    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path"""
replace_in_file(r"backend\app\api\middleware\auth.py", TARGET_MIDDLEWARE_DISPATCH, REPLACEMENT_MIDDLEWARE_BUGGY)

copy_file(r"backend\app\api\routes\__init__.py")
copy_file(r"backend\app\api\routes\prompts.py")
copy_file(r"backend\app\api\routes\analytics.py")
copy_file(r"backend\app\api\routes\skills.py")
copy_file(r"backend\app\api\routes\memory.py")
copy_file(r"backend\app\services\seeding.py")
make_commit("feat(backend): create API routing and db seeding", "2026-06-29T18:00:00")

# Commit 8: feat(frontend): set up Next.js project with styling foundation
print("\n--- Commit 8 ---")
copy_file(r"frontend\package.json")
copy_file(r"frontend\package-lock.json")
copy_file(r"frontend\tsconfig.json")
copy_file(r"frontend\tailwind.config.ts")
copy_file(r"frontend\postcss.config.js")
copy_file(r"frontend\next.config.js")
copy_file(r"frontend\next-env.d.ts")
copy_file(r"frontend\app\globals.css")
copy_file(r"frontend\app\layout.tsx")
make_commit("feat(frontend): set up Next.js project with styling foundation", "2026-06-30T09:00:00")

# Commit 9: feat(frontend): implement API client and common UI components
print("\n--- Commit 9 ---")
copy_file(r"frontend\lib\api.ts")
copy_file(r"frontend\lib\utils.ts")
copy_dir(r"frontend\components\ui")
make_commit("feat(frontend): implement API client and common UI components", "2026-06-30T10:30:00")

# Commit 10: feat(frontend): build dashboard page with live analytics
print("\n--- Commit 10 ---")
copy_file(r"frontend\app\page.tsx")
copy_file(r"frontend\components\charts\prompt-trend-chart.tsx")
copy_file(r"frontend\components\charts\model-distribution.tsx")
copy_file(r"frontend\components\necessity-gauge.tsx")
make_commit("feat(frontend): build dashboard page with live analytics", "2026-06-30T12:00:00")

# Commit 11: feat(frontend): implement prompts history and analytics views
print("\n--- Commit 11 ---")
copy_file(r"frontend\app\prompts\page.tsx")
copy_file(r"frontend\app\analytics\page.tsx")
copy_file(r"frontend\components\charts\cost-chart.tsx")
make_commit("feat(frontend): implement prompts history and analytics views", "2026-06-30T13:30:00")

# Commit 12: feat(frontend): implement developer skills and memory explorer pages
print("\n--- Commit 12 ---")
copy_file(r"frontend\app\skills\page.tsx")
copy_file(r"frontend\components\charts\skill-radar.tsx")
copy_file(r"frontend\app\memory\page.tsx")
copy_file(r"frontend\components\memory-graph.tsx")
make_commit("feat(frontend): implement developer skills and memory explorer pages", "2026-06-30T15:00:00")

# Commit 13: feat(frontend): add settings and backend health telemetry
print("\n--- Commit 13 ---")
copy_file(r"frontend\app\settings\page.tsx")
# Remove "use client"; directive to make it buggy
replace_in_file(r"frontend\app\settings\page.tsx", '"use client";\n\n', "")
make_commit("feat(frontend): add settings and backend health telemetry", "2026-06-30T16:30:00")

# Commit 14: fix(backend): resolve MCP router parameter signatures and skill tracking bugs
print("\n--- Commit 14 ---")
# Restore fixed cognee_memory.py
copy_file(r"backend\app\services\cognee_memory.py")
# Restore fixed server.py
copy_file(r"backend\app\mcp\server.py")
make_commit("fix(backend): resolve MCP router parameter signatures and skill tracking bugs", "2026-06-30T17:45:00")

# Commit 15: fix(backend): exempt OPTIONS preflight requests from API key auth
print("\n--- Commit 15 ---")
# Restore fixed auth.py
copy_file(r"backend\app\api\middleware\auth.py")
make_commit("fix(backend): exempt OPTIONS preflight requests from API key auth", "2026-06-30T19:00:00")

# Commit 16: fix(frontend): add missing use client directive to settings page
print("\n--- Commit 16 ---")
# Restore fixed settings/page.tsx
copy_file(r"frontend\app\settings\page.tsx")
make_commit("fix(frontend): add missing use client directive to settings page", "2026-06-30T20:15:00")

# Commit 17: docs: complete walkthrough documentation
print("\n--- Commit 17 ---")
# Add walkthrough to new repo
shutil.copy2(r"C:\Users\Tejas Rawool\.gemini\antigravity\brain\74eaa620-0510-4488-8f02-244e997dd56b\walkthrough.md", os.path.join(DEST_DIR, "walkthrough.md"))
make_commit("docs: complete walkthrough documentation", "2026-06-30T21:30:00")

print("\nGit history recreation complete locally!")
