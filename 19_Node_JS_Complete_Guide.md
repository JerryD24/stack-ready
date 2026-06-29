# Node.js — Complete Guide
### Backend JavaScript | Beginner → Pro Interview Guide

---

## TABLE OF CONTENTS
1. [What is Node.js & How It Works](#1-what-is-nodejs)
2. [The Event Loop](#2-the-event-loop)
3. [Modules — CommonJS vs ES Modules](#3-modules)
4. [npm, package.json & Dependency Management](#4-npm-package-json)
5. [Asynchronous JavaScript — Callbacks, Promises, async/await](#5-async-javascript)
6. [Core Modules (fs, path, http, events, stream)](#6-core-modules)
7. [Streams & Buffers](#7-streams-buffers)
8. [Building an HTTP Server & Express](#8-express)
9. [Middleware, Routing & Error Handling](#9-middleware-routing)
10. [REST API Design with Express](#10-rest-api-design)
11. [Working with Databases](#11-databases)
12. [Authentication & Security](#12-auth-security)
13. [Error Handling & Process Management](#13-error-handling)
14. [Performance, Clustering & Worker Threads](#14-performance-clustering)
15. [Testing Node.js Apps](#15-testing)
16. [TypeScript with Node.js](#16-typescript-node)
17. [Production Best Practices](#17-production-best-practices)
18. [Coding Problems](#18-coding-problems)
19. [Interview Q&A](#19-interview-qa)

---

## 1. What is Node.js

Node.js is a **runtime** that runs JavaScript outside the browser, built on Chrome's **V8** engine. It's **single-threaded** (for your JS code), **event-driven**, and uses **non-blocking I/O** — making it excellent for I/O-bound, high-concurrency workloads (APIs, real-time apps, proxies).

**Theory.** If you're a Java developer, Node is closer to **Servlet + thread pool for I/O** than to "one thread per request." Your JavaScript runs on one thread, but while waiting for disk/network/DB, Node registers a callback and serves other requests. That model excels when work is mostly waiting (HTTP, DB queries), not computing.

**Analogy.** A restaurant with one waiter (JS thread) who takes orders, passes cooking to the kitchen (libuv/OS), and serves other tables while food cooks — instead of one waiter standing at the stove until each dish is done (`readFileSync`).

```
Your JS  ──►  V8 (compiles JS)  ──►  libuv (event loop + thread pool for I/O)  ──►  OS
```

**Key ideas:**
- **Single-threaded event loop** handles your callbacks; you never manage threads directly for I/O.
- **libuv** provides the event loop and a small **thread pool** (default 4) for file system, DNS, crypto, and compression.
- **Non-blocking**: I/O operations are offloaded; the main thread keeps serving other requests while waiting.

**Great for:** REST/GraphQL APIs, real-time (WebSocket/chat), streaming, microservices, BFF layers.
**Poor for:** CPU-heavy work (video encoding, ML) — it blocks the single thread (use worker threads or another runtime).

**Interview angle.** "Is Node multi-threaded?" → Your JS runs on one thread; libuv uses a thread pool (default 4) for some blocking OS calls; network I/O is async via the OS. CPU-bound loops in a request handler block **all** clients on that process.

---

## 2. The Event Loop

The heart of Node's concurrency. It processes callbacks in **phases**, each with its own queue:

**How it works.** When you call `fs.readFile` or `http.get`, Node delegates I/O to libuv/OS and returns immediately. When data is ready, the callback is queued in the appropriate **phase**. Between phases, Node drains **microtasks** (`process.nextTick`, then Promise callbacks). Only when the call stack is empty does the loop pick the next macrotask.

**Example — tracing one request:**
1. HTTP request arrives → poll phase receives socket data.
2. Your `async` handler runs → starts DB query (non-blocking).
3. Handler returns; event loop serves other requests.
4. DB responds → callback queued → runs when poll phase picks it up.
5. `res.json(...)` sends response.

If step 2 were `JSON.parse(hugeFile)` synchronously for 2 seconds, steps 3–5 wait for **everyone** — that's event loop blocking.
```
   ┌───────────────────────────┐
┌─►│           timers          │  setTimeout, setInterval
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │     pending callbacks     │  deferred I/O callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │           poll            │  retrieve new I/O events; execute I/O callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │           check           │  setImmediate callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
└──┤      close callbacks      │  socket.on('close')
   └───────────────────────────┘
```

**Microtasks vs macrotasks (asked constantly):**
- **Microtasks** (`process.nextTick`, resolved Promises) run **after each phase / current operation**, before the loop continues — `nextTick` even before other microtasks.
- **Macrotasks** are the phase callbacks (timers, I/O, `setImmediate`).

```js
console.log('1');
setTimeout(() => console.log('2 timeout'), 0);
setImmediate(() => console.log('3 immediate'));
Promise.resolve().then(() => console.log('4 promise'));
process.nextTick(() => console.log('5 nextTick'));
console.log('6');
// Output: 1, 6, 5 nextTick, 4 promise, 2 timeout, 3 immediate
// (sync first; then microtasks: nextTick before promise; then macrotasks)
```

**Pitfall.** The exact order of `setTimeout(0)` vs `setImmediate` depends on context. Inside an I/O callback, `setImmediate` runs before `setTimeout(0)`. In the main script top level, order can differ. Interviewers want you to know **microtasks run before macrotasks** and `nextTick` runs before Promise `.then`.

> **Blocking the loop = killing throughput.** A synchronous CPU loop or `fs.readFileSync` in a request handler freezes *every* connection. Keep handlers async and offload CPU work.

---

## 3. Modules

**Theory.** Node splits code into files. Each file is a **module** with its own scope — no global pollution. You export what other files need and import dependencies explicitly.

**CommonJS (default historically):**
```js
// math.js
function add(a, b) { return a + b; }
module.exports = { add };

// app.js
const { add } = require('./math');
```

**ES Modules (modern, recommended):** set `"type": "module"` in `package.json` or use `.mjs`.
```js
// math.mjs
export function add(a, b) { return a + b; }
export default class Calculator {}

// app.mjs
import Calculator, { add } from './math.mjs';
```

| | CommonJS | ES Modules |
|--|----------|-----------|
| Syntax | `require` / `module.exports` | `import` / `export` |
| Loading | Synchronous | Asynchronous, static analysis |
| `this` at top | `module.exports` | `undefined` |
| Tree-shaking | No | Yes |
| Top-level await | No | Yes |

`require` caches modules — the same instance is returned on subsequent calls (useful for singletons like a DB pool).

**Example.** First `require('./db')` runs `db.js` and creates the pool. Second `require('./db')` in another file returns the **same** pool object — critical for connection limits.

**Interview angle.** ESM enables static analysis and tree-shaking (dead code elimination at build time). Mixed CJS/ESM projects need careful `"type": "module"` or `.mjs`/`.cjs` extensions.

---

## 4. npm, package.json

**Theory.** `package.json` is the manifest for your Node project — name, scripts, dependencies. npm (or yarn/pnpm) resolves the dependency tree, downloads packages to `node_modules`, and runs scripts. Lockfiles ensure CI and production install the exact same versions you tested locally.

```json
{
  "name": "my-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest"
  },
  "dependencies": { "express": "^4.19.2" },
  "devDependencies": { "nodemon": "^3.1.0", "jest": "^29.7.0" }
}
```
- **`dependencies`** ship to production; **`devDependencies`** are build/test-only.
- **Semver** `^1.2.3` allows minor+patch; `~1.2.3` allows patch only; exact pins `1.2.3`.
- **`package-lock.json`** pins the exact dependency tree — commit it for reproducible builds.
- `npm ci` installs strictly from the lockfile (use in CI). `npm audit` checks vulnerabilities.
- `npx` runs a package binary without installing globally.

---

## 5. Async JavaScript

**Theory.** Node's strength is non-blocking I/O, but JavaScript is still single-threaded. Async patterns let you **express** sequential or parallel I/O without blocking the thread. `async/await` is syntactic sugar over Promises — it does not create new threads.

**Callbacks → callback hell:**
```js
fs.readFile('a.txt', (err, a) => {
  if (err) return cb(err);
  fs.readFile('b.txt', (err, b) => { /* nesting grows... */ });
});
```

**Promises:**
```js
import { readFile } from 'fs/promises';
readFile('a.txt', 'utf8')
  .then(a => process(a))
  .catch(err => console.error(err));
```

**async/await (preferred — reads like sync, try/catch for errors):**
```js
async function loadAll() {
  try {
    const a = await readFile('a.txt', 'utf8');
    const b = await readFile('b.txt', 'utf8');
    return a + b;
  } catch (err) {
    console.error('failed', err);
    throw err;
  }
}
```

**Run in parallel (don't `await` serially when independent):**
```js
const [a, b] = await Promise.all([readFile('a.txt','utf8'), readFile('b.txt','utf8')]);
// Promise.any -> first to fulfill ; Promise.all rejects if any reject
```

**Example — serial vs parallel:**
```js
// Serial: ~200ms total if each read takes 100ms
const a = await readFile('a.txt');
const b = await readFile('b.txt');

// Parallel: ~100ms total
const [a, b] = await Promise.all([
  readFile('a.txt'),
  readFile('b.txt')
]);
```

**Pitfall.** `async` functions always return a Promise. Forgetting `await` on an async call gives you a Promise object, not the resolved value — a common bug in Express handlers and tests.

> Common bug: awaiting in a `for` loop serializes independent calls. Use `Promise.all` with `map`.

---

## 6. Core Modules

**Theory.** Node ships built-in modules so you can build servers without npm installs. `fs` for files, `path` for cross-platform paths, `events` for pub/sub, `http` for raw HTTP — Express wraps `http`. Knowing these avoids reinventing wheels and helps in interviews when they ask "how would you build X without Express?"

```js
import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

// fs (promise API)
const data = await fs.readFile('config.json', 'utf8');
await fs.writeFile('out.txt', 'hello');

// path (cross-platform paths)
const full = path.join(__dirname, 'data', 'file.txt');
path.extname('a.tar.gz'); // .gz

// events — Node's pub/sub backbone
class Bus extends EventEmitter {}
const bus = new Bus();
bus.on('order', (o) => console.log('got', o.id));
bus.emit('order', { id: 1 });
```
Other essentials: `http`/`https`, `url`, `crypto`, `os`, `child_process`, `cluster`, `worker_threads`, `stream`, `zlib`, `util` (`util.promisify`).

---

## 7. Streams & Buffers

**Theory.** Loading a 2GB log file into a string (`readFile`) can exhaust memory. **Streams** read/write data in **chunks**, processing incrementally — like reading a Java `InputStream` line-by-line instead of loading the whole file into a `byte[]`.

**Streams** process data in chunks without loading it all into memory — essential for large files / network data.
```js
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';

// Stream + compress a huge file with backpressure handled for you
await pipeline(
  createReadStream('huge.log'),
  createGzip(),
  createWriteStream('huge.log.gz')
);
```
Four stream types: **Readable**, **Writable**, **Duplex**, **Transform**. `pipeline` (or `.pipe`) handles **backpressure** — pausing the source when the destination is slow.

**How backpressure works.** A fast readable produces chunks faster than a slow writable (e.g., disk or network) can consume. Without backpressure, chunks buffer in memory until OOM. Writable signals "pause" → readable stops until `drain` event → readable resumes. `pipeline` wires this automatically and propagates errors.

**Example.** Upload proxy: `req` (readable) → gzip transform → `res` (writable). Each chunk is compressed and sent before the next is read — constant memory regardless of upload size.

**Buffers** hold raw binary data:
```js
const buf = Buffer.from('hello', 'utf8');
buf.toString('hex');
```

---

## 8. Express

The de-facto web framework.

**Theory.** Express sits on Node's `http` module and adds routing, middleware pipeline, and response helpers. A request flows through a stack of middleware functions — each can inspect/modify `req`/`res` or end the response.

```js
import express from 'express';
const app = express();

app.use(express.json());                 // parse JSON bodies — populates req.body

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(3000, () => console.log('listening on 3000'));
```
Alternatives worth naming in interviews: **Fastify** (faster, schema-based), **NestJS** (opinionated, DI + decorators, great for large apps), **Koa**, **Hapi**.

---

## 9. Middleware, Routing

**Middleware** = functions with `(req, res, next)` that run in order; the pipeline is the core mental model of Express.

**How it works.** Think of middleware as a chain of filters/interceptors (similar to Spring's filter chain or Python WSGI middleware). Each function receives `req`, `res`, and `next`. Call `next()` to pass to the next layer. Call `res.json()` / `res.send()` to finish. Forget either → request hangs until timeout.

```js
// Logger middleware — runs for every request registered after app.use
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();                       // pass control; omit -> request hangs forever
});

// Router module
import { Router } from 'express';
const users = Router();
users.get('/:id', getUser);
users.post('/', createUser);
app.use('/api/users', users);

// Error-handling middleware (4 args — MUST be last)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});
```
- Order matters — middleware runs top to bottom.
- Always call `next()` or send a response.
- For async handlers, forward errors: `next(err)` (or use a wrapper) — thrown async errors aren't caught automatically in Express 4.

```js
// async wrapper so rejections reach the error middleware
const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
app.get('/users/:id', asyncH(async (req, res) => {
  const u = await db.findUser(req.params.id);
  if (!u) throw Object.assign(new Error('Not found'), { status: 404 });
  res.json(u);
}));
```

---

## 10. REST API Design

**Theory.** REST maps resources (nouns) to URLs and uses HTTP verbs for actions. Good APIs are predictable: same status codes, error shape, and naming conventions everywhere — so frontend and other services integrate without guessing.

```js
const router = Router();

router.get('/',        list);       // GET    /api/products       200
router.get('/:id',     getOne);     // GET    /api/products/42    200 / 404
router.post('/',       create);     // POST   /api/products       201
router.put('/:id',     replace);    // PUT    /api/products/42    200
router.patch('/:id',   update);     // PATCH  /api/products/42    200
router.delete('/:id',  remove);     // DELETE /api/products/42    204
```
**Good practices:**
- Use proper status codes (201 created, 204 no content, 400 bad request, 401/403 auth, 404, 409 conflict, 422 validation, 500).
- Validate input (`zod`, `joi`, `express-validator`).
- Version your API (`/api/v1`).
- Pagination, filtering, sorting via query params.
- Consistent error shape: `{ error: { code, message } }`.

```js
import { z } from 'zod';
const CreateUser = z.object({ name: z.string().min(1), email: z.string().email() });
function create(req, res) {
  const parsed = CreateUser.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.issues });
  // ... persist
}
```

---

## 11. Databases

**Theory.** Node apps typically talk to databases over the network. Each query has latency; opening a new TCP connection per request is expensive. Use a **connection pool** (reuse connections) and **parameterized queries** (prevent SQL injection) — same principles as JDBC `PreparedStatement` or Python DB-API with placeholders.

**MongoDB with Mongoose (ODM):**
```js
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, index: true }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

const u = await User.create({ name: 'A', email: 'a@x.com' });
const found = await User.findById(id).lean();   // lean -> plain object, faster
```

**PostgreSQL/MySQL** — use a pooled client (`pg`) or an ORM (`Prisma`, `TypeORM`, `Sequelize`):
```js
import pg from 'pg';
const pool = new pg.Pool({ max: 10 });          // connection pool — reuse connections
const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]); // params -> no SQL injection
```
- **Always use a connection pool** (creating a connection per request kills performance).
- **Always parameterize queries** — never string-concatenate user input.
- **Prisma** gives type-safe queries and migrations — popular in TypeScript projects.

---

## 12. Auth & Security

**Theory.** Most Node APIs authenticate via **JWT** (stateless token) or **session cookies** (stateful server-side session). Passwords must never be stored plaintext — bcrypt/argon2 hash with salt. Auth middleware runs before protected routes and attaches user identity to `req`.

**JWT auth:**
```js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Register: hash the password (never store plaintext)
const hash = await bcrypt.hash(password, 10);

// Login: verify + issue token
if (await bcrypt.compare(password, user.hash)) {
  const token = jwt.sign({ sub: user.id, role: user.role },
                         process.env.JWT_SECRET, { expiresIn: '15m' });
}

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}
```

**Security checklist (OWASP-aware):**
- `helmet()` for secure HTTP headers; `cors()` configured to specific origins.
- Rate limiting (`express-rate-limit`) to prevent brute force/DoS.
- Validate & sanitize all input; parameterize DB queries.
- Store secrets in env vars / a secrets manager — never in code.
- Use HTTPS; set `httpOnly`, `secure`, `sameSite` cookies.
- Keep dependencies patched (`npm audit`).

---

## 13. Error Handling & Process Management

**Theory.** Uncaught errors in async code don't crash Node by default — they become **unhandled rejections**. Sync throws in request handlers may crash the process if uncaught. Production apps need centralized error middleware, global handlers, and **graceful shutdown** so in-flight requests finish before exit.

```js
// Centralized async error wrapper (see §9), plus global safety nets:
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception', err);
  process.exit(1);            // let the process manager restart a clean instance
});

// Graceful shutdown — drain in-flight requests, close DB
process.on('SIGTERM', async () => {
  server.close(() => console.log('http closed'));
  await pool.end();
  process.exit(0);
});
```
- Distinguish **operational errors** (expected: bad input, 404) from **programmer errors** (bugs) — crash & restart on the latter.
- Use a process manager (**PM2**) or container orchestration (**Kubernetes**) to restart crashed processes.

---

## 14. Performance, Clustering & Worker Threads

Node is single-threaded, so a single process uses one CPU core. Two ways to scale:

**How it works — cluster vs workers.** **Cluster** forks multiple Node **processes**, each with its own event loop and memory — good for utilizing all CPU cores for I/O-bound HTTP servers (share nothing; use Redis for sessions if needed). **Worker threads** share the same process but run JS on separate threads — good for CPU-heavy tasks without the overhead of full process fork.

**Cluster (multi-process, one per core):**
```js
import cluster from 'cluster';
import os from 'os';
if (cluster.isPrimary) {
  os.cpus().forEach(() => cluster.fork());     // one worker per core
} else {
  startServer();                                // each worker runs the app
}
```
In production you usually let **PM2** (`pm2 start app.js -i max`) or Kubernetes replicas handle this.

**Worker threads (offload CPU-bound work):**
```js
import { Worker } from 'worker_threads';
function runHeavy(data) {
  return new Promise((resolve, reject) => {
    const w = new Worker('./heavy-worker.js', { workerData: data });
    w.on('message', resolve);
    w.on('error', reject);
  });
}
```
Use worker threads for CPU-heavy tasks (image processing, big computation) so the event loop stays responsive.

**Other perf levers:** caching (Redis), compression (`gzip`), avoid sync APIs, stream large payloads, use `--prof`/clinic.js to profile, set proper DB indexes.

---

## 15. Testing

**Theory.** Test Node apps at two levels: **unit** tests for pure logic (services, validators) with mocked I/O, and **integration** tests that hit real HTTP routes (Supertest) optionally with a test database. Fast, deterministic tests run in CI on every commit.

```js
// Jest example — integration test hits Express app without starting a real server port
import request from 'supertest';
import app from '../src/app.js';

describe('GET /api/users/:id', () => {
  it('returns 404 for unknown user', async () => {
    const res = await request(app).get('/api/users/999');
    expect(res.status).toBe(404);
  });
});
```
- **Unit tests**: pure functions/services with mocks.
- **Integration tests**: routes + DB (Supertest, Testcontainers).
- Frameworks: **Jest**, **Vitest**, **Mocha+Chai**, plus the built-in `node:test` runner.
- Mock external calls (`nock`, `jest.mock`). Aim for fast, deterministic tests.

---

## 16. TypeScript with Node

```ts
// Strong typing for safer backends
interface User { id: string; name: string; email: string; }

function getUser(id: string): Promise<User | null> {
  return db.users.findById(id);
}

import { Request, Response } from 'express';
app.get('/users/:id', async (req: Request, res: Response) => {
  const user = await getUser(req.params.id);
  user ? res.json(user) : res.sendStatus(404);
});
```
Setup: `typescript`, `@types/node`, `@types/express`, `tsx`/`ts-node` for dev, compile with `tsc` (or build with `esbuild`/`swc`). Enable `strict` in `tsconfig.json`.

---

## 17. Production Best Practices

- **Config via env vars** (`dotenv` locally; real env in prod). Validate config at startup.
- **Structured logging** (`pino`, `winston`) with request IDs; don't `console.log` in prod.
- **Health checks** (`/health`, `/ready`) for load balancers/K8s.
- **Graceful shutdown** on SIGTERM (drain, close DB).
- **Don't block the event loop**; offload CPU; avoid sync FS in handlers.
- **Connection pooling** for DBs; timeouts on all outbound calls.
- **Security**: helmet, rate limiting, input validation, secrets management, HTTPS.
- **Observability**: metrics (Prometheus), tracing (OpenTelemetry).
- **Run multiple instances** (cluster/PM2/K8s) behind a load balancer.

---

## 18. Coding Problems

**Theory.** These patterns appear in live coding rounds and production code alike: promisify legacy callbacks, limit concurrency (like a semaphore), rate limit, retry with backoff, debounce. Understand **why** each exists — interviewers follow up with "what happens under load?"

```js
// 1. promisify a callback API manually — wraps Node-style (err, data) => void into a Promise
const promisify = (fn) => (...args) =>
  new Promise((resolve, reject) =>
    fn(...args, (err, data) => (err ? reject(err) : resolve(data))));

// 2. Limit concurrency (pool of N) over many async tasks
async function mapLimit(items, limit, worker) {
  const results = [];
  const executing = new Set();
  for (const [i, item] of items.entries()) {
    const p = Promise.resolve(worker(item, i)).then(r => (results[i] = r));
    executing.add(p);
    p.finally(() => executing.delete(p));
    if (executing.size >= limit) await Promise.race(executing);
  }
  await Promise.all(executing);
  return results;
}

// 3. Simple in-memory rate limiter (token-ish)
function rateLimiter(maxPerWindow, windowMs) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
    arr.push(now); hits.set(key, arr);
    return arr.length <= maxPerWindow;
  };
}

// 4. Retry with exponential backoff
async function retry(fn, attempts = 3, delay = 200) {
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) { if (i === attempts - 1) throw e;
      await new Promise(r => setTimeout(r, delay * 2 ** i)); }
  }
}

// 5. Debounce
const debounce = (fn, ms) => {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};
```

---

## 19. Interview Q&A

**Q1. Is Node.js single-threaded?**
Your JS executes on a single thread (the event loop), but libuv uses a thread pool for some I/O (fs, dns, crypto) and the OS handles network I/O asynchronously. CPU work still blocks the single JS thread.

**Q2. Explain the event loop phases.**
timers → pending callbacks → poll → check (setImmediate) → close. Microtasks (`process.nextTick`, Promises) run between phases; `nextTick` before other microtasks.

**Q3. `setImmediate` vs `setTimeout(fn, 0)` vs `process.nextTick`?**
`nextTick` runs first (before promises), then promise microtasks; `setTimeout(0)` runs in the timers phase; `setImmediate` in the check phase. Inside an I/O cycle, `setImmediate` fires before `setTimeout(0)`.

**Q4. How do you avoid callback hell?**
Promises and async/await; modularize; `Promise.all` for parallelism.

**Q5. `Promise.all` vs `allSettled` vs `race` vs `any`?**
`all` rejects on first failure; `allSettled` waits for all and reports each; `race` settles on first settled (resolve or reject); `any` resolves on first fulfilled.

**Q6. How does Node handle CPU-bound tasks?**
Offload to worker threads, child processes, a queue/another service, or cluster. Don't run heavy computation on the event loop.

**Q7. CommonJS vs ES Modules?**
CJS is synchronous `require`/`module.exports`; ESM is async static `import`/`export` with tree-shaking and top-level await.

**Q8. What is middleware in Express?**
A function `(req, res, next)` in the request pipeline that can read/modify req/res, end the response, or pass control via `next()`. Error middleware takes 4 args.

**Q9. How do you scale a Node app?**
Cluster/PM2/K8s for multi-core & multi-instance behind a load balancer; caching; DB pooling/indexes; stateless services + external session store.

**Q10. How do you secure a Node API?**
Helmet, CORS allowlist, rate limiting, input validation, parameterized queries, bcrypt password hashing, JWT/short-lived tokens, secrets in env/secret manager, HTTPS, `npm audit`.

**Q11. What causes a memory leak in Node and how do you find it?**
Unbounded caches, lingering event listeners, global variables, closures holding references. Diagnose with heap snapshots (`--inspect`, Chrome DevTools), `clinic.js`, monitoring RSS over time.

**Q12. What is backpressure in streams?**
When a writable destination is slower than the readable source. `pipe`/`pipeline` handle it by pausing the source until the destination drains, preventing memory blowup.
