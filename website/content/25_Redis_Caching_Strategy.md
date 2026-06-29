# Redis & Caching Strategy — Deep Dive
### Caching Patterns, Pitfalls & Redis as More Than a Cache

---

## TABLE OF CONTENTS
1. [Why Cache & What Redis Is](#1-why-cache)
2. [Redis Data Structures](#2-data-structures)
3. [Caching Patterns](#3-caching-patterns)
4. [Cache-Aside (Lazy Loading)](#4-cache-aside)
5. [Write-Through & Write-Behind](#5-write-through-behind)
6. [Eviction Policies](#6-eviction-policies)
7. [TTL & Expiration Design](#7-ttl-design)
8. [Cache Stampede & Hot Keys](#8-stampede-hot-keys)
9. [Cache Penetration & Avalanche](#9-penetration-avalanche)
10. [Consistency: Cache vs Database](#10-cache-consistency)
11. [Redis as a Distributed Lock](#11-distributed-lock)
12. [Redis as a Rate Limiter](#12-rate-limiter)
13. [Persistence, HA & Cluster](#13-persistence-ha)
14. [Spring Cache with Redis](#14-spring-cache)
15. [Interview Q&A](#15-interview-qa)

---

## 1. Why Cache

A cache stores hot data in fast memory to cut latency and offload the database. Redis is an **in-memory, single-threaded, key-value data structure store** with sub-millisecond latency.

**Theory.** Without a cache, every read hits disk-backed storage. A typical PostgreSQL query on indexed data costs **1–10 ms**; under load that climbs fast. Redis reads from RAM in **~0.1–1 ms** (same datacenter). At 10,000 reads/sec, moving 80% of traffic from DB to cache can drop DB load from 10K to 2K QPS — often the difference between a stable system and one that falls over during a traffic spike.

**What problem it solves.** Caching is a **read amplifier reducer**: you pay memory to avoid repeating expensive work (SQL joins, aggregation, external API calls). It does not make writes faster by itself — that requires different patterns (write-behind, queues).

**Cache when:** reads ≫ writes, data is expensive to compute/fetch, slight staleness is acceptable.
**Don't cache:** strongly-consistent financial balances at read time, rarely-read data, or when staleness is dangerous.

**Example.** A product catalog service serves 50K product-detail reads/sec but only 200 updates/sec. Each DB read is a 3-table join (~8 ms). Caching product JSON in Redis with a 5-minute TTL cuts p99 latency from ~40 ms to ~2 ms and removes ~98% of DB reads. The 200 writes/sec still go to DB; cache entries are invalidated on update.

**Why single-threaded is fine:** Redis avoids lock overhead and context switches; it's network/memory-bound, and command execution is atomic. (Redis 6+ has multi-threaded I/O for the network layer.)

**How it works.** One Redis thread executes commands from a queue. Because each command is atomic, you get race-free `INCR`, `SET NX`, and Lua scripts without application-level locks. Bottleneck is usually **network RTT** or **memory bandwidth**, not CPU — pipelining multiple commands per round-trip is the main throughput lever.

**Pitfall.** Caching everything "just in case" wastes RAM and creates consistency headaches. Cache only data with proven read-heavy access and measurable DB cost.

**Interview angle.** "Why Redis over Memcached?" → Redis offers richer data structures, persistence, pub/sub, Lua, and cluster mode; Memcached is simpler multi-threaded pure cache. Choose Redis when you need structures beyond strings or use it for locks/rate limits too.

---

## 2. Data Structures

Redis is "data structures over the network" — pick the right one:
| Type | Use case |
|------|----------|
| **String** | Simple KV, counters (`INCR`), serialized objects |
| **Hash** | Object fields (`HSET user:1 name A age 30`) |
| **List** | Queues, recent items (`LPUSH`/`RPOP`) |
| **Set** | Unique membership, tags |
| **Sorted Set (ZSet)** | Leaderboards, rate limiters, time-ordered (`ZADD`) |
| **Bitmap / HyperLogLog** | Presence flags, approx unique counts |
| **Stream** | Append-only log / lightweight messaging |
| **Geo** | Location queries |

Choosing the right structure (e.g., ZSet for a sliding-window rate limiter) is the difference between elegant and hacky.

**How it works (pick the right tool).**
- **String** — simplest; stores serialized JSON blobs. `INCR`/`INCRBY` are atomic — ideal for counters without read-modify-write races.
- **Hash** — one key, many fields. Updating `HSET user:1 name "Alice"` does not rewrite the whole object (unlike replacing a JSON string). Good for partial updates on profiles.
- **List** — doubly-linked list; `LPUSH` + `BRPOP` gives a simple queue. Not durable-by-default for critical jobs (use a message broker for that), but fine for lightweight work queues.
- **Set / Sorted Set** — Set = O(1) membership. ZSet = Set + score for ordering. Rate limiters store timestamps as scores; leaderboards store points as scores.
- **Bitmap / HyperLogLog** — Bitmap: one bit per user for "logged in today" with minimal memory. HyperLogLog: ~12 KB per key for ~millions of unique visitors with ~0.81% error — trade exact count for 100× less RAM.
- **Stream** — append-only log with consumer groups (like a lightweight Kafka partition). Useful for event fan-out when you don't need full Kafka durability.

**Example.** Tracking daily active users for 10M users: a Bitmap uses ~1.25 MB (`10M bits`). Storing `SET user:123:active:2026-06-29 1` per user would need gigabytes of key overhead.

**Interview angle.** "How would you implement a leaderboard?" → ZSet: `ZADD leaderboard 9500 "player42"`, top 10 = `ZREVRANGE leaderboard 0 9 WITHSCORES`. O(log N) insert, O(log N + M) range query.

---

## 3. Caching Patterns

Two axes: **who reads/writes the DB** and **when**.
- **Cache-aside** — app manages cache (most common).
- **Read-through** — cache library loads from DB on miss.
- **Write-through** — write cache + DB synchronously.
- **Write-behind (write-back)** — write cache now, DB async later (fast but risk loss).

**Theory.** These patterns differ in **who owns consistency** and **when the DB is touched**. Cache-aside puts logic in your app; read/write-through puts it in a cache library or sidecar.

| Pattern | Read path | Write path | Best when |
|---------|-----------|------------|-----------|
| Cache-aside | App → cache → DB on miss | App → DB → invalidate cache | General purpose; most Spring apps |
| Read-through | Cache loads from DB on miss | App → DB (cache not updated on write unless paired) | You want simpler read code |
| Write-through | Same as cache-aside for reads | App → cache + DB sync | Writes must be immediately readable from cache |
| Write-behind | Cache-aside for reads | App → cache; async DB flush | Write spikes; loss tolerable |

**Interview angle.** Interviewers often ask "which pattern for an e-commerce product page?" → Cache-aside: reads dominate, stale price for 30s may be OK with TTL + invalidation on price change. Not write-through (every inventory tick would double-write).

---

## 4. Cache-Aside

The default pattern. The application code owns cache logic.

**Theory.** Also called **lazy loading**: the cache is populated only when someone asks for the data. The application is the orchestrator — Redis does not call your DB for you.

**How it works (read path).**
1. App checks cache.
2. **Hit** → return immediately (no DB).
3. **Miss** → load from DB, write to cache with TTL, return.
4. If the key is absent in DB, optionally cache a **null marker** (see §9) to avoid repeated misses.

**How it works (write path).**
1. App writes to DB (source of truth).
2. App **deletes** the cache key (invalidation).
3. Next read repopulates from DB.

```java
public User getUser(Long id) {
    String key = "user:" + id;
    User cached = redis.get(key);
    if (cached != null) return cached;            // hit — skip DB entirely
    User user = db.findById(id);                  // miss -> load from DB (expensive path)
    if (user != null) redis.set(key, user, Duration.ofMinutes(10)); // populate with TTL
    return user;
}
// On update: write DB, then INVALIDATE the cache (don't update it — see §10)
public void updateUser(User u) {
    db.save(u);
    redis.delete("user:" + u.getId());            // next read repopulates fresh data
}
```

**Example.** 1M users, 10K DAU, each reads profile 5×/day = 50K reads/day. Without cache: 50K DB queries. With cache (10-min TTL, ~90% hit rate after warm-up): ~5K DB queries/day. Cold start after deploy: hit rate starts at 0% and climbs over one TTL window.

**Pitfall.** Two concurrent misses for the same key both hit the DB (no coalescing by default). Under expiry of a hot key this becomes a stampede (§8).

Pros: simple, resilient (cache down ⇒ DB still served), only caches what's used. Cons: first read is a miss; risk of stale data until TTL/invalidation.

**Interview angle.** "What if Redis is down?" → Cache-aside degrades gracefully: every read goes to DB (higher latency, DB load spike — but no outage). Write-through tied to cache availability is riskier.

---

## 5. Write-Through & Write-Behind

**Write-through:** every write goes to cache **and** DB synchronously.
- Pro: cache always fresh. Con: write latency = cache + DB; caches data that may never be read.

**Write-behind:** write to cache immediately, **flush to DB asynchronously** (batched).
- Pro: very fast writes, absorbs spikes. Con: **data loss risk** if cache dies before flush; eventual consistency. Use only when some loss is tolerable (metrics, counters).

**How it works (write-through).** On `updateUser()`, the app writes to Redis and DB in sequence (or via a cache library that wraps both). The next read always hits a warm, fresh cache entry — no invalidation step. Write latency = `T_redis + T_db` (~1 ms + ~5 ms = ~6 ms vs ~5 ms DB-only).

**How it works (write-behind).** On `recordPageView()`, the app increments a counter in Redis and returns. A background worker batches flushes to DB every N seconds or M records. If Redis crashes before flush, those increments are lost.

**Example (write-behind).** Analytics: 100K page-view writes/sec. Writing each to PostgreSQL would saturate the DB. Buffer in Redis (`INCR pageviews:article:42`), flush aggregated counts every 10s → 100K Redis ops/sec but only ~6 DB writes/min per article.

**Pitfall (write-through).** Admin updates a config flag once/day; 1M users never read it. Write-through caches it anyway — wasted RAM. Cache-aside would never populate it.

**Pitfall (write-behind).** Using write-behind for order payment status → Redis dies → payment marked "pending" in cache but never persisted → financial inconsistency. Never use write-behind for authoritative business state.

**Interview angle.** "When write-behind?" → Metrics, click counts, IoT sensor aggregates where approximate counts or small loss windows are acceptable and write volume is extreme.

---

## 6. Eviction Policies

When Redis hits `maxmemory`, it evicts per policy (`maxmemory-policy`):
| Policy | Behavior |
|--------|----------|
| `noeviction` | Reject writes (errors) — safe default for a DB-like use |
| `allkeys-lru` | Evict least-recently-used across all keys — typical **cache** choice |
| `allkeys-lfu` | Evict least-frequently-used — better when popularity is stable |
| `volatile-lru/lfu/ttl` | Evict only keys **with a TTL** |
| `allkeys-random` | Random |

For a pure cache, `allkeys-lru` (or `lfu`) + a `maxmemory` limit is standard. Set `maxmemory` to ~75% of available RAM.

**How it works.** Redis tracks access patterns per key. When `used_memory` exceeds `maxmemory`:
- **LRU (Least Recently Used)** — evicts keys not accessed recently. Redis approximates LRU with a sampling pool (checks a random subset, evicts oldest) — not perfect LRU but fast and good enough.
- **LFU (Least Frequently Used, Redis 4.0+)** — evicts keys with lowest access frequency. Better when popularity is stable (e.g., top-100 products stay hot for days).
- **volatile-*** policies — only consider keys that have a TTL set. Use when some keys (session locks) must never be evicted but cache entries have TTL.
- **noeviction** — returns errors on write when full. Use when Redis is a primary store (job queue, session store) and losing keys is unacceptable.

**Example.** Redis with 4 GB RAM, `maxmemory 3gb`, `allkeys-lru`. You cache 500K product objects (~6 KB each ≈ 3 GB). A new product launch adds 50K entries → Redis evicts least-recently-used products until under limit. Cold products fall out; hot products stay.

**Pitfall.** No `maxmemory` limit → Redis grows until the OS OOM-killer terminates the process → **total cache loss** → avalanche on DB (§9).

**Interview angle.** "LRU vs LFU?" → LRU adapts quickly to shifting hot sets (news site during breaking story). LFU resists one-time spikes evicting long-term hot keys.

---

## 7. TTL Design

Every cache entry should usually have a **TTL** (expiry) so stale data self-heals and memory is bounded.

**Theory.** TTL is your **staleness budget**: how long can readers see old data without an explicit invalidation? It also bounds memory — expired keys are deleted (lazy on access + active background scanning).

```
SET key value EX 600        # expire in 600s (EX = seconds; PX = milliseconds)
```

**How it works.** Redis expires keys two ways: (1) **passive** — key accessed after expiry → deleted on read; (2) **active** — background thread samples keys with TTL and removes expired ones. A key can live slightly past its TTL until accessed or sampled — don't rely on sub-second precision for correctness.

- Short TTL = fresher data, more DB load; long TTL = less load, more staleness. Tune per data volatility.
- **Add jitter** to TTLs (e.g., 600 ± random 60s) so many keys don't expire simultaneously (→ avalanche, §9).
- Use **logical expiry** (store an `expireAt` field, refresh in background) for hot keys you never want to hard-miss.

**Example (jitter).** 10,000 product keys all cached at deploy with `EX 600`. Without jitter they expire at T+600s together → 10K simultaneous DB misses. With jitter `600 + random(0,120)`: expirations spread over 2 minutes → peak DB load ~1/15th as high.

**Example (logical expiry).** Store `{ data: {...}, expireAt: 1719600000 }` in the cached value. On read: if `now < expireAt`, return data. If `now >= expireAt` but data still present, return **stale data** and trigger async refresh (one thread rebuilds). User never waits for DB on a hot key.

**Pitfall.** TTL alone without invalidation on write → user updates profile, other users see old data until TTL expires. Always pair TTL with delete-on-write for mutable data.

**Interview angle.** "How do you pick TTL?" → Measure data change frequency. Config that changes hourly → TTL 5–10 min + invalidation on admin update. User session → TTL 30 min sliding. Static product description → TTL 1 hour+.

---

## 8. Cache Stampede & Hot Keys

**Cache stampede (dogpile):** a popular key expires → thousands of concurrent requests miss and all hit the DB at once → DB overload.

**How it works (stampede timeline).**
1. T=0: Key `product:42` expires (TTL reached).
2. T=0+1ms: 500 concurrent requests for product 42 — all cache miss.
3. All 500 threads query DB for the same product (500 identical heavy queries).
4. DB connection pool exhausted; p99 latency spikes from 10 ms to 2 s; other endpoints suffer.

**Fixes:**
- **Mutex/lock**: first requester rebuilds; others wait or serve stale (e.g., Redis `SET NX` rebuild lock).
- **Logical expiry + async refresh**: serve slightly stale data while one worker refreshes.
- **Request coalescing** (single-flight) at the app layer.

```java
// Single-flight pattern (simplified): only one thread rebuilds per key
public Product getProduct(Long id) {
    String key = "product:" + id;
    Product cached = redis.get(key);
    if (cached != null) return cached;
    return rebuildLocks.computeIfAbsent(key, k -> {
        try {
            Product p = db.findById(id);
            redis.set(key, p, Duration.ofMinutes(10));
            return p;
        } finally {
            rebuildLocks.remove(k);
        }
    });
}
```

**Hot key:** one key gets disproportionate traffic, overloading a single shard.

**How it works (hot key).** In Redis Cluster, key `celebrity:feed:123` maps to one hash slot on one node. 1M reads/sec on that key → one node handles all traffic while other nodes sit idle.

**Fixes:** local in-process cache (L1) in front of Redis (L2), key replication/sharding of the hot value, or client-side caching.

**Example (hot key mitigation).** Split `celebrity:feed:123` into `celebrity:feed:123:0` … `celebrity:feed:123:9` with identical value; clients pick random suffix. Reads spread across 10 slots/nodes. Writes update all 10 keys.

**Example (L1 + L2).** Caffeine cache in JVM (1s TTL, 10K entries) → Redis (5 min TTL) → DB. A viral post hit 100K times/sec: 99% served from in-process memory, 0.9% from Redis, 0.1% from DB.

**Interview angle.** "How do you detect hot keys?" → Monitor per-key QPS in Redis (`MONITOR` in dev; `redis-cli --hotkeys` or vendor metrics in prod). Sudden single-key spike + high CPU on one cluster node = hot key.

---

## 9. Penetration & Avalanche

- **Cache penetration:** queries for keys that **don't exist** (often malicious) always miss and hit the DB. Fix: **cache the null/empty result** (short TTL) and/or a **Bloom filter** to reject non-existent keys fast.
- **Cache avalanche:** many keys expire **at the same time** (or Redis restarts) → mass DB load. Fix: **TTL jitter**, multi-level cache, and Redis HA so it doesn't all vanish.

**How it works (penetration).** Attacker sends `GET user:-1`, `GET user:-2`, … for IDs that don't exist. Cache-aside: every request misses (nothing to cache), DB runs `SELECT ... WHERE id = -1` every time. 10K bogus IDs/sec = 10K DB queries/sec that return empty.

**Fix (cache nulls).**
```java
User user = db.findById(id);
if (user == null) {
    redis.set(key, NULL_MARKER, Duration.ofSeconds(60)); // short TTL — IDs may be created later
    return null;
}
```

**Fix (Bloom filter).** Pre-load all valid user IDs into a Bloom filter (~10 bits per ID). On read: if Bloom says "definitely not in set" → return 404 without touching DB or Redis. False positives (~1%) still hit DB — tunable via filter size.

**How it works (avalanche).** Scenario A: 50K keys share TTL=3600, all set at same deploy → expire together. Scenario B: Redis primary fails, replica promoted with cold cache → every request misses until cache warms. DB sees thundering herd similar to stampede but across many keys.

**Example.** E-commerce flash sale: 20K product keys cached with identical 5-min TTL. At expiry, checkout service fires 20K DB reads in 1 second. Fix: jitter TTLs + pre-warm cache before expiry via background refresh at T-30s.

**Interview angle.** Penetration = **non-existent keys**. Avalanche = **mass expiry or cache loss**. Different root causes; both end at DB overload but fixes differ (Bloom/null cache vs jitter/HA/pre-warm).

---

## 10. Cache Consistency

The cache and DB can drift. **Invalidate, don't update** the cache, and order operations carefully.

**Theory.** The DB is the source of truth; the cache is a **derived copy**. Updating the cache directly on write risks writing stale data if the DB write fails or if two writers race.

- **Recommended:** update DB → **delete** cache key (cache-aside repopulates on next read). Deleting is safer than writing a possibly-stale value.
- **Race:** reader loads old DB value and writes cache *after* a concurrent invalidate. Mitigate with short TTL (bounds staleness), delayed double-delete, or versioned keys.
- For cross-service freshness, publish an **invalidation event** (Kafka) so all caches drop the key.
- Accept that caches are **eventually consistent** — don't cache data that must be strictly correct on every read.

**How it works (the classic race).**
1. Thread A: read miss → starts DB read for user 1.
2. Thread B: update user 1 in DB → deletes cache key.
3. Thread A: DB returns **old** value (read started before B's commit, or READ COMMITTED sees pre-update row).
4. Thread A: writes old value into cache.
5. Next 10 minutes (TTL): all reads get stale data until TTL expires or another invalidation.

**Fix (delayed double-delete).** After DB update + cache delete, schedule a second delete after 500 ms — catches the late write from step 4.

**Fix (versioned keys).** Cache key = `user:1:v5`. On update, increment version in DB to v6. Old cache key `user:1:v5` is orphaned and expires via TTL; new reads use `user:1:v6`.

**Example (cross-service).** Order service updates order status in DB, publishes `OrderUpdated` event. Inventory and notification services consume event and delete their local `order:{id}` cache keys — no stale reads across services.

**Interview angle.** "Can you guarantee strong consistency with Redis cache?" → Not without distributed transactions or reading through DB every time. Practical answer: invalidation + short TTL + version keys; accept bounded staleness.

---

## 11. Distributed Lock

**Theory.** When multiple app instances run the same cron job or compete to rebuild a cache key, you need **mutual exclusion across JVMs**. Redis `SET NX` (set if not exists) gives a cheap distributed lock — but it has caveats.

```
SET lock:resource <token> NX PX 30000      # atomic: set if absent, 30s expiry
# release with a Lua script that deletes only if the token matches (don't free another's lock)
```

**How it works.** `SET key value NX PX ttl` is atomic in Redis: only one client succeeds if the key is absent. Others get `nil`. The unique `<token>` (UUID) identifies the lock holder. Release must be conditional — otherwise you might delete a lock re-acquired by another process after yours expired.

```lua
-- Atomic unlock: delete only if value matches our token
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
else
    return 0
end
```

- Always set a **TTL** (crashed holder won't deadlock).
- **Fence** with a token/version to survive "lock expired mid-work".
- **Redisson** provides `RLock` with auto-renewal (watchdog) and reentrancy.
- For correctness-critical locking prefer a consensus store (ZooKeeper/etcd); **Redlock** (multi-node) is debated.

**Example.** Cache rebuild: 500 threads miss `product:42`. First thread `SET lock:rebuild:42 uuid NX EX 5` succeeds → rebuilds. Others fail SET → wait 100 ms and retry cache GET (now populated) or return stale.

**Pitfall (lock expiry).** Thread acquires lock (30s TTL), GC pause lasts 35s, work resumes, thread deletes lock — but another thread already acquired it. Token check in Lua prevents deleting the wrong holder's lock.

**Pitfall (Redlock debate).** Martin Kleppmann showed edge cases with clock drift and multi-master failover. For payment idempotency or inventory, prefer DB row locks or etcd — Redis lock is fine for cache rebuild coordination.

(Covered in depth in the Resilience guide §9.)

**Interview angle.** "Is Redis lock enough for payment processing?" → No for sole correctness mechanism. Use DB `SELECT FOR UPDATE` or unique constraint + idempotent insert. Redis lock OK as optimization layer with TTL + token.

---

## 12. Rate Limiter

Redis is ideal for **distributed** rate limiting (shared counter across instances).

**Theory.** Each API server has its own in-memory counter — useless behind a load balancer (user hits server A 50 times + server B 50 times = 100 total, limit is 60). Redis holds the **shared state** all instances read/write atomically.

```
# Fixed window — simple but boundary spike at window edge
INCR rate:user:42:1700000060    # key includes window start timestamp
EXPIRE rate:user:42:1700000060 60   # only on first INCR (use Lua for atomicity)
# if value > limit -> 429

# Sliding window (more accurate) using a Sorted Set of timestamps
ZADD rate:user:42 <now_ms> <unique_request_id>   # score = timestamp
ZREMRANGEBYSCORE rate:user:42 0 <now_ms - window_ms>  # drop entries outside window
ZCARD rate:user:42           # count in window; if > limit -> 429
```

**How it works (fixed window).** Window = calendar minute. User sends 100 requests at 00:00:59 and 100 at 00:01:00 → 200 in 2 seconds despite "100/minute" limit. Cheap (one key per window) but unfair at boundaries.

**How it works (sliding window).** Store each request timestamp in a ZSet. Count entries in `[now - 60s, now]`. Accurate rolling 60-second window. Cost: O(log N) per request + memory for each request ID in the window (fine up to ~few hundred req/min per user).

Token-bucket can be implemented atomically with a Lua script. Atomicity (single-threaded Redis / Lua) avoids race conditions across instances.

**Example.** Free tier: 100 req/min per API key. Key `rate:apikey:abc123`. Sliding window with ZSet; at request 101 in the last 60s return HTTP 429 with `Retry-After: 12` (seconds until oldest request falls out of window).

**Interview angle.** "Fixed vs sliding window?" → Fixed = simpler, boundary burst problem. Sliding = accurate, more memory. Token bucket = allows controlled bursts (good for APIs that tolerate short spikes).

---

## 13. Persistence, HA & Cluster

- **Persistence:** **RDB** (point-in-time snapshots, compact, some loss window) vs **AOF** (append every write, more durable, larger). Many use **both**.
- **HA:** primary–replica replication + **Redis Sentinel** for automatic failover.
- **Scale-out:** **Redis Cluster** shards keys across nodes via **hash slots** (16384 slots); multi-key ops must share a slot (use **hash tags** `{user1}`).
- **Managed:** a managed cloud Redis service that handles replication, failover, and patching.

**How it works (RDB).** Fork child process → write memory snapshot to disk (`dump.rdb`). Parent continues serving. Snapshot every N minutes or M writes. **Recovery:** load RDB file on restart. **Data loss window:** everything since last snapshot (e.g., up to 5 min).

**How it works (AOF).** Append every write command to a log file. `fsync` policy trades durability vs speed: `always` (safest, slowest), `everysec` (default — at most 1s loss), `no` (OS buffer). **Recovery:** replay log. AOF rewrite compacts log periodically.

**How it works (replication).** Primary streams writes to replicas asynchronously. Replica serves reads (with lag). Sentinel monitors primary; on failure, promotes replica (~30s failover typical).

**How it works (Cluster).** 16384 hash slots partitioned across master nodes. `CRC16(key) mod 16384` → slot → node. `{user:42}:session` and `{user:42}:cart` share slot `{user:42}` — required for multi-key transactions on same user.

**Example.** 6 GB dataset, 100K ops/sec. Single node maxes at ~80K ops/sec → Redis Cluster with 3 masters (2 GB each) + 3 replicas for HA. Client uses cluster-aware driver (Lettuce, JedisCluster).

**Pitfall.** Using Redis as **only** copy of critical data without AOF/fsync → restart loses everything. Cache use case: acceptable. Session store: enable AOF + replicas.

**Interview angle.** "When RDB only?" → Pure cache where cold start + DB repopulate is OK. "When AOF?" → Session store, rate limit state you can't rebuild from DB.

---

## 14. Spring Cache

**Theory.** Spring Cache abstracts cache-aside behind annotations. AOP intercepts method calls — you don't write `redis.get()` manually. Under the hood it still uses cache-aside semantics with a `CacheManager`.

```java
@Cacheable(value = "users", key = "#id", unless = "#result == null")
public User getUser(Long id) { return db.findById(id); }   // check cache first; on miss, call method and store result

@CachePut(value = "users", key = "#u.id")
public User update(User u) { return db.save(u); }          // always runs method AND updates cache (write-through-like)

@CacheEvict(value = "users", key = "#id")
public void delete(Long id) { db.delete(id); }             // removes cache entry after method runs
```

```yaml
spring.cache.type: redis
spring.data.redis.host: my-redis
spring.cache.redis.time-to-live: 600000      # default TTL in ms (10 min)
```

**How it works.** `@Cacheable` → interceptor checks Redis before method body. Miss → executes method → serializes return value to Redis. `@CacheEvict` → deletes key (preferred over `@CachePut` on updates to avoid stale writes if DB transaction rolls back).

**Pitfall.** `@CachePut` on update writes cache **inside** the same transaction as DB — if transaction rolls back, cache has new data DB doesn't. Prefer `@CacheEvict` + let next read repopulate.

**Pitfall.** Default serialization (JDK serialization) breaks across deployments. Configure JSON serializer (Jackson) in `RedisCacheConfiguration`.

`@Cacheable` gives cache-aside with one annotation; configure a `RedisCacheManager` for per-cache TTLs and serialization (JSON).

**Example.** Per-cache TTL: `users` cache 10 min, `products` cache 1 hour — configure separate `RedisCacheConfiguration` entries in `RedisCacheManager` bean.

**Interview angle.** "How does `@Cacheable` handle stampede?" → It doesn't by default — same as manual cache-aside. Add `@Cacheable` + custom `CacheResolver` with locking, or use Caffeine L1 + Redis L2.

---

## 15. Interview Q&A

**Q1. Cache-aside vs write-through?**
Cache-aside: app loads on miss and writes DB then invalidates cache (lazy, resilient). Write-through: writes go to cache and DB synchronously (always fresh, higher write latency).

**Q2. How do you keep cache and DB consistent?**
Update DB then delete the cache key (repopulate on next read); use short TTLs and invalidation events. Caches are eventually consistent — don't cache strict-correctness data.

**Q3. What is a cache stampede and how do you prevent it?**
A popular key expires and many requests hit the DB at once. Prevent with a rebuild mutex, logical expiry + async refresh, request coalescing, and TTL jitter.

**Q4. Penetration vs avalanche?**
Penetration: misses for non-existent keys hitting the DB → cache nulls / Bloom filter. Avalanche: mass simultaneous expiry → TTL jitter + HA + multi-level cache.

**Q5. Which eviction policy for a cache?**
`allkeys-lru` (or `lfu`) with a `maxmemory` limit. `noeviction` if Redis is used as a primary store and you can't drop data.

**Q6. Why is Redis fast despite being single-threaded?**
In-memory, no lock contention, atomic commands, efficient data structures, and (in 6+) multi-threaded network I/O. It's memory/network-bound, not CPU-bound.

**Q7. How do you handle a hot key?**
Add a local L1 cache in front of Redis, replicate/shard the hot value, or use client-side caching; identify via monitoring.

**Q8. RDB vs AOF?**
RDB = periodic snapshots (compact, possible data loss between snapshots). AOF = log every write (more durable, larger, slower replay). Often enable both.

**Q9. How does Redis Cluster shard data?**
16384 hash slots distributed across nodes; key → CRC16 → slot → node. Multi-key ops need same slot via hash tags.

**Q10. Implement a distributed rate limiter in Redis.**
Fixed window with `INCR`+`EXPIRE`, or accurate sliding window with a sorted set of timestamps (`ZADD`/`ZREMRANGEBYSCORE`/`ZCARD`), made atomic via Lua so it's correct across instances.
