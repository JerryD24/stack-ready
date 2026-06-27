# Java Multithreading — Deep Dive
### From Fundamentals to Production Patterns | 10+ Years Engineer Perspective

---

## TABLE OF CONTENTS
1. [Process vs Thread — The Foundation](#1-process-vs-thread)
2. [Why Multithreading & When NOT to Use It](#2-why-multithreading)
3. [Thread Lifecycle & States](#3-thread-lifecycle)
4. [Ways to Create Threads](#4-ways-to-create-threads)
5. [Types / Models of Multithreading](#5-types-of-multithreading)
6. [Synchronization — synchronized, Locks, volatile, Atomics](#6-synchronization)
7. [The Java Memory Model (JMM) & happens-before](#7-java-memory-model)
8. [wait / notify & Producer–Consumer](#8-wait-notify-producer-consumer)
9. [Thread Pools & ExecutorService](#9-thread-pools)
10. [ThreadPoolExecutor Internals — Tuning Every Knob](#10-threadpoolexecutor-internals)
11. [Callable, Future & CompletableFuture](#11-callable-future-completablefuture)
12. [Concurrent Collections](#12-concurrent-collections)
13. [ForkJoinPool & Parallel Streams](#13-forkjoinpool-parallel-streams)
14. [Virtual Threads (Java 21, Project Loom)](#14-virtual-threads)
15. [Deadlock, Livelock, Starvation](#15-deadlock-livelock-starvation)
16. [Real-World Patterns (Production Services)](#16-real-world-patterns)
17. [Best Practices & Common Pitfalls](#17-best-practices)
18. [Interview Q&A Bank](#18-interview-qa)

---

## 1. Process vs Thread

| Aspect | Process | Thread |
|--------|---------|--------|
| Definition | An independent program in execution | A lightweight unit of execution within a process |
| Memory | Own address space (heap, code, data) | Shares the process heap & method area; has own **stack + PC register** |
| Communication | IPC (sockets, pipes, shared memory) — expensive | Shared memory — cheap but needs synchronization |
| Creation cost | High (OS-level) | Lower (but platform threads still ~1MB stack) |
| Crash impact | Isolated | One bad thread can corrupt shared state of whole process |

**Key takeaway:** Threads share heap memory. That sharing is exactly what makes them powerful *and* dangerous — every shared mutable object is a potential race condition.

What each thread owns vs shares:
```
Shared across threads:   Heap (objects), Method Area (class metadata, static vars)
Private per thread:      Stack (local vars, method frames), Program Counter, native stack
```

---

## 2. Why Multithreading

**Use it for:**
- **CPU-bound parallelism** — split heavy computation across cores (image processing, batch math, aggregations).
- **I/O-bound concurrency** — keep CPU busy while threads wait on DB / network / disk (the most common server use case).
- **Responsiveness** — offload long work off the request/UI thread.
- **Throughput** — process many independent units (messages, records, requests) at once.

**Do NOT reach for threads when:**
- The work is trivial — thread creation/coordination overhead exceeds the gain.
- Tasks are tightly dependent (heavy locking serializes them anyway → you gain nothing).
- A simpler model exists (async I/O, a message queue, a batch job, DB-side processing).

> **Amdahl's Law (interview favorite):** Speedup is capped by the serial fraction. If 10% of your work is inherently sequential, the **maximum** speedup is 10× no matter how many cores you add. Always profile the serial bottleneck before parallelizing.

**CPU-bound vs I/O-bound sizing rule of thumb:**
- CPU-bound pool size ≈ number of cores (`Runtime.getRuntime().availableProcessors()`).
- I/O-bound pool size ≈ cores × (1 + wait time / compute time) — can be much larger because threads spend time blocked.

---

## 3. Thread Lifecycle

```
NEW  ──start()──►  RUNNABLE  ──scheduler──►  (Running)
                      │  ▲
        wait()/join() │  │ notify()/notifyAll()/timeout
                      ▼  │
   WAITING / TIMED_WAITING
                      │
   lock contention    ▼
                   BLOCKED  ──acquires monitor──►  RUNNABLE
                                                      │ run() ends / exception
                                                      ▼
                                                  TERMINATED
```

| State | Meaning |
|-------|---------|
| `NEW` | Created but `start()` not called |
| `RUNNABLE` | Eligible to run (running or ready, JVM doesn't distinguish) |
| `BLOCKED` | Waiting to acquire a monitor lock (`synchronized`) |
| `WAITING` | Indefinitely waiting (`wait()`, `join()`, `LockSupport.park()`) |
| `TIMED_WAITING` | Waiting with timeout (`sleep`, `wait(ms)`, `join(ms)`) |
| `TERMINATED` | Completed or threw |

**Gotcha:** `Thread.sleep()` is `TIMED_WAITING` and **does not release** held monitor locks. `wait()` is `WAITING`/`TIMED_WAITING` and **does release** the monitor. This distinction is asked constantly.

---

## 4. Ways to Create Threads

```java
// 1. Extend Thread (rarely preferred — uses up your single inheritance slot)
class Worker extends Thread {
    public void run() { System.out.println("running"); }
}
new Worker().start();   // start() spawns a new thread; run() would NOT

// 2. Implement Runnable (preferred — separates task from execution mechanism)
Runnable task = () -> System.out.println("running");
new Thread(task).start();

// 3. Callable + ExecutorService (returns a result / can throw checked exceptions)
Callable<Integer> job = () -> 40 + 2;
ExecutorService pool = Executors.newFixedThreadPool(4);
Future<Integer> f = pool.submit(job);
Integer result = f.get();   // blocks until done

// 4. CompletableFuture (async pipelines, non-blocking composition)
CompletableFuture.supplyAsync(() -> fetch())
                 .thenApply(this::transform)
                 .thenAccept(this::save);

// 5. Virtual threads (Java 21) — millions of cheap threads
Thread.startVirtualThread(() -> handleRequest());
```

**`start()` vs `run()` — the classic trap:** Calling `run()` directly executes the body on the *current* thread (no new thread). Only `start()` asks the JVM to create a new OS/virtual thread and invoke `run()` on it.

**Runnable vs Callable:**
| | Runnable | Callable<V> |
|--|----------|-------------|
| Returns value | No (`void run()`) | Yes (`V call()`) |
| Throws checked exc. | No | Yes |
| Used with | `Thread`, `execute()` | `submit()` → `Future` |

---

## 5. Types of Multithreading

Different concurrency **models** you'll choose between in real systems:

1. **Thread-per-task** — spawn a thread for each unit. Simple, but unbounded threads = OOM / context-switch storm. Only safe with virtual threads.
2. **Thread pool (bounded)** — fixed set of worker threads pull tasks from a queue. The default for servers. Backpressure via a bounded queue.
3. **Producer–Consumer** — producers push to a `BlockingQueue`, consumers drain it. Decouples ingestion rate from processing rate.
4. **Fork–Join (divide & conquer)** — recursively split a big task, work-stealing across cores. Great for CPU-bound, balanced workloads.
5. **Pipeline / staged (SEDA)** — each stage has its own pool + queue (parse → enrich → persist). Each stage tuned independently.
6. **Master–Worker** — one coordinator distributes work units to a worker pool and aggregates results.
7. **Event-loop / reactive** — a few threads + non-blocking I/O (Netty, WebFlux). High concurrency with few threads.
8. **Scatter–Gather** — fan out N parallel calls, then join results (e.g., query 5 downstreams, merge). `CompletableFuture.allOf` or virtual threads.

A senior engineer picks the model based on: workload type (CPU vs I/O), latency vs throughput goals, ordering requirements, and failure isolation needs.

---

## 6. Synchronization

### 6.1 `synchronized`
Mutual exclusion via an object's intrinsic monitor lock.
```java
// Method-level: locks 'this' (or the Class object for static methods)
public synchronized void increment() { count++; }

// Block-level: lock a specific monitor — finer-grained, preferred
private final Object lock = new Object();
public void increment() {
    synchronized (lock) { count++; }
}
```
- Reentrant: a thread already holding the lock can re-acquire it.
- `count++` is **not atomic** (read-modify-write) — without synchronization, two threads can lose updates.

### 6.2 `volatile`
Guarantees **visibility** and ordering, but **not atomicity**.
```java
private volatile boolean running = true;   // good: simple flag, one thread writes
public void stop() { running = false; }    // change visible to all threads immediately
```
- Use for flags / publish-once references.
- Do **NOT** use for `count++` — that's still a race (no atomicity).

### 6.3 Explicit Locks (`java.util.concurrent.locks`)
```java
ReentrantLock lock = new ReentrantLock();
lock.lock();
try { /* critical section */ }
finally { lock.unlock(); }   // ALWAYS unlock in finally
```
Advantages over `synchronized`:
- `tryLock()` (non-blocking / with timeout) → avoids deadlock.
- `lockInterruptibly()` → can be interrupted while waiting.
- **Fairness** option (FIFO ordering).
- `ReadWriteLock` → many concurrent readers, exclusive writer (read-heavy caches).
- `StampedLock` → optimistic reads, even faster for read-mostly workloads.

### 6.4 Atomic Variables (lock-free)
```java
AtomicInteger counter = new AtomicInteger();
counter.incrementAndGet();          // atomic, lock-free (CAS under the hood)
counter.compareAndSet(expect, update);
LongAdder adder = new LongAdder();  // better than AtomicLong under high contention
```
Backed by **CAS (Compare-And-Swap)** CPU instructions — no locking, no blocking. Use `LongAdder`/`LongAccumulator` for hot counters with many writers.

**Decision guide:**
| Need | Use |
|------|-----|
| Visibility of a flag/reference | `volatile` |
| Atomic single variable | `Atomic*` / `LongAdder` |
| Guard a compound action / multiple fields | `synchronized` or `ReentrantLock` |
| Read-heavy, rare writes | `ReadWriteLock` / `StampedLock` |
| Timeout / interruptible / fairness | `ReentrantLock` |

---

## 7. Java Memory Model

The JMM defines **when** a write by one thread becomes **visible** to another. Without it, the compiler/CPU may reorder or cache values in registers.

**happens-before relationships** (if A happens-before B, A's effects are visible to B):
- Program order within a single thread.
- `unlock` of a monitor happens-before a subsequent `lock` of the same monitor.
- Write to a `volatile` happens-before every subsequent read of it.
- `Thread.start()` happens-before any action in the started thread.
- All actions in a thread happen-before another thread's successful `join()` on it.

**Why it matters:** "It works on my machine" bugs in concurrency are usually missing happens-before edges — a value cached in a CPU register or reordered. `volatile`/locks insert the necessary memory barriers.

```java
// Broken double-checked locking WITHOUT volatile — can publish a half-constructed object
class Singleton {
    private static volatile Singleton instance;  // volatile is REQUIRED here
    static Singleton get() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) instance = new Singleton();
            }
        }
        return instance;
    }
}
```

---

## 8. wait / notify & Producer–Consumer

Low-level coordination on an object's monitor. **Always** call inside `synchronized` and **always** wait in a loop (guard against spurious wakeups).
```java
synchronized (lock) {
    while (!condition) {     // loop, not if — spurious wakeups are real
        lock.wait();
    }
    // proceed
}
// elsewhere
synchronized (lock) {
    condition = true;
    lock.notifyAll();        // prefer notifyAll over notify to avoid lost signals
}
```

**Modern, preferred approach — `BlockingQueue`** (don't hand-roll wait/notify):
```java
BlockingQueue<Order> queue = new LinkedBlockingQueue<>(10_000);  // bounded => backpressure

// Producer
queue.put(order);     // blocks if full

// Consumer
Order o = queue.take();   // blocks if empty
```
`put`/`take` handle all the waiting/signaling for you. A bounded queue gives natural backpressure so a fast producer can't OOM the JVM.

---

## 9. Thread Pools

### Why pools exist
Creating a platform thread is expensive (~1MB stack, OS scheduling). Unbounded thread creation → context-switch thrashing and `OutOfMemoryError: unable to create new native thread`. A pool **reuses** a fixed set of workers and **queues** excess work — this is the single most important production concurrency tool.

### The `Executors` factory shortcuts (and why seniors avoid them)
```java
Executors.newFixedThreadPool(n);     // n threads, UNBOUNDED queue  -> hidden OOM risk
Executors.newCachedThreadPool();     // UNBOUNDED threads           -> OOM under load spike
Executors.newSingleThreadExecutor(); // 1 thread, unbounded queue
Executors.newScheduledThreadPool(n); // delayed / periodic tasks
Executors.newVirtualThreadPerTaskExecutor(); // Java 21 — one virtual thread per task
```
> **Senior insight:** `newFixedThreadPool` and `newSingleThreadExecutor` use an **unbounded** `LinkedBlockingQueue`. Under sustained overload the queue grows until OOM. `newCachedThreadPool` creates an unbounded number of threads. In production, **construct your own `ThreadPoolExecutor` with a bounded queue and an explicit rejection policy.**

### Lifecycle — always shut down
```java
ExecutorService pool = ...;
pool.submit(task);
pool.shutdown();                    // no new tasks; finishes queued ones
if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {
    pool.shutdownNow();             // interrupt running tasks, drop queued
}
```
Leaked pools = leaked threads = the app won't exit and memory climbs.

---

## 10. ThreadPoolExecutor Internals

Every knob you should know cold:
```java
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    corePoolSize,        // threads kept alive even when idle
    maximumPoolSize,     // hard ceiling on threads
    keepAliveTime,       // idle timeout for threads above core
    TimeUnit.SECONDS,
    workQueue,           // task buffer (bounded!)
    threadFactory,       // name threads -> readable thread dumps
    rejectionHandler     // what to do when full
);
```

### How a task flows in (the algorithm — asked in interviews)
1. If running threads `< corePoolSize` → **create a new core thread** for the task.
2. Else → **try to enqueue** the task in `workQueue`.
3. If the queue is **full** and threads `< maximumPoolSize` → **create a non-core thread**.
4. If the queue is full **and** threads `== maximumPoolSize` → **reject** via the rejection handler.

> Counter-intuitive consequence: with an **unbounded** queue, `maximumPoolSize` is never reached (step 2 always succeeds), so extra threads never spawn. This is exactly why `newFixedThreadPool` ignores its max.

### Queue choices
| Queue | Behaviour |
|-------|-----------|
| `ArrayBlockingQueue` (bounded) | Fixed capacity, predictable memory — **recommended** |
| `LinkedBlockingQueue` (unbounded by default) | Grows unbounded → OOM risk |
| `SynchronousQueue` | No buffering — hands off directly; pairs with large max pool |
| `PriorityBlockingQueue` | Tasks processed by priority |

### Rejection policies
| Policy | Behaviour |
|--------|-----------|
| `AbortPolicy` (default) | Throws `RejectedExecutionException` |
| `CallerRunsPolicy` | Runs task on the **caller's** thread → natural backpressure / slows producer |
| `DiscardPolicy` | Silently drops the task |
| `DiscardOldestPolicy` | Drops oldest queued task, retries |

**Production-grade pool template:**
```java
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    16, 32, 60L, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(1_000),
    new ThreadFactoryBuilder().setNameFormat("ingest-worker-%d").build(),
    new ThreadPoolExecutor.CallerRunsPolicy()   // backpressure instead of dropping
);
pool.allowCoreThreadTimeOut(true);  // let it scale to zero when idle
```
Naming threads is not cosmetic — it makes thread dumps and production incident triage dramatically faster.

---

## 11. Callable, Future & CompletableFuture

### Future limitations
`Future.get()` **blocks**, you can't chain callbacks, and you can't easily combine multiple futures. `CompletableFuture` fixes all three.

### CompletableFuture — the async workhorse
```java
CompletableFuture<User> uf = CompletableFuture.supplyAsync(() -> loadUser(id), pool);

uf.thenApply(User::getAccountId)              // transform (sync continuation)
  .thenCompose(acc -> loadBalanceAsync(acc))  // flatMap — chain another async call
  .thenAccept(balance -> render(balance))     // consume
  .exceptionally(ex -> { log.error("fail", ex); return null; }); // error handling

// Scatter–gather: run N calls in parallel, wait for all
CompletableFuture<A> a = CompletableFuture.supplyAsync(this::callA, pool);
CompletableFuture<B> b = CompletableFuture.supplyAsync(this::callB, pool);
CompletableFuture.allOf(a, b).join();
Result r = combine(a.join(), b.join());

// Combine two independent results
af.thenCombine(bf, (x, y) -> merge(x, y));

// Timeout (Java 9+)
uf.orTimeout(2, TimeUnit.SECONDS)
  .completeOnTimeout(fallback, 2, TimeUnit.SECONDS);
```

**Key methods cheat-sheet:**
| Method | Purpose |
|--------|---------|
| `thenApply` | Map result (sync) |
| `thenApplyAsync` | Map on another pool |
| `thenCompose` | Chain dependent async call (flatMap) |
| `thenCombine` | Combine two independent futures |
| `allOf` / `anyOf` | Wait for all / first |
| `exceptionally` / `handle` | Recover from failure |
| `orTimeout` | Fail if too slow |

> **Always pass your own executor** to `*Async` methods. The default `ForkJoinPool.commonPool()` is shared JVM-wide; blocking I/O on it starves parallel streams and other CFs across the whole app.

---

## 12. Concurrent Collections

| Use case | Class | Notes |
|----------|-------|-------|
| Map | `ConcurrentHashMap` | Lock-striping (Java 8: CAS + per-bin synchronized). No null keys/values. |
| List (read-heavy) | `CopyOnWriteArrayList` | Every write copies the array — great for rare writes (listeners), terrible for frequent writes |
| Queue (FIFO blocking) | `LinkedBlockingQueue` / `ArrayBlockingQueue` | Producer–consumer |
| Deque | `ConcurrentLinkedDeque` / `LinkedBlockingDeque` | Work-stealing, both ends |
| Priority | `PriorityBlockingQueue` | Ordered consumption |
| Delayed / scheduled | `DelayQueue` | Elements available after a delay |
| Skip list (sorted) | `ConcurrentSkipListMap/Set` | Sorted concurrent map |

**`ConcurrentHashMap` atomic compound ops (avoid check-then-act races):**
```java
map.computeIfAbsent(key, k -> expensiveLoad(k));   // atomic
map.merge(key, 1, Integer::sum);                    // atomic counter
map.compute(key, (k, v) -> v == null ? 1 : v + 1);
```
Never do `if (!map.containsKey(k)) map.put(k, v);` — that's a race. Use `putIfAbsent`/`computeIfAbsent`.

**Why not `Collections.synchronizedMap`?** It locks the whole map per operation (coarse) and still needs external sync for iteration. `ConcurrentHashMap` scales far better and offers atomic compound ops.

---

## 13. ForkJoinPool & Parallel Streams

**Fork/Join** = divide-and-conquer with **work-stealing** (idle threads steal tasks from busy threads' deques).
```java
class SumTask extends RecursiveTask<Long> {
    final long[] arr; final int lo, hi;
    SumTask(long[] a, int lo, int hi) { this.arr=a; this.lo=lo; this.hi=hi; }
    protected Long compute() {
        if (hi - lo <= 1000) {                 // threshold: don't split too small
            long s = 0; for (int i=lo;i<hi;i++) s += arr[i]; return s;
        }
        int mid = (lo + hi) >>> 1;
        SumTask left = new SumTask(arr, lo, mid);
        left.fork();                            // async
        SumTask right = new SumTask(arr, mid, hi);
        long r = right.compute();               // compute one side directly
        return left.join() + r;
    }
}
```

**Parallel streams** ride on the shared `ForkJoinPool.commonPool()`:
```java
long sum = list.parallelStream().mapToLong(this::heavy).sum();
```
- Good for **CPU-bound**, large, **splittable** sources (arrays, ArrayList) with **stateless, associative** operations.
- **Avoid** for I/O-bound work or small collections — they pollute the common pool and often run slower than sequential.
- To isolate parallel-stream work, submit it inside your own `ForkJoinPool`:
```java
new ForkJoinPool(8).submit(() -> list.parallelStream().forEach(this::process)).get();
```

---

## 14. Virtual Threads

Java 21 (Project Loom) — JEP 444. Lightweight threads scheduled by the JVM onto a small pool of **carrier** (platform) threads.
```java
// One virtual thread per task — cheap to create millions
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (Request r : requests) {
        executor.submit(() -> handle(r));   // blocking I/O here is FINE
    }
}
```
- **Cheap**: ~few hundred bytes vs ~1MB for platform threads. Millions are feasible.
- When a virtual thread **blocks on I/O**, it **unmounts** from its carrier, freeing it for other work — so the classic "thread-per-request, write simple blocking code" model scales massively.
- **Best for I/O-bound** services (each request waits on DB/HTTP). **Not** a speedup for CPU-bound work (still limited by cores).

**Pitfalls:**
- **Pinning**: a virtual thread inside a `synchronized` block doing blocking I/O *pins* the carrier (can't unmount). Prefer `ReentrantLock` over `synchronized` around blocking calls.
- Don't **pool** virtual threads — create one per task. Pooling defeats the purpose.
- Don't rely on thread-local heavy caching (you may have millions of threads).

---

## 15. Deadlock, Livelock, Starvation

**Deadlock** — two+ threads each hold a lock the other needs, forever.
```java
// Thread 1: lock A then B ;  Thread 2: lock B then A  -> deadlock
```
The four **Coffman conditions** (all must hold): mutual exclusion, hold-and-wait, no preemption, circular wait. Break any one to prevent deadlock.

**Prevention strategies:**
- **Global lock ordering** — always acquire locks in the same order (e.g., by object id). Most common fix.
- **`tryLock` with timeout** — back off and retry instead of blocking forever.
- **Reduce lock scope** / use a single coarse lock / lock-free structures.

**Livelock** — threads keep responding to each other and changing state but make no progress (two people stepping aside in a hallway). Fix with randomized backoff.

**Starvation** — a thread never gets CPU/lock because others monopolize it (e.g., low priority, or unfair locks). Fix with **fair** locks / fair queues.

**Diagnosis in prod:** take a thread dump (`jstack <pid>` or `jcmd <pid> Thread.print`). The JVM explicitly prints `Found one Java-level deadlock` and the cycle. `BLOCKED` threads waiting on monitors point to contention.

---

## 16. Real-World Patterns

> The following are **generic, anonymized** patterns drawn from large-scale telco/order-processing systems. Service names are intentionally omitted.

### 16.1 High-Throughput Event/Order Processing Engine
A core processing engine consumes a continuous stream of events (orders, charging events, requests) and must process thousands per second with strict ordering **per key** but parallelism **across keys**.

**Pattern used:** a **bounded thread pool fronted by partitioned queues**.
```java
// N worker queues; route each event to a queue by a stable key hash
int partitions = 16;
List<BlockingQueue<Event>> queues = IntStream.range(0, partitions)
    .mapToObj(i -> new LinkedBlockingQueue<Event>(5_000))
    .collect(Collectors.toList());

void dispatch(Event e) {
    int p = Math.floorMod(e.getKey().hashCode(), partitions);
    queues.get(p).put(e);   // same key -> same partition -> ordering preserved
}
// One single-threaded consumer per partition => parallel across keys, ordered within a key
```
- **Why partitioning:** guarantees per-entity ordering (e.g., all events for one account processed in sequence) while still using all cores.
- **Backpressure:** bounded queues + `CallerRunsPolicy` slow the upstream when the engine falls behind, preventing OOM.
- **Idempotency:** because retries happen on failure, each handler is written to be idempotent (safe to reprocess).

### 16.2 Bulk Data Injector / Ingestion Service
A service that ingests large batches of records (millions) into downstream stores needs maximum throughput without overwhelming the database.

**Pattern used:** **producer–consumer with a bounded queue + batching**.
```java
BlockingQueue<Record> q = new ArrayBlockingQueue<>(50_000);
// Producers: readers parsing the input feed -> q.put(record)
// Consumers: a fixed pool that DRAINS in batches and bulk-inserts
List<Record> batch = new ArrayList<>(1_000);
q.drainTo(batch, 1_000);            // grab up to 1000 at once
repository.bulkInsert(batch);       // one round-trip instead of 1000
```
- **Batching** amortizes DB round-trips → orders-of-magnitude throughput gain.
- **Bounded queue** caps memory and provides backpressure when the DB is the bottleneck.
- Pool size tuned to the DB connection pool size (no point having more writers than connections).

### 16.3 Asynchronous Compute / Callback Service
A service that accepts a request, kicks off long-running downstream work, and notifies the caller asynchronously (callback / event) rather than holding the request thread.

**Pattern used:** **`CompletableFuture` pipelines on a dedicated executor + async callback**.
```java
ExecutorService compute = new ThreadPoolExecutor(/* tuned, bounded */);

CompletableFuture
    .supplyAsync(() -> validate(req), compute)
    .thenComposeAsync(v -> callDownstreamAsync(v), compute)  // chain async I/O
    .thenApplyAsync(this::enrich, compute)
    .whenComplete((result, ex) -> {
        if (ex != null) callback.onError(req.getId(), ex);
        else            callback.onSuccess(req.getId(), result);
    });
// request thread returns immediately (202 Accepted) — no blocking
```
- Frees the request/HTTP thread instantly → far higher concurrency on the front door.
- A **dedicated bounded executor** isolates this work from other subsystems (bulkhead pattern) so a downstream slowdown can't exhaust the shared pool.
- `whenComplete` centralizes success/failure callback dispatch.

### 16.4 Scatter–Gather Aggregation
Fan out to several independent downstreams, then merge — common in aggregation/composition layers.
```java
var f1 = CompletableFuture.supplyAsync(() -> svcA.fetch(id), pool);
var f2 = CompletableFuture.supplyAsync(() -> svcB.fetch(id), pool);
var f3 = CompletableFuture.supplyAsync(() -> svcC.fetch(id), pool);
CompletableFuture.allOf(f1, f2, f3).orTimeout(2, TimeUnit.SECONDS).join();
return merge(f1.join(), f2.join(), f3.join());
```
Total latency ≈ slowest call instead of the sum of all calls.

**Cross-cutting production lessons:**
- **Bulkheading**: give each subsystem its **own** pool so one slow dependency can't starve everything.
- **Timeouts everywhere**: an unbounded blocking call is a latent outage.
- **Metrics**: export pool queue depth, active threads, rejection count — these are your earliest overload signals.
- **Graceful shutdown**: drain queues and `awaitTermination` so in-flight work isn't lost on deploy.
- **MDC / trace propagation**: copy logging context across thread handoffs, or your distributed traces break.

---

## 17. Best Practices

**Do:**
- Prefer **higher-level constructs** (`ExecutorService`, `CompletableFuture`, `BlockingQueue`, concurrent collections) over raw `Thread`/`wait`/`notify`.
- Always use **bounded** queues and an explicit **rejection policy** in production.
- **Name your threads** (custom `ThreadFactory`) for debuggable thread dumps.
- Keep critical sections **small**; do I/O **outside** locks.
- Make shared objects **immutable** where possible (immutability eliminates most races).
- Always `unlock()` in `finally`; always `shutdown()` pools.
- Make task handlers **idempotent** if they can be retried.
- Pass an **explicit executor** to `CompletableFuture.*Async`.

**Don't:**
- Don't call `Thread.stop()/suspend()/resume()` (deprecated, unsafe). Use **interruption** + a `volatile` flag.
- Don't swallow `InterruptedException` — restore the flag: `Thread.currentThread().interrupt();`.
- Don't share `SimpleDateFormat`, `Random` (use `ThreadLocalRandom`), or other non-thread-safe objects across threads.
- Don't use `Executors.newFixedThreadPool`/`newCachedThreadPool` blindly in prod (unbounded queue/threads).
- Don't block inside a `parallelStream()` or the common `ForkJoinPool`.
- Don't `synchronized` around blocking I/O when using virtual threads (pinning).

**Interruption — the cooperative cancellation model:**
```java
while (!Thread.currentThread().isInterrupted()) {
    try {
        doWork();
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();  // restore flag, then exit cleanly
        break;
    }
}
```

---

## 18. Interview Q&A

**Q1. `synchronized` vs `ReentrantLock`?**
`ReentrantLock` adds `tryLock`, timeouts, interruptibility, fairness, and multiple `Condition`s — at the cost of explicit `unlock()` in `finally`. `synchronized` is simpler, JVM-optimized (biased/lightweight locking), and auto-releases. Use `synchronized` by default; reach for `ReentrantLock` when you need its extra capabilities.

**Q2. Does `volatile` make `count++` thread-safe?**
No. `volatile` guarantees visibility/ordering but not atomicity. `count++` is read-modify-write (3 steps). Use `AtomicInteger`/`LongAdder` or a lock.

**Q3. `wait()` vs `sleep()`?**
`wait()` releases the monitor and waits for `notify`; must be in a `synchronized` block; it's on `Object`. `sleep()` keeps all locks and just pauses; it's static on `Thread`. Both can be interrupted.

**Q4. Why is `newFixedThreadPool` risky?**
It uses an unbounded `LinkedBlockingQueue`; under sustained overload the queue grows until `OutOfMemoryError`. Build a `ThreadPoolExecutor` with a bounded queue + rejection policy.

**Q5. How does `ThreadPoolExecutor` decide to create a thread vs queue?**
Below core size → new core thread. Else enqueue. Queue full and below max → new thread. Queue full and at max → reject. (With an unbounded queue, max is never reached.)

**Q6. What's a thread dump and how do you read it?**
Snapshot of all threads' stacks (`jstack`/`jcmd Thread.print`). Look for `BLOCKED` threads (lock contention), `WAITING` on the same monitor (possible bottleneck), and the explicit "deadlock" section.

**Q7. `ConcurrentHashMap` vs `Collections.synchronizedMap`?**
CHM uses fine-grained locking/CAS for high concurrency and offers atomic compound ops (`computeIfAbsent`, `merge`). `synchronizedMap` locks the whole map per op and needs manual sync for iteration.

**Q8. CAS and the ABA problem?**
CAS = atomic compare-and-swap (lock-free). ABA: a value changes A→B→A and CAS wrongly succeeds. Fix with a version stamp — `AtomicStampedReference`.

**Q9. How do virtual threads change pool sizing?**
For I/O-bound work you no longer size pools to limit threads — you create one virtual thread per task and let the JVM unmount them on blocking. CPU-bound work still needs bounded parallelism (cores).

**Q10. How do you cancel a running task cleanly?**
Cooperative interruption: call `future.cancel(true)` / `thread.interrupt()`, check `isInterrupted()` in loops, and propagate `InterruptedException` (restore the flag). Never `Thread.stop()`.

**Q11. Producer is faster than consumer — what happens and how to handle?**
With an unbounded queue → memory grows → OOM. Use a **bounded** queue (`put` blocks) for backpressure, or `CallerRunsPolicy`, or scale consumers, or drop/sample if data is lossy-tolerant.

**Q12. What is the difference between concurrency and parallelism?**
Concurrency = dealing with many tasks at once (structure — interleaving). Parallelism = doing many tasks at the same instant (execution — multiple cores). You can have concurrency on a single core; parallelism needs multiple cores.
