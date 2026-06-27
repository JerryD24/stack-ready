# Observability & Production Debugging — Deep Dive
### Metrics, Logs, Traces & "It's Slow in Prod" | Senior Signal

---

## TABLE OF CONTENTS
1. [Observability vs Monitoring](#1-observability-vs-monitoring)
2. [The Three Pillars](#2-three-pillars)
3. [Metrics with Prometheus](#3-metrics-prometheus)
4. [Dashboards with Grafana](#4-grafana)
5. [Structured Logging](#5-structured-logging)
6. [Log Aggregation — ELK & Loki](#6-log-aggregation)
7. [Distributed Tracing — OpenTelemetry & Jaeger](#7-distributed-tracing)
8. [Correlation IDs](#8-correlation-ids)
9. [The RED & USE Methods](#9-red-use-methods)
10. [SLI, SLO, SLA & Error Budgets](#10-sli-slo-sla)
11. [Alerting Done Right](#11-alerting)
12. [Debugging: A Service Is Slow in Prod](#12-debugging-slow-service)
13. [Debugging: High Error Rate / Memory / CPU](#13-debugging-errors-resources)
14. [Interview Q&A](#14-interview-qa)

---

## 1. Observability vs Monitoring

- **Monitoring** answers *known* questions: "Is CPU high? Is the service up?" (predefined dashboards/alerts).
- **Observability** lets you ask *new* questions about unknown problems from the system's outputs — "why are p99 latencies for tenant X spiking only on POST /orders?" — without shipping new code.

You need observability because distributed systems fail in ways you didn't predict. The goal: go from **symptom → root cause** quickly.

---

## 2. Three Pillars

| Pillar | Question it answers | Tool examples |
|--------|--------------------|----|
| **Metrics** | What is happening? (aggregates, trends) | Prometheus, Micrometer |
| **Logs** | What exactly happened in this event? | ELK, Loki |
| **Traces** | Where did the time go across services? | OpenTelemetry, Jaeger |

They're complementary: a metric alert tells you *something* is wrong → a trace shows *which hop* is slow → logs for that trace/span tell you *why*.

---

## 3. Metrics with Prometheus

Prometheus **pulls** (scrapes) metrics from a `/metrics` endpoint and stores time-series.
```java
// Spring Boot + Micrometer exposes /actuator/prometheus automatically
@Timed(value = "order.process.time", percentiles = {0.5, 0.95, 0.99})
public void process(Order o) { ... }

Counter ordersCreated = Counter.builder("orders.created").register(registry);
ordersCreated.increment();
```
**Metric types:** Counter (monotonic, e.g., requests total), Gauge (up/down, e.g., queue size), Histogram/Summary (distributions → percentiles).
**PromQL:**
```promql
rate(http_server_requests_seconds_count{status=~"5.."}[5m])   # error rate
histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m]))  # p99 latency
```
Use **labels** (route, status, instance) for slicing — but avoid high-cardinality labels (userId) which explode storage.

---

## 4. Grafana

Visualization layer over Prometheus/Loki/Jaeger.
- Build dashboards per service: traffic, error rate, latency (p50/p95/p99), saturation (CPU/mem), queue depth, Kafka lag.
- Use template variables (per-service, per-env), annotations for deploys (correlate a latency spike with a release).
- Keep a **"golden signals" overview** dashboard + drill-down dashboards.

---

## 5. Structured Logging

Log **JSON**, not free text — so logs are queryable.
```java
// Bad:  log.info("user " + id + " did " + action);
// Good (structured, with context):
log.info("user_action", kv("userId", id), kv("action", action), kv("traceId", traceId));
```
- Use **SLF4J + Logback/Log4j2**, or `pino` (Node). Output JSON in prod.
- **Levels:** ERROR (needs attention), WARN (suspicious), INFO (business events), DEBUG (dev). Don't log at DEBUG in prod by default.
- **Never log secrets/PII** (passwords, tokens, card numbers) — mask them.
- Include `traceId`, `service`, `env`, and relevant business keys in every line.

---

## 6. Log Aggregation

Centralize logs from all pods/instances:
- **ELK/EFK**: Elasticsearch (store/search) + Logstash/Fluentd/Fluent Bit (ship/parse) + Kibana (UI).
- **Grafana Loki**: indexes only labels (not full text) → cheaper; query with **LogQL**; integrates tightly with Grafana + traces.
```logql
{app="orders-api", level="ERROR"} | json | traceId="7f3a..."
```
In Kubernetes, a log agent (Fluent Bit) runs as a DaemonSet, tails container stdout, and ships centrally. **Apps should log to stdout** and let the platform handle shipping.

---

## 7. Distributed Tracing

A **trace** follows one request across services; each hop is a **span** with timing + parent/child links. This is the only practical way to find *which service* is slow in a chain.
```
Trace (traceId=abc)
 ├─ span: gateway          [   8ms ]
 │   └─ span: orders-api   [ 240ms ]   ← the slow hop
 │        ├─ span: db query [ 200ms ]  ← root cause
 │        └─ span: kafka publish [ 5ms ]
```
- **OpenTelemetry (OTel)** is the vendor-neutral standard (SDK + auto-instrumentation agent) → export to **Jaeger**/Tempo/Zipkin.
- **Context propagation**: trace context travels in headers (`traceparent` per W3C) across HTTP/Kafka so spans link into one trace.
- Java: attach the OTel agent (`-javaagent:opentelemetry-javaagent.jar`) for auto-instrumentation of HTTP, JDBC, Kafka.
- Use **sampling** (e.g., tail-based) to control volume/cost while keeping interesting traces.

---

## 8. Correlation IDs

A single ID stitching together logs/traces for one request.
```java
// Servlet filter: read or create a correlation/trace id, put in MDC
String cid = Optional.ofNullable(req.getHeader("X-Correlation-Id"))
                     .orElse(UUID.randomUUID().toString());
MDC.put("correlationId", cid);          // now every log line carries it
res.setHeader("X-Correlation-Id", cid); // return to client
// propagate downstream as a header on outbound calls
```
- Generate at the edge (gateway), propagate through every service and async hop (including Kafka headers and thread handoffs — copy MDC into worker threads).
- With OTel, the **traceId** serves this role; link logs to traces by including traceId in logs.

---

## 9. RED & USE Methods

Frameworks for *what* to measure:
- **RED** (request-driven services): **R**ate (req/s), **E**rrors (failed req/s), **D**uration (latency distribution). Great for APIs.
- **USE** (resources): **U**tilization, **S**aturation, **E**rrors. Great for hosts/queues/disks.
- **Four Golden Signals** (Google SRE): latency, traffic, errors, saturation.

Instrument every service with RED at minimum; you can debug 80% of incidents from these.

---

## 10. SLI, SLO, SLA

- **SLI** (Indicator) — a measured number, e.g., % of requests < 300ms.
- **SLO** (Objective) — your internal target, e.g., 99.9% of requests < 300ms over 30 days.
- **SLA** (Agreement) — the contractual promise to customers (with penalties), usually looser than the SLO.
- **Error budget** = 100% − SLO (e.g., 0.1% may fail). If you're burning budget fast, freeze risky deploys; if you have budget, ship faster. This balances reliability vs velocity.

---

## 11. Alerting

- **Alert on symptoms, not causes** — alert on "error rate / latency SLO breach" (user impact), not "CPU 80%" (which may be fine).
- Make alerts **actionable** — every alert needs a runbook; otherwise it's noise.
- Avoid alert fatigue: use multi-window burn-rate alerts, dedupe, and severities (page vs ticket).
- Page on user-facing impact (SLO burn), ticket on slow-burn/capacity.

---

## 12. Debugging: Slow Service

The headline interview question — answer as a **method**, not a guess:
1. **Confirm & scope:** check the dashboard — is latency up for all routes or one? All instances or one? Since when (correlate with a deploy/traffic change via annotations)?
2. **Trace it:** open a slow request's distributed trace → find the span consuming the time (DB? downstream? GC pause?).
3. **Narrow by layer:**
   - **DB**: slow query? check query metrics, `EXPLAIN`, N+1, missing index, lock waits, connection pool exhaustion (HikariCP `pending` threads).
   - **Downstream**: a dependency's p99 up → circuit breaker/timeout firing?
   - **JVM**: GC pauses (GC logs), thread dump (`jstack`) for blocked/locked threads, heap pressure.
   - **Saturation**: CPU throttling (K8s limits), thread pool/queue full, Kafka lag.
4. **Logs for the trace id** to see errors/retries on the slow span.
5. **Hypothesize → verify with data → fix → confirm** the dashboard recovers.

> Strong answers are systematic (metrics → traces → logs) and mention concrete tools. Weak answers jump to "restart it" or "add a bigger server."

---

## 13. Debugging: Errors / Memory / CPU

**Sudden error spike:** correlate with deploy (rollback first if so) → group errors by type/endpoint in logs → check a failing trace → check downstream health/circuit breakers.

**High memory / OOM:** capture a **heap dump** (`jmap -dump` or `-XX:+HeapDumpOnOutOfMemoryError`), analyze in **MAT/Eclipse** for dominator tree → usual culprits: unbounded caches, lingering collections, classloader/ThreadLocal leaks. In K8s, confirm it's a real leak vs heap > container limit (OOMKilled).

**High CPU:** thread dump several times (`jstack`) → find hot/runnable threads; use **async-profiler**/flame graphs → usual culprits: tight loops, excessive GC (check GC logs), regex/serialization hotspots, lock contention.

**Tooling:** `jstack` (threads), `jmap` (heap), `jcmd`, **Arthas** (live diagnostics without restart), async-profiler, Java Flight Recorder + Mission Control.

---

## 14. Interview Q&A

**Q1. Difference between monitoring and observability?**
Monitoring tracks predefined health (known unknowns); observability lets you investigate novel problems from metrics/logs/traces (unknown unknowns).

**Q2. The three pillars and how they work together?**
Metrics (aggregate trends) alert you; traces localize the slow/failing hop; logs explain why — pivot between them via trace/correlation IDs.

**Q3. Push vs pull metrics; why Prometheus pulls?**
Prometheus scrapes targets — simpler service discovery, easy health detection (scrape fails = down), no client-side buffering. Push (via Pushgateway) is for short-lived jobs.

**Q4. How do you trace a request across microservices?**
Propagate trace context in headers (W3C `traceparent`) via OpenTelemetry; each service emits spans to a backend (Jaeger) that assembles the full trace by traceId.

**Q5. Walk me through debugging a slow endpoint in prod.**
Scope it on dashboards → open a distributed trace to find the slow span → drill into that layer (DB/downstream/JVM/saturation) → read logs by trace id → fix and verify. (See §12.)

**Q6. How do you find a memory leak in Java?**
Heap dump (`jmap`/auto-on-OOM) → analyze dominator tree in MAT → look for unbounded caches, ThreadLocals, listeners; watch RSS/heap trend over time.

**Q7. SLI vs SLO vs SLA and error budget?**
SLI = measured metric, SLO = internal target, SLA = customer contract. Error budget = allowed unreliability (100−SLO); spend it on velocity, protect it when burning fast.

**Q8. What should you alert on?**
User-impacting symptoms (SLO/error-rate/latency burn), actionable with runbooks — not raw resource metrics that don't imply impact.

**Q9. RED vs USE?**
RED (Rate, Errors, Duration) for request services; USE (Utilization, Saturation, Errors) for resources/queues.

**Q10. Why log to stdout in containers?**
The platform (Fluent Bit/K8s) collects stdout centrally; apps shouldn't manage log files/rotation. Pair with structured JSON + trace ids.
