# Complete Interview Preparation Roadmap
### For Java Backend Developer | 3+ Years Experience → Senior Role

---

## HOW TO USE THIS GUIDE
- Read each `.md` file in order
- Each topic goes from **Beginner → Intermediate → Advanced**
- Revise `00_Topic_List.md` daily as your checklist
- Mark topics: `[ ]` Not started | `[~]` In progress | `[x]` Done

---

## FILE INDEX

| File | Topics Covered |
|------|---------------|
| `01_Java_Core_to_Advanced.md` | Java 8–21, OOP, Collections, Concurrency, JVM, Design Patterns, **§22 wait/sleep/join, ThreadLocal, class loaders, deep/shallow copy** |
| `02_SpringBoot.md` | Spring Core, Boot, REST, Security, JPA, Microservices, **§14 JPA/Hibernate deep dive, §15 Spring Q&A** |
| `03_System_Design_HLD.md` | Scalability, Caching, Databases, Messaging, Real-world designs, **§14 Order tracking, Rate limiter, URL shortener, Redis KV, Auth** |
| `04_System_Design_LLD.md` | OOP Design, SOLID, Design Patterns, LLD problems, **§8 Order Management System** |
| `05_DSA.md` | Arrays, Strings, Trees, Graphs, DP, Greedy, Searching, Sorting |
| `06_CP_Tricks.md` | Java tricks, Bit manipulation, Math shortcuts, Template code |
| `14_AI_Agents_and_MCP_For_Developers.md` | AI Agents, MCP servers, prompt & context engineering, RAG, Beginner → Pro |
| `15_React_JS_Complete_Guide.md` | React.js — JSX, Hooks, Router, Redux, Performance, TypeScript, Testing, React 18/19, Q&A |
| `website/` | **StackReady Web UI** — responsive dashboard + markdown reader (`node server.js`) — deploy: `DEPLOY_GITHUB_PAGES.md` |

---

## SECTION 1 — JAVA (Beginner to Advanced)

### 1.1 Java Core
- [ ] JDK vs JRE vs JVM
- [ ] Data Types, Wrappers, Autoboxing
- [ ] Operators, Control Flow
- [ ] String, StringBuilder, StringBuffer (immutability)
- [ ] Arrays & Varargs
- [ ] Static keyword (variables, methods, blocks, nested classes)
- [ ] `final`, `finally`, `finalize`
- [ ] Pass by value vs Pass by reference
- [ ] Type casting (implicit, explicit, ClassCastException)

### 1.2 Object-Oriented Programming
- [ ] Class, Object, Constructor (default, parameterized, copy)
- [ ] `this` and `super` keywords
- [ ] Inheritance (single, multilevel, hierarchical — NO multiple)
- [ ] Polymorphism (Compile-time: overloading | Runtime: overriding)
- [ ] Encapsulation (getters/setters, access modifiers)
- [ ] Abstraction (abstract class vs interface)
- [ ] Interface default & static methods (Java 8+)
- [ ] Covariant return types
- [ ] Object class methods (`equals`, `hashCode`, `toString`, `clone`, `wait`, `notify`)

### 1.3 Java Collections Framework
- [ ] Iterable → Collection → List/Set/Queue hierarchy
- [ ] ArrayList vs LinkedList vs Vector
- [ ] HashSet vs LinkedHashSet vs TreeSet
- [ ] HashMap vs LinkedHashMap vs TreeMap vs Hashtable
- [ ] HashMap internal working (hashing, buckets, load factor, rehashing)
- [ ] ConcurrentHashMap internal working
- [ ] PriorityQueue, ArrayDeque, Stack
- [ ] Collections utility class
- [ ] Comparable vs Comparator
- [ ] Fail-fast vs Fail-safe iterators

### 1.4 Java Generics
- [ ] Generic classes and methods
- [ ] Bounded type parameters (`<T extends Number>`)
- [ ] Wildcards (`?`, `? extends`, `? super`)
- [ ] Type erasure

### 1.5 Exception Handling
- [ ] Checked vs Unchecked exceptions
- [ ] Exception hierarchy (Throwable → Error / Exception)
- [ ] try-with-resources (AutoCloseable)
- [ ] Multi-catch blocks
- [ ] Custom exceptions (best practices)
- [ ] throws vs throw

### 1.6 Java 8 Features (MOST IMPORTANT)
- [ ] Lambda expressions
- [ ] Functional interfaces (`@FunctionalInterface`, built-in: Predicate, Function, Consumer, Supplier, BiFunction)
- [ ] Stream API (map, filter, reduce, collect, flatMap, distinct, sorted, limit, skip)
- [ ] Terminal vs Intermediate operations
- [ ] Optional class
- [ ] Default and static methods in interface
- [ ] Method references (4 types)
- [ ] `Collectors` (toList, toMap, groupingBy, partitioningBy, joining)
- [ ] Date/Time API (LocalDate, LocalTime, LocalDateTime, ZonedDateTime, Duration, Period)

