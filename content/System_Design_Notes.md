# System Design Notes

---

## 1. URL Shortener (like bit.ly, tinyurl)

### What It Does
● Converts a long URL into a short, unique alias (e.g., `https://short.ly/aB3xK9`) that redirects users to the original URL.
● Read-heavy system — for every 1 URL shortened, there are ~100 redirect requests.

---

### Functional Requirements
● Given a long URL, generate a unique short URL.
● When a user hits the short URL, redirect them to the original long URL.
● Short links should expire after a configurable time (optional).
● Users can optionally pick a custom short alias.
● Track click analytics (click count, timestamp, location).

### Non-Functional Requirements
● Low latency — redirect should happen in milliseconds.
● High availability — the service should be up 99.99%.
● Short codes should not be predictable (for security).
● System should handle billions of URLs.

---

### Capacity Estimation
● New URLs created per day: ~100 Million (writes)
● Redirects per day: ~10 Billion (reads)
● Read:Write ratio: 100:1
● QPS (writes): 100M / 86400 ≈ 1,200/sec
● QPS (reads): 10B / 86400 ≈ 120,000/sec
● Storage per record: ~500 bytes (short code + long URL + metadata)
● Storage for 5 years: 100M × 365 × 5 × 500B ≈ 90 TB
● Short code length: 7 characters (base62) → 62^7 = 3.5 trillion unique codes

---

### HLD (High-Level Design)

```
Client → Load Balancer → App Servers (Spring Boot) → Cache (Redis) → Database (MySQL/Postgres)
```

● **Load Balancer** — Distributes traffic across multiple app server instances.
● **App Servers** — Stateless Spring Boot services handling shorten and redirect APIs.
● **Cache (Redis)** — Stores frequently accessed short-code-to-URL mappings. Since reads are 100x writes, caching is critical.
● **Database (MySQL/Cassandra)** — Persistent storage for all URL mappings.
● **Key Generation Service (KGS)** — (Optional) Pre-generates unique short codes in batches. App servers request a code from KGS instead of computing one at runtime. Eliminates collision handling.

#### Architecture Diagram
```
                        ┌──────────────┐
    User ──────────►    │ Load Balancer │
                        └──────┬───────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
         ┌──────▼──────┐ ┌────▼────┐ ┌───────▼─────┐
         │ App Server 1 │ │ App 2   │ │ App Server N│
         │ (Spring Boot)│ │         │ │             │
         └──────┬───────┘ └────┬────┘ └──────┬──────┘
                │              │             │
         ┌──────▼──────────────▼─────────────▼──────┐
         │                  Redis Cache              │
         │          (short_code → long_url)          │
         └─────────────────────┬────────────────────┘
                               │ (cache miss)
         ┌─────────────────────▼────────────────────┐
         │           Database (MySQL/Cassandra)       │
         │           url_mapping table                │
         └────────────────────────────────────────────┘
```

---

### LLD (Low-Level Design)

#### API Design
```
POST /api/shorten
  Request:  { "long_url": "https://example.com/very/long/path", "custom_alias": "mylink" (optional), "expiry_days": 30 (optional) }
  Response: { "short_url": "https://short.ly/aB3xK9", "expires_at": "2026-04-17T00:00:00Z" }
  Status:   201 Created

GET /{shortCode}
  Response: 302 Redirect → Location: https://example.com/very/long/path
  Status:   302 Found (or 301 Moved Permanently)
  Error:    404 Not Found (if code doesn't exist or expired)
```

#### Database Schema
```sql
CREATE TABLE url_mapping (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    short_code  VARCHAR(10) UNIQUE NOT NULL,
    long_url    TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at  TIMESTAMP NULL,
    click_count BIGINT DEFAULT 0,
    user_id     BIGINT NULL
);

CREATE INDEX idx_short_code ON url_mapping(short_code);
CREATE INDEX idx_expires_at ON url_mapping(expires_at);
```

#### Short Code Generation Approaches

| Approach | How It Works | Pros | Cons |
|----------|-------------|------|------|
| Base62 Encoding | Convert auto-increment ID to base62 (a-z, A-Z, 0-9) | Simple, zero collisions | Predictable/sequential |
| MD5/SHA256 Hashing | Hash the long URL, take first 7 chars | Deterministic (same URL = same code) | Collisions possible |
| Pre-generated Keys (KGS) | Generate random keys in advance, assign on demand | Fast, no collision at runtime | Needs separate key service |
| UUID-based | Generate UUID, encode to short string | Globally unique | Longer codes |

#### Collision Handling (if using hashing)
```java
int salt = 0;
String shortCode = base62(hash(longUrl)).substring(0, 7);
while (db.exists(shortCode)) {
    salt++;
    shortCode = base62(hash(longUrl + salt)).substring(0, 7);
}
```
● Append an incrementing salt to the URL, re-hash until a unique code is found.
● In practice, collisions are rare with 7-char base62 (3.5 trillion combinations).

#### Class Diagram
```
┌──────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│  UrlController    │────►│  UrlService          │────►│  UrlRepository   │
│  (REST layer)     │     │  (Business logic)    │     │  (Data access)   │
├──────────────────┤     ├────────────────────┤     ├──────────────────┤
│ + shorten()       │     │ + createShortUrl()   │     │ + save()         │
│ + redirect()      │     │ + getOriginalUrl()   │     │ + findByCode()   │
└──────────────────┘     │ + isExpired()        │     │ + existsByCode() │
                          └─────────┬──────────┘     └──────────────────┘
                                    │
                          ┌─────────▼──────────┐
                          │ CodeGenerator       │  ← Interface (Strategy Pattern)
                          ├────────────────────┤
                          │ + generate(): String│
                          └─────────┬──────────┘
                                    │
                     ┌──────────────┼──────────────┐
                     │              │              │
              ┌──────▼───┐  ┌──────▼─────┐  ┌────▼────────┐
              │ Base62Gen │  │ HashBasedGen│  │ UUIDGen     │
              └──────────┘  └────────────┘  └─────────────┘
```

#### Design Patterns Used
● **Strategy Pattern** — `CodeGenerator` interface with swappable implementations (Base62, Hash, UUID).
● **Repository Pattern** — `UrlRepository` abstracts database access from service logic.
● **Cache-Aside Pattern** — Check Redis first, fallback to DB on cache miss, populate cache after DB read.
● **Builder Pattern** — For constructing `UrlMapping` objects with optional fields (expiry, custom alias).

#### Core Service Logic
```java
@Service
public class UrlService {

    private final UrlRepository repo;
    private final CodeGenerator codeGenerator;
    private final RedisTemplate<String, String> cache;

    public String createShortUrl(String longUrl) {
        if (!isValidUrl(longUrl)) throw new InvalidUrlException(longUrl);

        Optional<UrlMapping> existing = repo.findByLongUrl(longUrl);
        if (existing.isPresent()) return existing.get().getShortCode();

        String code;
        do {
            code = codeGenerator.generate();
        } while (repo.existsByShortCode(code));

        repo.save(new UrlMapping(code, longUrl));
        cache.opsForValue().set(code, longUrl, 24, TimeUnit.HOURS);
        return code;
    }

    public String getOriginalUrl(String shortCode) {
        String cached = cache.opsForValue().get(shortCode);
        if (cached != null) return cached;

        UrlMapping mapping = repo.findByShortCode(shortCode)
            .orElseThrow(() -> new UrlNotFoundException(shortCode));

        if (mapping.isExpired()) throw new UrlExpiredException(shortCode);

        cache.opsForValue().set(shortCode, mapping.getLongUrl(), 24, TimeUnit.HOURS);
        repo.incrementClickCount(shortCode);
        return mapping.getLongUrl();
    }
}
```

#### 301 vs 302 Redirect
● **301 (Moved Permanently)** — Browser caches the redirect. Faster for users, but you lose analytics on repeat visits because the browser won't hit your server again.
● **302 (Found/Temporary)** — Browser always hits your server first. Better for tracking click counts and analytics. Most URL shorteners use 302.

---

### Scaling Considerations
● **Database Sharding** — Shard by first character of short code or hash-based sharding. Distributes data across multiple DB instances.
● **Cache Eviction** — Use LRU (Least Recently Used) policy in Redis. Most URLs follow a power-law distribution — a few URLs get most of the traffic.
● **Read Replicas** — Since reads >> writes, use MySQL read replicas for redirect queries.
● **CDN** — For global users, put redirect endpoints behind a CDN for geographic caching.
● **Cleanup Job** — Run a scheduled batch job to delete expired URLs and reclaim storage.

---

### Common Interview Follow-ups
● **How to prevent abuse?** — Rate limiting per user/IP (see Rate Limiter section below).
● **How to handle custom aliases?** — Check uniqueness before saving; reject if already taken.
● **How to track analytics?** — Publish click events to Kafka asynchronously, aggregate with a batch job.
● **How to ensure uniqueness across distributed servers?** — Use a Key Generation Service (KGS) or Twitter Snowflake for distributed ID generation.
● **How to handle expiry?** — Check `expires_at` on read; run a cron job to purge expired rows.

---
---

## 2. Rate Limiter

### What It Does
● Controls the number of requests a client can make to an API within a given time window.
● Protects backend services from being overwhelmed by too many requests (DDoS attacks, bots, misbehaving clients).
● Returns HTTP `429 Too Many Requests` when the limit is exceeded.

---

### Functional Requirements
● Limit the number of API requests per client (identified by user ID, API key, or IP address).
● Support different rate limits for different APIs or user tiers (e.g., free: 100 req/min, premium: 1000 req/min).
● Return a clear response (429) with headers indicating remaining quota and retry-after time.
● The limiter should work in a distributed environment (multiple app server instances).

### Non-Functional Requirements
● Low latency — rate check must add minimal overhead (< 1ms).
● High availability — if the rate limiter goes down, it should fail open (allow requests) rather than block everything.
● Accurate — should not allow significantly more requests than the configured limit.
● Scalable — should handle millions of users and billions of requests.

---

### Where to Place the Rate Limiter

```
Option 1: Client-side       → Easy to bypass, not reliable
Option 2: Server-side       → Inside the app (middleware/filter)
Option 3: API Gateway       → Best for microservices (Kong, Nginx, AWS API Gateway)
Option 4: Dedicated service → Separate rate limiter service (Redis-based)
```

● Most common in interviews: **Server-side middleware** or **API Gateway** with a **Redis backend**.

---

### Rate Limiting Algorithms

#### Algorithm 1: Fixed Window Counter
```
● Divide time into fixed windows (e.g., 1-minute intervals).
● Maintain a counter per client per window.
● If counter > limit → reject (429).
● Reset counter when the window expires.

Example: Limit = 5 requests/minute
  Window: 10:00:00 – 10:00:59
  Request 1 → counter = 1 ✓
  Request 2 → counter = 2 ✓
  ...
  Request 5 → counter = 5 ✓
  Request 6 → counter = 6 ✗ (429 Too Many Requests)
  10:01:00 → counter resets to 0

Pros: Simple, low memory.
Cons: Burst at window boundary — a user can send 5 requests at 10:00:59
      and 5 more at 10:01:00 = 10 requests in 2 seconds.
```

#### Algorithm 2: Sliding Window Log
```
● Store the timestamp of every request in a sorted set (per client).
● On each request, remove all timestamps older than the window.
● Count remaining entries — if count > limit → reject.

Example: Limit = 5 requests/minute
  Timestamps: [10:00:10, 10:00:20, 10:00:30, 10:00:40, 10:00:50]
  New request at 10:01:05:
    Remove entries before 10:00:05 → [10:00:10, 10:00:20, 10:00:30, 10:00:40, 10:00:50]
    Count = 5 → REJECT (429)

Pros: Very accurate, no boundary burst issue.
Cons: High memory — stores every timestamp.
```

