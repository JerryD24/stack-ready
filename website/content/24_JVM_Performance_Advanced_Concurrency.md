# JVM Performance & Advanced Concurrency — Deep Dive
### GC Tuning, Diagnostics & Concurrency Beyond synchronized

---

## TABLE OF CONTENTS
1. [JVM Memory Model & Runtime Areas](#1-jvm-memory-areas)
2. [Object Lifecycle & Generational GC](#2-generational-gc)
3. [Garbage Collectors — Serial to ZGC](#3-garbage-collectors)
4. [G1 vs ZGC — Choosing & Tuning](#4-g1-vs-zgc)
5. [Reading GC Logs](#5-reading-gc-logs)
6. [Key JVM Flags](#6-jvm-flags)
7. [Heap Dumps & Memory-Leak Hunting](#7-heap-dumps-leaks)
8. [Thread Dumps & CPU Profiling](#8-thread-dumps-profiling)
9. [Diagnostic Tooling — jstack, jmap, Arthas](#9-diagnostic-tooling)
10. [ThreadPoolExecutor Tuning](#10-threadpool-tuning)
11. [CompletableFuture Patterns](#11-completablefuture)
12. [Virtual Threads — When & Pitfalls](#12-virtual-threads)
13. [Lock-Free & Atomics](#13-lock-free-atomics)
14. [JIT, Escape Analysis & Warmup](#14-jit-warmup)
15. [Interview Q&A](#15-interview-qa)

---

## 1. JVM Memory Areas

```
Per JVM (shared):
  Heap          → all objects (Young + Old gen)
  Metaspace     → class metadata (native memory, replaced PermGen in Java 8)
  Code Cache    → JIT-compiled native code
Per thread:
  Stack         → frames, local vars, references
  PC Register   → current instruction
  Native stack  → JNI
```
- **Heap** is where GC works and where leaks live.
- **Metaspace** grows in native memory — leaks here come from classloader churn (e.g., redeploys, dynamic proxies).
- `OutOfMemoryError` flavors: `Java heap space`, `Metaspace`, `GC overhead limit exceeded`, `unable to create native thread`.

---

## 2. Generational GC

The **weak generational hypothesis**: most objects die young. So the heap is split:
```
Young Gen:  [ Eden | Survivor S0 | Survivor S1 ]   → Minor GC (frequent, fast)
Old Gen:    [ long-lived objects ]                 → Major/Full GC (rarer, costly)
```
- New objects allocate in **Eden**; a **minor GC** copies survivors between survivor spaces, aging them.
- Objects surviving enough cycles are **promoted** to Old gen.
- **Minor GC** = clean Young (fast). **Full GC** = whole heap (stop-the-world, expensive — minimize these).

---

## 3. Garbage Collectors

| GC | Best for | Trait |
|----|----------|-------|
| **Serial** | Tiny heaps, single core | One thread, STW |
| **Parallel (Throughput)** | Batch jobs | Max throughput, longer pauses |
| **CMS** (removed) | Legacy | Concurrent, deprecated |
| **G1** (default since 9) | General server apps | Region-based, predictable pauses |
| **ZGC** | Large heaps, low latency | Sub-millisecond pauses, scales to TBs |
| **Shenandoah** | Low latency | Concurrent compaction (Red Hat) |

Modern default = **G1**. For latency-critical / large-heap services, **ZGC** (`-XX:+UseZGC`, generational ZGC in Java 21+).

---

## 4. G1 vs ZGC

**G1 (Garbage First):**
- Divides heap into equal **regions**; collects regions with the most garbage first.
- Targets a **pause goal** (`-XX:MaxGCPauseMillis=200`).
- Great all-rounder; pauses typically tens–low hundreds of ms.

**ZGC:**
- **Concurrent** marking + relocation using colored pointers / load barriers → **pauses < 1ms** regardless of heap size (GBs–TBs).
- Choose it when tail latency (p99/p999) matters or heaps are very large.

```bash
# G1 (default) with a pause target
-XX:+UseG1GC -XX:MaxGCPauseMillis=150
# ZGC for low-latency
-XX:+UseZGC -Xmx8g
```
Rule: don't tune blindly — measure pauses/throughput first, change one thing, re-measure.

---

## 5. Reading GC Logs

```bash
-Xlog:gc*:file=gc.log:time,uptime,level,tags    # Java 9+ unified logging
```
What to look for:
- **Pause times** — are they within your latency budget? Spikes?
- **Frequency** — frequent Full GCs = heap too small or a leak.
- **Promotion / allocation rate** — high churn means lots of short-lived garbage.
- **Heap after GC trending up** over time → **memory leak** (GC can't reclaim).
- Tools: **GCeasy.io**, **GCViewer** to visualize.

> Symptom mapping: long STW pauses → tune collector / pause goal; rising post-GC heap → leak; frequent Full GC → undersized Old gen or leak.

---

## 6. JVM Flags

```bash
-Xms2g -Xmx2g                 # set min=max to avoid resize pauses
-XX:MaxRAMPercentage=75       # container-aware sizing (preferred in K8s)
-XX:+UseG1GC                  # or -XX:+UseZGC
-XX:MaxGCPauseMillis=150
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps   # auto heap dump on OOM
-Xlog:gc*:file=/logs/gc.log
-XX:+ExitOnOutOfMemoryError   # let the orchestrator restart a clean instance
```
- In containers, prefer `MaxRAMPercentage` over fixed `-Xmx` so the JVM respects cgroup limits (modern JDKs are container-aware).
- Always enable **HeapDumpOnOutOfMemoryError** in prod — a leak is unfixable without the dump.

---

## 7. Heap Dumps & Leaks

A heap dump is a snapshot of all objects — the primary leak-hunting artifact.
```bash
jmap -dump:live,format=b,file=heap.hprof <pid>     # on demand
# or automatic via -XX:+HeapDumpOnOutOfMemoryError
```
Analyze in **Eclipse MAT**:
- **Dominator tree** — what retains the most memory.
- **Leak Suspects** report.
- Compare two dumps over time to see what grows.

**Common Java leaks:**
- Unbounded caches / `static` collections that only ever grow.
- `ThreadLocal`s not removed (esp. in pooled threads) → also classloader leaks.
- Listeners/callbacks never deregistered.
- Large object graphs held by long-lived references; `HashMap` keys with broken `equals/hashCode`.

---

## 8. Thread Dumps & CPU Profiling

A thread dump shows every thread's stack + state — for hangs, deadlocks, high CPU.
```bash
jstack <pid> > threads.txt      # take 3-4 a few seconds apart
jcmd <pid> Thread.print
```
Read it:
- Many **BLOCKED** threads on the same lock → contention bottleneck.
- The JVM prints **"Found one Java-level deadlock"** with the cycle.
- **RUNNABLE** threads repeatedly in the same method across dumps → CPU hotspot.

**CPU profiling:** **async-profiler** (flame graphs, low overhead) or **Java Flight Recorder** (`-XX:+FlightRecorder`, view in JDK Mission Control) to find where CPU/allocations go.

---

## 9. Diagnostic Tooling

| Tool | Use |
|------|-----|
| `jps` | List JVMs |
| `jstack` | Thread dump (deadlock, hang, CPU) |
| `jmap` | Heap dump / histogram (`jmap -histo`) |
| `jcmd` | Swiss-army: GC, threads, flags, JFR |
| `jstat` | Live GC stats |
| **Arthas** | Attach to a running JVM — trace methods, watch args, decompile, profile — **no restart** |
| **async-profiler** | Flame graphs (CPU, alloc, lock) |
| **JFR + JMC** | Low-overhead always-on profiling |
| **MAT** | Heap dump analysis |

Arthas is a senior favorite: `watch`, `trace`, `stack`, `profiler` on a live prod JVM without redeploying.

---

## 10. ThreadPoolExecutor Tuning

```java
new ThreadPoolExecutor(
    core, max, keepAlive, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(capacity),       // BOUNDED → backpressure
    new ThreadFactoryBuilder().setNameFormat("io-%d").build(),  // named → readable dumps
    new ThreadPoolExecutor.CallerRunsPolicy()); // backpressure instead of dropping
```
- **Sizing:** CPU-bound ≈ #cores; I/O-bound ≈ cores × (1 + wait/compute).
- **Never** use `Executors.newFixedThreadPool`/`newCachedThreadPool` in prod (unbounded queue/threads → OOM).
- Task flow: < core → new thread; else enqueue; queue full & < max → new thread; full & at max → reject. (Unbounded queue ⇒ max never reached.)
- Always `shutdown()` + `awaitTermination()`; isolate subsystems with separate pools (**bulkhead**).

---

## 11. CompletableFuture

```java
CompletableFuture.supplyAsync(() -> loadUser(id), pool)   // pass YOUR executor
    .thenCompose(u -> loadOrdersAsync(u.id()))            // chain async (flatMap)
    .thenApply(this::summarize)
    .orTimeout(2, TimeUnit.SECONDS)                        // never block forever
    .exceptionally(ex -> fallback());

// Scatter-gather
var a = CompletableFuture.supplyAsync(this::callA, pool);
var b = CompletableFuture.supplyAsync(this::callB, pool);
CompletableFuture.allOf(a, b).join();
var result = combine(a.join(), b.join());
```
> Always pass an explicit executor to `*Async` — the default `ForkJoinPool.commonPool()` is shared JVM-wide and blocking on it starves parallel streams and other tasks.

---

## 12. Virtual Threads

Java 21 (Loom) — millions of cheap threads mounted onto a few carrier threads.
```java
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    requests.forEach(r -> ex.submit(() -> handleBlocking(r)));  // blocking I/O is fine
}
```
- **Best for I/O-bound** services: write simple blocking code that scales massively; a blocked virtual thread **unmounts** its carrier.
- **Not** for CPU-bound work (still bounded by cores).
- **Pinning pitfall:** a virtual thread blocking inside a `synchronized` block can't unmount → it pins the carrier. **Use `ReentrantLock` instead of `synchronized`** around blocking calls.
- Don't **pool** virtual threads (one per task); be careful with heavy ThreadLocals at scale.

---

## 13. Lock-Free & Atomics

```java
AtomicInteger counter = new AtomicInteger();
counter.incrementAndGet();                 // CAS — no lock
counter.compareAndSet(expect, update);
LongAdder hot = new LongAdder();           // better than AtomicLong under high contention
```
- **CAS (Compare-And-Swap)** = lock-free atomic update; spins on failure rather than blocking.
- **`LongAdder`/`LongAccumulator`** spread contention across cells — use for hot counters.
- **ABA problem:** value goes A→B→A and CAS wrongly succeeds → use `AtomicStampedReference`.
- Concurrent collections (`ConcurrentHashMap`) use fine-grained locking/CAS; prefer atomic compound ops (`computeIfAbsent`, `merge`) over check-then-act.

---

## 14. JIT, Escape Analysis & Warmup

- The JVM **interprets** bytecode first, then the **JIT** compiles hot methods to native code (C1/C2 tiered compilation) → why Java gets faster after **warmup**.
- **Escape analysis** can stack-allocate or scalar-replace objects that don't escape a method, eliminating heap allocation/locks (lock elision).
- Implications: micro-benchmarks must warm up (use **JMH**); cold-start latency matters for serverless (consider AOT/GraalVM native image, or CDS/AppCDS to speed startup).

---

## 15. Interview Q&A

**Q1. Walk through what happens in a minor GC.**
Live objects in Eden + active survivor are copied to the other survivor space and aged; dead objects are reclaimed; long-lived ones get promoted to Old gen. It's fast and stop-the-world but short.

**Q2. G1 vs ZGC — when do you pick ZGC?**
ZGC for very large heaps and strict tail-latency (sub-ms pauses); G1 is the balanced default for typical server apps with a pause goal.

**Q3. How do you diagnose a memory leak?**
Enable HeapDumpOnOutOfMemoryError, take/compare heap dumps, analyze the dominator tree in MAT; watch post-GC heap trending up. Usual causes: unbounded caches, ThreadLocals, listeners.

**Q4. High CPU in prod — your steps?**
Multiple thread dumps to find hot RUNNABLE threads, async-profiler/JFR flame graph; check GC logs for GC-driven CPU; look for tight loops, lock contention, serialization hotspots.

**Q5. Why avoid Executors.newFixedThreadPool in prod?**
Unbounded `LinkedBlockingQueue` grows until OOM under overload. Build a ThreadPoolExecutor with a bounded queue + rejection policy.

**Q6. When do virtual threads help and what's the pinning issue?**
They help I/O-bound concurrency (cheap, unmount on blocking). Pinning: blocking inside `synchronized` keeps the carrier busy — use ReentrantLock instead.

**Q7. What is CAS and the ABA problem?**
Lock-free compare-and-swap; ABA is when a value changes away and back, fooling CAS — fix with a version stamp (AtomicStampedReference).

**Q8. Why is Java "slow then fast"?**
JIT compiles hot paths to native code after profiling at runtime (tiered compilation) — performance improves after warmup; benchmark with JMH.

**Q9. Container OOMKilled but heap looks fine — why?**
Total process memory (heap + Metaspace + thread stacks + direct buffers + native) exceeded the container limit. Size with MaxRAMPercentage and account for off-heap.

**Q10. How do you debug a deadlock?**
Take a thread dump (`jstack`/`jcmd`); the JVM reports the deadlock cycle and the locks involved; fix via consistent lock ordering or tryLock with timeout.
