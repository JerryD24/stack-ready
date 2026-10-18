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

**How it works.** Monitoring is a fixed set of gauges and thresholds you decided ahead of time. Observability means your system emits rich telemetry (metrics with labels, structured logs, traces with context) so you can slice and filter ad hoc during an incident. The difference is like a car dashboard (monitoring: speed, fuel) vs a mechanic's diagnostic port (observability: read any sensor, any time).

**Example.** Monitoring alert: "error rate > 5%." Observability follow-up: filter errors by `tenant=acme`, `endpoint=POST /orders`, `downstream=inventory` — discover only one tenant hitting a new API version that sends malformed payloads. No new code deployed; you queried existing structured logs and metrics.

**Interview angle.** Monitoring tells you *something broke*. Observability tells you *why*, *where*, and *for whom*.

---

## 2. Three Pillars

| Pillar | Question it answers | Tool examples |
|--------|--------------------|----|
| **Metrics** | What is happening? (aggregates, trends) | Prometheus, Micrometer |
| **Logs** | What exactly happened in this event? | ELK, Loki |
| **Traces** | Where did the time go across services? | OpenTelemetry, Jaeger |

They're complementary: a metric alert tells you *something* is wrong → a trace shows *which hop* is slow → logs for that trace/span tell you *why*.

**How they correlate during an incident.**
1. **Metrics** — Grafana alert fires: `orders-api` p99 latency > 2s for 5 min.
2. **Traces** — open Jaeger, filter `service=orders-api`, sort by duration, pick a slow trace (`traceId=abc123`).
3. **Logs** — query `{app="orders-api"} | json | traceId="abc123"` → see `ERROR: inventory timeout after 3000ms` on the slow span.

Each pillar links via shared identifiers (`traceId`, `service`, `pod`, `route`). Without correlation IDs, you're grep-ing blindly across gigabytes of logs.

**Pitfall.** Having only metrics — you know latency is high but not whether it's the DB, a downstream, or GC. Having only logs — you can't see the cross-service picture. You need all three, wired together.

---

## 3. Metrics with Prometheus

Prometheus **pulls** (scrapes) metrics from a `/metrics` endpoint and stores time-series.

**What & why.** Metrics are numeric measurements over time — request count, latency histogram, queue depth. They're cheap to store (aggregated) and fast to query across millions of data points. Prometheus is the de facto standard in cloud-native stacks because it integrates with Kubernetes service discovery and has a powerful query language (PromQL).

