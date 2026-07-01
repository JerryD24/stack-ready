# AI Agents & MCP — Complete Developer Guide
### Beginner → Pro | Build Agents, MCP Servers, Prompts & Context

---

> **Note:** You wrote "MPC" — in the AI world the standard term is **MCP (Model Context Protocol)**. This guide covers MCP.
>
> **Java topics are in a separate guide:** `01_Java_Core_to_Advanced.md` — keep that and this file independent.
>
> **Important:** You do **not** "train" MCP servers like ML models. MCP servers are **code you write**. Agents are **configured** via prompts, tools, RAG, and optionally fine-tuning. Section 20 explains this fully.

---

## TABLE OF CONTENTS

### Foundations
1. [What Is an AI Agent?](#1-what-is-an-ai-agent)
2. [Core Concepts Before You Code](#2-core-concepts-before-you-code)
3. [What Is MCP (Model Context Protocol)?](#3-what-is-mcp-model-context-protocol)
4. [How Agents + MCP + Tools Work Together](#4-how-agents--mcp--tools-work-together)

### Build & Learn
5. [Tech Stack — What to Learn](#5-tech-stack--what-to-learn)
6. [Learning Roadmap — 12 Weeks (Beginner)](#6-learning-roadmap--12-weeks-beginner)
7. [Week-by-Week Hands-On Plan](#7-week-by-week-hands-on-plan)
8. [Build Your First MCP Server](#8-build-your-first-mcp-server)
9. [Build Your First Agent (Concept + Code)](#9-build-your-first-agent-concept--code)
10. [Cursor-Specific: Agents in Your IDE](#10-cursor-specific-agents-in-your-ide)
11. [Cursor SDK — Run Agents from Code](#11-cursor-sdk--run-agents-from-code)

### Beginner → Pro (Core Skills)
16. [Prompt Engineering — Write Effective Prompts](#16-prompt-engineering--write-effective-prompts)
17. [Context Engineering — Give AI the Right Information](#17-context-engineering--give-ai-the-right-information)
18. [How to Build AI Agents — Complete Guide](#18-how-to-build-ai-agents--complete-guide)
19. [How to Build MCP Servers — Complete Guide](#19-how-to-build-mcp-servers--complete-guide)
20. ["Training" Your Agent — What It Actually Means](#20-training-your-agent--what-it-actually-means)
21. [Beginner → Pro Roadmap & Skill Levels](#21-beginner--pro-roadmap--skill-levels)
22. [Production Checklist — Pro Level](#22-production-checklist--pro-level)
23. [Agentic AI Production Problems — Deep Dive](#23-agentic-ai-production-problems--deep-dive)

### Reference
12. [Project Ideas (Beginner → Advanced)](#12-project-ideas-beginner--advanced)
13. [Common Mistakes Beginners Make](#13-common-mistakes-beginners-make)
14. [Interview Q&A for Agent Developers](#14-interview-qa-for-agent-developers)
15. [Resources & Next Steps](#15-resources--next-steps)
---

## 1. What Is an AI Agent?

**Theory.** An AI agent is software that uses a Large Language Model (LLM) as a **reasoning engine** but does not stop at generating text. It can **take actions** in the real world (API calls, database queries, file operations) through a loop: plan → act → observe results → repeat until the user's goal is met. As a backend developer, you already build APIs and services — agents are clients that call those services intelligently based on natural language goals.

### Chatbot vs Agent

| | Chatbot | AI Agent |
|--|---------|----------|
| Input | User message | User goal |
| Output | Text reply | **Actions** + result |
| Tools | Usually none | Can call APIs, DB, files, browser |
| Memory | Often session-only | Can remember context, state, history |
| Loop | Single turn | **Think → Act → Observe → Repeat** |

```
User: "Book the cheapest flight to NYC next Friday"

Chatbot:  "Here are some tips for finding cheap flights..."
Agent:    1. Calls flight search API (tool)
          2. Compares prices (reasoning)
          3. Calls booking API (tool)
          4. Returns: "Booked Flight AA123 for $189"
```

### The Agent Loop (ReAct Pattern)

**How it works.** ReAct = **Re**asoning + **Act**ing. Each iteration, the LLM receives the conversation so far (including prior tool results) and decides either: (a) call a tool with specific arguments, or (b) respond to the user with a final answer. Your orchestrator code executes the tool, appends the result to the message history, and sends everything back to the LLM. This continues until the model stops requesting tools or you hit a max-iteration guard.

```
┌─────────────────────────────────────────────┐
│  1. REASON  — What should I do next?        │
│  2. ACT     — Call a tool (API, DB, file)   │
│  3. OBSERVE — Read tool result              │
│  4. REPEAT  — Until goal is done            │
└─────────────────────────────────────────────┘
```

**You as a developer build:**
- The **tools** (functions the agent can call)
- The **MCP servers** (standard way to expose tools)
- The **orchestrator** (loop that connects LLM + tools)
- The **backend APIs** (REST services your tools call)

**Example — manual trace.** User asks "Cancel order ORD-99 and refund." Iteration 1: LLM calls `get_order("ORD-99")` → returns `{status: "CANCELLED", amount: 49.99}`. Iteration 2: LLM calls `create_refund("ORD-99")` → returns `{refund_id: "RF-1"}`. Iteration 3: LLM responds in natural language — no more tools. Three LLM round-trips for one user request.

**Pitfall.** Without a max-iteration limit, a confused model can loop forever calling tools. Always cap at e.g. 10 iterations and escalate to human on timeout.

---

## 2. Core Concepts Before You Code

### 2.1 Large Language Model (LLM)

- A model trained on text that predicts the next token
- Examples: GPT-4, Claude, Gemini, Cursor's Composer
- **You don't train models** as an agent developer — you **use** them via API

**How it works.** An LLM receives a list of messages (system, user, assistant, tool) and generates the next tokens probabilistically. It has no built-in memory between API calls — **you** resend history each time. It also has no direct access to your database or filesystem unless you expose that through tools.

**Interview angle.** "Do agents think?" → No consciousness; they pattern-match from training data and your prompt context. Reliability comes from good prompts, tools, and guardrails — not from the model "understanding" your business.

### 2.2 Prompt

Instructions + context sent to the LLM.

```text
System: You are a helpful assistant. Use tools when needed.
User: What is the weather in Mumbai?
```

### 2.3 System Prompt

Defines agent personality, rules, and constraints. Critical for production.

```text
You are a billing support agent.
- Only answer questions about invoices
- Never share other customers' data
- If unsure, escalate to human
```

### 2.4 Tools (Function Calling)

Functions the LLM can request to run. You define the schema; the LLM decides when to call them.

**How it works.** You send the LLM a JSON schema describing each tool (name, description, parameters). The model does not execute code itself — it returns a structured **tool_call** request: `{name: "get_order_status", arguments: {"order_id": "ORD-123"}}`. Your backend validates arguments, runs the real function, and sends the result back as a `tool` message. The model then uses that result in its next reasoning step.

**Pitfall.** Vague tool descriptions cause wrong tool selection. "Gets data" is useless; "Fetch order by ID when user asks about a specific order; requires ORD-XXXXX format" is actionable (see Section 16.5).

```json
{
  "name": "get_order_status",
  "description": "Get status of a customer order by order ID",
  "parameters": {
    "type": "object",
    "properties": {
      "order_id": { "type": "string" }
    },
    "required": ["order_id"]
  }
}
```

Your backend code executes the function and returns the result to the LLM.

### 2.5 RAG (Retrieval-Augmented Generation)

**Theory.** LLMs know general knowledge from training but not your internal docs, policies, or live data. RAG **retrieves** relevant document chunks at query time and **injects** them into the prompt so answers are grounded in your data — without retraining the model.

```
User question → Search your docs (vector DB) → Inject relevant chunks into prompt → LLM answers
```

**Example.** User asks "What is our refund policy for cancelled orders?" Without RAG, the model guesses. With RAG: embed the question → search vector DB → top 3 chunks from `refund_policy.pdf` inserted into prompt → model cites actual policy text.

**Interview angle.** RAG vs fine-tuning: RAG when data changes frequently or you need citations; fine-tuning when you need a specific output style at scale and have hundreds of labeled examples.

### 2.6 Memory

| Type | Example |
|------|---------|
| Short-term | Current conversation messages |
| Long-term | User preferences stored in DB |
| Working | Agent's current plan / scratchpad |

### 2.7 Orchestration

Code that manages the agent loop, tool routing, retries, and error handling. Frameworks: LangGraph, CrewAI, or a custom service you write.

---

## 3. What Is MCP (Model Context Protocol)?

### One-Sentence Definition

**MCP is an open standard (by Anthropic) that lets AI applications connect to external data and tools in a uniform way** — like USB for AI integrations.

**Theory.** Before MCP, every IDE or agent framework built custom integrations for Slack, Postgres, GitHub, etc. MCP defines one **protocol** (JSON-RPC messages over stdio or HTTP) so any MCP-compatible client can talk to any MCP server. You write the server once; Cursor, Claude Desktop, or your own agent can all use it.

### The Problem MCP Solves

Without MCP:
```
Agent A → custom Slack integration
Agent B → custom Slack integration (different code)
Agent C → custom Slack integration (again...)
```

With MCP:
```
Cursor / Claude / Your Agent
        ↓ MCP protocol
   Slack MCP Server  ← write once, use everywhere
   GitHub MCP Server
   Postgres MCP Server
```

### MCP Architecture

```
┌──────────────────┐         MCP Protocol          ┌──────────────────┐
│   MCP Client     │  ◄──────────────────────────► │   MCP Server     │
│ (Cursor, Agent,  │   JSON-RPC over stdio/HTTP    │ (your code that  │
│  Claude Desktop) │                               │  exposes tools)  │
└──────────────────┘                               └──────────────────┘
                                                           │
                                                           ▼
                                                    Database, API,
                                                    Files, Git, etc.
```

### MCP Server Exposes Three Things

| Primitive | What It Does | Example |
|-----------|--------------|---------|
| **Tools** | Actions the AI can take | `create_ticket`, `run_query` |
| **Resources** | Data the AI can read | `file://config.json`, `db://users/schema` |
| **Prompts** | Reusable prompt templates | `code-review-prompt` |

### MCP vs REST API

| | REST API | MCP |
|--|----------|-----|
| Built for | Any client | AI agents specifically |
| Discovery | OpenAPI/Swagger | Built-in tool listing |
| Context | Client manages | Protocol designed for LLM context |
| Standard | Many styles | One protocol |

**As a developer:** You can wrap your existing REST APIs behind an MCP server so agents can use them.

### MCP Transport Types

| Transport | Use Case |
|-----------|----------|
| **stdio** | Local — Cursor spawns your server as subprocess |
| **HTTP/SSE** | Remote — server runs on a URL |

**How it works — stdio transport.** Cursor runs `python server.py` as a child process. Client and server communicate via stdin/stdout using JSON-RPC messages. No network port needed — simple for local dev. HTTP/SSE is for remote/shared servers where multiple clients connect over the network (requires auth in production).

**Interview angle.** MCP is not a replacement for REST — it's a **wrapper layer** optimized for LLM tool discovery and invocation. Your MCP server typically calls your existing REST APIs internally.

---

## 4. How Agents + MCP + Tools Work Together

### Full Flow Example

```
1. User in Cursor: "Check order 12345 status and refund if cancelled"

2. Cursor (MCP Client) sends to LLM with available MCP tools:
   - get_order (from your Order MCP Server)
   - process_refund (from your Order MCP Server)

3. LLM reasons: "I need get_order first"
   → Calls MCP tool: get_order(order_id="12345")

4. Your MCP Server:
   → Calls backend API: GET /api/orders/12345
   → Returns: { "status": "CANCELLED", "amount": 49.99 }

5. LLM reasons: "Status is CANCELLED, I should refund"
   → Calls MCP tool: process_refund(order_id="12345")

6. MCP Server → POST /api/refunds
   → Returns: { "refund_id": "RF-789", "status": "PROCESSING" }

7. LLM responds to user: "Order 12345 was cancelled. Refund RF-789 initiated."
```

### Typical Architecture

```
┌─────────────┐     MCP      ┌─────────────┐    REST/DB     ┌─────────────┐
│   Cursor    │ ◄──────────► │ MCP Server  │ ◄─────────────►│  Backend    │
│   (Agent)   │              │ (Python/TS) │                │  API + DB   │
└─────────────┘              └─────────────┘                └─────────────┘
```

MCP servers are usually built in **Python or TypeScript** (official SDKs) and call your backend APIs.

---

## 5. Tech Stack — What to Learn

### Path A — Recommended for Beginners (Python-first)

| Layer | Technology | Why |
|-------|------------|-----|
| LLM API | OpenAI / Anthropic API | Industry standard |
| Agent framework | LangChain or LangGraph | Most tutorials, huge community |
| MCP SDK | `mcp` Python package | Official MCP server SDK |
| Backend | Any REST API you already know | Agents need real data |
| Vector DB | Chroma (local) → Pinecone/pgvector | For RAG |
| IDE | Cursor | Built-in agent + MCP support |

### Path B — TypeScript

| Layer | Technology |
|-------|------------|
| MCP SDK | `@modelcontextprotocol/sdk` |
| Agent | Vercel AI SDK, LangChain.js |
| Cursor SDK | `@cursor/sdk` for programmatic agents |

### Path C — All-in-One Framework

| Layer | Technology |
|-------|------------|
| Agent + Tools | LangGraph, CrewAI, AutoGen |
| MCP | Python or TypeScript MCP SDK |
| RAG | LlamaIndex, LangChain retrievers |

### What to Pick as a Beginner

```
Start with:  Python + MCP Python SDK + one REST API as a tool
Why:         Most MCP docs and examples are Python
Next:        LangChain for agent loops, then RAG, then production hardening
```

---

## 6. Learning Roadmap — 12 Weeks (Beginner)

```
Phase 1 — Foundations (Week 1–3)
  □ HTTP, JSON, REST — call any public API with curl/Postman
  □ Python basics (variables, functions, dicts, pip, venv)
  □ Call OpenAI/Anthropic API once from Python (hello world)
  □ Understand prompts, system prompts, tokens

Phase 2 — Agents (Week 4–6)
  □ What is function calling / tool use
  □ Build a simple agent loop in Python (no framework)
  □ Learn LangChain: chains, tools, memory
  □ Connect agent to a REST API as a tool

Phase 3 — MCP (Week 7–9)
  □ Read MCP spec overview (modelcontextprotocol.io)
  □ Build MCP server with 2 tools (stdio)
  □ Connect MCP server to Cursor
  □ Add Resources and Prompts

Phase 4 — Production Thinking (Week 10–12)
  □ RAG — embed docs, query with Chroma
  □ Error handling, retries, timeouts in agent loop
  □ Security: API keys, input validation, rate limits
  □ Deploy MCP server (Docker)
  □ Build one portfolio project (see Section 12)
```

---

## 7. Week-by-Week Hands-On Plan

### Week 1 — Python + API Hello World

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install openai
```

```python
from openai import OpenAI
client = OpenAI(api_key="your-key")

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Explain what an AI agent is in one paragraph"}]
)
print(response.choices[0].message.content)
```

**Goal:** Understand that LLM = API call with messages.

### Week 2 — Tool Calling (No Framework)

**Goal.** Understand the agent loop manually before using frameworks — if you can't build this without LangChain, you won't debug production failures.

```python
import json

tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get weather for a city",
        "parameters": {
            "type": "object",
            "properties": {"city": {"type": "string"}},
            "required": ["city"]
        }
    }
}]

def get_weather(city: str) -> str:
    return f"Weather in {city}: 32°C, sunny"  # replace with real API

# 1. Send user message + tools to LLM
# 2. If LLM returns tool_call → run get_weather()
# 3. Send tool result back to LLM
# 4. Get final answer
```

**How it works — the four steps:**
1. Send user message + tool definitions to LLM API.
2. Parse response: if `tool_calls` present, extract function name and JSON arguments.
3. Execute your Python function locally; capture return value as string/JSON.
4. Append assistant message + tool result messages; call LLM again for final answer.

**Interview angle.** "What's the difference between RAG and tool calling?" → RAG injects static retrieved text into context; tools execute **live** code/API calls and return dynamic results.

### Week 3 — LangChain Agent

```bash
pip install langchain langchain-openai
```

Build an agent with one tool that calls a REST API:

```python
# Tool calls: http://localhost:8080/api/orders/{id}
```

### Week 4–5 — Backend API as Agent Tool

Expose a simple REST endpoint (any language/framework) that your agent calls:

```
GET  /api/orders/{id}   → returns order JSON
POST /api/refunds       → creates a refund
```

Your Python agent or MCP server calls these endpoints.

### Week 6–7 — First MCP Server

See [Section 8](#8-build-your-first-mcp-server).

### Week 8+ — Portfolio Project

Pick one from [Section 12](#12-project-ideas-beginner--advanced).

---

## 8. Build Your First MCP Server

**Theory.** An MCP server is a small program you write and run locally (or deploy remotely). It advertises tools the LLM can call. Cursor acts as the **MCP client** — it discovers your tools, passes them to the LLM, and when the LLM requests a tool call, Cursor invokes your server and returns the result.

### Prerequisites

```bash
pip install mcp
```

### Minimal MCP Server (Python, stdio)

```python
# server.py
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("demo-server")  # server name shown in MCP settings

@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers together."""  # docstring becomes LLM tool description
    return a + b

@mcp.tool()
def get_order_status(order_id: str) -> str:
    """Get order status from backend. order_id is the order ID."""
    # In real life: requests.get(f"http://localhost:8080/api/orders/{order_id}")
    return f"Order {order_id}: SHIPPED"

if __name__ == "__main__":
    mcp.run()  # starts stdio transport — blocks, listens on stdin
```

**How it works.** `@mcp.tool()` registers a function. FastMCP generates the JSON schema from the function signature and docstring. When the LLM chooses `add`, Cursor sends a JSON-RPC call to your server; your function runs and returns the result.

### Connect to Cursor

Create `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "demo-server": {
      "command": "python",
      "args": ["C:/path/to/server.py"]
    }
  }
}
```

Restart Cursor → Settings → MCP → your server should appear.

### Test in Cursor Chat

```
Use the add tool to calculate 17 + 25
What is the status of order ORD-12345?
```

### MCP Server That Wraps a REST API

```python
import requests
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("order-service")
BASE = "http://localhost:8080/api"

@mcp.tool()
def get_order(order_id: str) -> dict:
    """Fetch order details by ID from the backend API."""
    r = requests.get(f"{BASE}/orders/{order_id}")
    r.raise_for_status()
    return r.json()

@mcp.tool()
def list_orders_by_status(status: str) -> list:
    """List all orders with given status: PENDING, SHIPPED, CANCELLED."""
    r = requests.get(f"{BASE}/orders", params={"status": status})
    r.raise_for_status()
    return r.json()
```

---

## 9. Build Your First Agent (Concept + Code)

**Theory.** This section strips away frameworks to show the **minimum viable agent**: a `while` loop, an LLM API call, tool schemas, and message history. Every framework (LangChain, LangGraph) is structured sugar on top of this pattern.

### Minimal Agent Loop (Python)

```python
import json
from openai import OpenAI

client = OpenAI()

def run_agent(user_goal: str):
    messages = [
        {"role": "system", "content": "You are a helpful assistant. Use tools when needed."},
        {"role": "user", "content": user_goal}
    ]
    tools = [{"type": "function", "function": {
        "name": "get_order_status",
        "description": "Get order status",
        "parameters": {"type": "object", "properties": {"order_id": {"type": "string"}}, "required": ["order_id"]}
    }}]

    while True:  # agent loop — exits when LLM returns text instead of tool_calls
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=tools
        )
        msg = response.choices[0].message

        if not msg.tool_calls:
            return msg.content  # Done — final answer to user

        messages.append(msg)  # include assistant's tool_call message in history
        for call in msg.tool_calls:
            args = json.loads(call.function.arguments)
            if call.function.name == "get_order_status":
                result = f"Order {args['order_id']} is SHIPPED"  # your real API call here
            else:
                result = "Unknown tool"
            messages.append({
                "role": "tool",
                "tool_call_id": call.id,  # links result to the specific tool request
                "content": result
            })
        # loop continues — LLM sees tool result and decides next step

print(run_agent("What is the status of order 12345?"))
```

**How it works step-by-step for "What is the status of order 12345?":**
1. LLM receives user message + tool schemas.
2. LLM returns `tool_calls: [{name: get_order_status, arguments: {order_id: "12345"}}]`.
3. Your code runs the tool → `"Order 12345 is SHIPPED"`.
4. That result is appended as a `tool` message.
5. LLM receives updated history → responds with natural language, no tool_calls.
6. Loop returns final answer.

**Pitfall.** Production agents need: max iterations, input validation on `args`, error handling when the API fails, and logging of every tool call for audit.

**This IS an agent** — loop, tools, reasoning. Frameworks just add structure around this.

---

## 10. Cursor-Specific: Agents in Your IDE

### What Cursor Gives You

| Feature | What It Is |
|---------|------------|
| **Agent mode** | AI that edits files, runs commands, searches codebase |
| **MCP** | Plug external tools into Cursor |
| **Rules** | `.cursor/rules` — persistent instructions for the AI |
| **Skills** | Reusable instruction files for specific tasks |
| **Hooks** | Automate actions on agent events |

### MCP in Cursor — Mental Model

```
You build MCP Server → register in mcp.json → Cursor Agent can use your tools
```

Examples of existing MCP servers:
- GitHub (read repos, issues, PRs)
- Postgres (run SQL)
- Filesystem (read/write files)
- Brave Search (web search)

### Your Goal as Agent Developer

Build MCP servers that expose **your business capabilities**:
- Query billing system
- Trigger migrations
- Search internal docs
- Create JIRA tickets

---

## 11. Cursor SDK — Run Agents from Code

When you want agents **outside** the IDE (CI, scripts, bots):

### TypeScript

```typescript
import { Agent } from "@cursor/sdk";

const result = await Agent.prompt("Review src/auth.ts for security bugs", {
  apiKey: process.env.CURSOR_API_KEY!,
  model: { id: "composer-2.5" },
  local: { cwd: process.cwd() },
});
console.log(result.result);
```

### Python

```python
import os
from cursor_sdk import Agent, AgentOptions, LocalAgentOptions

result = Agent.prompt(
    "Review src/auth.py for security bugs",
    AgentOptions(
        api_key=os.environ["CURSOR_API_KEY"],
        model="composer-2.5",
        local=LocalAgentOptions(cwd=os.getcwd()),
    ),
)
print(result.result)
```

### SDK + MCP

You can configure MCP servers for SDK agents so programmatic agents use the same tools as Cursor IDE.

**Docs:** [cursor.com/docs/sdk](https://cursor.com/docs/sdk)

---

## 12. Project Ideas (Beginner → Advanced)

### Beginner

| Project | What You Learn |
|---------|----------------|
| **Calculator MCP Server** | MCP basics, tool schema |
| **Weather Agent** | Tool calling, external API |
| **REST API + Python Agent** | Connect LLM to a backend |

### Intermediate

| Project | What You Learn |
|---------|----------------|
| **Internal Docs Q&A (RAG)** | Embeddings, Chroma, chunking |
| **Order Support Agent** | Multi-tool agent, backend integration |
| **GitHub PR Review Bot** | Cursor SDK or GitHub MCP |
| **SQL Agent** | MCP + Postgres, guardrails |

### Advanced

| Project | What You Learn |
|---------|----------------|
| **Multi-agent system** | Orchestrator + specialist agents |
| **Workflow agent** | Agent triggers multi-step business processes |
| **Production MCP gateway** | Auth, rate limits, logging, Docker |
| **Custom agent platform** | Your own UI + agent runtime |

### Portfolio Project Recommendation (Start Here)

**"Billing Support Agent"**
1. Backend API — orders, invoices, refunds (any REST framework)
2. MCP server — 3 tools: `get_order`, `get_invoice`, `create_refund` (Python)
3. RAG — embed your API docs into Chroma
4. Cursor integration — test via MCP in IDE
5. README with architecture diagram

---

## 13. Common Mistakes Beginners Make

**Theory.** Most agent failures are software engineering mistakes, not "AI mysteries." The table below maps symptoms to fixes — treat agents like any distributed system with an unpredictable client (the LLM).

| Mistake | Fix |
|---------|-----|
| Trying to learn ML/training first | Agent dev = software engineering + LLM APIs |
| No backend, only prompts | Agents need real tools and data |
| Hardcoding API keys | Use env vars / secrets manager |
| No input validation on tools | Agent can pass bad args — validate everything |
| Infinite agent loops | Set max iterations (e.g. 10) |
| Trusting LLM output blindly | Always verify tool results |
| Building without measuring | Log latency, token cost, success rate |

---

## 14. Interview Q&A for Agent Developers

**Theory.** Interviewers test whether you understand the **architecture** (loop, tools, context limits) and **production risks** (hallucination, partial failure, cost) — not whether you've memorized framework APIs.

**Q: What is an AI agent?**
A: A system that uses an LLM to reason, call tools, observe results, and loop until a goal is achieved — not just generate text.

**Q: What is MCP?**
A: Model Context Protocol — open standard for connecting AI apps to tools, data, and prompts via MCP servers.

**Q: MCP vs REST API?**
A: REST is general-purpose. MCP is designed for AI — standardized tool discovery, schema, and context for LLMs.

**Q: What is RAG?**
A: Retrieve relevant documents from a vector store, inject into prompt, then generate answer — grounds LLM in your data.

**Q: What is function calling?**
A: LLM returns a structured request to call a function you defined; your code executes it and returns the result.

**Q: How do you prevent agents from doing harmful actions?**
A: Allowlist tools, validate inputs, human-in-the-loop for sensitive ops, rate limits, audit logs, least-privilege API keys.

---

## 15. Resources & Next Steps

### Official Docs

| Resource | URL |
|----------|-----|
| MCP Specification | [modelcontextprotocol.io](https://modelcontextprotocol.io) |
| MCP Python SDK | [github.com/modelcontextprotocol/python-sdk](https://github.com/modelcontextprotocol/python-sdk) |
| Cursor MCP Docs | [cursor.com/docs/context/mcp](https://cursor.com/docs/context/mcp) |
| Cursor SDK | [cursor.com/docs/sdk](https://cursor.com/docs/sdk) |
| LangChain | [python.langchain.com](https://python.langchain.com) |

### Start Today — 3 Actions

```
1. Install Python, call OpenAI API once (Week 1 code above)
2. Build the Calculator MCP server and connect to Cursor
3. Read Section 1–3 of this guide end-to-end
```

---

## 16. Prompt Engineering — Write Effective Prompts

Prompt engineering is **the #1 skill** for agent developers. You don't need ML training — you need to write instructions the LLM follows reliably.

**Theory.** The LLM has no persistent memory of your project. Everything it "knows" during a request comes from the messages you send: system prompt, retrieved docs, tool results, and user input. Prompt engineering is the discipline of crafting those messages so the model consistently picks the right tools, follows business rules, and formats output correctly.

### 16.1 Anatomy of a Production Prompt

Every agent interaction has these layers:

```
┌─────────────────────────────────────────┐
│  SYSTEM PROMPT   — who you are, rules   │  ← always sent
├─────────────────────────────────────────┤
│  CONTEXT         — docs, history, data  │  ← you control this
├─────────────────────────────────────────┤
│  USER MESSAGE    — current request      │  ← from user
└─────────────────────────────────────────┘
```

### 16.2 System Prompt Template (Copy & Adapt)

```text
# Role
You are a [specific role] that helps users with [specific task].

# Capabilities
- You can use tools: [list tool names and when to use each]
- You have access to: [docs, database, APIs]

# Rules (non-negotiable)
- Always verify user identity before showing account data
- Never invent order IDs, prices, or statuses — use tools only
- If a tool fails, tell the user and suggest next steps
- If unsure, say "I don't know" — do not guess

# Output format
- Be concise (max 3 paragraphs unless user asks for detail)
- Use bullet points for lists
- When citing data from tools, mention the source (e.g. "According to order API...")

# Constraints
- Do not discuss competitors
- Do not execute refunds over $500 without confirming with user
```

### 16.3 Prompt Techniques — Beginner to Pro

| Level | Technique | Example |
|-------|-----------|---------|
| Beginner | **Be specific** | Bad: "Help with orders" → Good: "Look up order by ID and explain status in plain English" |
| Beginner | **Assign a role** | "You are a senior support agent with 10 years experience" |
| Beginner | **Set output format** | "Respond in JSON: `{order_id, status, next_step}`" |
| Intermediate | **Few-shot examples** | Show 2–3 input→output examples in the prompt |
| Intermediate | **Chain of thought** | "Think step by step before answering" |
| Intermediate | **Constraints as bullets** | "NEVER do X. ALWAYS do Y." |
| Pro | **Structured XML/tags** | `<context>...</context><task>...</task><rules>...</rules>` |
| Pro | **Self-critique** | "Draft answer, then check against rules, then finalize" |
| Pro | **Prompt versioning** | Store prompts in git, A/B test, measure success rate |

### 16.4 Few-Shot Prompting (Teach by Example)

```text
Classify customer intent. Reply with one label: BILLING, TECHNICAL, CANCEL, OTHER

Example 1:
User: "Why was I charged twice?"
Intent: BILLING

Example 2:
User: "App keeps crashing on login"
Intent: TECHNICAL

Example 3:
User: "I want to close my account"
Intent: CANCEL

Now classify:
User: "{{user_message}}"
Intent:
```

Few-shot = "training" via examples **in the prompt** (no model retraining needed).

### 16.5 Tool-Use Prompts (Critical for Agents)

The LLM picks tools based on **name + description**. Bad descriptions = wrong tool calls.

```json
// BAD
{ "name": "get", "description": "Gets data" }

// GOOD
{
  "name": "get_order_by_id",
  "description": "Fetch full order details including status, items, and shipping. Use when user asks about a specific order. Requires order_id like ORD-12345. Do NOT use for listing multiple orders — use list_orders instead."
}
```

**Rules for tool descriptions:**
1. Say **when** to use the tool
2. Say **when NOT** to use it
3. Describe **required parameters** with examples
4. One tool = one clear job (single responsibility)

### 16.6 Bad vs Good Prompts

| Bad | Good | Why |
|-----|------|-----|
| "Be helpful" | "Answer billing questions using get_invoice tool only" | Vague vs actionable |
| "Fix the code" | "Find null pointer risks in OrderService.java, list line numbers, suggest fix" | No scope vs clear scope |
| Long rambling paragraph | Structured sections with headers | LLMs follow structure better |
| No examples | 2–3 examples of desired output | Examples beat instructions |
| "Don't hallucinate" | "Only state facts returned by tools; if tool returns empty, say no data found" | Negative vs positive instruction |

### 16.7 Prompt for the ReAct Agent Loop

```text
You are an agent that solves tasks by reasoning and using tools.

For each step:
1. Thought: What do I know? What do I need?
2. Action: Call one tool (or finish)
3. Observation: Read tool result
4. Repeat until task is complete

When finished, give a clear final answer to the user.
Do not call tools unnecessarily.
Maximum 10 tool calls per request.
```

### 16.8 Prompt Debugging Checklist

When your agent behaves badly, check:

```
□ Is the system prompt too long? (trim irrelevant rules)
□ Is the system prompt too short? (missing constraints)
□ Are tool descriptions ambiguous?
□ Is context stale or wrong? (wrong docs injected)
□ Is the model too small for the task? (try stronger model)
□ Are you hitting token limits? (context truncated mid-instruction)
□ Did you test with 5+ real user queries?
```

---

## 17. Context Engineering — Give AI the Right Information

**Context engineering** = deciding **what information** the LLM sees, **in what order**, and **how much**. This is as important as prompt writing.

**Theory.** Prompt engineering tells the model *how* to behave. Context engineering decides *what facts* it has to work with. A perfect system prompt fails if you inject irrelevant docs, stale API responses, or 50KB of JSON — the model gets confused, costs spike, and early instructions get "lost in the middle."

### 17.1 What Goes Into Context?

| Source | What | When to Use |
|--------|------|-------------|
| System prompt | Rules, role, format | Always |
| Conversation history | Previous messages | Multi-turn chat |
| RAG chunks | Retrieved doc snippets | Company knowledge |
| Tool results | API/DB responses | After each tool call |
| User metadata | ID, permissions, locale | Personalization |
| MCP Resources | Files, schemas, configs | Read-only reference data |

### 17.2 Context Window — The Hard Limit

Every model has a **token limit** (e.g. 128K tokens). Everything you send counts:

```
System prompt        2,000 tokens
RAG chunks           8,000 tokens
Conversation history 10,000 tokens
Tool results         5,000 tokens
User message         500 tokens
─────────────────────────────────
Total                25,500 tokens  ← must fit in limit
```

**Pro tip:** More context ≠ better. Irrelevant context **confuses** the model.

### 17.3 Context Priority Order

Put the most important information where the model pays most attention:

```
1. System prompt (rules)           ← first = highest priority
2. Critical retrieved docs (RAG)   ← top-ranked chunks only
3. Recent conversation (last N turns)
4. Older conversation (summarized)
5. User's current message          ← last before generation
```

### 17.4 How to Write Effective Context Blocks

```text
<context>
<user>
  id: usr_8821
  plan: premium
  timezone: Asia/Kolkata
</user>

<relevant_docs>
  [Doc 1 — Refund Policy]
  Refunds allowed within 30 days for cancelled orders. Amount credited in 5–7 business days.

  [Doc 2 — Order ORD-12345]
  Status: CANCELLED. Amount: $49.99. Cancelled: 2026-06-20.
</relevant_docs>

<available_tools>
  get_order, create_refund, escalate_to_human
</available_tools>
</context>

<task>
User asks: "Where is my refund for order ORD-12345?"
</task>
```

### 17.5 Context Compression Techniques (Pro)

| Technique | How | When |
|-----------|-----|------|
| **Summarization** | LLM summarizes old messages | Long conversations |
| **RAG top-K** | Only inject top 3–5 relevant chunks | Large knowledge bases |
| **Structured JSON** | Replace prose with `{id, status, amount}` | Tool results |
| **Sliding window** | Keep last 10 messages only | Chat apps |
| **Semantic cache** | Reuse answer if similar question asked | High-traffic bots |

### 17.6 MCP Resources as Context

MCP **Resources** let the agent read data without executing an action:

```python
@mcp.resource("config://app-settings")
def get_app_settings() -> str:
    """Application configuration the agent should know."""
    return json.dumps({"refund_limit": 500, "support_hours": "9am-6pm IST"})

@mcp.resource("schema://orders")
def get_order_schema() -> str:
    """Database schema for orders table."""
    return "orders(id, user_id, status, amount, created_at)"
```

Agent reads resource → includes in context → makes better tool calls.

### 17.7 Cursor Rules & Skills as Context

In Cursor, persistent context lives in:

| File | Purpose |
|------|---------|
| `.cursor/rules/*.md` | Project-wide instructions (always injected) |
| `AGENTS.md` | Agent behavior for the repo |
| Skills (`SKILL.md`) | Task-specific playbooks |

Example rule (`.cursor/rules/agent-api.md`):

```markdown
# Order API Agent Rules
- All order IDs match pattern ORD-[0-9]+
- Use MCP tool get_order before answering status questions
- Never expose internal user_id to end users
```

---

## 18. How to Build AI Agents — Complete Guide

**Theory.** Building an agent is backend engineering with an LLM in the loop. You define the job, expose tools (your APIs), write guardrails, and implement the orchestration loop. Frameworks help at scale; understanding the raw loop (Section 9) is what separates debuggers from copy-pasters.

### 18.1 Agent Building Blocks

```
┌──────────────────────────────────────────────────┐
│                   YOUR AGENT                      │
│  ┌────────────┐  ┌─────────┐  ┌───────────────┐  │
│  │ System     │  │ Memory  │  │ Orchestrator  │  │
│  │ Prompt     │  │ (state) │  │ (loop logic)  │  │
│  └────────────┘  └─────────┘  └───────────────┘  │
│  ┌────────────┐  ┌─────────┐  ┌───────────────┐  │
│  │ Tools      │  │ RAG     │  │ Guardrails    │  │
│  │ (actions)  │  │ (knowledge)│ (safety)     │  │
│  └────────────┘  └─────────┘  └───────────────┘  │
│                      ↓                            │
│                   LLM API                         │
└──────────────────────────────────────────────────┘
```

### 18.2 Step-by-Step: Build an Agent from Scratch

**Step 1 — Define the job (one sentence)**
```
"This agent helps support staff look up orders and issue refunds."
```

**Step 2 — List tools the agent needs**
```
get_order(order_id)
list_orders(user_id, status)
create_refund(order_id, reason)
escalate_to_human(summary)
```

**Step 3 — Write system prompt** (see Section 16)

**Step 4 — Implement tool functions** (real API calls)

**Step 5 — Implement the loop** (see Section 9)

**Step 6 — Add guardrails**
```python
MAX_ITERATIONS = 10
ALLOWED_TOOLS = {"get_order", "create_refund", "escalate_to_human"}

def execute_tool(name, args):
    if name not in ALLOWED_TOOLS:
        raise ValueError(f"Tool {name} not allowed")
    if name == "create_refund" and args.get("amount", 0) > 500:
        return {"error": "Refunds over $500 need human approval"}
    ...
```

**Step 7 — Test with 20 real scenarios, fix prompts**

**Step 8 — Add logging, metrics, deploy**

### 18.3 Agent with LangGraph (Intermediate)

```bash
pip install langgraph langchain-openai
```

```python
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

@tool
def get_order(order_id: str) -> str:
    """Get order status by ID."""
    return f"Order {order_id}: SHIPPED"

@tool
def create_refund(order_id: str) -> str:
    """Create refund for cancelled order."""
    return f"Refund initiated for {order_id}"

llm = ChatOpenAI(model="gpt-4o-mini")
agent = create_react_agent(llm, tools=[get_order, create_refund])

result = agent.invoke({"messages": [("user", "Refund order ORD-99")]})
```

### 18.4 Multi-Agent Systems (Pro)

```
        ┌─────────────────┐
        │  Orchestrator   │
        │     Agent       │
        └────────┬────────┘
     ┌───────────┼───────────┐
     ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Research│ │ Coder   │ │ Reviewer│
│ Agent   │ │ Agent   │ │ Agent   │
└─────────┘ └─────────┘ └─────────┘
```

- **Orchestrator** breaks task into subtasks
- **Specialist agents** each have own prompt + tools
- **Handoff** via messages or shared state

Frameworks: LangGraph, CrewAI, AutoGen

### 18.5 Agent Skill Levels

| Level | You Can Build |
|-------|---------------|
| **Beginner** | Single-tool chatbot with function calling |
| **Intermediate** | Multi-tool agent with memory + RAG |
| **Advanced** | Multi-agent system with orchestration |
| **Pro** | Production agent platform with evals, monitoring, fallbacks |

---

## 19. How to Build MCP Servers — Complete Guide

**Theory.** An MCP server is a thin adapter between an AI client and your backend. The LLM never calls your REST API directly — it calls MCP tools; your server translates those into HTTP/DB operations, validates inputs, and returns structured results. This separation lets you enforce auth, rate limits, and audit logging at the tool boundary.

### 19.1 What You Are Actually Building

An MCP server is a **small program** that:
1. Starts when Cursor/agent connects
2. Advertises its tools, resources, and prompts
3. Executes tool calls and returns results
4. **It is not trained — you write and deploy it**

### 19.2 MCP Server Structure

```
my-mcp-server/
├── server.py          # main server code
├── tools/
│   ├── orders.py      # order-related tools
│   └── refunds.py     # refund tools
├── resources/
│   └── schemas.py     # MCP resources
├── prompts/
│   └── templates.py   # reusable prompt templates
├── requirements.txt
└── README.md
```

### 19.3 Tools — Full Example with Validation

```python
from mcp.server.fastmcp import FastMCP
import re
import requests

mcp = FastMCP("billing-server")
BASE = "http://localhost:8080/api"

def validate_order_id(order_id: str) -> bool:
    return bool(re.match(r"^ORD-\d+$", order_id))

@mcp.tool()
def get_order(order_id: str) -> dict:
    """
    Fetch order by ID. Use when user asks about a specific order.
    order_id format: ORD-12345. Returns status, amount, items.
    """
    if not validate_order_id(order_id):
        return {"error": "Invalid order ID format. Expected ORD-12345"}
    try:
        r = requests.get(f"{BASE}/orders/{order_id}", timeout=10)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        return {"error": str(e)}

@mcp.tool()
def create_refund(order_id: str, reason: str) -> dict:
    """
    Create refund for a CANCELLED order only.
    Do not use for active/shipped orders — escalate instead.
  """
    if not validate_order_id(order_id):
        return {"error": "Invalid order ID"}
    r = requests.post(f"{BASE}/refunds", json={"order_id": order_id, "reason": reason})
    return r.json()
```

### 19.4 Resources — Read-Only Context for the Agent

```python
@mcp.resource("policy://refunds")
def refund_policy() -> str:
    return """
    Refund Policy:
    - Cancelled orders: full refund within 30 days
    - Shipped orders: return required before refund
    - Max auto-refund: $500 (above requires human)
    """

@mcp.resource("schema://orders")
def order_schema() -> str:
    return "orders(id PK, user_id, status ENUM, amount DECIMAL, created_at)"
```

### 19.5 Prompts — Reusable Templates in MCP

MCP servers can expose **prompt templates** the client fills in:

```python
@mcp.prompt()
def analyze_order_issue(order_id: str, user_complaint: str) -> str:
    """Generate a structured analysis prompt for order issues."""
    return f"""Analyze this support case:

Order ID: {order_id}
Customer complaint: {user_complaint}

Steps:
1. Call get_order to fetch current status
2. Compare status with complaint
3. Recommend: refund, escalate, or explain policy
4. Draft a professional reply to the customer
"""
```

In Cursor, the user invokes this prompt template → agent gets a well-structured starting prompt.

### 19.6 TypeScript MCP Server

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "demo-server", version: "1.0.0" });

server.tool(
  "get_order",
  { order_id: z.string().describe("Order ID like ORD-12345") },
  async ({ order_id }) => {
    const res = await fetch(`http://localhost:8080/api/orders/${order_id}`);
    return { content: [{ type: "text", text: await res.text() }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 19.7 MCP Server Deployment (Pro)

```dockerfile
# Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "server.py"]
```

For **remote** MCP (HTTP/SSE), expose server behind auth (API key, OAuth).

### 19.8 MCP Server Debugging

```
□ Server starts without errors? (run manually: python server.py)
□ Tools appear in Cursor MCP settings?
□ Tool docstrings clear enough for LLM?
□ Validate inputs — agent sends bad args often
□ Return structured JSON, not huge raw dumps
□ Set timeouts on external API calls
□ Log every tool call (audit trail)
```

### 19.9 MCP Skill Levels

| Level | You Can Build |
|-------|---------------|
| **Beginner** | 1–2 tools, stdio, local Cursor |
| **Intermediate** | Tools + resources + prompts, error handling |
| **Advanced** | Multi-module server, auth, Docker |
| **Pro** | Remote MCP, gateway, multi-tenant, observability |

---

## 20. "Training" Your Agent — What It Actually Means

### 20.1 What You Do NOT Train

| Thing | Reality |
|-------|---------|
| **MCP Server** | You **write code** — no training |
| **Agent loop** | You **write orchestration logic** — no training |
| **Tool functions** | Regular programming |

### 20.2 What "Training" Usually Means for Agent Developers

| Method | What It Is | Difficulty | When to Use |
|--------|------------|------------|-------------|
| **Prompt engineering** | Better instructions + examples | Easy | Always — start here |
| **Few-shot examples** | Examples inside the prompt | Easy | Classification, formatting |
| **RAG** | Retrieve your docs at runtime | Medium | Company knowledge |
| **Fine-tuning** | Retrain model weights on your data | Hard | Unique style/format at scale |
| **Evals** | Test suite measuring agent quality | Medium | Before production |
| **Feedback loop** | Log failures → improve prompts | Medium | Continuous improvement |

**90% of agent developers never fine-tune.** Prompt + RAG + tools is enough.

### 20.3 RAG — "Teach" the Agent Your Data (No Training)

```python
# 1. Load documents
from langchain_community.document_loaders import TextLoader
docs = TextLoader("refund_policy.txt").load()

# 2. Split into chunks
from langchain.text_splitter import RecursiveCharacterTextSplitter
chunks = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50).split_documents(docs)

# 3. Embed and store
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
vectorstore = Chroma.from_documents(chunks, OpenAIEmbeddings())

# 4. At query time — retrieve relevant chunks
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
relevant_docs = retriever.invoke("What is the refund policy for cancelled orders?")

# 5. Inject into prompt
context = "\n".join(doc.page_content for doc in relevant_docs)
prompt = f"Use this context:\n{context}\n\nUser question: ..."
```

### 20.4 Fine-Tuning — When You Actually Retrain (Pro)

Fine-tuning = send labeled examples to OpenAI/Anthropic → get a custom model.

**Use when:**
- You need a very specific output format thousands of times
- Prompt + RAG still fails after extensive tuning
- You have 100+ high-quality labeled examples

**Don't use when:**
- You can solve it with better prompts (try that first)
- Your data changes frequently (RAG is better)
- You're a beginner (skip for now)

```python
# OpenAI fine-tuning (simplified)
# Prepare JSONL: {"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
# Upload → create fine-tune job → use model id "ft:gpt-4o-mini:..."
```

### 20.5 Evals — Measure If Your Agent Is "Trained" Enough

```python
# Test cases for your agent
eval_cases = [
    {"input": "Status of ORD-100", "expected_tool": "get_order", "must_contain": "SHIPPED"},
    {"input": "Refund ORD-200", "expected_tool": "create_refund", "must_contain": "initiated"},
    {"input": "What's the weather?", "expected_tool": None, "must_contain": "cannot help"},
]

def run_eval(agent, cases):
    passed = 0
    for case in cases:
        result = agent.run(case["input"])
        # check tool called, output contains expected text
        ...
    return passed / len(cases)
```

**Pro workflow:** Run evals on every prompt change. Track score over time.

### 20.6 Improving Agent Quality Over Time (Practical "Training")

```
1. Ship agent with good prompt + tools
2. Log every conversation + tool call
3. Weekly: review 20 failed conversations
4. Update system prompt / tool descriptions
5. Add failed cases to eval suite
6. Re-run evals before deploy
7. Add RAG chunks for questions agent couldn't answer
```

This loop **is** how pro agent developers "train" — no GPUs required.

---

## 21. Beginner → Pro Roadmap & Skill Levels

### 21.1 Skill Matrix

| Skill | Beginner | Intermediate | Pro |
|-------|----------|--------------|-----|
| Prompt writing | Basic role + task | Few-shot, structured, tool prompts | Versioned, A/B tested, eval-driven |
| Context | Dump everything | RAG top-K, sliding window | Compressed, prioritized, cached |
| Agents | Single tool loop | LangGraph, memory, multi-tool | Multi-agent, orchestration |
| MCP | 1 server, 2 tools | Resources + prompts + validation | Remote, auth, Docker, gateway |
| RAG | Chroma local | Chunking strategy, reranking | Hybrid search, eval on retrieval |
| Production | Local only | Logging, env vars | Evals, monitoring, fallbacks, cost caps |
| "Training" | Prompt tuning | RAG + eval suite | Fine-tuning + continuous improvement |

### 21.2 Extended Roadmap (6 Months to Pro)

```
Month 1 — Foundations
  □ Python, HTTP, LLM API
  □ Prompt engineering (Section 16)
  □ First agent loop (Section 9)

Month 2 — Tools & MCP
  □ Function calling mastery
  □ First MCP server in Cursor (Section 8, 19)
  □ Context engineering (Section 17)

Month 3 — Frameworks
  □ LangChain / LangGraph
  □ RAG pipeline (Section 20.3)
  □ Portfolio project #1

Month 4 — Production Basics
  □ Guardrails, validation, error handling
  □ Eval suite (Section 20.5)
  □ Docker deploy MCP server

Month 5 — Advanced
  □ Multi-agent or complex workflow agent
  □ MCP resources + prompt templates
  □ Cursor SDK automation

Month 6 — Pro
  □ Full production checklist (Section 22)
  □ Portfolio project #2 (production-grade)
  □ Contribute to open-source MCP server or write blog
```

### 21.3 How You Know You're "Pro"

```
✅ You can build an agent from scratch without copy-paste
✅ You can build an MCP server with tools + resources + prompts
✅ You write system prompts that work reliably on 20+ test cases
✅ You manage context window deliberately (not dump everything)
✅ You have an eval suite and run it before changes
✅ You can explain when to use RAG vs fine-tuning vs prompt only
✅ You log tool calls and monitor cost/latency
✅ You've shipped one agent/MCP project others can use
```

---

## 22. Production Checklist — Pro Level

### Before Launch

```
PROMPTS
  □ System prompt versioned in git
  □ Tool descriptions tested with 10+ queries
  □ Max iterations limit set
  □ Fallback message when agent stuck

CONTEXT
  □ RAG chunks relevant (measure retrieval accuracy)
  □ Context size within token budget
  □ PII stripped from logs

SECURITY
  □ API keys in env vars / secrets manager
  □ Tool input validation (never trust LLM args)
  □ Allowlist of tools per user role
  □ Rate limiting per user
  □ Audit log of all tool calls

RELIABILITY
  □ Timeouts on external API calls
  □ Retry with exponential backoff
  □ Graceful degradation if LLM API down
  □ Human escalation path for edge cases

OBSERVABILITY
  □ Log: prompt, tools called, latency, tokens, cost
  □ Alerts on error rate spike
  □ Dashboard: requests/day, avg cost, success rate

EVALS
  □ 20+ test cases in CI
  □ Regression check on prompt changes
```

---

## 23. Agentic AI Production Problems — Deep Dive

Real-world agent systems fail in predictable ways. These four problems appear in almost every production agent deployment — know them for interviews and for building reliable systems.

```
User request
    ↓
Agent loop (LLM → tool → LLM → tool → ...)
    ↓
FAILURE MODES:
  ① Memory bloating   — context grows until model chokes
  ② Partial failures  — step 3 of 5 fails, state is inconsistent
  ③ Hallucinations    — model invents tools, data, or outcomes
  ④ Performance       — latency, cost, token explosion
```

---

### 23.1 Memory Bloating in Agentic AI

**What it is:** Every agent turn appends to context — user messages, assistant replies, tool calls, tool results, retrieved RAG chunks, and scratchpad reasoning. Over multiple iterations, the context window fills up. Cost spikes, latency grows, and the model starts **forgetting** early instructions ("lost in the middle" problem).

**Why agents are worse than chatbots:**
| Chatbot | Agent |
|---------|-------|
| 1 user + 1 assistant turn | 5–20 turns per task |
| Small context | Tool JSON payloads are huge |
| No history of API responses | Full API responses stuffed into prompt |

**Common causes:**
- Appending **full** tool outputs (10KB JSON) instead of summaries
- Never trimming conversation history
- Storing entire RAG corpus in prompt instead of top-k chunks
- Recursive sub-agents each passing full parent context downstream
- No max-iteration guard — agent loops until context limit

**Symptoms:**
- Token usage grows linearly with each tool call
- Model ignores system prompt after turn 8+
- `context_length_exceeded` API errors
- Bill jumps from $0.02/request to $0.50/request

**Fixes (production patterns):**

```python
# 1. Summarize old turns instead of keeping raw history
def compress_history(messages, keep_last=4):
    old = messages[:-keep_last]
    summary = llm.summarize(old)  # one short paragraph
    return [{"role": "system", "content": f"Prior context: {summary}"}] + messages[-keep_last:]

# 2. Truncate tool results
def trim_tool_result(result: str, max_chars=2000) -> str:
    if len(result) <= max_chars:
        return result
    return result[:max_chars] + "\n...[truncated]"

# 3. Sliding window + external memory
# Short-term: last N messages in prompt
# Long-term: vector DB / key-value store for facts the agent can re-fetch via tool
```

| Strategy | When to use |
|----------|-------------|
| **Sliding window** | Simple agents, short tasks |
| **Summarization** | Long multi-step workflows |
| **External memory tool** | "Remember user preferences across sessions" |
| **Structured state** | Pass `{step: 3, order_id: "X"}` not full chat log |
| **Token budget per tool** | Hard cap on each tool response size |

**Interview answer:**
> "Memory bloating happens because agent loops accumulate tool outputs and history in the context window. I mitigate it with sliding windows, summarizing older turns, truncating tool payloads, external memory for long-term facts, and hard limits on max iterations and tokens per request."

---

### 23.2 Partial Failures in Agentic AI

**What it is:** An agent runs a **multi-step plan** — call API A, then B, then C. Step B fails (timeout, 500, rate limit). Steps A may have already **committed** side effects (DB write, payment, email sent). The agent is now in an inconsistent state.

**Example — order cancellation agent:**
```
Step 1: Cancel order in DB        ✅ success
Step 2: Refund via payment API    ❌ timeout (unknown if refund happened)
Step 3: Send confirmation email   ⏸ never ran
```
User sees: order cancelled, no refund, no email. Agent may **hallucinate** "refund completed."

**Types of partial failure:**

| Type | Example |
|------|---------|
| **Tool timeout** | External API slow, agent retries blindly |
| **Idempotency violation** | Retry creates duplicate charge |
| **Inconsistent read** | Tool A updated DB, Tool B reads stale cache |
| **Orchestration gap** | 3 parallel tools, 1 fails — no rollback |
| **Human-in-the-loop timeout** | Agent waits for approval, session expires |

**Fixes:**

```
1. IDEMPOTENCY KEYS
   Every write tool accepts idempotency_key → safe retries

2. SAGA / COMPENSATING TRANSACTIONS
   Step 2 fails → run compensating action for Step 1
   (e.g. re-activate order if refund failed)

3. EXPLICIT STATE MACHINE
   Agent tracks: PENDING → REFUNDING → COMPLETED | FAILED
   Never skip states; resume from last known good state

4. OUTBOX PATTERN
   Write "refund pending" event to DB → async worker retries refund

5. HUMAN ESCALATION
   On partial failure → pause agent, alert ops, don't guess
```

```python
# Saga-style agent step with compensation
class AgentStep:
    def execute(self): ...
    def compensate(self): ...  # undo on downstream failure

steps = [CancelOrder(), RefundPayment(), SendEmail()]
completed = []
try:
    for step in steps:
        step.execute()
        completed.append(step)
except ToolError as e:
    for step in reversed(completed):
        step.compensate()
    raise AgentPartialFailure(e)
```

**Interview answer:**
> "Partial failures are inevitable in multi-tool agents. I design tools to be idempotent, use explicit workflow state, implement compensating transactions for critical paths, and never let the LLM assume a failed step succeeded — I verify tool responses and surface uncertainty to the user or a human queue."

---

### 23.3 Hallucinations in Agentic AI

**What it is:** The model produces **plausible but false** information — inventing API responses, tool names that don't exist, fake citations, or claiming an action succeeded when the tool returned an error.

**Agentic hallucination is worse than chat hallucination:**

| Chat hallucination | Agent hallucination |
|--------------------|---------------------|
| Wrong fact in text | **Wrong action taken** or **reported as done** |
| User can fact-check | Side effects may already be committed |
| No tool access | Model fakes tool output if not constrained |

**Common patterns:**
1. **Tool hallucination** — model calls `get_order_status_v2` when only `get_order_status` exists
2. **Result hallucination** — model says "refund processed" without calling refund tool
3. **Parameter hallucination** — invents `order_id: "12345"` instead of using user's real ID
4. **Source hallucination** — RAG cites documents that weren't retrieved
5. **Plan hallucination** — describes steps it never executed

**Fixes:**

```
GROUNDING
  □ Force answers only from tool results + retrieved docs
  □ System prompt: "Never state facts not in tool output"

TOOL CONSTRAINTS
  □ Strict JSON schema for tool args (reject invalid calls)
  □ Allowlist of tool names — reject unknown tools server-side

VERIFICATION LAYER
  □ After LLM says "done" → verify DB/API state matches claim
  □ Require tool success response before confirmation message

CITATIONS
  □ RAG: require chunk IDs in answer; display sources to user

CONFIDENCE & ABSTENTION
  □ "I don't know" / "I need to check" when retrieval empty
  □ Lower temperature for factual/tool-selection turns

EVAL SUITE
  □ Test: "Did agent call tool before claiming success?"
  □ Test: adversarial prompts that trick agent into faking results
```

```python
# Guardrail: verify before telling user success
def finalize_agent_response(claimed_action, tool_log):
    if claimed_action.requires_tool:
        if not tool_log.has_success(claimed_action.tool_name):
            return "I couldn't complete that action. Please try again."
    return claimed_action.message
```

**Interview answer:**
> "Agent hallucinations are dangerous because they can drive real side effects. I ground responses in tool outputs, validate tool calls against schemas, verify state before confirming success to the user, use RAG with citations, and run evals that specifically test for 'claimed success without tool call' scenarios."

---

### 23.4 Performance Issues in Agentic AI

**What it is:** Agents are **slow and expensive** compared to traditional APIs. Each "think → act → observe" cycle is at least one LLM call (often 2–10+ seconds). Multiple tools in sequence multiply latency. Unoptimized prompts burn tokens.

**Latency breakdown (typical agent request):**

```
User message                    0 ms
LLM call #1 (plan + tool pick)  1–4 s
Tool execution (API/DB)         200 ms – 5 s
LLM call #2 (interpret result)  1–4 s
LLM call #3 (next tool)         1–4 s
...
Final response synthesis        1–3 s
────────────────────────────────────
Total: 5–30+ seconds (multi-step)
```

**Cost breakdown:**
```
Input tokens:  system prompt + history + tool schemas + RAG chunks
Output tokens: reasoning + tool call JSON + final answer
Tool calls:    external API costs
Iterations:    5 loops × 8K tokens = 40K tokens/request
```

**Performance problems:**

| Problem | Impact |
|---------|--------|
| Sequential tool calls | Latency adds up linearly |
| Huge system prompt | Every call pays full prompt cost |
| Large tool schemas | 20 tools × 500 tokens = 10K overhead |
| No caching | Same RAG query embedded every turn |
| Wrong model size | GPT-4 for simple routing tasks |
| Unbounded loops | Agent runs 15 iterations on stuck task |

**Optimizations:**

```
LATENCY
  □ Parallel tool calls when independent (async gather)
  □ Route simple queries to small/fast model (Haiku, GPT-4o-mini)
  □ Cache frequent RAG embeddings and retrieval results
  □ Stream partial responses to user (SSE)
  □ Pre-compute tool schemas; don't rebuild each request
  □ Set max_iterations (e.g. 5) — fail fast

COST
  □ Smaller model for planning vs execution
  □ Prompt compression / remove redundant examples
  □ Only inject relevant tools per step (dynamic tool loading)
  □ Batch embedding jobs offline
  □ Log tokens per request; alert on outliers

THROUGHPUT
  □ Queue long agent jobs (async: "we'll email you")
  □ Rate limit per user
  □ Separate worker pool for tool execution
  □ Circuit breaker on slow external APIs
```

```python
# Model routing — cheap model for classification, expensive for synthesis
intent = fast_model.classify(user_message)  # 200ms
if intent == "simple_faq":
    return fast_model.answer(user_message)
else:
    return agent_loop(capable_model, tools)  # multi-step
```

**Metrics to monitor:**

| Metric | Target (rule of thumb) |
|--------|------------------------|
| P95 latency | < 15s for 3-step agent |
| Tokens/request | Track trend; alert if 2× baseline |
| Cost/request | Dashboard per feature |
| Tool error rate | < 2% |
| Iterations to complete | Avg < 4 |
| User abandonment | Spike = too slow |

**Interview answer:**
> "Agent performance is dominated by sequential LLM round-trips. I parallelize independent tools, use model routing for simple vs complex tasks, cap iterations, cache RAG results, stream responses, and monitor P95 latency and token cost per request with alerts on regression."

---

### 23.5 Interview Q&A — Agentic AI Failures

**Q: What is memory bloating in agents?**  
A: Unbounded growth of context from chat history, tool outputs, and RAG chunks across agent loops — causing high cost, latency, and degraded instruction-following. Fix with summarization, sliding windows, truncated tool results, and external memory.

**Q: How do you handle partial failures?**  
A: Idempotent tools, saga/compensating transactions, explicit workflow state, async retry via outbox pattern, and human escalation — never let the LLM assume an uncertain step succeeded.

**Q: How are agent hallucinations different from chat hallucinations?**  
A: They can trigger or misreport real tool actions. Mitigate with schema validation, grounding in tool output, post-action verification, and evals for fake success claims.

**Q: Why are agents slow?**  
A: Multiple sequential LLM calls plus tool latency. Optimize with parallel tools, model routing, caching, streaming, iteration limits, and async processing for long jobs.

**Q: Name four production risks of agentic AI.**  
A: Memory bloating, partial failures, hallucinations, performance/cost — plus security (tool injection) as a fifth bonus topic.

---

## Quick Reference Card

```
Agent       = LLM + Tools + Loop + Memory + Guardrails
MCP Server  = Code you write (NOT trained) — exposes tools/resources/prompts
Prompt      = Instructions (system + user + examples)
Context     = What the LLM sees (docs, history, tool results)
RAG         = Retrieve your data at runtime (most common "training")
Fine-tuning = Actually retrain model weights (rare, advanced)

Skill path:
  Prompts → Tools → Agent loop → MCP → Context/RAG → Evals → Production

Sections to master:
  16 = Prompts | 17 = Context | 18 = Agents | 19 = MCP | 20 = "Training"
  23 = Production failures (memory, partial fail, hallucination, performance)
```

---

*Last updated: June 2026 | Level: Beginner → Pro | Agents, MCP, Prompts & Context*