#### Algorithm 3: Sliding Window Counter (Hybrid)
```
● Combines Fixed Window + Sliding Window.
● Uses counters from the current window and previous window.
● Weighted formula: count = (prev_window_count × overlap%) + current_window_count

Example: Limit = 10 requests/minute
  Previous window (10:00 - 10:01): 8 requests
  Current window  (10:01 - 10:02): 3 requests
  Request arrives at 10:01:40 → 40 seconds into current window
  Overlap with previous = 1 - (40/60) = 33%
  Weighted count = (8 × 0.33) + 3 = 2.64 + 3 = 5.64 → ALLOW (< 10)

Pros: Accurate + low memory (only 2 counters per client).
Cons: Approximate (not 100% precise, but close enough).
```

#### Algorithm 4: Token Bucket (Most Popular)
```
● Each client has a bucket that holds tokens (max = bucket size).
● Tokens are added at a fixed rate (e.g., 10 tokens/second).
● Each request consumes 1 token.
● If bucket is empty → reject (429).
● Allows short bursts up to the bucket size.

Example: Bucket size = 10, Refill rate = 2 tokens/sec
  t=0: bucket = 10
  5 requests arrive → bucket = 5 ✓
  t=1: 2 tokens added → bucket = 7
  3 requests arrive → bucket = 4 ✓
  t=2: 2 tokens added → bucket = 6
  ...
  If 10 rapid requests → bucket = 0 → next request = 429

Pros: Allows controlled bursts, smooth rate limiting.
Cons: Two parameters to tune (bucket size + refill rate).
```

#### Algorithm 5: Leaky Bucket
```
● Requests enter a queue (bucket) of fixed size.
● Requests are processed at a fixed rate (constant outflow).
● If queue is full → reject (429).
● Shapes traffic into a smooth, constant rate.

Example: Queue size = 5, Process rate = 1 req/sec
  3 requests arrive at once → queue = [R1, R2, R3]
  R1 processed at t=0, R2 at t=1, R3 at t=2
  If queue is full and new request arrives → 429

Pros: Smooth, constant output rate.
Cons: Does not allow bursts (even legitimate ones). Old requests can starve if queue is always full.
```

#### Algorithm Comparison

| Algorithm | Accuracy | Memory | Burst Handling | Complexity |
|-----------|----------|--------|---------------|------------|
| Fixed Window | Low (boundary burst) | Very Low | Poor | Simple |
| Sliding Window Log | Very High | High | Good | Medium |
| Sliding Window Counter | High | Low | Good | Medium |
| Token Bucket | High | Low | Good (controlled) | Medium |
| Leaky Bucket | High | Low | No bursts allowed | Medium |

● **Interview recommendation:** Token Bucket or Sliding Window Counter — both are practical and commonly used in production.

---

### HLD (High-Level Design)

```
Client → API Gateway / Load Balancer → Rate Limiter Middleware → App Server → Database
                                              │
                                        ┌─────▼─────┐
                                        │   Redis    │
                                        │ (counters/ │
                                        │  tokens)   │
                                        └────────────┘
```

● **Redis** is the central store for rate limit counters/tokens across all app server instances.
● Rate limiter runs as a **filter/interceptor** before the request reaches the controller.
● If limit exceeded, return `429` immediately without hitting the backend.

#### Architecture Diagram
```
                        ┌──────────────┐
     Client ────────►   │  API Gateway  │
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │ Rate Limiter  │──────► Redis
                        │  (Filter)     │       (per-client counters)
                        └──────┬───────┘
                               │ (allowed)
                        ┌──────▼───────┐
                        │  App Server   │
                        │ (Controller)  │
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │   Database    │
                        └──────────────┘
```

---

### LLD (Low-Level Design)

#### API Response Headers
```
HTTP/1.1 200 OK
X-RateLimit-Limit: 100              ← max requests allowed in window
X-RateLimit-Remaining: 42           ← requests remaining
X-RateLimit-Reset: 1679012400       ← Unix timestamp when the window resets

HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1679012400
Retry-After: 30                      ← seconds to wait before retrying
Content-Type: application/json
{ "error": "Rate limit exceeded. Try again in 30 seconds." }
```

#### Database/Redis Schema

**Rate Limit Rules (MySQL — for configuration)**
```sql
CREATE TABLE rate_limit_rules (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    api_path    VARCHAR(255) NOT NULL,
    user_tier   VARCHAR(50) DEFAULT 'FREE',
    max_requests INT NOT NULL,
    window_seconds INT NOT NULL
);

-- Example rules
INSERT INTO rate_limit_rules VALUES (1, '/api/shorten', 'FREE', 100, 60);
INSERT INTO rate_limit_rules VALUES (2, '/api/shorten', 'PREMIUM', 1000, 60);
INSERT INTO rate_limit_rules VALUES (3, '/api/*', 'FREE', 500, 3600);
```

**Redis Keys (for runtime counters)**
```
Token Bucket:
  Key:   rate_limit:{client_id}:{api_path}
  Value: { "tokens": 8, "last_refill": 1679012345 }
  TTL:   window size (auto-cleanup)

Fixed Window:
  Key:   rate_limit:{client_id}:{api_path}:{window_timestamp}
  Value: 42  (request count)
  TTL:   window size
```

#### Class Diagram
```
┌──────────────────────┐
│  RateLimiterFilter    │  ← Spring Filter / Interceptor
│  (Entry point)        │
├──────────────────────┤
│ + doFilter(request)   │
└──────────┬───────────┘
           │
┌──────────▼───────────┐     ┌───────────────────────┐
│  RateLimiterService   │────►│  RateLimitRuleRepo     │
│  (Orchestration)      │     │  (Load rules from DB)  │
├──────────────────────┤     └───────────────────────┘
│ + isAllowed(clientId) │
│ + getRemainingQuota() │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│  RateLimitStrategy    │  ← Interface (Strategy Pattern)
├──────────────────────┤
│ + tryConsume(key): bool│
│ + getRemaining(key)   │
└──────────┬───────────┘
           │
    ┌──────┼──────────┬────────────────┐
    │      │          │                │
┌───▼────┐ ┌▼────────┐ ┌▼──────────┐ ┌─▼───────────┐
│Token   │ │Sliding  │ │Fixed      │ │Leaky        │
│Bucket  │ │Window   │ │Window     │ │Bucket       │
│Strategy│ │Strategy │ │Strategy   │ │Strategy     │
└────────┘ └─────────┘ └───────────┘ └─────────────┘
    All use Redis (RedisTemplate) as the backing store
```

#### Design Patterns Used
● **Strategy Pattern** — `RateLimitStrategy` interface with multiple algorithm implementations. Swap Token Bucket for Sliding Window without changing any other code.
● **Filter/Interceptor Pattern** — `RateLimiterFilter` intercepts requests before they reach controllers.
● **Factory Pattern** — `RateLimitStrategyFactory` creates the correct strategy based on configuration.
● **Cache-Aside Pattern** — Rate limit rules loaded from DB and cached in-memory with periodic refresh.

#### Token Bucket Implementation (Redis + Lua)
```java
@Component
public class TokenBucketStrategy implements RateLimitStrategy {

    private final RedisTemplate<String, String> redis;

    private static final String LUA_SCRIPT = """
        local key = KEYS[1]
        local max_tokens = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])

        local data = redis.call('HMGET', key, 'tokens', 'last_refill')
        local tokens = tonumber(data[1]) or max_tokens
        local last_refill = tonumber(data[2]) or now

        -- Calculate tokens to add based on elapsed time
        local elapsed = now - last_refill
        tokens = math.min(max_tokens, tokens + (elapsed * refill_rate))

        if tokens >= 1 then
            tokens = tokens - 1
            redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
            redis.call('EXPIRE', key, math.ceil(max_tokens / refill_rate) * 2)
            return {1, tokens}  -- allowed, remaining
        else
            return {0, 0}       -- rejected, 0 remaining
        end
    """;

    public RateLimitResult tryConsume(String clientId, String apiPath, int maxTokens, int refillRate) {
        String key = "rate_limit:" + clientId + ":" + apiPath;
        long now = Instant.now().getEpochSecond();

        List<Long> result = redis.execute(
            RedisScript.of(LUA_SCRIPT, List.class),
            List.of(key), String.valueOf(maxTokens), String.valueOf(refillRate), String.valueOf(now)
        );

        boolean allowed = result.get(0) == 1;
        long remaining = result.get(1);
        return new RateLimitResult(allowed, remaining);
    }
}
```
● **Why Lua script?** — Redis executes Lua atomically. Without it, a race condition can occur: two requests read the same token count simultaneously, both think there's 1 token left, and both pass — exceeding the limit.

#### Spring Boot Filter
```java
@Component
@Order(1)
public class RateLimiterFilter extends OncePerRequestFilter {

    private final RateLimiterService rateLimiterService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain) throws ServletException, IOException {

        String clientId = extractClientId(request);  // from API key, JWT, or IP
        String apiPath = request.getRequestURI();

        RateLimitResult result = rateLimiterService.checkLimit(clientId, apiPath);

        response.setHeader("X-RateLimit-Limit", String.valueOf(result.getLimit()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.getRemaining()));
        response.setHeader("X-RateLimit-Reset", String.valueOf(result.getResetTimestamp()));

        if (!result.isAllowed()) {
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(result.getRetryAfterSeconds()));
            response.getWriter().write("{\"error\": \"Rate limit exceeded\"}");
            return;
        }

        chain.doFilter(request, response);  // allowed — proceed to controller
    }

    private String extractClientId(HttpServletRequest request) {
        String apiKey = request.getHeader("X-API-Key");
        if (apiKey != null) return apiKey;
        return request.getRemoteAddr();  // fallback to IP
    }
}
```

---

### Scaling Considerations
● **Redis Cluster** — For millions of clients, use Redis Cluster to shard rate limit keys across nodes.
● **Local + Global Limiting** — Use an in-memory counter per app server (local) + Redis (global). Local counter acts as a fast first check, reducing Redis calls.
● **Fail-Open Policy** — If Redis is unreachable, allow requests through rather than blocking all traffic. Availability > strict rate enforcement.
● **Race Conditions** — Always use Redis Lua scripts or MULTI/EXEC for atomic read-check-update operations.
● **Distributed Sync** — In a multi-datacenter setup, each datacenter can maintain its own Redis and sync periodically, accepting slight over-limit tolerance.

---

### Common Interview Follow-ups
● **How to identify the client?** — API key (best), JWT/user ID (authenticated), IP address (fallback, unreliable behind NAT).
● **What if Redis goes down?** — Fail open (allow all) or use local in-memory fallback with degraded accuracy.
● **How to handle different limits for different APIs?** — Store rules in DB per API path and user tier, cache in-memory.
● **How does an API Gateway handle it?** — Kong, Nginx, AWS API Gateway have built-in rate limiting with Redis backends.
● **Token Bucket vs Leaky Bucket?** — Token Bucket allows bursts (good for real traffic patterns), Leaky Bucket enforces constant rate (good for protecting downstream services).
● **How to rate limit by IP when users are behind a proxy?** — Use `X-Forwarded-For` header, but be careful — it can be spoofed.

---
---

## 3. System Design Foundations (Must-Know Concepts)

### 3.1 CAP Theorem

● In a **distributed system**, you can only guarantee **two out of three** properties simultaneously:

```
C — Consistency    : Every read receives the most recent write (all nodes see the same data at the same time)
A — Availability   : Every request receives a response (no timeouts), even if it's not the latest data
P — Partition       : The system continues to operate even when network communication between nodes fails
    Tolerance
```

