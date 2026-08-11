# LangGraph — Complete Guide
### Stateful, Multi-Step LLM Agents as Graphs | State → Nodes → Edges → Cycles

---

## TABLE OF CONTENTS
1. [What LangGraph Is & Why It Exists](#1-what-langgraph-is--why-it-exists)
2. [Installation & Core Concepts](#2-installation--core-concepts)
3. [Building Your First Graph](#3-building-your-first-graph)
4. [State & Reducers](#4-state--reducers)
5. [Conditional Edges & Routing](#5-conditional-edges--routing)
6. [Cycles & the Agent Loop](#6-cycles--the-agent-loop)
7. [Tools & the Prebuilt ReAct Agent](#7-tools--the-prebuilt-react-agent)
8. [Persistence & Memory with Checkpointers](#8-persistence--memory-with-checkpointers)
9. [Human-in-the-Loop & Interrupts](#9-human-in-the-loop--interrupts)
10. [Streaming & Observability](#10-streaming--observability)
11. [Multi-Agent Patterns](#11-multi-agent-patterns)
12. [Interview Q&A](#12-interview-qa)

---

## 1. What LangGraph Is & Why It Exists

**Theory.** LangChain chains are **linear and stateless** — data flows in one direction, A → B → C, and nothing loops back. But real agents need to *think in circles*: call a tool, look at the result, decide whether to call another tool or answer, and possibly repeat many times. Expressing that with plain chains quickly becomes a tangle of conditionals. **LangGraph models an agent as a state machine — a directed graph** where each **node** is a step (usually a function or an LLM call), each **edge** decides which node runs next, and a shared **state** object is threaded through every node and updated as the computation proceeds. Crucially, edges can be **conditional** (branch based on the current state) and can form **cycles** (return to an earlier node), which is exactly what a reasoning loop needs. On top of this, LangGraph adds three things that make agents production-grade: **persistence** (checkpoint the state so a run can pause and resume, or survive a restart), **human-in-the-loop** (pause for approval before a risky action), and **streaming** of intermediate steps. It's built by the LangChain team and interoperates fully with LangChain components.

```
LangChain chain (linear):     Prompt → Model → Parser        (one pass, no memory of steps)

LangGraph (state machine):
                    ┌─────────────┐
        START ─────▶│    agent    │◀──────┐
                    └──────┬──────┘       │
                    conditional edge      │  loop back
                     ╱            ╲       │
              (needs tool)     (done)     │
                   ▼                ▼      │
              ┌────────┐          END      │
              │  tools │──────────────────┘
              └────────┘
   A shared State dict flows through every node and is updated each step.
```

---

## 2. Installation & Core Concepts

**Theory.** Four concepts define every LangGraph program. **State** is a typed dictionary (usually a `TypedDict`) that holds everything the graph knows — messages so far, intermediate results, counters. **Nodes** are plain functions that receive the current state and return a partial update to it (you return only the keys you changed). **Edges** connect nodes: a *normal* edge always goes to a fixed next node, while a *conditional* edge runs a function that inspects the state and returns the name of the next node. Two special sentinels, `START` and `END`, mark where execution begins and finishes. You describe the graph with a `StateGraph` builder, then **compile** it into a runnable app that exposes the same `.invoke()`/`.stream()` interface as any LangChain Runnable.

```python
pip install langgraph langchain-openai

from typing import TypedDict
from langgraph.graph import StateGraph, START, END

# 1. Define the shape of the shared state
class State(TypedDict):
    topic: str
    joke: str

# 2. Nodes are functions: (state) -> partial state update
def write_joke(state: State) -> dict:
    return {"joke": f"Here's a joke about {state['topic']}..."}

# 3. Build the graph
builder = StateGraph(State)
builder.add_node("writer", write_joke)
builder.add_edge(START, "writer")     # entry point
builder.add_edge("writer", END)       # exit

# 4. Compile into a runnable app
graph = builder.compile()
print(graph.invoke({"topic": "databases"}))   # {'topic': ..., 'joke': ...}
```

---

## 3. Building Your First Graph

**Theory.** A useful graph chains several nodes, each transforming the state. The mental model is a pipeline where each stage can read the full accumulated state and contribute its piece — because nodes return *partial* updates, LangGraph merges each return value into the running state for you. This example runs a small content pipeline (draft → review → finalize) as three nodes connected by normal edges, showing how state accumulates across steps.

```python
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

class State(TypedDict):
    request: str
    draft: str
    review: str
    final: str

def draft_node(state: State) -> dict:
    out = llm.invoke(f"Write a short paragraph: {state['request']}")
    return {"draft": out.content}

def review_node(state: State) -> dict:
    out = llm.invoke(f"List one improvement for:\n{state['draft']}")
    return {"review": out.content}

def finalize_node(state: State) -> dict:
    out = llm.invoke(f"Rewrite applying this feedback:\n{state['draft']}\n\n{state['review']}")
    return {"final": out.content}

builder = StateGraph(State)
builder.add_node("draft", draft_node)
builder.add_node("review", review_node)
builder.add_node("finalize", finalize_node)
builder.add_edge(START, "draft")
builder.add_edge("draft", "review")
builder.add_edge("review", "finalize")
builder.add_edge("finalize", END)

graph = builder.compile()
result = graph.invoke({"request": "explain database indexing"})
print(result["final"])
```

---

## 4. State & Reducers

**Theory.** By default, when a node returns a value for a key, it **overwrites** the previous value. That's wrong for things you want to *accumulate* — most importantly the list of chat messages, where each node should *append* rather than replace. **Reducers** control how updates merge into the state. You attach a reducer to a field with `Annotated[type, reducer_fn]`; the built-in `add_messages` reducer appends new messages (and smartly de-duplicates/updates by id). This is why almost every LangGraph agent defines its state as `messages: Annotated[list, add_messages]` — it turns the message list into an append-only conversation log that every node contributes to.

```python
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, AIMessage

# add_messages = reducer that APPENDS to the list instead of overwriting it
class State(TypedDict):
    messages: Annotated[list, add_messages]

def chatbot(state: State) -> dict:
    # return a NEW message; the reducer appends it to the running list
    from langchain_openai import ChatOpenAI
    llm = ChatOpenAI(model="gpt-4o-mini")
    return {"messages": [llm.invoke(state["messages"])]}

builder = StateGraph(State)
builder.add_node("chatbot", chatbot)
builder.add_edge(START, "chatbot")
builder.add_edge("chatbot", END)
graph = builder.compile()

# messages accumulate across the conversation
out = graph.invoke({"messages": [HumanMessage(content="Hi, I'm learning Python")]})
print(out["messages"][-1].content)
```

Custom reducer (e.g., sum a counter across nodes):

```python
from typing import Annotated, TypedDict
import operator

class State(TypedDict):
    total: Annotated[int, operator.add]   # each node's 'total' is ADDED, not replaced
    log: Annotated[list, operator.add]    # lists concatenate
```

---

## 5. Conditional Edges & Routing

**Theory.** The power of a graph over a linear chain is **branching**. A conditional edge attaches a **router function** to a node: after that node runs, the router inspects the state and returns the name of the next node to execute. This is how an agent decides "do I need a tool, or can I answer now?", how you build classifiers that route a support ticket to different handlers, and how you implement retry-or-give-up logic. You provide `add_conditional_edges(source, router, mapping)` where the mapping translates the router's return value into a destination node (or `END`).

```python
from typing import TypedDict, Literal
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    text: str
    category: str

def classify(state: State) -> dict:
    text = state["text"].lower()
    cat = "billing" if "payment" in text or "charge" in text else "technical"
    return {"category": cat}

def handle_billing(state): return {"text": "Routed to billing team."}
def handle_technical(state): return {"text": "Routed to tech support."}

# Router: reads state, returns the KEY of the next node
def route(state: State) -> Literal["billing", "technical"]:
    return state["category"]

builder = StateGraph(State)
builder.add_node("classify", classify)
builder.add_node("billing", handle_billing)
builder.add_node("technical", handle_technical)
builder.add_edge(START, "classify")
builder.add_conditional_edges(
    "classify", route,
    {"billing": "billing", "technical": "technical"},   # router value -> node
)
builder.add_edge("billing", END)
builder.add_edge("technical", END)
graph = builder.compile()

print(graph.invoke({"text": "I was double charged for my payment"}))
```

---

## 6. Cycles & the Agent Loop

**Theory.** Cycles are what make LangGraph an *agent* framework rather than just a workflow tool. The canonical **ReAct loop** is: an `agent` node calls the LLM; a conditional edge checks whether the LLM asked to call a tool; if yes, a `tools` node executes it and loops **back** to the agent with the result; if no, the graph ends. Because the graph can revisit the agent node any number of times, the model can chain several tool calls to solve a multi-step task. The one thing you must guard against is an infinite loop — set a **recursion limit** (or a step counter in state) so a misbehaving agent stops instead of running forever.

```python
from typing import Annotated, TypedDict, Literal
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

@tool
def get_stock_price(symbol: str) -> str:
    """Return the current price for a stock symbol."""
    return f"{symbol} is trading at $184.20"

tools = [get_stock_price]
llm = ChatOpenAI(model="gpt-4o-mini").bind_tools(tools)

class State(TypedDict):
    messages: Annotated[list, add_messages]

def agent(state: State) -> dict:
    return {"messages": [llm.invoke(state["messages"])]}

# Conditional edge: if the last AI message requested a tool, go to 'tools', else END
def should_continue(state: State) -> Literal["tools", "__end__"]:
    last = state["messages"][-1]
    return "tools" if last.tool_calls else END

builder = StateGraph(State)
builder.add_node("agent", agent)
builder.add_node("tools", ToolNode(tools))      # prebuilt node that runs tool calls
builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
builder.add_edge("tools", "agent")              # <-- the CYCLE: loop back to reason again
graph = builder.compile()

out = graph.invoke(
    {"messages": [("human", "What's the price of AAPL?")]},
    config={"recursion_limit": 10},              # safety cap on loop iterations
)
print(out["messages"][-1].content)
```

---

## 7. Tools & the Prebuilt ReAct Agent

**Theory.** Writing the agent loop by hand (previous section) is educational, but LangGraph ships a batteries-included helper, `create_react_agent`, that builds the exact agent↔tools cycle for you from a model and a list of tools. It's the fastest way to get a working tool-using agent, and it accepts the same production features (checkpointer for memory, interrupts for human approval). Use the prebuilt agent for standard cases; drop down to a hand-built graph when you need custom nodes, non-standard routing, or multiple cooperating agents.

```python
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

@tool
def search_docs(query: str) -> str:
    """Search internal documentation for a query."""
    return "Refunds are processed within 5 business days."

@tool
def create_ticket(summary: str) -> str:
    """Open a support ticket with a summary."""
    return "Ticket #4821 created."

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# One call builds the full stateful agent graph
agent = create_react_agent(
    llm,
    tools=[search_docs, create_ticket],
    checkpointer=MemorySaver(),          # gives the agent conversation memory
)

cfg = {"configurable": {"thread_id": "customer-1"}}
out = agent.invoke({"messages": [("human", "How long do refunds take?")]}, cfg)
print(out["messages"][-1].content)
```

---

## 8. Persistence & Memory with Checkpointers

**Theory.** A **checkpointer** saves a snapshot of the graph's state after every step, keyed by a `thread_id`. This single feature unlocks several capabilities at once. **Memory:** because state (including the message history) is persisted per thread, the next `invoke` with the same `thread_id` automatically resumes the conversation — no manual history wiring. **Fault tolerance:** if the process crashes mid-run, you can reload the last checkpoint and continue. **Time travel:** you can inspect or rewind to any past checkpoint to debug or branch. In development you use `MemorySaver` (in-process); in production you use a durable backend like `SqliteSaver` or `PostgresSaver` so state survives restarts and is shared across servers. The `thread_id` is the key abstraction — think of it as one conversation/session.

```python
from langgraph.checkpoint.memory import MemorySaver
# from langgraph.checkpoint.postgres import PostgresSaver   # production

graph = builder.compile(checkpointer=MemorySaver())

# Same thread_id => the graph resumes with all prior state/messages
cfg = {"configurable": {"thread_id": "session-99"}}
graph.invoke({"messages": [("human", "My budget is $500")]}, cfg)
graph.invoke({"messages": [("human", "What was my budget?")]}, cfg)  # remembers $500

# Inspect the current saved state (great for debugging)
snapshot = graph.get_state(cfg)
print(snapshot.values)          # the full state dict
print(snapshot.next)            # which node(s) would run next
```

---

## 9. Human-in-the-Loop & Interrupts

**Theory.** For high-stakes actions — sending money, deleting data, emailing a customer — you don't want a fully autonomous agent. LangGraph's **interrupts** let a graph **pause before (or after) a chosen node**, hand control back to your application for a human to review, and then **resume** exactly where it left off (this works precisely because the checkpointer has saved the state). You compile the graph with `interrupt_before=["sensitive_node"]`; the first `invoke` runs up to that node and stops, you inspect the pending state, and a second `invoke` with `None` as input continues. This turns an agent from "hope it does the right thing" into "propose, get approval, then act."

```python
from langgraph.checkpoint.memory import MemorySaver

# Pause the graph right before the 'execute_payment' node runs
graph = builder.compile(
    checkpointer=MemorySaver(),
    interrupt_before=["execute_payment"],
)

cfg = {"configurable": {"thread_id": "order-7"}}

# Run stops at the interrupt and returns the current state
graph.invoke({"messages": [("human", "Pay invoice #12 for $900")]}, cfg)

state = graph.get_state(cfg)
print("About to run:", state.next)          # ('execute_payment',)

# A human reviews... if approved, resume by invoking with None
approved = True
if approved:
    result = graph.invoke(None, cfg)          # continues from the checkpoint
    print(result["messages"][-1].content)
```

---

## 10. Streaming & Observability

**Theory.** Long agent runs feel opaque if the user only sees the final answer. LangGraph streams at multiple granularities so you can surface progress: stream **values** (the full state after each node), **updates** (just what each node changed), or **messages** (LLM tokens as they generate). This is what powers agent UIs that show "searching…", "calling tool…", then the streamed answer. For deeper debugging, LangGraph integrates with **LangSmith**: every node execution, tool call, and state transition is traced with inputs, outputs, latency, and cost — indispensable when an agent takes a wrong turn and you need to see which node made the bad decision.

```python
# Stream what each node changes, as it happens
for event in graph.stream({"messages": [("human", "Research and summarize X")]}, cfg,
                          stream_mode="updates"):
    for node_name, update in event.items():
        print(f"[{node_name}] ->", update)

# Stream LLM tokens (for a chat UI)
for msg, meta in graph.stream(inputs, cfg, stream_mode="messages"):
    print(msg.content, end="", flush=True)

# Observability: set LANGCHAIN_TRACING_V2=true and LANGCHAIN_API_KEY to trace in LangSmith
```

---

## 11. Multi-Agent Patterns

**Theory.** Complex problems are often better solved by **several specialized agents** than one do-everything agent. LangGraph expresses this naturally because each agent can itself be a node in a larger graph. The common topologies are: **supervisor** (a coordinator agent routes each task to the right worker agent and collects results — the most popular pattern), **network** (agents can hand off to each other freely), and **hierarchical** (teams of agents, each with a sub-supervisor). The shared state carries the conversation and results between agents, and conditional edges implement the "hand-off" decisions. The design principle mirrors microservices: give each agent a narrow, well-defined responsibility and a clear interface, and let a supervisor orchestrate them.

```python
from typing import Annotated, TypedDict, Literal
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

class State(TypedDict):
    messages: Annotated[list, add_messages]
    next: str

def supervisor(state: State) -> dict:
    # Decide which specialist should act next (an LLM call in practice)
    # returns e.g. {"next": "researcher"} or {"next": "FINISH"}
    ...

def researcher(state: State) -> dict: ...
def writer(state: State) -> dict: ...

def route(state: State) -> Literal["researcher", "writer", "__end__"]:
    return END if state["next"] == "FINISH" else state["next"]

builder = StateGraph(State)
builder.add_node("supervisor", supervisor)
builder.add_node("researcher", researcher)
builder.add_node("writer", writer)
builder.add_edge(START, "supervisor")
builder.add_conditional_edges("supervisor", route,
    {"researcher": "researcher", "writer": "writer", END: END})
builder.add_edge("researcher", "supervisor")   # workers report back to supervisor
builder.add_edge("writer", "supervisor")
graph = builder.compile()
```

---

## 12. Interview Q&A

**Q: How is LangGraph different from LangChain?**
A: LangChain composes linear, stateless chains (A→B→C). LangGraph models an agent as a stateful graph with nodes, edges, conditional branching, and cycles, plus persistence, human-in-the-loop, and streaming. Use LangChain for predictable pipelines; use LangGraph when you need loops, branching, and durable multi-step agent behavior. They interoperate — LangGraph nodes are usually LangChain components.

**Q: What are the core primitives of LangGraph?**
A: State (a typed dict threaded through the graph), Nodes (functions that read state and return partial updates), Edges (normal edges to a fixed node, conditional edges chosen by a router function), and the START/END sentinels. You build with a StateGraph and compile it into a runnable app.

**Q: What is a reducer and why do you need `add_messages`?**
A: By default a node's returned value overwrites a state key. A reducer defines how updates merge instead. `add_messages` appends new messages to the list (and updates by id) rather than replacing it, which is why agent state is typically `messages: Annotated[list, add_messages]` — it builds an append-only conversation log.

**Q: How does LangGraph create an agent loop, and how do you prevent infinite loops?**
A: With a cycle: the agent node calls the LLM, a conditional edge checks whether it requested a tool, the tools node runs it and an edge loops back to the agent. You cap iterations with a `recursion_limit` (or a counter in state) so a misbehaving agent halts.

**Q: What does a checkpointer give you?**
A: It saves state after each step keyed by `thread_id`, providing conversation memory (resume the same thread), fault tolerance (reload after a crash), time-travel debugging, and it's what makes interrupts/human-in-the-loop possible. MemorySaver for dev; SqliteSaver/PostgresSaver for production.

**Q: How do you implement human-in-the-loop?**
A: Compile with `interrupt_before=["node"]`. The graph runs up to that node and pauses (state saved by the checkpointer). Your app reviews the pending state; to proceed you invoke again with `None`, and the graph resumes from the checkpoint. Used to require approval before sensitive actions.

**Q: When would you use a multi-agent design?**
A: When a task spans distinct skills better handled by specialized agents. Common pattern is a supervisor that routes subtasks to worker agents and aggregates results. Each agent is a node; shared state passes context; conditional edges implement hand-offs — analogous to microservices with a coordinator.

**Q: How do you debug a LangGraph agent?**
A: Stream intermediate updates (`stream_mode="updates"`) to see each node's changes, inspect saved state with `get_state`, and use LangSmith tracing to view every node/tool call with inputs, outputs, latency, and cost to find where the agent went wrong.
