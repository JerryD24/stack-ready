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
- The **optimizer** uses table **statistics** (row counts, value distribution) to choose indexes and join order. Stale stats → bad plans (run `ANALYZE`).
- The **executor** runs the chosen plan: index seek vs full scan, join algorithm (nested loop / hash / merge), sort, aggregate.
- Your job: give the optimizer good indexes and stats, and write queries it can optimize.

---

## 2. Indexing

An index is a sorted data structure (usually a **B-tree**) that turns an O(n) scan into an O(log n) seek.

**Key concepts:**
- **Clustered index** (PK in InnoDB) — table rows stored in PK order; one per table. Random PKs (UUIDv4) fragment it — prefer sequential/UUIDv7/Snowflake.
- **Secondary index** — separate structure pointing back to the row (PK).
- **Composite index** — multi-column; **leftmost-prefix rule**: `INDEX(a,b,c)` helps `WHERE a`, `WHERE a,b`, `WHERE a,b,c` — **not** `WHERE b` alone.
- **Covering index** — index includes all columns the query needs → answered from the index alone (no table lookup).
- **Cardinality** — high-cardinality columns (email) index well; low-cardinality (boolean) often don't.

```sql
CREATE INDEX idx_orders_cust_created ON orders(customer_id, created_at);
-- helps: WHERE customer_id = ? ORDER BY created_at
```
**Costs:** indexes slow writes (every insert/update maintains them) and use space. Index for your **read patterns**, don't over-index.

---

## 3. EXPLAIN Plans

`EXPLAIN` (and `EXPLAIN ANALYZE` for actual timings) shows the optimizer's plan — the single most important tuning tool.
```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 42 ORDER BY created_at DESC;
```
What to look for:
- **Seq Scan / Full Table Scan** on a big table in a filtered query → missing index.
- **Index Scan / Index Seek** → good.
- **Rows estimated vs actual** wildly off → stale statistics.
- **Sort / Hash** spilling to disk → memory or missing index for `ORDER BY`.
- Join type: **Nested Loop** (good for small), **Hash Join** (large unsorted), **Merge Join** (sorted).

---

## 4. The N+1 Problem

The most common ORM performance bug: 1 query to fetch a list + N queries to fetch each item's relation.
```java
// N+1: 1 query for orders, then 1 per order for items
List<Order> orders = repo.findAll();
for (Order o : orders) o.getItems().size();   // lazy load fires a query EACH time
```
**Fixes:**
- **JOIN FETCH** (JPQL): `SELECT o FROM Order o JOIN FETCH o.items`.
- **`@EntityGraph`** to declare a fetch plan on the repository method.
- **Batch fetching** (`@BatchSize` / `hibernate.default_batch_fetch_size`) → loads relations in `IN (...)` batches.
- Detect with SQL logging / Hibernate statistics / an APM. This is a top interview "find the bug" item.

---

## 5. Query Optimization