### 1.7 Java 9–21 Features
- [ ] Java 9: Modules, `List.of()`, `Map.of()`, Stream improvements
- [ ] Java 10: `var` keyword (local variable type inference)
- [ ] Java 11: `String` methods (isBlank, strip, lines, repeat), `var` in lambda
- [ ] Java 14: Records (preview), Switch expressions
- [ ] Java 15: Text blocks
- [ ] Java 16: Records (stable), `instanceof` pattern matching
- [ ] Java 17: Sealed classes (LTS)
- [ ] Java 21: Virtual Threads (Project Loom), Record Patterns, Sequenced Collections (LTS)

### 1.8 Multithreading & Concurrency
- [ ] Thread lifecycle (NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED)
- [ ] Creating threads: `Thread` class vs `Runnable` vs `Callable`
- [ ] `synchronized` keyword (method & block level)
- [ ] `volatile` keyword
- [ ] wait(), notify(), notifyAll()
- [ ] Deadlock, Livelock, Starvation — causes & prevention
- [ ] `java.util.concurrent` package
- [ ] ExecutorService, ThreadPoolExecutor, ScheduledExecutorService
- [ ] `Future` and `CompletableFuture`
- [ ] CountDownLatch, CyclicBarrier, Semaphore, Phaser
- [ ] AtomicInteger, AtomicReference, AtomicLong
- [ ] ReentrantLock, ReadWriteLock, StampedLock
- [ ] ForkJoinPool and parallel streams
- [ ] Thread-safe collections (CopyOnWriteArrayList, ConcurrentHashMap)
- [ ] Virtual Threads (Java 21)

### 1.9 JVM Internals
- [ ] JVM Architecture (Class Loader, Runtime Data Areas, Execution Engine)
- [ ] Class loading (Bootstrap, Extension, Application classloaders)
- [ ] JVM Memory: Heap (Young Gen: Eden+Survivor, Old Gen), Stack, Method Area, PC Register, Native Stack
- [ ] Garbage Collection algorithms: Serial, Parallel, CMS, G1, ZGC, Shenandoah
- [ ] GC roots and reachability
- [ ] String Pool (intern())
- [ ] JIT Compiler
- [ ] Memory leaks in Java — causes and fixes
- [ ] JVM tuning flags (`-Xms`, `-Xmx`, `-XX:+UseG1GC`, etc.)

### 1.10 Design Patterns
- [ ] **Creational**: Singleton (all variants), Factory, Abstract Factory, Builder, Prototype
- [ ] **Structural**: Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy
- [ ] **Behavioral**: Chain of Responsibility, Command, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor
- [ ] Anti-patterns to avoid

---

## SECTION 2 — SPRING BOOT

### 2.1 Spring Core
- [ ] IoC and DI (Inversion of Control, Dependency Injection)
- [ ] Bean lifecycle (instantiation → populate properties → init → use → destroy)
- [ ] Bean scopes: singleton, prototype, request, session, application, websocket
- [ ] `@Autowired`, `@Qualifier`, `@Primary`
- [ ] `@Component`, `@Service`, `@Repository`, `@Controller`, `@RestController`
- [ ] `@Configuration`, `@Bean`
- [ ] ApplicationContext vs BeanFactory
- [ ] Spring AOP (Aspect, Advice, Pointcut, JoinPoint, Weaving)
- [ ] `@Transactional` deep dive (propagation, isolation levels, rollback rules)

### 2.2 Spring Boot
- [ ] Auto-configuration mechanism
- [ ] `@SpringBootApplication` (= `@Configuration` + `@ComponentScan` + `@EnableAutoConfiguration`)
- [ ] `application.properties` vs `application.yml`
- [ ] Profiles (`@Profile`, `spring.profiles.active`)
- [ ] Externalized configuration (`@Value`, `@ConfigurationProperties`)
- [ ] Spring Boot Actuator (endpoints, health, metrics, custom endpoints)
- [ ] Embedded server (Tomcat, Jetty, Undertow)
- [ ] Spring Boot Starter dependencies
- [ ] SpringApplication lifecycle

### 2.3 Spring REST
- [ ] `@RequestMapping`, `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping`
- [ ] `@PathVariable`, `@RequestParam`, `@RequestBody`, `@ResponseBody`
- [ ] `ResponseEntity` — status codes and headers
- [ ] Exception handling: `@ExceptionHandler`, `@ControllerAdvice`, `@RestControllerAdvice`
- [ ] Content negotiation
- [ ] HATEOAS
- [ ] API versioning strategies

