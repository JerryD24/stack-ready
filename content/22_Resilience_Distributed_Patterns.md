# Resilience & Distributed Systems Patterns — Deep Dive
### Building Services That Survive Failure | Senior Backend Edition

---

## TABLE OF CONTENTS
1. [Why Resilience — Failure Is Normal](#1-why-resilience)
2. [Timeouts & Deadlines](#2-timeouts-deadlines)
3. [Retries & Exponential Backoff](#3-retries-backoff)
4. [Circuit Breaker](#4-circuit-breaker)
5. [Bulkhead Isolation](#5-bulkhead)
6. [Rate Limiting](#6-rate-limiting)
7. [Resilience4j in Practice](#7-resilience4j)
8. [Idempotency Keys](#8-idempotency-keys)
9. [Distributed Locks](#9-distributed-locks)
10. [Distributed Transactions & the Saga Pattern](#10-saga-pattern)
11. [Distributed ID Generation (Snowflake)](#11-snowflake-ids)
12. [Consistency, CAP & Eventual Consistency](#12-cap-consistency)
13. [Graceful Degradation & Fallbacks](#13-graceful-degradation)
14. [Interview Q&A](#14-interview-qa)

---

## 1. Why Resilience

In a distributed system, **everything fails**: networks drop, downstreams slow, instances die. Resilience engineering assumes failure and limits its blast radius so one failing dependency doesn't cascade into a full outage.

**The cascade you're preventing:** Service A calls slow Service B → A's threads block waiting → A's thread pool exhausts → A stops serving *all* requests → callers of A fail too. One slow dependency takes down the chain. The patterns below stop this.

**Example — the numbers.** The order service has a thread pool of 200 threads. The inventory service normally responds in 50 ms. It degrades to 30 seconds (DB lock). Each blocked thread holds a connection for 30s. After ~200 concurrent requests, the order service thread pool is exhausted — including requests that never touch inventory. Timeouts would fail those calls at 3s, freeing threads; circuit breakers would fail fast at 0ms once inventory is known to be down.

**Fallacies of distributed computing** (worth naming): the network is *not* reliable, latency is *not* zero, bandwidth is *not* infinite, topology *changes*. Design accordingly.

**Interview angle.** Resilience is not "prevent all failures" — it's "fail fast, fail small, recover automatically." Name the cascade explicitly in interviews; it shows you understand production dynamics, not just pattern names.

---

## 2. Timeouts & Deadlines

The most important and most forgotten pattern. **Every** network call needs a timeout — an unbounded call is a latent outage.

**What & why.** Without a timeout, a hung TCP connection or a downstream that stopped responding holds your thread forever. In a synchronous call chain, one stuck call eventually exhausts the entire pool. A timeout is a contract: "I will wait at most X ms, then I treat this as failure and move on."

**How it works — two timeout layers.**
- **Connect timeout** — how long to establish the TCP connection (downstream dead / wrong host).
- **Read/request timeout** — how long to wait for the response after connection is established (downstream accepted but slow).

```java
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(2)).build();   // fail fast if host unreachable
HttpRequest req = HttpRequest.newBuilder(uri)
    .timeout(Duration.ofSeconds(3)).build();   // total request timeout including read
```

- Set **connect** and **read/request** timeouts on HTTP clients, DB calls, and Kafka.
- **Deadline propagation:** pass a remaining-time budget downstream so the whole call chain respects one overall deadline (don't let B spend 10s when A already timed out at 3s).
- Timeout should be < the caller's timeout (so retries have room).

**Example — deadline propagation.** Gateway timeout: 5s. Order service timeout to inventory: 3s. Inventory timeout to DB: 1s. Each layer leaves headroom for its caller. If the gateway passed "remaining: 5s" and inventory used all 5s on the DB, the order service would timeout at the gateway level with no useful error. Libraries like gRPC propagate deadlines via metadata; for HTTP, pass `X-Request-Deadline` or use a shared context.

**Pitfall.** Setting all timeouts to 30s "to be safe" — under load, 30s × 200 threads = still exhausted. Pick timeouts from SLO (p99 latency × 2–3) and enforce them.

---

## 3. Retries & Backoff

Retries recover from **transient** failures (blip, brief overload) — but naive retries amplify outages.

**What & why.** A 503 from a downstream that just restarted is worth retrying. But if 1000 clients all retry immediately when a service comes back, they create a **thundering herd** that knocks it down again. Exponential backoff spreads retries over time; **jitter** (random noise) prevents synchronized waves.

**How it works — backoff math.** Attempt 0: wait 100ms + jitter. Attempt 1: 200ms. Attempt 2: 400ms. Attempt 3: 800ms. With jitter ±50ms, clients don't retry in lockstep.

```java
// Exponential backoff + jitter (jitter prevents synchronized retry storms)
for (int i = 0; i < maxAttempts; i++) {
  try { return call(); }
  catch (TransientException e) {
    if (i == maxAttempts - 1) throw e;
    long base = (long) (Math.pow(2, i) * 100);
    Thread.sleep(base + ThreadLocalRandom.current().nextLong(100)); // + jitter
  }
}
```

**Rules:**
- Only retry **idempotent** operations (GET, or writes guarded by idempotency keys) — never blindly retry a payment POST.
- Use **exponential backoff + jitter** to avoid the **thundering herd**.
- Cap attempts; combine with a **circuit breaker** so you stop retrying a dead dependency.
- Distinguish retryable (5xx, timeout) from non-retryable (4xx) errors.

**Example.** Payment gateway returns 503 (overloaded). Retry 3 times with backoff: 200ms, 400ms, 800ms. If still failing, circuit breaker opens — stop retrying entirely and return fallback. Retrying 100 times into a dead service makes recovery slower for everyone.

**Interview angle.** "Retry a POST?" — Only with an idempotency key. Otherwise a timeout after the server processed the request but before the response arrived causes a double charge on retry.

---

## 4. Circuit Breaker

Stops hammering a failing dependency, giving it time to recover and failing fast for callers.

**What & why.** Retries help with blips; they hurt when a dependency is genuinely down — you waste threads and add load to a sick service. A circuit breaker is like an electrical breaker: after too many failures, it "trips" and stops sending traffic until things cool down.

```
CLOSED ──(failure rate > threshold)──► OPEN ──(after wait)──► HALF_OPEN
  ▲                                                              │
  └──────────(trial calls succeed)──────────────────────────────┘
       (trial calls fail → back to OPEN)
```

- **CLOSED** — calls flow; failures counted.
- **OPEN** — calls **fail fast** (no call made) for a cooldown; return a fallback.
- **HALF_OPEN** — allow a few trial calls; success → CLOSED, failure → OPEN.

This converts slow, cascading failures into fast, contained ones.

**How it works — sample thresholds (Resilience4j defaults).** Sliding window of last 20 calls. If ≥50% fail (10 of 20), transition to OPEN. Wait 10 seconds (cooldown). Allow 3 trial calls in HALF_OPEN — if all succeed, CLOSED; if any fail, back to OPEN for another 10s.

**Example — inventory service outage.**
1. Inventory DB dies. First 10 of 20 calls timeout at 3s each → 50% failure rate → OPEN.
2. Order service calls fail immediately (0ms) with fallback "stock unknown" — threads freed instantly.
3. After 10s, HALF_OPEN sends 3 trial requests. Inventory still down → 3 failures → OPEN again.
4. Inventory recovers. Trial calls succeed → CLOSED. Normal traffic resumes.

**Pitfall.** Circuit breaker counts failures per dependency instance in the library, but if you have 50 pods each with their own breaker, a degraded service still gets 50 trial calls every cooldown from HALF_OPEN across the fleet. Consider shared state (Redis) for cluster-wide breakers in extreme cases, or accept that per-instance breakers are usually sufficient.

---

## 5. Bulkhead

Isolate resources so one slow dependency can't consume all threads/connections (named after ship compartments).

**What & why.** On a ship, flooding one compartment doesn't sink the vessel — watertight bulkheads contain it. In software, if inventory and payments share one thread pool of 200, a slow inventory call blocks threads that payment calls need. Separate pools contain the damage.

**How it works.** Each downstream gets its own bounded thread pool, connection pool, or semaphore. When inventory's pool (10 threads, queue 20) fills up, new inventory calls are rejected immediately — but the payment pool (50 threads) is untouched.

- Give each downstream its **own thread pool / connection pool / semaphore**. If dependency B is slow, only B's pool exhausts; calls to C and the rest of the app keep working.
- In Kubernetes, running separate services is itself a bulkhead.

```java
ThreadPoolBulkhead bulkhead = ThreadPoolBulkhead.of("svcB",
    ThreadPoolBulkheadConfig.custom()
        .maxThreadPoolSize(10)    // max concurrent calls to svcB
        .queueCapacity(20)        // wait queue before rejecting
        .build());
```

**Example.** Order service calls inventory (10-thread bulkhead) and recommendations (10-thread bulkhead). Inventory slows to 5s per call. After 30 concurrent inventory requests, the bulkhead rejects new ones with `BulkheadFullException` — caller gets fallback. Recommendation calls and order creation (which doesn't need inventory) continue normally.

**Interview angle.** Bulkhead vs circuit breaker: bulkhead limits *concurrency* (how many calls in flight); circuit breaker limits *attempts* based on failure rate. Use both — bulkhead prevents resource exhaustion; breaker stops calling a known-dead service.

---

## 6. Rate Limiting

Protect a service (and downstreams) from overload/abuse by capping request rate.

**What & why.** A traffic spike, a misconfigured client loop, or a DDoS can overwhelm your service and its dependencies. Rate limiting is a gate: "you get N requests per window; excess gets 429."

**How it works — Token Bucket (most common).** A bucket holds tokens (capacity = burst size). Tokens refill at a steady rate (e.g., 100/sec). Each request consumes one token. If the bucket is empty, reject with 429. This allows short bursts (bucket full = 100 instant requests) while enforcing average rate over time.

| Algorithm | Behavior |
|-----------|----------|
| **Token Bucket** | Allows bursts up to bucket size; smooth average rate |
| **Leaky Bucket** | Fixed output rate; bursts queue (or drop) |
| **Fixed Window** | Count per clock window; simple but allows 2× burst at window edges |
| **Sliding Window** | Accurate; more memory/compute |

- **Algorithms:** Token Bucket (allows bursts), Leaky Bucket (smooths), Fixed Window (simple, edge bursts), **Sliding Window** (accurate).
- **Where:** API gateway (global), per-client/tenant, and per-downstream (don't overwhelm a dependency).
- **Distributed rate limiting:** keep counters in **Redis** so the limit is shared across all instances.

```java
RateLimiter limiter = RateLimiter.of("api",
    RateLimiterConfig.custom()
        .limitForPeriod(100)                              // 100 permits
        .limitRefreshPeriod(Duration.ofSeconds(1))        // per second
        .build());
```

Return `429 Too Many Requests` with a `Retry-After` header when limited.

**Example.** Per-tenant limit: 1000 req/min. Tenant A sends 1500 req/min → 500 get 429 with `Retry-After: 36`. Other tenants unaffected. In Redis: `INCR tenant:A:202506291430` with TTL 60s; if count > 1000, reject.

**Pitfall.** Rate limiting at the app only — a misbehaving client hitting 50 Pod instances gets 50× the limit unless counters are shared (Redis) or enforced at the gateway.

---

## 7. Resilience4j

The standard Java library (Hystrix is dead). Compose decorators; order matters.

**What & why.** Hystrix (Netflix, deprecated) pioneered the patterns; Resilience4j is its lightweight successor — no thread-per-command overhead, native functional composition, Micrometer metrics. In Spring Boot 3, it's the default choice for circuit breakers, retries, and bulkheads.

**How it works — decorator stacking.** Each annotation wraps your method in a decorator chain. When a call enters, it passes through outer decorators first. The recommended order matters because each layer handles a different failure mode:

```
Request → Retry → CircuitBreaker → RateLimiter → TimeLimiter → Bulkhead → your method
```

- **Retry** (outermost): retries the whole chain below on transient failure.
- **CircuitBreaker**: stops calling if failure rate too high.
- **RateLimiter**: rejects if rate exceeded.
- **TimeLimiter**: enforces async timeout.
- **Bulkhead** (innermost): limits concurrent executions before your code runs.

```java
// Spring Boot annotations — typical stacking
@CircuitBreaker(name = "inventory", fallbackMethod = "fallback")
@Retry(name = "inventory")
@Bulkhead(name = "inventory")
@RateLimiter(name = "inventory")
@TimeLimiter(name = "inventory")
public CompletableFuture<Stock> getStock(String sku) { ... }

public CompletableFuture<Stock> fallback(String sku, Throwable t) {
    return CompletableFuture.completedFuture(Stock.unknown(sku));  // degrade gracefully
}
```
```yaml
resilience4j.circuitbreaker.instances.inventory:
  slidingWindowSize: 20              # evaluate last 20 calls
  failureRateThreshold: 50           # open at 50% failures
  waitDurationInOpenState: 10s       # cooldown before HALF_OPEN
  permittedNumberOfCallsInHalfOpenState: 3
resilience4j.retry.instances.inventory:
  maxAttempts: 3
  waitDuration: 200ms
  enableExponentialBackoff: true
```

Recommended decorator order (outer→inner): Retry → CircuitBreaker → RateLimiter → TimeLimiter → Bulkhead. Resilience4j exposes metrics to Prometheus.

**Example — call flow when inventory is down.** Retry attempt 1 → CircuitBreaker OPEN → fail fast (0ms) → Retry attempt 2 → fail fast → attempt 3 → fail fast → fallback returns `Stock.unknown`. Total time: ~0ms, not 3 × 3s timeout.

**Pitfall.** Putting Retry *inside* CircuitBreaker means the breaker sees one logical call as multiple attempts, tripping faster — usually you want Retry outside so the breaker evaluates the final outcome.

---

## 8. Idempotency Keys

Make a write safe to execute multiple times (essential because retries + at-least-once delivery cause duplicates).

**What & why.** Networks are unreliable: your client sends `POST /payments`, the server charges the card, but the response is lost. Client retries → double charge. An idempotency key lets the server recognize "I've already processed this exact request" and return the original result without re-executing.

```
Client sends:  POST /payments   Idempotency-Key: 7f3a-...
Server:
  1. Look up the key in a store (Redis/DB).
  2. If present -> return the SAME stored response (don't re-charge).
  3. If absent  -> process, store {key -> response}, return.
```

**How it works — server-side flow.**
1. Client generates UUID per logical operation (not per HTTP attempt — same key on retry).
2. Server checks store atomically: `INSERT ... ON CONFLICT` or Redis `SETNX`.
3. If key exists with status `COMPLETED` → return cached response body + status code.
4. If key exists with status `IN_PROGRESS` → return 409 or wait (another request is processing).
5. If absent → mark `IN_PROGRESS`, execute payment, store result, mark `COMPLETED`.

- Client generates a unique key per logical operation; server dedupes.
- Store keys with a TTL; use a unique constraint as a backstop.
- This is how payment APIs (Stripe-style) guarantee "charge once" under retries.

**Example.** Client sends `POST /payments` with `Idempotency-Key: abc-123`, amount $50. Server charges, stores `{abc-123 → {id: pay_1, status: succeeded}}`. Network drops response. Client retries same key. Server finds `abc-123`, returns `{id: pay_1, status: succeeded}` — no second charge.

**Interview angle.** Idempotency keys solve client retries. They don't solve duplicate Kafka messages — you still need idempotent consumers (check business key before processing).

---

## 9. Distributed Locks

Coordinate exclusive access across instances (e.g., only one node runs a scheduled job).

**What & why.** You have 5 Pod replicas; a `@Scheduled` job must run once per minute, not 5 times. A distributed lock ensures only one instance executes at a time. Also used for leader election and serializing writes to a shared resource.

**How it works — Redis lock.** `SET key value NX PX ttl` is atomic: set only if Not eXists, with expiry in milliseconds. The `value` is a unique token (UUID) so you only release your own lock.

```java
// Redis lock (SET key value NX PX ttl) — atomic acquire with expiry
String token = UUID.randomUUID().toString();
Boolean ok = redis.opsForValue().setIfAbsent("lock:nightly-report", token, Duration.ofSeconds(30));
if (Boolean.TRUE.equals(ok)) {
  try { generateReport(); }
  finally {
    // release only if token matches (Lua script) — avoid releasing someone else's lock
    releaseLock("lock:nightly-report", token);
  }
}
```

- **Redisson** wraps this with lease time + auto-renewal (watchdog).
- Always set a **TTL** (so a crashed holder doesn't deadlock forever) and **fence** with a token/version to handle the "lock expired mid-work" edge case (**fencing tokens**).
- Alternatives: ZooKeeper/etcd for stronger guarantees.
- **Redlock** is the multi-node Redis algorithm (debated; for critical correctness prefer a consensus store).

**Example — the lock-expiry race.**
1. Instance A acquires lock (TTL 30s), starts a 45s report.
2. Lock expires at 30s. Instance B acquires lock, starts report.
3. Both run concurrently — duplicate report emails.
4. Fix: use Redisson watchdog (auto-renews while holder is alive), or make the job idempotent, or use fencing tokens so downstream rejects stale writes.

**Pitfall.** Never use `SETNX` without TTL — a crash before release deadlocks all future runs forever.

---

## 10. Saga Pattern

Microservices can't share one ACID transaction across databases. A **Saga** is a sequence of local transactions, each with a **compensating action** to undo on failure.

**What & why.** In a monolith, `BEGIN → debit account → reduce stock → COMMIT` is one transaction. In microservices, each step is a separate service with its own DB. You can't hold a 2PC lock across HTTP calls (blocks, single point of failure). Sagas accept eventual consistency: each step commits locally; if a later step fails, you run compensating actions to undo prior steps.

**Choreography** (event-driven, no coordinator):
```
OrderService --OrderCreated--> PaymentService --PaymentDone--> InventoryService
   (on failure, each emits a compensating event: RefundPayment, ReleaseStock)
```
- Pros: simple, decoupled. Cons: hard to follow flow, risk of cyclic events.

**Orchestration** (a central orchestrator drives steps):
```
Orchestrator: reserveStock → chargePayment → confirmOrder
  if chargePayment fails → call releaseStock (compensation)
```
- Pros: explicit, easier to reason/monitor. Cons: orchestrator is a focal point.

Sagas give **eventual consistency**, not isolation — design for intermediate states and idempotent steps. Pair with the **outbox pattern** for reliable event publishing.

**Example — checkout saga (orchestration).**
1. `reserveStock(orderId, items)` → inventory reserves, returns `reservationId`.
2. `chargePayment(orderId, amount)` → **fails** (card declined).
3. Orchestrator calls `releaseStock(reservationId)` — compensation.
4. Order marked `FAILED`. User sees "payment declined." Stock is released. No orphaned reservation.

**Intermediate state.** Between steps 1 and 2, stock is reserved but not paid — other users see reduced availability. Design UIs and APIs to tolerate this (show "reserved" not "sold").

**Pitfall.** Compensating actions aren't always perfect inverses — a shipped package can't be "un-shipped"; you initiate a return flow instead. Design compensations as business operations, not SQL rollbacks.

---

## 11. Snowflake IDs

Globally unique, roughly time-sortable 64-bit IDs without a central sequence (no DB round-trip, no collisions across nodes).

**What & why.** Auto-increment IDs (`1, 2, 3...`) require a single DB writer — bottleneck in distributed systems. UUIDv4 is distributed but random — terrible for B-tree index locality (inserts scatter across the index, causing page splits). Snowflake gives you uniqueness + time-ordering + no coordination per ID.

**How it works — bit layout.**
```
| 1 bit unused | 41 bits timestamp(ms) | 10 bits machine id | 12 bits sequence |
```
- **41-bit timestamp** — milliseconds since epoch; IDs sort chronologically.
- **10-bit machine ID** — assigned at deploy time (1024 machines); must be unique per node.
- **12-bit sequence** — counter 0–4095 within the same millisecond; rolls over if >4096 IDs/ms on one node.

Each node generates IDs locally. Same millisecond: increment sequence. New millisecond: reset sequence to 0. No network call.

- **Time-ordered** → good for DB index locality and pagination.
- No coordination needed per ID (only a unique machine id).
- Alternatives: **ULID** (sortable, URL-safe), UUIDv7 (time-ordered). Avoid random UUIDv4 as a clustered PK (index fragmentation).

**Example.** At `2025-06-29T10:00:00.000Z`, machine 42, sequence 0 → ID `1741190400000000000` (simplified). Next ID same ms → sequence 1. IDs inserted into a B-tree land on the right edge of the index (append-only) — fast inserts, unlike random UUIDs that fragment pages.

**Pitfall.** Clock skew between machines can cause duplicate IDs if clocks go backward — use NTP sync and handle backward clock by waiting until caught up (Twitter's original approach).

---

## 12. Consistency, CAP & Eventual Consistency

**Theory — CAP.** In a distributed system during a network **P**artition, you must choose between **C**onsistency (every read sees the latest write) and **A**vailability (every request gets a response). You can't have both while partitioned. Most microservice stacks choose **AP** — stay available, accept temporary staleness, reconcile later.

- **CAP:** under a network **P**artition you choose **C**onsistency or **A**vailability. Most microservice stacks pick **AP** with eventual consistency.
- **Strong consistency** — reads always see the latest write (single DB, quorum reads). Costs latency/availability.
- **Eventual consistency** — replicas converge over time; you accept temporary staleness for availability/scale (Saga outcomes, caches, read replicas).
- **PACELC** extends CAP: even without partitions, there's a latency vs consistency trade-off.
- Practical patterns: read-your-writes via sticky routing, version vectors, idempotency to tolerate reordering.

**Example — shopping cart.** User adds item (write to primary DB). Immediately reads cart from a read replica that hasn't replicated yet — item missing. Fix: read-your-writes (route that user's reads to primary for N seconds after write), or accept "item may take a moment to appear."

**Example — social feed.** Post appears on your profile instantly (your write) but friends' feeds update over 1–2 seconds (fan-out async). Acceptable staleness for the use case.

**Interview angle.** Don't recite CAP as "pick 2 of 3" — explain *when* partition happens and what your system does. Payment ledger → strong consistency (single DB or consensus). Recommendation feed → eventual consistency.

---

## 13. Graceful Degradation & Fallbacks

When a dependency is down, degrade instead of erroring out:

**What & why.** Users prefer a partial experience over a 500 error. Graceful degradation keeps the core path working while non-critical features fail silently or with reduced quality. This is the consumer-side counterpart to circuit breakers — what you *return* when the breaker is open.

**How it works — degradation tiers.**
1. **Full service** — all dependencies healthy.
2. **Degraded** — non-critical dependency down; core response with defaults/stale data.
3. **Unavailable** — core dependency down; clear error with retry guidance.

- Serve **stale cache** when the source is unavailable.
- Return a **default/partial** response (e.g., empty recommendations) rather than a 500.
- **Feature flags / kill switches** to disable non-critical features under load.
- **Load shedding** — reject low-priority traffic to protect core flows.
- Make the failure **visible** (degraded banner) but keep the core working.

**Example — product page.** Inventory service down (circuit open). Instead of 500, return product details with `"stockStatus": "unknown"` and a banner "Stock info temporarily unavailable." User can still browse and add to cart; checkout validates stock at payment time.

**Example — load shedding.** Black Friday traffic 10× normal. API gateway returns 429 for `/recommendations` (low priority) while `/checkout` gets full capacity. Core revenue path protected.

**Interview angle.** Degradation requires product decisions, not just engineering — agree upfront which fields can be empty/stale and which must fail hard (price, inventory at checkout).

---

## 14. Interview Q&A

**Q1. How do you prevent a cascading failure?**
Timeouts on every call + circuit breakers (fail fast) + bulkheads (isolate pools) + fallbacks. Together they contain a slow dependency.

**Q2. When should you NOT retry?**
Non-idempotent writes without an idempotency key, and non-transient errors (4xx). Always use backoff + jitter and cap attempts.

**Q3. Explain circuit breaker states.**
CLOSED (normal), OPEN (fail fast after failure threshold), HALF_OPEN (trial calls); success closes it, failure reopens.

**Q4. How do you make a payment API safe under retries?**
Idempotency keys: client sends a unique key, server dedupes and returns the stored response so the charge happens once.

**Q5. How do distributed transactions work without 2PC?**
Saga pattern — local transactions + compensating actions, via choreography (events) or orchestration (coordinator); gives eventual consistency.

**Q6. Choreography vs orchestration?**
Choreography = services react to events, decoupled but harder to trace. Orchestration = central coordinator, explicit and observable but a focal point.

**Q7. How do you implement a distributed lock and its pitfalls?**
Redis `SET NX PX` (or Redisson) with a TTL and a fencing token; pitfalls are lock expiry mid-work and releasing another holder's lock — use tokens/Lua and fencing.

**Q8. Why Snowflake IDs over UUIDv4?**
Time-sortable, index-friendly, globally unique without coordination; UUIDv4 is random and fragments clustered indexes.

**Q9. Strong vs eventual consistency — pick one for a feed/cart?**
Cart/payment → strong/transactional. Social feed/recommendations/analytics → eventual consistency for scale and availability.

**Q10. What's the single most overlooked resilience practice?**
Timeouts on every outbound call (plus deadline propagation). Without them, one slow dependency exhausts threads and takes the service down.
