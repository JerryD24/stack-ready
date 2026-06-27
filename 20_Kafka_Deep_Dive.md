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

```java
Properties p = new Properties();
p.put("bootstrap.servers", "broker:9092");
p.put("acks", "all");              // durability: wait for all ISR
p.put("enable.idempotence", "true");
p.put("retries", Integer.MAX_VALUE);
p.put("max.in.flight.requests.per.connection", 5); // safe with idempotence
p.put("linger.ms", 10);            // wait to batch
p.put("batch.size", 32768);
p.put("compression.type", "lz4");
```
**`acks` (the durability knob):**
- `acks=0` — fire and forget (fastest, can lose data).
- `acks=1` — leader ack only (loses data if leader dies before replication).
- `acks=all` — all ISR ack (strongest; pair with `min.insync.replicas=2`).

**Partitioning:** records with the same **key** go to the same partition (`hash(key) % partitions`) — this is how you preserve per-key ordering. No key → round-robin / sticky.

**Throughput levers:** `linger.ms` + `batch.size` (batching), `compression.type`, more partitions.

---

## 4. Consumers & Consumer Groups

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

When group membership changes (consumer joins/leaves/crashes) or partitions change, Kafka **reassigns partitions** — a *rebalance*. During a stop-the-world rebalance, consumption pauses.

**Problems:** frequent rebalances cause latency spikes & duplicate processing. Triggered by slow processing exceeding `max.poll.interval.ms`, long GC pauses, or scaling events.

**Fixes / modern features:**
- **Cooperative/incremental rebalancing** (`CooperativeStickyAssignor`) — only moves the partitions that must move, instead of revoking everything.
- **Static membership** (`group.instance.id`) — avoids rebalance on transient restarts.
- Tune `max.poll.records` / `max.poll.interval.ms` so processing finishes within the interval.
- Keep `session.timeout.ms` / `heartbeat.interval.ms` sensible.

---

## 6. Offsets & Delivery Semantics

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
  for (var r : records) process(r);     // do the work first
  consumer.commitSync();                // then commit
}
```
> Because at-least-once is the practical default, **idempotent consumers are non-negotiable** — dedupe by a business key or store processed message IDs.

---

## 7. Exactly-Once

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

---

## 8. Ordering Guarantees

- Kafka guarantees order **only within a partition**, not across partitions.
- To keep order for an entity, use a **stable key** (e.g., `orderId`) so all its events land in one partition.
- `max.in.flight.requests.per.connection > 1` without idempotence can reorder on retry — enable idempotence to keep ordering with pipelining.
- Trade-off: stronger ordering (fewer partitions / single key) vs more parallelism (more partitions).

---

## 9. Retry Topics & DLQ

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

## 10. Outbox Pattern

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

## 11. Backpressure

Kafka consumers are **pull-based**, which is natural backpressure — a slow consumer just polls slower; the broker retains data. Manage it with:
- `max.poll.records` — cap batch size so processing finishes in time.
- **`pause()`/`resume()`** partitions when a downstream is overwhelmed.
- Bounded internal work queues / thread pools in the consumer.
- Watch **consumer lag** as the overload signal.
Producers feel backpressure via `buffer.memory` + `max.block.ms` (send blocks when the buffer is full).

---

## 12. Lag Monitoring

**Consumer lag = latest offset − committed offset** per partition. Rising lag = consumers can't keep up.
- Tools: `kafka-consumer-groups.sh --describe`, **Burrow**, **Kafka Exporter → Prometheus → Grafana**, Confluent Control Center.
- Alert on sustained/ growing lag, not absolute value.
- Remedies: add consumers (≤ partitions), add partitions, speed up processing, batch downstream writes.

Other key metrics: under-replicated partitions, ISR shrink, request latency, broker disk usage.

---

## 13. Schema Management

For evolving event contracts use a **Schema Registry** (Avro/Protobuf/JSON Schema).
- Producers register schemas; consumers fetch by ID — payloads carry a schema id, not the full schema (compact).
- **Compatibility modes**: BACKWARD (new consumer reads old data), FORWARD, FULL.
- Rules: add fields with defaults; don't remove/rename required fields — this is how you avoid breaking consumers on deploy.

---

## 14. Spring Kafka

```java
@KafkaListener(topics = "orders", groupId = "billing",
               concurrency = "3")          // 3 consumer threads (≤ partitions)
public void onOrder(ConsumerRecord<String, Order> rec, Acknowledgment ack) {
    process(rec.value());
    ack.acknowledge();                      // manual ack
}

@Bean
public KafkaTemplate<String, Order> template(ProducerFactory<String, Order> pf) {
    return new KafkaTemplate<>(pf);
}
template.send("orders", order.getId(), order);   // key = id -> ordering per order
```
Set `ack-mode: MANUAL`, configure `ErrorHandler`/`DefaultErrorHandler` for retries+DLT, and `ConcurrentKafkaListenerContainerFactory` for parallelism.

---

## 15. Design: 50k Events/Sec

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