### 2.4 Spring Data JPA
- [ ] JPA vs Hibernate vs Spring Data JPA
- [ ] Entity, `@Id`, `@GeneratedValue`, `@Column`, `@Table`
- [ ] Relationships: `@OneToOne`, `@OneToMany`, `@ManyToOne`, `@ManyToMany`
- [ ] Fetch types: EAGER vs LAZY
- [ ] CascadeType, orphanRemoval
- [ ] JpaRepository, CrudRepository, PagingAndSortingRepository
- [ ] JPQL and native queries (`@Query`)
- [ ] Named queries
- [ ] `@Transactional` with JPA
- [ ] N+1 problem and solutions (JOIN FETCH, EntityGraph, batch fetching)
- [ ] Pagination and Sorting (`Pageable`, `Sort`)
- [ ] Optimistic vs Pessimistic locking (`@Version`)
- [ ] Auditing (`@CreatedDate`, `@LastModifiedDate`)
- [ ] Criteria API

### 2.5 Spring Security
- [ ] Authentication vs Authorization
- [ ] `SecurityFilterChain`, filter order
- [ ] UserDetailsService, UserDetails
- [ ] Password encoding (BCrypt)
- [ ] JWT authentication (end-to-end flow)
- [ ] OAuth2 / OpenID Connect
- [ ] `@PreAuthorize`, `@PostAuthorize`, `@Secured`
- [ ] CSRF, CORS configuration
- [ ] Method-level security
- [ ] Spring Security 6.x changes

### 2.6 Microservices with Spring
- [ ] Microservices principles (12-factor app)
- [ ] Spring Cloud components: Config Server, Eureka (Service Discovery), Gateway, Ribbon/LoadBalancer, Feign Client, Hystrix/Resilience4j
- [ ] Circuit breaker pattern
- [ ] Saga pattern (choreography vs orchestration)
- [ ] API Gateway pattern
- [ ] Service mesh concepts (Istio, Envoy)
- [ ] Distributed tracing (Zipkin, Sleuth)
- [ ] Inter-service communication: REST vs gRPC vs Messaging
- [ ] Event-driven architecture with Kafka/RabbitMQ
- [ ] Docker & Kubernetes basics for microservices

---

## SECTION 3 — SYSTEM DESIGN (HLD)

- [ ] Scalability: Vertical vs Horizontal scaling
- [ ] Load Balancing (Round Robin, Least Connections, Consistent Hashing)
- [ ] Caching (L1/L2/L3, CDN, Redis, Memcached, cache invalidation strategies)
- [ ] Database scaling (Read replicas, Sharding, Partitioning)
- [ ] SQL vs NoSQL — when to use which
- [ ] CAP Theorem, BASE, ACID
- [ ] Consistency patterns (strong, eventual, causal)
- [ ] Message Queues (Kafka, RabbitMQ, SQS)
- [ ] Content Delivery Network (CDN)
- [ ] Rate Limiting algorithms (Token Bucket, Leaky Bucket, Sliding Window)
- [ ] Bloom Filters
- [ ] Consistent Hashing
- [ ] Distributed ID generation (UUID, Snowflake, ULID)
- [ ] Service Discovery
- [ ] API Gateway design
- [ ] Event Sourcing & CQRS
- [ ] Distributed Transactions (2PC, Saga)
- [ ] Distributed Locks (Redis Redlock)
- [ ] **Real-world designs**: URL Shortener, Rate Limiter, Notification System, Chat App, News Feed, Search Autocomplete, Uber/Lyft, Netflix/YouTube, Twitter, Payment System

---

## SECTION 4 — SYSTEM DESIGN (LLD)

- [ ] SOLID principles (with Java examples)
- [ ] DRY, KISS, YAGNI principles
- [ ] UML: Class, Sequence, Activity, Use Case diagrams
- [ ] All 23 GoF Design Patterns (Creational, Structural, Behavioral)
- [ ] **Real-world LLD problems**:
  - [ ] Parking Lot
  - [ ] Library Management System
  - [ ] Elevator System
  - [ ] BookMyShow / Movie Ticket Booking
  - [ ] Amazon / E-commerce Cart & Order
  - [ ] Hotel Reservation System
  - [ ] ATM Machine
  - [ ] Chess Game
  - [ ] Snake and Ladder
  - [ ] Vending Machine
  - [ ] Ride Sharing (Uber)
  - [ ] Food Delivery (Swiggy/Zomato)
  - [ ] Splitwise
  - [ ] Logging Framework

