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

**Fallacies of distributed computing** (worth naming): the network is *not* reliable, latency is *not* zero, bandwidth is *not* infinite, topology *changes*. Design accordingly.

---

## 2. Timeouts & Deadlines

The most important and most forgotten pattern. **Every** network call needs a timeout — an unbounded call is a latent outage.
```java
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(2)).build();
HttpRequest req = HttpRequest.newBuilder(uri)
    .timeout(Duration.ofSeconds(3)).build();   // request timeout
```
- Set **connect** and **read/request** timeouts on HTTP clients, DB calls, and Kafka.
- **Deadline propagation:** pass a remaining-time budget downstream so the whole call chain respects one overall deadline (don't let B spend 10s when A already timed out at 3s).
- Timeout should be < the caller's timeout (so retries have room).

---

## 3. Retries & Backoff

Retries recover from **transient** failures (blip, brief overload) — but naive retries amplify outages.
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

---

## 4. Circuit Breaker

Stops hammering a failing dependency, giving it time to recover and failing fast for callers.
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

---

## 5. Bulkhead

Isolate resources so one slow dependency can't consume all threads/connections (named after ship compartments).
- Give each downstream its **own thread pool / connection pool / semaphore**. If dependency B is slow, only B's pool exhausts; calls to C and the rest of the app keep working.
- In Kubernetes, running separate services is itself a bulkhead.

```java
ThreadPoolBulkhead bulkhead = ThreadPoolBulkhead.of("svcB",
    ThreadPoolBulkheadConfig.custom().maxThreadPoolSize(10).queueCapacity(20).build());
```

---

## 6. Rate Limiting

Protect a service (and downstreams) from overload/abuse by capping request rate.
- **Algorithms:** Token Bucket (allows bursts), Leaky Bucket (smooths), Fixed Window (simple, edge bursts), **Sliding Window** (accurate).
- **Where:** API gateway (global), per-client/tenant, and per-downstream (don't overwhelm a dependency).
- **Distributed rate limiting:** keep counters in **Redis** so the limit is shared across all instances.

```java
RateLimiter limiter = RateLimiter.of("api",
    RateLimiterConfig.custom().limitForPeriod(100).limitRefreshPeriod(Duration.ofSeconds(1)).build());
```
Return `429 Too Many Requests` with a `Retry-After` header when limited.

---

## 7. Resilience4j

The standard Java library (Hystrix is dead). Compose decorators; order matters.
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
  slidingWindowSize: 20
  failureRateThreshold: 50         # open at 50% failures
  waitDurationInOpenState: 10s
  permittedNumberOfCallsInHalfOpenState: 3
resilience4j.retry.instances.inventory:
  maxAttempts: 3
  waitDuration: 200ms
  enableExponentialBackoff: true
```
Recommended decorator order (outer→inner): Retry → CircuitBreaker → RateLimiter → TimeLimiter → Bulkhead. Resilience4j exposes metrics to Prometheus.

---

## 8. Idempotency Keys

Make a write safe to execute multiple times (essential because retries + at-least-once delivery cause duplicates).
```
Client sends:  POST /payments   Idempotency-Key: 7f3a-...
Server:
  1. Look up the key in a store (Redis/DB).
  2. If present -> return the SAME stored response (don't re-charge).
  3. If absent  -> process, store {key -> response}, return.
```
- Client generates a unique key per logical operation; server dedupes.
- Store keys with a TTL; use a unique constraint as a backstop.
- This is how payment APIs (Stripe-style) guarantee "charge once" under retries.

---

## 9. Distributed Locks

Coordinate exclusive access across instances (e.g., only one node runs a scheduled job).
```java
// Redis lock (SET key value NX PX ttl) — atomic acquire with expiry
Boolean ok = redis.opsForValue().setIfAbsent("lock:job", token, Duration.ofSeconds(30));
if (Boolean.TRUE.equals(ok)) {
  try { doWork(); }
  finally { /* release only if token matches (Lua script) to avoid releasing someone else's lock */ }
}
```
- **Redisson** wraps this with lease time + auto-renewal (watchdog).
- Always set a **TTL** (so a crashed holder doesn't deadlock forever) and **fence** with a token/version to handle the "lock expired mid-work" edge case (**fencing tokens**).
- Alternatives: ZooKeeper/etcd for stronger guarantees.
- **Redlock** is the multi-node Redis algorithm (debated; for critical correctness prefer a consensus store).

---

## 10. Saga Pattern

Microservices can't share one ACID transaction across databases. A **Saga** is a sequence of local transactions, each with a **compensating action** to undo on failure.

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

---

## 11. Snowflake IDs

Globally unique, roughly time-sortable 64-bit IDs without a central sequence (no DB round-trip, no collisions across nodes).
```
| 1 bit unused | 41 bits timestamp(ms) | 10 bits machine id | 12 bits sequence |
```
- **Time-ordered** → good for DB index locality and pagination.
- No coordination needed per ID (only a unique machine id).
- Alternatives: **ULID** (sortable, URL-safe), UUIDv7 (time-ordered). Avoid random UUIDv4 as a clustered PK (index fragmentation).

---

## 12. Consistency, CAP & Eventual Consistency

- **CAP:** under a network **P**artition you choose **C**onsistency or **A**vailability. Most microservice stacks pick **AP** with eventual consistency.
- **Strong consistency** — reads always see the latest write (single DB, quorum reads). Costs latency/availability.
- **Eventual consistency** — replicas converge over time; you accept temporary staleness for availability/scale (Saga outcomes, caches, read replicas).
- **PACELC** extends CAP: even without partitions, there's a latency vs consistency trade-off.
- Practical patterns: read-your-writes via sticky routing, version vectors, idempotency to tolerate reordering.

---

## 13. Graceful Degradation & Fallbacks

When a dependency is down, degrade instead of erroring out:
- Serve **stale cache** when the source is unavailable.
- Return a **default/partial** response (e.g., empty recommendations) rather than a 500.
- **Feature flags / kill switches** to disable non-critical features under load.
- **Load shedding** — reject low-priority traffic to protect core flows.
- Make the failure **visible** (degraded banner) but keep the core working.

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
