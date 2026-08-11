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

**Theory.** When debugging OOM or leaks, you need to know **where** memory lives. The heap holds your objects; stacks hold method call context; Metaspace holds class definitions. A "Java heap OOM" and "Metaspace OOM" have different causes and fixes.

**How it works.**
- **Heap:** All objects from `new`. GC manages this. `-Xmx` caps it. Two generations: Young (Eden + Survivors) for new objects, Old for long-lived.
- **Stack (per thread):** Each method call = one **frame** with local variables and references. Default ~1MB per platform thread (`-Xss`). Deep recursion → `StackOverflowError`. References point to heap objects; primitives live directly on the stack.
- **Metaspace:** Class metadata, method bytecode, static fields. Grows in **native** memory (outside `-Xmx`). Classloader leaks (redeploy without GC) fill Metaspace.
- **Code Cache:** JIT-compiled native code. Rarely tuned unless "CodeCache is full" errors appear.

**Example.** `User user = new User()` — the `User` object is on the heap; the reference variable `user` is in the current stack frame. When the method returns, the frame is popped; if nothing else references that `User`, it becomes GC-eligible.

**Pitfall.** Container OOMKilled with "heap only 60% used" → total process memory (heap + Metaspace + thread stacks × count + direct buffers) exceeded the cgroup limit.

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

**Theory.** Allocating and collecting every object in one big heap would be slow. **Generational hypothesis:** most objects die within milliseconds (temp strings, request wrappers). Collect the young area often (cheap); touch old area rarely (expensive).

The **weak generational hypothesis**: most objects die young. So the heap is split:

**How it works — Minor GC step by step:**
1. Application allocates in **Eden** until full.
2. **Minor GC** (Stop-The-World, but short): GC roots (stack refs, static fields) mark reachable objects in Eden + active Survivor.
3. Live objects copied to the **other** Survivor space; age incremented. Dead objects in Eden discarded — no compaction needed in Eden (copying collector).
4. Survivors that exceed **MaxTenuringThreshold** (default 15) move to **Old Gen**.
5. When Old Gen fills → **Full GC** — marks entire heap, compacts, long pause.

**Example.** A REST handler creates 50 short-lived objects per request. After the response, all 50 are unreachable. Minor GC reclaims them without touching Old Gen — pause might be 5–20ms vs 500ms+ for Full GC.

```
Young Gen:  [ Eden | Survivor S0 | Survivor S1 ]   → Minor GC (frequent, fast)
Old Gen:    [ long-lived objects ]                 → Major/Full GC (rarer, costly)
```
- New objects allocate in **Eden**; a **minor GC** copies survivors between survivor spaces, aging them.
- Objects surviving enough cycles are **promoted** to Old gen.
- **Minor GC** = clean Young (fast). **Full GC** = whole heap (stop-the-world, expensive — minimize these).

---

## 3. Garbage Collectors

**Theory.** A GC **collector** decides when and how to reclaim unreachable objects. Trade-off: **throughput** (total work done) vs **latency** (pause length). Batch jobs want throughput; payment APIs want low tail latency.

| GC | Best for | Trait |
|----|----------|-------|
| **Serial** | Tiny heaps, single core | One thread, STW |
| **Parallel (Throughput)** | Batch jobs | Max throughput, longer pauses |
| **CMS** (removed) | Legacy | Concurrent, deprecated |
| **G1** (default since 9) | General server apps | Region-based, predictable pauses |
| **ZGC** | Large heaps, low latency | Sub-millisecond pauses, scales to TBs |
| **Shenandoah** | Low latency | Concurrent compaction (Red Hat) |

Modern default = **G1**. For latency-critical / large-heap services, **ZGC** (`-XX:+UseZGC`, generational ZGC in Java 21+).

**Interview angle.** Serial = one GC thread, small heaps. Parallel = multiple GC threads, longer pauses acceptable. G1 = region-based, targets pause time. ZGC/Shenandoah = concurrent relocation, sub-ms pauses at cost of some throughput overhead.

---

## 4. G1 vs ZGC

**Theory.** **G1** is the balanced default — good for most Spring services with 2–16GB heaps. **ZGC** is for when p99/p999 latency SLAs matter or heaps are huge (100GB+), because it keeps pauses under ~1ms regardless of heap size.