● **Partition Tolerance is NOT optional** in real distributed systems — networks WILL fail. So the real choice is between **CP** and **AP**.

| Choice | Behavior During Network Partition | Example Systems |
|--------|-----------------------------------|-----------------|
| **CP** (Consistency + Partition Tolerance) | System may reject requests to maintain consistency. Returns error rather than stale data. | MongoDB, HBase, Redis (single master), ZooKeeper, Bank transaction systems |
| **AP** (Availability + Partition Tolerance) | System always responds, but may return stale/inconsistent data. | Cassandra, DynamoDB, CouchDB, DNS |
| **CA** (Consistency + Availability) | Only possible if there are NO network partitions (single node). Not practical in distributed systems. | Traditional single-node RDBMS (MySQL on one server) |

● **JP Morgan context:** Financial systems almost always choose **CP** — you cannot show a wrong account balance or process a duplicate transaction. Availability is handled through redundancy, not by relaxing consistency.

---

### 3.2 ACID vs BASE

**ACID (Traditional RDBMS — Strong Consistency)**
```
A — Atomicity     : All operations in a transaction succeed or all fail (no partial writes)
C — Consistency   : Transaction moves DB from one valid state to another (constraints are maintained)
I — Isolation     : Concurrent transactions don't interfere with each other
D — Durability    : Once committed, data survives crashes (written to disk)
```

**BASE (NoSQL / Distributed Systems — Eventual Consistency)**
```
BA — Basically Available : System guarantees availability (may return stale data)
S  — Soft State          : State may change over time even without input (due to async replication)
E  — Eventually          : Given enough time with no new updates, all replicas converge
     Consistent            to the same value
```

| Property | ACID | BASE |
|----------|------|------|
| Consistency | Strong (immediate) | Eventual |
| Use Case | Banking, payments, orders | Social media feeds, analytics, caching |
| Performance | Slower (locks, coordination) | Faster (no coordination overhead) |
| Examples | MySQL, PostgreSQL, Oracle | Cassandra, DynamoDB, MongoDB |

● **JP Morgan context:** Core banking, payments, and trading systems use ACID. Analytics, logging, and notification systems can use BASE.

---

### 3.3 Consistent Hashing

● **Problem:** In a distributed cache/DB with N nodes, if you use `hash(key) % N` to route requests, adding or removing a node causes almost ALL keys to be remapped — massive cache miss storm.

● **Solution:** Consistent hashing maps both keys and nodes onto a virtual ring (0 to 2^32). A key is assigned to the first node clockwise from its position.

```
                    Node A (pos 50)
                   /
        ──────────●───────────
       /                       \
      /     Key X (pos 30)      \
     /       maps to → Node A    \
    ●                             ●  Node B (pos 150)
    Node D                       /
    (pos 300)                   /
     \                         /
      \     Key Y (pos 200)   /
       \    maps to → Node D /
        ──────────●──────────
                  Node C (pos 250)
```

● **When a node is added/removed**, only keys between the removed node and its predecessor are remapped — typically only `K/N` keys (where K = total keys, N = total nodes), not all keys.

● **Virtual Nodes:** Each physical node gets multiple positions on the ring (e.g., Node A → A1, A2, A3). This ensures even distribution even with few nodes.

● **Used in:** Amazon DynamoDB, Apache Cassandra, Memcached, Content Delivery Networks (CDNs).

---

### 3.4 Database Sharding

● **Sharding** = splitting a large database across multiple servers (shards), each holding a subset of the data.

#### Sharding Strategies

| Strategy | How It Works | Pros | Cons |
|----------|-------------|------|------|
| **Range-based** | Shard by value range (e.g., user_id 1-1M → Shard 1, 1M-2M → Shard 2) | Simple, range queries efficient | Hotspot risk (one shard gets more traffic) |
| **Hash-based** | `hash(shard_key) % num_shards` | Even distribution | Range queries require hitting all shards |
| **Directory-based** | Lookup table maps each key to its shard | Flexible | Lookup table is a single point of failure |
| **Geographic** | Shard by region (US → Shard 1, EU → Shard 2) | Low latency for regional users | Cross-region queries are slow |

#### Problems with Sharding
● **Joins across shards** — Not possible. Must denormalize data or do application-level joins.
● **Resharding** — Adding a new shard requires data migration. Consistent hashing helps.
● **Celebrity/Hotspot problem** — One shard gets disproportionate traffic. Solution: further split that shard or use consistent hashing with virtual nodes.
● **Distributed transactions** — ACID across shards requires 2-Phase Commit (2PC) or Saga pattern.

---

### 3.5 Database Replication

```
Master-Slave (Primary-Replica):
  ┌────────┐    writes    ┌────────┐
  │ Master │──────────────│ Master │  (single write node)
  └───┬────┘              └────────┘
      │ replication (async/sync)
  ┌───▼────┐  ┌─────────┐  ┌─────────┐
  │ Slave 1 │  │ Slave 2 │  │ Slave 3 │   (read-only replicas)
  └─────────┘  └─────────┘  └─────────┘
```

● **Sync replication** — Master waits for at least one replica to confirm write. Slower but consistent.
● **Async replication** — Master doesn't wait. Faster but risk of data loss if master crashes before replication.

| Type | Consistency | Latency | Use Case |
|------|------------|---------|----------|
| Synchronous | Strong | Higher | Banking, payments |
| Asynchronous | Eventual | Lower | Analytics, read-heavy apps |
| Semi-synchronous | Middle ground | Medium | Most production systems |

---

### 3.6 Load Balancing Algorithms

| Algorithm | How It Works | Best For |
|-----------|-------------|----------|
| **Round Robin** | Distribute requests sequentially (1→2→3→1→2→3) | All servers have equal capacity |
| **Weighted Round Robin** | Higher-capacity servers get more requests | Servers with different specs |
| **Least Connections** | Route to the server with fewest active connections | Long-lived connections (WebSocket) |
| **IP Hash** | Hash client IP to determine server (sticky sessions) | Stateful applications |
| **Random** | Pick a random server | Simple, surprisingly effective |
| **Least Response Time** | Route to the server with lowest avg response time | Latency-sensitive applications |

● **Layer 4 (Transport)** — Routes based on IP/TCP (fast, no content inspection). Example: AWS NLB.
● **Layer 7 (Application)** — Routes based on HTTP headers, URL path, cookies (smarter, slower). Example: AWS ALB, Nginx.

---

### 3.7 Caching Strategies

| Strategy | Flow | Use Case |
|----------|------|----------|
| **Cache-Aside (Lazy Loading)** | App checks cache → miss → read DB → populate cache | General purpose, most common |
| **Read-Through** | Cache itself fetches from DB on miss | Simplifies app code |
| **Write-Through** | Write to cache AND DB simultaneously | Strong consistency, slower writes |
| **Write-Behind (Write-Back)** | Write to cache first, async flush to DB | Fast writes, risk of data loss |
| **Write-Around** | Write directly to DB, skip cache | Infrequent reads after write |

#### Cache Eviction Policies
● **LRU (Least Recently Used)** — Evict the item that hasn't been accessed for the longest time. Most common.
● **LFU (Least Frequently Used)** — Evict the item with the fewest access counts.
● **FIFO (First In First Out)** — Evict the oldest item.
● **TTL (Time To Live)** — Evict after a fixed time, regardless of access pattern.

#### Cache Problems
● **Cache Stampede** — Many requests for the same expired key hit DB simultaneously. Solution: lock/mutex, probabilistic early expiry.
● **Cache Penetration** — Requests for non-existent keys always miss cache and hit DB. Solution: cache null results, Bloom filter.
● **Cache Avalanche** — Many keys expire at the same time, overwhelming DB. Solution: add random jitter to TTL.

---

### 3.8 SQL vs NoSQL — When to Use What

| Criteria | SQL (Relational) | NoSQL |
|----------|-------------------|-------|
| Data model | Tables with fixed schema | Document, Key-Value, Column, Graph |
| Schema | Rigid (predefined) | Flexible (schema-less) |
| Transactions | ACID | BASE (eventual consistency) |
| Scaling | Vertical (scale up) | Horizontal (scale out) |
| Joins | Efficient | Expensive or unsupported |
| Query language | SQL (standardized) | Varies per DB |
| Best for | Banking, ERP, relationships | Big data, real-time, flexible schema |

| NoSQL Type | Examples | Use Case |
|-----------|---------|----------|
| **Key-Value** | Redis, DynamoDB | Caching, session store, rate limiting |
| **Document** | MongoDB, Couchbase | CMS, catalogs, user profiles |
| **Column-Family** | Cassandra, HBase | Time-series, analytics, IoT |
| **Graph** | Neo4j, Amazon Neptune | Social networks, fraud detection, recommendations |

---

### 3.9 Proxy Types

● **Forward Proxy** — Sits between client and internet. Client sends requests through proxy. Hides client identity. Example: VPN, corporate proxy.
● **Reverse Proxy** — Sits between internet and servers. Routes client requests to backend servers. Hides server identity. Example: Nginx, HAProxy, AWS ALB.

```
Forward Proxy:   Client → [Proxy] → Internet → Server
                 (server doesn't know the real client)

Reverse Proxy:   Client → Internet → [Proxy] → Server 1, 2, 3
                 (client doesn't know which server handles the request)
```

---

### 3.10 Communication Protocols

| Protocol | Type | Use Case |
|----------|------|----------|
| **HTTP/REST** | Request-Response | Standard APIs, CRUD operations |
| **WebSocket** | Full-duplex persistent | Chat, live trading dashboards, notifications |
| **gRPC** | Binary RPC (HTTP/2) | Inter-microservice communication (low latency) |
| **GraphQL** | Query language over HTTP | Flexible client queries, mobile apps |
| **Server-Sent Events (SSE)** | Server → Client stream | Live feeds, stock tickers |
| **Long Polling** | Client polls, server holds | Fallback when WebSocket unavailable |

● **JP Morgan context:** REST for external APIs, gRPC for internal microservice communication, WebSocket for real-time trading dashboards, Kafka for event-driven async messaging.

---
---

## 4. Notification System (Push / Email / SMS)

### What It Does
● Sends notifications to users through multiple channels — push notifications (mobile/web), email, SMS.
● Must be reliable (no duplicate/missing notifications), scalable (millions of users), and extensible (easy to add new channels).

---

### Functional Requirements
● Send notifications via push (iOS/Android/Web), email, and SMS.
● Support scheduled notifications (send at a specific time).
● Support templated messages with dynamic variables.
● Allow users to manage notification preferences (opt-in/opt-out per channel).
● Track delivery status (sent, delivered, read, failed).

### Non-Functional Requirements
● At-least-once delivery — better to send a duplicate than miss a notification.
● High throughput — handle millions of notifications per minute.
● Low latency for real-time notifications (< 1 second for push).
● Retry on failure with exponential backoff.

---

### HLD Architecture

```
                    ┌──────────────┐
  API / Event ─────►│ Notification  │
                    │   Service     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Message Queue│  (Kafka / RabbitMQ)
                    │  (by channel) │
                    └──┬───┬───┬───┘
                       │   │   │
              ┌────────▼┐ ┌▼────────┐ ┌▼─────────┐
              │  Push    │ │  Email   │ │  SMS      │
              │  Worker  │ │  Worker  │ │  Worker   │
              └────┬─────┘ └────┬─────┘ └────┬─────┘
                   │            │             │
              ┌────▼─────┐ ┌───▼──────┐ ┌────▼──────┐
              │ APNs/FCM │ │ SendGrid │ │ Twilio    │
              │ (Push)   │ │ (Email)  │ │ (SMS)     │
              └──────────┘ └──────────┘ └───────────┘
```

