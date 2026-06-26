# Spring Boot — Complete Interview Guide
### Core → Boot → REST → JPA → Security → Microservices

---

## TABLE OF CONTENTS
1. [Spring Core — IoC and DI](#1-spring-core--ioc-and-di)
2. [Bean Lifecycle & Scopes](#2-bean-lifecycle--scopes)
3. [Spring AOP](#3-spring-aop)
4. [Spring Boot Fundamentals](#4-spring-boot-fundamentals)
5. [Spring REST API](#5-spring-rest-api)
6. [Spring Data JPA](#6-spring-data-jpa)
7. [Spring Security](#7-spring-security)
8. [Spring Transactions](#8-spring-transactions)
9. [Microservices with Spring Cloud](#9-microservices-with-spring-cloud)
10. [Spring Boot Actuator](#10-spring-boot-actuator)
11. [Interview Q&A](#11-interview-qa)
12. [DEEP DIVE: Tough Topics](#12-deep-dive-tough-topics)
13. [Additional Interview Q&A (New Questions Only)](#13-additional-interview-qa-new-questions-only)
14. [JPA / Hibernate Deep Dive](#14-jpa--hibernate-deep-dive)
15. [Additional Spring & Spring Boot Q&A](#15-additional-spring--spring-boot-qa)

---

## 1. Spring Core — IoC and DI

### Inversion of Control (IoC)
```
Traditional: Your code creates and manages objects
Spring IoC:  Framework creates and manages objects (beans)
             You just declare what you need — Spring provides it
```

### Dependency Injection Types
```java
// 1. Constructor Injection (PREFERRED — mandatory dependencies, immutable, testable)
@Service
public class OrderService {
    private final PaymentService paymentService;
    private final EmailService emailService;

    @Autowired  // optional if only one constructor (Spring 4.3+)
    public OrderService(PaymentService paymentService, EmailService emailService) {
        this.paymentService = paymentService;
        this.emailService = emailService;
    }
}

// 2. Setter Injection (optional dependencies, can be changed after construction)
@Service
public class NotificationService {
    private EmailService emailService;

    @Autowired
    public void setEmailService(EmailService emailService) {
        this.emailService = emailService;
    }
}

// 3. Field Injection (convenient but NOT recommended — harder to test, hidden deps)
@Service
public class ProductService {
    @Autowired
    private InventoryService inventoryService;  // no way to inject in unit tests without reflection
}
```

### ApplicationContext vs BeanFactory
| Feature | BeanFactory | ApplicationContext |
|---------|-------------|-------------------|
| Bean creation | Lazy (on first request) | Eager (at startup) |
| Events | No | Yes (`ApplicationEvent`) |
| Internationalization | No | Yes (`MessageSource`) |
| AOP | Limited | Full support |
| Annotation support | No | Yes |
| Use | Legacy, memory-constrained | Always use this |

```java
ApplicationContext ctx = new AnnotationConfigApplicationContext(AppConfig.class);
// or in Spring Boot: auto-configured by SpringApplication.run()

MyBean bean = ctx.getBean(MyBean.class);
MyBean namedBean = ctx.getBean("myBeanName", MyBean.class);
```

### @Qualifier and @Primary
```java
interface MessageService { void send(String msg); }

@Component("emailService")
public class EmailService implements MessageService { ... }

@Component("smsService")
public class SmsService implements MessageService { ... }

@Service
public class NotificationService {
    private final MessageService messageService;

    @Autowired
    public NotificationService(@Qualifier("emailService") MessageService messageService) {
        this.messageService = messageService;
    }
}

// @Primary: default bean when no @Qualifier specified
@Primary
@Component
public class EmailService implements MessageService { ... }
```

---

## 2. Bean Lifecycle & Scopes

### Bean Lifecycle
```
1. Instantiation (constructor called)
2. Populate properties (@Autowired dependencies injected)
3. BeanNameAware.setBeanName()
4. BeanFactoryAware.setBeanFactory()
5. ApplicationContextAware.setApplicationContext()
6. BeanPostProcessor.postProcessBeforeInitialization()
7. @PostConstruct / InitializingBean.afterPropertiesSet()
8. Custom init-method
9. BeanPostProcessor.postProcessAfterInitialization()
10. Bean is ready to use
...
11. @PreDestroy / DisposableBean.destroy()
12. Custom destroy-method
```

```java
@Component
public class MyBean implements InitializingBean, DisposableBean {

    @PostConstruct
    public void init() {
        System.out.println("1. @PostConstruct — after dependencies injected");
    }

    @Override
    public void afterPropertiesSet() {
        System.out.println("2. InitializingBean.afterPropertiesSet()");
    }

    @PreDestroy
    public void preDestroy() {
        System.out.println("3. @PreDestroy — before bean removed");
    }

    @Override
    public void destroy() {
        System.out.println("4. DisposableBean.destroy()");
    }
}
```

### Bean Scopes
| Scope | Description | Thread-safe? |
|-------|-------------|--------------|
| `singleton` | One instance per IoC container (default) | No (by default) |
| `prototype` | New instance every time | Yes (each thread gets own) |
| `request` | One per HTTP request (web only) | Yes |
| `session` | One per HTTP session (web only) | Usually yes |
| `application` | One per ServletContext | No |
| `websocket` | One per WebSocket session | Yes |

```java
@Component
@Scope("prototype")
public class TaskProcessor { }

// Injecting prototype into singleton (problem!)
@Service
public class TaskService {
    @Autowired
    private TaskProcessor processor;  // same instance always! Scope not respected

    // Solution 1: @Lookup
    @Lookup
    public TaskProcessor getTaskProcessor() { return null; }  // Spring overrides this

    // Solution 2: ObjectProvider / Provider
    @Autowired
    private ObjectProvider<TaskProcessor> processorProvider;
    public void process() {
        TaskProcessor p = processorProvider.getObject();  // new instance each time
    }
}
```

---

## 3. Spring AOP

### Concepts
```
Aspect:       Class containing cross-cutting concerns (logging, security, transactions)
Advice:       Action taken at a join point
  - @Before:  before method execution
  - @After:   after method (regardless of outcome)
  - @AfterReturning: after successful return
  - @AfterThrowing:  after exception thrown
  - @Around:  before AND after (most powerful, can modify result)
Join Point:   Point in execution where advice can be applied (method calls in Spring AOP)
Pointcut:     Expression selecting which join points to apply advice to
Weaving:      Linking aspects with application code
  - Compile-time (AspectJ)
  - Load-time (AspectJ)
  - Runtime (Spring AOP — uses proxies)
```

### Spring AOP Example
```java
@Aspect
@Component
public class LoggingAspect {

    // Pointcut expression: all methods in service package
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceMethods() {}

    @Before("serviceMethods()")
    public void logBefore(JoinPoint jp) {
        System.out.println("Before: " + jp.getSignature().getName());
    }

    @AfterReturning(pointcut = "serviceMethods()", returning = "result")
    public void logAfterReturn(JoinPoint jp, Object result) {
        System.out.println("Returned: " + result);
    }

    @AfterThrowing(pointcut = "serviceMethods()", throwing = "ex")
    public void logAfterException(JoinPoint jp, Exception ex) {
        System.out.println("Exception: " + ex.getMessage());
    }

    @Around("serviceMethods()")
    public Object logExecutionTime(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = pjp.proceed();  // call the actual method
        long time = System.currentTimeMillis() - start;
        System.out.println(pjp.getSignature() + " took " + time + "ms");
        return result;
    }
}
```

### Pointcut Expression Syntax
```java
// execution(modifiers? returnType declaring-type? method-name(params) throws?)
execution(public * *(..))                          // any public method
execution(* com.example.service.*.*(..))           // all methods in service package
execution(* com.example.service..*.*(..))          // service + sub-packages
execution(* *Service.*(..))                        // methods in classes ending with Service
execution(* save*(..))                             // methods starting with save

// @annotation: annotated methods
@Pointcut("@annotation(com.example.Audited)")

// within: type-based
within(com.example.service.*)                      // in service package
```

### How Spring AOP Works (Proxy-based)
```
Spring AOP uses two proxy mechanisms:
1. JDK Dynamic Proxy: if the target bean implements at least one interface
2. CGLIB Proxy: if the target bean has no interface (subclass proxy)

This means:
- AOP works on Spring-managed beans only
- @Transactional on private methods = doesn't work (no proxy interception)
- Self-invocation (calling annotated method from same class) = no AOP applied!
```

```java
// PROBLEM: self-invocation
@Service
public class OrderService {
    public void createOrder() {
        processPayment();  // direct call, NOT through proxy — @Transactional ignored!
    }

    @Transactional
    public void processPayment() { ... }
}

// SOLUTION: inject self or use ApplicationContext
@Service
public class OrderService {
    @Autowired
    private OrderService self;  // Spring injects proxy

    public void createOrder() {
        self.processPayment();  // goes through proxy — @Transactional works
    }
}
```

---

## 4. Spring Boot Fundamentals

### @SpringBootApplication
```java
@SpringBootApplication
// = @Configuration (marks as config class)
// + @ComponentScan (scans current package and sub-packages)
// + @EnableAutoConfiguration (enables Spring Boot magic)
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}
```

### Auto-Configuration
```
How Spring Boot auto-configures:
1. Reads META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
2. Each auto-config class is @Conditional:
   - @ConditionalOnClass: only if class on classpath
   - @ConditionalOnMissingBean: only if you haven't defined your own
   - @ConditionalOnProperty: only if property set
3. Your beans override auto-configured beans (@ConditionalOnMissingBean)
```

```java
// Example: DataSource auto-configuration
@AutoConfiguration
@ConditionalOnClass({ DataSource.class, EmbeddedDatabaseType.class })
@ConditionalOnMissingBean(DataSource.class)  // if you define your own, this is skipped
public class DataSourceAutoConfiguration {
    @Bean
    public DataSource dataSource(DataSourceProperties properties) { ... }
}

// To see all auto-configurations:
// --debug flag: prints auto-config report (positive/negative matches)
```

### Configuration Files
```yaml
# application.yml (YAML preferred for readability)
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb
    username: root
    password: ${DB_PASSWORD}  # environment variable reference
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: validate  # create, create-drop, update, validate, none
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL8Dialect
        format_sql: true

logging:
  level:
    root: INFO
    com.example: DEBUG
  file:
    name: logs/application.log
```

### Profiles
```java
// application-dev.yml, application-prod.yml, application-test.yml

// Activate profile:
// application.yml: spring.profiles.active=dev
// Command line: --spring.profiles.active=prod
// Environment variable: SPRING_PROFILES_ACTIVE=prod
// Test: @ActiveProfiles("test")

@Configuration
@Profile("dev")
public class DevConfig {
    @Bean
    public DataSource devDataSource() { return new EmbeddedDatabase...; }
}

@Component
@Profile("!test")  // active when NOT test profile
public class EmailSender { ... }
```

### Externalized Configuration
```java
// @Value
@Value("${app.name:DefaultApp}")  // with default value
private String appName;

@Value("${server.port}")
private int port;

// @ConfigurationProperties (preferred for groups of properties)
@ConfigurationProperties(prefix = "app.mail")
@Component  // or @Configuration
public class MailProperties {
    private String host;
    private int port = 587;  // default
    private String username;
    private boolean ssl = true;
    // getters and setters required
}

# application.yml
app:
  mail:
    host: smtp.gmail.com
    port: 587
    username: myapp@gmail.com
    ssl: true
```

---

## 5. Spring REST API

### Request Handling
```java
@RestController  // = @Controller + @ResponseBody
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // GET all with filtering and pagination
    @GetMapping
    public ResponseEntity<Page<OrderDTO>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(orderService.findAll(status, pageable));
    }

    // GET by ID
    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> getOrder(@PathVariable Long id) {
        return orderService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // POST — create
    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {
        OrderDTO created = orderService.create(request);
        URI location = URI.create("/api/v1/orders/" + created.getId());
        return ResponseEntity.created(location).body(created);
    }

    // PUT — full update
    @PutMapping("/{id}")
    public ResponseEntity<OrderDTO> updateOrder(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderRequest request) {
        return ResponseEntity.ok(orderService.update(id, request));
    }

    // PATCH — partial update
    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderDTO> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> updates) {
        return ResponseEntity.ok(orderService.updateStatus(id, updates.get("status")));
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### Validation
```java
// Dependency: spring-boot-starter-validation

public class CreateOrderRequest {
    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotBlank(message = "Product name cannot be empty")
    @Size(min = 2, max = 100)
    private String productName;

    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 1000)
    private int quantity;

    @DecimalMin("0.01")
    @DecimalMax("999999.99")
    private BigDecimal price;

    @Email
    private String contactEmail;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number")
    private String phone;

    @Future(message = "Delivery date must be in the future")
    private LocalDate deliveryDate;

    @Valid  // cascade validation to nested objects
    @NotNull
    private Address shippingAddress;
}
```

### Global Exception Handling
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(OrderNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidation(
            MethodArgumentNotValidException ex) {
        List<FieldError> errors = ex.getBindingResult().getFieldErrors()
            .stream()
            .map(err -> new FieldError(err.getField(), err.getDefaultMessage()))
            .collect(Collectors.toList());
        return ResponseEntity.badRequest()
            .body(new ValidationErrorResponse("VALIDATION_FAILED", errors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("INTERNAL_ERROR", "Something went wrong"));
    }
}

record ErrorResponse(String code, String message) {}
```

### HTTP Status Codes to Remember
```
2xx — Success
  200 OK               — GET, PUT, PATCH success
  201 Created          — POST that creates a resource
  204 No Content       — DELETE success, or PUT with no body
  206 Partial Content  — Chunked response

4xx — Client Error
  400 Bad Request      — Invalid input, validation failed
  401 Unauthorized     — Not authenticated
  403 Forbidden        — Authenticated but not authorized
  404 Not Found        — Resource doesn't exist
  405 Method Not Allowed
  409 Conflict         — Duplicate resource, version conflict
  422 Unprocessable    — Validation error (alternate to 400)
  429 Too Many Requests — Rate limited

5xx — Server Error
  500 Internal Error   — Unexpected server error
  502 Bad Gateway      — Upstream service error
  503 Service Unavailable — Down for maintenance or overloaded
  504 Gateway Timeout  — Upstream took too long
```

---

## 6. Spring Data JPA

### Entity Design
```java
@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_customer_id", columnList = "customer_id"),
    @Index(name = "idx_status", columnList = "status")
})
@EntityListeners(AuditingEntityListener.class)
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true, length = 20)
    private String orderNumber;

    @Enumerated(EnumType.STRING)  // store as string, not ordinal
    private OrderStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Version
    private Long version;  // optimistic locking
}
```

### Relationships
```java
// @OneToMany — best practice
@Entity
public class Order {
    @OneToMany(mappedBy = "order",     // "order" is field name in OrderItem
               cascade = CascadeType.ALL,
               orphanRemoval = true,
               fetch = FetchType.LAZY)  // LAZY is default for collections
    private List<OrderItem> items = new ArrayList<>();

    // Helper methods to maintain bidirectional consistency
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);
    }
}

@Entity
public class OrderItem {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;
}

// @ManyToMany — use join table
@Entity
public class Student {
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(name = "student_course",
               joinColumns = @JoinColumn(name = "student_id"),
               inverseJoinColumns = @JoinColumn(name = "course_id"))
    private Set<Course> courses = new HashSet<>();
}
```

### Repository Methods
```java
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Derived query methods (Spring Data parses method name)
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByCustomerId(Long customerId);
    List<Order> findByStatusAndCustomerId(OrderStatus status, Long customerId);
    Optional<Order> findByOrderNumber(String orderNumber);
    boolean existsByOrderNumber(String orderNumber);
    long countByStatus(OrderStatus status);
    List<Order> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
    List<Order> findByStatusIn(List<OrderStatus> statuses);

    // JPQL queries
    @Query("SELECT o FROM Order o WHERE o.customer.id = :customerId AND o.status = :status")
    List<Order> findByCustomerAndStatus(@Param("customerId") Long cid,
                                        @Param("status") OrderStatus status);

    // Native SQL
    @Query(value = "SELECT * FROM orders WHERE YEAR(created_at) = :year",
           nativeQuery = true)
    List<Order> findByYear(@Param("year") int year);

    // Modifying query
    @Modifying
    @Transactional
    @Query("UPDATE Order o SET o.status = :status WHERE o.id = :id")
    int updateStatus(@Param("id") Long id, @Param("status") OrderStatus status);

    // Pagination
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    // Projection
    List<OrderSummary> findByCustomerId(Long customerId);  // only selected fields
}

// Projection interface (only selected columns fetched)
public interface OrderSummary {
    Long getId();
    String getOrderNumber();
    OrderStatus getStatus();
    @Value("#{target.customer.name}")  // SpEL for computed fields
    String getCustomerName();
}
```

### N+1 Problem and Solutions
```java
// N+1 PROBLEM:
// 1 query to get all orders
// N queries to get customer for each order (LAZY loading triggered)
List<Order> orders = orderRepository.findAll();
orders.forEach(o -> System.out.println(o.getCustomer().getName()));  // N queries!

// SOLUTION 1: JOIN FETCH in JPQL
@Query("SELECT o FROM Order o JOIN FETCH o.customer WHERE o.status = :status")
List<Order> findWithCustomer(@Param("status") OrderStatus status);

// SOLUTION 2: EntityGraph
@EntityGraph(attributePaths = {"customer", "items"})
List<Order> findByStatus(OrderStatus status);

// SOLUTION 3: @BatchSize (fetches N related entities at once)
@OneToMany(mappedBy = "order")
@BatchSize(size = 20)
private List<OrderItem> items;

// SOLUTION 4: DTO projections (only select needed fields)
@Query("SELECT new com.example.dto.OrderDTO(o.id, o.status, c.name) " +
       "FROM Order o JOIN o.customer c")
List<OrderDTO> findOrderSummaries();
```

### Locking
```java
// OPTIMISTIC LOCKING (@Version field)
// - No DB lock held
// - On update: checks version matches, if not → OptimisticLockException
// - Good for low contention scenarios
@Version
private Long version;

// PESSIMISTIC LOCKING (DB-level lock)
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT o FROM Order o WHERE o.id = :id")
Optional<Order> findByIdWithLock(@Param("id") Long id);
// SELECT ... FOR UPDATE — other transactions block until lock released
```

---

## 7. Spring Security

### Security Filter Chain
```
Request → Filter Chain → Servlet (Controller)

Key Filters (in order):
1. SecurityContextPersistenceFilter — restore security context from session
2. UsernamePasswordAuthenticationFilter — form login
3. BasicAuthenticationFilter — HTTP Basic auth
4. JwtAuthenticationFilter — custom JWT filter
5. ExceptionTranslationFilter — handle auth exceptions (401/403)
6. FilterSecurityInterceptor — authorization decisions
```

### Spring Security 6.x Configuration
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // enables @PreAuthorize etc.
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())  // disable for REST APIs
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/products/**").hasAnyRole("USER", "ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(customAuthEntryPoint)
                .accessDeniedHandler(customAccessDeniedHandler)
            )
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);  // strength 12 (default 10)
    }

    @Bean
    public AuthenticationManager authManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
```

### JWT Authentication — Complete Flow
```java
// 1. Login endpoint
@PostMapping("/auth/login")
public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
    Authentication auth = authManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.username(), request.password())
    );
    UserDetails user = (UserDetails) auth.getPrincipal();
    String token = jwtService.generateToken(user);
    String refresh = jwtService.generateRefreshToken(user);
    return ResponseEntity.ok(new AuthResponse(token, refresh));
}

// 2. JWT Service
@Service
public class JwtService {
    private static final String SECRET = "your-secret-key-min-256-bits-for-HS256";
    private static final long EXPIRATION = 1000 * 60 * 60 * 24; // 24 hours

    public String generateToken(UserDetails user) {
        return Jwts.builder()
            .subject(user.getUsername())
            .claim("roles", user.getAuthorities())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + EXPIRATION))
            .signWith(getSigningKey())
            .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean isTokenValid(String token, UserDetails user) {
        return extractUsername(token).equals(user.getUsername()) && !isTokenExpired(token);
    }

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }
}

// 3. JWT Filter
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        String username = jwtService.extractUsername(token);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails user = userDetailsService.loadUserByUsername(username);
            if (jwtService.isTokenValid(token, user)) {
                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        chain.doFilter(request, response);
    }
}
```

### Method Security
```java
@Service
public class OrderService {

    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
    public List<Order> getUserOrders(Long userId) { ... }

    @PreAuthorize("hasPermission(#orderId, 'Order', 'READ')")
    public Order getOrder(Long orderId) { ... }

    @PostAuthorize("returnObject.customerId == authentication.principal.id")
    public Order getOrderSecure(Long orderId) { ... }

    @Secured("ROLE_ADMIN")
    public void deleteOrder(Long id) { ... }
}
```

---

## 8. Spring Transactions

### @Transactional Deep Dive

#### Propagation Levels
```
REQUIRED (default):
  - Join existing transaction if present
  - Create new one if none exists
  - Most common

REQUIRES_NEW:
  - Always create a new transaction
  - Suspend any existing transaction
  - Use for: audit logging (must save even if outer tx rolls back)

SUPPORTS:
  - Use existing tx if present, else run non-transactionally
  - Use for: read-only methods that can run with or without tx

NOT_SUPPORTED:
  - Suspend existing tx, run non-transactionally
  - Use for: operations that must NOT run in a tx (e.g., some batch)

NEVER:
  - Throw exception if a transaction exists

MANDATORY:
  - Must have existing transaction, else throw exception

NESTED:
  - Run within nested transaction if exists (uses savepoint)
  - If outer commits → nested commits
  - If nested rolls back → only nested rolls back (outer can continue)
  - Not all databases support this
```

#### Isolation Levels
```
READ_UNCOMMITTED: Can read uncommitted (dirty) data from other tx
  Allows: Dirty Read, Non-repeatable Read, Phantom Read

READ_COMMITTED: Only reads committed data (Oracle/PostgreSQL default)
  Prevents: Dirty Read
  Allows: Non-repeatable Read, Phantom Read

REPEATABLE_READ: Same read returns same data within same tx (MySQL default)
  Prevents: Dirty Read, Non-repeatable Read
  Allows: Phantom Read

SERIALIZABLE: Strictest, full isolation
  Prevents: All three
  Cost: Performance (table-level locking or extra checks)

Dirty Read: Read data modified but not yet committed by another tx
Non-repeatable Read: Same row gives different values in same tx
Phantom Read: Same query returns different rows in same tx (new rows inserted)
```

```java
@Transactional(
    propagation = Propagation.REQUIRED,
    isolation = Isolation.READ_COMMITTED,
    timeout = 30,
    readOnly = false,
    rollbackFor = {OrderException.class, PaymentException.class},
    noRollbackFor = {NotFoundException.class}
)
public void processOrder(Order order) { ... }

// IMPORTANT: @Transactional only rolls back on RuntimeException and Error by default
// For checked exceptions, must specify: rollbackFor = IOException.class
```

#### Common Mistakes
```java
// MISTAKE 1: private/self-invoked method — AOP proxy not used
@Transactional
private void save() { ... }  // @Transactional IGNORED on private methods

// MISTAKE 2: Catching exception that should trigger rollback
@Transactional
public void process() {
    try {
        riskyOperation();
    } catch (RuntimeException e) {
        log.error("Error", e);  // swallows exception → NO ROLLBACK!
    }
}
// Fix: rethrow or use TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()

// MISTAKE 3: @Transactional on @Controller — use on @Service

// MISTAKE 4: Long transactions holding DB locks
// Break large operations into batches
```

---

## 9. Microservices with Spring Cloud

### Architecture Overview
```
Client Request
  ↓
API Gateway (Spring Cloud Gateway)
  ↓  routes + filters + auth
Service A ←→ Service B (via Feign/RestTemplate/WebClient)
  ↑              ↑
Eureka Server (Service Discovery)
  ↑
Config Server (centralized config)

Cross-cutting:
  - Resilience4j (Circuit Breaker, Rate Limiter, Retry)
  - Micrometer + Zipkin (distributed tracing)
  - Kafka/RabbitMQ (async messaging)
```

### Service Discovery — Eureka
```java
// Eureka Server
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApp { ... }

// Eureka Client (every microservice)
@SpringBootApplication
@EnableDiscoveryClient
public class OrderServiceApp { ... }

# application.yml for client
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
spring:
  application:
    name: order-service
```

### Feign Client (Declarative REST)
```java
@FeignClient(name = "payment-service",
             fallback = PaymentServiceFallback.class)
public interface PaymentServiceClient {

    @PostMapping("/api/payments")
    PaymentResponse processPayment(@RequestBody PaymentRequest request);

    @GetMapping("/api/payments/{id}")
    PaymentDTO getPayment(@PathVariable Long id);
}

@Component
public class PaymentServiceFallback implements PaymentServiceClient {
    public PaymentResponse processPayment(PaymentRequest request) {
        return PaymentResponse.failed("Payment service unavailable");
    }
    public PaymentDTO getPayment(Long id) {
        return PaymentDTO.empty();
    }
}
```

### Circuit Breaker — Resilience4j
```java
// States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (probe)
// CLOSED: all calls pass through
// OPEN: all calls fail fast (no actual call made) after failure threshold
// HALF_OPEN: limited calls pass through to test recovery

@Service
public class OrderService {

    @CircuitBreaker(name = "paymentService", fallbackMethod = "paymentFallback")
    @Retry(name = "paymentService", fallbackMethod = "paymentFallback")
    @RateLimiter(name = "paymentService")
    @TimeLimiter(name = "paymentService")
    public CompletableFuture<PaymentResponse> processPayment(PaymentRequest req) {
        return CompletableFuture.supplyAsync(() -> paymentClient.process(req));
    }

    public CompletableFuture<PaymentResponse> paymentFallback(PaymentRequest req, Exception ex) {
        log.error("Payment service fallback: {}", ex.getMessage());
        return CompletableFuture.completedFuture(PaymentResponse.queued());
    }
}

# Configuration
resilience4j:
  circuitbreaker:
    instances:
      paymentService:
        slidingWindowSize: 10
        failureRateThreshold: 50      # open when 50% of 10 calls fail
        waitDurationInOpenState: 30s
        permittedNumberOfCallsInHalfOpenState: 3
  retry:
    instances:
      paymentService:
        maxAttempts: 3
        waitDuration: 1s
        exponentialBackoffMultiplier: 2
```

### API Gateway — Spring Cloud Gateway
```java
@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("order-service", r -> r
                .path("/api/orders/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .addRequestHeader("X-Gateway", "true")
                    .circuitBreaker(c -> c.setName("orderCB").setFallbackUri("forward:/fallback"))
                )
                .uri("lb://ORDER-SERVICE"))  // lb:// = load balanced via Eureka
            .route("product-service", r -> r
                .path("/api/products/**")
                .uri("lb://PRODUCT-SERVICE"))
            .build();
    }
}

# Or via YAML
spring:
  cloud:
    gateway:
      routes:
        - id: order-service
          uri: lb://ORDER-SERVICE
          predicates:
            - Path=/api/orders/**
          filters:
            - StripPrefix=1
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10
                redis-rate-limiter.burstCapacity: 20
```

### Saga Pattern — Distributed Transactions
```
Problem: Transactions spanning multiple microservices — can't use 2PC (too slow, couples services)

CHOREOGRAPHY (event-driven):
  OrderService → publishes OrderCreated event
  PaymentService → subscribes, processes payment → publishes PaymentCompleted
  InventoryService → subscribes, reserves inventory → publishes InventoryReserved
  ShippingService → subscribes, creates shipment

  If payment fails → PaymentService publishes PaymentFailed
  OrderService subscribes → cancels order
  
  PRO: Loose coupling
  CON: Hard to track, circular dependencies risk

ORCHESTRATION (central coordinator):
  OrderSaga orchestrator tells each service what to do
  Controls compensation if anything fails
  
  PRO: Easy to track, clear flow
  CON: Central point of failure, coupling to orchestrator
```

### Kafka Integration
```java
// Producer
@Service
public class OrderEventPublisher {

    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public void publishOrderCreated(Order order) {
        OrderEvent event = new OrderEvent(order.getId(), "ORDER_CREATED", order.getStatus());
        kafkaTemplate.send("orders-topic", order.getId().toString(), event)
            .addCallback(
                result -> log.info("Event published: {}", event),
                ex -> log.error("Failed to publish event", ex)
            );
    }
}

// Consumer
@Service
public class OrderEventConsumer {

    @KafkaListener(topics = "orders-topic",
                   groupId = "payment-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void handleOrderEvent(
            @Payload OrderEvent event,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            Acknowledgment ack) {
        try {
            processEvent(event);
            ack.acknowledge();  // manual acknowledgment
        } catch (Exception e) {
            log.error("Failed to process event: {}", event, e);
            // don't ack — message will be redelivered
        }
    }
}

# Configuration
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all          # wait for all replicas
      retries: 3
    consumer:
      group-id: order-service
      auto-offset-reset: earliest
      enable-auto-commit: false  # manual ack
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
```

---

## 10. Spring Boot Actuator

```yaml
# Enable all endpoints
management:
  endpoints:
    web:
      exposure:
        include: "*"
  endpoint:
    health:
      show-details: always
  metrics:
    tags:
      application: ${spring.application.name}
```

```
Key Endpoints:
/actuator/health       — application health (UP/DOWN)
/actuator/info         — app info
/actuator/metrics      — all available metrics
/actuator/metrics/jvm.memory.used
/actuator/env          — environment properties
/actuator/beans        — all beans
/actuator/mappings     — all URL mappings
/actuator/loggers      — change log levels at runtime
/actuator/threaddump   — thread dump
/actuator/heapdump     — heap dump
/actuator/prometheus   — Prometheus format metrics
```

```java
// Custom health indicator
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        try {
            // check DB connection
            return Health.up()
                .withDetail("database", "PostgreSQL")
                .withDetail("status", "Connected")
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}

// Custom metric
@Component
public class OrderMetrics {
    private final Counter ordersCreated;

    public OrderMetrics(MeterRegistry registry) {
        ordersCreated = Counter.builder("orders.created")
            .description("Total orders created")
            .tag("environment", "prod")
            .register(registry);
    }

    public void recordOrderCreated() {
        ordersCreated.increment();
    }
}
```

---

## 11. Interview Q&A

> **This section is preserved in full — nothing removed.** Additional questions are in [Section 13](#13-additional-interview-qa-new-questions-only) only.

**Q: How does Spring Boot auto-configuration work?**
A: Spring Boot reads `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` from all JARs on the classpath. Each listed class is a `@Configuration` annotated with `@Conditional*` annotations. For example, `DataSourceAutoConfiguration` only applies `@ConditionalOnClass(DataSource.class)` and `@ConditionalOnMissingBean(DataSource.class)`. If you define your own `DataSource` bean, Spring's auto-config is skipped.

**Q: Difference between @Component, @Service, @Repository, @Controller?**
A: All four are specializations of `@Component` and enable component scanning. Semantically: `@Repository` adds persistence exception translation (converts SQL exceptions to Spring's `DataAccessException`). `@Service` marks business logic. `@Controller` marks MVC controllers. `@RestController` = `@Controller` + `@ResponseBody`. They're all equivalent for DI purposes but carry semantic meaning.

**Q: Explain @Transactional propagation with a practical example?**
A: Consider `OrderService.createOrder()` calling `AuditService.logAction()`. If `logAction()` has `REQUIRES_NEW`, it runs in its own transaction. If `createOrder()` fails and rolls back, the audit log is still saved. If `logAction()` had `REQUIRED` (default), the log would roll back along with the order.

**Q: What is the N+1 problem?**
A: When fetching a list of N entities and then accessing a lazily-loaded relationship on each, you get 1 initial query + N additional queries. Fix: use JOIN FETCH in JPQL, `@EntityGraph` annotation, or DTO projections to load exactly what you need in one query.

**Q: How does JWT authentication work end-to-end?**
A: 1) User sends username/password to `/auth/login`. 2) Server validates credentials against UserDetailsService. 3) Server generates JWT (header.payload.signature) signed with secret key. 4) Client stores JWT (localStorage or httpOnly cookie). 5) Client sends JWT in `Authorization: Bearer <token>` header. 6) `JwtAuthFilter` extracts token, validates signature and expiration, loads UserDetails, sets SecurityContext. 7) Request proceeds to controller.

**Q: What is the difference between `WebClient` and `RestTemplate`?**
A: `RestTemplate` is synchronous and blocking — thread waits until response arrives. `WebClient` is reactive and non-blocking — thread is freed while waiting, better for high-concurrency scenarios. `RestTemplate` is being deprecated. Spring recommends `WebClient` even for synchronous use (`block()` can be called).

**Q: Explain Spring AOP and when self-invocation is a problem?**
A: Spring AOP creates proxy objects around your beans. Advice only applies when a method is called through the proxy. When `serviceA.methodA()` calls `this.methodB()` inside the same class, it bypasses the proxy, so `@Transactional`, `@Cacheable`, etc. on `methodB` are ignored. Solution: inject the bean's own proxy using `@Autowired private ServiceA self` and call `self.methodB()`.

**Q: What is Circuit Breaker and when to use it?**
A: Circuit Breaker prevents cascade failures. When a downstream service is failing, the circuit "opens" and calls fail fast without hitting the service. After a wait period, it goes to HALF_OPEN to probe recovery. Use when: calling external/unreliable services, preventing thread pool exhaustion from slow downstream, implementing graceful degradation with fallback responses.

---

## 12. DEEP DIVE: Tough Topics

### 12.1 @Valid vs @Validated

| | `@Valid` | `@Validated` |
|--|----------|--------------|
| Source | JSR-380 (javax/jakarta.validation) | Spring-specific |
| Where | Method params, fields, nested objects | Class level, method level |
| Groups | No group support | Supports validation groups |
| Cascade | Validates nested `@Valid` objects | Same via `@Valid` on fields |

```java
// @Valid — standard bean validation on request body
@PostMapping("/orders")
public Order create(@Valid @RequestBody CreateOrderRequest request) { ... }

// @Validated with groups — different rules for create vs update
public interface CreateGroup {}
public interface UpdateGroup {}

@Data
public class UserDto {
    @Null(groups = CreateGroup.class)
    @NotNull(groups = UpdateGroup.class)
    private Long id;

    @NotBlank(groups = {CreateGroup.class, UpdateGroup.class})
    private String email;
}

@PostMapping("/users")
public User create(@Validated(CreateGroup.class) @RequestBody UserDto dto) { ... }

@PutMapping("/users/{id}")
public User update(@Validated(UpdateGroup.class) @RequestBody UserDto dto) { ... }
```

**Interview answer:** Use `@Valid` for simple request validation. Use `@Validated` when you need validation groups or class-level method validation (`@Validated` on service class + `@NotNull` on method params).

### 12.2 @Transactional Propagation — All Modes

| Propagation | Behavior |
|-------------|----------|
| `REQUIRED` (default) | Join existing transaction; create new if none |
| `REQUIRES_NEW` | Always new transaction; suspend existing |
| `NESTED` | Nested transaction with savepoint inside existing |
| `SUPPORTS` | Use transaction if exists; else non-transactional |
| `NOT_SUPPORTED` | Suspend existing; run non-transactional |
| `MANDATORY` | Must have transaction; else `TransactionException` |
| `NEVER` | Must NOT have transaction; else `TransactionException` |

```java
@Service
public class OrderService {
    @Transactional  // REQUIRED
    public void createOrder(Order order) {
        orderRepo.save(order);
        auditService.log("ORDER_CREATED", order.getId());  // joins same transaction
    }
}

@Service
public class AuditService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, Long orderId) {
        auditRepo.save(new AuditLog(action, orderId));
        // Runs in OWN transaction — survives even if createOrder() rolls back
    }
}
```

**Interview trap:** `REQUIRES_NEW` creates a new DB connection from pool. Overuse can exhaust connection pool.

### 12.3 ApplicationContext vs BeanFactory — Deep

| Feature | BeanFactory | ApplicationContext |
|---------|-------------|-------------------|
| Bean creation | Lazy (on first `getBean`) | Eager (most singletons at startup) |
| Events | No | `ApplicationEventPublisher` |
| i18n | No | `MessageSource` |
| AOP | Limited | Full proxy support |
| Web support | No | `WebApplicationContext` |
| Annotation processing | No | `@Autowired`, `@PostConstruct` |
| Use today | Almost never directly | Always (Spring Boot uses this) |

```java
// BeanFactory — lazy: bean NOT created until getBean()
BeanFactory factory = new XmlBeanFactory(new ClassPathResource("beans.xml"));
MyService svc = factory.getBean(MyService.class);  // NOW instantiated

// ApplicationContext — eager: singletons created at startup
ApplicationContext ctx = SpringApplication.run(App.class, args);
// All @Component singletons already created (unless @Lazy)
```

### 12.4 Circular Dependency — How It Happens and Fixes

```java
// PROBLEM: Constructor injection circular dependency — FAILS at startup
@Service
public class ServiceA {
    public ServiceA(ServiceB b) { }  // Spring cannot create A without B
}
@Service
public class ServiceB {
    public ServiceB(ServiceA a) { }  // Spring cannot create B without A
}
// Error: The dependencies of some of the beans form a cycle
```

**Solutions (in order of preference):**

1. **Redesign** — extract shared logic to `ServiceC` that both depend on
2. **@Lazy** — inject proxy, real bean created on first use
```java
public ServiceA(@Lazy ServiceB b) { this.b = b; }
```
3. **Setter/field injection** — Spring can create empty object first, then inject (not recommended for new code)
4. **ObjectProvider / Provider**
```java
public ServiceA(ObjectProvider<ServiceB> bProvider) {
    this.b = bProvider;  // deferred lookup
}
```

**Spring Boot 2.6+:** circular references disallowed by default (`spring.main.allow-circular-references=true` to override — avoid).

### 12.5 JPA vs CrudRepository vs JpaRepository

```
Repository (marker)
  └── CrudRepository<T, ID>
        ├── save(), saveAll(), findById(), findAll(), deleteById(), count()
        └── JpaRepository<T, ID>
              ├── everything in CrudRepository
              ├── flush(), saveAndFlush()
              ├── deleteInBatch(), deleteAllInBatch()
              ├── findAll(Sort), findAll(Pageable)
              └── getOne() / getReferenceById() (lazy proxy)
```

| | JPA (specification) | CrudRepository | JpaRepository |
|--|---------------------|----------------|---------------|
| What | Standard for ORM mapping | Spring Data interface | Extends CrudRepository |
| Level | EntityManager, JPQL | CRUD only | CRUD + paging + flush |
| Use | Custom complex queries | Simple CRUD | Most Spring Boot apps |

```java
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByStatus(OrderStatus status);  // derived query
    @Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.id = :id")
    Optional<Order> findWithItems(@Param("id") Long id);
}
```

### 12.6 Database Connectivity in Spring Boot

```
application.yml → DataSourceAutoConfiguration
  → HikariCP pool (default)
  → EntityManagerFactory (JPA)
  → TransactionManager
  → Repository proxies
```

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
  jpa:
    hibernate:
      ddl-auto: validate   # never use create-drop in prod
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        jdbc:
          batch_size: 20
```

**Flow:** Controller → `@Transactional` Service → Repository → Hibernate → JDBC → HikariCP → PostgreSQL

**Interview points:**
- HikariCP = fastest connection pool, default in Boot 2+
- `ddl-auto=validate` in prod; use Flyway/Liquibase for migrations
- N+1 fix: `JOIN FETCH`, `@EntityGraph`, DTO projection
- Read/write splitting: `@Transactional(readOnly=true)` routes to replica (with routing DataSource)

### 12.7 TestNG vs JUnit

| | JUnit 5 | TestNG |
|--|---------|--------|
| Default in Spring Boot | Yes | No (add dependency) |
| Annotations | `@Test`, `@BeforeEach` | `@Test`, `@BeforeMethod` |
| Parallel execution | Limited (extensions) | Built-in `parallel=true` |
| Test groups | Tags (`@Tag`) | Groups (`groups={"smoke"}`) |
| Dependencies | No native test order | `@Test(dependsOnMethods=...)` |
| Data providers | `@ParameterizedTest` | `@DataProvider` |
| XML suites | No | `testng.xml` |

**Interview answer:** Use JUnit 5 for Spring Boot (default, better ecosystem). TestNG when you need complex suite XML, test dependencies, or heavy parallel group execution.

### 12.8 HTTP vs HTTPS — How It Works

```
HTTP (port 80):
  Client ──plaintext request──► Server
  Server ──plaintext response──► Client
  Problem: anyone on network can read/modify traffic

HTTPS = HTTP + TLS/SSL (port 443):
  1. TCP handshake (SYN, SYN-ACK, ACK)
  2. TLS handshake:
     a. Client Hello (supported cipher suites, TLS version)
     b. Server Hello (chosen cipher, sends SSL certificate)
     c. Client verifies certificate with CA (Certificate Authority)
     d. Key exchange (generate session key — symmetric)
     e. Finished messages — encrypted channel established
  3. HTTP request/response encrypted with session key
```

**Key concepts for interviews:**
- **Symmetric encryption** — same key encrypt/decrypt (fast, used for data)
- **Asymmetric encryption** — public/private key pair (used during handshake)
- **Certificate** — binds domain to public key, signed by CA
- **TLS 1.2/1.3** — modern versions; SSL is deprecated

### 12.9 gRPC vs REST vs SQL

| | REST | gRPC | SQL |
|--|------|------|-----|
| Type | API architectural style | RPC framework | Query language |
| Protocol | HTTP/1.1 or HTTP/2 | HTTP/2 | N/A (talks to DB) |
| Payload | JSON (text) | Protocol Buffers (binary) | Structured queries |
| Contract | OpenAPI/Swagger (optional) | .proto file (strict) | DB schema |
| Streaming | Limited (SSE, WebSocket) | Unary, server, client, bidirectional | Result sets |
| Browser support | Native | Needs grpc-web proxy | N/A |
| Best for | Public APIs, CRUD | Inter-service, high perf | Data persistence |

**When to use gRPC in Spring:** microservice-to-microservice calls where latency and throughput matter. Use REST for external/public APIs.

```protobuf
// order.proto
service OrderService {
  rpc GetOrder(OrderRequest) returns (OrderResponse);
  rpc StreamOrders(Empty) returns (stream OrderResponse);
}
```

### 12.10 Monolithic vs Microservices (Spring Context)

| | Monolithic | Microservices |
|--|-----------|---------------|
| Deployment | Single JAR/WAR | Independent services |
| Spring setup | One `@SpringBootApplication` | Multiple Boot apps + Cloud |
| Transactions | Single `@Transactional` | Saga / eventual consistency |
| Communication | In-process method calls | REST / gRPC / Kafka |
| Config | `application.yml` | Spring Cloud Config |
| Discovery | N/A | Eureka / Consul |
| Gateway | N/A | Spring Cloud Gateway |
| Failure | One bug can crash all | Isolated blast radius |

### 12.11 Saga — Orchestration vs Choreography (Deep)

```
Order placement across Order, Payment, Inventory, Shipping services:

CHOREOGRAPHY:
  OrderSvc publishes OrderCreated → Kafka
  PaymentSvc consumes → charges → publishes PaymentDone OR PaymentFailed
  InventorySvc consumes PaymentDone → reserves → publishes InventoryReserved
  On PaymentFailed → OrderSvc consumes → cancels order (compensating action)

  Pros: loose coupling, no central coordinator
  Cons: hard to debug flow, cyclic event dependencies, no single view of saga state

ORCHESTRATION:
  OrderSagaOrchestrator:
    1. call PaymentService.charge() → fail? → compensate cancel
    2. call InventoryService.reserve() → fail? → refund + cancel
    3. call ShippingService.create() → fail? → release inventory + refund

  Pros: clear flow, easy monitoring, centralized retry/compensation
  Cons: orchestrator is dependency, single point of failure (mitigate with HA)
```

### 12.12 Multithreading Resource Allocation in Spring

**Problem:** Multiple threads competing for DB connections, seats, inventory.

**Solutions without `synchronized`:**
1. **Database pessimistic lock:** `@Lock(LockModeType.PESSIMISTIC_WRITE)` or `SELECT FOR UPDATE`
2. **Optimistic lock:** `@Version` field on entity
3. **Redis distributed lock:** `Redisson`, `SETNX` with TTL
4. **Semaphore** (in-process): limit concurrent bookings
5. **Kafka partitioning:** one consumer per partition = ordered processing
6. **@Transactional isolation:** `SERIALIZABLE` (last resort — slow)

```java
@Entity
public class Seat {
    @Id Long id;
    @Version int version;  // optimistic locking
    @Enumerated(EnumType.STRING)
    SeatStatus status;
}

@Transactional
public void bookSeat(Long seatId) {
    Seat seat = seatRepo.findById(seatId)
        .orElseThrow(() -> new NotFoundException(seatId));
    if (seat.getStatus() != AVAILABLE) throw new AlreadyBookedException();
    seat.setStatus(BOOKED);
    // OptimisticLockException if another thread updated version first
}
```

---

## 13. Additional Interview Q&A (New Questions Only)

> **Note:** Section 11 above is **unchanged** — all 8 original Q&A items are preserved in full. This section adds **only new questions** not covered in Section 11. For deep dives see [Section 12](#12-deep-dive-tough-topics).

**Q: What is Hibernate?**
A: Hibernate is an ORM (Object-Relational Mapping) framework for Java. It maps Java classes to database tables and Java objects to table rows. It manages CRUD operations automatically, provides HQL (Hibernate Query Language) for database-independent queries, supports first-level and second-level caching, lazy loading of associations, and transaction management via JPA/`EntityManager`. It reduces JDBC boilerplate (no manual `Connection`, `PreparedStatement`, row mapping) and provides database independence — switch PostgreSQL to MySQL with minimal code changes. In Spring Boot, Hibernate is the default JPA provider behind `spring-boot-starter-data-jpa`.

**Q: Explain the Spring bean lifecycle in detail?**
A: Full lifecycle:
1. **Instantiation** — Spring calls constructor via reflection
2. **Populate properties** — `@Autowired` dependencies injected
3. **Aware interfaces** — `BeanNameAware`, `BeanFactoryAware`, `ApplicationContextAware` callbacks
4. **BeanPostProcessor.postProcessBeforeInitialization()** — pre-init customization
5. **Initialization** — `@PostConstruct` → `InitializingBean.afterPropertiesSet()` → custom `init-method`
6. **BeanPostProcessor.postProcessAfterInitialization()** — post-init (AOP proxies created here!)
7. **Bean ready** — in use
8. **Destruction** — `@PreDestroy` → `DisposableBean.destroy()` → custom `destroy-method` on context shutdown

**Q: How to resolve circular dependency in Spring?**
A: Constructor injection circular deps **fail at startup** (Boot 2.6+ by default). Solutions in order:
1. **Redesign** — extract shared logic to a third bean (best)
2. **`@Lazy`** — inject proxy; real bean created on first use: `public ServiceA(@Lazy ServiceB b)`
3. **Setter/field injection** — Spring instantiates empty object first, then injects (not recommended for new code)
4. **`ObjectProvider<T>`** — deferred lookup: `bProvider.getObject()` when needed
Avoid `spring.main.allow-circular-references=true` in production — it hides design problems.

**Q: @Valid vs @Validated — difference?**
A: `@Valid` is JSR-380 standard — use on `@RequestBody`, nested objects; cascades to nested `@Valid` fields; no validation groups. `@Validated` is Spring-specific — supports **validation groups** (`@Validated(CreateGroup.class)`), can be placed on class/method for method-parameter validation. Use `@Valid` for simple REST request validation; `@Validated` when same DTO needs different rules for create vs update. See [Section 12.1](#121-valid-vs-validated) for code examples.

**Q: @Transactional propagation modes — all of them?**
A:
- **REQUIRED** (default) — join existing TX or create new
- **REQUIRES_NEW** — always new TX; suspend existing (audit log survives parent rollback)
- **NESTED** — nested TX with savepoint inside existing
- **SUPPORTS** — use TX if exists; else run non-transactional
- **NOT_SUPPORTED** — suspend existing TX; run non-transactional
- **MANDATORY** — must have existing TX; else `TransactionException`
- **NEVER** — must NOT have TX; else `TransactionException`

Section 11 has a practical `REQUIRES_NEW` example. See [Section 12.2](#122-transactional-propagation--all-modes) for code.

**Q: ApplicationContext vs BeanFactory?**
A: `BeanFactory` is the basic IoC container — **lazy** bean creation (bean created on first `getBean()`). `ApplicationContext` extends `BeanFactory` and adds: eager singleton init, event publishing (`ApplicationEventPublisher`), i18n (`MessageSource`), full AOP support, annotation processing (`@Autowired`, `@PostConstruct`), web support (`WebApplicationContext`). Spring Boot always uses `ApplicationContext` — never use `BeanFactory` directly in modern apps. See [Section 12.3](#123-applicationcontext-vs-beanfactory--deep).

**Q: JPA vs CrudRepository vs JpaRepository?**
A: **JPA** is the Java persistence specification (entities, `EntityManager`, JPQL). **CrudRepository** is a Spring Data interface providing `save()`, `findById()`, `findAll()`, `deleteById()`, `count()`. **JpaRepository** extends CrudRepository and adds `flush()`, `saveAndFlush()`, `deleteInBatch()`, `findAll(Pageable)`, `getReferenceById()`. In practice: extend `JpaRepository` for most Spring Boot apps; use custom `@Query` for complex joins. See [Section 12.5](#125-jpa-vs-crudrepository-vs-jparepository).

**Q: Saga orchestration vs choreography?**
A: **Choreography** — event-driven, no central coordinator. OrderService publishes `OrderCreated` → PaymentService reacts → publishes `PaymentCompleted` → InventoryService reacts. On failure, compensating events (`PaymentFailed` → OrderService cancels). Pros: loose coupling. Cons: hard to trace, complex compensation, event cycles. **Orchestration** — central `OrderSagaOrchestrator` calls each service step-by-step; runs compensations in reverse on failure. Pros: clear flow, easy monitoring. Cons: orchestrator is a dependency (must be HA). Section 9 also covers this. See [Section 12.11](#1211-saga--orchestration-vs-choreography-deep).

**Q: gRPC vs REST — when to use which in Spring?**
A: **REST** — HTTP/JSON, human-readable, browser-friendly, OpenAPI docs, best for **public/external APIs**. **gRPC** — HTTP/2, Protocol Buffers (binary, smaller/faster), strongly typed `.proto` contract, supports streaming, best for **inter-service communication** inside microservices where performance matters. Spring Boot: use `@RestController` for REST; use `grpc-spring-boot-starter` for gRPC. SQL is not comparable — it's the database query layer, not an API protocol. See [Section 12.9](#129-grpc-vs-rest-vs-sql).

**Q: HTTP vs HTTPS — how does it work?**
A: **HTTP** (port 80) — plaintext request/response over TCP; anyone on the network can read traffic. **HTTPS** (port 443) — HTTP + TLS: (1) TCP handshake, (2) TLS handshake — Client Hello → Server Hello + SSL certificate → client verifies CA → key exchange → symmetric session key established, (3) all HTTP traffic encrypted with AES. Asymmetric crypto used only during handshake; symmetric used for data (faster). See [Section 12.8](#128-http-vs-https--how-it-works).

**Q: TestNG vs JUnit — which for Spring Boot?**
A: **JUnit 5** is Spring Boot default (`spring-boot-starter-test`). Annotations: `@Test`, `@BeforeEach`, `@ParameterizedTest`. Extensions model for custom behavior. **TestNG** — test groups, `@Test(dependsOnMethods)`, `@DataProvider`, parallel execution via XML suites, better for complex test orchestration. Use JUnit 5 for standard Spring Boot projects. Use TestNG only if you need test dependencies, group-based CI pipelines, or XML suite configs. See [Section 12.7](#127-testng-vs-junit).

**Q: How to handle concurrent booking without synchronized?**
A: Layered approach:
1. **Optimistic locking** — `@Version` on entity; `OptimisticLockException` if concurrent update
2. **Pessimistic DB lock** — `@Lock(PESSIMISTIC_WRITE)` or `SELECT FOR UPDATE`
3. **Redis distributed lock** — `SET key NX EX 600` for seat hold during payment
4. **Semaphore** — limit concurrent DB operations in-process
5. **Kafka partitioning** — ordered processing per partition
6. **`ReentrantLock`** instead of `synchronized` (more flexible, no virtual-thread pinning)
See [Section 12.12](#1212-multithreading-resource-allocation-in-spring) for code.

**Q: How does database connectivity work in Spring Boot?**
A: `application.yml` datasource properties → `DataSourceAutoConfiguration` → **HikariCP** connection pool (default) → `EntityManagerFactory` (Hibernate/JPA) → `JpaTransactionManager` → Spring Data **Repository** proxies → `@Transactional` service layer → JDBC → database. Key config: `spring.datasource.url`, Hikari `maximum-pool-size`, `spring.jpa.hibernate.ddl-auto=validate` in prod, Flyway/Liquibase for migrations. Flow: `Controller → @Transactional Service → Repository → Hibernate → HikariCP → PostgreSQL`. See [Section 12.6](#126-database-connectivity-in-spring-boot).

---

## 14. JPA / Hibernate Deep Dive

### 14.1 `get()` vs `load()` (Hibernate)

| | `session.get(Entity.class, id)` | `session.load(Entity.class, id)` |
|--|--------------------------------|----------------------------------|
| Hit DB immediately? | **Yes** — SELECT now | **No** — returns proxy |
| If ID not found | Returns `null` | Throws `EntityNotFoundException` (when proxy accessed) |
| Use when | You need to know if row exists | You trust ID exists, only need reference |
| Spring Data equivalent | `findById()` → `Optional` | `getReferenceById()` → lazy proxy |

```java
// get / findById
Product p = productRepo.findById(1L).orElseThrow();
// → SELECT * FROM product WHERE id=1 immediately

// load / getReferenceById
Product proxy = productRepo.getReferenceById(1L);
// → no SELECT yet — just a Hibernate proxy
String name = proxy.getName();  // NOW SELECT runs
```

**Interview trap:** Use `getReferenceById()` only when ID is valid (e.g. FK assignment). Use `findById()` when existence is uncertain.

### 14.2 First Level vs Second Level Cache

```
┌─────────────────────────────────────────────────────────┐
│  Session / EntityManager (per transaction)              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  1st LEVEL CACHE (Persistence Context)          │   │
│  │  - Same Session → same entity instance          │   │
│  │  - Always ON, cannot disable                    │   │
│  │  - Scope: one transaction / session             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓ miss
┌─────────────────────────────────────────────────────────┐
│  2nd LEVEL CACHE (SessionFactory level)               │
│  - Shared across sessions (EhCache, Redis, Hazelcast)  │
│  - Must enable explicitly                             │
│  - Scope: entity type across JVM                      │
│  - Only for: lookup by ID, not queries by default     │
└─────────────────────────────────────────────────────────┘
                          ↓ miss
                    Database
```

| | 1st Level | 2nd Level |
|--|-----------|-----------|
| Scope | Per `EntityManager`/session | Per `SessionFactory`/JVM |
| Enabled | Always | `spring.jpa.properties.hibernate.cache.use_second_level_cache=true` |
| What's cached | Entities in current persistence context | Entity data by ID |
| Invalidation | Session closes | TTL, explicit evict, entity update |

```java
@Entity
@Cacheable
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class Product { ... }
```

**Query cache** (separate): caches query result IDs — use sparingly, invalidation is tricky.

### 14.3 Optimistic vs Pessimistic Locking

**Optimistic** — assume no conflict; detect at commit with `@Version`:

```java
@Entity
public class Product {
    @Id Long id;
    int stock;

    @Version
    int version;  // auto-incremented on each update
}

@Transactional
public void reduceStock(Long productId, int qty) {
    Product p = productRepo.findById(productId).orElseThrow();
    p.setStock(p.getStock() - qty);
    // UPDATE ... SET stock=?, version=version+1 WHERE id=? AND version=?
    // if another thread updated first → OptimisticLockException
}
```

**Pessimistic** — lock row in DB before update:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM Product p WHERE p.id = :id")
Product findByIdForUpdate(@Param("id") Long id);

// SQL: SELECT ... FOR UPDATE
```

| | Optimistic | Pessimistic |
|--|------------|-------------|
| Lock when | At commit | At read |
| Performance | Better (no DB lock held) | Worse (blocks other writers) |
| Conflicts | Retry on exception | Prevented upfront |
| Use when | Low contention, read-heavy | High contention (stock, seats) |

### 14.4 Dirty Checking

Hibernate tracks all **managed** (persistent) entities in the persistence context. On `flush()` or commit, it compares current field values with snapshot taken at load — if different, generates `UPDATE` automatically. **You don't call UPDATE manually.**

```java
@Transactional
public void updatePrice(Long id, BigDecimal newPrice) {
    Product p = productRepo.findById(id).get();
    p.setPrice(newPrice);  // no save() needed in same transaction!
    // Hibernate dirty-checks at flush → UPDATE product SET price=? ...
}
```

**Detached entity** — changes NOT tracked unless you `merge()`:

```java
Product p = repo.findById(1L).get();
// transaction ends — p is DETACHED
p.setPrice(x);
repo.save(p);  // merge — re-attaches and updates
```

### 14.5 Entity Lifecycle States

```
        new()
          │
          ▼
    ┌───────────┐   persist()/save()   ┌────────────┐
    │ TRANSIENT │ ──────────────────► │ PERSISTENT │
    └───────────┘                     └────────────┘
          ▲                                 │
          │                          flush/commit
          │                                 │
          │         clear()/close()         ▼
          │         ┌────────────┐    ┌───────────┐
          └──────── │  REMOVED   │◄───│ DETACHED  │
            remove()└────────────┘    └───────────┘
```

| State | Meaning | In persistence context? |
|-------|---------|-------------------------|
| **Transient** | `new Product()`, not saved | No |
| **Persistent** | Managed by Hibernate in TX | Yes — dirty checking active |
| **Detached** | Was persistent, session closed | No — changes ignored |
| **Removed** | `delete()` called, pending flush | Yes until flush |

### 14.6 Scenario — Product catalog: concurrent stock updates

**Problem:** Multiple users buy last items simultaneously → overselling.

**Solution (layered):**

```java
@Service
public class StockService {

    @Transactional
    public void purchase(Long productId, int quantity) {
        // Option A: Pessimistic — lock row immediately
        Product product = productRepo.findByIdForUpdate(productId);

        if (product.getStock() < quantity) {
            throw new OutOfStockException(productId);
        }
        product.setStock(product.getStock() - quantity);
    }

    @Transactional
    public void purchaseOptimistic(Long productId, int quantity) {
        // Option B: Optimistic — retry on conflict
        int retries = 3;
        while (retries-- > 0) {
            try {
                Product product = productRepo.findById(productId).orElseThrow();
                if (product.getStock() < quantity) throw new OutOfStockException(productId);
                product.setStock(product.getStock() - quantity);
                productRepo.flush();
                return;
            } catch (OptimisticLockException e) {
                if (retries == 0) throw new ConcurrentUpdateException();
            }
        }
    }
}
```

**Best for high-contention stock:** pessimistic `FOR UPDATE` or atomic SQL:

```sql
UPDATE product SET stock = stock - ? WHERE id = ? AND stock >= ?
-- rows affected = 0 → out of stock, no race
```

---

## 15. Additional Spring & Spring Boot Q&A

**Q: Difference between `@Bean` and `@Component`?**

| | `@Component` | `@Bean` |
|--|--------------|---------|
| Where | On a class | On a **method** in `@Configuration` class |
| Who creates object | Spring scans & instantiates class | **You** write the method body |
| Use when | Your own class (`@Service`, etc.) | 3rd-party classes you can't annotate (`RestTemplate`, `ObjectMapper`) |

```java
@Configuration
public class AppConfig {
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();  // you control creation
    }
}

@Component  // Spring creates this
public class OrderService { }
```

**Q: What is AOP? Real-world use case?**
A: **Aspect-Oriented Programming** — apply cross-cutting logic (logging, security, transactions) **without duplicating code** in every method. Spring AOP uses proxies.

```java
@Aspect
@Component
public class LoggingAspect {
    @Around("@annotation(Audited)")
    public Object log(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = pjp.proceed();
        log.info("{} took {}ms", pjp.getSignature(), System.currentTimeMillis() - start);
        return result;
    }
}
```

**Real use cases:** `@Transactional`, `@Cacheable`, `@PreAuthorize`, audit logging, metrics, retry logic.

**Q: How does Spring handle circular dependencies?**
A: See Section 13 and [12.4](#124-circular-dependency--how-it-happens-and-fixes). Constructor injection cycles fail. `@Lazy`, setter injection, or redesign.

**Q: How to secure REST APIs (JWT, OAuth2)?**
A:
- **JWT** — stateless; login returns signed token; client sends `Authorization: Bearer <token>`; server validates signature + expiry. Good for SPAs/mobile.
- **OAuth2** — delegate auth to provider (Google, Okta); flows: Authorization Code (web), Client Credentials (service-to-service). Spring Security OAuth2 Resource Server validates tokens.
- **Session-based** — server stores session; cookie-based; traditional web apps.

```java
http.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/public/**").permitAll()
    .requestMatchers("/api/admin/**").hasRole("ADMIN")
    .anyRequest().authenticated())
.sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
.oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
```

**Q: How does Spring Boot auto-configuration work?**
A: See Section 11 Q&A. `@SpringBootApplication` → `@EnableAutoConfiguration` → reads `META-INF/spring/...AutoConfiguration.imports` → applies `@Conditional*` configs only when classpath/properties match.

**Q: `application.properties` vs `application.yml`?**

| | `.properties` | `.yml` |
|--|---------------|--------|
| Format | `key=value` flat | Hierarchical YAML |
| Readability | Fine for few keys | Better for nested config |
| Multi-doc | No | `---` separator |
| Lists | Awkward | Native `- item` syntax |

Both work identically — Spring Boot loads both. Use **profiles**: `application-dev.yml`, `application-prod.yml` + `spring.profiles.active=prod`. Externalize secrets via env vars: `${DB_PASSWORD}`.

**Q: ApplicationContext vs BeanFactory?**
A: See Section 13. ApplicationContext = always use in Boot.

**Q: Scenario — Order system: inventory, payment, invoice as independent steps. Use Spring Events / AOP?**

A: **Spring Events** (loose coupling — preferred for independent services):

```java
// 1. Define event
public record OrderCreatedEvent(String orderId, BigDecimal amount) {}

// 2. Publish after order saved
@Service
public class OrderService {
    @Autowired ApplicationEventPublisher publisher;

    @Transactional
    public Order createOrder(OrderRequest req) {
        Order order = orderRepo.save(new Order(req));
        publisher.publishEvent(new OrderCreatedEvent(order.getId(), order.getTotal()));
        return order;
    }
}

// 3. Independent listeners (async)
@Component
public class InventoryListener {
    @EventListener
    @Async
    public void onOrderCreated(OrderCreatedEvent e) {
        inventoryService.reserve(e.orderId());
    }
}

@Component
public class PaymentListener {
    @EventListener
    @Async
    public void onOrderCreated(OrderCreatedEvent e) {
        paymentService.charge(e.orderId(), e.amount());
    }
}

@Component
public class InvoiceListener {
    @EventListener
    @Async
    public void onOrderCreated(OrderCreatedEvent e) {
        invoiceService.generate(e.orderId());
    }
}
```

**AOP** — for cross-cutting concerns on the **same** call (logging, audit, `@Transactional`), not for business workflow between services. For distributed microservices use **Kafka** events instead of in-process Spring Events.
