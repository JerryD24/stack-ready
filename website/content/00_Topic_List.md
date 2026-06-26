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

> **Next Step**: Open `01_Java_Core_to_Advanced.md` and start reading!