● **Notification Service** — Receives notification requests, validates, applies user preferences, routes to the correct channel queue.
● **Message Queue** — Separate queues per channel for isolation (email slowness doesn't block push).
● **Workers** — Consume from queues, call third-party providers (APNs for iOS, FCM for Android, SendGrid for email, Twilio for SMS).
● **User Preference DB** — Stores opt-in/opt-out settings per user per channel.
● **Template Service** — Stores and renders notification templates with dynamic variables.

---

### LLD Key Components

#### Database Schema
```sql
CREATE TABLE notification_log (
    id              BIGINT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    channel         VARCHAR(20) NOT NULL,     -- PUSH, EMAIL, SMS
    template_id     VARCHAR(50),
    payload         TEXT,
    status          VARCHAR(20) DEFAULT 'QUEUED',  -- QUEUED, SENT, DELIVERED, FAILED
    retry_count     INT DEFAULT 0,
    created_at      TIMESTAMP,
    sent_at         TIMESTAMP,
    delivered_at    TIMESTAMP
);

CREATE TABLE user_notification_preferences (
    user_id       BIGINT NOT NULL,
    channel       VARCHAR(20) NOT NULL,
    enabled       BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, channel)
);

CREATE TABLE notification_templates (
    template_id   VARCHAR(50) PRIMARY KEY,
    channel       VARCHAR(20) NOT NULL,
    subject       VARCHAR(255),
    body_template TEXT NOT NULL              -- "Hello {{name}}, your order {{order_id}} is confirmed."
);
```

#### Design Patterns
● **Strategy Pattern** — `NotificationSender` interface with `PushSender`, `EmailSender`, `SmsSender` implementations.
● **Observer Pattern** — Events trigger notifications (order placed → send confirmation to user).
● **Template Method Pattern** — Common send flow (validate → render template → dispatch → log) with channel-specific rendering.
● **Retry with Exponential Backoff** — On failure, retry after 1s, 2s, 4s, 8s... up to max retries.

#### Key Interview Points
● **Idempotency** — Use a unique `notification_id` to deduplicate. If the worker crashes after sending but before ACK, the retry should not send a duplicate.
● **Priority Queue** — OTP/security notifications should have higher priority than marketing emails.
● **Rate Limiting per Provider** — APNs, Twilio have rate limits. Workers must respect them.
● **Delivery Tracking** — Push: delivery receipt from FCM/APNs. Email: webhook from SendGrid (open/click tracking). SMS: delivery report from Twilio.

---
---

## 5. Payment / Transaction System (JP Morgan Favorite)

### What It Does
● Processes financial transactions — money transfers, bill payments, merchant payments.
● Must guarantee correctness (no double-charging, no lost money), consistency, and auditability.

---

### Functional Requirements
● Process payments (debit from sender, credit to receiver).
● Support multiple payment methods (bank account, credit card, wallet).
● Handle refunds and chargebacks.
● Maintain a complete audit trail / ledger of all transactions.
● Detect and prevent duplicate payments (idempotency).

### Non-Functional Requirements
● **Exactly-once processing** — A payment must never be processed twice.
● **Strong consistency** — Account balances must always be accurate.
● **High availability** — Payment service must be up 99.99%.
● **Low latency** — Payment processing < 500ms.
● **Compliance** — PCI-DSS, SOX audit trails.

---

### HLD Architecture

```
Client → API Gateway → Payment Service → [Payment Executor]
               │              │                    │
               │         ┌────▼─────┐    ┌────────▼────────┐
               │         │ Ledger   │    │ Payment Provider │
               │         │ Service  │    │ (Stripe/Bank)    │
               │         └──────────┘    └─────────────────┘
               │              │
         ┌─────▼──────┐  ┌───▼───────┐
         │ Idempotency │  │ Audit Log │
         │ Store (Redis)│  │ (Append   │
         └─────────────┘  │  Only DB) │
                          └───────────┘
```

---

### LLD Key Components

#### Double-Entry Ledger (Core Concept)
● Every transaction creates TWO entries — one debit, one credit. The sum of all entries is always zero.

```sql
CREATE TABLE ledger_entries (
    id              BIGINT PRIMARY KEY,
    transaction_id  VARCHAR(50) NOT NULL,
    account_id      BIGINT NOT NULL,
    entry_type      VARCHAR(10) NOT NULL,      -- DEBIT or CREDIT
    amount          DECIMAL(19,4) NOT NULL,
    currency        VARCHAR(3) NOT NULL,
    created_at      TIMESTAMP NOT NULL,
    description     VARCHAR(255)
);

-- Example: User A sends $100 to User B
-- Entry 1: DEBIT  Account A  -$100  (money leaves A)
-- Entry 2: CREDIT Account B  +$100  (money enters B)
-- Net = 0 (money is conserved)
```

#### Idempotency (Preventing Double Payment)
```
Client sends: POST /api/pay  with header: Idempotency-Key: "txn-abc-123"

Server flow:
  1. Check Redis: does "txn-abc-123" exist?
  2. YES → return cached response (don't process again)
  3. NO  → process payment, store result in Redis with key "txn-abc-123", return response
```

```java
public PaymentResponse processPayment(String idempotencyKey, PaymentRequest request) {
    // Check if already processed
    PaymentResponse cached = redis.get("idempotency:" + idempotencyKey);
    if (cached != null) return cached;  // duplicate request — return cached result

    // Process payment
    PaymentResponse response = executePayment(request);

    // Cache result with TTL (e.g., 24 hours)
    redis.set("idempotency:" + idempotencyKey, response, 24, TimeUnit.HOURS);
    return response;
}
```

#### Transaction State Machine
```
CREATED → PROCESSING → SUCCESS
                    ↘ FAILED → RETRY → SUCCESS
                                    ↘ PERMANENTLY_FAILED → REFUND_INITIATED → REFUNDED
```

#### Payment Flow (Step by Step)
```
1. Client sends payment request with idempotency key
2. API Gateway authenticates and rate-limits
3. Payment Service validates request (amount, currency, account exists)
4. Check idempotency store — if duplicate, return cached response
5. Create ledger entries (DEBIT sender, CREDIT receiver) in a single DB transaction
6. Call payment provider (Stripe/bank API) to execute external transfer
7. Update transaction status to SUCCESS or FAILED
8. Publish event to Kafka (for notifications, analytics, audit)
9. Return response to client
```

#### Key Interview Points
● **Why double-entry ledger?** — Self-balancing. If debits ≠ credits, you know something went wrong. Used by every bank in the world.
● **Distributed transactions across services?** — Use the **Saga Pattern** (see Section 10) instead of 2PC. If payment provider fails, trigger compensating transactions (refund the debit).
● **Reconciliation** — Periodically compare your ledger with the payment provider's records to detect discrepancies.
● **Eventual consistency** — External bank transfers are async. Status may be PENDING until the bank confirms.
● **PCI Compliance** — Never store raw credit card numbers. Use tokenization (Stripe/Vault generates a token for the card).

---
---

## 6. Stock Trading Platform / Order Book (JP Morgan Favorite)

### What It Does
● Allows users to place buy/sell orders for stocks. Matches buyers with sellers. Maintains a real-time order book.
● Must be extremely low-latency (microsecond matching), fair (FIFO ordering), and reliable.

---

### Functional Requirements
● Users can place market orders (execute immediately at best price) and limit orders (execute only at specified price or better).
● Match buy orders with sell orders in real-time.
● Maintain an order book per stock (list of pending buy/sell orders sorted by price).
● Provide real-time market data feed (price updates, trade history).
● Support order cancellation and modification.

### Non-Functional Requirements
● Ultra-low latency — order matching in microseconds.
● Strong consistency — no double-fills, no phantom trades.
● High throughput — millions of orders per second.
● Fairness — orders at the same price are matched FIFO (first come, first served).

---

### HLD Architecture

```
Client → API Gateway → Order Service → Matching Engine → Trade Service
              │                              │                  │
        ┌─────▼──────┐               ┌──────▼───────┐   ┌──────▼──────┐
        │ Auth/Risk   │               │  Order Book   │   │  Ledger     │
        │ Check       │               │  (in-memory)  │   │  (trades)   │
        └─────────────┘               └──────────────┘   └─────────────┘
                                             │
                                      ┌──────▼───────┐
                                      │ Market Data   │ → WebSocket → Clients
                                      │ Publisher      │   (real-time prices)
                                      └──────────────┘
```

---

### LLD Key Components

#### Order Book Data Structure
```
Buy Orders (Bids) — sorted by price DESCENDING, then by time ASCENDING
┌───────┬────────┬──────┬───────────────┐
│ Price │ Qty    │ Side │ Timestamp     │
├───────┼────────┼──────┼───────────────┤
│ 150.50│ 100    │ BUY  │ 10:00:01.001  │  ← Best Bid (highest buy price)
│ 150.45│ 200    │ BUY  │ 10:00:01.003  │
│ 150.40│ 50     │ BUY  │ 10:00:00.999  │
└───────┴────────┴──────┴───────────────┘

Sell Orders (Asks) — sorted by price ASCENDING, then by time ASCENDING
┌───────┬────────┬──────┬───────────────┐
│ Price │ Qty    │ Side │ Timestamp     │
├───────┼────────┼──────┼───────────────┤
│ 150.55│ 150    │ SELL │ 10:00:01.002  │  ← Best Ask (lowest sell price)
│ 150.60│ 300    │ SELL │ 10:00:00.998  │
│ 150.75│ 100    │ SELL │ 10:00:01.005  │
└───────┴────────┴──────┴───────────────┘

Spread = Best Ask - Best Bid = 150.55 - 150.50 = $0.05
```

#### Matching Logic (Price-Time Priority)
```
New BUY order arrives: Buy 100 shares at $150.60 (limit order)

1. Check sell side: Best Ask = $150.55 (≤ $150.60) → MATCH!
   Fill 100 shares at $150.55 (seller's price)
   Remove/reduce the sell order

2. If buy qty remaining > 0, check next sell order
3. If no more matching sells, add remaining to buy side of order book
```

#### Market Order vs Limit Order
● **Market Order** — "Buy 100 shares at ANY price." Executes immediately at best available price. No price guarantee.
● **Limit Order** — "Buy 100 shares at $150.50 or less." Only executes if the price condition is met. May sit in the order book indefinitely.

#### Key Interview Points
● **In-memory order book** — The matching engine keeps the order book in memory (TreeMap/Red-Black Tree by price, LinkedList per price level for FIFO).
● **Single-threaded matching** — To avoid locks and ensure fairness, the matching engine is often single-threaded per stock. LMAX Disruptor pattern.
● **Event Sourcing** — Every order and trade is an immutable event. You can rebuild the order book by replaying events.
● **Market Data Fan-out** — Price updates pushed to thousands of clients via WebSocket. Use a pub-sub system (Kafka → WebSocket servers → clients).
● **Risk checks** — Before accepting an order: Does the user have enough balance? Is the order size within limits? Is the account flagged?

---
---

## 7. Distributed Cache (like Redis / Memcached)

### What It Does
● An in-memory key-value store that sits between the application and the database to reduce latency and database load.

---

### HLD Architecture

```
Client → App Server → Cache (Redis) → Database (on cache miss)
                          │
                   ┌──────▼───────┐
                   │ Redis Cluster │
                   │ ┌────┐┌────┐ │
                   │ │ N1 ││ N2 │ │  (data sharded via consistent hashing)
                   │ └────┘└────┘ │
                   │ ┌────┐┌────┐ │
                   │ │ N3 ││ N4 │ │
                   │ └────┘└────┘ │
                   └──────────────┘
```

---

### LLD Key Components

#### Data Structures Supported (Redis)
```
● String   — SET key "value"                     → Caching, counters, rate limiting
● Hash     — HSET user:1 name "Prabhat" age 25   → Object storage (like a row)
● List     — LPUSH queue task1 task2              → Message queues, activity feeds
● Set      — SADD tags "java" "spring"            → Unique items, mutual friends
● Sorted   — ZADD leaderboard 100 "player1"      → Rankings, priority queues
  Set
```

#### Sharding in Cache Cluster
● Use **consistent hashing** to distribute keys across nodes.
● Each key hashes to a position on the ring → assigned to the next clockwise node.
● Adding/removing a node only remaps ~K/N keys (not all keys).

#### Replication for High Availability
```
Master-Replica setup:
  Write → Master Node → Async replication → Replica 1, Replica 2
  Read  → Replica (for read-heavy workloads)

If Master dies → Replica promoted to Master (automatic failover via Redis Sentinel)
```

#### Cache Invalidation Strategies
● **TTL (Time to Live)** — Key auto-expires after N seconds. Simple but may serve stale data within TTL.
● **Event-driven invalidation** — When DB is updated, publish an event to invalidate/update the cache entry.
● **Write-through** — Every DB write also writes to cache. Always consistent but slower writes.

#### Key Interview Points
● **Cache vs DB** — Cache is fast (microseconds) but volatile (data lost on restart). DB is slow (milliseconds) but durable.
● **When NOT to cache** — Write-heavy data, rarely accessed data, data that must be real-time consistent.
● **Thundering Herd** — Multiple requests for the same expired key. Solution: use a distributed lock — only one request fetches from DB, others wait.
● **Hot Key Problem** — One key gets millions of requests (e.g., celebrity's profile). Solution: replicate hot keys to all nodes, or add random suffix to spread reads.
● **Redis vs Memcached** — Redis: richer data structures, persistence, replication, Lua scripting. Memcached: simpler, multi-threaded (faster for simple key-value at scale).

---
---

## 8. Message Queue / Event Streaming (Kafka)

### What It Does
● Decouples producers (services that generate events) from consumers (services that process events).
● Enables asynchronous communication, event-driven architecture, and data streaming.

---

### Why Use a Message Queue
```
Without MQ (synchronous):
  Order Service → calls → Payment Service → calls → Notification Service
  If Payment is slow/down, Order Service is blocked.

With MQ (asynchronous):
  Order Service → publishes event → [Kafka] → Payment Consumer picks up
                                            → Notification Consumer picks up
  Order Service returns immediately. Consumers process independently.
```

---

### HLD Architecture (Kafka)

```
┌───────────┐     ┌───────────────────────────────────┐     ┌───────────┐
│ Producer 1 │────►│           Kafka Cluster            │────►│ Consumer 1│
│ Producer 2 │────►│  ┌─────────────────────────────┐  │────►│ Consumer 2│
│ Producer N │────►│  │ Topic: "orders"              │  │────►│ Consumer N│
└───────────┘     │  │  Partition 0: [m1, m2, m3]   │  │     └───────────┘
                  │  │  Partition 1: [m4, m5]        │  │
                  │  │  Partition 2: [m6, m7, m8]    │  │
                  │  └─────────────────────────────┘  │
                  │                                     │
                  │  Broker 1  |  Broker 2  |  Broker 3 │
                  └───────────────────────────────────┘
```

---

### LLD Key Concepts

#### Topic, Partition, Offset
```
Topic    = logical channel (e.g., "orders", "payments", "notifications")
Partition = physical split of a topic for parallelism (each partition is an ordered, immutable log)
Offset   = position of a message within a partition (like an index)

Topic: "orders" with 3 partitions:
  Partition 0: [offset 0: m1] [offset 1: m2] [offset 2: m3]
  Partition 1: [offset 0: m4] [offset 1: m5]
  Partition 2: [offset 0: m6] [offset 1: m7] [offset 2: m8]
```

#### Consumer Groups
```
Consumer Group "payment-service":
  Consumer A reads Partition 0
  Consumer B reads Partition 1
  Consumer C reads Partition 2
  → Each message processed by exactly ONE consumer in the group

Consumer Group "notification-service":
  Consumer X reads Partition 0, 1
  Consumer Y reads Partition 2
  → Same messages processed again by THIS group independently
```

● Within a consumer group, each partition is consumed by exactly one consumer (no duplicates).
● Different consumer groups independently consume the same messages (pub-sub model).

#### Delivery Guarantees
| Guarantee | Meaning | How |
|-----------|---------|-----|
| **At-most-once** | Message may be lost, never duplicated | Consumer commits offset before processing |
| **At-least-once** | Message never lost, may be duplicated | Consumer commits offset after processing |
| **Exactly-once** | Message processed exactly once | Idempotent producer + transactional consumer |

#### Kafka vs RabbitMQ vs SQS

| Feature | Kafka | RabbitMQ | AWS SQS |
|---------|-------|----------|---------|
| Model | Log-based streaming | Traditional message queue | Cloud-managed queue |
| Ordering | Per partition | Per queue | FIFO queue only |
| Retention | Configurable (days/weeks) | Until consumed | 14 days max |
| Throughput | Very high (millions/sec) | Moderate | Moderate |
| Replay | Yes (re-read old messages) | No (once consumed, gone) | No |
| Use case | Event streaming, CDC, analytics | Task queues, RPC | Simple async tasks |

#### Key Interview Points
● **How Kafka achieves high throughput** — Sequential disk I/O (appending to log), zero-copy transfer, batching, compression, partitioning for parallelism.
● **Ordering guarantee** — Only within a partition. Use a partition key (e.g., `order_id`) so all messages for the same entity go to the same partition.
● **Replication** — Each partition has one leader and N-1 followers. Writes go to leader, replicated to followers. If leader dies, a follower becomes the new leader.
● **Backpressure** — If consumer is slow, messages accumulate in the topic. Kafka handles this naturally (consumers pull at their own pace, unlike push-based systems).

---
---

## 9. API Gateway

### What It Does
● Single entry point for all client requests to a microservices backend.
● Handles cross-cutting concerns: authentication, rate limiting, routing, load balancing, caching, logging.

---

### HLD Architecture

```
                              ┌──────────────────────┐
Mobile App ──────────────►    │                      │    ──────► User Service
Web App    ──────────────►    │    API Gateway        │    ──────► Order Service
Partner API ─────────────►    │    (Kong / Nginx /    │    ──────► Payment Service
                              │     Spring Cloud GW)  │    ──────► Notification Service
                              └──────────────────────┘
                                         │
                              Handles: Auth, Rate Limit,
                              Routing, SSL, Logging,
                              Request/Response Transform
```

---

### Responsibilities

| Feature | What It Does |
|---------|-------------|
| **Routing** | `/api/users/*` → User Service, `/api/orders/*` → Order Service |
| **Authentication** | Validate JWT/API key before forwarding to backend |
| **Rate Limiting** | Throttle requests per client/API (see Section 2) |
| **Load Balancing** | Distribute requests across service instances |
| **SSL Termination** | Handle HTTPS at the gateway, backend uses plain HTTP |
| **Request Transform** | Add headers, modify paths, aggregate responses |
| **Circuit Breaker** | If a backend is failing, stop forwarding requests (fail fast) |
| **Caching** | Cache responses for GET requests |
| **Logging & Monitoring** | Centralized request logging, metrics collection |

#### API Gateway vs Load Balancer
● **Load Balancer** — Layer 4/7 traffic distribution. Dumb routing (round robin, least connections).
● **API Gateway** — Application-level intelligence. Auth, rate limiting, request transformation, protocol translation. A superset of load balancer functionality.

#### Key Interview Points
● **Single point of failure?** — Deploy multiple gateway instances behind a load balancer. Use health checks and auto-scaling.
● **Backend for Frontend (BFF)** — Different gateways for different clients (mobile gateway returns less data than web gateway).
● **Service Mesh vs API Gateway** — API Gateway handles north-south traffic (client → services). Service Mesh (Istio/Envoy) handles east-west traffic (service → service).

---
---

## 10. Task / Job Scheduler (like cron)

### What It Does
● Executes tasks at scheduled times or intervals (send daily report at 8 AM, retry failed payments every 5 minutes).
● Must be reliable (never miss a job), scalable, and support millions of scheduled tasks.

---

### HLD Architecture

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│ Scheduler API │────►│  Job Store     │────►│  Job Queue    │
│ (CRUD jobs)   │     │  (DB/Redis)    │     │  (Kafka/SQS)  │
└──────────────┘     └───────┬───────┘     └──────┬───────┘
                             │                     │
                      ┌──────▼───────┐      ┌──────▼───────┐
                      │  Scheduler    │      │  Workers      │
                      │  (polls jobs  │      │  (execute     │
                      │   due now)    │      │   the task)   │
                      └──────────────┘      └──────────────┘
```

#### Key Concepts
● **Job Store** — Database table holding job definitions (cron expression, callback URL, payload, next_run_at).
● **Scheduler** — Polls the job store every second for jobs where `next_run_at <= now`. Pushes them to the job queue.
● **Workers** — Consume from the queue and execute the job (HTTP callback, function invocation, etc.).
● **Distributed lock** — Only one scheduler instance should poll at a time to avoid duplicate execution. Use Redis lock or DB-level `SELECT ... FOR UPDATE SKIP LOCKED`.

#### Database Schema
```sql
CREATE TABLE scheduled_jobs (
    id              BIGINT PRIMARY KEY,
    job_name        VARCHAR(255) NOT NULL,
    cron_expression VARCHAR(50),              -- "0 0 8 * * ?" = daily at 8 AM
    callback_url    VARCHAR(500),
    payload         TEXT,
    status          VARCHAR(20) DEFAULT 'ACTIVE',  -- ACTIVE, PAUSED, COMPLETED
    next_run_at     TIMESTAMP NOT NULL,
    last_run_at     TIMESTAMP,
    retry_count     INT DEFAULT 0,
    max_retries     INT DEFAULT 3,
    created_at      TIMESTAMP
);

CREATE INDEX idx_next_run ON scheduled_jobs(next_run_at) WHERE status = 'ACTIVE';
```

#### Key Interview Points
● **Exactly-once execution** — Use distributed locking + idempotency key per job run.
● **Missed jobs** — If scheduler was down, on restart scan for all jobs where `next_run_at < now` and execute them.
● **Scaling** — Partition jobs across multiple scheduler instances by job_id range or hash.
● **Dead letter queue** — Jobs that fail after max retries go to a DLQ for manual inspection.

---
---

## 11. Distributed System Patterns (Must-Know for JP Morgan)

### 11.1 Circuit Breaker Pattern

● Prevents a service from repeatedly calling a failing downstream service (which wastes resources and increases latency).

```
States:
  CLOSED  → Normal operation. Requests pass through. Track failure count.
  OPEN    → Failure threshold exceeded. ALL requests fail fast (return error immediately).
            After a timeout, move to HALF-OPEN.
  HALF-OPEN → Allow a few test requests. If they succeed → CLOSED. If they fail → OPEN again.

          success         failure threshold
  ┌────────────────┐     exceeded
  │    CLOSED      │─────────────────►┌────────┐
  │ (normal flow)  │                  │  OPEN  │
  │                │◄─────────────────│(fail   │
  └────────────────┘   test succeeds  │ fast)  │
                    ▲                 └───┬────┘
                    │    timeout expires  │
                    │  ┌─────────────┐   │
                    └──│  HALF-OPEN  │◄──┘
                       │(test a few) │
                       └─────────────┘
```

● **Library:** Resilience4j (Java), Hystrix (deprecated).
● **JP Morgan context:** If the payment provider is down, stop hammering it. Return a fast failure to the client and retry later.

---

### 11.2 Saga Pattern (Distributed Transactions)

● When a business transaction spans multiple microservices, you can't use a single DB transaction. Saga breaks it into a sequence of local transactions with compensating actions for rollback.

#### Choreography (Event-Driven)
```
Order Service → publishes "OrderCreated" event
  → Payment Service listens, processes payment, publishes "PaymentCompleted"
    → Inventory Service listens, reserves stock, publishes "StockReserved"
      → Shipping Service listens, creates shipment

If Payment fails → publishes "PaymentFailed"
  → Order Service listens → cancels order (compensating action)
```

#### Orchestration (Central Coordinator)
```
Saga Orchestrator:
  Step 1: Call Order Service → create order
  Step 2: Call Payment Service → charge customer
  Step 3: Call Inventory Service → reserve stock
  Step 4: Call Shipping Service → create shipment

  If Step 2 fails:
    Compensate Step 1: Cancel order
    Stop saga, return error
```

| Type | Pros | Cons |
|------|------|------|
| Choreography | Decoupled, no single point of failure | Hard to track, complex event chains |
| Orchestration | Easy to understand, centralized control | Orchestrator is a single point of failure |

● **JP Morgan context:** Payment processing across multiple services (debit account → call bank → update ledger → send notification). If bank call fails, compensate by reversing the debit.

---

### 11.3 Event Sourcing

● Instead of storing the current state, store every **event** (state change) as an immutable record. Current state is derived by replaying all events.

```
Traditional (state-based):
  Account balance = $500 (just the final number)

Event Sourcing:
  Event 1: AccountCreated  { balance: $0 }
  Event 2: MoneyDeposited  { amount: $1000 }
  Event 3: MoneyWithdrawn  { amount: $300 }
  Event 4: MoneyWithdrawn  { amount: $200 }
  Current balance = replay all events = $0 + $1000 - $300 - $200 = $500
```

● **Advantages:** Full audit trail, can rebuild state at any point in time, enables temporal queries ("what was the balance at 3 PM?").
● **JP Morgan context:** Perfect for financial systems — regulators require complete audit trails. Every transaction is an immutable event.

---

### 11.4 CQRS (Command Query Responsibility Segregation)

● Separate the **write model** (commands) from the **read model** (queries). Different databases optimized for each.

```
                    ┌─────────────┐
 Write (Command) ──►│ Write DB     │ (normalized, ACID, MySQL)
                    │ (source of   │
                    │  truth)       │──── async sync ────►┌────────────┐
                    └─────────────┘                       │ Read DB     │ (denormalized,
                                                          │ (optimized  │  Elasticsearch,
 Read (Query) ◄──────────────────────────────────────────│  for reads) │  Redis, Cassandra)
                                                          └────────────┘
```

● **Why?** In most systems, reads >> writes. Optimizing one DB for both is a compromise. Separate them and optimize each independently.
● **Often paired with Event Sourcing** — Write side stores events, read side maintains materialized views.

---

### 11.5 Idempotency

● An operation is **idempotent** if performing it multiple times produces the same result as performing it once.
● Critical for distributed systems where network failures cause retries.

```
Idempotent:
  GET /users/123         → Always returns the same user (safe to retry)
  PUT /users/123 { name: "Prabhat" }  → Same result regardless of how many times called
  DELETE /users/123      → First call deletes, subsequent calls return 404 (no side effect)

NOT Idempotent:
  POST /payments { amount: 100 }  → Each call creates a NEW payment!
  → Solution: Client sends an Idempotency-Key header, server deduplicates
```

● **Implementation:** Store `(idempotency_key → response)` in Redis with a TTL. On retry, return cached response without re-executing.

---

### 11.6 Two-Phase Commit (2PC) vs Saga

| Property | 2PC | Saga |
|----------|-----|------|
| Consistency | Strong (ACID) | Eventual |
| Performance | Slow (blocking locks) | Fast (async) |
| Availability | Low (coordinator is SPOF) | High |
| Complexity | Simple logic, complex infra | Complex logic, simple infra |
| Use case | Single DB across shards | Microservices with separate DBs |

● **JP Morgan context:** 2PC within a single database (cross-shard transactions). Saga across microservices.

---

### 11.7 Bloom Filter

● A space-efficient probabilistic data structure that tells you whether an element is "definitely NOT in the set" or "possibly in the set."
● Uses: Cache penetration prevention, duplicate detection, spell checking.

```
Check if URL exists in billions of shortened URLs:
  Bloom Filter says "NO"  → Definitely not in the set (100% accurate)
  Bloom Filter says "YES" → Might be in the set (small false positive rate, check DB to confirm)
```

● **No false negatives.** If it says "not present," trust it. Saves unnecessary DB lookups.

---
---

## 12. Quick Reference — Interview Checklist

### System Design Template (Use This Structure in Every Interview)

```
Step 1: Requirements Clarification (2-3 min)
  ● Functional requirements (what the system does)
  ● Non-functional requirements (scale, latency, availability, consistency)
  ● Back-of-envelope estimation (QPS, storage, bandwidth)

Step 2: High-Level Design (10-15 min)
  ● Draw the architecture (boxes and arrows)
  ● Identify main components (API, services, DB, cache, queue)
  ● Data flow (write path and read path)

Step 3: Deep Dive / LLD (10-15 min)
  ● API design (endpoints, request/response)
  ● Database schema (tables, indexes)
  ● Core algorithm / data structure
  ● Design patterns used

Step 4: Scaling & Trade-offs (5 min)
  ● Bottlenecks and how to address them
  ● Sharding, caching, replication strategies
  ● Trade-offs you made (consistency vs availability, etc.)
```

### JP Morgan Specific Focus Areas
```
● Strong consistency for financial data (CP over AP)
● Idempotency in payment processing (exactly-once semantics)
● Audit trails and event sourcing (regulatory compliance)
● Low-latency systems (trading platforms)
● Saga pattern for distributed transactions
● Circuit breaker for resilient microservices
● Kafka for event-driven architecture
● Double-entry ledger for accounting systems
● Security: JWT, OAuth2, API keys, encryption at rest/transit
● Rate limiting to protect backend services
```

---
---

## 13. Design Netflix (Video Streaming Platform)

### What It Does
● Allows users to browse, search, and stream video content (movies, series) on-demand.
● Handles massive scale — 200M+ subscribers, thousands of concurrent streams, content available globally.

---

### Functional Requirements
● User registration, login, and profile management (multiple profiles per account).
● Browse and search content catalog (by genre, trending, recommendations).
● Stream video in adaptive quality based on user's bandwidth.
● Resume playback from where the user left off.
● Support multiple devices (mobile, TV, web, tablet) simultaneously.
● Content upload and encoding pipeline (admin/studio side).

### Non-Functional Requirements
● High availability — 99.99% uptime (users should never see "service unavailable").
● Low latency — video should start playing within 2-3 seconds.
● Scalable — support millions of concurrent streams globally.
● Adaptive streaming — adjust video quality dynamically based on network conditions.
● Content should be cached close to users (CDN) for minimal buffering.

---

### Capacity Estimation
● Daily active users: ~100M
● Concurrent streams at peak: ~10M
● Average video size: ~3 GB (multiple resolutions)
● Total content library: ~15,000 titles × 3 GB × 5 resolutions = ~225 TB
● Bandwidth per stream: 5 Mbps (HD)
● Peak bandwidth: 10M × 5 Mbps = 50 Tbps (served via CDN)

---

### HLD Architecture

```
                              ┌────────────────┐
       Client (App/Web) ─────►│   API Gateway   │
                              └───────┬────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
       ┌──────▼───────┐      ┌───────▼───────┐      ┌───────▼───────┐
       │ User Service  │      │ Catalog/Search│      │ Streaming     │
       │ (auth,profile)│      │ Service       │      │ Service       │
       └──────┬───────┘      └───────┬───────┘      └───────┬───────┘
              │                      │                       │
       ┌──────▼───────┐      ┌──────▼────────┐      ┌──────▼────────┐
       │   User DB     │      │ Elasticsearch  │      │     CDN       │
       │  (MySQL)      │      │ (search index) │      │ (video files) │
       └──────────────┘      └───────────────┘      └───────────────┘
                                                            │
                                                     ┌──────▼────────┐
                                                     │  Object Store  │
                                                     │  (S3 — master  │
                                                     │   video files) │
                                                     └───────────────┘
```

#### Additional Components
```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Recommendation   │     │ Video Processing  │     │ Analytics        │
│ Service (ML)     │     │ Pipeline          │     │ Service          │
│ (what to watch)  │     │ (encoding/transcoding)│ │ (views, watch    │
└─────────────────┘     └──────────────────┘     │  history)        │
                                                  └──────────────────┘
```

---

### LLD Key Components

#### Video Upload & Processing Pipeline
```
Studio uploads video
    │
    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Upload to S3  │────►│ Transcoding   │────►│ Store encoded │
│ (raw master)  │     │ Service       │     │ files in S3   │
└──────────────┘     │ (FFmpeg)      │     └──────┬───────┘
                     │               │            │
                     │ Encode into:  │     ┌──────▼───────┐
                     │  240p, 360p,  │     │ Push to CDN   │
                     │  480p, 720p,  │     │ (edge servers) │
                     │  1080p, 4K    │     └──────────────┘
                     └──────────────┘
```

● Videos are broken into **small chunks** (2-10 seconds each) at each resolution.
● Each chunk is independently downloadable — enables adaptive bitrate streaming.

#### Adaptive Bitrate Streaming (ABR)
```
Client starts playing at 720p
    │
    ▼ bandwidth drops
Client switches to 480p (seamless, no rebuffer)
    │
    ▼ bandwidth recovers
Client switches back to 720p

Protocol: HLS (HTTP Live Streaming) or DASH (Dynamic Adaptive Streaming over HTTP)

Manifest file (.m3u8) contains URLs for all chunks at all quality levels:
  /video/123/720p/chunk_001.ts
  /video/123/720p/chunk_002.ts
  /video/123/480p/chunk_001.ts
  /video/123/480p/chunk_002.ts
  ...
```

#### CDN (Content Delivery Network)
```
● Videos cached on edge servers close to users worldwide.
● User in India → served from Mumbai edge server (not US origin).
● Netflix has its own CDN called Open Connect — dedicated servers placed inside ISP data centers.
● Reduces latency, reduces bandwidth cost, reduces load on origin servers.
```

#### Recommendation Engine
```
Two approaches:
  1. Collaborative Filtering — "Users similar to you also watched X"
  2. Content-Based Filtering — "You watched action movies, here are more action movies"

Data signals:
  ● Watch history, watch time, ratings
  ● Search queries, browse behavior
  ● Time of day, device type
  ● Genre preferences

Output: Personalized homepage with ranked content rows
```

#### Database Schema (Simplified)
```sql
CREATE TABLE users (
    user_id     BIGINT PRIMARY KEY,
    email       VARCHAR(255) UNIQUE,
    plan_type   VARCHAR(20),         -- BASIC, STANDARD, PREMIUM
    created_at  TIMESTAMP
);

CREATE TABLE content (
    content_id   BIGINT PRIMARY KEY,
    title        VARCHAR(255),
    description  TEXT,
    genre        VARCHAR(100),
    duration_min INT,
    release_year INT,
    rating       DECIMAL(3,1)
);

CREATE TABLE watch_history (
    user_id      BIGINT,
    content_id   BIGINT,
    progress_sec INT,               -- resume from here
    last_watched TIMESTAMP,
    PRIMARY KEY (user_id, content_id)
);
```

#### Key Interview Points
● **Why chunks?** — Enables adaptive streaming, parallel downloads, and seeking without downloading entire file.
● **CDN is the backbone** — 95%+ of Netflix traffic is served from CDN, not origin servers.
● **Microservices at Netflix** — 700+ microservices. Each team owns a service (auth, billing, recommendations, streaming, etc.).
● **Chaos Engineering** — Netflix invented Chaos Monkey (randomly kills production instances) to ensure resilience.
● **Data pipeline** — Kafka + Apache Spark for processing billions of streaming events daily for analytics and recommendations.

---
---

## 14. Design Facebook / Instagram (Social Media Platform)

### What It Does
● Allows users to create profiles, post content (text/images/videos), follow other users, like/comment, and see a personalized news feed.
● Handles billions of users, posts, and interactions daily.

---

### Functional Requirements
● User registration, login, profile management.
● Create posts (text, images, videos).
● Follow/unfollow other users.
● News feed — personalized timeline showing posts from people you follow.
● Like, comment, and share posts.
● Search for users and content.
● Push notifications for likes, comments, follows.
● Direct messaging (1:1 and group).

### Non-Functional Requirements
● High availability — platform must be up 99.99%.
● News feed latency < 200ms.
● Support billions of users and trillions of posts.
● Eventual consistency is acceptable for feed (slight delay is OK).
● Media storage at massive scale (petabytes of images/videos).

---

### Capacity Estimation
● Daily active users: ~2 Billion (Facebook)
● Posts per day: ~500 Million
● Average post size: ~1 KB text + 500 KB image = ~500 KB
● Storage per day: 500M × 500 KB = ~250 TB/day
● Read:Write ratio: ~100:1 (people read feed much more than they post)
● News feed QPS: ~100M concurrent users × 10 feed refreshes/day = ~1B feed requests/day ≈ ~12K QPS

---

### HLD Architecture

```
                              ┌────────────────┐
       Client (App/Web) ─────►│   API Gateway   │
                              └───────┬────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │              │             │             │               │
  ┌──────▼──────┐ ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐ ┌──────▼──────┐
  │ User Service│ │Post      │ │Feed      │ │Search    │ │Notification │
  │             │ │Service   │ │Service   │ │Service   │ │Service      │
  └──────┬──────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────────────┘
         │              │            │             │
  ┌──────▼──────┐ ┌────▼─────┐ ┌────▼─────┐ ┌────▼──────┐
  │  User DB    │ │ Post DB  │ │Feed Cache│ │Elastic    │
  │  (MySQL)    │ │(Cassandra)│ │ (Redis)  │ │search     │
  └─────────────┘ └────┬─────┘ └──────────┘ └───────────┘
                       │
                 ┌─────▼──────┐
                 │ Media Store │
                 │ (S3 + CDN)  │
                 └────────────┘
```

---

### LLD Key Components

#### News Feed Generation (The Core Problem)

Two approaches:

**Approach 1: Fan-out on Write (Push Model)**
```
When User A creates a post:
  1. Post saved to Post DB
  2. Fetch all followers of User A (say 1000 followers)
  3. Push the post_id into each follower's feed cache (Redis list)

When User B opens their feed:
  1. Read pre-computed feed from Redis → instant, no computation needed

Pros: Feed reads are super fast (pre-computed).
Cons: Celebrity problem — a user with 100M followers means 100M writes per post (expensive).
```

**Approach 2: Fan-out on Read (Pull Model)**
```
When User B opens their feed:
  1. Fetch list of users B follows
  2. Fetch recent posts from each of them
  3. Merge and rank posts by timestamp/relevance
  4. Return top N posts

Pros: No wasted writes (only compute feed when requested).
Cons: Feed reads are slow (lots of DB queries at read time).
```

**Approach 3: Hybrid (What Facebook/Instagram Actually Uses)**
```
● For regular users (< 10K followers): Fan-out on Write (push to follower feeds)
● For celebrities (> 10K followers): Fan-out on Read (fetch their posts at read time)

This avoids the celebrity problem while keeping reads fast for most users.
```

#### Feed Ranking Algorithm
```
Instead of simple chronological order, rank posts by:
  ● Recency (newer posts score higher)
  ● Relationship (close friends rank higher)
  ● Engagement (posts with more likes/comments rank higher)
  ● Content type (videos may rank differently than text)
  ● User interest (based on past interactions)

Score = w1 × recency + w2 × relationship + w3 × engagement + w4 × interest
Sort by score descending → return top N
```

#### Image/Media Upload Flow
```
Client uploads image
    │
    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Upload Service│────►│ Image Process │────►│ Store in S3   │
│               │     │ (resize,     │     │ + push to CDN │
│               │     │  compress,   │     └──────────────┘
│               │     │  thumbnails) │
│               │     └──────────────┘
└──────────────┘

Generate multiple sizes:
  ● Thumbnail (150x150)
  ● Medium (600x600)
  ● Full (1080x1080)

Store each size separately → serve appropriate size based on device/context
```

#### Database Choices
```
● User data       → MySQL (relational, ACID — account info, credentials)
● Posts            → Cassandra (write-heavy, time-series, distributed)
● Feed cache       → Redis (in-memory, fast reads, sorted sets for ranked feed)
● Social graph     → MySQL or Graph DB (who follows whom)
● Media files      → S3 + CDN
● Search index     → Elasticsearch
● Analytics        → Hadoop / Apache Spark
```

#### Database Schema (Simplified)
```sql
-- User table (MySQL)
CREATE TABLE users (
    user_id     BIGINT PRIMARY KEY,
    username    VARCHAR(50) UNIQUE,
    email       VARCHAR(255) UNIQUE,
    bio         TEXT,
    profile_pic VARCHAR(500),
    created_at  TIMESTAMP
);

-- Follow relationship (MySQL)
CREATE TABLE follows (
    follower_id  BIGINT,
    followee_id  BIGINT,
    created_at   TIMESTAMP,
    PRIMARY KEY (follower_id, followee_id)
);
CREATE INDEX idx_followee ON follows(followee_id);

-- Posts (Cassandra — partition by user_id, cluster by timestamp)
CREATE TABLE posts (
    post_id     BIGINT,
    user_id     BIGINT,
    content     TEXT,
    media_urls  LIST<TEXT>,
    like_count  BIGINT,
    created_at  TIMESTAMP,
    PRIMARY KEY (user_id, created_at)  -- partition by user, sorted by time
) WITH CLUSTERING ORDER BY (created_at DESC);

-- Likes (Cassandra)
CREATE TABLE likes (
    post_id   BIGINT,
    user_id   BIGINT,
    created_at TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
);

-- Comments (Cassandra)
CREATE TABLE comments (
    post_id    BIGINT,
    comment_id BIGINT,
    user_id    BIGINT,
    content    TEXT,
    created_at TIMESTAMP,
    PRIMARY KEY (post_id, created_at)
) WITH CLUSTERING ORDER BY (created_at ASC);
```

#### Feed Cache Structure (Redis)
```
Key:   feed:{user_id}
Type:  Sorted Set (ZSET)
Score: timestamp (or ranking score)
Value: post_id

ZADD feed:123 1679012345 "post_456"
ZADD feed:123 1679012400 "post_789"

ZREVRANGE feed:123 0 19    → Get top 20 posts (most recent first)
```

#### Key Interview Points
● **Fan-out on Write vs Read** — The hybrid approach is the real answer. Know the celebrity problem.
● **Social graph** — Can use adjacency list in MySQL or a graph DB (Neo4j) for complex queries like "mutual friends."
● **Sharding strategy** — Shard posts by user_id (all posts of a user on same shard). Shard feed cache by user_id.
● **Hot partition** — Celebrity posts can overload one partition. Solution: replicate hot data, or use separate handling.
● **Consistency** — Feed is eventually consistent (slight delay in seeing a new post is acceptable). Likes/comments can be eventually consistent too.
● **Photo storage** — Never store images in the database. Use object storage (S3) and serve via CDN.

---
---

## 15. Cloud Migration System Design

### What It Does
● Migrates an existing on-premise application (monolith or distributed) to a cloud platform (AWS, Azure, GCP).
● Involves moving infrastructure, data, applications, and services with minimal downtime and zero data loss.

---

### Migration Strategies (The 6 R's)

| Strategy | What It Means | When to Use |
|----------|--------------|-------------|
| **Rehost (Lift & Shift)** | Move as-is to cloud VMs (EC2). No code changes. | Quick migration, legacy apps, tight deadline |
| **Replatform (Lift & Reshape)** | Minor optimizations (e.g., switch to managed DB like RDS). No major code changes. | Want some cloud benefits without full rewrite |
| **Repurchase** | Replace with SaaS (e.g., move CRM to Salesforce). | Off-the-shelf solution available |
| **Refactor (Re-architect)** | Rewrite as cloud-native (microservices, containers, serverless). | Long-term scalability, performance needs |
| **Retire** | Decommission the application (no longer needed). | Redundant or unused systems |
| **Retain** | Keep on-premise (not ready to migrate). | Compliance, dependency, or cost reasons |

---

### HLD — Migration Architecture

```
Phase 1: Assessment & Planning
  ┌──────────────────────────────────────────┐
  │ Inventory all applications and databases  │
  │ Identify dependencies between services    │
  │ Choose migration strategy per application │
  │ Estimate cost and timeline               │
  └──────────────────────────────────────────┘

Phase 2: Infrastructure Setup (Cloud)
  ┌──────────────────────────────────────────┐
  │ VPC, Subnets, Security Groups            │
  │ IAM Roles and Policies                   │
  │ Managed services (RDS, ElastiCache, SQS) │
  │ CI/CD pipeline setup                     │
  │ Monitoring (CloudWatch, Prometheus)       │
  └──────────────────────────────────────────┘

Phase 3: Data Migration
  ┌──────────────────────────────────────────┐
  │ On-Premise DB ──► AWS DMS ──► Cloud DB   │
  │ (continuous replication until cutover)     │
  │ Validate data integrity (row counts,      │
  │  checksums, business rule validation)     │
  └──────────────────────────────────────────┘

Phase 4: Application Migration
  ┌──────────────────────────────────────────┐
  │ Deploy application on cloud infra         │
  │ Parallel run (both envs active)           │
  │ Route % traffic to cloud (canary)         │
  │ Monitor errors, latency, correctness      │
  └──────────────────────────────────────────┘

Phase 5: Cutover & Decommission
  ┌──────────────────────────────────────────┐
  │ 100% traffic to cloud                     │
  │ Final data sync                           │
  │ DNS switch                                │
  │ Decommission on-premise servers           │
  │ Post-migration validation                 │
  └──────────────────────────────────────────┘
```

---

### LLD Key Components

#### Data Migration Pattern (Zero Downtime)
```
Step 1: Full dump — Copy entire DB from on-premise to cloud (may take hours/days)
Step 2: CDC (Change Data Capture) — Continuously replicate changes happening on source during migration
Step 3: Validation — Compare source and target (row counts, checksums)
Step 4: Cutover — Stop writes on source, wait for CDC to drain, switch app to cloud DB

Tools: AWS DMS, Debezium (CDC), Oracle GoldenGate, pg_dump + logical replication

Timeline:
  t=0          t=6 hours         t=6h 5min      t=6h 10min
  |── Full Dump ──|── CDC running ──|── Cutover ──|── Live on Cloud ──►
  (source active)  (both active)   (brief freeze) (source off)
```

#### Monolith to Microservices (Strangler Fig Pattern)
```
Instead of rewriting everything at once, gradually replace pieces of the monolith:

┌────────────────────────────────────┐
│          MONOLITH                   │
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ Auth │ │Orders│ │Payments│      │    Step 1: Monolith handles everything
│  └──────┘ └──────┘ └───────┘       │
└────────────────────────────────────┘

       ▼ Extract Auth first

┌────────────────────────────────────┐     ┌──────────────┐
│          MONOLITH                   │     │ Auth Service  │
│           ┌──────┐ ┌──────┐        │     │ (new, cloud)  │
│           │Orders│ │Payments│      │     └──────────────┘
│           └──────┘ └───────┘       │         Step 2: Auth extracted
└────────────────────────────────────┘

       ▼ Extract Orders next

┌────────────────────────────────────┐     ┌──────────────┐
│          MONOLITH                   │     │ Auth Service  │
│                    ┌──────┐        │     ├──────────────┤
│                    │Payments│      │     │ Order Service │
│                    └───────┘       │     └──────────────┘
└────────────────────────────────────┘         Step 3: Orders extracted

       ▼ Until monolith is empty and decommissioned
```

● Route requests via **API Gateway** — old endpoints go to monolith, migrated endpoints go to new microservice.
● Gradually shift traffic until monolith is empty.

#### Containerization (Docker + Kubernetes)
```
On-Premise (VMs):                    Cloud (Containers):
┌──────────────────┐                ┌──────────────────────────┐
│ VM 1: App Server │    ────►       │ Kubernetes Cluster        │
│ VM 2: App Server │                │  ┌─────┐ ┌─────┐ ┌─────┐│
│ VM 3: DB Server  │                │  │Pod 1│ │Pod 2│ │Pod 3││
└──────────────────┘                │  └─────┘ └─────┘ └─────┘│
                                    │  Auto-scaling, self-healing│
                                    └──────────────────────────┘

Benefits:
  ● Auto-scaling based on traffic
  ● Self-healing (restart failed containers automatically)
  ● Rolling deployments (zero-downtime deploys)
  ● Resource efficiency (multiple containers on one VM)
```

#### Key Interview Points
● **Zero-downtime migration** — Use CDC (Change Data Capture) for continuous replication. Cutover window should be seconds, not hours.
● **Strangler Fig Pattern** — Incrementally replace monolith components. Safest approach for large systems.
● **Dual-write problem** — During migration, both old and new systems may be active. Ensure idempotency and data consistency.
● **Rollback plan** — Always have the ability to switch back to on-premise if something goes wrong.
● **Cost management** — Cloud can be expensive. Use reserved instances, auto-scaling, spot instances, and right-sizing.
● **Security** — Encrypt data in transit (TLS) and at rest (KMS). IAM policies for least-privilege access. VPC for network isolation.
● **Compliance** — Financial services (JP Morgan) require data residency (data stays in specific regions), audit trails, and encryption standards.

---
---

## 16. Flash Sale System (like Amazon Lightning Deals)

### What It Does
● Sells a limited quantity of items at a discounted price for a short time window.
● Thousands to millions of users compete to buy a few hundred/thousand items simultaneously.
● Must prevent overselling, handle massive traffic spikes, and ensure fairness.

---

### Functional Requirements
● Admin creates a flash sale (product, discounted price, quantity, start time, end time).
● Users see countdown timer and can purchase when sale starts.
● Each user can buy a limited quantity (e.g., max 1 per user).
● Inventory must be accurate — never sell more items than available.
● Show real-time stock availability.
● Process payment and confirm order.

### Non-Functional Requirements
● Handle **extreme traffic spikes** — 10x-100x normal traffic within seconds.
● **No overselling** — if 1000 items are available, exactly 1000 orders (not 1001).
● Low latency — purchase flow must complete in < 1 second.
● Fairness — first-come-first-served.
● System should degrade gracefully (static pages, queues) rather than crash.

---

### Capacity Estimation
● Flash sale: 1000 items available
● Users attempting to buy: ~1 Million within first 10 seconds
● QPS spike: 1M / 10 = 100,000 requests/second (100x normal traffic)
● Read:Write ratio: ~100:1 (most users just checking if sale is still active)

---

### HLD Architecture

```
                    ┌───────────────┐
     Users ────────►│  CDN / Static  │  (serve product page, images, countdown timer)
                    │  Pages         │
                    └───────┬───────┘
                            │ (API calls only for purchase)
                    ┌───────▼───────┐
                    │  API Gateway   │  (rate limiting, authentication)
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │  Request Queue │  (Kafka / SQS — absorb traffic spike)
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐     ┌──────────────┐
                    │  Order Service │────►│   Redis       │  (inventory counter)
                    │  (process      │     │  (atomic      │
                    │   purchases)   │     │   DECR)       │
                    └───────┬───────┘     └──────────────┘
                            │
                    ┌───────▼───────┐
                    │  Payment       │
                    │  Service       │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │  Order DB      │
                    │  (MySQL)       │
                    └───────────────┘
```

---

### LLD Key Components

#### Inventory Management (The Core Problem)

**Problem:** 1 million users hitting "Buy" simultaneously for 1000 items. How to ensure exactly 1000 orders?

**Solution: Redis Atomic DECR**
```
Before sale starts:
  SET flash_sale:product_123:stock 1000     (initialize stock count)

When user clicks "Buy":
  remaining = DECR flash_sale:product_123:stock

  if remaining >= 0:
      → Purchase ALLOWED (proceed to payment)
  else:
      → SOLD OUT (reject immediately)
      INCR flash_sale:product_123:stock      (restore the over-decrement)
```

● Redis `DECR` is **atomic** — even with 100K concurrent requests, no race condition.
● No database lock needed. No distributed lock needed. Single Redis command.
● This is the key answer interviewers want.

#### Lua Script for Multi-Check (Stock + Per-User Limit)
```lua
-- Atomic: check stock AND per-user limit in one operation
local stock_key = KEYS[1]           -- flash_sale:product_123:stock
local user_key = KEYS[2]            -- flash_sale:product_123:user:456
local max_per_user = tonumber(ARGV[1])  -- 1

-- Check if user already purchased
local user_count = tonumber(redis.call('GET', user_key) or "0")
if user_count >= max_per_user then
    return -1   -- user already bought max allowed
end

-- Check and decrement stock
local stock = tonumber(redis.call('GET', stock_key) or "0")
if stock <= 0 then
    return 0    -- sold out
end

redis.call('DECR', stock_key)
redis.call('INCR', user_key)
return stock - 1  -- remaining stock (success)
```

#### Request Queue (Absorbing Traffic Spike)
```
Without queue:
  1M requests → directly hit Order Service → service crashes

With queue:
  1M requests → API Gateway → Kafka/SQS queue → Order Service consumes at safe rate (10K/sec)

Only first ~1000 requests will succeed (stock runs out).
Remaining requests get "SOLD OUT" response from Redis check (never even reach Order Service).
```

#### Traffic Control Strategies
```
1. CDN for Static Content
   ● Product page, images, countdown timer — all served from CDN
   ● Only the "Buy" button triggers an API call
   ● Reduces 90% of traffic before it reaches backend

2. Rate Limiting
   ● Max 1 purchase request per user per second
   ● Block bots and automated scripts

3. Virtual Waiting Room
   ● When traffic exceeds threshold, users enter a queue
   ● "You are #4523 in line, estimated wait: 2 minutes"
   ● Requests released to backend at a controlled rate

4. Pre-validation Layer
   ● Before hitting Order Service, check Redis: is stock > 0?
   ● If stock = 0, return "SOLD OUT" immediately (no further processing)

5. Auto-scaling
   ● Pre-scale servers before the sale starts (scheduled scaling)
   ● Don't rely on reactive auto-scaling — it's too slow for flash sales
```

#### Purchase Flow (Step by Step)
```
1. User clicks "Buy Now"
2. API Gateway: authenticate user, rate limit check
3. Pre-check: Redis DECR stock → if < 0, return "SOLD OUT"
4. Per-user check: has this user already purchased? (Redis)
5. Create order in DB with status = PENDING
6. Call Payment Service → process payment
7. If payment success → update order to CONFIRMED, publish event
8. If payment fails → update order to FAILED, INCR stock back in Redis
9. Return confirmation to user

Payment timeout (e.g., 10 minutes):
  ● If user doesn't complete payment, release reserved stock
  ● Scheduled job checks PENDING orders older than 10 min → cancel and restore stock
```

#### Database Schema
```sql
CREATE TABLE flash_sales (
    sale_id       BIGINT PRIMARY KEY,
    product_id    BIGINT NOT NULL,
    sale_price    DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    total_stock   INT NOT NULL,
    remaining_stock INT NOT NULL,
    max_per_user  INT DEFAULT 1,
    start_time    TIMESTAMP NOT NULL,
    end_time      TIMESTAMP NOT NULL,
    status        VARCHAR(20) DEFAULT 'SCHEDULED'   -- SCHEDULED, ACTIVE, ENDED
);

CREATE TABLE flash_sale_orders (
    order_id    BIGINT PRIMARY KEY,
    sale_id     BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    quantity    INT NOT NULL,
    amount      DECIMAL(10,2) NOT NULL,
    status      VARCHAR(20) DEFAULT 'PENDING',       -- PENDING, CONFIRMED, FAILED, CANCELLED
    created_at  TIMESTAMP,
    paid_at     TIMESTAMP
);
CREATE UNIQUE INDEX idx_sale_user ON flash_sale_orders(sale_id, user_id);
```

#### Key Interview Points
● **Redis atomic DECR** — This is THE answer for preventing overselling. Single atomic operation, no locks.
● **Never hit the database for stock check** — Use Redis. DB is too slow for 100K QPS.
● **CDN everything possible** — Product page, images, timer. Only the purchase API hits backend.
● **Pre-scale, don't reactive-scale** — Flash sale time is known in advance. Scale up servers 30 minutes before.
● **Idempotency** — If user double-clicks "Buy", the second request should be rejected (unique constraint on sale_id + user_id).
● **Stock restoration** — If payment fails or times out, INCR stock back in Redis. Run a reconciliation job to sync Redis with DB.
● **Bot prevention** — CAPTCHA before purchase, device fingerprinting, rate limiting per IP/user.
● **Fairness** — FIFO queue ensures first-come-first-served. No priority based on who has faster internet.

---
---

## 17. Quick Reference — All System Designs Summary

| # | System | Key Concept to Remember |
|---|--------|------------------------|
| 1 | URL Shortener | Base62 encoding, 301 vs 302 redirect, cache-heavy |
| 2 | Rate Limiter | Token Bucket algorithm, Redis Lua for atomicity |
| 3 | Foundations | CAP theorem, ACID vs BASE, Consistent Hashing |
| 4 | Notification System | Multi-channel (Push/Email/SMS), separate queues per channel |
| 5 | Payment System | Double-entry ledger, idempotency key, Saga pattern |
| 6 | Stock Trading | In-memory order book, price-time priority matching |
| 7 | Distributed Cache | Consistent hashing, LRU eviction, cache stampede |
| 8 | Message Queue (Kafka) | Topics, partitions, consumer groups, at-least-once |
| 9 | API Gateway | Routing, auth, rate limiting, SSL termination |
| 10 | Task Scheduler | Distributed lock, missed job recovery, dead letter queue |
| 11 | Distributed Patterns | Circuit Breaker, Saga, Event Sourcing, CQRS, Idempotency |
| 12 | Interview Checklist | Requirements → HLD → LLD → Scaling |
| 13 | Netflix | Adaptive bitrate streaming, CDN, chunked video, recommendations |
| 14 | Facebook/Instagram | Fan-out on Write vs Read (hybrid), feed ranking, social graph |
| 15 | Cloud Migration | 6 R's, Strangler Fig, CDC for zero-downtime, containerization |
| 16 | Flash Sale | Redis atomic DECR, pre-scaling, virtual waiting room, CDN static pages |
