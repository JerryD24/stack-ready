# Java & Spring Annotations — Deep Dive
### From Language Basics to Spring Boot Internals | Beginner → Expert

---

## TABLE OF CONTENTS
1. [What Are Annotations & How They Work](#1-what-are-annotations)
2. [Built-in Java Annotations](#2-builtin-java-annotations)
3. [Meta-Annotations](#3-meta-annotations)
4. [Creating Custom Annotations](#4-creating-custom-annotations)
5. [Retention & Reflection at Runtime](#5-retention-reflection)
6. [Compile-Time Annotation Processing](#6-annotation-processing)
7. [Core Spring Annotations](#7-core-spring-annotations)
8. [Spring Boot Annotations](#8-spring-boot-annotations)
9. [Spring Web / REST Annotations](#9-spring-web-rest-annotations)
10. [Spring Data JPA Annotations](#10-spring-data-jpa-annotations)
11. [Validation Annotations](#11-validation-annotations)
12. [Transaction & AOP Annotations](#12-transaction-aop-annotations)
13. [Testing Annotations](#13-testing-annotations)
14. [Interview Q&A](#14-interview-qa)

---

## 1. What Are Annotations

Annotations are **metadata** attached to code (classes, methods, fields, parameters). They don't directly change program logic — they're read by the **compiler**, **tools**, or **frameworks (at runtime via reflection)** to drive behavior.

```java
@Override            // compiler check
public String toString() { ... }

@Deprecated          // warning to callers
public void oldApi() { ... }
```

Three audiences:
1. **Compiler** — `@Override`, `@SuppressWarnings` (discarded after compilation).
2. **Build/processing tools** — Lombok, MapStruct, Dagger (generate code at compile time).
3. **Frameworks at runtime** — Spring, JPA, JUnit read them via **reflection** to wire behavior.

---

## 2. Built-in Java Annotations

| Annotation | Purpose |
|------------|---------|
| `@Override` | Asserts a method overrides a supertype method (compile error if not) |
| `@Deprecated` | Marks API as obsolete; `@Deprecated(since, forRemoval)` (Java 9+) |
| `@SuppressWarnings("unchecked")` | Silences specific compiler warnings |
| `@FunctionalInterface` | Enforces exactly one abstract method |
| `@SafeVarargs` | Suppresses unsafe varargs-generics warning |
| `@Serial` (Java 14+) | Validates serialization-related members |

```java
@FunctionalInterface
interface Transformer<T, R> {
    R apply(T input);          // exactly one abstract method allowed
}
```

---

## 3. Meta-Annotations

Annotations that annotate **other annotations** — the building blocks of custom annotations.

| Meta-annotation | Controls |
|-----------------|----------|
| `@Target` | Where it can be applied (`TYPE`, `METHOD`, `FIELD`, `PARAMETER`, ...) |
| `@Retention` | How long it's kept: `SOURCE` / `CLASS` / `RUNTIME` |
| `@Documented` | Include in Javadoc |
| `@Inherited` | Subclasses inherit the (class-level) annotation |
| `@Repeatable` | Allow the same annotation multiple times on one element |

**`@Retention` levels (critical):**
- `SOURCE` — discarded by compiler (e.g., `@Override`, Lombok).
- `CLASS` — kept in `.class` but not loaded at runtime (default).
- `RUNTIME` — available via reflection at runtime (Spring/JPA need this).

---

## 4. Creating Custom Annotations

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)   // RUNTIME so we can read it via reflection
@Documented
public @interface Audited {
    String action();                  // required element
    String level() default "INFO";    // element with default
    String[] tags() default {};       // array element
}

// Usage
@Audited(action = "DELETE_USER", level = "WARN", tags = {"security", "pii"})
public void deleteUser(Long id) { ... }
```
Rules: elements look like methods, may have defaults, and types are limited to primitives, `String`, `Class`, enums, annotations, and arrays of those. A single element named `value` can be set without the name: `@Audited("DELETE")`.

---

## 5. Retention & Reflection

Reading a `RUNTIME` annotation — this is exactly how frameworks work under the hood:
```java
Method m = service.getClass().getMethod("deleteUser", Long.class);
if (m.isAnnotationPresent(Audited.class)) {
    Audited a = m.getAnnotation(Audited.class);
    logger.log(a.level(), "Audit: " + a.action() + " tags=" + Arrays.toString(a.tags()));
}

// Scan all fields for a custom annotation
for (Field f : obj.getClass().getDeclaredFields()) {
    if (f.isAnnotationPresent(Encrypted.class)) {
        f.setAccessible(true);
        f.set(obj, encrypt((String) f.get(obj)));
    }
}
```
A typical custom-annotation interceptor pairs `@Retention(RUNTIME)` with **Spring AOP** (or a `BeanPostProcessor`/servlet filter) to apply cross-cutting behavior.

---

## 6. Annotation Processing

Compile-time code generation via the **Annotation Processing Tool (APT)** — `javax.annotation.processing.Processor`. No runtime reflection cost.

Examples you already use:
- **Lombok** — `@Getter`, `@Setter`, `@Builder`, `@Data`, `@Slf4j` generate boilerplate at compile time.
- **MapStruct** — generates type-safe mappers.
- **Dagger** — compile-time DI graph.
- **Immutables / AutoValue** — value classes.

```java
@Data                 // generates getters, setters, equals, hashCode, toString
@Builder              // generates a fluent builder
public class Order {
    private Long id;
    private BigDecimal amount;
}
Order o = Order.builder().id(1L).amount(BigDecimal.TEN).build();
```
Compile-time processing is faster and safer than reflection (errors caught at build, zero runtime overhead).

---

## 7. Core Spring Annotations

**Stereotypes (component scanning registers these as beans):**
| Annotation | Meaning |
|------------|---------|
| `@Component` | Generic Spring-managed bean |
| `@Service` | Business-logic bean (semantic) |
| `@Repository` | Data-access bean (+ exception translation) |
| `@Controller` / `@RestController` | Web controller |
| `@Configuration` | Class declaring `@Bean` methods |

**Dependency injection & wiring:**
```java
@Service
public class OrderService {
    private final PaymentGateway gateway;

    @Autowired                         // optional on a single constructor (4.3+)
    public OrderService(@Qualifier("stripe") PaymentGateway gateway) {
        this.gateway = gateway;
    }
}

@Configuration
public class AppConfig {
    @Bean
    public RestTemplate restTemplate() { return new RestTemplate(); }
}
```
| Annotation | Purpose |
|------------|---------|
| `@Autowired` | Inject a dependency by type |
| `@Qualifier` | Disambiguate when multiple beans of a type exist |
| `@Primary` | Default bean when multiple candidates |
| `@Value("${prop}")` | Inject a property/SpEL value |
| `@Bean` | Declare a bean from a method |
| `@Scope` | `singleton` (default), `prototype`, `request`, `session` |
| `@Lazy` | Defer bean creation until first use |
| `@Profile("dev")` | Activate bean only in a profile |
| `@DependsOn` | Force init order |
| `@PostConstruct` / `@PreDestroy` | Lifecycle callbacks |

---

## 8. Spring Boot Annotations

```java
@SpringBootApplication      // = @Configuration + @EnableAutoConfiguration + @ComponentScan
public class App {
    public static void main(String[] args) { SpringApplication.run(App.class, args); }
}
```
| Annotation | Purpose |
|------------|---------|
| `@SpringBootApplication` | Meta-annotation bootstrapping a Boot app |
| `@EnableAutoConfiguration` | Auto-configures beans from classpath |
| `@ComponentScan` | Scans packages for components |
| `@ConfigurationProperties(prefix="app")` | Bind a group of properties to a POJO |
| `@EnableConfigurationProperties` | Register `@ConfigurationProperties` beans |
| `@ConditionalOnProperty` / `@ConditionalOnMissingBean` / `@ConditionalOnClass` | Conditional bean creation (auto-config internals) |
| `@EnableScheduling` + `@Scheduled` | Cron/fixed-rate tasks |
| `@EnableAsync` + `@Async` | Run methods on a separate thread pool |
| `@EnableCaching` + `@Cacheable` / `@CacheEvict` | Declarative caching |

```java
@ConfigurationProperties(prefix = "app.mail")
public record MailProps(String host, int port, boolean tls) {}

@Async
public CompletableFuture<Report> generateAsync() { ... }   // needs @EnableAsync

@Scheduled(cron = "0 0 * * * *")
public void hourlyCleanup() { ... }

@Cacheable(value = "users", key = "#id")
public User findUser(Long id) { ... }
```

---

## 9. Spring Web / REST Annotations

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/{id}")
    public ResponseEntity<User> get(@PathVariable Long id) { ... }

    @PostMapping
    public ResponseEntity<User> create(@Valid @RequestBody UserDto dto) { ... }

    @GetMapping
    public List<User> search(@RequestParam(defaultValue = "0") int page,
                             @RequestHeader("X-Tenant") String tenant) { ... }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<String> handle(NotFoundException e) {
        return ResponseEntity.status(404).body(e.getMessage());
    }
}
```
| Annotation | Purpose |
|------------|---------|
| `@RestController` | `@Controller` + `@ResponseBody` |
| `@RequestMapping` | Base path / method mapping |
| `@GetMapping` / `@PostMapping` / `@PutMapping` / `@DeleteMapping` / `@PatchMapping` | HTTP-verb shortcuts |
| `@PathVariable` | Bind URI template variable |
| `@RequestParam` | Bind query/form param |
| `@RequestBody` | Deserialize request body |
| `@ResponseBody` | Serialize return value to body |
| `@RequestHeader` / `@CookieValue` | Bind header / cookie |
| `@ResponseStatus` | Set HTTP status |
| `@ControllerAdvice` / `@RestControllerAdvice` | Global exception handling |
| `@CrossOrigin` | CORS config |

---

## 10. Spring Data JPA Annotations

```java
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Item> items;

    @Enumerated(EnumType.STRING)
    private Status status;

    @CreationTimestamp
    private Instant createdAt;
}
```
| Annotation | Purpose |
|------------|---------|
| `@Entity` / `@Table` | Map class to a table |
| `@Id` / `@GeneratedValue` | Primary key + generation strategy |
| `@Column` | Column mapping & constraints |
| `@OneToOne` / `@OneToMany` / `@ManyToOne` / `@ManyToMany` | Relationships |
| `@JoinColumn` / `@JoinTable` | FK / join-table mapping |
| `@Enumerated(EnumType.STRING)` | Persist enums by name (use STRING, not ORDINAL) |
| `@Transient` | Skip persistence |
| `@Query` | Custom JPQL/native query |
| `@Modifying` | Update/delete query |
| `@Version` | Optimistic locking |
| `@EntityGraph` | Fetch plan to fight N+1 |

---

## 11. Validation Annotations

Bean Validation (Jakarta) — triggered by `@Valid` / `@Validated`.
```java
public record UserDto(
    @NotBlank String name,
    @Email String email,
    @Min(18) @Max(120) int age,
    @Size(min = 8) String password,
    @Pattern(regexp = "\\d{10}") String phone,
    @NotNull @Past LocalDate dob
) {}

@PostMapping
public ResponseEntity<?> create(@Valid @RequestBody UserDto dto) { ... } // 400 on violation
```
Common: `@NotNull`, `@NotEmpty`, `@NotBlank`, `@Size`, `@Min`/`@Max`, `@Positive`/`@Negative`, `@Email`, `@Pattern`, `@Past`/`@Future`, `@AssertTrue`. Use `@Validated` at class level for group validation and method-level validation.

---

## 12. Transaction & AOP Annotations

```java
@Service
public class TransferService {
    @Transactional(propagation = Propagation.REQUIRED,
                   isolation = Isolation.READ_COMMITTED,
                   rollbackFor = Exception.class,
                   timeout = 5)
    public void transfer(Long from, Long to, BigDecimal amt) { ... }
}
```
| Annotation | Purpose |
|------------|---------|
| `@Transactional` | Declarative transaction boundary |
| `@EnableTransactionManagement` | Turn on (auto in Boot) |
| `@Aspect` | Declare an AOP aspect |
| `@Before` / `@After` / `@Around` / `@AfterReturning` / `@AfterThrowing` | Advice types |
| `@Pointcut` | Reusable pointcut expression |

**`@Transactional` gotchas (high-value interview points):**
- Only works on **public** methods called **through the proxy** — a self-invocation (`this.method()`) bypasses it.
- By default rolls back only on **unchecked** exceptions; use `rollbackFor = Exception.class` for checked.

```java
@Aspect @Component
public class TimingAspect {
    @Around("@annotation(Audited)")
    public Object time(ProceedingJoinPoint pjp) throws Throwable {
        long t = System.nanoTime();
        try { return pjp.proceed(); }
        finally { log.info("{} took {}ns", pjp.getSignature(), System.nanoTime() - t); }
    }
}
```

---

## 13. Testing Annotations

```java
@SpringBootTest                       // full application context
class OrderServiceIT {
    @Autowired OrderService service;
    @MockBean PaymentGateway gateway;  // replace bean with a Mockito mock
}

@WebMvcTest(UserController.class)      // slice: web layer only
class UserControllerTest {
    @Autowired MockMvc mvc;
}

@DataJpaTest                          // slice: JPA layer + in-memory DB
class OrderRepoTest { }
```
| Annotation | Purpose |
|------------|---------|
| `@SpringBootTest` | Full-context integration test |
| `@WebMvcTest` / `@DataJpaTest` / `@RestClientTest` | Sliced tests (faster) |
| `@MockBean` / `@SpyBean` | Swap a bean with a mock/spy |
| `@Test` / `@BeforeEach` / `@AfterEach` / `@BeforeAll` | JUnit 5 lifecycle |
| `@ParameterizedTest` / `@ValueSource` | Data-driven tests |
| `@ActiveProfiles("test")` | Activate a profile for the test |
| `@Mock` / `@InjectMocks` (Mockito) | Plain unit-test mocks |

---

## 14. Interview Q&A

**Q1. What is an annotation and how does a framework use it?**
Metadata on code. Frameworks like Spring keep `RUNTIME`-retention annotations and read them via **reflection** to wire behavior (beans, transactions, mappings).

**Q2. The three `@Retention` policies?**
`SOURCE` (dropped at compile, e.g., `@Override`), `CLASS` (in bytecode, not at runtime — default), `RUNTIME` (readable via reflection — Spring/JPA).

**Q3. What does `@SpringBootApplication` combine?**
`@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`.

**Q4. `@Component` vs `@Service` vs `@Repository`?**
All are beans via component scanning. They're semantic specializations; `@Repository` additionally enables persistence exception translation.

**Q5. Why might `@Transactional` not work?**
Self-invocation (calling the method from within the same class) bypasses the proxy; non-public methods; or expecting rollback on a checked exception without `rollbackFor`.

**Q6. `@Autowired` field vs constructor injection?**
Constructor injection is preferred — immutable, testable, fails fast on missing deps, no reflection needed in tests. Field injection hides dependencies.

**Q7. How do you create and read a custom annotation?**
Declare with `@interface` + `@Target`/`@Retention(RUNTIME)`, then read via reflection (`isAnnotationPresent`, `getAnnotation`), usually combined with AOP or a `BeanPostProcessor`.

**Q8. Compile-time vs runtime annotation processing?**
Compile-time (APT: Lombok, MapStruct) generates code at build with zero runtime cost and early error detection. Runtime (reflection) is flexible but has overhead and fails later.

**Q9. `@EnumType.STRING` vs `ORDINAL`?**
Persist enums as `STRING` (the name) — `ORDINAL` stores the index, which breaks if enum order changes.

**Q10. `@Valid` vs `@Validated`?**
`@Valid` (Jakarta) triggers bean validation, including nested objects. `@Validated` (Spring) adds validation **groups** and enables method-level validation on beans.