---

## SECTION 5 — DSA (for 3–5 YOE roles)

### Data Structures
- [ ] Arrays (1D, 2D, prefix sum, sliding window, two pointers)
- [ ] Strings (palindrome, anagram, substring problems)
- [ ] Linked List (singly, doubly, circular; reverse, detect cycle, merge)
- [ ] Stack (monotonic stack)
- [ ] Queue (BFS, circular queue)
- [ ] Deque / Sliding Window Maximum
- [ ] Binary Tree (traversals, BST, balanced trees)
- [ ] Heap / Priority Queue (min-heap, max-heap, heap sort)
- [ ] Hashing (HashMap, HashSet patterns)
- [ ] Trie (prefix tree)
- [ ] Union-Find (Disjoint Set Union)
- [ ] Segment Tree, Fenwick Tree (BIT) — optional but good to know

### Algorithms
- [ ] Sorting: Bubble, Selection, Insertion, Merge, Quick, Heap, Counting, Radix
- [ ] Binary Search (and variations: first/last occurrence, rotated array, answer space)
- [ ] BFS, DFS (graphs + trees)
- [ ] Topological Sort (Kahn's + DFS)
- [ ] Dijkstra's, Bellman-Ford, Floyd-Warshall
- [ ] Prim's, Kruskal's (MST)
- [ ] Dynamic Programming patterns:
  - [ ] 0/1 Knapsack
  - [ ] Unbounded Knapsack
  - [ ] LCS, LIS, Edit Distance
  - [ ] Matrix Chain Multiplication
  - [ ] Interval DP
  - [ ] Bitmask DP
  - [ ] Digit DP
  - [ ] Tree DP
- [ ] Greedy algorithms
- [ ] Backtracking (permutations, combinations, N-Queens, Sudoku)
- [ ] Divide & Conquer

### Complexity
- [ ] Big-O, Big-Ω, Big-Θ notation
- [ ] Time & Space complexity of all standard algorithms
- [ ] Amortized complexity

---

## SECTION 6 — COMPETITIVE PROGRAMMING TRICKS

- [ ] Fast I/O in Java
- [ ] Bit manipulation tricks (set/unset/toggle bit, count set bits, power of 2, XOR tricks)
- [ ] Modular arithmetic (mod inverse, Fermat's little theorem)
- [ ] Sieve of Eratosthenes
- [ ] GCD, LCM, Extended Euclidean
- [ ] Matrix exponentiation
- [ ] Two pointers / Sliding window patterns
- [ ] Binary search on answer
- [ ] Monotonic stack/queue patterns
- [ ] Java-specific: TreeMap, TreeSet for ordered operations
- [ ] Custom comparator tricks
- [ ] Memoization template (top-down DP)
- [ ] Tabulation template (bottom-up DP)

---

## INTERVIEW QUESTION BANKS

### Java Hot Questions
1. What happens when `HashMap` capacity exceeds load factor?
2. Difference between `==` and `equals()` for Strings
3. Why is String immutable?
4. How does `ConcurrentHashMap` achieve thread safety?
5. What is the difference between `Callable` and `Runnable`?
6. Explain `CompletableFuture` chaining
7. What is the difference between `synchronized` and `ReentrantLock`?
8. How does GC work in Java? Which GC would you use for low-latency?
9. What are virtual threads? How do they differ from platform threads?
10. Explain Java Memory Model (JMM) and `happens-before`

### Spring Boot Hot Questions
1. How does Spring Boot auto-configuration work?
2. What is the difference between `@Component`, `@Service`, `@Repository`?
3. Explain `@Transactional` propagation levels with examples
4. What is N+1 problem and how to solve it?
5. How does JWT authentication work end-to-end?
6. Explain circuit breaker pattern with Resilience4j
7. How to handle distributed transactions in microservices?
8. What is the difference between `@RestController` and `@Controller`?
9. How does Spring AOP work internally?
10. Explain Spring Security filter chain

### System Design Hot Questions
1. Design a URL shortener (like bit.ly)
2. Design a rate limiter
3. Design WhatsApp / chat system
4. Design Netflix (video streaming)
5. Design Twitter news feed
6. Design an e-commerce system
7. How would you design a notification service?
8. Design a distributed cache
9. Design a search autocomplete system
10. How would you scale a database to handle millions of users?

---

## DAILY STUDY PLAN (8-Week Roadmap)

| Week | Focus Area |
|------|-----------|
| Week 1 | Java Core + OOP + Collections |
| Week 2 | Java 8 Features + Generics + Exception Handling |
| Week 3 | Multithreading + JVM + Design Patterns |
| Week 4 | Spring Boot + REST + JPA |
| Week 5 | Spring Security + Microservices + Spring Cloud |
| Week 6 | System Design HLD (concepts + 5 designs) |
| Week 7 | System Design LLD (SOLID + 5 problems) |
| Week 8 | DSA Revision + CP Tricks + Mock Interviews |

---

## SECTION 6 — REACT.JS (Beginner to Advanced)

### 6.1 React Fundamentals
- [ ] What is React, SPA, Virtual DOM, reconciliation
- [ ] JSX rules, fragments, expressions
- [ ] Functional vs class components
- [ ] Props (read-only), state, one-way data flow
- [ ] Lifting state up, state colocation

### 6.2 Hooks (Critical)
- [ ] useState — functional updates
- [ ] useEffect — deps, cleanup, common mistakes
- [ ] useContext, useReducer, useRef
- [ ] useMemo, useCallback — when to use
- [ ] useLayoutEffect, useId
- [ ] useTransition, useDeferredValue (React 18)
- [ ] Custom hooks — useFetch, useDebounce
- [ ] Rules of Hooks

### 6.3 UI Patterns
- [ ] Event handling, SyntheticEvent
- [ ] Controlled vs uncontrolled forms
- [ ] Lists, keys, conditional rendering
- [ ] Error boundaries, Portals, forwardRef

### 6.4 Ecosystem
- [ ] React Router v6 — routes, nested, protected
- [ ] Redux Toolkit vs Zustand vs Context
- [ ] Performance — React.memo, lazy, Suspense, virtualization
- [ ] TypeScript with React
- [ ] Testing — Jest, React Testing Library
- [ ] Vite, Next.js, SSR vs SSG vs CSR

### 6.5 Advanced & Interview
- [ ] React 18/19 — concurrent, Server Components
- [ ] Compound components, HOC, render props
- [ ] Code puzzles (batching, stale closure, infinite loop)
- [ ] Todo app, debounce, infinite scroll coding problems
- [ ] Full Q&A bank in `15_React_JS_Complete_Guide.md`

---

## SECTION 7 — AI AGENTS & MCP (in `14_AI_Agents_and_MCP_For_Developers.md`)

- [ ] §23 Memory bloating in agentic AI
- [ ] §23 Partial failures in agentic AI
- [ ] §23 Hallucinations in agentic AI
- [ ] §23 Performance issues in agentic AI

---

## SECTION 8 — JAVA MULTITHREADING DEEP DIVE (in `16_Java_Multithreading_Deep_Dive.md`)

- [ ] Process vs Thread — memory sharing model
- [ ] When to use threads, Amdahl's Law, CPU vs I/O pool sizing
- [ ] Thread lifecycle & states (sleep vs wait lock behavior)
- [ ] Creating threads — Thread, Runnable, Callable, ExecutorService
- [ ] Concurrency models (pool, producer-consumer, fork-join, pipeline, scatter-gather)
- [ ] Synchronization — synchronized, volatile, Locks, Atomics/CAS
- [ ] Java Memory Model & happens-before
- [ ] wait/notify & BlockingQueue producer-consumer
- [ ] Thread pools & ExecutorService lifecycle
- [ ] ThreadPoolExecutor internals (core/max/queue/rejection policy)
- [ ] Callable, Future & CompletableFuture pipelines
- [ ] Concurrent collections (ConcurrentHashMap, CopyOnWriteArrayList)
- [ ] ForkJoinPool & parallel streams
- [ ] Virtual threads (Java 21, Project Loom)
- [ ] Deadlock, livelock, starvation — prevention & diagnosis
- [ ] Real-world multithreading patterns (partitioned queues, batching, async callback)
- [ ] Multithreading best practices & cooperative interruption
- [ ] Multithreading interview Q&A bank

---

## SECTION 9 — JAVA STREAMS DEEP DIVE (in `17_Java_Streams_Deep_Dive.md`)

- [ ] Stream vs Collection, pipeline anatomy, single-use
- [ ] Creating streams (of, iterate, generate, IntStream, Files.lines)
- [ ] Intermediate ops (filter, map, sorted, distinct, limit, takeWhile)
- [ ] Terminal ops (collect, reduce, count, match, find)
- [ ] Collectors (groupingBy, partitioningBy, toMap, joining, teeing)
- [ ] flatMap & nested data flattening
- [ ] Primitive streams (IntStream/LongStream/DoubleStream)
- [ ] Optional — map, filter, orElse, orElseGet, ifPresent
- [ ] Parallel streams — when to use and pitfalls
- [ ] Lazy evaluation & short-circuiting
- [ ] Stream common pitfalls
- [ ] Real-world stream examples (grouping, indexing, top-N)
- [ ] Streams interview Q&A bank

---

## SECTION 10 — JAVA & SPRING ANNOTATIONS DEEP DIVE (in `18_Annotations_Deep_Dive.md`)

- [ ] What annotations are & how frameworks use them
- [ ] Built-in Java annotations (@Override, @Deprecated, @FunctionalInterface)
- [ ] Meta-annotations (@Target, @Retention, @Inherited, @Repeatable)
- [ ] Creating custom annotations
- [ ] Retention policies & reading annotations via reflection
- [ ] Compile-time annotation processing (Lombok, MapStruct)
- [ ] Core Spring annotations (@Component, @Autowired, @Bean, @Configuration)
- [ ] Spring Boot annotations (@SpringBootApplication, @ConfigurationProperties, @Async, @Scheduled)
- [ ] Spring Web/REST annotations (@RestController, @GetMapping, @RequestBody)
- [ ] Spring Data JPA annotations (@Entity, @Id, relationships, @Query)
- [ ] Validation annotations (@Valid, @NotNull, @Size, @Email)
- [ ] Transaction & AOP annotations (@Transactional, @Aspect, advice)
- [ ] Testing annotations (@SpringBootTest, @MockBean, slices)
- [ ] Annotations interview Q&A bank

---

## SECTION 11 — NODE.JS (in `19_Node_JS_Complete_Guide.md`)

- [ ] What is Node.js, V8, libuv, non-blocking I/O
- [ ] Event loop phases, microtasks vs macrotasks
- [ ] Modules — CommonJS vs ES Modules
- [ ] npm, package.json, semver, lockfile
- [ ] Callbacks, Promises, async/await, Promise.all
- [ ] Core modules (fs, path, http, events)
- [ ] Streams & Buffers, backpressure, pipeline
- [ ] HTTP server & Express basics
- [ ] Middleware, routing, async error handling
- [ ] REST API design with Express (status codes, validation)
- [ ] Databases — Mongoose, pg pool, parameterized queries
- [ ] Auth (JWT, bcrypt) & security checklist
- [ ] Error handling & graceful shutdown
- [ ] Performance, clustering & worker threads
- [ ] Testing Node apps (Jest, Supertest)
- [ ] TypeScript with Node.js
- [ ] Node production best practices
- [ ] Node coding problems (promisify, mapLimit, retry, debounce)
- [ ] Node.js interview Q&A bank

---

## SECTION 12 — APACHE KAFKA (in `20_Kafka_Deep_Dive.md`)

- [ ] What Kafka is — distributed commit log, when to use
- [ ] Brokers, topics, partitions, replication, ISR, controller
- [ ] Producers — acks, batching, partitioning, idempotence
- [ ] Consumers & consumer groups, partition assignment
- [ ] Rebalancing — cooperative, static membership, tuning
- [ ] Offsets & delivery semantics (at-least-once default)
- [ ] Exactly-once — idempotent producer & transactions
- [ ] Ordering guarantees (per partition, keying)
- [ ] Retry topics & dead-letter queues
- [ ] Outbox pattern (transactional event publishing)
- [ ] Backpressure & flow control (pull, pause/resume)
- [ ] Consumer lag monitoring & operations
- [ ] Schema registry & compatibility modes
- [ ] Spring Kafka in practice
- [ ] Design: 50,000 events/sec system
- [ ] Kafka interview Q&A bank

---

## SECTION 13 — KUBERNETES, DOCKER & CLOUD-NATIVE (in `21_Kubernetes_Docker_CloudNative.md`)

- [ ] Docker fundamentals — images, layers, containers
- [ ] Production Dockerfiles (multi-stage, non-root)
- [ ] Docker networking, volumes, compose
- [ ] Kubernetes architecture (control plane, nodes)
- [ ] Pods, ReplicaSets & Deployments
- [ ] Services & Ingress
- [ ] ConfigMaps & Secrets
- [ ] Liveness, readiness & startup probes
- [ ] Resource requests, limits & QoS (OOMKilled)
- [ ] Horizontal Pod Autoscaler (+ KEDA, Cluster Autoscaler)
- [ ] Rolling deploys & rollbacks
- [ ] StatefulSets & persistent storage (PV/PVC)
- [ ] AWS for backend (EKS/ECS/S3/RDS/SQS/IAM)
- [ ] CI/CD to Kubernetes (GitHub Actions, GitOps)
- [ ] Troubleshooting pods (CrashLoopBackOff etc.)
- [ ] Kubernetes/Docker interview Q&A bank

---

## SECTION 14 — RESILIENCE & DISTRIBUTED PATTERNS (in `22_Resilience_Distributed_Patterns.md`)

- [ ] Why resilience — cascading failure, fallacies
- [ ] Timeouts & deadline propagation
- [ ] Retries & exponential backoff + jitter
- [ ] Circuit breaker (CLOSED/OPEN/HALF_OPEN)
- [ ] Bulkhead isolation
- [ ] Rate limiting (token/leaky/sliding window)
- [ ] Resilience4j in practice
- [ ] Idempotency keys
- [ ] Distributed locks (Redis/Redisson, fencing)
- [ ] Saga pattern (choreography vs orchestration)
- [ ] Distributed ID generation (Snowflake)
- [ ] CAP, strong vs eventual consistency
- [ ] Graceful degradation & fallbacks
- [ ] Resilience interview Q&A bank

---

## SECTION 15 — OBSERVABILITY & PRODUCTION DEBUGGING (in `23_Observability_Production_Debugging.md`)

- [ ] Observability vs monitoring
- [ ] Three pillars — metrics, logs, traces
- [ ] Metrics with Prometheus & PromQL
- [ ] Dashboards with Grafana
- [ ] Structured logging (JSON, levels, no PII)
- [ ] Log aggregation (ELK & Loki)
- [ ] Distributed tracing (OpenTelemetry & Jaeger)
- [ ] Correlation IDs / trace propagation
- [ ] RED & USE methods (golden signals)
- [ ] SLI, SLO, SLA & error budgets
- [ ] Alerting on symptoms, actionable alerts
- [ ] Debugging: a service is slow in prod
- [ ] Debugging: errors, memory, CPU
- [ ] Observability interview Q&A bank

---

## SECTION 16 — JVM PERFORMANCE & ADVANCED CONCURRENCY (in `24_JVM_Performance_Advanced_Concurrency.md`)

- [ ] JVM memory areas (heap, metaspace, stacks)
- [ ] Generational GC (young/old, minor/full)
- [ ] Garbage collectors — Serial to ZGC
- [ ] G1 vs ZGC — choosing & tuning
- [ ] Reading GC logs
- [ ] Key JVM flags (container-aware sizing)
- [ ] Heap dumps & memory-leak hunting (MAT)
- [ ] Thread dumps & CPU profiling (flame graphs)
- [ ] Diagnostic tooling — jstack, jmap, Arthas
- [ ] ThreadPoolExecutor tuning
- [ ] CompletableFuture patterns
- [ ] Virtual threads — when & pinning pitfalls
- [ ] Lock-free & atomics (CAS, LongAdder, ABA)
- [ ] JIT, escape analysis & warmup
- [ ] JVM performance interview Q&A bank

---

## SECTION 17 — REDIS & CACHING STRATEGY (in `25_Redis_Caching_Strategy.md`)

- [ ] Why cache & what Redis is
- [ ] Redis data structures (String/Hash/ZSet/Stream)
- [ ] Caching patterns overview
- [ ] Cache-aside (lazy loading)
- [ ] Write-through & write-behind
- [ ] Eviction policies (LRU/LFU)
- [ ] TTL & expiration design (jitter)
- [ ] Cache stampede & hot keys
- [ ] Cache penetration & avalanche
- [ ] Cache vs DB consistency (invalidate)
- [ ] Redis as a distributed lock
- [ ] Redis as a rate limiter
- [ ] Persistence, HA & cluster (RDB/AOF/Sentinel)
- [ ] Spring Cache with Redis
- [ ] Redis/caching interview Q&A bank

---

## SECTION 18 — SQL AT SCALE (in `26_SQL_at_Scale.md`)

- [ ] How a query executes (optimizer, stats)
- [ ] Indexing deep dive (B-tree, composite, covering)
- [ ] Reading EXPLAIN plans
- [ ] The N+1 problem & fixes
- [ ] Query optimization techniques (sargable, keyset)
- [ ] Transactions & isolation levels
- [ ] Optimistic vs pessimistic locking
- [ ] Connection pooling & HikariCP sizing
- [ ] Read replicas & read/write splitting
- [ ] Partitioning (range/hash, pruning)
- [ ] Sharding (shard key, hot shards)
- [ ] SQL vs NoSQL & denormalization
- [ ] Schema migrations at scale (expand-contract)
- [ ] SQL at scale interview Q&A bank

---

## SECTION 19 — DESIGN PATTERNS IN JAVA (in `27_Design_Patterns_Java.md`)

- [ ] Why design patterns matter — vocabulary, decoupling, trade-offs
- [ ] SOLID principles recap (SRP, OCP, LSP, ISP, DIP)
- [ ] Pattern categories & how to choose (creational/structural/behavioral)
- [ ] Singleton — variants & thread safety (Java)
- [ ] Factory Method (Java)
- [ ] Abstract Factory — product families (Java)
- [ ] Builder — fluent, immutable objects (Java)
- [ ] Prototype — cloning & deep copy (Java)
- [ ] Adapter — wrap incompatible APIs (Java)
- [ ] Bridge — abstraction vs implementation (Java)
- [ ] Composite — tree structures (Java)
- [ ] Decorator — stackable responsibilities (Java)
- [ ] Facade — simplify a subsystem (Java)
- [ ] Flyweight — share immutable state (Java)
- [ ] Proxy — control access (lazy/security/AOP) (Java)
- [ ] Chain of Responsibility — handler pipeline (Java)
- [ ] Command — encapsulate requests, queue/undo (Java)
- [ ] Iterator — traverse without exposing internals (Java)
- [ ] Mediator — centralize interactions (Java)
- [ ] Memento — snapshot & restore state (Java)
- [ ] Observer — publish/subscribe (Java)
- [ ] State — behaviour by lifecycle state (Java)
- [ ] Strategy — interchangeable algorithms (Java)
- [ ] Template Method — algorithm skeleton (Java)
- [ ] Visitor — operations over a type hierarchy (Java)
- [ ] Interpreter — small grammar/DSL (Java)
- [ ] Enterprise & Spring patterns (DI, Repository, DTO, Proxy/AOP)
- [ ] Anti-patterns to avoid (God object, singleton abuse, patternitis)
- [ ] Java design patterns interview Q&A bank

---

## SECTION 20 — DESIGN PATTERNS IN PYTHON (in `28_Design_Patterns_Python.md`)

- [ ] Design patterns the Pythonic way
- [ ] Python idioms that replace patterns
- [ ] Creational patterns overview (Python)
- [ ] Singleton — module/metaclass (Python)
- [ ] Factory Method — dict dispatch / classmethod (Python)
- [ ] Abstract Factory — Protocol-based families (Python)
- [ ] Builder — kwargs/dataclasses/fluent (Python)
- [ ] Prototype — copy/deepcopy (Python)
- [ ] Adapter — duck typing wrapper (Python)
- [ ] Bridge — composition with Protocol (Python)
- [ ] Composite — recursive trees (Python)
- [ ] Decorator — @decorator vs structural (Python)
- [ ] Facade — module/class entry point (Python)
- [ ] Flyweight — __slots__ + lru_cache (Python)
- [ ] Proxy — __getattr__ / cached_property (Python)
- [ ] Chain of Responsibility — middleware list (Python)
- [ ] Command — closures / functools.partial (Python)
- [ ] Iterator — generators & yield (Python)
- [ ] Mediator — coordinator (Python)
- [ ] Memento — deepcopy / pickle state (Python)
- [ ] Observer — callbacks / signals (Python)
- [ ] State — state machine objects (Python)
- [ ] Strategy — pass a Callable (Python)
- [ ] Template Method — ABC or HOF (Python)
- [ ] Visitor — functools.singledispatch (Python)
- [ ] Interpreter — expression tree / DSL (Python)
- [ ] Python design patterns interview Q&A bank

---

## SECTION 21 — PYTHON INTERVIEW QUESTIONS (in `29_Python_Interview_Questions.md`)

- [ ] Python core language & data model (is vs ==, mutability, args, mutable defaults)
- [ ] Python data structures & time complexity
- [ ] Python OOP, MRO/C3, super, dunder methods, metaclasses, descriptors
- [ ] Python decorators (wraps, retry/backoff, stateful, lru_cache)
- [ ] Python generators & iterators (yield, yield from, lazy)
- [ ] The GIL & concurrency (threading vs multiprocessing vs asyncio)
- [ ] Async/await with asyncio (gather, tasks, blocking, timeouts)
- [ ] Python memory management & GC (refcount, cyclic GC, __del__, __slots__)
- [ ] Python performance & optimization (profiling, comprehensions)
- [ ] Type hints, dataclasses & Pydantic, Protocol
- [ ] Standard library idioms (collections, itertools, functools)
- [ ] Modern Python 3.10–3.13 (match, walrus, free-threaded)
- [ ] Exceptions & context managers (with, async, exception groups, EAFP)
- [ ] Python testing & tooling (pytest, ruff, uv, mypy)
- [ ] Python tricky output & gotchas (floats, list refs, closures)
- [ ] Pythonic coding problems (Counter, dedupe, group, LRU)

---

> **Next Step**: Open `01_Java_Core_to_Advanced.md` and start reading!