**G1 (Garbage First):**
- Divides heap into equal **regions** (1–32MB each); regions can be Eden, Survivor, or Old dynamically.
- Maintains a **remembered set** of cross-region references so it doesn't scan the entire heap.
- Collects regions with the most garbage first (Garbage First) to meet `-XX:MaxGCPauseMillis` target.
- Pauses typically **10–200ms** depending on heap and live set.

**ZGC:**
- Uses **colored pointers** (metadata bits in address) and **load barriers** — when your code reads a reference, the barrier may fix it if the object was moved.
- **Concurrent relocation:** moves objects while application threads run; only brief pauses for root scanning.
- Pauses **< 1ms** even on terabyte heaps. Trade-off: ~15% throughput overhead vs G1 on some workloads.

**How to choose:**
| Scenario | Pick |
|----------|------|
| Typical microservice, 4GB heap, p99 < 500ms OK | G1 (default) |
| Large heap (64GB+), strict p99 < 50ms | ZGC |
| Batch ETL, maximize throughput | Parallel GC |

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

**Theory.** GC logs tell you whether performance problems are **allocation pressure** (too many short-lived objects), **undersized heap** (frequent Full GC), or **leaks** (heap after GC keeps growing). Without logs you're guessing.

```bash
-Xlog:gc*:file=gc.log:time,uptime,level,tags    # Java 9+ unified logging
```

**How to read a typical G1 line:**
```
[2026-06-29T10:15:32.123+0000][info][gc] GC(42) Pause Young (Normal) 512M->128M(2048M) 12.345ms
```
- `GC(42)` — 42nd GC event
- `Pause Young` — Minor GC (Young gen only)
- `512M->128M` — heap used before → after (512M live before, 128M after — 384M reclaimed)
- `(2048M)` — current heap capacity
- `12.345ms` — pause duration (application threads stopped)

**Example — leak signature:** Over 24 hours, `heap after Full GC` goes 1.2GB → 1.5GB → 1.8GB → 2.1GB while traffic is flat. GC can't reclaim — something is retaining objects.

