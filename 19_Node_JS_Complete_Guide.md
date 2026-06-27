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

```
Your JS  ──►  V8 (compiles JS)  ──►  libuv (event loop + thread pool for I/O)  ──►  OS
```

**Key ideas:**
- **Single-threaded event loop** handles your callbacks; you never manage threads directly for I/O.
- **libuv** provides the event loop and a small **thread pool** (default 4) for file system, DNS, crypto, and compression.
- **Non-blocking**: I/O operations are offloaded; the main thread keeps serving other requests while waiting.

**Great for:** REST/GraphQL APIs, real-time (WebSocket/chat), streaming, microservices, BFF layers.
**Poor for:** CPU-heavy work (video encoding, ML) — it blocks the single thread (use worker threads or another runtime).

---

## 2. The Event Loop

The heart of Node's concurrency. It processes callbacks in **phases**, each with its own queue:
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

> **Blocking the loop = killing throughput.** A synchronous CPU loop or `fs.readFileSync` in a request handler freezes *every* connection. Keep handlers async and offload CPU work.

---

## 3. Modules

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

---

## 4. npm, package.json

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
// Promise.allSettled -> never rejects, returns status per promise
// Promise.race -> first to settle ; Promise.any -> first to fulfill
```
> Common bug: awaiting in a `for` loop serializes independent calls. Use `Promise.all` with `map`.

---

## 6. Core Modules

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

**Buffers** hold raw binary data:
```js
const buf = Buffer.from('hello', 'utf8');
buf.toString('hex');
```

---

## 8. Express

The de-facto web framework.
```js
import express from 'express';
const app = express();

app.use(express.json());                 // parse JSON bodies

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(3000, () => console.log('listening on 3000'));
```
Alternatives worth naming in interviews: **Fastify** (faster, schema-based), **NestJS** (opinionated, DI + decorators, great for large apps), **Koa**, **Hapi**.

---

## 9. Middleware, Routing

**Middleware** = functions with `(req, res, next)` that run in order; the pipeline is the core mental model of Express.
```js
// Logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();                       // pass control; omit -> request hangs
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

```js
// Jest example
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

```js
// 1. promisify a callback API manually
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