- **Select only needed columns** (`SELECT col1, col2`, not `SELECT *`) — enables covering indexes, less I/O.
- **Avoid functions on indexed columns** in `WHERE` (`WHERE YEAR(created_at)=2026` can't use the index) — rewrite as a range.
- **Keyset pagination** instead of large `OFFSET` (`WHERE id > :lastId LIMIT 20`) — `OFFSET 100000` scans and discards 100k rows.
- Prefer **`EXISTS`** over `IN (subquery)` for large sets; avoid correlated subqueries when a join works.
- **Batch** inserts/updates instead of row-by-row.
- Watch **implicit type casts** (string vs int column) that disable indexes.
- Keep transactions short to reduce lock time.

---

## 6. Transactions & Isolation

**ACID:** Atomicity, Consistency, Isolation, Durability.

**Isolation levels** trade consistency for concurrency:
| Level | Dirty read | Non-repeatable read | Phantom read |
|-------|-----------|---------------------|--------------|
| READ UNCOMMITTED | ✅ possible | ✅ | ✅ |
| READ COMMITTED (PG default) | ❌ | ✅ | ✅ |
| REPEATABLE READ (MySQL default) | ❌ | ❌ | ✅ (PG/InnoDB largely prevent) |
| SERIALIZABLE | ❌ | ❌ | ❌ (as if serial, costliest) |

- **Dirty read**: see uncommitted data. **Non-repeatable**: same row changes between reads. **Phantom**: new rows match a re-run query.
- Most apps run **READ COMMITTED**; bump to SERIALIZABLE only for critical invariants. **MVCC** (PG/InnoDB) gives readers consistent snapshots without blocking writers.

---

## 7. Optimistic vs Pessimistic Locking

**Optimistic** — assume no conflict; detect at commit via a **version** column.
```java
@Version private Long version;     // JPA bumps & checks it; OptimisticLockException on conflict
```
- Best for **low-contention**, read-heavy data; no DB locks held; conflicts → retry.

**Pessimistic** — lock the row up front.
```sql
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;   -- exclusive lock until commit
```
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
Account findById(Long id);
```
- Best for **high-contention**, must-not-conflict (e.g., decrementing inventory/balance). Risk: lock waits/deadlocks; keep the transaction short.

> Rule: optimistic for "rarely collides", pessimistic for "must serialize". For hot counters consider atomic SQL (`UPDATE ... SET qty = qty - 1 WHERE qty > 0`).

---

## 8. Connection Pooling & HikariCP

Opening a DB connection is expensive; a **pool** reuses a fixed set. **HikariCP** is the Spring Boot default.
```yaml
spring.datasource.hikari:
  maximum-pool-size: 10          # NOT huge — see below
  minimum-idle: 10
  connection-timeout: 3000       # ms to wait for a connection -> fail fast
  max-lifetime: 1800000
  leak-detection-threshold: 20000
```
- **Pool sizing myth:** bigger isn't better. A good starting point is `connections ≈ (cores * 2) + effective_spindles`; often **10-20** beats 100. Too many connections thrash the DB.
- Pool exhaustion symptom: requests block waiting for a connection (latency spike) — check Hikari `pending` metric.
- The DB's `max_connections` must exceed total pool size across all instances — a hidden scaling limit.

---

## 9. Read Replicas

Scale **reads** by replicating the primary to read-only replicas.
```
        writes
Client ───────► Primary ──async replication──► Replica 1 (reads)
        reads ◄───────────────────────────────► Replica 2 (reads)
```
- Route writes to **primary**, reads to **replicas** (read/write splitting via `@Transactional(readOnly=true)` + a routing datasource, or a proxy like ProxySQL).
- **Replication lag**: replicas are slightly behind → a user may not "read their own write". Mitigate by reading from primary right after a write (read-your-writes) or sticky routing.
- Replicas help read scaling and HA (promote on primary failure); they do **not** scale writes.

---

## 10. Partitioning

Split one big table into smaller physical pieces **within one database** (same schema).
- **Range** (by date — great for time-series/log data; drop old partitions cheaply), **List**, **Hash**.
- Benefits: smaller indexes per partition, **partition pruning** (scan only relevant partitions), easy archival.
- Different from sharding: partitioning is one DB; sharding spans multiple DBs/servers.

```sql
CREATE TABLE events (...) PARTITION BY RANGE (created_at);  -- monthly partitions
```

---

## 11. Sharding

Split data across **multiple databases/servers** to scale **writes** and storage beyond one machine.
- **Shard key** choice is everything — pick high-cardinality, evenly-distributed (e.g., `customer_id` hashed). A bad key → **hot shards**.
- **Strategies:** hash-based (even spread, hard to range-scan), range-based (range queries easy, risk hotspots), directory/lookup (flexible, extra hop).
- **Hard parts:** cross-shard joins/transactions (avoid — denormalize or app-side join), rebalancing when adding shards (**consistent hashing** helps), global unique IDs (**Snowflake**), cross-shard aggregation.
- Shard only when a single primary + replicas + caching is genuinely maxed — it adds major complexity.

---

## 12. SQL vs NoSQL & Denormalization

| | SQL (Postgres/MySQL) | NoSQL (Dynamo/Mongo/Cassandra) |
|--|----------------------|-------------------------------|
| Model | Relational, schema, joins | KV/document/wide-column |
| Consistency | Strong, ACID | Often eventual, tunable |
| Scale | Vertical + replicas + sharding | Horizontal by design |
| Best for | Transactions, complex queries | Huge scale, simple access patterns |

- Default to **SQL** for transactional systems; reach for NoSQL for massive scale with known access patterns (e.g., DynamoDB designed around queries).
- **Denormalize** (duplicate data to avoid joins) for read performance at scale — trading write complexity/consistency for read speed. Materialized views / read models (CQRS) are structured denormalization.

---

## 13. Migrations at Scale

Schema changes on big tables can lock/break things:
- Use **Flyway/Liquibase** for versioned, repeatable migrations.
- **Expand–contract (backward-compatible) pattern** for zero-downtime: add nullable column → backfill in batches → start writing both → switch reads → drop old. Never rename/drop in one step with live traffic.
- Adding an index on a large table can lock it — use `CREATE INDEX CONCURRENTLY` (Postgres) / online DDL (MySQL `ALGORITHM=INPLACE`).
- Backfill in **batches** to avoid long transactions and replication lag.

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