What to look for:
- **Pause times** — are they within your latency budget? Spikes?
- **Frequency** — frequent Full GCs = heap too small or a leak.
- **Promotion / allocation rate** — high churn means lots of short-lived garbage.
- **Heap after GC trending up** over time → **memory leak** (GC can't reclaim).
- Tools: **GCeasy.io**, **GCViewer** to visualize.

> Symptom mapping: long STW pauses → tune collector / pause goal; rising post-GC heap → leak; frequent Full GC → undersized Old gen or leak.

---

## 6. JVM Flags

**Theory.** JVM flags control heap size, GC algorithm, and diagnostic behavior. Wrong flags cause resize pauses (`-Xms` ≠ `-Xmx`), OOM in containers (fixed `-Xmx` ignoring cgroup limits), or missing artifacts when debugging production incidents.

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

**Theory.** A heap dump is a **photograph** of every object in memory at one instant — who references whom. It's the primary artifact for answering "why is my heap 8GB?" Leak hunting compares dumps over time or analyzes dominators after OOM.

A heap dump is a snapshot of all objects — the primary leak-hunting artifact.

**How it works — dominator tree:** Object A **dominates** B if every path from GC roots to B goes through A. The dominator tree shows the **retention hierarchy** — the biggest retained set at the top is usually your leak (e.g., a `static HashMap` cache holding millions of entries).

**Worked example — ThreadLocal leak:**
```java
// Each request sets context; pool thread never clears it
ThreadLocal<byte[]> buffer = ThreadLocal.withInitial(() -> new byte[1_000_000]);
// After 200 requests on a 200-thread pool → 200MB retained forever
// Fix: buffer.remove() in finally block
```

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

**Theory.** When a service is **slow but not crashed**, thread dumps show what every thread is doing right now. Multiple dumps seconds apart distinguish transient waits from permanent bottlenecks. CPU profiling shows **where** time is spent, not just that threads are busy.

A thread dump shows every thread's stack + state — for hangs, deadlocks, high CPU.

**How to read a thread entry:**
```
"http-nio-8080-exec-5" #23 daemon prio=5 os_prio=0 cpu=1234.56ms elapsed=5678.90s
   java.lang.Thread.State: BLOCKED (on object monitor)
   at com.example.Service.process(Service.java:42)
   - waiting to lock <0x00000000abc12345> (a java.lang.Object)
   owned by "http-nio-8080-exec-3" Id=21
```
- **BLOCKED** waiting for a lock held by exec-3 → lock contention at `Service.process:42`
- Same method in many RUNNABLE threads across 3 dumps → CPU hotspot (tight loop or heavy computation)

**Example workflow for "CPU at 100%":**
1. Take 3 thread dumps 5 seconds apart.
2. Find threads with high `cpu=` time stuck in the same method.
3. Run async-profiler on that method for a flame graph.
4. Check GC logs — sometimes high CPU is GC thrashing, not application code.

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

**Theory.** Production JVM problems fall into three buckets: **memory** (heap/Metaspace), **threads** (deadlock/contention), and **CPU** (hot methods). Different tools attach to each without redeploying — critical when you can't restart prod to add debug logging.

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

**Theory.** Thread pool tuning is **backpressure design**: how does your system behave when overloaded? A bounded queue + rejection policy answers that — grow threads, block the caller, or fail fast — instead of silently consuming all memory.

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

**Theory.** Virtual threads let you scale I/O-bound services without reactive programming complexity. The JVM multiplexes many virtual threads onto few OS threads, unmounting on blocking I/O.

Java 21 (Loom) — millions of cheap threads mounted onto a few carrier threads.

**How it works.** Carrier threads (≈ `#cores`) run virtual thread code. On blocking I/O, the virtual thread yields its carrier. **Pinning** happens when code holds a `synchronized` monitor during blocking — the carrier can't switch. `ReentrantLock` doesn't pin.

**Interview angle.** "Should I replace my thread pool with virtual threads?" → For I/O-bound request handling, yes (one virtual thread per task). For CPU-bound work or strict pool sizing for backpressure, keep bounded platform pools.

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

**Theory.** Locks block threads — context switches and priority inversion under contention. **Lock-free** algorithms use CAS to retry until success, so at least one thread always makes progress. You trade lock overhead for **retry loops** under heavy contention.

**How it works — CAS at the CPU level:**
```
// Pseudocode for incrementAndGet on AtomicInteger
int current;
do {
    current = value;           // read
} while (!CAS(value, current, current + 1));  // atomic: set if still current
return current + 1;
```
If another thread changed `value` between read and CAS, the CAS fails and the loop retries with the fresh value.

**Example — why LongAdder beats AtomicLong under contention:**
`AtomicLong` — all threads CAS the same memory word → cache line bouncing.
`LongAdder` — each thread updates its own **cell**, summed on read → spreads contention.

**ABA problem:** Thread A reads A, Thread B changes A→B→A, Thread A's CAS(A, new) succeeds even though the structure changed. Fix: `AtomicStampedReference` with a version counter.

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

**Theory.** Java starts **interpreted** (slow, fast startup) and gets faster as the **JIT** compiles hot methods to native machine code. This is why the first 1000 requests in a service are slower than the next 10,000 — and why micro-benchmarks without warmup lie.

**How it works — tiered compilation:**
1. **Interpreter** runs everything initially.
2. **C1 (client) compiler** — quick, less optimized native code for warm methods.
3. **C2 (server) compiler** — aggressive optimizations (inlining, loop unrolling) for the hottest methods.
4. Methods that aren't hot stay interpreted — cold code paths don't pay compilation cost.

**Escape analysis:** If the JIT proves an object **never escapes** a method (no return, no store to field, no pass to other threads), it may:
- **Stack-allocate** instead of heap-allocating (eliminates GC pressure).
- **Scalar-replace** — break object fields into separate local variables.
- **Lock elision** — remove `synchronized` on objects that can't be shared.

**Example:**
```java
void compute() {
    Point p = new Point(1, 2);  // may never hit heap if JIT proves p doesn't escape
    return p.x + p.y;
}
```

**Pitfall.** Benchmarking with `-Xint` (interpret only) or before warmup gives misleading numbers. Use **JMH** with warmup iterations. For serverless/cold start, consider **CDS/AppCDS** (class data sharing) or GraalVM native image.

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
