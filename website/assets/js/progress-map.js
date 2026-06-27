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

  function getGuideProgress(file) {
    const topics = getAllTopicsForGuide(file);
    if (!topics.length) return { done: 0, total: 0, percent: 0 };
    const checklist = StackReadyCookies.getChecklistMap();
    const done = topics.filter(t => checklist[checklistId(t)]).length;
    return { done, total: topics.length, percent: Math.round((done / topics.length) * 100) };
  }

  function isSectionComplete(file, sectionId) {
    const topics = getTopicsForSection(file, sectionId);
    if (!topics.length) return false;
    const checklist = StackReadyCookies.getChecklistMap();
    return topics.every(t => checklist[checklistId(t)]);
  }

  return {
    checklistId,
    getTopicsForSection,
    getAllTopicsForGuide,
    getGuideProgress,
    isSectionComplete
  };
})();
