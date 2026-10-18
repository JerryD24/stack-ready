# SQL at Scale — Deep Dive
### Query Tuning, Indexing, Replication, Sharding & Locking

---

## TABLE OF CONTENTS
1. [How a Query Executes](#1-how-a-query-executes)
2. [Indexing Deep Dive](#2-indexing)
3. [Reading EXPLAIN Plans](#3-explain-plans)
4. [The N+1 Problem](#4-n-plus-1)
5. [Query Optimization Techniques](#5-query-optimization)
6. [Transactions & Isolation Levels](#6-transactions-isolation)
7. [Optimistic vs Pessimistic Locking](#7-optimistic-pessimistic)
8. [Connection Pooling & HikariCP](#8-connection-pooling)
9. [Read Replicas & Read/Write Splitting](#9-read-replicas)
10. [Partitioning](#10-partitioning)
11. [Sharding](#11-sharding)
12. [SQL vs NoSQL & When to Denormalize](#12-sql-vs-nosql)
13. [Schema Migrations at Scale](#13-migrations)
14. [Interview Q&A](#14-interview-qa)

---

## 1. How a Query Executes

```
SQL text → Parser → Optimizer (picks a plan using statistics) → Executor → Storage engine
```

**Theory.** You write declarative SQL ("give me orders for customer 42"); the engine decides **how** to fetch it. Understanding this pipeline is the foundation of all tuning — you're not making queries faster by rewriting Java, you're helping the optimizer pick a cheaper plan.

**How it works (each stage).**
1. **Parser** — checks syntax, builds a parse tree. `SELCT` → error here.
2. **Optimizer** — generates candidate plans (index seek vs full scan, join order, join algorithm). Estimates cost using **statistics**: row counts, index selectivity, column histograms. Picks lowest estimated cost plan.
3. **Executor** — runs the plan: requests pages from storage, applies filters, joins, sorts, aggregates.
4. **Storage engine** (InnoDB, PostgreSQL heap) — B-tree index lookups, buffer pool (RAM cache for disk pages), WAL for durability.

- The **optimizer** uses table **statistics** (row counts, value distribution) to choose indexes and join order. Stale stats → bad plans (run `ANALYZE`).
- The **executor** runs the chosen plan: index seek vs full scan, join algorithm (nested loop / hash / merge), sort, aggregate.
- Your job: give the optimizer good indexes and stats, and write queries it can optimize.

**Example.** `SELECT * FROM orders WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20`
- Without index: Seq Scan on 10M rows → filter 42 → sort all matches → take 20. Cost: ~seconds.
- With `INDEX(customer_id, created_at)`: Index Seek to customer 42's rows (already sorted by date) → read first 20. Cost: ~milliseconds.

**Pitfall.** The optimizer is a cost-based **guess**. A plan that's optimal at 1K rows may be catastrophic at 10M rows after data growth — re-check plans after major data changes.

**Interview angle.** "Who decides to use an index?" → Not you explicitly (usually). The optimizer compares estimated cost of index seek vs sequential scan based on statistics. `FORCE INDEX` exists but is a last resort.

---

## 2. Indexing

An index is a sorted data structure (usually a **B-tree**) that turns an O(n) scan into an O(log n) seek.

**Theory.** Think of a book index vs reading every page. Without an index, the DB reads every row (full table scan). With a B-tree index on `customer_id`, it jumps to the right leaf pages in ~3-4 disk reads for a 10M-row table (log base ~1000 fanout).

**How it works (B-tree).** Balanced tree of pages. Root → internal nodes → leaf nodes containing `(key, pointer_to_row)`. Range queries (`WHERE created_at > '2026-01-01'`) walk consecutive leaf pages efficiently. Inserts/updates maintain balance — that's why writes on indexed columns cost extra I/O.

**Key concepts:**
- **Clustered index** (PK in InnoDB) — table rows stored in PK order on disk; one per table. Random PKs (UUIDv4) fragment it — prefer sequential/UUIDv7/Snowflake.
- **Secondary index** — separate structure pointing back to the row (PK). Lookup = index seek + **bookmark lookup** (fetch full row from clustered index).
- **Composite index** — multi-column; **leftmost-prefix rule**: `INDEX(a,b,c)` helps `WHERE a`, `WHERE a,b`, `WHERE a,b,c` — **not** `WHERE b` alone.
- **Covering index** — index includes all columns the query needs → answered from the index alone (no table lookup).
- **Cardinality** — high-cardinality columns (email) index well; low-cardinality (boolean) often don't.

```sql
CREATE INDEX idx_orders_cust_created ON orders(customer_id, created_at);
-- helps: WHERE customer_id = ? ORDER BY created_at
-- also helps: WHERE customer_id = ? AND created_at > '2026-01-01' (range on trailing column after equality on leading)
```

**Example (covering index).** Query: `SELECT customer_id, created_at, status FROM orders WHERE customer_id = 42`.
Index `(customer_id, created_at, status)` includes all columns → **Index Only Scan** — no table access. 10× faster on wide tables.

**Example (leftmost prefix failure).** Index `(customer_id, created_at)`. Query `WHERE created_at > '2026-06-01'` without `customer_id` → index unused (can't skip the leading column in the B-tree ordering).

**Costs:** indexes slow writes (every insert/update maintains them) and use space. Index for your **read patterns**, don't over-index.

**Interview angle.** "Why not index every column?" → Each index adds write amplification (5 indexes = 5 B-tree updates per INSERT) and storage. A 10-column index table can double disk usage.

---

## 3. EXPLAIN Plans

`EXPLAIN` (and `EXPLAIN ANALYZE` for actual timings) shows the optimizer's plan — the single most important tuning tool.

**Theory.** EXPLAIN is a **dry run** — it shows what the DB *would* do without always executing (standard EXPLAIN) or actually runs and reports real timings (`EXPLAIN ANALYZE` in PostgreSQL).

```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 42 ORDER BY created_at DESC;
```

**Example (reading output — PostgreSQL-style).**
```
Index Scan using idx_orders_cust_created on orders  (cost=0.43..8.45 rows=20 width=120) (actual time=0.05..0.12 rows=20 loops=1)
  Index Cond: (customer_id = 42)
Planning Time: 0.1 ms
Execution Time: 0.2 ms
```
Good: **Index Scan**, 20 rows, 0.2 ms total.

Bad pattern you'd see:
```
Seq Scan on orders  (cost=0.00..180000 rows=500000 width=120) (actual time=50..800 rows=500000 loops=1)
  Filter: (customer_id = 42)
  Rows Removed by Filter: 9500000
Sort  (cost=... rows=500000) (actual time=1200..1300 rows=20 loops=1)
  Sort Key: created_at DESC
  Sort Method: external merge  Disk: 25600kB
Execution Time: 1350 ms
```
Problems: full table scan (9.5M rows filtered), sort spilled to disk.

What to look for:
- **Seq Scan / Full Table Scan** on a big table in a filtered query → missing index.
- **Index Scan / Index Seek** → good.
- **Rows estimated vs actual** wildly off → stale statistics.
- **Sort / Hash** spilling to disk → memory or missing index for `ORDER BY`.
- Join type: **Nested Loop** (good for small), **Hash Join** (large unsorted), **Merge Join** (sorted).

**Pitfall.** EXPLAIN in dev with 1K rows shows Seq Scan (fast enough). Same query in prod with 10M rows takes 30s. Always test with production-scale data or at least realistic row counts.

**Interview angle.** Walk through a bad plan out loud: "Seq Scan means no usable index; 9.5M rows removed by filter means we're reading the whole table. Fix: composite index on (customer_id, created_at)."

---

## 4. The N+1 Problem

The most common ORM performance bug: 1 query to fetch a list + N queries to fetch each item's relation.

**Theory.** ORMs lazy-load associations by default. You fetch 100 orders in one query, then touching `order.getItems()` triggers a **separate SQL query per order** — 1 + 100 = 101 round-trips. Each round-trip adds ~1 ms (same DC) → 100 ms wasted on network alone, plus DB parse/plan overhead.

```java
// N+1: 1 query for orders, then 1 per order for items
List<Order> orders = repo.findAll();           // SELECT * FROM orders  (1 query)
for (Order o : orders) o.getItems().size();   // SELECT * FROM items WHERE order_id=?  (N queries)
```

**Example.** 50 orders on a page, each with 5 items. N+1 = 51 queries. With JOIN FETCH = 1 query returning 250 rows (some duplication of order columns). Page load: 51 × 2 ms = 102 ms vs 1 × 5 ms = 5 ms.

**Fixes:**
- **JOIN FETCH** (JPQL): `SELECT o FROM Order o JOIN FETCH o.items`.
- **`@EntityGraph`** to declare a fetch plan on the repository method.
- **Batch fetching** (`@BatchSize` / `hibernate.default_batch_fetch_size`) → loads relations in `IN (...)` batches.
- Detect with SQL logging / Hibernate statistics / an APM. This is a top interview "find the bug" item.

**How batch fetching works.** With `@BatchSize(25)`: first access to order 1's items triggers `SELECT * FROM items WHERE order_id IN (1,2,3,...,25)` — loads items for 25 orders at once. 50 orders → 2 batch queries instead of 50.

**Pitfall.** JOIN FETCH with OneToMany on a large collection → **cartesian product explosion** (100 orders × 50 items each = 5000 rows in one result). Use batch fetch or a separate query with `@EntityGraph(type = LOAD)`.

**Interview angle.** "How do you find N+1 in production?" → Enable Hibernate `show_sql` / SQL logging in staging, or APM tooling showing query count per endpoint. An endpoint with 1 + N query pattern is the smoking gun.

---

## 5. Query Optimization

**Theory.** Query tuning is about reducing **rows examined**, **round-trips**, and **lock duration**. Small rewrites often beat hardware upgrades.

- **Select only needed columns** (`SELECT col1, col2`, not `SELECT *`) — enables covering indexes, less I/O.
- **Avoid functions on indexed columns** in `WHERE` (`WHERE YEAR(created_at)=2026` can't use the index) — rewrite as a range.
- **Keyset pagination** instead of large `OFFSET` (`WHERE id > :lastId LIMIT 20`) — `OFFSET 100000` scans and discards 100k rows.
- Prefer **`EXISTS`** over `IN (subquery)` for large sets; avoid correlated subqueries when a join works.
- **Batch** inserts/updates instead of row-by-row.
- Watch **implicit type casts** (string vs int column) that disable indexes.
- Keep transactions short to reduce lock time.

**Example (sargable rewrite).** Bad: `WHERE YEAR(created_at) = 2026` — function on column → index ignored.
Good: `WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01'` — range scan on index.

**Example (keyset pagination).** Page 5000 of a feed with `OFFSET 100000 LIMIT 20`: DB reads 100,020 rows, returns 20. With keyset: `WHERE id > 12345678 ORDER BY id LIMIT 20` — reads ~20 rows regardless of page depth.

```sql
-- Offset pagination — degrades linearly with page number
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 100000;

-- Keyset (cursor) pagination — constant cost per page
SELECT * FROM orders WHERE id > :lastSeenId ORDER BY id LIMIT 20;
```

**Example (batch insert).** 10,000 rows: 10,000 individual INSERTs = 10,000 round-trips. One `INSERT INTO ... VALUES (...), (...), ...` in batches of 500 = 20 round-trips.

**Interview angle.** "Why is OFFSET slow?" → The DB must scan and skip all preceding rows. Page 1 costs 20 row reads; page 5000 costs 100,020 row reads.

---

## 6. Transactions & Isolation

**ACID:** Atomicity, Consistency, Isolation, Durability.

**Theory.** Isolation levels control **what anomalies concurrent transactions can see**. Higher isolation = fewer anomalies but more locking/retries and lower throughput.

**Isolation levels** trade consistency for concurrency:
| Level | Dirty read | Non-repeatable read | Phantom read |
|-------|-----------|---------------------|--------------|
| READ UNCOMMITTED | ✅ possible | ✅ | ✅ |
| READ COMMITTED (PG default) | ❌ | ✅ | ✅ |
| REPEATABLE READ (MySQL default) | ❌ | ❌ | ✅ (PG/InnoDB largely prevent) |
| SERIALIZABLE | ❌ | ❌ | ❌ (as if serial, costliest) |

- **Dirty read**: see uncommitted data. **Non-repeatable**: same row changes between reads. **Phantom**: new rows match a re-run query.
- Most apps run **READ COMMITTED**; bump to SERIALIZABLE only for critical invariants. **MVCC** (PG/InnoDB) gives readers consistent snapshots without blocking writers.

**How it works (MVCC).** Each transaction sees a **snapshot** of the database at a point in time. Writers create new row versions; readers see old versions until commit. No shared read locks needed — readers don't block writers (unlike old-school 2PL).

**Example (non-repeatable read at READ COMMITTED).**
1. Tx A: `SELECT balance FROM accounts WHERE id=1` → 100.
2. Tx B: `UPDATE accounts SET balance=50 WHERE id=1`; COMMIT.
3. Tx A: `SELECT balance FROM accounts WHERE id=1` → 50 (different from step 1 — non-repeatable).

At REPEATABLE READ, Tx A would still see 100 throughout its lifetime.

**Pitfall.** Long-running transactions at REPEATABLE READ hold old row versions → **bloat** (PostgreSQL) or undo log growth (InnoDB) → slower queries and vacuum pressure.

**Interview angle.** "Default isolation in MySQL vs PostgreSQL?" → MySQL InnoDB: REPEATABLE READ. PostgreSQL: READ COMMITTED. Know what your stack defaults to.

---

## 7. Optimistic vs Pessimistic Locking

**Theory.** Two strategies for concurrent updates to the same row. Choice depends on **contention frequency** and **cost of a conflict**.

**Optimistic** — assume no conflict; detect at commit via a **version** column.
```java
@Version private Long version;     // JPA bumps & checks it; OptimisticLockException on conflict
```
- Best for **low-contention**, read-heavy data; no DB locks held; conflicts → retry.

**How it works (optimistic).** Read row with `version=3`. Modify locally. On save: `UPDATE accounts SET balance=90, version=4 WHERE id=1 AND version=3`. If another tx already bumped version to 4, UPDATE affects 0 rows → `OptimisticLockException` → app retries.

**Pessimistic** — lock the row up front.
```sql
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;   -- exclusive row lock until COMMIT/ROLLBACK
```
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
Account findById(Long id);
```
- Best for **high-contention**, must-not-conflict (e.g., decrementing inventory/balance). Risk: lock waits/deadlocks; keep the transaction short.

**Example (inventory).** 2 users buy last item simultaneously.
- Optimistic: both read `qty=1, version=5`. Both try update. One succeeds (version→6), other fails → show "sold out" on retry.
- Pessimistic: second user's `FOR UPDATE` blocks until first commits → sees `qty=0` → reject immediately.

**Example (atomic SQL — often best for counters).** `UPDATE inventory SET qty = qty - 1 WHERE product_id = 42 AND qty > 0` — single atomic statement, no explicit lock in app code. `rowsAffected == 0` means sold out.

> Rule: optimistic for "rarely collides", pessimistic for "must serialize". For hot counters consider atomic SQL (`UPDATE ... SET qty = qty - 1 WHERE qty > 0`).

**Pitfall (pessimistic).** Holding `FOR UPDATE` while calling an external payment API (2–5 s) blocks all other purchases of that item. Lock only around the DB update, not external I/O.

**Interview angle.** "Lost update problem?" → Two reads, two writes, last write wins. Fix: optimistic version, pessimistic lock, or atomic `UPDATE ... SET x = x + 1`.

---

## 8. Connection Pooling & HikariCP

Opening a DB connection is expensive; a **pool** reuses a fixed set. **HikariCP** is the Spring Boot default.

**Theory.** Creating a TCP connection + TLS + DB auth + session setup costs **~10–50 ms**. At 1000 req/sec, opening a new connection per request would spend all time on handshakes. A pool keeps N connections warm and **lends** them to threads for the duration of a query/transaction.

```yaml
spring.datasource.hikari:
  maximum-pool-size: 10          # NOT huge — see below
  minimum-idle: 10
  connection-timeout: 3000       # ms to wait for a connection -> fail fast
  max-lifetime: 1800000          # recycle connections before DB/firewall kills them
  leak-detection-threshold: 20000  # log if connection held > 20s (debugging leaks)
```

**How it works.** Request thread calls `dataSource.getConnection()` → Hikari returns an idle pooled connection (or waits up to `connection-timeout`). Thread runs queries, calls `close()` → connection returns to pool (not actually closed).

- **Pool sizing myth:** bigger isn't better. A good starting point is `connections ≈ (cores * 2) + effective_spindles`; often **10-20** beats 100. Too many connections thrash the DB.
- Pool exhaustion symptom: requests block waiting for a connection (latency spike) — check Hikari `pending` metric.
- The DB's `max_connections` must exceed total pool size across all instances — a hidden scaling limit.

**Example (scaling limit).** 20 app instances × pool size 50 = 1000 connections. PostgreSQL `max_connections=100` → 900 requests fail or hang. Fix: reduce pool to 5 per instance (100 total) or use PgBouncer connection multiplexer.

**Example (Little's Law intuition).** If each query takes 10 ms and you have 10 connections, max throughput ≈ 10 / 0.01 = 1000 queries/sec from that pool. More connections don't help if DB CPU is already saturated.

**Pitfall.** Connection leak (forgetting `close()` in non-Spring code) → pool drains → all threads block at `getConnection()`. `leak-detection-threshold` catches this in dev.

**Interview angle.** "Why not pool size = number of threads?" → DB server has limited CPU; 200 connections mostly wait on locks and I/O, wasting memory on both sides.

---

## 9. Read Replicas

Scale **reads** by replicating the primary to read-only replicas.

**Theory.** Write scaling hits a ceiling on one primary (single-node WAL flush rate, ~5K–20K writes/sec depending on hardware). Reads often dominate (10:1 or 100:1 ratio) — replicas copy the primary's WAL/binlog and serve read queries, multiplying read capacity.

```
        writes
Client ───────► Primary ──async replication──► Replica 1 (reads)
        reads ◄───────────────────────────────► Replica 2 (reads)
```

- Route writes to **primary**, reads to **replicas** (read/write splitting via `@Transactional(readOnly=true)` + a routing datasource, or a proxy like ProxySQL).
- **Replication lag**: replicas are slightly behind → a user may not "read their own write". Mitigate by reading from primary right after a write (read-your-writes) or sticky routing.
- Replicas help read scaling and HA (promote on primary failure); they do **not** scale writes.

**How it works.** Primary commits write → records change in WAL → ships to replicas → replicas replay WAL → data available for reads (typically **10 ms–few seconds** behind under load).

**Example (read-your-writes).** User updates profile → POST goes to primary. Immediately GET profile → route to primary (or same-session sticky replica). Other users' reads can hit replicas (eventual consistency OK).

**Example (lag under load).** Bulk backfill updates 10M rows → replica lag spikes to 60s. Users on replica see stale data for a minute. Pause backfill or throttle; route critical reads to primary during backfill.

**Pitfall.** `@Transactional(readOnly=true)` on a method that accidentally triggers a lazy-load write (some ORMs) → routed to replica → error or silent failure. Audit read-only transaction boundaries.

**Interview angle.** "Can replicas scale writes?" → No — all writes still go to one primary. Replicas only multiply read throughput.

---

## 10. Partitioning

Split one big table into smaller physical pieces **within one database** (same schema).

**Theory.** A 500M-row table has a 500M-row index — inserts slow down, scans get expensive, maintenance (VACUUM, index rebuild) takes hours. Partitioning splits it into manageable chunks the optimizer can **prune**.

- **Range** (by date — great for time-series/log data; drop old partitions cheaply), **List**, **Hash**.
- Benefits: smaller indexes per partition, **partition pruning** (scan only relevant partitions), easy archival.
- Different from sharding: partitioning is one DB; sharding spans multiple DBs/servers.

```sql
CREATE TABLE events (
    id BIGSERIAL,
    created_at TIMESTAMP NOT NULL,
    payload JSONB
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_06 PARTITION OF events
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
```

**How it works (pruning).** Query: `WHERE created_at BETWEEN '2026-06-15' AND '2026-06-20'`. Optimizer scans only `events_2026_06` — ignores other monthly partitions. 500M total rows but only ~15M in June partition examined.

**Example (archival).** Retention policy: keep 12 months. `DROP TABLE events_2025_06` — instant metadata operation vs `DELETE FROM events WHERE created_at < ...` locking millions of rows for hours.

**Pitfall.** Partition key must appear in WHERE clause for pruning. Query `WHERE user_id = 42` without `created_at` → scans **all** partitions → worse than no partitioning.

**Interview angle.** "Partitioning vs sharding?" → Partitioning = one database, one connection string, SQL joins still work across partitions. Sharding = multiple DB servers, app-level routing.

---

## 11. Sharding

Split data across **multiple databases/servers** to scale **writes** and storage beyond one machine.

**Theory.** When one primary + replicas + caching still can't handle write volume or disk size (typically **> few TB** or **> ~10K sustained writes/sec** depending on workload), you split data horizontally across independent DB instances. Each shard holds a subset of rows.

- **Shard key** choice is everything — pick high-cardinality, evenly-distributed (e.g., `customer_id` hashed). A bad key → **hot shards**.
- **Strategies:** hash-based (even spread, hard to range-scan), range-based (range queries easy, risk hotspots), directory/lookup (flexible, extra hop).
- **Hard parts:** cross-shard joins/transactions (avoid — denormalize or app-side join), rebalancing when adding shards (**consistent hashing** helps), global unique IDs (**Snowflake**), cross-shard aggregation.
- Shard only when a single primary + replicas + caching is genuinely maxed — it adds major complexity.

**Example (hash sharding).** 4 shards, shard key = `customer_id`. `shard = hash(customer_id) % 4`. Customer 42 always maps to shard 2. Order queries by customer_id hit one shard. Query all orders in date range → **fan-out to all 4 shards** + merge in app — expensive.

**Example (hot shard).** Shard by `country_code`. 90% of users in one country → one shard handles 90% of traffic while others idle. Fix: hash on `user_id` instead.

**How rebalancing works.** Adding shard 5 to a 4-shard `hash % 4` setup remaps ~80% of keys. **Consistent hashing** limits movement to ~1/N of keys when adding node N+1.

**Interview angle.** "When to shard?" → Last resort after exhausting vertical scale, read replicas, caching, connection pooling, query tuning, and partitioning. First question should always be "can we avoid sharding?"

---

## 12. SQL vs NoSQL & Denormalization

| | SQL (Postgres/MySQL) | NoSQL (document/KV/wide-column stores) |
|--|----------------------|----------------------------------------|
| Model | Relational, schema, joins | KV/document/wide-column |
| Consistency | Strong, ACID | Often eventual, tunable |
| Scale | Vertical + replicas + sharding | Horizontal by design |
| Best for | Transactions, complex queries | Huge scale, simple access patterns |

- Default to **SQL** for transactional systems; reach for NoSQL for massive scale with known access patterns (e.g., a key-value store designed around `GetItem` by partition key + sort key).
- **Denormalize** (duplicate data to avoid joins) for read performance at scale — trading write complexity/consistency for read speed. Materialized views / read models (CQRS) are structured denormalization.

**How to decide (decision flow).**
1. Need multi-row ACID transactions across entities? → SQL.
2. Access pattern fixed and key-based at massive scale (millions of writes/sec)? → Consider wide-column or key-value NoSQL.
3. Schema changes weekly in early startup? → Document store offers flexibility; SQL with migrations also works if team prefers constraints.

**Example (denormalization).** Order listing page needs customer name. Normalized: `orders JOIN customers` on every list query. Denormalized: store `customer_name` on `orders` row at order creation. Write path copies name once; read path is single-table scan. Trade-off: if customer renames, historical orders show old name (usually acceptable).

**Pitfall.** Denormalizing without an update strategy → stale duplicated data. Pair denormalization with events (`CustomerRenamed` → update order snapshots) or accept immutability (order snapshot at purchase time).

**Interview angle.** "SQL vs NoSQL for a social feed?" → Hybrid: SQL for user accounts/transactions; Cassandra/Redis for feed timelines (write-heavy, simple key-based reads, eventual consistency OK).

---

## 13. Migrations at Scale

Schema changes on big tables can lock/break things:

**Theory.** On a table with 100M rows, `ALTER TABLE ADD COLUMN` or `CREATE INDEX` can lock writes for minutes to hours. Zero-downtime migration requires **backward-compatible, phased** changes — never big-bang renames/drops with live traffic.

- Use **Flyway/Liquibase** for versioned, repeatable migrations.
- **Expand–contract (backward-compatible) pattern** for zero-downtime: add nullable column → backfill in batches → start writing both → switch reads → drop old. Never rename/drop in one step with live traffic.
- Adding an index on a large table can lock it — use `CREATE INDEX CONCURRENTLY` (Postgres) / online DDL (MySQL `ALGORITHM=INPLACE`).
- Backfill in **batches** to avoid long transactions and replication lag.

**Example (expand–contract: rename `email` → `email_address`).**
1. **Expand:** `ADD COLUMN email_address VARCHAR(255) NULL` — deploy code that **writes both** columns.
2. **Backfill:** `UPDATE users SET email_address = email WHERE id BETWEEN ? AND ?` in batches of 10K — off-peak, throttled.
3. **Switch reads:** Deploy code reading from `email_address` (fallback to `email` if null).
4. **Contract:** `DROP COLUMN email` — only after all rows backfilled and code stable.

**How online index creation works (PostgreSQL).** `CREATE INDEX CONCURRENTLY` builds index in background without blocking writes (two-pass scan). Slower than regular CREATE INDEX but no production outage.

**Pitfall.** Backfill in one transaction: `UPDATE 100M rows` → huge WAL, replica lag hours, disk fill. Always batch with `COMMIT` between batches.

**Interview angle.** "Can you rename a column in production?" → Not directly. Use expand–contract over days/weeks with multiple deploys.

---

## 14. Interview Q&A

**Q1. How do you find and fix a slow query?**
`EXPLAIN ANALYZE` → look for full scans / bad row estimates / disk sorts → add the right index, rewrite to be sargable (no functions on indexed cols), select fewer columns, update stats.

**Q2. Explain the leftmost-prefix rule.**
A composite index `(a,b,c)` serves predicates on `a`, `a,b`, `a,b,c` (in order) but not `b` or `c` alone — because the index is sorted by `a` first.

**Q3. What is the N+1 problem and how do you fix it?**
One query for parents + one per child. Fix with JOIN FETCH, `@EntityGraph`, or batch fetching; detect via SQL logs.

**Q4. Optimistic vs pessimistic locking — when each?**
Optimistic (version column) for low-contention read-heavy data, conflicts retried. Pessimistic (`SELECT ... FOR UPDATE`) for high-contention must-not-conflict updates like balances.

**Q5. READ COMMITTED vs REPEATABLE READ?**
READ COMMITTED sees each statement's latest committed data (non-repeatable reads possible). REPEATABLE READ gives a stable snapshot for the transaction (prevents non-repeatable reads).

**Q6. Read replica caveat?**
Asynchronous replication lag means replicas can be stale — handle read-your-writes by routing post-write reads to the primary.

**Q7. Partitioning vs sharding?**
Partitioning splits a table within one DB (pruning, archival); sharding spreads data across multiple DBs/servers to scale writes — far more complex.

**Q8. How do you pick a shard key?**
High cardinality and even distribution to avoid hot shards; align with common query patterns; combine with consistent hashing for rebalancing and Snowflake IDs for uniqueness.

**Q9. Why not set HikariCP pool size to 100?**
More connections thrash the DB (context switching, lock contention); a small pool (10-20) usually gives better throughput. The DB's max_connections is a hard ceiling across instances.

**Q10. How do you add a column to a huge table with zero downtime?**
Expand–contract: add nullable column, backfill in batches, dual-write, switch reads, then drop the old — using online DDL / concurrent index creation.