**How it works — pull model.** Every 15s (configurable), Prometheus HTTP-scrapes `/actuator/prometheus` on each target. If a scrape fails, the target is marked down — built-in health detection. Metrics are stored as time-series identified by name + labels: `http_server_requests_seconds_count{method="POST", uri="/orders", status="500", instance="10.0.1.5:8080"}`.

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
rate(http_server_requests_seconds_count{status=~"5.."}[5m])   # 5xx errors per second (rate over 5min window)
histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m]))  # p99 latency
```

Use **labels** (route, status, instance) for slicing — but avoid high-cardinality labels (userId) which explode storage.

**Example — cardinality explosion.** `http_requests_total{userId="12345"}` × 1 million users = 1 million time series. Prometheus memory explodes. Fix: aggregate by `tenant` or `tier`, not individual user. Log user-level detail in traces/logs instead.

**Interview angle.** Push vs pull: Prometheus pulls (simple, no client-side buffer). Pushgateway exists for short-lived batch jobs only — not for regular services.

---

## 4. Grafana

Visualization layer over Prometheus/Loki/Jaeger.

**What & why.** Raw PromQL results are tables of numbers. Grafana turns them into dashboards you stare at during incidents — latency graphs, error rate panels, saturation gauges — with drill-down links to traces and logs.

**How to build useful dashboards.**
- **Golden signals overview** — one row per service: rate, errors, duration (p50/p95/p99), saturation. Scan all services in 10 seconds.
- **Drill-down dashboards** — per-service detail: latency by endpoint, error breakdown by status code, JVM heap, thread pools, Kafka consumer lag.
- **Template variables** — dropdown for `$service`, `$env`, `$pod` so one dashboard works everywhere.
- **Deploy annotations** — vertical lines on graphs when a deploy happened. A latency spike at 14:32 + deploy annotation at 14:31 = strong correlation.

- Build dashboards per service: traffic, error rate, latency (p50/p95/p99), saturation (CPU/mem), queue depth, Kafka lag.
- Use template variables (per-service, per-env), annotations for deploys (correlate a latency spike with a release).
- Keep a **"golden signals" overview** dashboard + drill-down dashboards.

**Example.** On-call opens the overview dashboard — `orders-api` p99 jumped from 200ms to 3s. Clicks through to the orders-api drill-down — only `POST /orders` is slow, not `GET /orders/{id}`. Clicks a trace link from the slow panel → lands in Jaeger on a 2.8s inventory span.

**Pitfall.** Dashboard sprawl — 50 dashboards nobody maintains. Invest in 1 overview + 1 per critical service, kept current.

---

## 5. Structured Logging

Log **JSON**, not free text — so logs are queryable.

**What & why.** Plain text logs (`"User 12345 did checkout"`) require regex to search and can't be aggregated. Structured JSON logs (`{"userId":"12345","action":"checkout","traceId":"abc"}`) are fields you filter, group, and join with traces/metrics in Loki or Elasticsearch.

**How it works.** Use a structured logging API that emits key-value pairs. In Java, `log.info("user_action", kv("userId", id), ...)` or Logback JSON encoder. Every log line carries consistent fields so queries like `level=ERROR AND downstream="inventory"` work instantly.

```java
// Bad:  log.info("user " + id + " did " + action);   // unqueryable blob
// Good (structured, with context):
log.info("user_action", kv("userId", id), kv("action", action), kv("traceId", traceId));
```

- Use **SLF4J + Logback/Log4j2**, or `pino` (Node). Output JSON in prod.
- **Levels:** ERROR (needs attention), WARN (suspicious), INFO (business events), DEBUG (dev). Don't log at DEBUG in prod by default.
- **Never log secrets/PII** (passwords, tokens, card numbers) — mask them.
- Include `traceId`, `service`, `env`, and relevant business keys in every line.

**Example query (Loki).** `{app="orders-api", level="ERROR"} | json | downstream="inventory" | line_format "{{.message}} took {{.durationMs}}ms"` → all inventory errors with timing, last hour.

**Pitfall.** Logging everything at INFO in prod — storage cost and noise. Log business events and errors at INFO; diagnostic detail at DEBUG (enabled temporarily during incidents via config reload).

---

## 6. Log Aggregation

Centralize logs from all pods/instances:

**What & why.** With 30 Pods across 10 nodes, `kubectl logs` one Pod at a time doesn't scale. Log aggregation ships all stdout to a central store where you search, filter, and correlate across the fleet.

**How it works in Kubernetes.** A log agent (Fluent Bit) runs as a **DaemonSet** — one agent per node. It tails `/var/log/containers/*.log` (where container runtime writes stdout), parses JSON, adds K8s metadata (pod name, namespace, labels), and ships to the backend.

- **ELK/EFK**: Elasticsearch (store/search) + Logstash/Fluentd/Fluent Bit (ship/parse) + Kibana (UI).
- **Grafana Loki**: indexes only labels (not full text) → cheaper; query with **LogQL**; integrates tightly with Grafana + traces.

```logql
{app="orders-api", level="ERROR"} | json | traceId="7f3a..."
```

In Kubernetes, a log agent (Fluent Bit) runs as a DaemonSet, tails container stdout, and ships centrally. **Apps should log to stdout** and let the platform handle shipping.

**ELK vs Loki.** ELK indexes full text — powerful search ("find any log containing `NullPointerException`") but expensive at scale. Loki indexes labels only (`app`, `level`, `traceId`) — cheap, but full-text search is slower/limited. Loki wins when you're already on Grafana and correlate via labels/traceId.

**Pitfall.** Apps writing to files inside containers — the file is lost when the Pod dies and the agent may not tail it. Always log to stdout/stderr.

---

## 7. Distributed Tracing

A **trace** follows one request across services; each hop is a **span** with timing + parent/child links. This is the only practical way to find *which service* is slow in a chain.

**How it works — context propagation.** When the gateway receives a request, the OTel SDK creates a root span and generates a `traceId`. On outbound HTTP calls, the SDK injects the trace context into headers (`traceparent: 00-{traceId}-{spanId}-01` per W3C spec). The downstream service extracts it, creates a child span linked to the same trace, and repeats. The trace backend (Jaeger) assembles all spans by `traceId` into a waterfall view.

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

**Sampling.** Head-based: sample 1% at trace start (cheap, may miss slow traces). Tail-based: collect all spans, decide after completion whether to keep (keeps all errors and slow traces, discards normal ones — higher value, needs a collector like OTel Collector).

**Example — async gap.** HTTP request creates span A. App publishes to Kafka (span B, 5ms). Consumer processes message in a different thread — you must manually propagate trace context into the Kafka consumer (via message headers) or the trace breaks and you lose visibility into the async half.

**Interview angle.** Traces show *where* time went; they don't show *why* (that's logs). Always pivot from slow span → logs filtered by `traceId`.

---

## 8. Correlation IDs

A single ID stitching together logs/traces for one request.

**What & why.** A single user request touches gateway → order service → inventory → DB. Without a shared ID, finding all log lines for that one request across four services is impossible. A correlation ID (or traceId in OTel) is the thread that sews the story together.

**How it works.** Generate at the edge (API gateway). Store in SLF4J **MDC** (Mapped Diagnostic Context) so every log line in that thread automatically includes it. Propagate as an HTTP header on every outbound call. On async boundaries (Kafka consumer, `@Async`, thread pool), explicitly copy MDC to the worker thread.

```java
// Servlet filter: read or create a correlation/trace id, put in MDC
String cid = Optional.ofNullable(req.getHeader("X-Correlation-Id"))
                     .orElse(UUID.randomUUID().toString());
MDC.put("correlationId", cid);          // now every log line carries it
res.setHeader("X-Correlation-Id", cid); // return to client for support tickets
// propagate downstream as a header on outbound calls
```

- Generate at the edge (gateway), propagate through every service and async hop (including Kafka headers and thread handoffs — copy MDC into worker threads).
- With OTel, the **traceId** serves this role; link logs to traces by including traceId in logs.

**Example — support ticket.** Customer reports failed checkout at 14:32. Support gives you `X-Correlation-Id: 7f3a-b2c1`. Query: `{app=~".+"} | json | correlationId="7f3a-b2c1"` → see the full path: gateway OK → order service OK → payment service `ERROR: card declined`. Root cause in 30 seconds.

**Pitfall.** MDC not copied to async threads — logs after `@Async` or Kafka consumption have no correlation ID. Use `TaskDecorator` (Spring) or manual MDC copy.

---

## 9. RED & USE Methods

Frameworks for *what* to measure:

**RED — for request-driven services (APIs).**
| Signal | Metric | Example PromQL |
|--------|--------|----------------|
| **Rate** | Requests per second | `rate(http_requests_total[5m])` |
| **Errors** | Failed requests per second | `rate(http_requests_total{status=~"5.."}[5m])` |
| **Duration** | Latency distribution | `histogram_quantile(0.99, rate(http_request_duration_bucket[5m]))` |

**USE — for resources (hosts, queues, disks).**
| Signal | Metric | Example |
|--------|--------|---------|
| **Utilization** | % time resource busy | CPU at 80%, disk 60% full |
| **Saturation** | Queued work waiting | thread pool queue depth, disk IO wait |
| **Errors** | Error count | disk read errors, NIC drops |

- **RED** (request-driven services): **R**ate (req/s), **E**rrors (failed req/s), **D**uration (latency distribution). Great for APIs.
- **USE** (resources): **U**tilization, **S**aturation, **E**rrors. Great for hosts/queues/disks.
- **Four Golden Signals** (Google SRE): latency, traffic, errors, saturation.

Instrument every service with RED at minimum; you can debug 80% of incidents from these.

**Example — reading RED during an incident.** Rate normal (1000 req/s), errors jumped from 0.1% to 8%, duration p99 from 200ms to 4s. Pattern: something is failing *and* slow — likely a downstream timeout (errors + high duration together), not a simple bug (errors alone).

**Interview angle.** RED tells you about the service from the caller's perspective. USE tells you about the infrastructure the service runs on. Check RED first (user impact), then USE (why — CPU throttled? pool saturated?).

---

## 10. SLI, SLO, SLA

- **SLI** (Indicator) — a measured number, e.g., % of requests < 300ms.
- **SLO** (Objective) — your internal target, e.g., 99.9% of requests < 300ms over 30 days.
- **SLA** (Agreement) — the contractual promise to customers (with penalties), usually looser than the SLO.
- **Error budget** = 100% − SLO (e.g., 0.1% may fail). If you're burning budget fast, freeze risky deploys; if you have budget, ship faster. This balances reliability vs velocity.

**How it works — error budget math.**

SLO: 99.9% availability over 30 days.
- Total minutes: 43,200. Allowed downtime: 0.1% = **43.2 minutes** per month.
- If you've used 40 minutes in the first week, you're burning budget 4× too fast → freeze deploys, focus on reliability.
- If you've used 5 minutes all month, you have budget to spare → ship that risky refactor.

**Example — SLI definition.**
- SLI: `count(requests with latency < 300ms) / count(all requests)` measured over a rolling 30-day window.
- SLO: SLI ≥ 99.9%.
- SLA (customer-facing): 99.5% with service credits if breached — intentionally looser than SLO so you get warned (SLO breach) before customers are affected (SLA breach).

**Interview angle.** SLOs are a *team agreement*, not a monitoring threshold. They drive decisions: "We have 10 minutes of error budget left — do we ship today or wait?"

---

## 11. Alerting

- **Alert on symptoms, not causes** — alert on "error rate / latency SLO breach" (user impact), not "CPU 80%" (which may be fine).
- Make alerts **actionable** — every alert needs a runbook; otherwise it's noise.
- Avoid alert fatigue: use multi-window burn-rate alerts, dedupe, and severities (page vs ticket).
- Page on user-facing impact (SLO burn), ticket on slow-burn/capacity.

**How it works — multi-window burn rate (Google SRE).** Instead of alerting when error rate > 1% (noisy), alert when error budget is burning too fast:
- **Fast burn** (14.4× normal): 2% errors for 5 min → page immediately (budget gone in 3 hours).
- **Slow burn** (6× normal): 5% errors for 30 min → ticket (budget gone in 6 days if sustained).

This catches real outages fast without paging on every blip.

**Example — bad alert vs good alert.**
- Bad: `CPU > 80%` — fires every afternoon during batch jobs; on-call ignores it.
- Good: `error rate > 1% for 5 min AND rate > 100 req/s` — only fires on real user impact with enough traffic to matter.

**Pitfall.** Alerting on causes (pod restarted, GC pause) creates noise. The pod restarted *and* errors spiked? Alert on errors. Pod restarted *and* nothing changed? Log it, don't page.

---

## 12. Debugging: Slow Service

The headline interview question — answer as a **method**, not a guess:

**Worked example — `POST /orders` p99 went from 200ms to 3s.**

1. **Confirm & scope:** Grafana overview → only `POST /orders` affected, all 6 instances, started ~14:30. Deploy annotation at 14:28 — suspicious but not confirmed yet.
2. **Trace it:** Jaeger → filter `service=orders-api, minDuration=1s` → pick trace `abc123`. Waterfall: gateway 10ms → orders-api 2.8s → inventory call 2.6s → DB query inside inventory 2.5s. **Slow hop: inventory's DB query.**
3. **Narrow by layer:**
   - **DB**: check inventory service DB metrics — query time p99 up. `EXPLAIN` on the slow query → missing index on `stock_reservations(order_id)`. Not a deploy issue; a new query path from today's feature flag.
   - **Downstream**: inventory p99 up but root cause is *its* DB, not network.
   - **JVM**: orders-api GC normal, thread dump clean.
   - **Saturation**: HikariCP pending threads = 0 on orders-api; inventory DB connection pool at 95% — related but secondary.
4. **Logs for trace id** `abc123`: `{app="inventory"} | json | traceId="abc123"` → `WARN: slow query 2500ms on SELECT * FROM stock_reservations WHERE order_id=?`.
5. **Fix:** add index on `order_id`. Deploy. Dashboard p99 back to 200ms by 15:00. Confirm with traces.

**General method:**

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

**Worked example — error spike after deploy.**
1. Alert: 5xx rate 0.1% → 12% at 09:05. Deploy at 09:03.
2. Rollback immediately (`kubectl rollout undo`) — errors drop to 0.2% by 09:08. Confirms deploy cause.
3. Logs: `{app="orders-api", level="ERROR"} | json | since deploy` → all errors: `JsonParseException: unrecognized field "discountCode"`. New API version sends a field the old code can't parse.
4. Fix forward with compatible deserialization, redeploy, monitor.

**High memory / OOM:** capture a **heap dump** (`jmap -dump` or `-XX:+HeapDumpOnOutOfMemoryError`), analyze in **MAT/Eclipse** for dominator tree → usual culprits: unbounded caches, lingering collections, classloader/ThreadLocal leaks. In K8s, confirm it's a real leak vs heap > container limit (OOMKilled).

**Worked example — OOMKilled in K8s.**
1. Pod status: `OOMKilled`, restart count 47.
2. `kubectl top pod` — memory at limit (1 Gi) before each kill.
3. Check: real leak or misconfigured JVM? `-XX:MaxRAMPercentage` not set → heap sized for host (8 Gi), container limit 1 Gi → OOM.
4. Fix: set `MaxRAMPercentage=75`, redeploy. Memory stable at 750 Mi. Not a leak — misconfiguration.

**High CPU:** thread dump several times (`jstack`) → find hot/runnable threads; use **async-profiler**/flame graphs → usual culprits: tight loops, excessive GC (check GC logs), regex/serialization hotspots, lock contention.

**Worked example — high CPU.**
1. CPU at 95% sustained, latency normal (CPU-bound background work, not request path).
2. Three `jstack` snapshots 5s apart — same 50 threads in `RUNNABLE` at `JsonSerializer.serialize()`.
3. async-profiler flame graph — 70% CPU in Jackson serialization of a 5 MB response object.
4. Fix: paginate response, cache serialized output. CPU drops to 30%.

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
