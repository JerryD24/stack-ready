# Design Patterns in Java — Deep Dive with Real Corporate Examples

> Patterns are **named, reusable solutions to recurring design problems**. They are not libraries you import — they are *vocabulary* and *structure*. In an interview, the value is showing **when** and **why** you'd reach for one (and the trade-off), not just reciting the UML. Every example below uses a realistic backend scenario (payments, provisioning, notifications, billing) — not toy "animal/pizza" examples.

## TABLE OF CONTENTS
1. [Why Design Patterns Matter](#1-why-design-patterns-matter)
2. [SOLID Principles Recap](#2-solid-principles-recap)
3. [Pattern Categories & How to Choose](#3-pattern-categories-how-to-choose)
4. [Singleton](#4-singleton)
5. [Factory Method](#5-factory-method)
6. [Abstract Factory](#6-abstract-factory)
7. [Builder](#7-builder)
8. [Prototype](#8-prototype)
9. [Adapter](#9-adapter)
10. [Bridge](#10-bridge)
11. [Composite](#11-composite)
12. [Decorator](#12-decorator)
13. [Facade](#13-facade)
14. [Flyweight](#14-flyweight)
15. [Proxy](#15-proxy)
16. [Chain of Responsibility](#16-chain-of-responsibility)
17. [Command](#17-command)
18. [Iterator](#18-iterator)
19. [Mediator](#19-mediator)
20. [Memento](#20-memento)
21. [Observer](#21-observer)
22. [State](#22-state)
23. [Strategy](#23-strategy)
24. [Template Method](#24-template-method)
25. [Visitor](#25-visitor)
26. [Interpreter](#26-interpreter)
27. [Enterprise & Spring Patterns](#27-enterprise-spring-patterns)
28. [Anti-Patterns to Avoid](#28-anti-patterns-to-avoid)
29. [Interview Q&A](#29-interview-qa)

---

## 1. Why Design Patterns Matter

**Theory.** A design pattern captures the *experience* of solving a class of problems so you don't reinvent (often badly) a structure that's already been refined. Their real benefits:

- **Shared vocabulary.** Saying "use a Strategy here" communicates an entire design in two words during a review.
- **Decoupling.** Most patterns exist to reduce coupling — between *what* varies and *what* stays stable — so change is local.
- **Testability.** Patterns that inject collaborators (Strategy, Factory, Observer) make seams for mocking.

**The cost.** Patterns add indirection. A premature pattern is *accidental complexity*. The senior signal is knowing the trade-off: introduce a pattern when you have **two or more real variations** or a clear axis of change — not "just in case".

**Mental model.** Almost every pattern is an application of one of two principles: *"program to an interface, not an implementation"* and *"favour composition over inheritance."*

---

## 2. SOLID Principles Recap

Patterns are how SOLID shows up in code. Quick recap with the "why":

- **S — Single Responsibility.** A class should have one reason to change. A `PriceCalculator` that also formats currency and writes to DB has three reasons to change.
- **O — Open/Closed.** Open for extension, closed for modification. Strategy/Decorator let you add behaviour without editing tested code.
- **L — Liskov Substitution.** A subtype must be usable wherever its base is, without surprises (the classic `Square extends Rectangle` violation breaks `setWidth`).
- **I — Interface Segregation.** Many small role interfaces beat one fat interface; clients shouldn't depend on methods they don't use.
- **D — Dependency Inversion.** Depend on abstractions. High-level policy shouldn't import low-level details — this is what makes DI containers (Spring) possible.

> Interview line: "Patterns are the *tactics*; SOLID is the *strategy*. I reach for a pattern when a SOLID principle is being violated by a concrete change request."

---

## 3. Pattern Categories & How to Choose

- **Creational** (Singleton, Factory Method, Abstract Factory, Builder, Prototype) — control *how objects are created*, hiding construction complexity and concrete types.
- **Structural** (Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy) — control *how objects are composed* into larger structures.
- **Behavioural** (Chain, Command, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor, Interpreter) — control *how objects collaborate and distribute responsibility*.

**Choosing heuristic:**
- "I need to swap an algorithm at runtime" → **Strategy**.
- "Behaviour depends on internal state and transitions" → **State**.
- "I must add responsibilities without subclass explosion" → **Decorator**.
- "I must integrate an incompatible third-party API" → **Adapter**.
- "Object creation depends on config/environment" → **Factory / Abstract Factory**.
- "Notify many parts on an event" → **Observer**.

---

## 4. Singleton

**Intent.** Guarantee a class has exactly **one instance** and provide a global access point.

**Problem it solves.** Some resources are inherently single: a connection pool, a metrics registry, an in-memory feature-flag cache. Multiple copies waste resources or cause inconsistency.

**Trade-offs.** Global state hurts testability and hides dependencies; in Spring you rarely hand-roll one (the container manages singleton-scoped beans). Know the **thread-safety** variants.

**Corporate example — feature-flag cache.** Loaded once at startup, read by every request.

```java
public final class FeatureFlags {
    // Initialization-on-demand holder: lazy + thread-safe, no synchronization cost
    private final Map<String, Boolean> flags = new ConcurrentHashMap<>();
    private FeatureFlags() { reload(); }

    private static class Holder { static final FeatureFlags INSTANCE = new FeatureFlags(); }
    public static FeatureFlags getInstance() { return Holder.INSTANCE; }

    public boolean isEnabled(String key) { return flags.getOrDefault(key, false); }
    public void reload() { /* fetch from config service */ }
}
```

**Variants to mention:** eager (`static final`), enum singleton (serialization/reflection-safe — Joshua Bloch's preferred), and double-checked locking with `volatile` for lazy init with parameters.

---

## 5. Factory Method

**Intent.** Define an interface for creating an object but let subclasses/implementations decide which concrete class to instantiate.

**Problem it solves.** Callers shouldn't hard-code `new ConcreteX()` when the concrete type depends on input or configuration — that scatters `if/else` and breaks Open/Closed.

**Corporate example — payment processor selection.** A gateway router returns the right processor per payment method.

```java
interface PaymentProcessor { Receipt charge(Money amount, Card card); }

class PaymentProcessorFactory {
    public PaymentProcessor create(PaymentMethod method) {
        return switch (method) {
            case CARD   -> new StripeProcessor();
            case UPI    -> new UpiProcessor();
            case WALLET -> new WalletProcessor();
        };
    }
}
// Caller stays oblivious to concrete classes:
PaymentProcessor p = factory.create(order.method());
Receipt r = p.charge(order.total(), order.card());
```

**Why it's better than a bare `switch` inline:** creation logic lives in one place; adding `BNPLProcessor` touches only the factory.

---

## 6. Abstract Factory

**Intent.** Provide an interface for creating **families of related objects** without specifying concrete classes.

**Problem it solves.** When a whole *set* of products must be consistent (same vendor, same cloud, same region), you don't want a client mixing a vendor-A queue with a vendor-B blob store.

**Corporate example — cloud provider abstraction.** Switch the entire infra stack (queue + object store + secrets) by swapping one factory.

```java
interface CloudFactory {
    MessageQueue queue();
    ObjectStore objectStore();
    SecretManager secrets();
}

class AwsFactory implements CloudFactory {
    public MessageQueue queue()       { return new SqsQueue(); }
    public ObjectStore objectStore()  { return new S3Store(); }
    public SecretManager secrets()    { return new SecretsManager(); }
}
class GcpFactory implements CloudFactory { /* Pub/Sub, GCS, Secret Manager */ }

// Wire once by environment; rest of the app is cloud-agnostic.
CloudFactory cloud = "aws".equals(env) ? new AwsFactory() : new GcpFactory();
```

**Factory Method vs Abstract Factory:** Factory Method creates *one* product via inheritance; Abstract Factory creates a *family* via composition.

---

## 7. Builder

**Intent.** Separate the construction of a complex object from its representation so the same process can build different representations; build step-by-step.

**Problem it solves.** Telescoping constructors (`new Order(a,b,null,null,true,...)`) are unreadable and error-prone; many optional fields need a fluent, validated assembly.

**Corporate example — outbound HTTP/API request or a complex `Notification`.**

```java
public final class Notification {
    private final String to, channel, template;
    private final Map<String,Object> data;
    private final boolean highPriority;

    private Notification(Builder b) { /* assign + validate invariants */ 
        this.to = b.to; this.channel = b.channel; this.template = b.template;
        this.data = Map.copyOf(b.data); this.highPriority = b.highPriority;
    }
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String to, channel = "email", template;
        private final Map<String,Object> data = new HashMap<>();
        private boolean highPriority;
        public Builder to(String v)          { this.to = v; return this; }
        public Builder channel(String v)     { this.channel = v; return this; }
        public Builder template(String v)    { this.template = v; return this; }
        public Builder with(String k, Object v) { data.put(k, v); return this; }
        public Builder highPriority()        { this.highPriority = true; return this; }
        public Notification build() {
            if (to == null || template == null) throw new IllegalStateException("to/template required");
            return new Notification(this);
        }
    }
}
Notification n = Notification.builder().to("user@x.com").template("INVOICE").with("amt", 999).highPriority().build();
```

**Real-world:** Lombok's `@Builder`, `StringBuilder`, `HttpRequest.newBuilder()`, Stream collectors. Builders shine for **immutable** objects with many optional fields.

---

## 8. Prototype

**Intent.** Create new objects by **cloning** a prototypical instance instead of constructing from scratch.

**Problem it solves.** When object creation is expensive (heavy initialization, deep config) or you need many near-identical variants, cloning a pre-built template is cheaper and avoids re-running setup.

**Corporate example — per-tenant config templates.** Start from a vetted base config, then tweak per customer.

```java
public class TenantConfig implements Cloneable {
    private Map<String,String> settings;
    private RateLimits limits;     // mutable nested object

    @Override public TenantConfig clone() {
        TenantConfig copy = new TenantConfig();
        copy.settings = new HashMap<>(this.settings);  // DEEP copy of mutable state
        copy.limits   = this.limits.copy();            // avoid shared references
        return copy;
    }
}
TenantConfig base = registry.get("standard-plan");
TenantConfig acme = base.clone();
acme.set("max_users", "500");   // base is untouched
```

**Gotcha to mention:** `Object.clone()` does a **shallow** copy — you must deep-copy mutable members or callers will share state. A copy constructor or factory is often clearer than `Cloneable`.

---

## 9. Adapter

**Intent.** Convert the interface of a class into another interface clients expect; let incompatible types work together.

**Problem it solves.** You can't change a third-party SDK or legacy system, but your code depends on a clean interface. Wrap the foreign API.

**Corporate example — integrating a legacy/3rd-party payment gateway.**

```java
// Our domain port:
interface PaymentGateway { boolean pay(String account, long paise); }

// Vendor SDK we can't modify:
class AcmePaySdk { Result execute(AcmeTxn txn) { /* ... */ } }

// Adapter maps our port to the vendor's shape:
class AcmePayAdapter implements PaymentGateway {
    private final AcmePaySdk sdk = new AcmePaySdk();
    public boolean pay(String account, long paise) {
        AcmeTxn txn = new AcmeTxn(account, paise / 100.0, "INR");
        return sdk.execute(txn).isSuccess();
    }
}
```

**Real-world:** `Arrays.asList`, `InputStreamReader` (byte→char), Spring's `HandlerAdapter`. **Adapter vs Facade:** Adapter changes an interface to match a contract; Facade *simplifies* a complex subsystem behind a new interface.

---

## 10. Bridge

**Intent.** Decouple an **abstraction** from its **implementation** so the two can vary independently (avoids a combinatorial subclass explosion).

**Problem it solves.** Two independent dimensions of change. Without Bridge you get `UrgentEmail`, `UrgentSms`, `NormalEmail`, `NormalSms`… (M×N classes). With it, M + N.

**Corporate example — notifications: message *type* × delivery *channel*.**

```java
interface Channel { void send(String to, String body); }      // implementation axis
class EmailChannel implements Channel { public void send(String to, String b){ /*...*/ } }
class SmsChannel   implements Channel { public void send(String to, String b){ /*...*/ } }

abstract class Notification {                                   // abstraction axis
    protected final Channel channel;
    Notification(Channel c) { this.channel = c; }
    abstract void notifyUser(String to);
}
class OtpNotification extends Notification {
    OtpNotification(Channel c){ super(c); }
    void notifyUser(String to){ channel.send(to, "Your OTP is 123456"); }
}
// Mix freely: new OtpNotification(new SmsChannel()), new PromoNotification(new EmailChannel())
```

---

## 11. Composite

**Intent.** Compose objects into **tree structures** and let clients treat individual objects and compositions **uniformly**.

**Problem it solves.** Hierarchies (org charts, file systems, nested UI, bill-of-materials) where a "group" and a "leaf" must support the same operations.

**Corporate example — organizational hierarchy headcount/cost roll-up.**

```java
interface OrgUnit { int headcount(); }                      // common contract

class Employee implements OrgUnit {                          // leaf
    public int headcount() { return 1; }
}
class Department implements OrgUnit {                        // composite
    private final List<OrgUnit> members = new ArrayList<>();
    public void add(OrgUnit u) { members.add(u); }
    public int headcount() {                                 // recurse uniformly
        return members.stream().mapToInt(OrgUnit::headcount).sum();
    }
}
```

**Real-world:** the entire DOM, Swing/JavaFX component trees, `java.io.File` listings.

---

## 12. Decorator

**Intent.** Attach additional responsibilities to an object **dynamically** by wrapping it — a flexible alternative to subclassing.

**Problem it solves.** You need optional, *stackable* behaviours (logging, caching, retry, compression) without a class per combination.

**Corporate example — wrapping a repository/service with cross-cutting concerns.**

```java
interface PricingService { Money quote(String sku); }

class BasePricingService implements PricingService {
    public Money quote(String sku) { /* DB / rules engine */ return Money.of(100); }
}
abstract class PricingDecorator implements PricingService {
    protected final PricingService delegate;
    PricingDecorator(PricingService d) { this.delegate = d; }
}
class CachingPricing extends PricingDecorator {
    private final Map<String,Money> cache = new ConcurrentHashMap<>();
    CachingPricing(PricingService d){ super(d); }
    public Money quote(String sku){ return cache.computeIfAbsent(sku, delegate::quote); }
}
class MetricsPricing extends PricingDecorator {
    MetricsPricing(PricingService d){ super(d); }
    public Money quote(String sku){ long t=System.nanoTime(); try { return delegate.quote(sku);} finally { /* record */ } }
}
// Stack them — order matters:
PricingService svc = new MetricsPricing(new CachingPricing(new BasePricingService()));
```

**Real-world:** `java.io` streams (`BufferedInputStream(new FileInputStream(...))`), `Collections.unmodifiableList`, Spring's transactional/cache proxies conceptually decorate beans.

---

## 13. Facade

**Intent.** Provide a **single, simplified interface** to a complex subsystem.

**Problem it solves.** Clients shouldn't orchestrate ten low-level services to do one business action; hide the choreography behind one method.

**Corporate example — customer onboarding orchestrates many services.**

```java
class OnboardingFacade {
    private final KycService kyc; private final AccountService accounts;
    private final WalletService wallet; private final NotificationService notify;
    // constructor injection omitted

    public CustomerId onboard(SignupRequest req) {
        kyc.verify(req.documents());
        CustomerId id = accounts.create(req.profile());
        wallet.open(id);
        notify.welcome(id);
        return id;                 // caller just calls onboard()
    }
}
```

**Facade vs Mediator:** Facade is a one-way simplification (clients → subsystem); Mediator coordinates *peer* objects talking to each other.

---

## 14. Flyweight

**Intent.** Minimize memory by **sharing** as much state as possible between many fine-grained objects; split state into **intrinsic** (shared) and **extrinsic** (passed in).

**Problem it solves.** Millions of objects that mostly duplicate immutable data (currency metadata, glyphs, tariff definitions) blow up heap.

**Corporate example — sharing immutable currency/tariff objects across millions of line items.**

```java
public final class Currency {                 // intrinsic, shared, immutable
    private final String code; private final int minorUnits;
    private Currency(String c, int m){ code=c; minorUnits=m; }
    private static final Map<String,Currency> POOL = new ConcurrentHashMap<>();
    public static Currency of(String code) {   // returns shared instance
        return POOL.computeIfAbsent(code, c -> new Currency(c, 2));
    }
}
// 5 million LineItem objects reference ~150 shared Currency instances, not 5M copies.
```

**Real-world:** `Integer.valueOf` caches −128..127; the JVM's String pool. Extrinsic state (e.g., the amount) is stored per-item, not in the flyweight.

---

## 15. Proxy

**Intent.** Provide a **surrogate** that controls access to another object — for lazy loading, access control, caching, or remote calls.

**Problem it solves.** You want to add control around an object without changing it or the client (vs Decorator which adds *behaviour*; Proxy controls *access/lifecycle*).

**Corporate example — protection + lazy proxy for an expensive report service.**

```java
interface ReportService { byte[] generate(String reportId); }

class RealReportService implements ReportService {
    public byte[] generate(String id) { /* heavy: hits warehouse */ return new byte[0]; }
}
class ReportServiceProxy implements ReportService {
    private final ReportService real = new RealReportService();
    private final SecurityContext ctx;
    ReportServiceProxy(SecurityContext c){ this.ctx = c; }
    public byte[] generate(String id) {
        if (!ctx.canAccess(id)) throw new AccessDeniedException(id);   // access control
        return real.generate(id);                                     // could also cache
    }
}
```

**Real-world:** Spring AOP (`@Transactional`, `@Cacheable`) is built on dynamic proxies (JDK/CGLIB); Hibernate lazy-loading proxies; RMI/remote stubs.

---

## 16. Chain of Responsibility

**Intent.** Pass a request along a **chain of handlers**; each either handles it or forwards it. Decouples sender from receiver.

**Problem it solves.** A request must pass through ordered, independent steps (validation, auth, enrichment) and you want to add/reorder steps without touching others.

**Corporate example — request processing pipeline for an incoming order.**

```java
abstract class Handler {
    private Handler next;
    public Handler setNext(Handler n){ this.next = n; return n; }
    public final void handle(OrderCtx ctx) {
        doHandle(ctx);
        if (next != null) next.handle(ctx);
    }
    protected abstract void doHandle(OrderCtx ctx);
}
class AuthHandler      extends Handler { protected void doHandle(OrderCtx c){ /* verify token */ } }
class ValidationHandler extends Handler{ protected void doHandle(OrderCtx c){ /* schema check */ } }
class FraudHandler     extends Handler { protected void doHandle(OrderCtx c){ /* risk score */ } }

Handler chain = new AuthHandler();
chain.setNext(new ValidationHandler()).setNext(new FraudHandler());
chain.handle(ctx);
```

**Real-world:** Servlet `Filter` chains, Spring Security filter chain, logging handlers, interceptor stacks.

---

## 17. Command

**Intent.** Encapsulate a request as an **object**, letting you parameterize, queue, log, and undo operations.

**Problem it solves.** You need to decouple the *invoker* from the *receiver*, schedule work, retry it, or record it for audit/undo.

**Corporate example — async job queue with retry + audit.**

```java
interface Command { void execute(); }

class ChargeCustomerCommand implements Command {
    private final PaymentService svc; private final OrderId order;
    ChargeCustomerCommand(PaymentService s, OrderId o){ svc=s; order=o; }
    public void execute(){ svc.charge(order); }
}
class JobRunner {                                   // invoker
    private final Queue<Command> queue = new ConcurrentLinkedQueue<>();
    public void submit(Command c){ queue.add(c); }   // can persist for durability
    public void runAll(){ Command c; while((c=queue.poll())!=null){ withRetry(c::execute); } }
}
```

**Real-world:** `Runnable`/`Callable` submitted to an `ExecutorService`, undo stacks in editors, transactional outbox commands, CQRS command handlers.

---

## 18. Iterator

**Intent.** Provide sequential access to elements of an aggregate **without exposing its internal representation**.

**Problem it solves.** Clients shouldn't know if data is backed by an array, tree, or a paged remote API; traversal logic lives with the collection.

**Corporate example — transparently paginating a remote API as one stream.**

```java
class PagedCustomerIterator implements Iterator<Customer> {
    private final ApiClient api; private Iterator<Customer> page; private String nextCursor = "";
    PagedCustomerIterator(ApiClient api){ this.api = api; advance(); }
    private void advance(){ var resp = api.fetch(nextCursor); page = resp.items().iterator(); nextCursor = resp.cursor(); }
    public boolean hasNext(){ if (page.hasNext()) return true; if (nextCursor==null) return false; advance(); return page.hasNext(); }
    public Customer next(){ return page.next(); }   // hides the paging entirely
}
```

**Real-world:** the entire `java.util` `Iterator`/`Iterable`, `Stream`, `Spliterator`.

---

## 19. Mediator

**Intent.** Define an object that **encapsulates how a set of objects interact**, so they don't refer to each other directly (reduces many-to-many coupling to many-to-one).

**Problem it solves.** When N components each know about the others, every change ripples. A mediator centralizes coordination.

**Corporate example — an order saga coordinator mediating inventory, payment, shipping.**

```java
class OrderMediator {
    private final Inventory inv; private final Payment pay; private final Shipping ship;
    public void place(Order o) {
        if (!inv.reserve(o)) { notifyFail(o, "OUT_OF_STOCK"); return; }
        if (!pay.charge(o))  { inv.release(o); notifyFail(o, "PAYMENT_FAILED"); return; }
        ship.schedule(o);                      // components never call each other directly
    }
    private void notifyFail(Order o, String reason){ /* ... */ }
}
```

**Real-world:** Spring's `ApplicationEventPublisher` (loosely), the MVC controller coordinating view/model, chat-room servers, orchestration-style Sagas.

---

## 20. Memento

**Intent.** Capture and externalize an object's internal state so it can be **restored later**, without violating encapsulation.

**Problem it solves.** Undo/redo, checkpoints, or rollback to a prior known-good state.

**Corporate example — workflow snapshot/rollback in a multi-step approval.**

```java
class Workflow {
    private String state; private int step;
    public Memento save(){ return new Memento(state, step); }       // snapshot
    public void restore(Memento m){ this.state = m.state; this.step = m.step; }
    public static final class Memento {                              // opaque to others
        private final String state; private final int step;
        private Memento(String s, int st){ state=s; step=st; }
    }
}
Deque<Workflow.Memento> history = new ArrayDeque<>();
history.push(workflow.save());      // before a risky step
// ... if it fails: workflow.restore(history.pop());
```

**Real-world:** editor undo, database savepoints conceptually, transactional rollback.

---

## 21. Observer

**Intent.** Define a **one-to-many** dependency so that when one object changes state, all its dependents are notified automatically (publish/subscribe).

**Problem it solves.** Multiple parts must react to an event (order placed → email, analytics, inventory) without the publisher knowing the subscribers.

**Corporate example — domain events on order placement.**

```java
interface OrderListener { void onOrderPlaced(Order o); }

class OrderService {
    private final List<OrderListener> listeners = new CopyOnWriteArrayList<>();
    public void subscribe(OrderListener l){ listeners.add(l); }
    public void place(Order o) {
        // ... persist ...
        listeners.forEach(l -> l.onOrderPlaced(o));   // fan-out, publisher stays decoupled
    }
}
// Subscribers: EmailListener, AnalyticsListener, InventoryListener
```

**Real-world:** Spring `@EventListener`/`ApplicationEvent`, `PropertyChangeListener`, reactive streams, Kafka consumers (distributed observer). Use `CopyOnWriteArrayList` to avoid `ConcurrentModificationException` during notification.

---

## 22. State

**Intent.** Allow an object to **alter its behaviour when its internal state changes** — it appears to change its class. Replaces sprawling state `if/switch` with polymorphic state objects.

**Problem it solves.** Entities with a lifecycle (order, ticket, subscription) where allowed actions depend on the current state, and transitions must be explicit.

**Corporate example — order lifecycle.**

```java
interface OrderState { OrderState pay(OrderContext c); OrderState ship(OrderContext c); }

class Created implements OrderState {
    public OrderState pay(OrderContext c){ /* charge */ return new Paid(); }
    public OrderState ship(OrderContext c){ throw new IllegalStateException("pay first"); }
}
class Paid implements OrderState {
    public OrderState pay(OrderContext c){ throw new IllegalStateException("already paid"); }
    public OrderState ship(OrderContext c){ return new Shipped(); }
}
class Shipped implements OrderState { /* terminal-ish */ 
    public OrderState pay(OrderContext c){ throw new IllegalStateException(); }
    public OrderState ship(OrderContext c){ throw new IllegalStateException(); }
}
class OrderContext { private OrderState state = new Created();
    public void pay(){ state = state.pay(this); } public void ship(){ state = state.ship(this); } }
```

**State vs Strategy:** identical structure, different intent — Strategy is chosen by the *client*; State transitions are driven *internally* by the object itself.

---

## 23. Strategy

**Intent.** Define a family of interchangeable algorithms, encapsulate each, and make them swappable at runtime.

**Problem it solves.** A single behaviour has multiple implementations selected by context (pricing rules, routing, retry policy) and you want to avoid `if/else` and enable Open/Closed.

**Corporate example — shipping-cost / discount strategy per customer tier.**

```java
interface DiscountStrategy { Money apply(Money subtotal); }
class NoDiscount     implements DiscountStrategy { public Money apply(Money s){ return s; } }
class PercentOff     implements DiscountStrategy { private final int pct; PercentOff(int p){pct=p;}
    public Money apply(Money s){ return s.minusPercent(pct); } }
class LoyaltyTiered  implements DiscountStrategy { /* tier-based rules */ public Money apply(Money s){ return s; } }

class Checkout {
    private DiscountStrategy strategy = new NoDiscount();
    public void setStrategy(DiscountStrategy s){ this.strategy = s; }   // swap at runtime
    public Money total(Money subtotal){ return strategy.apply(subtotal); }
}
```

**Real-world:** `Comparator` passed to `sort`, `RejectedExecutionHandler` in thread pools, Spring's pluggable `PasswordEncoder`. In modern Java, a Strategy is often just a **lambda** — `DiscountStrategy s = sub -> sub.minusPercent(10);`.

---

## 24. Template Method

**Intent.** Define the **skeleton of an algorithm** in a base method, deferring specific steps to subclasses — subclasses change steps, not the structure.

**Problem it solves.** Several flows share the same ordered steps but differ in a few; you want to avoid duplicating the invariant skeleton (and keep the order fixed).

**Corporate example — an ETL / file-import pipeline.**

```java
abstract class ImportJob {
    public final void run() {            // template method — fixed skeleton, final
        var raw = extract();
        var clean = transform(raw);
        load(clean);
        afterLoad();                     // hook with default no-op
    }
    protected abstract List<Row> extract();
    protected abstract List<Row> transform(List<Row> rows);
    protected abstract void load(List<Row> rows);
    protected void afterLoad() { }        // optional hook
}
class CsvBillingImport extends ImportJob {
    protected List<Row> extract(){ /* read CSV */ return List.of(); }
    protected List<Row> transform(List<Row> r){ /* normalize */ return r; }
    protected void load(List<Row> r){ /* upsert */ }
}
```

**Template Method (inheritance, compile-time) vs Strategy (composition, runtime):** Template fixes the structure and varies steps via subclassing; Strategy varies the *whole* algorithm via injection.

**Real-world:** Spring's `JdbcTemplate`/`RestTemplate` (you supply the callback steps), `AbstractList`, servlet `HttpServlet.service()`.

---

## 25. Visitor

**Intent.** Represent an **operation to be performed on elements of an object structure**, letting you add new operations without changing the element classes (double dispatch).

**Problem it solves.** A stable set of element types but many *operations* that would otherwise pollute each element class (taxes, validation, export, pricing on different product types).

**Corporate example — tax / pricing computation over heterogeneous billing items.**

```java
interface BillItem { <R> R accept(BillVisitor<R> v); }
class Product implements BillItem { double price; public <R> R accept(BillVisitor<R> v){ return v.visit(this);} }
class Subscription implements BillItem { double monthly; public <R> R accept(BillVisitor<R> v){ return v.visit(this);} }

interface BillVisitor<R> { R visit(Product p); R visit(Subscription s); }

class TaxVisitor implements BillVisitor<Double> {
    public Double visit(Product p){ return p.price * 0.18; }        // GST
    public Double visit(Subscription s){ return s.monthly * 0.18; }
}
// Add an ExportVisitor later without touching Product/Subscription.
```

**Trade-off:** great when operations change often but element types are stable; painful when you frequently *add element types* (every visitor must change).

---

## 26. Interpreter

**Intent.** Given a language, define a representation for its grammar and an interpreter to evaluate sentences in it.

**Problem it solves.** You have a small, recurring DSL — eligibility rules, query filters, pricing expressions — that business users tweak. Modelling the grammar as objects keeps evaluation clean.

**Corporate example — a rules engine for promotion eligibility (`age > 18 AND tier == GOLD`).**

```java
interface Expr { boolean eval(Map<String,Object> ctx); }
class And implements Expr { Expr l, r; And(Expr l, Expr r){this.l=l;this.r=r;}
    public boolean eval(Map<String,Object> c){ return l.eval(c) && r.eval(c); } }
class GreaterThan implements Expr { String key; int val; GreaterThan(String k,int v){key=k;val=v;}
    public boolean eval(Map<String,Object> c){ return ((int)c.get(key)) > val; } }
class Equals implements Expr { String key; Object val; Equals(String k,Object v){key=k;val=v;}
    public boolean eval(Map<String,Object> c){ return val.equals(c.get(key)); } }

Expr rule = new And(new GreaterThan("age",18), new Equals("tier","GOLD"));
boolean eligible = rule.eval(Map.of("age", 25, "tier", "GOLD"));
```

**Reality check:** for anything non-trivial, prefer a real parser/expression library (e.g., SpEL, ANTLR) — Interpreter is mostly asked to test grammar-as-objects thinking.

---

## 27. Enterprise & Spring Patterns

Patterns you actually use daily in Spring backends:

- **Dependency Injection / IoC** — the container creates and wires beans; your classes depend on abstractions (`@Autowired`/constructor injection). This is Dependency Inversion at framework scale.
- **Repository / DAO** — `JpaRepository<T,ID>` abstracts persistence; the rest of the app depends on the interface.
- **DTO + Mapper** — decouple API/transport shape from domain entities (MapStruct); never expose JPA entities directly.
- **Proxy/AOP** — `@Transactional`, `@Cacheable`, `@Retryable`, `@Async` are dynamic proxies wrapping your beans (this is why self-invocation bypasses them).
- **Template Method** — `JdbcTemplate`, `RestTemplate`/`RestClient`, `KafkaTemplate`.
- **Factory** — `BeanFactory`/`ApplicationContext`, `@Bean` methods, `FactoryBean`.
- **Singleton** — default bean scope (one instance per container).
- **Observer** — `ApplicationEventPublisher` + `@EventListener` for in-process domain events.
- **Strategy** — inject a `List<SomeStrategy>` and pick by type; great for pluggable algorithms.
- **Builder** — `UriComponentsBuilder`, `MockMvcRequestBuilders`, Lombok `@Builder`.

> Interview gold: explain *why* `@Transactional` doesn't work on a private method or self-invocation — because it's a **proxy** (Proxy pattern), and the proxy is only consulted on external calls.

---

## 28. Anti-Patterns to Avoid

- **God Object / God Service** — one class that does everything; violates SRP, untestable.
- **Singleton abuse** — global mutable state masquerading as design; hides dependencies, breaks tests.
- **Anemic Domain Model** — entities are just getters/setters with all logic in services (sometimes acceptable, but know the trade-off vs rich domain).
- **Pattern overuse / "patternitis"** — adding Strategy/Factory/Abstract Factory where a simple method or `if` would do; accidental complexity.
- **Service Locator (as DI replacement)** — hides dependencies vs constructor injection which makes them explicit.
- **Premature abstraction** — building flexibility for variations that never come (YAGNI).

> The senior signal: knowing when **not** to use a pattern is as valuable as knowing the pattern.

---

## 29. Interview Q&A

**Q1. Strategy vs State — they look identical, what's the difference?**
Same structure (polymorphic object holding behaviour). Difference is *intent and who drives change*: with **Strategy** the client picks the algorithm and it usually doesn't change itself; with **State** the object transitions between states internally based on events, and states often know the next state. Strategy answers "how do I do X"; State answers "what can I do given where I am".

**Q2. Factory Method vs Abstract Factory?**
Factory Method creates **one product** and typically relies on inheritance/overriding a creator method. Abstract Factory creates a **family of related products** and relies on composition — you pass around a factory object that produces a consistent set.

**Q3. Decorator vs Proxy — both wrap an object.**
**Decorator** adds *behaviour/responsibilities* (and you can stack many). **Proxy** controls *access/lifecycle* (lazy load, security, remote, caching) and usually mirrors the subject one-to-one. Intent differs even though structure is similar.

**Q4. How is Spring `@Transactional` related to a pattern, and why can self-invocation break it?**
It's the **Proxy** pattern (JDK dynamic proxy or CGLIB). The transactional logic lives in the proxy that wraps your bean. When method A calls method B on `this`, the call bypasses the proxy, so B's `@Transactional` is ignored. Fix: call via the injected bean, or restructure.

**Q5. Why prefer composition over inheritance, and which patterns embody it?**
Inheritance is tight, compile-time coupling and a single axis of extension; composition lets behaviour be combined and swapped at runtime. Strategy, Decorator, Bridge, and State all favour composition; Template Method is the notable inheritance-based one.

**Q6. When would you NOT introduce a pattern?**
When there's a single implementation and no real axis of change — a pattern then adds indirection without payoff (YAGNI). Introduce it when a second real variation appears or a SOLID principle is being violated by an incoming change.

**Q7. Give a real Decorator you've used from the JDK.**
`new BufferedInputStream(new GZIPInputStream(new FileInputStream(file)))` — each wrapper adds a capability (buffering, decompression) over the same `InputStream` contract.

**Q8. How do lambdas change classic patterns in modern Java?**
Many single-method patterns collapse to lambdas: Strategy (`Comparator`, `Function`), Command (`Runnable`), Observer (functional listeners), Template Method callbacks (`JdbcTemplate`). The pattern *intent* remains, but the boilerplate (a class per strategy) disappears.

**Q9. How would you implement undo in an editor — which pattern(s)?**
**Command** (each edit is a command with `execute`/`undo`) plus optionally **Memento** (snapshot state to restore). Command stacks give fine-grained redo; Memento is better for coarse checkpoints.

**Q10. Which pattern fixes a subclass explosion across two dimensions?**
**Bridge** — separate the abstraction hierarchy from the implementation hierarchy so you get M+N classes instead of M×N.
