# LangChain — Complete Guide
### Building LLM Applications in Python | Prompts → Chains → RAG → Agents

---

## TABLE OF CONTENTS
1. [What LangChain Is & Why It Exists](#1-what-langchain-is--why-it-exists)
2. [Installation & Project Setup](#2-installation--project-setup)
3. [Chat Models & Messages](#3-chat-models--messages)
4. [Prompt Templates](#4-prompt-templates)
5. [Output Parsers & Structured Output](#5-output-parsers--structured-output)
6. [LCEL — Composing Chains with Runnables](#6-lcel--composing-chains-with-runnables)
7. [Retrieval-Augmented Generation (RAG)](#7-retrieval-augmented-generation-rag)
8. [Memory & Conversation History](#8-memory--conversation-history)
9. [Tools & Agents](#9-tools--agents)
10. [Streaming, Async & Batching](#10-streaming-async--batching)
11. [Observability, Caching & Production](#11-observability-caching--production)
12. [Interview Q&A](#12-interview-qa)

---

## 1. What LangChain Is & Why It Exists

**Theory.** A raw large-language-model call is just "text in, text out." Real applications need much more around that call: reusable prompt templates, a way to feed the model your own documents, parsing the reply into structured data, remembering the conversation, letting the model call tools, and swapping one provider for another without rewriting everything. **LangChain is the framework that standardizes all of that plumbing.** Its core value is a single, consistent interface — the **Runnable** — that every building block implements, so prompts, models, parsers, and retrievers can be *composed* into pipelines like Lego bricks. The ecosystem is split into small packages: `langchain-core` (the base abstractions and the Runnable protocol), provider integrations (`langchain-openai`, `langchain-anthropic`, `langchain-google-genai`, …), and `langchain-community` (loaders, vector stores, and third-party tools). The practical payoff is **portability and speed**: you write your logic once against the interfaces, and changing model provider, vector database, or output format becomes a one-line swap rather than a rewrite.

```
The LangChain mental model:

  Prompt Template  →  Chat Model  →  Output Parser
        (fill)          (call)          (shape)
        \_________________ LCEL pipe ________________/

  Add your data:   Loader → Splitter → Embeddings → Vector Store → Retriever  (RAG)
  Add memory:      conversation history injected into the prompt each turn
  Add autonomy:    Tools + an Agent that decides which tool to call and when
```

---

## 2. Installation & Project Setup

**Theory.** LangChain is modular by design, so you install only the pieces you need: the core, one provider package for the model you'll use, and optionally community integrations for loaders and vector stores. API keys are read from environment variables — never hard-code them — and the standard practice is a `.env` file loaded at startup. Pinning versions matters here because the LLM ecosystem moves fast and interfaces occasionally shift between minor versions.

```python
# Install core + a provider (OpenAI shown) + community integrations
pip install langchain langchain-core langchain-openai langchain-community
pip install python-dotenv          # load API keys from .env
pip install faiss-cpu              # a local vector store for RAG (section 7)

# .env
# OPENAI_API_KEY=sk-...
```

```python
# app.py — load keys and create a model
from dotenv import load_dotenv
load_dotenv()                       # reads .env into environment variables

from langchain_openai import ChatOpenAI

# temperature 0 = deterministic/factual; higher = more creative
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

response = llm.invoke("Explain what an idempotent API is in one sentence.")
print(response.content)
```

---

## 3. Chat Models & Messages

**Theory.** Modern LLMs are **chat models**: instead of a single string, they take a *list of messages*, each with a role. The three roles you use constantly are **System** (sets behavior and rules — "you are a terse senior engineer"), **Human** (the user's input), and **AI** (the model's previous replies, which you replay to give it conversational context). LangChain represents these as `SystemMessage`, `HumanMessage`, and `AIMessage` objects, and normalizes them across every provider so the same code works whether you call OpenAI, Anthropic, or a local model. The universal entry point is `.invoke()`, which returns an `AIMessage` whose `.content` holds the text and whose metadata carries token usage and finish reason.

```python
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

messages = [
    SystemMessage(content="You are a concise assistant. Answer in one line."),
    HumanMessage(content="What is a race condition?"),
]

reply = llm.invoke(messages)          # returns an AIMessage
print(reply.content)                  # the text
print(reply.response_metadata)        # token usage, model, finish reason

# Multi-turn: replay the AI's previous answer so it 'remembers' context
messages.append(reply)                                        # the AIMessage
messages.append(HumanMessage(content="Give me a code example."))
print(llm.invoke(messages).content)
```

Key model parameters:

```python
ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,          # randomness: 0 = deterministic, 1+ = creative
    max_tokens=500,         # cap the length of the response
    timeout=30,             # fail fast instead of hanging
    max_retries=2,          # auto-retry transient provider errors
)
```

---

## 4. Prompt Templates

**Theory.** Hard-coding prompts as f-strings scattered through your code is fragile. A **PromptTemplate** turns a prompt into a reusable object with named variables that you fill in at call time — the same idea as a parameterized SQL query. For chat models you use `ChatPromptTemplate`, which builds the full list of role-tagged messages from placeholders. Two features make templates powerful: `MessagesPlaceholder`, which reserves a slot to inject prior conversation history at runtime, and **few-shot templates**, which embed worked examples into the prompt to steer the model's format and style. Because a template is itself a Runnable, it plugs directly into a pipeline.

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a {role}. Keep answers under {word_limit} words."),
    MessagesPlaceholder("history"),          # slot for past turns (optional)
    ("human", "{question}"),
])

# .format_messages fills the variables and returns real Message objects
msgs = prompt.format_messages(
    role="database expert",
    word_limit=40,
    history=[],
    question="What is an index?",
)
```

Few-shot prompting (teach the format by example):

```python
from langchain_core.prompts import FewShotChatMessagePromptTemplate, ChatPromptTemplate

examples = [
    {"input": "2 + 2", "output": "4"},
    {"input": "5 * 3", "output": "15"},
]
example_prompt = ChatPromptTemplate.from_messages([
    ("human", "{input}"),
    ("ai", "{output}"),
])
few_shot = FewShotChatMessagePromptTemplate(
    example_prompt=example_prompt,
    examples=examples,
)
final_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a calculator. Reply with only the number."),
    few_shot,
    ("human", "{input}"),
])
```

---

## 5. Output Parsers & Structured Output

**Theory.** Models return free-form text, but applications need *structured* data — a JSON object, a list, a typed record you can store in a database. **Output parsers** bridge that gap. The simplest, `StrOutputParser`, just extracts the `.content` string. More usefully, you can bind a **Pydantic schema** to the model so it returns a validated object: `.with_structured_output(Schema)` instructs the model (via function/tool calling under the hood) to emit data matching your schema and hands you back a real Python object — no brittle regex, no manual JSON parsing, and automatic validation. This is the single most important technique for making LLM output reliable enough to build on.

```python
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI

class SupportTicket(BaseModel):
    """Structured representation of a customer message."""
    category: str = Field(description="one of: billing, technical, account")
    priority: str = Field(description="low, medium, or high")
    summary: str = Field(description="one-sentence summary")

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
structured_llm = llm.with_structured_output(SupportTicket)

ticket = structured_llm.invoke(
    "My payment failed three times and now I've been double charged!"
)
print(ticket.category, ticket.priority)   # -> billing high
print(type(ticket))                       # -> <class 'SupportTicket'> (validated!)
```

String and list parsers for lighter cases:

```python
from langchain_core.output_parsers import StrOutputParser, CommaSeparatedListOutputParser

str_parser = StrOutputParser()            # AIMessage -> plain string
list_parser = CommaSeparatedListOutputParser()  # "a, b, c" -> ["a", "b", "c"]
```

---

## 6. LCEL — Composing Chains with Runnables

**Theory.** **LCEL (LangChain Expression Language)** is the heart of modern LangChain. Every component — prompt, model, parser, retriever, even a plain function — implements the **Runnable** interface, which means they all share the same methods (`invoke`, `batch`, `stream`, and their async versions) and can be wired together with the pipe operator `|`. Reading `prompt | model | parser` left to right: the prompt's output becomes the model's input, and the model's output becomes the parser's input. You get streaming, batching, async, and retries **for free** on any chain you build, because those behaviors live in the Runnable protocol itself. Two helpers round it out: `RunnableParallel` (run several branches at once and collect their results into a dict) and `RunnablePassthrough` (forward the input unchanged, useful for RAG where you need to keep the original question alongside retrieved context).

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

prompt = ChatPromptTemplate.from_template(
    "Summarize this in one sentence:\n\n{text}"
)
model = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# The pipe builds a single composed Runnable
chain = prompt | model | StrOutputParser()

print(chain.invoke({"text": "LangChain standardizes LLM app building..."}))

# Batch many inputs in one call (parallelized automatically)
print(chain.batch([{"text": "..."}, {"text": "..."}]))
```

Parallel branches and passthrough:

```python
from langchain_core.runnables import RunnableParallel, RunnablePassthrough

# Run two independent chains at once, collect into a dict
combined = RunnableParallel(
    summary=prompt | model | StrOutputParser(),
    original=RunnablePassthrough(),        # pass the raw input through unchanged
)

# Insert a plain Python function anywhere in a chain
from langchain_core.runnables import RunnableLambda
upper = RunnableLambda(lambda x: x.upper())
chain2 = prompt | model | StrOutputParser() | upper
```

---

## 7. Retrieval-Augmented Generation (RAG)

**Theory.** An LLM only knows what was in its training data — it cannot answer questions about your private documents, and it will confidently *hallucinate* when it doesn't know. **RAG fixes this by retrieving relevant text from your own data and inserting it into the prompt** so the model answers from facts you supply. The pipeline has five stages. (1) **Load** documents (PDFs, web pages, databases) into a common `Document` format. (2) **Split** them into chunks small enough to fit in the prompt and to embed meaningfully. (3) **Embed** each chunk — convert text into a vector (a list of numbers) that captures its meaning, using an embeddings model. (4) Store those vectors in a **vector store** that can find the nearest vectors to a query. (5) At question time, embed the question, **retrieve** the most similar chunks, and stuff them into the prompt as context. The model then answers grounded in real data, and you can even cite the source chunks. Chunk size and overlap are the key tuning knobs: too large wastes context and blurs relevance, too small loses meaning.

```python
# 1. LOAD — turn a source into Document objects
from langchain_community.document_loaders import WebBaseLoader, PyPDFLoader

docs = WebBaseLoader("https://example.com/handbook").load()
# docs = PyPDFLoader("policy.pdf").load()

# 2. SPLIT — break into overlapping chunks
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,        # ~chars per chunk
    chunk_overlap=150,      # overlap keeps context across chunk boundaries
)
chunks = splitter.split_documents(docs)

# 3 + 4. EMBED + STORE — vectorize and index for similarity search
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = FAISS.from_documents(chunks, embeddings)

# 5. RETRIEVE — get the top-k most relevant chunks for a query
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
```

Wire retrieval into an LCEL chain (the full RAG chain):

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

prompt = ChatPromptTemplate.from_template(
    "Answer the question using ONLY the context below. "
    "If the answer isn't in the context, say you don't know.\n\n"
    "Context:\n{context}\n\nQuestion: {question}"
)
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

def format_docs(docs):
    return "\n\n".join(d.page_content for d in docs)

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

print(rag_chain.invoke("What is our refund policy?"))
```

---

## 8. Memory & Conversation History

**Theory.** LLM calls are **stateless** — the model forgets everything between requests. To hold a conversation, *you* must store past turns and replay them on each new call. LangChain's modern approach wraps any chain with `RunnableWithMessageHistory`, which automatically loads the history for a given `session_id`, injects it into the `MessagesPlaceholder` slot of your prompt, runs the chain, and saves the new turn back. History can live in memory (for a demo), or in Redis/Postgres/a database (for production, so it survives restarts and scales across servers). The important trade-off is **context length and cost**: history grows every turn, so long conversations are trimmed (keep the last N messages) or summarized (replace old turns with a running summary) to stay within the model's context window and control token spend.

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_openai import ChatOpenAI

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    MessagesPlaceholder("history"),
    ("human", "{input}"),
])
chain = prompt | ChatOpenAI(model="gpt-4o-mini")

# Store one history object per session (swap for Redis/DB in production)
_store = {}
def get_history(session_id: str):
    if session_id not in _store:
        _store[session_id] = InMemoryChatMessageHistory()
    return _store[session_id]

conversational = RunnableWithMessageHistory(
    chain,
    get_history,
    input_messages_key="input",
    history_messages_key="history",
)

cfg = {"configurable": {"session_id": "user-42"}}
conversational.invoke({"input": "My name is Priya."}, config=cfg)
print(conversational.invoke({"input": "What's my name?"}, config=cfg).content)
# -> knows it's Priya, because history was replayed
```

---

## 9. Tools & Agents

**Theory.** A chain follows a fixed, predetermined path. An **agent** is different: it uses the LLM itself to *decide what to do next* — which **tool** to call, with what arguments, and when it has enough information to answer. A **tool** is simply a Python function exposed to the model with a name, a description, and a typed signature (the `@tool` decorator does this). The model reads the tool descriptions and, when a query needs one (fetch live data, do math, query a database, call an API), it emits a structured **tool call**; your code runs the function and feeds the result back; the model then continues. This loop — reason, act, observe, repeat — is the **ReAct** pattern. Agents are powerful but less predictable and more expensive than chains, so the rule of thumb is: use a chain when the steps are known in advance, and an agent only when the path genuinely depends on the input. (For complex, stateful, multi-step agents with branching and human-in-the-loop, graduate to **LangGraph** — guide 34.)

```python
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

# 1. Define tools — the docstring is what the model reads to decide usage
@tool
def get_weather(city: str) -> str:
    """Get the current weather for a given city."""
    return f"It's 28°C and sunny in {city}."

@tool
def multiply(a: int, b: int) -> int:
    """Multiply two integers together."""
    return a * b

tools = [get_weather, multiply]

# 2. Give the model access to the tools
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
llm_with_tools = llm.bind_tools(tools)

# 3. The model returns tool calls; you execute them and return results
msg = llm_with_tools.invoke("What's the weather in Pune and what is 12 x 8?")
for call in msg.tool_calls:
    print(call["name"], call["args"])   # e.g. get_weather {'city': 'Pune'}
```

Prebuilt agent executor (runs the reason→act loop for you):

```python
from langchain.agents import create_react_agent, AgentExecutor
from langchain import hub

prompt = hub.pull("hwchase17/react")          # a standard ReAct prompt
agent = create_react_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
executor.invoke({"input": "Weather in Pune, then multiply that temp by 2"})
```

---

## 10. Streaming, Async & Batching

**Theory.** Because everything is a Runnable, three execution modes come built-in without extra code. **Streaming** (`.stream()` / `.astream()`) yields the answer token-by-token as the model produces it — essential for chat UIs so users see output immediately instead of staring at a spinner. **Async** (`.ainvoke()`, `.astream()`) lets a single server handle many concurrent LLM calls efficiently, since each call is I/O-bound (waiting on the provider) and shouldn't block others — this is exactly what you want inside a FastAPI endpoint. **Batching** (`.batch()`) runs many inputs through the same chain in parallel, which is far faster and cheaper than looping one at a time. Choosing correctly: stream for interactive UX, async for concurrency, batch for bulk processing.

```python
# Streaming — print tokens as they arrive
for chunk in chain.stream({"text": "long document ..."}):
    print(chunk, end="", flush=True)

# Async (ideal inside FastAPI) — see guide 08, section 16
import asyncio
async def main():
    result = await chain.ainvoke({"text": "..."})
    async for chunk in chain.astream({"text": "..."}):
        print(chunk, end="")
asyncio.run(main())

# Batch — many inputs, parallelized
results = chain.batch(
    [{"text": "doc1"}, {"text": "doc2"}, {"text": "doc3"}],
    config={"max_concurrency": 5},     # cap parallel calls
)
```

---

## 11. Observability, Caching & Production

**Theory.** LLM apps are hard to debug because the "logic" lives in prompts and model behavior, not just code. **LangSmith** is LangChain's tracing platform: set a couple of environment variables and every chain run is recorded — each step's input/output, latency, token cost, and errors — so you can see exactly why a chain produced a bad answer. **Caching** avoids paying for the same call twice: an exact-match cache returns the stored response for identical prompts (great for tests and repeated queries). For production hardening you also add **retries and fallbacks** (retry transient failures; fall back to a cheaper or alternate model if the primary is down), **rate limiting and timeouts** (providers throttle and occasionally hang), and **cost controls** (cap `max_tokens`, prefer smaller models where quality allows, and monitor spend). Treat prompts like code — version them and evaluate changes against a test set before shipping.

```python
# Tracing with LangSmith — set env vars, no code changes needed
# LANGCHAIN_TRACING_V2=true
# LANGCHAIN_API_KEY=ls-...
# LANGCHAIN_PROJECT=my-app

# Exact-match response caching
from langchain_core.globals import set_llm_cache
from langchain_community.cache import InMemoryCache      # or SQLiteCache, RedisCache
set_llm_cache(InMemoryCache())

# Retries + fallback to a backup model
from langchain_openai import ChatOpenAI
primary = ChatOpenAI(model="gpt-4o", max_retries=3, timeout=30)
backup = ChatOpenAI(model="gpt-4o-mini")
robust = primary.with_fallbacks([backup])   # use backup if primary fails
```

---

## 12. Interview Q&A

**Q: What problem does LangChain solve?**
A: It standardizes the plumbing around LLM calls — prompt templating, feeding in your own data (RAG), parsing output into structured objects, conversation memory, tool use, and swapping providers. Its unifying abstraction is the Runnable interface, so components compose with the pipe operator and gain streaming/async/batch for free.

**Q: What is LCEL and why does it matter?**
A: LangChain Expression Language. Every component implements the Runnable protocol (`invoke`/`batch`/`stream` + async), so you connect them with `|` to form a pipeline. Because those methods live in the protocol, any chain you build automatically supports streaming, batching, async, and retries without extra code.

**Q: Explain RAG and when you'd use it.**
A: Retrieval-Augmented Generation. You load your documents, split them into chunks, embed the chunks into vectors, store them in a vector database, then at query time retrieve the most similar chunks and inject them into the prompt. Use it whenever the model must answer from private, current, or domain-specific data it wasn't trained on — it grounds answers in facts and reduces hallucination.

**Q: Why split documents into chunks, and how do you choose the size?**
A: Chunks must fit the model's context window and embed to a coherent meaning. Too large wastes tokens and dilutes relevance; too small loses context. Typical starting point is ~500–1000 characters with 10–20% overlap so meaning isn't cut across boundaries; tune based on your documents and retrieval quality.

**Q: What are embeddings?**
A: Numeric vectors that represent the meaning of text, produced by an embeddings model. Semantically similar texts have vectors that are close together (by cosine similarity), which is what lets a vector store find the chunks most relevant to a question.

**Q: Chain vs Agent — how do you decide?**
A: A chain runs a fixed, predetermined sequence of steps. An agent uses the LLM to decide which tool to call and when, looping reason→act→observe until it can answer. Use a chain when the steps are known ahead of time (predictable, cheaper); use an agent only when the path truly depends on the input. For complex stateful agents, use LangGraph.

**Q: How do you make LLM output reliable/structured?**
A: Use `.with_structured_output(PydanticModel)` (or an output parser). The model is instructed via function/tool calling to emit data matching your schema, which LangChain validates and returns as a typed Python object — eliminating brittle text parsing.

**Q: How does memory work if LLMs are stateless?**
A: You store past messages yourself and replay them each turn. `RunnableWithMessageHistory` loads history by `session_id`, injects it into a `MessagesPlaceholder`, and saves new turns. In production the store is Redis/Postgres. Long conversations are trimmed or summarized to stay within the context window and control cost.

**Q: How do you debug and productionize a LangChain app?**
A: Use LangSmith tracing to inspect each step's I/O, latency, and cost. Add response caching, retries with fallbacks to a backup model, timeouts and rate limiting, and cap `max_tokens`. Version prompts and evaluate changes against a test set before deploying.
