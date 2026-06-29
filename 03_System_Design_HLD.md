# System Design — High Level Design (HLD)
### Complete Guide: Concepts + Real-World Systems

---

## TABLE OF CONTENTS
1. [How to Approach HLD Interviews](#1-how-to-approach-hld-interviews)
2. [Core Concepts — Scalability](#2-core-concepts--scalability)
3. [Databases](#3-databases)
4. [Caching](#4-caching)
5. [Message Queues](#5-message-queues)
6. [CAP Theorem & Consistency](#6-cap-theorem--consistency)
7. [Rate Limiting](#7-rate-limiting)
8. [Consistent Hashing](#8-consistent-hashing)
9. [Distributed Systems Concepts](#9-distributed-systems-concepts)
10. [Real-World System Designs](#10-real-world-system-designs)
11. [DEEP DIVE: Protocols & Architecture](#11-deep-dive-protocols--architecture)
12. [DEEP DIVE: Booking & Concurrency Systems](#12-deep-dive-booking--concurrency-systems)
13. [Tough Interview Q&A Bank](#13-tough-interview-qa-bank)
14. [System Design Interview Problems](#14-system-design-interview-problems)

---

## 1. How to Approach HLD Interviews

### The RESHADED Framework
```
R - Requirements (Functional + Non-Functional)
E - Estimation (Scale, storage, bandwidth)
S - Storage Schema (Data model)
H - High-level design (components, APIs)
A - APIs (key endpoints)
D - Deep Dive (bottlenecks, tradeoffs)
E - Edge Cases
D - Delivery (summarize decisions)
```

### Step-by-Step (45 min interview)
```
0-5 min:   Clarify requirements (ask questions!)
5-10 min:  Estimate scale (users, QPS, storage)
10-15 min: Define APIs + data model
15-30 min: High-level component diagram
30-40 min: Deep dive on critical components
40-45 min: Discuss tradeoffs, edge cases
```

### Key Questions to Ask
```
- How many users? (DAU/MAU)
- Read-heavy or write-heavy?
- Is consistency more important than availability?
- Latency requirements? (< 100ms, < 1s)
- Geographic distribution? (global vs regional)
- Any existing infrastructure?
- Data retention policy?
- Is real-time required?
```

**Theory.** The first 5 minutes set up the rest of the interview. Weak requirements → wrong architecture. Always clarify **functional** (what features) and **non-functional** (scale, latency, consistency) before drawing boxes.

**Example (worked estimation — "Design a photo-sharing feed").**
- Clarify: 10M DAU, each posts 0.5 photos/day, views 50 photos/day.
- **Write QPS:** 10M × 0.5 / 86,400 ≈ **58 writes/sec** (photos).
- **Read QPS:** 10M × 50 / 86,400 ≈ **5,800 reads/sec**.
- **Storage/day:** 5M photos × 2 MB avg = **10 TB/day** raw — likely need compression + CDN, not DB blob storage.
- **Bandwidth:** 5,800 reads/sec × 200 KB (thumbnail) ≈ **1.1 GB/sec** peak — CDN mandatory.

This math tells you: read-heavy, CDN + object storage + cache, not a monolithic DB holding images.

**Interview angle.** State assumptions out loud: "I'll assume 10M DAU unless you say otherwise." Interviewers often correct you — that dialogue is part of the test.

---

## 2. Core Concepts — Scalability

### Vertical vs Horizontal Scaling
```
Vertical (Scale Up):
  - Add more CPU/RAM/disk to existing server
  - Simple, no code change needed
  - Limit: single point of failure, hardware ceiling
  - Cost: exponential as you scale up

Horizontal (Scale Out):
  - Add more servers, distribute load
  - Unlimited theoretical ceiling
  - Complexity: need load balancer, distributed state management
  - Used by all large-scale systems
```

**Theory.** Vertical scaling hits a **hardware ceiling** (largest instance has finite CPU/RAM) and creates a **single point of failure**. Horizontal scaling trades simplicity for unlimited theoretical capacity — but requires stateless app design, load balancing, and distributed data stores.

**Example.** API needs 8K RPS. One 4-core server handles ~2K RPS → need 4 servers behind a load balancer (horizontal). Alternative: one 16-core machine (vertical) — simpler but one failure takes down everything; 16-core machine may cost more than 4× 4-core due to exponential pricing.

**Interview angle.** Start vertical for MVP; go horizontal when single-node limits or HA requirements demand it.

### Load Balancing
```
Algorithms:
  Round Robin:       Requests distributed cyclically 1→2→3→1→2→3
  Weighted RR:       Servers with more capacity get more requests
  Least Connections: Send to server with fewest active connections
  IP Hash:           Same client always goes to same server (session affinity)
  Random:            Random server selection
  Resource Based:    Based on server health metrics

Types:
  L4 (Transport Layer): Routes based on IP + TCP/UDP port
  L7 (Application Layer): Routes based on HTTP headers, URL, cookies
                           → Can do A/B testing, SSL termination, content-based routing

Tools: Nginx, HAProxy, AWS ALB, Cloudflare Load Balancer
```

**Theory.** A load balancer is the **traffic cop** in front of stateless app servers. It terminates connections (optional SSL), picks a backend, and health-checks instances. Without it, one server gets all traffic and others sit idle — or a dead server still receives requests.

**How it works (L4 vs L7).** L4 sees IP + port only — fast, protocol-agnostic. L7 parses HTTP — can route `/api/orders` to order service and `/api/users` to user service on the same port. L7 enables sticky sessions via cookies.

**Example.** 3 app servers, each handles ~2K RPS max. Total need: 5K RPS. LB with round-robin spreads ~1,667 RPS each — within capacity. One server dies → LB stops routing to it after failed health checks (~5–30s detection interval).

**Pitfall.** Round-robin with unequal request cost (one endpoint is 10× heavier) → one server overloaded while others idle. Use **least connections** or **weighted** routing instead.

**Interview angle.** "Where does the load balancer sit?" → Between clients and app tier. Not between app and DB (that's connection pooling / read replicas / sharding).

### CDN (Content Delivery Network)
```
Problem: Users globally access content from single origin → high latency

Solution: CDN = network of edge servers close to users
  - Static content (images, CSS, JS) cached at edge
  - Dynamic content can be cached with short TTL

Request flow:
  User → DNS resolves to nearest CDN edge node
       → Cache HIT: served from edge (< 50ms)
       → Cache MISS: fetch from origin, cache at edge, serve user

Providers: Cloudflare, AWS CloudFront, Akamai, Fastly

Cache Invalidation:
  - TTL-based: cache expires after N seconds
  - Purge: manually invalidate specific URLs
  - Versioned URLs: /static/app.v2.js (no invalidation needed)
```

**Theory.** A CDN puts copies of content **geographically close to users**. Without it, a user in Asia hitting a US origin adds **~150 ms RTT** per request. With CDN edge in Asia: **~20–50 ms**.

**How it works.** DNS resolves to nearest edge (Anycast or GeoDNS). Edge checks cache; on miss, fetches from origin (one slow request), caches locally, serves subsequent users in that region from edge.

**Example.** 1M users load a 500 KB JS bundle. Without CDN: 1M × 500 KB = 500 GB from origin. With CDN (90% hit rate after warm-up): 100 GB from origin + 400 GB served from edges — origin bandwidth drops 5×, user latency drops 3–10×.

**Interview angle.** CDN for **static** assets always. For **API responses**, only if cacheable (short TTL, user-agnostic data like product catalog). Never CDN-cache personalized/authenticated responses without careful cache-key design.

---

## 3. Databases

### SQL vs NoSQL

| Aspect | SQL (Relational) | NoSQL |
|--------|-----------------|-------|
| Schema | Fixed, predefined | Flexible, dynamic |
| Scaling | Vertical (mostly) | Horizontal (designed for) |
| Transactions | ACID | BASE (mostly) |
| Joins | Yes | Limited or none |
| Consistency | Strong | Eventual (configurable) |
| Best for | Complex queries, transactions | High scale, flexible schema |

### When to Use Which
```
Use SQL (PostgreSQL, MySQL) when:
  - Data relationships are complex
  - ACID transactions required (banking, orders)
  - Queries are complex and ad-hoc
  - Data model is well-defined and stable

Use NoSQL when:
  - Massive scale (TBs of data, millions of QPS)
  - Schema flexibility needed (rapidly evolving data)
  - Specific access patterns (key-value, document, graph, time-series)
  - Eventual consistency acceptable

NoSQL Types:
  Key-Value:   Redis, DynamoDB — session store, cache, leaderboard
  Document:    MongoDB, Couchbase — user profiles, catalogs, CMS
  Column-family: Cassandra, HBase — time-series, IoT, write-heavy
  Graph:       Neo4j, Amazon Neptune — social networks, fraud detection
  Time-series: InfluxDB, TimescaleDB — metrics, monitoring, IoT data
  Search:      Elasticsearch — full-text search, log analytics
```

### Database Replication
```
Primary-Replica (Master-Slave):
  - All writes → Primary
  - Reads → Replicas (read scaling)
  - Async replication (slight lag = eventual consistency)
  - Failover: promote replica on primary failure

Multi-Primary (Master-Master):
  - Writes to any primary
  - Conflict resolution needed
  - Complex but higher write availability

Read Replicas in AWS RDS:
  - Up to 5 read replicas
  - Cross-region read replicas for disaster recovery
  - Aurora: up to 15 read replicas with < 10ms replication lag
```

### Database Sharding
```
Problem: Single DB can't hold all data → horizontal partitioning

Sharding: splitting data across multiple DB instances

Methods:
  Hash Sharding: shard = hash(userId) % numShards
    PRO: Even distribution
    CON: Resharding is expensive (all data moves)

  Range Sharding: userId 1-1M → shard1, 1M-2M → shard2
    PRO: Easy range queries
    CON: Hot spots (new users all on latest shard)

  Geographic Sharding: US users → US shard, EU users → EU shard
    PRO: Low latency, data sovereignty
    CON: Uneven distribution possible

  Directory-Based: Lookup table maps keys to shards
    PRO: Flexible
    CON: Lookup table is a bottleneck/SPOF

Challenges:
  - Joins across shards (avoid or use application-level joins)
  - Cross-shard transactions (very complex)
  - Resharding (consistent hashing helps)
  - Data hotspots (add shard key to avoid)
```

**Theory.** Sharding is the **last resort** for write/storage scale. Before sharding, exhaust: query tuning, indexes, read replicas, caching, connection pooling, and table partitioning.

**Example (capacity math).** Single PostgreSQL primary: ~5K writes/sec sustainable, ~2 TB practical limit before maintenance pain. Need 20K writes/sec and 10 TB → at least 4 write shards (rough order-of-magnitude — validate with load tests).

**How replication fits.** 1 primary + 3 read replicas: writes still capped at primary rate (~5K/sec), reads scale to ~4× (each replica ~10K reads/sec with proper indexing) ≈ 40K read/sec total.

**Interview angle.** Always say: "I'd start with a single DB + replicas + cache. Shard when metrics prove we can't scale vertically or replicate reads enough."

### Database Indexing
```
B-Tree Index (default for most DBs):
  - Good for: equality, range queries, ORDER BY
  - Not good for: full-text search

Hash Index:
  - Only equality queries (=)
  - Faster for exact lookups than B-Tree

Composite Index: (col1, col2, col3)
  - Useful for queries filtering on col1, or col1+col2, or col1+col2+col3
  - Leftmost prefix rule: queries on col2 alone don't use this index

Covering Index:
  - Index includes all columns needed by query (no table lookup needed)
  - "Index covers the query"

When NOT to index:
  - Low cardinality columns (gender, boolean)
  - Frequently updated columns
  - Small tables (full scan faster)
  - Too many indexes slow down writes
```

---

## 4. Caching

### Caching Levels
```
L1 Cache: In-process (JVM heap) — fastest, but limited size, not shared
  Libraries: Caffeine, Guava Cache, Ehcache
  Use: Hot data, reference data, computation results

L2 Cache: Distributed (Redis, Memcached) — shared across instances
  Redis: Rich data types, persistence, pub/sub, Lua scripting
  Memcached: Simpler, multi-threaded, pure cache

L3 Cache: CDN / Edge — for static and semi-static content

Database Query Cache: deprecated in MySQL 8.0 (more harm than good)
```

### Cache Strategies
```
Cache-Aside (Lazy Loading):
  Application → check cache
    HIT → return cached value
    MISS → fetch from DB → store in cache → return
  
  PRO: Only caches data that's actually needed
  CON: Cache miss penalty, potential stale data, cache stampede

Write-Through:
  Application → write to cache AND DB synchronously
  PRO: Cache always up to date, no stale data
  CON: Write latency (two writes), writes to cache even for data never read

Write-Behind (Write-Back):
  Application → write to cache immediately
  Background → async write cache to DB
  PRO: Low write latency
  CON: Data loss risk if cache fails before DB write

Read-Through:
  Application → cache handles DB fetching
  Cache MISS → cache fetches from DB automatically
  PRO: Application code simpler
  CON: Cold start cache miss penalty
```

**Theory.** Cache-aside (lazy loading) is the default because you only cache what's actually read — no wasted memory on write-through for cold data. The app owns invalidation logic: **write DB → delete cache key**.

**Example (read ratio math).** Product page: 50K reads/sec, 100 writes/sec. Cache hit rate 95% → DB sees 2,500 reads/sec + 100 writes/sec instead of 50,100 reads/sec. Redis handles 47,500 reads/sec at ~1 ms each.

**Pitfall.** Cache-aside without TTL jitter on hot keys → stampede when key expires (see Cache Problems below). Always pair with mutex or logical expiry for viral content.

### Cache Invalidation Strategies
```
TTL (Time to Live): Cache expires after N seconds
  Simple but may serve stale data for up to TTL duration

Event-based invalidation: When DB updated, delete cache key
  Consistent but complex, race conditions possible
  Pattern: write to DB → publish event → cache invalidated

Cache-Aside with versioning: Include version/timestamp in cache key
  Version changes → new cache key → old auto-expires

Write invalidate: On write, delete cache (don't update)
  Next read will repopulate from DB
```

### Cache Problems and Solutions
```
Cache Stampede (Thundering Herd):
  Problem: Many requests simultaneously miss same key after expiry → all hit DB
  Solutions:
    - Mutex lock on cache miss (one thread fetches, others wait)
    - Probabilistic early expiration (refresh before TTL expires)
    - Background refresh thread

Cache Penetration:
  Problem: Requests for non-existent keys bypass cache → hit DB every time
  Solution: Cache null values with short TTL, use Bloom filter

Cache Avalanche:
  Problem: Many cache keys expire at same time → DB overwhelmed
  Solution: Add random jitter to TTL values (TTL + random(0, 300))

Hot Spot (Cache Hot Key):
  Problem: Single key accessed millions of times (celebrity post)
  Solution: Distribute across multiple keys (key_1, key_2... key_N), local L1 cache
```

### Redis Deep Dive
```
Data Structures:
  String:  SET key value [EX seconds] [NX]  → session storage, counters
  Hash:    HSET user:1 name Alice age 30   → user profiles
  List:    LPUSH queue task1              → message queues, activity feeds
  Set:     SADD tags:post1 java spring    → unique tags, followers
  Sorted Set: ZADD leaderboard 100 "Alice" → leaderboards, sliding window rate limiter
  Bitmap:  SETBIT active:20260428 userId 1 → daily active user tracking
  HyperLogLog: PFADD visitors ip1 ip2    → approximate unique count
  Stream:  XADD stream * field value      → event sourcing, message streaming

Persistence:
  RDB (Redis Database): Point-in-time snapshots (BGSAVE)
    - Fast restart, compact files
    - Data loss up to last snapshot interval
  AOF (Append Only File): Log every write operation
    - More durable, larger files, slower restart
  RDB + AOF: Use both for best durability

Redis Cluster:
  - 16384 hash slots distributed across nodes
  - hash_slot = CRC16(key) % 16384
  - Each master handles a range of slots
  - Each master has replicas for failover

Key commands for interviews:
  EXPIRE key seconds    → TTL
  PERSIST key           → remove TTL
  TTL key               → check remaining TTL
  INCR / INCRBY         → atomic counter
  SETNX                 → set if not exists (distributed lock primitive)
  GETSET                → atomic get + set
  MULTI/EXEC            → transactions
  WATCH                 → optimistic locking
  EVAL script           → Lua scripting (atomic complex operations)
```

---

## 5. Message Queues

### Why Use Message Queues?
```
1. Decoupling: Producer and consumer don't need to know each other
2. Async processing: Producer doesn't wait for consumer to finish
3. Load leveling: Absorb traffic spikes (producer fast, consumer at own pace)
4. Fault tolerance: If consumer down, messages wait in queue
5. Ordering: Kafka guarantees order within a partition
```

### Kafka Deep Dive
```
Core concepts:
  Topic:      Category/feed of messages (like a database table)
  Partition:  Topic split into partitions for parallelism + ordering
  Offset:     Position of a message within a partition (immutable, append-only)
  Producer:   Publishes messages to topics
  Consumer:   Subscribes to topics, pulls messages
  Consumer Group: Group of consumers sharing partition assignments
                  Each partition consumed by only ONE consumer in a group
  Broker:     Kafka server (a cluster has multiple brokers)
  Zookeeper:  Cluster coordination (being replaced by KRaft)

Message flow:
  Producer → Partition selection (round-robin or key-based hash) → Leader broker
  Leader writes to log → Followers replicate → ack to producer
  Consumer group → each consumer gets assigned partitions → pulls from offset
  
Ordering guarantee:
  - Within a partition: strict order (use same key for related messages)
  - Across partitions: NO guarantee

Delivery semantics:
  At most once:  Fire and forget, message may be lost (acks=0)
  At least once: Retry on failure, may get duplicates (acks=1 or all)
  Exactly once:  Idempotent producer + transactional consumer (acks=all + enable.idempotence=true)

Retention:
  Messages retained for configurable period (default 7 days) regardless of consumption
  Consumers can replay from any offset → event sourcing, reprocessing
```

**Theory.** Kafka is a **distributed commit log**, not a traditional message queue. Messages are **retained** after consumption — consumers track their own offset (position). This enables replay, multiple consumer groups reading the same data independently, and decoupling producers from consumer speed.

**How it works (throughput).** One broker with 3 partitions can handle ~100K–1M msgs/sec depending on message size and replication. Partition count = max parallelism per consumer group (one consumer per partition). Need 12 parallel consumers → at least 12 partitions.

**Example (ordering).** Order events for `order_id=42` must be processed in sequence → publish all events with **key=42** → same partition → strict order. Events for different orders can parallelize across partitions.

**Interview angle.** "Kafka vs RabbitMQ?" → Kafka: high throughput, replay, log retention, stream processing. RabbitMQ: task queues, complex routing, message deleted after ack — better for RPC-style job dispatch.

### Kafka vs RabbitMQ
| Feature | Kafka | RabbitMQ |
|---------|-------|----------|
| Model | Log-based (pull) | Message broker (push) |
| Throughput | Very high (millions/sec) | High (tens of thousands/sec) |
| Message retention | Configurable (days) | Deleted after consumption |
| Replay | Yes (rewind offset) | No |
| Ordering | Per partition | Per queue |
| Routing | Topic/partition | Exchange + binding rules (fanout, direct, topic, headers) |
| Use case | Event streaming, log aggregation | Task queues, RPC, complex routing |

---

## 6. CAP Theorem & Consistency

### CAP Theorem
```
In a distributed system, you can only guarantee 2 of 3:
  C - Consistency: All nodes see the same data at the same time
  A - Availability: Every request receives a response (not necessarily latest)
  P - Partition Tolerance: System works despite network partitions

In practice: Network partitions are inevitable → must choose between C and A
  CP systems: Strong consistency, may become unavailable during partition
              HBase, Zookeeper, etcd
  AP systems: Always available, may return stale data during partition
              Cassandra, CouchDB, DynamoDB
  CA systems: Single-node databases (not distributed)
              MySQL (single node), PostgreSQL (single node)
```

**Theory (common misconception).** CAP is not "pick 2 and drop 1 forever." It's: **during a network partition**, you must choose between consistency and availability. During normal operation, many systems provide both. **P is non-optional** in distributed systems — networks fail.

**How it works (partition scenario).** Primary and replica lose connectivity. CP system: reject writes until quorum confirms (unavailable to some clients). AP system: accept writes on both sides → conflict when partition heals (availability over consistency).

**Example.** Payment ledger during partition: CP — block writes until primary reachable (prefer downtime over double-spend). Social media "like count": AP — show approximate count, reconcile later.

**Interview angle.** "Is PostgreSQL CA or CP?" → Single node: CA (no partition). With synchronous replication quorum: CP during partition (writes blocked if can't reach quorum).

### ACID vs BASE
```
ACID (relational DBs):
  Atomicity:   All or nothing
  Consistency: DB moves from one valid state to another
  Isolation:   Concurrent transactions don't interfere
  Durability:  Committed data persists even on crash

BASE (distributed/NoSQL):
  Basically Available: System always responds (even if stale)
  Soft state:         State may change over time (even without input)
  Eventually consistent: System will become consistent given enough time
```

### Consistency Patterns
```
Strong Consistency:
  After write, all reads reflect that write
  Implementation: synchronous replication, quorum writes
  Cost: Latency, reduced availability

Eventual Consistency:
  After write, reads will eventually reflect it (seconds to minutes)
  Best effort, high availability, low latency
  Examples: DNS, email, social media "likes"

Read-your-writes Consistency:
  After write, same user/session always sees their own writes
  Other users may see old data
  Implementation: route same user's reads to same replica

Monotonic reads:
  Once you've read a value, you'll never see older value
  Implementation: route user to same replica

Causal Consistency:
  Causally related operations seen in order
  "Reply appears after the post it replies to"
```

**Theory.** Most production systems pick a **pragmatic middle ground** — not full strong consistency everywhere (too slow), not pure eventual everywhere (bad UX for own writes).

**Example (read-your-writes).** User posts a comment, immediately refreshes feed. Route that user's reads to primary (or session-sticky replica) for 30s after write — they see their comment. Other users on replicas see it after replication lag (~100 ms–2 s).

**Example (monotonic reads).** User on replica A reads `balance=100`. Next read routed to replica B which is behind → sees `balance=50`. Violates monotonic reads. Fix: sticky routing — same user always hits same replica (or primary for financial data).

**Interview angle.** Name the consistency level your design provides and **why it's enough** — "eventual for feed, read-your-writes for profile edits."

---

## 7. Rate Limiting

### Why Rate Limit?
```
1. Prevent abuse (DDoS, scraping)
2. Ensure fair usage
3. Protect downstream services
4. Monetization (free tier: 100 req/min, paid: 1000 req/min)
```

### Algorithms
```
1. Token Bucket:
   - Bucket holds N tokens
   - Add 1 token every 1/rate seconds (or add rate tokens per second)
   - Each request consumes 1 token
   - If empty → reject request
   - Allows bursts up to bucket size
   PRO: Smooth average, allows bursts
   
2. Leaky Bucket:
   - Queue acts as bucket
   - Requests added to queue
   - Process requests at fixed rate (leak)
   - If full → reject
   PRO: Smooth output rate
   CON: Old requests may starve new ones

3. Fixed Window Counter:
   - Count requests per window (e.g., 100 per minute)
   - Reset counter at window boundary
   Problem: Boundary attack (100 req at 00:59, 100 req at 01:01 → 200 in 2 seconds)

4. Sliding Window Log:
   - Store timestamp of each request
   - Count requests within rolling window
   PRO: Accurate
   CON: Memory intensive (stores all timestamps)

5. Sliding Window Counter (Hybrid):
   - Uses fixed windows + estimate for overlap
   - Memory efficient, approximately accurate
   Formula: count = current_window_count + prev_window_count * (1 - elapsed_pct)
```

**Theory.** Rate limiting protects **your service and downstream dependencies** from abuse and accidental retry storms. In distributed systems, the counter must live in shared storage (Redis) — per-instance counters are ineffective behind a load balancer.

**Example (boundary attack on fixed window).** Limit: 100 req/min. User sends 100 requests at 00:00:59 and 100 at 00:01:00 → 200 requests in 2 seconds despite "100/minute" rule. Sliding window or token bucket closes this gap.

**Example (token bucket).** Bucket size 100, refill 10/sec. User sends burst of 100 → allowed. Then sustained 10/sec → allowed. Sustained 50/sec → bucket drains in ~2s, then 429 until tokens refill. Good for APIs that tolerate short bursts.

**Interview angle.** Always mention **429 Too Many Requests** + `Retry-After` header + idempotency for retried writes.

### Distributed Rate Limiting
```
Problem: Multiple server instances → need shared counter

Solution: Redis as centralized counter
  INCR key → atomic increment
  EXPIRE key window_in_seconds

Redis Lua script for atomicity:
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
if count > tonumber(ARGV[2]) then
  return 0  -- rate limited
end
return 1    -- allowed

Sliding window with Redis ZSET:
  ZADD user:ratelimit timestamp timestamp   → add request
  ZREMRANGEBYSCORE user:ratelimit 0 (now-windowSize)  → remove old
  ZCARD user:ratelimit                      → count in window
  EXPIRE key windowSize                     → cleanup
```

---

## 8. Consistent Hashing

### Problem with Regular Hashing
```
server = hash(key) % N  (N = number of servers)
When N changes (add/remove server):
  - Almost all keys must be remapped
  - Cache misses, data migration chaos
```

### Consistent Hashing
```
Concept:
  - Arrange servers and keys on a ring (0 to 2^32 - 1)
  - Each server gets position: hash(serverIP) → position on ring
  - Each key goes to: first server encountered clockwise on ring

Adding a server:
  - Only keys between new server and its predecessor move
  - Approximately 1/N of keys remapped

Removing a server:
  - Only keys of removed server move to next server
  - Rest unchanged

Virtual Nodes:
  Problem: Uneven distribution with few physical nodes
  Solution: Each physical server → multiple virtual nodes on ring
  More virtual nodes → more even distribution
  Also helps when servers have different capacities (more VNs for powerful servers)

Used in: Amazon DynamoDB, Apache Cassandra, Memcached (ketama), Redis Cluster
```

**Theory.** Regular hashing `hash(key) % N` remaps **almost all keys** when N changes (add/remove server). Consistent hashing limits remapping to **~K/N keys** (K = total keys) — critical for caches and distributed stores where moving data is expensive.

**How it works (numeric example).** Ring from 0 to 2³²−1. Three servers at positions 0, 1.4B, 2.8B (hashed from their IDs).
- Key "user:42" hashes to 500M → clockwise → lands on server at 1.4B.
- Add server D at 2B → only keys between 1.4B and 2B move from old server to D (~25% of keys with 4 servers, not 100%).
- Remove server → its keys move to next clockwise neighbor only.

**Example (virtual nodes).** 3 physical servers with 1 vnode each → uneven load (one server might get 50% of keys by unlucky hash clustering). Each physical server gets **150 vnodes** on the ring → load within ~10% of perfect balance.

**Pitfall.** Consistent hashing doesn't solve **hot keys** — a popular key still lands on one node. Combine with key replication or local caching for hot spots.

**Interview angle.** Draw the ring. Show that adding a 4th node moves ~1/4 of keys, not all of them. Mention vnodes for even distribution.

---

## 9. Distributed Systems Concepts

### Distributed ID Generation
```
Requirements: Unique, Sortable (time-based), Scalable, High availability

Options:
1. UUID v4: random, 128-bit, globally unique
   CON: Not sortable, large (36 chars), no embedded info

2. Database Auto-increment:
   CON: Single point of failure, bottleneck

3. Twitter Snowflake:
   64-bit: [1 sign bit][41 bits timestamp ms][10 bits machine ID][12 bits sequence]
   PRO: Time-sortable, 2^12=4096 IDs/ms per machine, 2^10=1024 machines
   CON: Clock skew issues

4. ULID (Universally Unique Lexicographically Sortable Identifier):
   48-bit timestamp + 80-bit random
   URL-safe, string-sortable, compact

5. Ticket Server:
   Dedicated server generating monotonic IDs
   PRO: Simple
   CON: SPOF (can run two for high availability)
```

**How it works (Snowflake).** 64-bit ID: 41-bit timestamp (ms since epoch) + 10-bit machine ID + 12-bit sequence. IDs sort chronologically — great for B-tree inserts (no random UUID fragmentation). At 4096 IDs/ms per machine, one machine generates ~4M IDs/sec — far more than most services need.

**Example.** Order IDs: `1740000000000000001`, `1740000000000000002` — time-sortable, URL-safe as decimal string, fits in `BIGINT`. Compare to UUIDv4: random, 36 chars, bad for clustered index insert order.

**Pitfall (clock skew).** Machine clock goes backward → duplicate ID risk. NTP sync + refuse to generate until clock catches up. Interview mention shows depth.

### Bloom Filter
```
Probabilistic data structure: check if element MAY be in a set
  Answers: "Definitely not in set" OR "Probably in set" (false positives possible)
  Space-efficient: represents millions of items in few KB/MB
  No false negatives (if Bloom says no → definitely no)

Use cases:
  - Avoid DB lookups for non-existent keys (cache miss avoidance)
  - Check if username/email already taken (first pass)
  - Web crawlers: avoid revisiting URLs
  - Spam filters: known spam URLs

Implementation:
  - Bit array of size m, k hash functions
  - Add: hash with k functions → set those k bits to 1
  - Check: hash with k functions → if all bits are 1 → "probably present"
```

**Theory.** A Bloom filter answers set membership with **no false negatives** but **possible false positives**. You never wrongly reject a valid key, but you might think a key exists when it doesn't (~1% with proper sizing).

**How it works.** Bit array of size m, k hash functions. Insert "user:42": hash to positions 3, 17, 99 → set those bits to 1. Check "user:99": hash to 3, 44, 91 → bit 44 is 0 → **definitely not in set** (skip DB). Check "user:42": all bits 1 → **probably in set** (query DB to confirm).

**Example.** 10M registered usernames, Bloom filter ~12 MB (vs 10M × 50 bytes = 500 MB for a hash set). Signup flow: check Bloom first → if "no", skip DB uniqueness check. False positive 1% → one extra DB lookup occasionally.

**Interview angle.** "Why not just use Redis SET?" → Memory. Bloom filter is 10–50× smaller for large sets where false positives are acceptable.

### Distributed Locks
```
Use case: Ensure only one instance runs a job (cron, payment processing)

Redis Redlock:
  1. Get current time T1
  2. Try to acquire lock on N/2+1 Redis instances (SET key value NX PX ttl)
  3. Lock acquired if: majority instances locked AND total time < TTL
  4. Set lock expiry = TTL - (T2-T1) - clock drift margin
  5. On failure: release all locks, retry with random delay

Simpler approach (for non-critical):
  SET lock:payment:order123 clientId NX PX 30000  (NX=only if not exists, PX=30000ms TTL)
  → if returns OK: lock acquired
  → process job
  → if clientId matches: DEL lock:payment:order123

Avoid lock expiry issues:
  - Use unique value per lock holder to prevent deleting someone else's lock
  - Use Lua script for atomic check-and-delete
```

### Event Sourcing & CQRS
```
Event Sourcing:
  - Store sequence of events (facts), not current state
  - State = apply all events in order
  - Never delete or update events (append-only)
  
  Benefits:
    - Full audit log for free
    - Time travel (rebuild state at any point)
    - Decouple producers and consumers
    - Event replay for new features

  Challenges:
    - Querying current state is complex (must replay all events)
    - Snapshot needed for large event histories
    - Schema evolution of events

CQRS (Command Query Responsibility Segregation):
  - Separate read model from write model
  - Writes: Commands → update write DB
  - Reads: Queries → optimized read DB (materialized views, denormalized)
  - Events bridge write → read model updates
  
  Benefits:
    - Optimize reads and writes independently
    - Read model can be ElasticSearch, Redis, etc.
  
  Combined ES + CQRS:
    Command → Event → Event Store → Event handler → Read Model
                    ↑
              Replay for new read models
```

---

## 10. Real-World System Designs

### 10.1 URL Shortener (like bit.ly)

**Requirements:**
- 100M URLs shortened per day, 10B redirections per day
- URLs expire after 5 years, custom aliases supported
- Low latency reads (< 10ms)

**Estimation:**
- Write QPS: 100M / 86400 ≈ 1,200 writes/sec
- Read QPS: 10B / 86400 ≈ 115,000 reads/sec (100x read-heavy)
- Storage: 100M * 365 * 5 * 500 bytes ≈ 91 TB over 5 years

**Design:**
```
Client → API Gateway → Shortener Service → Unique ID Generator (Snowflake or Base62 counter)
                    ↓                   ↓
               Redis Cache          MySQL/DynamoDB
               (hot URLs)          (all mappings)
              
Redirect Service ← DNS ← Client (short URL)
    ↓ 1. check Redis cache (cache-aside)
    ↓ 2. if miss, check DB
    ↓ 3. return HTTP 301 (permanent, cached by browser) or 302 (temporary, not cached)
    ↓ analytics - log async to Kafka

Short URL generation:
  - Use base62 encoding (a-z, A-Z, 0-9) of 6-7 chars → 62^7 = 3.5 trillion URLs
  - Approach 1: hash(original URL) → take first 7 chars of MD5/SHA256 → collision risk
  - Approach 2: Auto-increment counter → convert to base62 (recommended)
  - Approach 3: Pre-generate and store in "available IDs" table
```

**Database Schema:**
```sql
CREATE TABLE url_mapping (
    short_code VARCHAR(10) PRIMARY KEY,
    original_url TEXT NOT NULL,
    user_id BIGINT,
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    click_count BIGINT DEFAULT 0
);
-- Index on user_id for user's URL history
-- Partition by created_at for data archival
```

---

### 10.2 Rate Limiter (Design the Service)

**Requirements:**
- Support multiple rate limiting rules (per user, per IP, per endpoint)
- Low latency (< 1ms overhead)
- Distributed (multiple servers)
- Rule changes without restart

**Design:**
```
Client → Load Balancer → Rate Limiter Middleware → API Servers
              ↓
        Rules stored in
        Redis (fast) + DB (persistent)
        
Rate Limiter flow:
  1. Extract client identifier (userId, IP, API key)
  2. Look up applicable rules (from in-memory cache, refreshed from DB)
  3. Use Redis sliding window: ZADD + ZREMRANGEBYSCORE + ZCARD
  4. If under limit → forward request, add headers:
     X-RateLimit-Limit: 100
     X-RateLimit-Remaining: 47
     X-RateLimit-Reset: 1617...
  5. If over limit → HTTP 429 with Retry-After header

Multiple rules:
  User tier: FREE (100/min), PRO (1000/min), ENTERPRISE (unlimited)
  Endpoint: POST /upload (10/min), GET /search (100/min)
  Use most restrictive rule that applies
```

---

### 10.3 WhatsApp / Chat System

**Requirements:**
- 1:1 and group messaging (max 100 members)
- Message delivery receipts (sent ✓, delivered ✓✓, read ✓✓ blue)
- Online/offline status
- File/media sharing
- End-to-end encryption

**Estimation:**
- 500M DAU, average 40 messages/day = 20B messages/day
- Message size average 100 bytes → 2 TB/day message data
- Active connections: ~500M persistent connections

**Design:**
```
Architecture:
  Client → WebSocket Server (long-lived connection)
        ← Message pushed by server
        
Components:
  1. Chat Service: handle send/receive messages
  2. Presence Service: track online/offline, last seen
  3. Notification Service: push notifications for offline users
  4. Media Service: upload/download files (pre-signed S3 URLs)
  5. Message Store: Cassandra (write-heavy, time-series)
  6. Session Store: Redis (which WebSocket server holds client connection)

Message flow (1:1):
  Alice (WS Server A) → sends message → Chat Service
    → store in Cassandra
    → check receiver online? → lookup Session Store
    → Bob online on WS Server B → forward via internal messaging (Kafka)
    → WS Server B pushes to Bob
    → update receipt: delivered ✓✓
    → if Bob offline → Notification Service → APNs/FCM

Group message:
  Alice sends to group → Chat Service
    → lookup group members (up to 100)
    → Fan-out: for each online member → push via respective WS server
    → for offline members → push notification

Cassandra schema:
  messages_by_conversation:
    conversation_id (partition key)
    message_id (timeuuid, clustering key, DESC)
    sender_id
    content (encrypted)
    message_type (text/image/video)
    created_at
    
WebSocket servers scale horizontally:
  Client reconnects → Session Store updated with new server
  Inter-server communication via Kafka or Redis Pub/Sub
```

---

### 10.4 Netflix / Video Streaming

**Requirements:**
- Upload and stream videos
- Multiple resolutions (360p, 720p, 1080p, 4K)
- Support millions concurrent viewers
- Personalized recommendations
- Low buffering

**Design:**
```
Upload Flow:
  Creator uploads raw video → Upload Service → S3 (original)
    → Message to Kafka → Transcoding Service (AWS Elastic Transcoder / custom)
    → Multiple resolutions + formats (HLS, DASH)
    → Transcoded chunks → S3 → CDN propagated
    → Metadata stored in MySQL
    → Search indexed in Elasticsearch

Streaming Flow (Adaptive Bitrate):
  User clicks video → API Server → return video metadata + CDN URLs
  Video player → requests manifest file (m3u8 for HLS)
  Player analyzes network speed → requests appropriate quality chunks
  Chunks served from nearest CDN edge
  If network drops → player switches to lower quality automatically

CDN Strategy:
  Static content (thumbnails, JS): Cloudfront/Akamai, long cache TTL
  Video chunks: Regional edge servers, replicated proactively for popular content
  Long-tail content: Pulled from origin on first request, cached

Recommendation System:
  Collaborative filtering: users with similar watch history → similar recommendations
  Content-based: similar genre/actors to what you watched
  Data pipeline: watch events → Kafka → Spark/Flink streaming → update model

Database choices:
  MySQL: user data, subscription, payments
  Cassandra: watch history, view counts (write-heavy)
  Elasticsearch: search, recommendations
  Redis: session, real-time popularity scores
```

---

### 10.5 Twitter News Feed / Facebook Feed

**Requirements:**
- Post tweets (text, images, videos)
- Follow other users
- News feed: see tweets from followed users
- Real-time updates
- Trending topics

**Feed Generation Approaches:**
```
PULL (Fan-out on read):
  When user opens feed:
    → Fetch list of followees
    → Fetch latest tweets from each (N queries or JOIN)
    → Merge and sort by timestamp
    → Return top K tweets
  PRO: No wasted computation for inactive users
  CON: High read latency for users following many people (celebrities)

PUSH (Fan-out on write):
  When user posts tweet:
    → Write to Cassandra (tweet store)
    → Look up all followers
    → For each follower: write tweet ID to their feed queue (Redis or Cassandra)
  When user opens feed:
    → Read from their precomputed feed (O(1))
  PRO: Low read latency
  CON: Expensive for celebrities (Lady Gaga has 50M followers → 50M writes per tweet!)
       Wastes resources for inactive users

HYBRID (Twitter's actual approach):
  Regular users: fan-out on write (precomputed feed)
  Celebrities (>1M followers): fan-out on read (fetched at read time)
  Mix at read time: merge precomputed feed + celebrity tweets
```

**Trending Topics:**
```
Count hashtag occurrences in last 1 hour
  Kafka: stream all tweets → Flink/Spark streaming → count by hashtag in sliding window
  Store top-K in Redis Sorted Set: ZADD trending_hour timestamp count hashtag
  Expose via API, cache result
  
CountMinSketch: approximate frequency counting with low memory
```

---

### 10.6 Design a Notification System

**Requirements:**
- Send notifications via Email, SMS, Push notification
- Support multiple providers (failover)
- 10M notifications/day
- At least once delivery
- User notification preferences

**Design:**
```
Trigger Sources → Notification Service → Kafka Topics (per channel)
                                    ↓                ↓               ↓
                              Email Workers    SMS Workers    Push Workers
                                    ↓                ↓               ↓
                              SES/Sendgrid    Twilio/SNS     FCM/APNs
                              
Flow:
  1. Event occurs (order placed, payment failed) → publish to Kafka
  2. Notification Service consumes event
  3. Fetch user notification preferences (MySQL, cached in Redis)
  4. If user wants this type of notification on this channel:
     → Format message using template (stored in DB)
     → Route to appropriate channel Kafka topic
  5. Channel-specific workers consume and call third-party providers
  6. Track delivery status in DB (sent, failed, delivered)
  7. Retry on failure with exponential backoff

Reliability:
  - Kafka ensures at-least-once delivery
  - Idempotency key prevents duplicate notifications
  - Dead letter queue for failed after max retries
  - Multiple provider support (Twilio fails → fallback to SNS)

User preferences:
  user_notification_prefs table:
    user_id, notification_type, channel, enabled, quiet_hours_start, quiet_hours_end
```

---

### 10.7 Design a Search Autocomplete System

**Requirements:**
- Return top K suggestions as user types (each keystroke)
- Suggestions ranked by popularity/relevance
- < 100ms latency
- Support 10M queries/day

**Design:**
```
Data Structure: Trie
  - Each node = character
  - Leaf nodes have frequency count
  - At each node, store top 10 suggestions for that prefix (cache)
  
  Search "java":
    j → ja → jav → java → return top 10 suggestions cached at "java" node

Trie limitations:
  - Too large for memory at scale
  - Can't store trie on single machine

Solution: Shard trie by prefix
  a-g → Server 1
  h-p → Server 2
  q-z → Server 3

Data Pipeline:
  User searches → Log to Kafka → Spark batch job (hourly) → count frequencies
  Update trie with new frequencies → push to cache (Redis/Memcached)
  
  OR: Real-time stream: Kafka → Flink → update trie incrementally

API:
  GET /autocomplete?q=java&limit=10
  Response: ["java developer", "java interview", "javascript", ...]

Caching:
  Most queries are common → cache top-N prefix results in Redis
  Remaining: query trie service
  
Top K problem:
  Use min-heap of size K to maintain top K at each trie node
  Space: O(prefix_count * K)
```

---

### 10.8 Uber / Ride Sharing

**Requirements:**
- Rider requests ride
- Match with nearest available driver
- Real-time location tracking
- Price estimation
- Trip management, payments

**Design:**
```
Location Tracking:
  Driver app → sends GPS coordinates every 5 seconds
  → WebSocket server → Location Service
  → Update Redis GeoSpatial index: GEOADD drivers_online lng lat driverId

Ride Matching:
  Rider requests ride from (lat, lng)
  → Matching Service → GEORADIUS drivers_online lng lat 5 km ASC COUNT 10
  → Get 10 nearest available drivers
  → Sort by ETA (use road network, not straight line distance — Google Maps API)
  → Send request to nearest driver
  → Driver accepts → create Trip

Geospatial indexing:
  Redis GEORADIUS: efficient spatial queries
  Alternative: Quadtree (divide map into quadrants, recursively)
  Alternative: Google S2 cells (spherical geometry, used by Uber)

Scaling location updates:
  500K active drivers × 1 update/5s = 100K writes/sec
  Redis can handle this
  
  Route to correct location server: consistent hashing by geographic region
  Each region has dedicated location server (proximity → same server)

Trip lifecycle:
  States: REQUESTED → ACCEPTED → ARRIVED → STARTED → COMPLETED / CANCELLED
  Stored in MySQL + Kafka events for each state change
  Payment triggered on COMPLETED → Payment Service

Real-time communication:
  Driver ↔ Rider: WebSocket for real-time location sharing during trip
```

---

## COMMON INTERVIEW TRADEOFFS

| Decision | Option A | Option B | When to choose |
|----------|----------|----------|----------------|
| Consistency | Strong | Eventual | Banking: Strong; Social media: Eventual |
| Storage | SQL | NoSQL | Complex queries: SQL; High scale flexible: NoSQL |
| Caching | In-memory (Caffeine) | Distributed (Redis) | Single instance: In-memory; Multi-instance: Redis |
| Messaging | Synchronous REST | Async Kafka | Simple: REST; Decoupled + scale: Kafka |
| ID generation | UUID | Snowflake | Not sorted: UUID; Time-sorted + compact: Snowflake |
| Feed generation | Fan-out on write | Fan-out on read | Low followers: write; Celebrities: read or hybrid |
| Search | SQL LIKE | Elasticsearch | Simple: SQL; Full-text, ranking: ES |

---

## ESTIMATION CHEAT SHEET

```
Powers of 2:
  2^10 = 1 KB (Kilo)
  2^20 = 1 MB (Mega)
  2^30 = 1 GB (Giga)
  2^40 = 1 TB (Tera)

Time conversions:
  1 day = 86,400 seconds ≈ 100K seconds
  1 month = 2.5M seconds
  1 year = 30M seconds

Latency numbers (approximate):
  L1 cache: 1 ns
  L2 cache: 10 ns
  RAM: 100 ns
  SSD read: 100 μs
  HDD seek: 10 ms
  Network (same DC): 0.5 ms
  Network (cross continent): 150 ms
  
Throughput rules of thumb:
  Web server: ~10K RPS per instance
  MySQL: ~1K-5K writes/sec, ~10K reads/sec (with caching)
  Redis: ~100K-1M ops/sec
  Kafka: millions of messages/sec per broker
  
Storage:
  Tweet: ~300 bytes
  Photo: ~200 KB
  Video: ~10 MB/min (compressed)
  User profile: ~1 KB
```

---

## 11. DEEP DIVE: Protocols & Architecture

### 11.1 HTTP vs HTTPS — Full Working

```
HTTP (HyperText Transfer Protocol) — port 80
  Stateless request/response over TCP
  Methods: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
  Headers: Content-Type, Authorization, Cache-Control, etc.
  Body: optional (JSON, form data, binary)

  Client                    Server
    │── GET /api/users ──────►│
    │◄── 200 OK + JSON ───────│
  All plaintext — vulnerable to MITM (man-in-the-middle)
```

```
HTTPS = HTTP + TLS (Transport Layer Security) — port 443

TLS Handshake (simplified):
  1. Client Hello
     - TLS version (1.2 or 1.3)
     - Cipher suites supported
     - Random nonce (client_random)

  2. Server Hello
     - Chosen cipher suite
     - SSL Certificate (contains public key, domain, CA signature)
     - Random nonce (server_random)

  3. Client verifies certificate
     - Check expiry, domain match, CA chain of trust
     - OCSP stapling for revocation check

  4. Key Exchange
     - Client generates pre-master secret
     - Encrypts with server's public key (from certificate)
     - Both derive session keys (symmetric) from randoms + secret

  5. Finished
     - Encrypted "Finished" messages confirm handshake
     - All subsequent HTTP traffic encrypted with AES-GCM (symmetric)

Why symmetric after handshake?
  - Asymmetric (RSA/ECDH) is slow — used only for key exchange
  - Symmetric (AES) is fast — used for bulk data encryption
```

**Interview points:**
- HTTPS does NOT hide destination IP/domain (SNI visible)
- Certificate pinning — app trusts only specific cert (mobile apps)
- HSTS — browser forces HTTPS for domain
- TLS 1.3 — faster handshake (1-RTT), removed weak ciphers

### 11.2 gRPC vs REST vs SQL

| Dimension | REST | gRPC | SQL |
|-----------|------|------|-----|
| What is it? | Architectural style | RPC framework | Data query language |
| Transport | HTTP/1.1 or HTTP/2 | HTTP/2 only | JDBC/ODBC to DB |
| Format | JSON/XML | Protocol Buffers (binary) | Relational tuples |
| Schema | Optional (OpenAPI) | Required (.proto) | DB schema (DDL) |
| Performance | Good | Better (binary, HTTP/2 multiplexing) | Depends on query/index |
| Streaming | SSE, WebSocket | Native bidirectional streaming | Cursor/result set |
| Code gen | Optional | Required (stubs from .proto) | ORM generates entities |
| Use case | Public APIs, browsers | Microservice internal calls | Persistence layer |

```
Typical microservice stack:
  External client ──REST/JSON──► API Gateway ──gRPC──► Order Service
                                                    ──gRPC──► Payment Service
  Order Service ──SQL/JDBC──► PostgreSQL
  Services ──Kafka──► async events
```

### 11.3 Monolithic vs Microservices — Deep Comparison

| Aspect | Monolithic | Microservices |
|--------|-----------|---------------|
| Codebase | Single repo, single deploy unit | Multiple repos/services |
| Scaling | Scale entire application | Scale individual bottlenecks |
| Technology | One stack | Polyglot possible |
| Data | Usually one shared DB | Database per service |
| Transactions | ACID `@Transactional` easy | Distributed saga, eventual consistency |
| Deployment | Simple, all-or-nothing | Independent, CI/CD per service |
| Debugging | Single process, easy trace | Distributed tracing (Jaeger, Zipkin) |
| Team | Small team ideal | Conway's law — team per service |
| Latency | In-process calls (μs) | Network calls (ms) |
| Failure | Blast radius = entire app | Isolated per service |

**When monolith:** MVP, small team (<10), simple domain, low scale.
**When microservices:** Independent scaling needs, large teams, clear bounded contexts, mature DevOps.

### 11.4 Saga Pattern — Orchestration vs Choreography

```
Problem: Order needs Payment + Inventory + Shipping — can't use 2PC across services

CHOREOGRAPHY (event-driven, no central brain):
  OrderService    → OrderCreated event
  PaymentService  → listens → PaymentCompleted OR PaymentFailed
  InventoryService→ listens PaymentCompleted → InventoryReserved
  On PaymentFailed → OrderService listens → CancelOrder (compensate)

  Pros: loose coupling, services independent
  Cons: hard to trace, complex compensation, event cycles

ORCHESTRATION (central saga coordinator):
  SagaOrchestrator:
    step 1: PaymentService.charge()
    step 2: InventoryService.reserve()
    step 3: ShippingService.schedule()
    on any failure → run compensations in reverse order

  Pros: clear flow, easy monitoring, explicit compensation
  Cons: orchestrator dependency, must be HA

Compensating transactions:
  charge()     → compensate: refund()
  reserve()    → compensate: release()
  schedule()   → compensate: cancelShipment()
```

### 11.5 Error vs Exception in Distributed Systems

- **Error** (system-level): service crash, OOM, network partition — design for retry, circuit breaker, fallback
- **Exception** (application-level): invalid input, not found — return 4xx; business rule violation — return 422
- **Checked vs unchecked** matters in Java code; in HLD discuss HTTP status codes and idempotency instead

**Theory.** In distributed HLD, classify failures as **transient** (retry) vs **permanent** (don't retry). Transient: 503, timeout, connection reset. Permanent: 400 bad input, 404 not found, 409 conflict.

**Example.** Payment service returns 503 → order service retries 3× with exponential backoff (1s, 2s, 4s), then publishes `PaymentFailed` for manual review. Payment returns 400 invalid card → no retry, return error to user immediately.

**How it works (idempotency).** Retries cause duplicate requests. `POST /payments` with `Idempotency-Key: uuid` → server stores result keyed by UUID; duplicate POST returns same response without double-charging.

**Interview angle.** "What happens if the client times out but server succeeded?" → Idempotency keys + at-least-once delivery with deduplication on server.

---

## 12. DEEP DIVE: Booking & Concurrency Systems

### 12.1 Movie/Ticket/Seat Booking System

**Requirements:**
- Browse shows, select seats, book, pay
- No double booking (two users same seat)
- Handle 10K concurrent users during sale opening
- Seat map real-time availability

**High-Level Design:**
```
                    ┌─────────────┐
  Users ──HTTPS──►  │ API Gateway │ ──rate limit──► Booking Service
                    └─────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   Show Service      Seat Service       Payment Service
         │                 │                 │
         ▼                 ▼                 ▼
     PostgreSQL      Redis (seat lock)   Payment Gateway
```

**Concurrency strategy (layered):**
1. **API Gateway rate limiting** — token bucket per user/IP (prevent thundering herd)
2. **Redis distributed lock** — `SET seat:123:lock userId NX EX 600` (10 min hold during payment)
3. **DB pessimistic lock** — `SELECT * FROM seats WHERE id=? FOR UPDATE` inside transaction
4. **Optimistic locking** — `version` column; update fails if version changed
5. **Queue-based booking** — high demand sales: user enters queue (Kafka), processed in order

```
Booking flow:
  1. User selects seat → Redis lock (fast fail if taken)
  2. Create PENDING booking in DB (15 min expiry)
  3. User pays → Payment service
  4. Payment success → confirm booking, release lock
  5. Payment fail/timeout → release lock, seat available again
```

**Semaphore analogy (application level):** limit 100 concurrent DB transactions to protect connection pool.

**Theory.** Seat booking is a classic **compare-and-swap at scale** problem: many users compete for finite resources. No single trick is enough — you layer defenses from edge to DB.

**How it works (why layered locks).**
1. **Rate limit at gateway** — stops 100K bots from reaching booking service; humans only (~10K).
2. **Redis lock** — fast in-memory check; fails in <1 ms if seat taken (no DB hit for obvious conflicts).
3. **DB pessimistic lock** — authoritative; prevents double-book even if two Redis locks race (TTL expiry edge case).
4. **Queue (optional)** — for flash sales, serialize access so DB sees orderly 100 concurrent bookings, not 10K simultaneous.

**Example (timeline).** 10K users grab seat A1 at sale open. Gateway rate limit → 2K reach service/sec. Redis: first `SET seat:A1:lock NX` wins; 9,999 get instant "seat taken." Winner gets 10 min to pay. Payment timeout → lock expires → seat released.

**Pitfall.** Redis lock without DB validation → two users both think they hold the seat if lock expires during slow payment. Always confirm with DB transaction before marking CONFIRMED.

**Interview angle.** "Why not only DB lock?" → DB lock per seat selection under 10K concurrent users exhausts connection pool and creates lock wait chains. Redis filters 99% of conflicts before DB.

### 12.2 Stock Price Tracker — Multiple Events (Priority Queue)

**Theory.** When events arrive out of order or from multiple sources, you need a structure that always gives you the **next event to process** by timestamp or price priority.

For processing multiple buy/sell events in time order:
- **Min-heap** for buy prices (want lowest buy)
- **Max-heap** for sell prices (want highest sell)
- Or single **PriorityQueue** ordered by timestamp for event replay

**Note on order books.** In a real matching engine, **bids** (buy side) typically use a **max-heap** (highest buyer first) and **asks** (sell side) use a **min-heap** (lowest seller first). The bullets above describe generic price-sorted processing; adapt heap direction to whether you want min or max at the top for your use case.

**How it works (matching engine sketch).**
- Buy order at $100 → push to max-heap of bids (highest bid wins).
- Sell order at $99 → if best bid ≥ $99, **match** (trade executes); else push sell to min-heap of asks.
- Events with timestamps: PriorityQueue ordered by `(timestamp, sequence)` ensures deterministic replay even when two events share a timestamp.

**Example.** Events arrive: `[Buy $100, t=1], [Sell $99, t=2], [Buy $98, t=3]`.
- t=1: bid heap = {$100}.
- t=2: sell $99 ≤ best bid $100 → match at $99.5 or $100 (price-time priority rules vary).
- t=3: bid $98 — no match if lowest ask > $98.

**Interview angle.** "How do you handle events arriving out of order?" → Buffer in a priority queue keyed by event timestamp; process when watermark passes (allow small delay window) or use sequence numbers per instrument.

---

## 13. Tough Interview Q&A Bank

**Q: HTTP vs HTTPS?**
A: HTTP = plaintext over TCP port 80. HTTPS = HTTP + TLS on port 443. TLS handshake exchanges certificate, establishes symmetric session key, then encrypts all traffic. See Section 11.1.

**Q: gRPC vs REST?**
A: REST = HTTP/JSON, human-readable, browser-friendly. gRPC = HTTP/2 + Protobuf, strongly typed, streaming, faster for inter-service. SQL is not comparable — it's the database query layer.

**Q: Monolithic vs microservices?**
A: Monolith = single deploy, shared DB, simple ops. Microservices = independent deploy/scale, DB per service, distributed transactions via Saga. See Section 11.3.

**Q: Saga orchestration vs choreography?**
A: Choreography = event-driven, decentralized. Orchestration = central coordinator with explicit compensation. See Section 11.4.

**Q: How to prevent double booking?**
A: Redis distributed lock + DB pessimistic/optimistic lock + idempotent booking API + payment timeout release.

**Q: CAP theorem?**
A: In partition, choose Consistency (CP) or Availability (AP). CA only without partition.

**Q: Strong vs eventual consistency?**
A: Strong = read always latest write (banking). Eventual = replicas converge (social feeds).

**Q: Cache invalidation strategies?**
A: TTL, write-through, write-behind, cache-aside (lazy load + invalidate on update).

**Q: Rate limiting algorithms?**
A: Token bucket (burst allowed), leaky bucket (smooth rate), fixed/sliding window.

**Q: How does consistent hashing help?**
A: Adding/removing servers only remaps K/n keys (not all keys). Used in distributed caches, load balancers.

---

## 14. System Design Interview Problems

### 14.1 Design an E-Commerce Order Tracking System

**Requirements:** Track order from placement → payment → shipped → delivered. Real-time status for users. 10M orders/day. Read-heavy.

**Estimation.**
- **Write QPS:** 10M / 86,400 ≈ **116 orders/sec** (creates + status updates maybe 3× → ~350 writes/sec peak).
- **Read QPS:** Assume each order checked 5× during lifecycle, 10M active orders/day viewed → ~**580 reads/sec** average; peak 3× ≈ **1,750 reads/sec**.
- **Storage:** 10M orders/day × 365 × 500 bytes/order row ≈ **1.8 TB/year** for orders table; event log similar — partition/archive after 1 year.

**High-Level Design:**
```
User/App ──► API Gateway ──► Order Tracking Service
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              Order DB         Event Store       Notification
            (PostgreSQL)      (Kafka)           (Email/Push/SMS)
                    │               │
                    └───────► Cache (Redis) ◄── status lookups
```

**Data model:**
```
orders(id, user_id, status, created_at)
order_events(id, order_id, status, timestamp, metadata JSON)
  statuses: PLACED → PAID → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
```

**Flow:**
1. Order placed → write to `orders` + publish `OrderPlaced` to Kafka
2. Each service (payment, warehouse, shipping) publishes status events
3. Tracking service consumes events → updates `order_events` + `orders.status`
4. User polls `GET /orders/{id}/tracking` → cache in Redis (TTL 30s)

**Scale:** Read replicas for DB; Redis cache hot orders; WebSocket/SSE for live updates on tracking page.

**APIs:**
```
GET  /api/orders/{id}/tracking     → timeline of events
GET  /api/orders/{id}/status       → current status only
POST /api/orders/{id}/events       → internal (from shipping service)
```

---

### 14.2 Design a Rate Limiter

**Requirements:** Limit API to N requests per user per minute. Distributed (multiple API servers). Low latency.

**Algorithms:**

| Algorithm | How | Burst? |
|-----------|-----|--------|
| **Token bucket** | Tokens refill at fixed rate; request consumes 1 token | Yes (bucket capacity) |
| **Leaky bucket** | Requests queue, processed at fixed rate | No |
| **Fixed window** | Count requests per minute window | Boundary spike at window edge |
| **Sliding window** | Count in rolling last 60 seconds | Smoother |

**Recommended:** Token bucket or sliding window log in **Redis**.

```
Token Bucket (Redis):
  key = rate_limit:{userId}
  tokens = GET key
  if tokens > 0: DECR key; allow
  else: 429 Too Many Requests

Sliding window (Redis sorted set):
  ZADD key timestamp requestId
  ZREMRANGEBYSCORE key 0 (now - 60s)
  if ZCARD key > limit: reject
```

**Architecture:**
```
Client → API Gateway (rate limit here) → Services
              │
              ▼
           Redis cluster (shared counter state)
```

**Where to enforce:** API Gateway (Kong, NGINX, Spring Cloud Gateway) or sidecar. Return `429` + `Retry-After` header.

**Follow-up:** Rate limit per IP vs per API key vs per user tier (free=100/min, premium=1000/min).

---

### 14.3 Design a URL Shortener (like bit.ly)

**Requirements:** Shorten long URL; redirect; 100M URLs; 10:1 read/write ratio; custom aliases optional.

**APIs:**
```
POST /api/shorten   { "longUrl": "https://..." }  → { "shortUrl": "https://abc.ly/x7K2m" }
GET  /{shortCode}   → 301/302 redirect to long URL
GET  /api/stats/{code} → click count
```

**Design:**
```
                    ┌─────────────┐
Client ───────────► │ API Servers │ ──write──► PostgreSQL (url_mappings)
                    └──────┬──────┘
                           │ read (hot)
                           ▼
                    ┌─────────────┐
                    │ Redis Cache │  shortCode → longUrl
                    └─────────────┘
```

**Short code generation:**
- **Base62** encode auto-increment ID (a-zA-Z0-9) → 7 chars = 62^7 URLs
- Or **hash** long URL + collision check
- Custom alias: check uniqueness in DB

**DB schema:**
```sql
url_mappings(id BIGSERIAL PK, short_code VARCHAR(10) UNIQUE, long_url TEXT, user_id, created_at, expires_at)
click_analytics(short_code, clicked_at, ip, user_agent)  -- async via Kafka
```

**Redirect:** Use **301** (permanent, cached by browser) or **302** (track every click — most shorteners use 302 for analytics).

**Scale:** Redis cache 80/20 hot URLs; DB sharding by `short_code` hash; CDN for redirect edge.

---

### 14.4 Design a Distributed Key-Value Store (like Redis)

**Requirements:** `GET`/`PUT`/`DELETE` by key; high throughput; replication; eventual consistency OK for some use cases.

**Core components:**
```
Client ──► Coordinator / Proxy ──► Partition nodes (shards)
                                         │
                              Replication (primary + replicas)
```

**Partitioning:** **Consistent hashing** — key → hash ring → responsible node. Virtual nodes for even distribution.

**Replication:** Primary-replica per partition. Writes to primary → async replicate. Read from replica (eventual consistency) or primary (strong).

**Data structures on disk:** Redis uses in-memory + optional AOF/RDB persistence. For disk-based KV: LSM tree (RocksDB) or B-tree.

**CAP trade-off:** AP for cache (availability + partition tolerance); CP variant for strong consistency (Raft consensus per shard — like etcd).

**Operations:**
```
PUT(key, value, ttl)  → hash(key) → primary node → replicate
GET(key)                → hash(key) → replica or primary
DELETE(key)             → tombstone marker (replicated)
```

**Failure handling:** Primary dies → replica promoted (leader election). Hinted handoff during temporary node failure.

**Not building Redis from scratch in 45 min** — explain: in-memory hash table + single-threaded event loop + optional persistence + cluster mode with hash slots (16384 slots).

---

### 14.5 Design a User Authentication System

**Requirements:** Register, login, logout; secure password storage; session or JWT; OAuth social login; 10M users.

**Architecture:**
```
Client ──► Auth Service ──► User DB (PostgreSQL)
              │                    │
              ├──► Redis (sessions / token blacklist)
              └──► Email service (verification)
```

**Registration flow:**
1. `POST /register` → hash password (**bcrypt/Argon2**, never plain text)
2. Store user + `email_verified=false`
3. Send verification email with signed token
4. `GET /verify?token=...` → set `email_verified=true`

**Login flow (JWT):**
1. `POST /login` { email, password }
2. Verify bcrypt hash
3. Issue **access token** (15 min) + **refresh token** (7 days, stored in DB/Redis)
4. Client sends `Authorization: Bearer <access>`
5. On expiry → `POST /refresh` with refresh token → new access token

**Login flow (Session):**
1. Validate credentials → create session ID → store in Redis
2. Set `httpOnly` secure cookie
3. Each request: validate session ID in Redis

**OAuth2 social login:**
```
User → "Login with Google" → redirect to Google → callback with auth code
→ Auth service exchanges code for Google token → get email → find/create user → issue JWT
```

**Security checklist:**
- bcrypt passwords (cost factor 12+)
- HTTPS only
- Rate limit login (brute force protection)
- MFA optional (TOTP)
- Refresh token rotation
- Token blacklist on logout (Redis)
- CSRF protection for cookie sessions

**DB schema:**
```sql
users(id, email UNIQUE, password_hash, email_verified, created_at)
refresh_tokens(id, user_id, token_hash, expires_at, revoked)
```
