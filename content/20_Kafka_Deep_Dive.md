# Apache Kafka — Deep Dive
### Event Streaming for Backend Engineers | Interview-Grade Depth

---

## TABLE OF CONTENTS
1. [What Kafka Is & When to Use It](#1-what-kafka-is)
2. [Core Architecture — Brokers, Topics, Partitions](#2-core-architecture)
3. [Producers — Acks, Batching, Idempotence](#3-producers)
4. [Consumers & Consumer Groups](#4-consumers-consumer-groups)
5. [Rebalancing](#5-rebalancing)
6. [Offsets & Delivery Semantics](#6-offsets-delivery-semantics)
7. [Exactly-Once & Idempotent Producers](#7-exactly-once)
8. [Ordering Guarantees](#8-ordering-guarantees)
9. [Retry Topics & Dead-Letter Queues](#9-retry-dlq)
10. [The Outbox Pattern](#10-outbox-pattern)
11. [Backpressure & Flow Control](#11-backpressure)
12. [Lag Monitoring & Operations](#12-lag-monitoring)
13. [Schema Management](#13-schema-management)
14. [Spring Kafka in Practice](#14-spring-kafka)
15. [Design: 50,000 Events/Sec](#15-design-50k-events)
16. [Interview Q&A](#16-interview-qa)

---

## 1. What Kafka Is

**Theory.** Kafka is best understood as a **distributed commit log**, not a traditional message queue. Producers **append** records to the end of a log; consumers **read** from any position and advance their own bookmark (offset). Nothing is deleted when you read — retention is time- or size-based (e.g., 7 days), so multiple consumers can replay history independently.

**Analogy.** Think of Kafka like a DVR for your business events: producers record episodes (order placed, payment captured); different consumer groups can watch the same episodes on their own schedule, pause, rewind, or catch up later. A traditional queue is more like a pipe — message consumed once and gone.

**How it works — mental model.**
```
Producer writes:  [event1][event2][event3] → topic partition (append-only)
Consumer A reads from offset 0 → 1 → 2 (its own cursor)
Consumer B (different group) also reads from 0 → independent cursor
```

**Example — when to choose Kafka.** An order service publishes `OrderCreated`. Billing, analytics, and shipping services each consume the same stream in their own consumer group — no point-to-point fan-out wiring required.

**Pitfall.** Don't use Kafka for synchronous request/response ("call payment and wait for result in 200ms"). Use HTTP/gRPC for that; use Kafka for async decoupling and event history.

**Interview angle.** "Kafka vs queue" — log vs queue, pull vs push, replay vs consume-and-delete, throughput vs routing flexibility.

Kafka is a **distributed, append-only, durable commit log** used as an event-streaming platform. Producers append events to topics; consumers read them at their own pace. Unlike a traditional queue, **reading does not delete** — events are retained by time/size, and many independent consumer groups can read the same data.

**Use it for:** decoupling services, event-driven architecture, stream processing, log aggregation, high-throughput ingestion, replayable event history.
**Not for:** request/response RPC, tiny low-throughput needs, or when you need per-message TTL/priority (use a queue like RabbitMQ/SQS).

| Kafka | Traditional MQ (RabbitMQ/SQS) |
|-------|-------------------------------|
| Log (retained, replayable) | Queue (consumed = gone) |
| Pull-based consumers | Often push-based |
| Ordered per partition | Ordering harder |
| Massive throughput | Lower throughput, richer routing |

---

## 2. Core Architecture

**Theory.** A Kafka **cluster** is 3+ **brokers** (servers) for fault tolerance. Data is organized into **topics** (e.g., `orders`), each split into **partitions** for parallelism. Each partition is an ordered, immutable sequence identified by **offset** (0, 1, 2, …).

**How it works — write path step by step.**
1. Producer sends record `{key: "order-42", value: {...}}` to topic `orders`.
2. Partitioner computes `hash("order-42") % 3` → partition 1.
3. Broker 2 is **leader** for partition 1; it appends to local log segment on disk.
4. Follower replicas on brokers 1 and 3 pull data from leader (replication).
5. When all **ISR** (in-sync replicas) acknowledge, leader responds success to producer.

**How it works — read path.**
1. Consumer in group `billing` is assigned partition 1.
2. It tracks committed offset (e.g., 847).
3. `poll()` fetches records from offset 847 onward.
4. After processing, commits offset 850 → next poll starts at 850.

**Example — 3 brokers, topic `orders`, 3 partitions, RF=3:**
```
Broker 1:  P0 leader, P1 follower, P2 follower
Broker 2:  P1 leader, P2 follower, P0 follower
Broker 3:  P2 leader, P0 follower, P1 follower
```
If Broker 2 dies, a follower in ISR for each affected partition is elected new leader — producers/consumers reconnect automatically.

**Pitfall.** Partition count is fixed at topic creation (increasing partitions is possible but reorders keyed messages). Plan partition count for expected throughput and max consumer parallelism upfront.

**Interview angle.** "Why partitions?" — ordering + parallelism unit. "What is ISR?" — only caught-up replicas can become leader, preventing data loss on failover.

```
Topic "orders"  (split into partitions for parallelism)
 ├── Partition 0:  [m0][m1][m2][m3]...   (ordered, immutable log)
 ├── Partition 1:  [m0][m1][m2]...
 └── Partition 2:  [m0][m1]...
Each partition has 1 leader + N replicas across brokers.
```
- **Broker** — a Kafka server; a cluster is many brokers.
- **Topic** — a named stream, split into **partitions** (the unit of parallelism & ordering).
- **Partition** — an ordered, immutable sequence; each record has an **offset**.
- **Replication factor** — copies per partition (e.g., RF=3). One **leader** handles reads/writes; **followers** replicate.
- **ISR (In-Sync Replicas)** — replicas caught up with the leader; only ISR members can become leader.
- **Controller** — a broker coordinating leadership/metadata (in modern Kafka, **KRaft** replaces ZooKeeper).

**Key insight:** parallelism is bounded by partition count — you can't have more *active* consumers in a group than partitions.

---

## 3. Producers

**Theory.** The producer's job is to turn your application events into durable log records on the right partition, with configurable trade-offs between speed and safety.

**How it works — batching.** Producers don't send one TCP packet per message. They accumulate records in a buffer until `batch.size` is reached or `linger.ms` expires, then send one compressed batch — this is how Kafka achieves millions of msgs/sec.

**Example — acks decision matrix:**

| Setting | What happens on send | Data loss risk |
|---------|---------------------|----------------|
| `acks=0` | Fire-and-forget | Leader crash before write → lost |
| `acks=1` | Leader ack only | Leader dies before replication → lost |
| `acks=all` + `min.insync.replicas=2` | All ISR ack | Safe unless all ISR die simultaneously |

**Pitfall.** `acks=all` without `min.insync.replicas` on the broker still allows ack if only leader is in ISR — configure both for production durability.

```java
Properties p = new Properties();
p.put("bootstrap.servers", "broker:9092");
p.put("acks", "all");              // durability: wait for all ISR
p.put("enable.idempotence", "true"); // broker dedupes retries — safe to retry forever
p.put("retries", Integer.MAX_VALUE);
p.put("max.in.flight.requests.per.connection", 5); // safe reordering with idempotence
p.put("linger.ms", 10);            // wait up to 10ms to fill a batch (throughput vs latency)
p.put("batch.size", 32768);        // target batch size in bytes
p.put("compression.type", "lz4");  // compress batches on the wire
```
**`acks` (the durability knob):**
- `acks=0` — fire and forget (fastest, can lose data).
- `acks=1` — leader ack only (loses data if leader dies before replication).
- `acks=all` — all ISR ack (strongest; pair with `min.insync.replicas=2`).

**Partitioning:** records with the same **key** go to the same partition (`hash(key) % numPartitions`) — this is how you preserve per-key ordering. No key → round-robin / sticky partitioner.

**Example — key routing.**
```
order-42 → hash % 3 = partition 1  (all events for order-42 land here, in order)
order-99 → hash % 3 = partition 0
null key → round-robin across P0, P1, P2 (no ordering guarantee between messages)
```

**Interview angle.** Hot keys — if one key dominates traffic (e.g., a mega-account), one partition becomes a bottleneck. Mitigate with sub-keys or accept that hot entity is serialized.

**Throughput levers:** `linger.ms` + `batch.size` (batching), `compression.type`, more partitions.

---

## 4. Consumers & Consumer Groups

**Theory.** Consumers **pull** records by calling `poll()`. A **consumer group** (`group.id`) is a load-balancing unit — Kafka assigns each partition to exactly one consumer in the group so messages are processed once per group, not once globally.

**How it works — assignment example.**
```
Topic "orders": 3 partitions (P0, P1, P2)
Group "billing" (3 consumers):
  Consumer-1 → P0  (reads offsets 0..999, commits 1000)
  Consumer-2 → P1
  Consumer-3 → P2

Group "analytics" (1 consumer):
  Consumer-X → P0, P1, P2  (same data, independent offsets)
```

**Example — scaling limit.** Topic has 6 partitions, billing group has 8 consumers → 2 consumers sit **idle** (no partition assigned). To scale further, increase partition count (with rebalancing cost) or optimize processing speed.

**How it works — poll loop.**
1. `poll(Duration)` returns batch of records (up to `max.poll.records`).
2. Process each record (write to DB, call API, etc.).
3. Commit offsets (auto or manual).
4. Repeat. If processing exceeds `max.poll.interval.ms`, broker assumes consumer dead → rebalance.

**Pitfall.** Long-running processing inside `poll()` loop without pausing or increasing interval → spurious rebalances and duplicate processing.

A **consumer group** is a set of consumers sharing a `group.id`. Kafka assigns each partition to **exactly one** consumer in the group → horizontal scaling with no duplicate processing within the group.
```
Topic with 3 partitions, group "billing":
  Consumer A → P0
  Consumer B → P1
  Consumer C → P2
Add a 4th consumer → it sits idle (no free partition).
Different group "analytics" → reads ALL partitions independently.
```
- Scale consumers **up to** the partition count.
- Multiple groups = independent fan-out of the same stream.
- `poll()` loop: fetch batch → process → commit offset.

---

## 5. Rebalancing

**Theory.** **Rebalancing** is Kafka redistributing partition ownership when group membership changes. During rebalance, consumers **revoke** partitions, wait for reassignment, then resume — consumption pauses (stop-the-world in classic mode).

**How it works — what triggers rebalance.**
- New consumer joins group (scale up).
- Consumer crashes or fails heartbeat (`session.timeout.ms`).
- Consumer exceeds `max.poll.interval.ms` (processing too slow).
- Partitions added/removed from topic.

**Example — slow consumer death spiral.**
```
1. Consumer processing takes 6 min per batch
2. max.poll.interval.ms = 5 min
3. Broker kicks consumer → rebalance
4. Partitions reassigned → another consumer inherits backlog
5. That consumer also slows → repeat
```

**Fixes / modern features:**
- **Cooperative/incremental rebalancing** (`CooperativeStickyAssignor`) — only moves the partitions that must move, instead of revoking everything.
- **Static membership** (`group.instance.id`) — avoids rebalance on transient restarts.
- Tune `max.poll.records` / `max.poll.interval.ms` so processing finishes within the interval.
- Keep `session.timeout.ms` / `heartbeat.interval.ms` sensible.

---

**Interview angle.** Explain cooperative sticky assignor vs eager: eager revokes **all** partitions; cooperative revokes only what must move — much less disruption in rolling deploys.

---

## 6. Offsets & Delivery Semantics

**Theory.** An **offset** is a monotonically increasing ID per partition — the consumer's cursor. Committed offsets are stored in Kafka's internal `__consumer_offsets` topic (or externally for advanced setups).

**How it works — crash scenarios.**

| Strategy | Order | Crash after... | Result |
|----------|-------|----------------|--------|
| At-most-once | Commit → Process | Commit, before process | **Lost** messages |
| At-least-once | Process → Commit | Process, before commit | **Duplicate** messages |
| Exactly-once | Transactional | varies | No dupes within Kafka pipeline |

**Example — at-least-once duplicate.**
```
1. Consumer processes order-42 event (charges customer)
2. JVM crashes before commitSync()
3. On restart, consumer re-reads same offset
4. Customer charged twice → MUST dedupe by orderId in your service
```

The **offset** is the consumer's bookmark per partition, stored in the internal `__consumer_offsets` topic.

| Semantic | How | Risk |
|----------|-----|------|
| **At-most-once** | Commit offset *before* processing | Lose messages on crash |
| **At-least-once** (default, most common) | Process *then* commit | **Duplicates** on crash → make consumers idempotent |
| **Exactly-once** | Transactions / idempotent processing | Complex, throughput cost |

```java
// At-least-once with manual commit (recommended for control)
props.put("enable.auto.commit", "false");
while (true) {
  var records = consumer.poll(Duration.ofMillis(100));
  for (var r : records) process(r);     // do the work first — if crash here, message redelivered
  consumer.commitSync();                // then commit — offset advances only after success
}
```
**Pitfall.** `commitSync()` after batch means one bad record can block the whole batch unless you implement per-record error handling or seek/skip strategies.

> Because at-least-once is the practical default, **idempotent consumers are non-negotiable** — dedupe by a business key or store processed message IDs.

---

## 7. Exactly-Once

**Theory.** "Exactly-once" in Kafka means **no duplicate writes to Kafka topics/partitions** when failures and retries occur — not automatic exactly-once to your PostgreSQL database. End-to-end EOS still requires idempotent sinks.

**How it works — idempotent producer.**
1. Broker assigns `producerId` (PID) on first connect.
2. Each partition gets a sequence number per PID.
3. Retry of seq 5 after broker already wrote seq 5 → broker dedupes, returns same offset.
4. Without this, retry after timeout could create duplicate records.

**How it works — transactions (read-process-write).**
```
Consumer reads offset 100 from input topic
Process message → produce to output topic
producer.sendOffsetsToTransaction(offset 101)  // mark input consumed
producer.commitTransaction()  // atomic: output records + offset commit
```
If crash before commit, transaction aborts — consumer re-reads offset 100, output records marked aborted (invisible to `read_committed` consumers).

Two pieces:
1. **Idempotent producer** (`enable.idempotence=true`) — the broker dedupes producer retries using a producer ID + sequence number, so retries don't create duplicates in a partition.
2. **Transactions** — atomically write to multiple partitions/topics **and** commit consumer offsets together (the **read-process-write** pattern):
```java
producer.initTransactions();
producer.beginTransaction();
producer.send(outRecord);
producer.sendOffsetsToTransaction(offsets, consumerGroupMetadata);
producer.commitTransaction();   // all-or-nothing
```
Consumers must set `isolation.level=read_committed` to skip aborted records. Kafka Streams gives EOS with `processing.guarantee=exactly_once_v2`.

**Reality check:** true end-to-end exactly-once across external systems still needs idempotency at the sink. Most teams do **at-least-once + idempotent consumers**.

**Interview angle.** Most production systems: at-least-once + idempotent consumer (upsert by event ID). Reserve Kafka transactions for stream processing where atomic multi-topic writes matter.

---

## 8. Ordering Guarantees

**Theory.** Kafka guarantees **total order within one partition only**. Across partitions, there is no global order — by design, for parallelism.

**How it works.** All events with key `order-42` hash to partition 1:
```
P1: [Created@offset10][Paid@offset11][Shipped@offset12]  ← strict order
P0: [Created@offset5][Paid@offset8]   ← unrelated orders, order vs P1 irrelevant
```

**Example — ordering violation without idempotence.**
```
Producer sends msg A (seq 1), msg B (seq 2) with max.in.flight=5
Leader acks B but A times out → producer retries A
Broker may persist B before retried A → consumer sees B then A (wrong order)
Fix: enable.idempotence=true (limits in-flight, preserves sequence)
```

- Kafka guarantees order **only within a partition**, not across partitions.
- To keep order for an entity, use a **stable key** (e.g., `orderId`) so all its events land in one partition.
- `max.in.flight.requests.per.connection > 1` without idempotence can reorder on retry — enable idempotence to keep ordering with pipelining.
- Trade-off: stronger ordering (fewer partitions / single key) vs more parallelism (more partitions).

---

## 9. Retry Topics & DLQ

**Theory.** When message processing fails, you have three bad options: (1) block the partition forever, (2) skip and lose data, (3) retry inline and stall throughput. **Retry topics** decouple failure handling from the main consumer loop.

**How it works — non-blocking retry flow.**
```
1. Consumer reads order-42 from "orders" @ offset 500
2. Processing throws (payment gateway timeout)
3. Publish same payload to "orders-retry-1" with delay header
4. Ack/commit offset 501 on main topic → partition keeps moving
5. Retry consumer picks up after 5s → retry processing
6. After 4 failures → route to "orders-dlt" (dead-letter topic)
7. Alert ops; fix bug; replay from DLT manually
```

**Pitfall.** Inline retry (sleep in consumer loop) blocks the partition and can trigger rebalance. Always prefer sidecar retry topics for poison messages.

Failed message processing shouldn't block the partition or be lost.
```
main-topic ──fail──► retry-topic-5s ──fail──► retry-topic-30s ──fail──► DLQ (dead-letter)
```
- **Non-blocking retry**: publish the failed record to a delayed **retry topic**, ack the original so the partition keeps moving.
- **DLQ**: after N retries, route to a dead-letter topic for manual inspection/replay.
- Spring Kafka provides this via `@RetryableTopic` / `DeadLetterPublishingRecoverer`.
```java
@RetryableTopic(attempts = "4", backoff = @Backoff(delay = 1000, multiplier = 2.0),
                dltStrategy = DltStrategy.FAIL_ON_ERROR)
@KafkaListener(topics = "orders")
public void handle(Order o) { ... }

@DltHandler
public void dlt(Order o) { log.error("to DLQ: {}", o); }
```

---

**Interview angle.** Distinguish retry topic (transient failures, automatic) from DLQ (permanent failure, human intervention). Mention `@RetryableTopic` auto-wires this in Spring Kafka.

```java
@RetryableTopic(attempts = "4", backoff = @Backoff(delay = 1000, multiplier = 2.0),
                dltStrategy = DltStrategy.FAIL_ON_ERROR)  // 1s, 2s, 4s delays before DLT
@KafkaListener(topics = "orders")
public void handle(Order o) { ... }

@DltHandler
public void dlt(Order o) { log.error("to DLQ: {}", o); }  // manual triage / replay tooling
```

---

## 10. Outbox Pattern

**Theory.** The **dual-write problem**: you need to UPDATE a database row AND publish a Kafka event. These are two separate systems — if the DB commit succeeds but Kafka publish fails (or vice versa), data is inconsistent.

**How it works — transactional outbox.**
```
BEGIN TRANSACTION
  INSERT INTO orders (id, status) VALUES (42, 'CREATED');
  INSERT INTO outbox (id, aggregate_id, event_type, payload, created_at)
    VALUES (uuid, 42, 'OrderCreated', '{...}', now());
COMMIT  ← both or neither

Separate relay process:
  SELECT * FROM outbox WHERE sent = false
  → publish to Kafka
  → UPDATE outbox SET sent = true
```
CDC (Debezium) watches the DB transaction log instead of polling — lower latency, same guarantee.

**Example.** Order saved but Kafka down — outbox row remains `sent=false`. Relay retries when Kafka recovers. No lost events, no phantom events.

**Problem:** you can't atomically write to your DB *and* publish to Kafka (dual-write → inconsistency if one fails).

**Solution (Transactional Outbox):**
1. In the same DB transaction as your business write, insert the event into an **`outbox`** table.
2. A separate process (a poller, or **Debezium CDC** reading the DB log) reads the outbox and publishes to Kafka, then marks it sent.

```
[ business INSERT + outbox INSERT ]  ← one ACID transaction
        │
   CDC / poller
        ▼
     Kafka topic
```
This guarantees the event is published **iff** the business data was committed — the standard fix for reliable event publishing in microservices.

---

**Interview angle.** "Why not publish in `@Transactional` after commit?" — `@TransactionalEventListener(phase = AFTER_COMMIT)` helps but still fails if Kafka is down after commit. Outbox + relay is the durable pattern.

---

## 11. Backpressure

**Theory.** **Backpressure** is how a slow downstream signals upstream to slow down. Kafka's pull model makes this natural — a slow consumer simply polls less often; the log retains data (until retention limit).

**How it works — producer side.** When producer buffer (`buffer.memory`) fills because brokers are slow or `acks=all` waits on ISR, `send()` blocks up to `max.block.ms` then throws — this is producer backpressure.

**How it works — consumer side.**
```java
consumer.pause(partitions);  // stop fetching when downstream DB is overloaded
// ... drain internal queue ...
consumer.resume(partitions);
```

**Example.** Analytics consumer writes to overloaded Elasticsearch → lag grows from 1K to 500K → alert fires → scale consumers or pause non-critical partitions.

**Pitfall.** Ignoring lag until disk fills — retention will **delete** old segments; slow consumers lose ability to catch up.

Kafka consumers are **pull-based**, which is natural backpressure — a slow consumer just polls slower; the broker retains data. Manage it with:
- `max.poll.records` — cap batch size so processing finishes in time.
- **`pause()`/`resume()`** partitions when a downstream is overwhelmed.
- Bounded internal work queues / thread pools in the consumer.
- Watch **consumer lag** as the overload signal.
Producers feel backpressure via `buffer.memory` + `max.block.ms` (send blocks when the buffer is full).

---

## 12. Lag Monitoring

**Theory.** **Consumer lag** is the gap between the log end (latest offset) and what your consumer has committed. It is the single most important Kafka health signal.

**How it works — calculating lag.**
```
Partition P1:
  Log end offset (LEO)     = 10,500  (newest message written)
  Committed offset         = 10,200  (consumer group's bookmark)
  Lag                      = 300 messages behind

If LEO grows at 1000/sec and committed at 800/sec → lag grows 200/sec → alert
```

**Example — remediation playbook.**
1. Lag spiking on one partition → **hot key** or slow consumer on that partition.
2. Lag uniform across all partitions → need more consumers (up to partition count) or faster processing.
3. Lag after deploy → check for rebalance storm or new bug in handler.

**Consumer lag = latest offset − committed offset** per partition. Rising lag = consumers can't keep up.
- Tools: `kafka-consumer-groups.sh --describe`, **Burrow**, **Kafka Exporter → Prometheus → Grafana**, Confluent Control Center.
- Alert on sustained/ growing lag, not absolute value.
- Remedies: add consumers (≤ partitions), add partitions, speed up processing, batch downstream writes.

Other key metrics: under-replicated partitions, ISR shrink, request latency, broker disk usage.

---

**Interview angle.** Alert on **lag growth rate**, not absolute lag — a consumer 1M messages behind but keeping pace may be fine after a restart.

---

## 13. Schema Management

**Theory.** JSON without a schema leads to "field renamed in prod, consumer crashes." A **Schema Registry** stores versioned schemas (Avro/Protobuf/JSON Schema); each message carries a 4-byte schema ID instead of the full schema — compact and enforceable.

**How it works — evolution.**
```
v1 schema: { orderId: long, amount: double }
v2 schema: { orderId: long, amount: double, currency: string (default "USD") }

Producer registers v2 → serializes with schema ID 42
Old consumer (v1 reader) → BACKWARD compatible → reads v2 data, ignores unknown field
New consumer expects currency → works
```

**Pitfall.** Removing a required field or changing field type breaks compatibility — CI should run compatibility checks against registry before deploy.

For evolving event contracts use a **Schema Registry** (Avro/Protobuf/JSON Schema).
- Producers register schemas; consumers fetch by ID — payloads carry a schema id, not the full schema (compact).
- **Compatibility modes**: BACKWARD (new consumer reads old data), FORWARD, FULL.
- Rules: add fields with defaults; don't remove/rename required fields — this is how you avoid breaking consumers on deploy.

---

## 14. Spring Kafka

**Theory.** Spring Kafka wraps the Java client with `@KafkaListener`, `KafkaTemplate`, and error-handling abstractions so you don't hand-write poll loops in a Spring service.

**How it works — listener container.**
1. `ConcurrentKafkaListenerContainerFactory` creates N consumer threads (`concurrency=3`).
2. Each thread runs poll → invoke `@KafkaListener` method → ack per `AckMode`.
3. `MANUAL` ack mode: you call `ack.acknowledge()` after successful processing (at-least-once).
4. `DefaultErrorHandler` + `@RetryableTopic` wire retries/DLT without custom code.

```java
@KafkaListener(topics = "orders", groupId = "billing",
               concurrency = "3")          // 3 threads — need ≥3 partitions to utilize all
public void onOrder(ConsumerRecord<String, Order> rec, Acknowledgment ack) {
    process(rec.value());
    ack.acknowledge();                      // manual ack — offset committed after this
}

@Bean
public KafkaTemplate<String, Order> template(ProducerFactory<String, Order> pf) {
    return new KafkaTemplate<>(pf);
}

// Producer: key = order ID → all events for that order land in same partition (ordering)
template.send("orders", order.getId(), order);
```

**Pitfall.** `concurrency=10` with 3 partitions → 7 threads idle. Match concurrency to partition count.

Set `ack-mode: MANUAL`, configure `ErrorHandler`/`DefaultErrorHandler` for retries+DLT, and `ConcurrentKafkaListenerContainerFactory` for parallelism.

---

## 15. Design: 50k Events/Sec

**Theory.** This is a classic system design question — interviewers want structured trade-off reasoning, not magic numbers.

**Worked example — sizing partitions.**
```
Target: 50,000 events/sec
Conservative per-partition throughput: ~5,000/sec (depends on payload size, acks, compression)
Minimum partitions: 50,000 / 5,000 = 10 → use 12-16 for headroom and consumer scaling
Consumer instances: match partition count (e.g., 4 pods × 4 threads = 16 consumers)
```

**Worked example — end-to-end flow.**
```
API → DB + outbox (same TX) → Debezium → Kafka (12 partitions, RF=3, acks=all)
     → 12 billing consumers (at-least-once, dedupe by eventId in DB)
     → batch INSERT 100 records per JDBC batch
     → lag monitored in Grafana; KEDA scales consumers when lag > 10K
```

The canonical interview question. Structure your answer:
1. **Partition for throughput**: 50k/sec ÷ ~5-10k per partition ≈ **8-16+ partitions**; size consumers to match.
2. **Key by entity** (e.g., accountId) for per-entity ordering + even spread; watch for hot keys.
3. **Producer**: `acks=all`, idempotence on, batching (`linger.ms`, `lz4`).
4. **Consumers**: at-least-once + **idempotent processing**, batch downstream DB writes, manual commits.
5. **Reliability**: retry topics + DLQ; outbox for the upstream write.
6. **Backpressure**: pull model + lag-based autoscaling (KEDA scales consumers on lag).
7. **Observe**: lag, throughput, p99 processing time; alert on lag growth.
8. **Scale**: add partitions + consumers + brokers; RF=3, `min.insync.replicas=2`.

---

## 16. Interview Q&A

**Q1. How does Kafka achieve high throughput?**
Sequential disk writes (append-only log), zero-copy transfer, batching, compression, and partition-level parallelism.

**Q2. Partition vs consumer relationship?**
Within a group, each partition is consumed by exactly one consumer; max useful consumers = partition count. Different groups read independently.

**Q3. How do you guarantee ordering?**
Only within a partition. Use a consistent key so an entity's events share a partition; enable idempotence to keep order with retries.

**Q4. At-least-once vs exactly-once — what do you use?**
Default at-least-once + idempotent consumers (dedupe by business key). Exactly-once via idempotent producer + transactions when atomic read-process-write is required.

**Q5. What is a rebalance and why is it bad?**
Reassignment of partitions on membership change; it pauses consumption and can cause duplicates. Mitigate with cooperative rebalancing, static membership, and tuned poll intervals.

**Q6. Kafka vs RabbitMQ?**
Kafka = durable, replayable log, huge throughput, ordering per partition. RabbitMQ = flexible routing, per-message ack/priority/TTL, consume-and-delete. Choose by replay/throughput vs routing needs.

**Q7. How do you handle a poison message?**
Retry with backoff via retry topics (non-blocking), then route to a DLQ after N attempts; alert and replay after a fix.

**Q8. Why the outbox pattern?**
To avoid the dual-write problem — write business data and the event in one DB transaction, then publish via CDC/poller, guaranteeing consistency.

**Q9. What is ISR and `min.insync.replicas`?**
ISR = replicas in sync with the leader. With `acks=all` and `min.insync.replicas=2`, a write needs ≥2 in-sync copies, trading some availability for durability.

**Q10. How do you monitor Kafka health?**
Consumer lag, under-replicated/offline partitions, ISR shrink, request latency, disk usage — via Kafka Exporter + Prometheus/Grafana, alerting on growing lag.
