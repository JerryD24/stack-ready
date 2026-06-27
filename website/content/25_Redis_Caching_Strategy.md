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

**Cache when:** reads ≫ writes, data is expensive to compute/fetch, slight staleness is acceptable.
**Don't cache:** strongly-consistent financial balances at read time, rarely-read data, or when staleness is dangerous.

**Why single-threaded is fine:** Redis avoids lock overhead and context switches; it's network/memory-bound, and command execution is atomic. (Redis 6+ has multi-threaded I/O for the network layer.)

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

---

## 3. Caching Patterns

Two axes: **who reads/writes the DB** and **when**.
- **Cache-aside** — app manages cache (most common).
- **Read-through** — cache library loads from DB on miss.
- **Write-through** — write cache + DB synchronously.
- **Write-behind (write-back)** — write cache now, DB async later (fast but risk loss).

---

## 4. Cache-Aside

The default pattern. The application code owns cache logic.
```java
public User getUser(Long id) {
    String key = "user:" + id;
    User cached = redis.get(key);
    if (cached != null) return cached;            // hit
    User user = db.findById(id);                  // miss -> load from DB
    if (user != null) redis.set(key, user, Duration.ofMinutes(10)); // populate with TTL
    return user;
}
// On update: write DB, then INVALIDATE the cache (don't update it — see §10)
public void updateUser(User u) {
    db.save(u);
    redis.delete("user:" + u.getId());            // next read repopulates
}
```
Pros: simple, resilient (cache down ⇒ DB still served), only caches what's used. Cons: first read is a miss; risk of stale data until TTL/invalidation.

---

## 5. Write-Through & Write-Behind

**Write-through:** every write goes to cache **and** DB synchronously.
- Pro: cache always fresh. Con: write latency = cache + DB; caches data that may never be read.

**Write-behind:** write to cache immediately, **flush to DB asynchronously** (batched).
- Pro: very fast writes, absorbs spikes. Con: **data loss risk** if cache dies before flush; eventual consistency. Use only when some loss is tolerable (metrics, counters).

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

---

## 7. TTL Design

Every cache entry should usually have a **TTL** (expiry) so stale data self-heals and memory is bounded.
```
SET key value EX 600        # expire in 600s
```
- Short TTL = fresher data, more DB load; long TTL = less load, more staleness. Tune per data volatility.
- **Add jitter** to TTLs (e.g., 600 ± random 60s) so many keys don't expire simultaneously (→ avalanche, §9).
- Use **logical expiry** (store an `expireAt` field, refresh in background) for hot keys you never want to hard-miss.

---

## 8. Cache Stampede & Hot Keys

**Cache stampede (dogpile):** a popular key expires → thousands of concurrent requests miss and all hit the DB at once → DB overload.
**Fixes:**
- **Mutex/lock**: first requester rebuilds; others wait or serve stale (e.g., Redis `SET NX` rebuild lock).
- **Logical expiry + async refresh**: serve slightly stale data while one worker refreshes.
- **Request coalescing** (single-flight) at the app layer.

**Hot key:** one key gets disproportionate traffic, overloading a single shard.
**Fixes:** local in-process cache (L1) in front of Redis (L2), key replication/sharding of the hot value, or client-side caching.

---

## 9. Penetration & Avalanche

- **Cache penetration:** queries for keys that **don't exist** (often malicious) always miss and hit the DB. Fix: **cache the null/empty result** (short TTL) and/or a **Bloom filter** to reject non-existent keys fast.
- **Cache avalanche:** many keys expire **at the same time** (or Redis restarts) → mass DB load. Fix: **TTL jitter**, multi-level cache, and Redis HA so it doesn't all vanish.

---

## 10. Cache Consistency

The cache and DB can drift. **Invalidate, don't update** the cache, and order operations carefully.
- **Recommended:** update DB → **delete** cache key (cache-aside repopulates on next read). Deleting is safer than writing a possibly-stale value.
- **Race:** reader loads old DB value and writes cache *after* a concurrent invalidate. Mitigate with short TTL (bounds staleness), delayed double-delete, or versioned keys.
- For cross-service freshness, publish an **invalidation event** (Kafka) so all caches drop the key.
- Accept that caches are **eventually consistent** — don't cache data that must be strictly correct on every read.

---

## 11. Distributed Lock

```
SET lock:resource <token> NX PX 30000      # atomic: set if absent, 30s expiry
# release with a Lua script that deletes only if the token matches (don't free another's lock)
```
- Always set a **TTL** (crashed holder won't deadlock).
- **Fence** with a token/version to survive "lock expired mid-work".
- **Redisson** provides `RLock` with auto-renewal (watchdog) and reentrancy.
- For correctness-critical locking prefer a consensus store (ZooKeeper/etcd); **Redlock** (multi-node) is debated.

(Covered in depth in the Resilience guide §9.)

---

## 12. Rate Limiter

Redis is ideal for **distributed** rate limiting (shared counter across instances).
```
# Fixed window
INCR rate:user:42:60s        # first call also EXPIRE 60
# if value > limit -> 429

# Sliding window (more accurate) using a Sorted Set of timestamps
ZADD rate:user:42 <now> <now>
ZREMRANGEBYSCORE rate:user:42 0 <now-window>
ZCARD rate:user:42           # count in window
```
Token-bucket can be implemented atomically with a Lua script. Atomicity (single-threaded Redis / Lua) avoids race conditions across instances.

---

## 13. Persistence, HA & Cluster

- **Persistence:** **RDB** (point-in-time snapshots, compact, some loss window) vs **AOF** (append every write, more durable, larger). Many use **both**.
- **HA:** primary–replica replication + **Redis Sentinel** for automatic failover.
- **Scale-out:** **Redis Cluster** shards keys across nodes via **hash slots** (16384 slots); multi-key ops must share a slot (use **hash tags** `{user1}`).
- **Managed:** AWS **ElastiCache**, which handles replication/failover/patching.

---

## 14. Spring Cache

```java
@Cacheable(value = "users", key = "#id", unless = "#result == null")
public User getUser(Long id) { return db.findById(id); }   // auto cache-aside

@CachePut(value = "users", key = "#u.id")
public User update(User u) { return db.save(u); }

@CacheEvict(value = "users", key = "#id")
public void delete(Long id) { db.delete(id); }
```
```yaml
spring.cache.type: redis
spring.data.redis.host: my-redis
spring.cache.redis.time-to-live: 600000      # default TTL
```
`@Cacheable` gives cache-aside with one annotation; configure a `RedisCacheManager` for per-cache TTLs and serialization (JSON).

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
