/**
 * Maps guide sections → Master Roadmap checklist items (00_Topic_List.md).
 * Single source of truth: checklist cookies (check once, syncs everywhere).
 */
const ProgressMap = (function () {
  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i);
    return h;
  }

  function slug(text) {
    return text.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function checklistId(text) {
    const clean = text.trim();
    return slug(clean).slice(0, 80) + '-' + Math.abs(hashCode(clean));
  }

  const JAVA_OOP = [
    'Class, Object, Constructor (default, parameterized, copy)',
    '`this` and `super` keywords',
    'Inheritance (single, multilevel, hierarchical — NO multiple)',
    'Polymorphism (Compile-time: overloading | Runtime: overriding)',
    'Encapsulation (getters/setters, access modifiers)',
    'Abstraction (abstract class vs interface)',
    'Interface default & static methods (Java 8+)',
    'Covariant return types',
    'Object class methods (`equals`, `hashCode`, `toString`, `clone`, `wait`, `notify`)'
  ];

  const GUIDE_TOPIC_MAP = {
    '01_Java_Core_to_Advanced.md': {
      '1-jvm-jdk-jre': ['JDK vs JRE vs JVM'],
      '2-data-types-memory': [
        'Data Types, Wrappers, Autoboxing',
        'Operators, Control Flow',
        'Arrays & Varargs',
        'Static keyword (variables, methods, blocks, nested classes)',
        '`final`, `finally`, `finalize`',
        'Pass by value vs Pass by reference',
        'Type casting (implicit, explicit, ClassCastException)'
      ],
      '3-object-oriented-programming': JAVA_OOP,
      '4-string-deep-dive': ['String, StringBuilder, StringBuffer (immutability)'],
      '5-java-collections-framework': [
        'Iterable → Collection → List/Set/Queue hierarchy',
        'ArrayList vs LinkedList vs Vector',
        'HashSet vs LinkedHashSet vs TreeSet',
        'HashMap vs LinkedHashMap vs TreeMap vs Hashtable',
        'HashMap internal working (hashing, buckets, load factor, rehashing)',
        'ConcurrentHashMap internal working',
        'PriorityQueue, ArrayDeque, Stack',
        'Collections utility class',
        'Comparable vs Comparator',
        'Fail-fast vs Fail-safe iterators'
      ],
      '6-generics': [
        'Generic classes and methods',
        'Bounded type parameters (`<T extends Number>`)',
        'Wildcards (`?`, `? extends`, `? super`)',
        'Type erasure'
      ],
      '7-exception-handling': [
        'Checked vs Unchecked exceptions',
        'Exception hierarchy (Throwable → Error / Exception)',
        'try-with-resources (AutoCloseable)',
        'Multi-catch blocks',
        'Custom exceptions (best practices)',
        'throws vs throw'
      ],
      '8-java-8-features': [
        'Lambda expressions',
        'Functional interfaces (`@FunctionalInterface`, built-in: Predicate, Function, Consumer, Supplier, BiFunction)',
        'Stream API (map, filter, reduce, collect, flatMap, distinct, sorted, limit, skip)',
        'Terminal vs Intermediate operations',
        'Optional class',
        'Default and static methods in interface',
        'Method references (4 types)',
        '`Collectors` (toList, toMap, groupingBy, partitioningBy, joining)',
        'Date/Time API (LocalDate, LocalTime, LocalDateTime, ZonedDateTime, Duration, Period)'
      ],
      '9-java-921-features': [
        'Java 9: Modules, `List.of()`, `Map.of()`, Stream improvements',
        'Java 10: `var` keyword (local variable type inference)',
        'Java 11: `String` methods (isBlank, strip, lines, repeat), `var` in lambda',
        'Java 14: Records (preview), Switch expressions',
        'Java 15: Text blocks',
        'Java 16: Records (stable), `instanceof` pattern matching',
        'Java 17: Sealed classes (LTS)',
        'Java 21: Virtual Threads (Project Loom), Record Patterns, Sequenced Collections (LTS)'
      ],
      '10-multithreading-concurrency': [
        'Thread lifecycle (NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED)',
        'Creating threads: `Thread` class vs `Runnable` vs `Callable`',
        '`synchronized` keyword (method & block level)',
        '`volatile` keyword',
        'wait(), notify(), notifyAll()',
        'Deadlock, Livelock, Starvation — causes & prevention',
        '`java.util.concurrent` package',
        'ExecutorService, ThreadPoolExecutor, ScheduledExecutorService',
        '`Future` and `CompletableFuture`',
        'CountDownLatch, CyclicBarrier, Semaphore, Phaser',
        'AtomicInteger, AtomicReference, AtomicLong',
        'ReentrantLock, ReadWriteLock, StampedLock',
        'ForkJoinPool and parallel streams',
        'Thread-safe collections (CopyOnWriteArrayList, ConcurrentHashMap)',
        'Virtual Threads (Java 21)'
      ],
      '11-jvm-internals-garbage-collection': [
        'JVM Architecture (Class Loader, Runtime Data Areas, Execution Engine)',
        'Class loading (Bootstrap, Extension, Application classloaders)',
        'JVM Memory: Heap (Young Gen: Eden+Survivor, Old Gen), Stack, Method Area, PC Register, Native Stack',
        'Garbage Collection algorithms: Serial, Parallel, CMS, G1, ZGC, Shenandoah',
        'GC roots and reachability',
        'String Pool (intern())',
        'JIT Compiler',
        'Memory leaks in Java — causes and fixes',
        'JVM tuning flags (`-Xms`, `-Xmx`, `-XX:+UseG1GC`, etc.)'
      ],
      '12-design-patterns': [
        '**Creational**: Singleton (all variants), Factory, Abstract Factory, Builder, Prototype',
        '**Structural**: Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy',
        '**Behavioral**: Chain of Responsibility, Command, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor',
        'Anti-patterns to avoid'
      ],
      '13-deep-dive-hashmap-internals-java-7-vs-8': [
        'HashMap internal working (hashing, buckets, load factor, rehashing)'
      ],
      '15-deep-dive-concurrenthashmap-complete': [
        'ConcurrentHashMap internal working'
      ]
    },

    '02_SpringBoot.md': {
      '1-spring-core-ioc-and-di': [
        'IoC and DI (Inversion of Control, Dependency Injection)',
        'ApplicationContext vs BeanFactory'
      ],
      '2-bean-lifecycle-scopes': [
        'Bean lifecycle (instantiation → populate properties → init → use → destroy)',
        'Bean scopes: singleton, prototype, request, session, application, websocket',
        '`@Autowired`, `@Qualifier`, `@Primary`',
        '`@Component`, `@Service`, `@Repository`, `@Controller`, `@RestController`',
        '`@Configuration`, `@Bean`'
      ],
      '3-spring-aop': ['Spring AOP (Aspect, Advice, Pointcut, JoinPoint, Weaving)'],
      '4-spring-boot-fundamentals': [
        'Auto-configuration mechanism',
        '`@SpringBootApplication` (= `@Configuration` + `@ComponentScan` + `@EnableAutoConfiguration`)',
        '`application.properties` vs `application.yml`',
        'Profiles (`@Profile`, `spring.profiles.active`)',
        'Externalized configuration (`@Value`, `@ConfigurationProperties`)',
        'Spring Boot Actuator (endpoints, health, metrics, custom endpoints)',
        'Embedded server (Tomcat, Jetty, Undertow)',
        'Spring Boot Starter dependencies',
        'SpringApplication lifecycle'
      ],
      '5-spring-rest-api': [
        '`@RequestMapping`, `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping`',
        '`@PathVariable`, `@RequestParam`, `@RequestBody`, `@ResponseBody`',
        '`ResponseEntity` — status codes and headers',
        'Exception handling: `@ExceptionHandler`, `@ControllerAdvice`, `@RestControllerAdvice`',
        'Content negotiation',
        'HATEOAS',
        'API versioning strategies'
      ],
      '6-spring-data-jpa': [
        'JPA vs Hibernate vs Spring Data JPA',
        'Entity, `@Id`, `@GeneratedValue`, `@Column`, `@Table`',
        'Relationships: `@OneToOne`, `@OneToMany`, `@ManyToOne`, `@ManyToMany`',
        'Fetch types: EAGER vs LAZY',
        'CascadeType, orphanRemoval',
        'JpaRepository, CrudRepository, PagingAndSortingRepository',
        'JPQL and native queries (`@Query`)',
        'Named queries',
        '`@Transactional` with JPA',
        'N+1 problem and solutions (JOIN FETCH, EntityGraph, batch fetching)',
        'Pagination and Sorting (`Pageable`, `Sort`)',
        'Optimistic vs Pessimistic locking (`@Version`)',
        'Auditing (`@CreatedDate`, `@LastModifiedDate`)',
        'Criteria API'
      ],
      '7-spring-security': [
        'Authentication vs Authorization',
        '`SecurityFilterChain`, filter order',
        'UserDetailsService, UserDetails',
        'Password encoding (BCrypt)',
        'JWT authentication (end-to-end flow)',
        'OAuth2 / OpenID Connect',
        '`@PreAuthorize`, `@PostAuthorize`, `@Secured`',
        'CSRF, CORS configuration',
        'Method-level security',
        'Spring Security 6.x changes'
      ],
      '8-spring-transactions': [
        '`@Transactional` deep dive (propagation, isolation levels, rollback rules)'
      ],
      '9-microservices-with-spring-cloud': [
        'Microservices principles (12-factor app)',
        'Spring Cloud components: Config Server, Eureka (Service Discovery), Gateway, Ribbon/LoadBalancer, Feign Client, Hystrix/Resilience4j',
        'Circuit breaker pattern',
        'Saga pattern (choreography vs orchestration)',
        'API Gateway pattern',
        'Service mesh concepts (Istio, Envoy)',
        'Distributed tracing (Zipkin, Sleuth)',
        'Inter-service communication: REST vs gRPC vs Messaging',
        'Event-driven architecture with Kafka/RabbitMQ',
        'Docker & Kubernetes basics for microservices'
      ],
      '16-spring-annotations--simple-cheat-sheet': [
        'Spring annotations cheat sheet — core, Boot, REST, JPA, validation, security, testing'
      ]
    },

    '15_React_JS_Complete_Guide.md': {
      '1-what-is-react-how-it-works': ['What is React, SPA, Virtual DOM, reconciliation'],
      '2-jsx-deep-dive': ['JSX rules, fragments, expressions'],
      '3-components-functional-vs-class': ['Functional vs class components'],
      '4-props-state-data-flow': ['Props (read-only), state, one-way data flow', 'Lifting state up, state colocation'],
      '5-event-handling-forms': ['Controlled vs uncontrolled forms'],
      '6-lists-keys-conditional-rendering': ['Lists, keys, conditional rendering'],
      '7-useeffect-the-most-important-hook': ['useEffect — deps, cleanup, common mistakes'],
      '8-all-react-hooks-complete-reference': ['Rules of Hooks', 'Custom hooks — useFetch, useDebounce'],
      '9-context-api-global-state': ['Context API & Global State'],
      '10-react-router-v6': ['React Router v6 — routes, nested, protected'],
      '11-state-management-redux-zustand-rtk': ['Redux Toolkit vs Zustand vs Context'],
      '12-performance-optimization': ['Performance — React.memo, lazy, Suspense, virtualization'],
      '14-react-18-19-features': ['React 18/19 — concurrent, Server Components'],
      '15-typescript-with-react': ['TypeScript with React'],
      '16-testing-jest-react-testing-library': ['Testing — Jest, React Testing Library'],
      '17-build-tools-vite-cra-nextjs': ['Vite, Next.js, SSR vs SSG vs CSR']
    },

    '16_Java_Multithreading_Deep_Dive.md': {
      '1-process-vs-thread': ['Process vs Thread — memory sharing model'],
      '2-why-multithreading': ["When to use threads, Amdahl's Law, CPU vs I/O pool sizing"],
      '3-thread-lifecycle': ['Thread lifecycle & states (sleep vs wait lock behavior)'],
      '4-ways-to-create-threads': ['Creating threads — Thread, Runnable, Callable, ExecutorService'],
      '5-types-of-multithreading': ['Concurrency models (pool, producer-consumer, fork-join, pipeline, scatter-gather)'],
      '6-synchronization': ['Synchronization — synchronized, volatile, Locks, Atomics/CAS'],
      '7-java-memory-model': ['Java Memory Model & happens-before'],
      '8-wait-notify-producerconsumer': ['wait/notify & BlockingQueue producer-consumer'],
      '9-thread-pools': ['Thread pools & ExecutorService lifecycle'],
      '10-threadpoolexecutor-internals': ['ThreadPoolExecutor internals (core/max/queue/rejection policy)'],
      '11-callable-future-completablefuture': ['Callable, Future & CompletableFuture pipelines'],
      '12-concurrent-collections': ['Concurrent collections (ConcurrentHashMap, CopyOnWriteArrayList)'],
      '13-forkjoinpool-parallel-streams': ['ForkJoinPool & parallel streams'],
      '14-virtual-threads': ['Virtual threads (Java 21, Project Loom)'],
      '15-deadlock-livelock-starvation': ['Deadlock, livelock, starvation — prevention & diagnosis'],
      '16-real-world-patterns': ['Real-world multithreading patterns (partitioned queues, batching, async callback)'],
      '17-best-practices': ['Multithreading best practices & cooperative interruption'],
      '18-interview-qa': ['Multithreading interview Q&A bank']
    },

    '17_Java_Streams_Deep_Dive.md': {
      '1-why-streams': ['Stream vs Collection, pipeline anatomy, single-use'],
      '2-creating-streams': ['Creating streams (of, iterate, generate, IntStream, Files.lines)'],
      '3-intermediate-operations': ['Intermediate ops (filter, map, sorted, distinct, limit, takeWhile)'],
      '4-terminal-operations': ['Terminal ops (collect, reduce, count, match, find)'],
      '5-collectors-deep-dive': ['Collectors (groupingBy, partitioningBy, toMap, joining, teeing)'],
      '6-flatmap-nested-data': ['flatMap & nested data flattening'],
      '7-primitive-streams': ['Primitive streams (IntStream/LongStream/DoubleStream)'],
      '8-optional': ['Optional — map, filter, orElse, orElseGet, ifPresent'],
      '9-parallel-streams': ['Parallel streams — when to use and pitfalls'],
      '10-lazy-evaluation': ['Lazy evaluation & short-circuiting'],
      '11-common-pitfalls': ['Stream common pitfalls'],
      '12-real-world-examples': ['Real-world stream examples (grouping, indexing, top-N)'],
      '13-interview-qa': ['Streams interview Q&A bank']
    },

    '18_Annotations_Deep_Dive.md': {
      '1-what-are-annotations': ['What annotations are & how frameworks use them'],
      '2-built-in-java-annotations': ['Built-in Java annotations (@Override, @Deprecated, @FunctionalInterface)'],
      '3-meta-annotations': ['Meta-annotations (@Target, @Retention, @Inherited, @Repeatable)'],
      '4-creating-custom-annotations': ['Creating custom annotations'],
      '5-retention-reflection': ['Retention policies & reading annotations via reflection'],
      '6-annotation-processing': ['Compile-time annotation processing (Lombok, MapStruct)'],
      '7-core-spring-annotations': ['Core Spring annotations (@Component, @Autowired, @Bean, @Configuration)'],
      '8-spring-boot-annotations': ['Spring Boot annotations (@SpringBootApplication, @ConfigurationProperties, @Async, @Scheduled)'],
      '9-spring-web-rest-annotations': ['Spring Web/REST annotations (@RestController, @GetMapping, @RequestBody)'],
      '10-spring-data-jpa-annotations': ['Spring Data JPA annotations (@Entity, @Id, relationships, @Query)'],
      '11-validation-annotations': ['Validation annotations (@Valid, @NotNull, @Size, @Email)'],
      '12-transaction-aop-annotations': ['Transaction & AOP annotations (@Transactional, @Aspect, advice)'],
      '13-testing-annotations': ['Testing annotations (@SpringBootTest, @MockBean, slices)'],
      '14-interview-qa': ['Annotations interview Q&A bank']
    },

    '19_Node_JS_Complete_Guide.md': {
      '1-what-is-nodejs': ['What is Node.js, V8, libuv, non-blocking I/O'],
      '2-the-event-loop': ['Event loop phases, microtasks vs macrotasks'],
      '3-modules': ['Modules — CommonJS vs ES Modules'],
      '4-npm-packagejson': ['npm, package.json, semver, lockfile'],
      '5-async-javascript': ['Callbacks, Promises, async/await, Promise.all'],
      '6-core-modules': ['Core modules (fs, path, http, events)'],
      '7-streams-buffers': ['Streams & Buffers, backpressure, pipeline'],
      '8-express': ['HTTP server & Express basics'],
      '9-middleware-routing': ['Middleware, routing, async error handling'],
      '10-rest-api-design': ['REST API design with Express (status codes, validation)'],
      '11-databases': ['Databases — Mongoose, pg pool, parameterized queries'],
      '12-auth-security': ['Auth (JWT, bcrypt) & security checklist'],
      '13-error-handling-process-management': ['Error handling & graceful shutdown'],
      '14-performance-clustering-worker-threads': ['Performance, clustering & worker threads'],
      '15-testing': ['Testing Node apps (Jest, Supertest)'],
      '16-typescript-with-node': ['TypeScript with Node.js'],
      '17-production-best-practices': ['Node production best practices'],
      '18-coding-problems': ['Node coding problems (promisify, mapLimit, retry, debounce)'],
      '19-interview-qa': ['Node.js interview Q&A bank']
    },

    '20_Kafka_Deep_Dive.md': {
      '1-what-kafka-is': ['What Kafka is — distributed commit log, when to use'],
      '2-core-architecture': ['Brokers, topics, partitions, replication, ISR, controller'],
      '3-producers': ['Producers — acks, batching, partitioning, idempotence'],
      '4-consumers-consumer-groups': ['Consumers & consumer groups, partition assignment'],
      '5-rebalancing': ['Rebalancing — cooperative, static membership, tuning'],
      '6-offsets-delivery-semantics': ['Offsets & delivery semantics (at-least-once default)'],
      '7-exactly-once': ['Exactly-once — idempotent producer & transactions'],
      '8-ordering-guarantees': ['Ordering guarantees (per partition, keying)'],
      '9-retry-topics-dlq': ['Retry topics & dead-letter queues'],
      '10-outbox-pattern': ['Outbox pattern (transactional event publishing)'],
      '11-backpressure': ['Backpressure & flow control (pull, pause/resume)'],
      '12-lag-monitoring': ['Consumer lag monitoring & operations'],
      '13-schema-management': ['Schema registry & compatibility modes'],
      '14-spring-kafka': ['Spring Kafka in practice'],
      '15-design-50k-eventssec': ['Design: 50,000 events/sec system'],
      '16-interview-qa': ['Kafka interview Q&A bank']
    },

    '21_Kubernetes_Docker_CloudNative.md': {
      '1-docker-fundamentals': ['Docker fundamentals — images, layers, containers'],
      '2-production-dockerfiles': ['Production Dockerfiles (multi-stage, non-root)'],
      '3-docker-networking-volumes': ['Docker networking, volumes, compose'],
      '4-kubernetes-architecture': ['Kubernetes architecture (control plane, nodes)'],
      '5-pods-replicasets-deployments': ['Pods, ReplicaSets & Deployments'],
      '6-services-ingress': ['Services & Ingress'],
      '7-configmaps-secrets': ['ConfigMaps & Secrets'],
      '8-probes': ['Liveness, readiness & startup probes'],
      '9-resource-requests-limits-qos': ['Resource requests, limits & QoS (OOMKilled)'],
      '10-hpa': ['Horizontal Pod Autoscaler (+ KEDA, Cluster Autoscaler)'],
      '11-rolling-deploys-rollbacks': ['Rolling deploys & rollbacks'],
      '12-stateful-workloads-storage': ['StatefulSets & persistent storage (PV/PVC)'],
      '13-aws': ['AWS for backend (EKS/ECS/S3/RDS/SQS/IAM)'],
      '14-cicd': ['CI/CD to Kubernetes (GitHub Actions, GitOps)'],
      '15-troubleshooting-pods': ['Troubleshooting pods (CrashLoopBackOff etc.)'],
      '16-interview-qa': ['Kubernetes/Docker interview Q&A bank']
    },

    '22_Resilience_Distributed_Patterns.md': {
      '1-why-resilience': ['Why resilience — cascading failure, fallacies'],
      '2-timeouts-deadlines': ['Timeouts & deadline propagation'],
      '3-retries-backoff': ['Retries & exponential backoff + jitter'],
      '4-circuit-breaker': ['Circuit breaker (CLOSED/OPEN/HALF_OPEN)'],
      '5-bulkhead': ['Bulkhead isolation'],
      '6-rate-limiting': ['Rate limiting (token/leaky/sliding window)'],
      '7-resilience4j': ['Resilience4j in practice'],
      '8-idempotency-keys': ['Idempotency keys'],
      '9-distributed-locks': ['Distributed locks (Redis/Redisson, fencing)'],
      '10-saga-pattern': ['Saga pattern (choreography vs orchestration)'],
      '11-snowflake-ids': ['Distributed ID generation (Snowflake)'],
      '12-consistency-cap-eventual-consistency': ['CAP, strong vs eventual consistency'],
      '13-graceful-degradation-fallbacks': ['Graceful degradation & fallbacks'],
      '14-interview-qa': ['Resilience interview Q&A bank']
    },

    '23_Observability_Production_Debugging.md': {
      '1-observability-vs-monitoring': ['Observability vs monitoring'],
      '2-three-pillars': ['Three pillars — metrics, logs, traces'],
      '3-metrics-with-prometheus': ['Metrics with Prometheus & PromQL'],
      '4-grafana': ['Dashboards with Grafana'],
      '5-structured-logging': ['Structured logging (JSON, levels, no PII)'],
      '6-log-aggregation': ['Log aggregation (ELK & Loki)'],
      '7-distributed-tracing': ['Distributed tracing (OpenTelemetry & Jaeger)'],
      '8-correlation-ids': ['Correlation IDs / trace propagation'],
      '9-red-use-methods': ['RED & USE methods (golden signals)'],
      '10-sli-slo-sla': ['SLI, SLO, SLA & error budgets'],
      '11-alerting': ['Alerting on symptoms, actionable alerts'],
      '12-debugging-slow-service': ['Debugging: a service is slow in prod'],
      '13-debugging-errors-memory-cpu': ['Debugging: errors, memory, CPU'],
      '14-interview-qa': ['Observability interview Q&A bank']
    },

    '24_JVM_Performance_Advanced_Concurrency.md': {
      '1-jvm-memory-areas': ['JVM memory areas (heap, metaspace, stacks)'],
      '2-generational-gc': ['Generational GC (young/old, minor/full)'],
      '3-garbage-collectors': ['Garbage collectors — Serial to ZGC'],
      '4-g1-vs-zgc': ['G1 vs ZGC — choosing & tuning'],
      '5-reading-gc-logs': ['Reading GC logs'],
      '6-jvm-flags': ['Key JVM flags (container-aware sizing)'],
      '7-heap-dumps-leaks': ['Heap dumps & memory-leak hunting (MAT)'],
      '8-thread-dumps-cpu-profiling': ['Thread dumps & CPU profiling (flame graphs)'],
      '9-diagnostic-tooling': ['Diagnostic tooling — jstack, jmap, Arthas'],
      '10-threadpoolexecutor-tuning': ['ThreadPoolExecutor tuning'],
      '11-completablefuture': ['CompletableFuture patterns'],
      '12-virtual-threads': ['Virtual threads — when & pinning pitfalls'],
      '13-lock-free-atomics': ['Lock-free & atomics (CAS, LongAdder, ABA)'],
      '14-jit-escape-analysis-warmup': ['JIT, escape analysis & warmup'],
      '15-interview-qa': ['JVM performance interview Q&A bank']
    },

    '25_Redis_Caching_Strategy.md': {
      '1-why-cache': ['Why cache & what Redis is'],
      '2-data-structures': ['Redis data structures (String/Hash/ZSet/Stream)'],
      '3-caching-patterns': ['Caching patterns overview'],
      '4-cache-aside': ['Cache-aside (lazy loading)'],
      '5-write-through-write-behind': ['Write-through & write-behind'],
      '6-eviction-policies': ['Eviction policies (LRU/LFU)'],
      '7-ttl-design': ['TTL & expiration design (jitter)'],
      '8-cache-stampede-hot-keys': ['Cache stampede & hot keys'],
      '9-penetration-avalanche': ['Cache penetration & avalanche'],
      '10-cache-consistency': ['Cache vs DB consistency (invalidate)'],
      '11-distributed-lock': ['Redis as a distributed lock'],
      '12-rate-limiter': ['Redis as a rate limiter'],
      '13-persistence-ha-cluster': ['Persistence, HA & cluster (RDB/AOF/Sentinel)'],
      '14-spring-cache': ['Spring Cache with Redis'],
      '15-interview-qa': ['Redis/caching interview Q&A bank']
    },

    '26_SQL_at_Scale.md': {
      '1-how-a-query-executes': ['How a query executes (optimizer, stats)'],
      '2-indexing': ['Indexing deep dive (B-tree, composite, covering)'],
      '3-explain-plans': ['Reading EXPLAIN plans'],
      '4-the-n1-problem': ['The N+1 problem & fixes'],
      '5-query-optimization': ['Query optimization techniques (sargable, keyset)'],
      '6-transactions-isolation': ['Transactions & isolation levels'],
      '7-optimistic-vs-pessimistic-locking': ['Optimistic vs pessimistic locking'],
      '8-connection-pooling-hikaricp': ['Connection pooling & HikariCP sizing'],
      '9-read-replicas': ['Read replicas & read/write splitting'],
      '10-partitioning': ['Partitioning (range/hash, pruning)'],
      '11-sharding': ['Sharding (shard key, hot shards)'],
      '12-sql-vs-nosql-denormalization': ['SQL vs NoSQL & denormalization'],
      '13-migrations-at-scale': ['Schema migrations at scale (expand-contract)'],
      '14-interview-qa': ['SQL at scale interview Q&A bank']
    },

    '27_Design_Patterns_Java.md': {
      '1-why-design-patterns-matter': ['Why design patterns matter — vocabulary, decoupling, trade-offs'],
      '2-solid-principles-recap': ['SOLID principles recap (SRP, OCP, LSP, ISP, DIP)'],
      '3-pattern-categories-how-to-choose': ['Pattern categories & how to choose (creational/structural/behavioral)'],
      '4-singleton': ['Singleton — variants & thread safety (Java)'],
      '5-factory-method': ['Factory Method (Java)'],
      '6-abstract-factory': ['Abstract Factory — product families (Java)'],
      '7-builder': ['Builder — fluent, immutable objects (Java)'],
      '8-prototype': ['Prototype — cloning & deep copy (Java)'],
      '9-adapter': ['Adapter — wrap incompatible APIs (Java)'],
      '10-bridge': ['Bridge — abstraction vs implementation (Java)'],
      '11-composite': ['Composite — tree structures (Java)'],
      '12-decorator': ['Decorator — stackable responsibilities (Java)'],
      '13-facade': ['Facade — simplify a subsystem (Java)'],
      '14-flyweight': ['Flyweight — share immutable state (Java)'],
      '15-proxy': ['Proxy — control access (lazy/security/AOP) (Java)'],
      '16-chain-of-responsibility': ['Chain of Responsibility — handler pipeline (Java)'],
      '17-command': ['Command — encapsulate requests, queue/undo (Java)'],
      '18-iterator': ['Iterator — traverse without exposing internals (Java)'],
      '19-mediator': ['Mediator — centralize interactions (Java)'],
      '20-memento': ['Memento — snapshot & restore state (Java)'],
      '21-observer': ['Observer — publish/subscribe (Java)'],
      '22-state': ['State — behaviour by lifecycle state (Java)'],
      '23-strategy': ['Strategy — interchangeable algorithms (Java)'],
      '24-template-method': ['Template Method — algorithm skeleton (Java)'],
      '25-visitor': ['Visitor — operations over a type hierarchy (Java)'],
      '26-interpreter': ['Interpreter — small grammar/DSL (Java)'],
      '27-enterprise-spring-patterns': ['Enterprise & Spring patterns (DI, Repository, DTO, Proxy/AOP)'],
      '28-anti-patterns-to-avoid': ['Anti-patterns to avoid (God object, singleton abuse, patternitis)'],
      '29-interview-qa': ['Java design patterns interview Q&A bank']
    },

    '28_Design_Patterns_Python.md': {
      '1-design-patterns-the-pythonic-way': ['Design patterns the Pythonic way'],
      '2-python-idioms-that-replace-patterns': ['Python idioms that replace patterns'],
      '3-creational-patterns-overview': ['Creational patterns overview (Python)'],
      '4-singleton': ['Singleton — module/metaclass (Python)'],
      '5-factory-method': ['Factory Method — dict dispatch / classmethod (Python)'],
      '6-abstract-factory': ['Abstract Factory — Protocol-based families (Python)'],
      '7-builder': ['Builder — kwargs/dataclasses/fluent (Python)'],
      '8-prototype': ['Prototype — copy/deepcopy (Python)'],
      '9-adapter': ['Adapter — duck typing wrapper (Python)'],
      '10-bridge': ['Bridge — composition with Protocol (Python)'],
      '11-composite': ['Composite — recursive trees (Python)'],
      '12-decorator': ['Decorator — @decorator vs structural (Python)'],
      '13-facade': ['Facade — module/class entry point (Python)'],
      '14-flyweight': ['Flyweight — __slots__ + lru_cache (Python)'],
      '15-proxy': ['Proxy — __getattr__ / cached_property (Python)'],
      '16-chain-of-responsibility': ['Chain of Responsibility — middleware list (Python)'],
      '17-command': ['Command — closures / functools.partial (Python)'],
      '18-iterator': ['Iterator — generators & yield (Python)'],
      '19-mediator': ['Mediator — coordinator (Python)'],
      '20-memento': ['Memento — deepcopy / pickle state (Python)'],
      '21-observer': ['Observer — callbacks / signals (Python)'],
      '22-state': ['State — state machine objects (Python)'],
      '23-strategy': ['Strategy — pass a Callable (Python)'],
      '24-template-method': ['Template Method — ABC or HOF (Python)'],
      '25-visitor': ['Visitor — functools.singledispatch (Python)'],
      '26-interpreter': ['Interpreter — expression tree / DSL (Python)'],
      '27-interview-qa': ['Python design patterns interview Q&A bank']
    },

    '29_Python_Interview_Questions.md': {
      '1-core-language-data-model': ['Python core language & data model (is vs ==, mutability, args, mutable defaults)'],
      '2-data-structures-complexity': ['Python data structures & time complexity'],
      '3-oop-mro-dunder-methods': ['Python OOP, MRO/C3, super, dunder methods, metaclasses, descriptors'],
      '4-decorators': ['Python decorators (wraps, retry/backoff, stateful, lru_cache)'],
      '5-generators-iterators': ['Python generators & iterators (yield, yield from, lazy)'],
      '6-the-gil-concurrency': ['The GIL & concurrency (threading vs multiprocessing vs asyncio)'],
      '7-async-await-asyncio': ['Async/await with asyncio (gather, tasks, blocking, timeouts)'],
      '8-memory-management-garbage-collection': ['Python memory management & GC (refcount, cyclic GC, __del__, __slots__)'],
      '9-performance-optimization': ['Python performance & optimization (profiling, comprehensions)'],
      '10-type-hints-dataclasses-pydantic': ['Type hints, dataclasses & Pydantic, Protocol'],
      '11-standard-library-idioms': ['Standard library idioms (collections, itertools, functools)'],
      '12-modern-python-310-313': ['Modern Python 3.10–3.13 (match, walrus, free-threaded)'],
      '13-exceptions-context-managers': ['Exceptions & context managers (with, async, exception groups, EAFP)'],
      '14-testing-tooling': ['Python testing & tooling (pytest, ruff, uv, mypy)'],
      '15-tricky-output-gotchas': ['Python tricky output & gotchas (floats, list refs, closures)'],
      '16-coding-problems-pythonic': ['Pythonic coding problems (Counter, dedupe, group, LRU)']
    },

    '30_Git_and_GitHub.md': {
      '1-what-is-git-github': ['What Git & GitHub are (distributed VCS vs hosting)'],
      '2-how-git-works-internally': ['Git internals — blobs/trees/commits, DAG, staging area, HEAD/refs'],
      '3-the-core-workflow': ['Core workflow — add, commit, status, log, diff'],
      '4-branching-merging': ['Branching & merging (fast-forward vs three-way)'],
      '5-merge-vs-rebase': ['Merge vs rebase (golden rule, interactive rebase)'],
      '6-working-with-remotes': ['Remotes — push, pull vs fetch, force-with-lease'],
      '7-undoing-changes': ['Undoing changes — restore, reset, revert, reflog'],
      '8-stash-cherry-pick-tags': ['Stash, cherry-pick & tags'],
      '9-resolving-merge-conflicts': ['Resolving merge conflicts'],
      '10-gitignore-tracking-files': ['.gitignore, untracking files, secrets, Git LFS'],
      '11-github-essentials': ['GitHub essentials — clone vs fork, auth (PAT/SSH)'],
      '12-pull-requests-code-review': ['Pull requests & code review (squash/merge/rebase)'],
      '13-branching-strategies': ['Branching strategies (Git Flow, trunk-based, GitHub Flow)'],
      '14-github-actions-cicd': ['GitHub Actions CI/CD (workflows, jobs, steps, secrets)'],
      '15-collaboration-project-management': ['Collaboration — issues, branch protection, CODEOWNERS, releases'],
      '16-best-practices-common-mistakes': ['Git best practices & common mistakes'],
      '17-interview-qa': ['Git & GitHub interview Q&A bank']
    },

    '31_Angular_Complete_Guide.md': {
      '1-what-is-angular-how-it-works': ['What Angular is & how it works (framework vs library)'],
      '2-typescript-essentials-for-angular': ['TypeScript essentials (interfaces, generics, decorators)'],
      '3-components-templates': ['Components & templates (view encapsulation)'],
      '4-data-binding-directives': ['Data binding (4 types) & directives (structural/attribute)'],
      '5-component-communication': ['Component communication (@Input/@Output, shared service)'],
      '6-services-dependency-injection': ['Services & Dependency Injection (providedIn, singletons)'],
      '7-rxjs-observables': ['RxJS & Observables (operators, Subjects, switchMap)'],
      '8-http-client-apis': ['HttpClient & APIs (typed calls, interceptors)'],
      '9-routing-navigation': ['Routing & navigation (params, guards, lazy loading)'],
      '10-forms-template-driven-reactive': ['Forms — template-driven vs reactive, validation'],
      '11-pipes': ['Pipes (pure vs impure, async pipe, custom pipes)'],
      '12-lifecycle-hooks': ['Lifecycle hooks (ngOnInit, ngOnChanges, ngOnDestroy)'],
      '13-change-detection-performance': ['Change detection, Zone.js & OnPush performance'],
      '14-modules-vs-standalone-components': ['NgModules vs standalone components'],
      '15-signals-modern-angular': ['Signals (signal/computed/effect) vs RxJS'],
      '16-state-management-ngrx': ['State management with NgRx (store/action/reducer/effect)'],
      '17-testing-angular': ['Testing Angular (TestBed, mocking DI, Jasmine/Karma)'],
      '18-build-tools-angular-cli': ['Build tools & Angular CLI (AOT vs JIT)'],
      '19-angular-vs-react': ['Angular vs React (framework vs library trade-offs)'],
      '20-coding-problems-patterns': ['Angular coding problems & patterns'],
      '21-interview-qa': ['Angular interview Q&A bank']
    },

    '32_Real_Interview_Questions.md': {
      '1-how-to-use-this-guide': ['How to use the real interview Q&A bank'],
      '2-product-company--java-backend-round-1': ['Product company Java backend round 1 — inheritance vs composition, abstract class, HashMap vs CHM, exceptions, streams invert map, test cases'],
      '3-ai-saas-company--java-backend-round-2': ['AI SaaS company round 2 — Kafka lag, DLQ/offsets, design patterns, SOLID OCP, factory OCP, top K spend coding'],
      '4-more-companies-coming-soon': ['More company interview rounds (coming soon)']
    }
  };

  function getTopicsForSection(file, sectionId) {
    const map = GUIDE_TOPIC_MAP[file];
    if (!map) return [];
    return map[sectionId] || [];
  }

  function getAllTopicsForGuide(file) {
    const map = GUIDE_TOPIC_MAP[file];
    if (!map) return [];
    const all = [];
    Object.values(map).forEach(arr => all.push(...arr));
    return [...new Set(all)];
  }

  // Stable checklist id for a section that isn't explicitly mapped to the roadmap
  function sectionUnitId(file, sectionId) {
    return checklistId(`\u00a7section\u00a7${file}\u00a7${sectionId}`);
  }

  // Trackable units for one section: mapped roadmap topics, or a single generic unit
  function getSectionUnits(file, sectionId) {
    const mapped = getTopicsForSection(file, sectionId);
    if (mapped.length) {
      return mapped.map(t => ({ label: t, id: checklistId(t), mapped: true }));
    }
    return [{ label: 'Mark this section as complete', id: sectionUnitId(file, sectionId), mapped: false }];
  }

  // All top-level (h2) sections of a guide from the generated study data
  function h2SectionsForGuide(file) {
    const data = (typeof window !== 'undefined' && window.STUDY_DATA) || null;
    if (!data || !data[file] || !data[file].sections) return null;
    return data[file].sections.filter(s =>
      s.level === 2 && s.heading.trim().toUpperCase() !== 'TABLE OF CONTENTS'
    );
  }

  // Every trackable unit id for a guide (mapped topics + generic sections)
  function getGuideUnits(file) {
    const secs = h2SectionsForGuide(file);
    if (!secs) {
      // Fallback when study data isn't loaded: mapped topics only
      return getAllTopicsForGuide(file).map(t => checklistId(t));
    }
    const ids = [];
    secs.forEach(s => getSectionUnits(file, s.id).forEach(u => ids.push(u.id)));
    return [...new Set(ids)];
  }

  function getGuideProgress(file) {
    const units = getGuideUnits(file);
    if (!units.length) return { done: 0, total: 0, percent: 0 };
    const checklist = StackReadyCookies.getChecklistMap();
    const done = units.filter(id => checklist[id]).length;
    return { done, total: units.length, percent: Math.round((done / units.length) * 100) };
  }

  function isSectionComplete(file, sectionId) {
    const units = getSectionUnits(file, sectionId);
    if (!units.length) return false;
    const checklist = StackReadyCookies.getChecklistMap();
    return units.every(u => checklist[u.id]);
  }

  return {
    checklistId,
    getTopicsForSection,
    getAllTopicsForGuide,
    getSectionUnits,
    sectionUnitId,
    getGuideUnits,
    getGuideProgress,
    isSectionComplete
  };
})();
