# Real Interview Questions — Company-wise Q&A
### Actual questions from real technical rounds, with full answers

---

## TABLE OF CONTENTS
1. [How to use this guide](#1-how-to-use-this-guide)
2. [Product Company — Java Backend, Round 1](#2-product-company--java-backend-round-1)
3. [AI SaaS Company — Java Backend, Round 2](#3-ai-saas-company--java-backend-round-2)
4. [Java and Spring Topic-wise Q&A](#4-java-and-spring-topic-wise-qa)
5. [More companies coming soon](#5-more-companies-coming-soon)

---

## 1. How to use this guide

This page is your **real interview bank** — not generic theory, but questions that were actually asked in technical rounds, with answers you can revise before your next interview.

**How it's organized:**
- Each **company + round** gets its own section below.
- Questions are grouped by topic (OOP, Java 8, coding, etc.).
- Answers are written for **spoken interview style** — short opening line, then depth if they probe.

**Tip:** Read the **Fast answer** first (30 seconds), then the details if the interviewer asks "tell me more" or "give an example."

---

## 2. Product Company — Java Backend, Round 1

**Role:** Software Engineer — Java  
**Experience:** ~3 years  
**Round:** First technical (coding + core Java + OOP)  
**Location:** Pune  

---

### Q1. Inheritance vs Composition

**Fast answer**

Inheritance and composition are two ways to build relationships between classes.

**Rule of thumb:** Prefer **composition over inheritance** unless there is a clear **"is-a"** relationship.

| | Inheritance | Composition |
|---|---|---|
| Models | **is-a** (Dog is an Animal) | **has-a** (Car has an Engine) |
| Mechanism | Child inherits from parent | Object contains other objects |
| Coupling | Tight — parent changes affect children | Looser — swap parts easily |
| Flexibility | Fixed hierarchy | Change behavior at runtime |
| Risk | Deep trees, fragile base class | Slightly more boilerplate |

**Inheritance — when it fits**

Use when the subclass truly **is a** specialized version of the parent and the hierarchy is stable.

```java
class Animal {
    void eat() { System.out.println("Eating"); }
}
class Dog extends Animal {
    void bark() { System.out.println("Barking"); }
}
// Dog IS an Animal — eat() inherited
```

**Pros:** simple reuse, natural polymorphism.  
**Cons:** tight coupling; parent changes can break children; deep trees are hard to maintain.

**Composition — when it fits**

Use when one object **has** another and you want to swap or combine behavior.

```java
class Engine {
    void start() { System.out.println("Engine started"); }
}
class Car {
    private Engine engine = new Engine();
    void start() { engine.start(); }   // Car HAS an Engine — not IS an Engine
}
```

**Pros:** flexible, easy to test, follows Single Responsibility, swap implementations.  
**Cons:** a bit more code (delegation).

**Real-world example — Strategy with composition**

```java
interface PaymentStrategy {
    void pay(int amount);
}
class CreditCardPayment implements PaymentStrategy {
    public void pay(int amount) { System.out.println("Paid using card"); }
}
class PayPalPayment implements PaymentStrategy {
    public void pay(int amount) { System.out.println("Paid using PayPal"); }
}
class ShoppingCart {
    private PaymentStrategy payment;
    ShoppingCart(PaymentStrategy payment) { this.payment = payment; }
    void checkout(int amount) { payment.pay(amount); }
}
// Change payment method without changing ShoppingCart
```

**Game design example (why composition scales)**

Inheritance explosion:
```
Character → Warrior, Mage, Archer
Then: FlyingWarrior, InvisibleMage, SwimmingArcher ... (combinatorial explosion)
```

Composition:
```
Character + Weapon + FlyAbility + SwimAbility + InvisibleAbility
// Mix and match without new subclasses for every combo
```

**30-second interview close**

*"Inheritance models is-a; composition models has-a. I default to composition for flexibility and loose coupling, and use inheritance only when the relationship is stable and truly is-a."*

---

### Q2. Coding — Invert Manager → Employee map (Streams)

**Problem**

Given `Map<String, Set<String>>` where key = manager ID and value = set of employee IDs, produce `Map<String, Set<String>>` where key = employee ID and value = set of manager IDs.

**Example**

Input:
```java
{ M1 -> [E1, E2], M2 -> [E2, E3] }
```

Output:
```java
{ E1 -> [M1], E2 -> [M1, M2], E3 -> [M2] }
```

**Correct solution**

```java
public static Map<String, Set<String>> invert(Map<String, Set<String>> managerToEmployees) {
    if (managerToEmployees == null) {
        return Collections.emptyMap();
    }
    return managerToEmployees.entrySet().stream()
        .filter(e -> e.getValue() != null)
        .flatMap(entry -> entry.getValue().stream()
            .map(emp -> Map.entry(emp, entry.getKey())))   // employee, MANAGER (key!)
        .collect(Collectors.groupingBy(
            Map.Entry::getKey,
            Collectors.mapping(Map.Entry::getValue, Collectors.toSet())
        ));
}
```

**Why the common mistake happens**

```java
// WRONG — pairs employee with the whole reportee SET, not the manager
.map(emp -> Map.entry(emp, entry.getValue()))

// WRONG return type
Map<String, Set<Set<String>>>
```

**Correct mental model**

- `entry.getKey()` → manager ID (`M1`)
- `entry.getValue()` → `Set` of employees (`E1`, `E2`)
- For each employee, pair: `(employee, manager)` → `Map.entry(emp, entry.getKey())`

**Full solution (as written in the interview)**

```java
public static Map<String, Set<String>> invert(Map<String, Set<String>> map) {
    if (map == null) {
        return Collections.emptyMap();
    }
    return map.entrySet().stream()
        .filter(entry -> entry.getValue() != null)
        .flatMap(entry -> entry.getValue().stream()
            .map(employee -> Map.entry(employee, entry.getKey())))
        .collect(Collectors.groupingBy(
            Map.Entry::getKey,
            Collectors.mapping(Map.Entry::getValue, Collectors.toSet())
        ));
}
```

**Sample input from the round**

```java
Map<String, Set<String>> map = new HashMap<>();
map.put("M1", Set.of("A1", "A2"));
map.put("M2", Set.of("A1", "B1", "B2"));
map.put("M3", Set.of("B2"));
// Output: {A1=[M1,M2], A2=[M1], B1=[M2], B2=[M2,M3]}
```

**flatMap() — step-by-step walkthrough**

Input: `{ M1 -> [E1, E2], M2 -> [E2, E3] }`

**Iteration 1** — `flatMap` receives `(M1, [E1, E2])`:
1. `entry.getValue().stream()` → `E1`, `E2`
2. `.map(emp -> Map.entry(emp, entry.getKey()))` → `(E1, M1)`, `(E2, M1)`

**Iteration 2** — `flatMap` receives `(M2, [E2, E3])`:
1. Stream → `E2`, `E3`
2. Map → `(E2, M2)`, `(E3, M2)`

**After flattening**, the stream contains:
```
(E1, M1), (E2, M1), (E2, M2), (E3, M2)
```

**After `groupingBy` + `mapping` + `toSet()`**:
```java
{ E1 -> [M1], E2 -> [M1, M2], E3 -> [M2] }
```

**Hierarchy example (manager is also an employee)**

Input:
```java
{ M1 -> [E1, E2], M2 -> [E2, E3], M3 -> [M1, M2] }
```

After `flatMap` (before grouping):
```
(E1, M1), (E2, M1), (E2, M2), (E3, M2), (M1, M3), (M2, M3)
```

Final output:
```java
{
    E1 -> [M1],
    E2 -> [M1, M2],
    E3 -> [M2],
    M1 -> [M3],
    M2 -> [M3]
}
```

**30-second explanation (say this in the interview)**

*"Inside flatMap, `getValue()` is the set of employees and `getKey()` is the manager. For each employee I create `(employee, manager)` pairs, then groupingBy collects all managers per employee into a Set."*

---

### Q3. What test cases would you write for the invert problem?

**Fast answer**

Cover happy path, multiple managers per employee, empty/null inputs, and hierarchy edge cases.

| # | Scenario | Input | Expected output |
|---|----------|-------|-----------------|
| 1 | Normal | `M1→[E1,E2], M2→[E3]` | `E1→[M1], E2→[M1], E3→[M2]` |
| 2 | **Multiple managers** ⭐ | `M1→[E1,E2], M2→[E2,E3]` | `E2→[M1,M2]` |
| 3 | Empty map | `{}` | `{}` |
| 4 | Null input | `null` | `{}` or throw (document contract) |
| 5 | Manager, no reportees | `M1→[]` | `{}` |
| 6 | Single pair | `M1→[E1]` | `E1→[M1]` |
| 7 | **Manager is also employee** ⭐ | `CEO→[M1], M1→[E1,E2]` | `M1→[CEO], E1→[M1], E2→[M1]` |
| 8 | Duplicates in set | `M1→[E1,E1,E2]` | Same as `[E1,E2]` (Set dedupes) |
| 9 | Null reportee set | `M1→null` | NPE without filter — handle with `filter` or `Optional` |

**Interview one-liner**

*"I test normal input, employee with multiple managers, empty and null maps, empty reportee lists, manager-as-employee hierarchies, and null values in the map — plus duplicate employees which Set handles automatically."*

---

### Q4. Important edge cases (beyond basic tests)

**Must mention in interview:**

1. **Empty input** `{}` → `{}`
2. **Null input** → return empty map or `IllegalArgumentException` (state your choice)
3. **Manager with no reportees** `M1→[]` → no employees in output
4. **Employee with multiple managers** — validates `Set` + `groupingBy` + `mapping`
5. **Manager is also an employee** — common in org charts (`CEO→M1`, `M1→E1`)
6. **Null reportee set** — `entry.getValue().stream()` throws NPE without a null check
7. **Circular hierarchy** `M1→[M2], M2→[M1]` — fine for *this* invert problem (no recursion); matters if you later traverse the tree
8. **Duplicate keys in input** — impossible in a `Map` (keys unique)

**Spoken answer**

*"For this inversion I considered empty and null inputs, managers with no reportees, employees reporting to multiple managers, managers who are also employees, null reportee sets, and circular reporting. Cycles don't break inversion, but they'd matter if we walked the hierarchy recursively."*

---

### Q5. When to use an Abstract Class?

**Fast answer**

Use an **abstract class** when subclasses share common code and you want to **force** certain methods to be implemented — but you never want anyone to instantiate the base type directly.

**Use an abstract class when:**

| Situation | Why abstract class |
|-----------|-------------------|
| Common implementation for multiple subclasses | Put shared logic in the base; subclasses inherit it |
| Force subclasses to implement specific methods | Declare `abstract` methods — compiler enforces override |
| Base object should never be created directly | `abstract` class cannot be instantiated with `new` |

```java
abstract class Shape {
    String color;

    Shape(String color) { this.color = color; }

    // Common implementation — shared by all subclasses
    void printColor() {
        System.out.println("Color: " + color);
    }

    // Force every subclass to define area
    abstract double area();
}

class Circle extends Shape {
    double radius;
    Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }
    @Override
    double area() { return Math.PI * radius * radius; }
}

// Shape s = new Shape("red");  // ❌ compile error — cannot instantiate abstract class
```

**Abstract class vs Interface (quick contrast)**

| | Abstract class | Interface |
|---|---|---|
| State (fields) | Can have instance fields | Only constants (until Java 8+ default methods) |
| Constructor | Yes | No |
| Multiple inheritance | No (single extends) | Yes (implements many) |
| When to pick | Shared code + forced overrides | Pure contract / capability |

**30-second interview close**

*"I use an abstract class when several subclasses share real implementation and I need to force certain methods while preventing direct instantiation of the base type."*

---

### Q6. HashMap vs ConcurrentHashMap

**Fast answer**

Both store **key-value pairs**. `HashMap` is for single-threaded use; `ConcurrentHashMap` is thread-safe for concurrent read/write.

| | HashMap | ConcurrentHashMap |
|---|---|---|
| Thread-safe | ❌ No | ✅ Yes |
| Null key | ✅ One null key allowed | ❌ Not allowed |
| Null values | ✅ Multiple null values | ❌ Not allowed |
| Performance | O(1) average for get/put/remove | O(1) average; scales under concurrency |
| Use when | Single-threaded apps | Multi-threaded / concurrent apps |

**Internal working — HashMap**

1. Stores entries in an **array of buckets**.
2. Uses `hashCode()` to pick the bucket index.
3. Uses `equals()` to resolve key equality inside a bucket.
4. From **Java 8**: long collision chains convert to a **Red-Black Tree** (when bucket size > 8) for better worst-case performance.

**Internal working — ConcurrentHashMap**

1. Also uses buckets and hashing.
2. Uses **fine-grained synchronization** — locks at bucket/segment level, not the whole map.
3. Uses **CAS (Compare-And-Swap)** atomic operations so different threads can work on **different buckets** concurrently.
4. Much better than wrapping a `HashMap` in `synchronized` or `Collections.synchronizedMap()`.

**Why CHM disallows null keys/values**

In concurrent code, `null` is ambiguous — does it mean "key not present" or "value is null"? That ambiguity causes bugs under races, so CHM rejects nulls outright.

**30-second interview close**

*"HashMap is fast but not thread-safe and allows one null key. ConcurrentHashMap is for multi-threaded apps — fine-grained locking and CAS per bucket, no null keys or values, and much better throughput than synchronizing the entire map."*

---

### Q7. Checked vs Unchecked Exceptions

**Fast answer**

| | Checked (Compile-time) | Unchecked (Runtime) |
|---|---|---|
| Checked by compiler | ✅ Yes — must handle or declare | ❌ No — optional to handle |
| When thrown | Compile-time enforcement; thrown at runtime if triggered | Only at runtime |
| Extends | `Exception` (not `RuntimeException`) | `RuntimeException` |
| Handle with | `try-catch` or `throws` | Optional `try-catch` |

**Checked exception examples**

```java
IOException
SQLException
ClassNotFoundException
FileNotFoundException
```

**Unchecked (runtime) exception examples**

```java
NullPointerException
ArithmeticException
ArrayIndexOutOfBoundsException
NumberFormatException
IllegalArgumentException
```

**Compile-time error vs runtime exception — don't confuse them**

A **compile-time error** happens when `javac` cannot produce a `.class` file — the JVM never runs.

```java
// ❌ Compile-time error — variable not declared
public class Demo {
    public static void main(String[] args) {
        System.out.println(a);   // cannot find symbol: a
    }
}
```

```java
// ❌ Compile-time error — checked exception not handled
import java.io.FileReader;

public class Demo {
    public static void main(String[] args) {
        FileReader file = new FileReader("test.txt");
        // unreported exception FileNotFoundException;
        // must be caught or declared to be thrown
    }
}
```

Since compilation fails → `Demo.class` is **not** created → JVM **never starts**.

**Correct — declare with throws**

```java
public static void main(String[] args) throws Exception {
    FileReader file = new FileReader("test.txt");
}
```

**Correct — handle with try-catch (compiles; exception may still throw at runtime)**

```java
try {
    FileReader file = new FileReader("test.txt");
} catch (FileNotFoundException e) {
    System.out.println("File not found");
}
```

- Code **compiles** because the checked exception is handled.
- At **runtime**: if `test.txt` exists → no exception; if missing → `FileNotFoundException` thrown and caught.

**The FileNotFoundException trap (interview favorite)**

| What you write | When error appears |
|----------------|-------------------|
| `new FileReader("x.txt")` with no try/catch or throws | **Compile-time** error |
| try-catch around `new FileReader("x.txt")` | Compiles fine; exception thrown at **runtime** only if file missing |

**Easy way to remember**

- **Compile time:** Java checks whether you've **handled the possibility** of a checked exception.
- **Runtime:** Java **actually tries** to open the file — if it's not there, it throws `FileNotFoundException`.

**30-second interview close**

*"Checked exceptions like FileNotFoundException must be handled or declared at compile time. Unchecked exceptions like NullPointerException are not enforced by the compiler. A compile-time error means javac failed — the program never runs. Runtime exceptions happen while the JVM is executing."*

---

### Q8. What is a compile-time error? (Full interview answer)

**Fast answer**

A compile-time error occurs **during compilation** when the Java compiler (`javac`) detects invalid code. The `.class` file is never created, so the program **never runs**.

**Common causes**

| Cause | Example |
|-------|---------|
| Syntax errors | Missing `;`, unmatched `{ }` |
| Undeclared variables | `System.out.println(a);` when `a` doesn't exist |
| Type mismatch | `int num = "10";` — String assigned to int |
| Unhandled checked exception | `new FileReader("x.txt")` without try-catch or throws |
| Wrong method signature | Calling method with wrong argument types |

**Type mismatch example**

```java
int num = "10";   // ❌ incompatible types: String cannot be converted to int
```

**Spoken interview answer**

*"A compile-time error happens when javac analyzes the source and finds something invalid — syntax mistakes, undeclared variables, type mismatches, or unhandled checked exceptions. For example, `int num = \"10\"` fails at compile time because String and int are incompatible. Since compilation fails, no .class file is produced and the JVM never executes the program."*

**Checked exception — what the compiler actually does**

When the compiler sees `new FileReader("test.txt")`:

1. It knows `FileReader` constructor can throw `FileNotFoundException` (checked).
2. It checks whether `main()` catches it or declares `throws`.
3. If neither → **stops compilation** with `unreported exception FileNotFoundException`.
4. No `.class` file → JVM never starts → program never executes.

This is why interviewers ask: *"Is FileNotFoundException compile-time or runtime?"* — **both are involved, in different ways**:

- **Compile time:** compiler forces you to handle the *possibility*.
- **Runtime:** JVM throws it only if the file actually doesn't exist (after you've handled the compile-time requirement).

---

## 3. AI SaaS Company — Java Backend, Round 2

**Role:** Software Engineer — Java Backend  
**Experience:** ~3 years  
**Round:** Second technical (Kafka + Spring + SOLID + live coding)  
**Domain:** AI-powered recruiting / HR SaaS  

---

### Q1. What is consumer lag in Kafka? How do you fix it?

**Fast answer**

Consumer lag means the producer is sending messages **faster** than the consumer can process them, so the **backlog keeps growing**.

**What to check first**

| Check | Why |
|-------|-----|
| Consumer lag metrics | How far behind each partition is |
| Consumer health | Are consumers alive and in the group? |
| Processing time per message | Slow handler = growing lag |
| Partition assignment | All partitions have active consumers? |

**How to fix**

1. **Optimize consumer processing** — faster code, batch DB writes, async I/O
2. **Increase consumers** — up to **one consumer per partition** (max parallelism = partition count)
3. **Scale horizontally** — more consumer instances in the same group
4. **Increase partitions** (if needed) — only when you need more parallelism than current partition count allows

**Example (say this in the interview)**

*"If the producer sends 1000 msgs/sec and the consumer processes 700 msgs/sec, lag grows by 300 msgs/sec. We need faster processing or more consumers — but never more consumers than partitions."*

**30-second close**

*"Lag is backlog. I check metrics and consumer health, optimize the handler, then scale consumers up to the partition count."*

---

### Q2. A Kafka message fails during processing — what do you do with offsets?

**Fast answer**

Do **not** commit the offset for a failed message until it is handled successfully (depending on your ack strategy). Retry with backoff; if still failing, send to a **Dead Letter Queue (DLQ)**.

**Step-by-step**

1. **Don't commit offset** for the failed message until success (manual ack / at-least-once)
2. **Retry** a few times with exponential backoff (transient errors: DB timeout, network blip)
3. **Non-recoverable error** → publish to **DLQ** topic for later analysis
4. **Commit offsets** only for successfully processed messages — avoids silent data loss

**Example**

Out of 10 messages, if the 10th fails:
- Retry message 10 (e.g., 3 times with backoff)
- If still failing → move to DLQ, log + alert
- Don't block the entire consumer group indefinitely on one poison pill

**Ack strategies (if they probe)**

| Strategy | Behavior |
|----------|----------|
| At-least-once | Commit after success; retries possible; no commit on failure |
| At-most-once | Commit before process; fast but can lose messages |
| Exactly-once | Kafka transactions + idempotent producer (heavier setup) |

**30-second close**

*"I don't ack failed messages. Retry with backoff for transient failures. Poison messages go to DLQ so the consumer group keeps moving without data loss."*

---

### Q3. Which design patterns do you use in Spring Boot?

**Fast answer**

Singleton, Factory, Strategy, Observer, Builder, and Dependency Injection — Spring uses several of these by default.

| Pattern | Where in Spring Boot |
|---------|---------------------|
| **Singleton** | Spring beans (default scope) |
| **Factory** | `BeanFactory`, `@Bean` methods, `ObjectProvider` |
| **Strategy** | Switch implementations at runtime (payment type, pricing rule) |
| **Observer** | Application events, `@EventListener`, Kafka consumers |
| **Builder** | Complex DTOs / config objects (`@Builder`, Lombok) |
| **Dependency Injection** | `@Autowired` / constructor injection — loose coupling |

**Example**

Different payment methods (UPI, Card, Wallet):

```java
interface PaymentStrategy {
    void pay(BigDecimal amount);
}

@Service
class UpiPayment implements PaymentStrategy { ... }

@Service
class CardPayment implements PaymentStrategy { ... }

@Service
class PaymentService {
    private final Map<String, PaymentStrategy> strategies;

    PaymentService(List<PaymentStrategy> list) {
        this.strategies = list.stream()
            .collect(Collectors.toMap(s -> s.getClass().getSimpleName(), s -> s));
    }

    void checkout(String type, BigDecimal amount) {
        strategies.get(type).pay(amount);  // Strategy — pick at runtime
    }
}
```

**30-second close**

*"Spring beans are Singletons. I use Strategy for swappable business logic, Observer for events/Kafka, Factory via `@Bean`, and DI everywhere for loose coupling."*

---

### Q4. What is the O in SOLID? (Open/Closed Principle)

**Fast answer**

**O** = **Open/Closed Principle (OCP)** — classes/modules should be **open for extension, closed for modification**.

| | Meaning |
|---|---|
| ✅ Open for extension | Add new behavior via new classes/interfaces |
| ❌ Closed for modification | Don't edit existing, tested code for every new requirement |

**Vehicle example (interview favorite)**

If `Vehicle` is implemented by `Bike` and `Car`, and you add `start()` directly to `Vehicle`:
- You must change `Vehicle`, `Bike`, and `Car` → **modifying** existing code → **OCP violation**

**Better approaches**

- Separate `Startable` interface
- Composition: `Engine.start()` inside `Bike`
- Default method on interface (Java 8+) — partial mitigation

**30-second close**

*"OCP means extend via new code, don't keep editing old classes. Adding a method to a base interface forces all implementors to change — that's the violation."*

---

### Q5. Does Factory pattern violate OCP?

**Fast answer**

A **simple factory** with `if-else` / `switch` **does violate OCP** — every new type requires editing the factory.

**❌ Violates OCP**

```java
class VehicleFactory {
    Vehicle create(String type) {
        if ("bike".equals(type)) return new Bike();
        if ("car".equals(type)) return new Car();
        // new Truck → must EDIT this method
        throw new IllegalArgumentException();
    }
}
```

**✅ OCP-compliant options**

1. **Registration map** — `Map<String, Supplier<Vehicle>>`
2. **Separate factory per type** — `BikeFactory`, `CarFactory` (no central switch)
3. **Spring DI** — register new `@Service` implementations; inject `List<Vehicle>` or `Map<String, Vehicle>`

```java
class VehicleFactory {
    private final Map<String, Supplier<Vehicle>> registry = new HashMap<>();

    void register(String type, Supplier<Vehicle> supplier) {
        registry.put(type, supplier);
    }

    Vehicle create(String type) {
        Supplier<Vehicle> s = registry.get(type);
        if (s == null) throw new IllegalArgumentException("Unknown: " + type);
        return s.get();
    }
}

// New Truck — register only, no factory edit:
// factory.register("truck", Truck::new);
```

**30-second close**

*"Simple if-else factory violates OCP because adding Truck means editing the factory. Fix with a registry map, per-type factories, or let Spring inject implementations."*

---

### Q6. Coding — Top K users by total spend (PriorityQueue)

**Problem**

Given `List<Transaction(userId, amount, timestamp)>`, return the **top K user IDs** by **total spend**.

**Constraints from the round**

- ~50M transactions
- ~10k distinct users
- k = 2 (small K)

**Fast answer**

1. Aggregate total per `userId` in a `HashMap` — O(n)
2. Use a **min-heap of size k** to keep top K spenders — O(u log k), u = distinct users

```java
record Transaction(int userId, long amount, long timestamp) {}

public static List<Integer> topKSpenders(List<Transaction> transactions, int k) {
    if (transactions == null || transactions.isEmpty() || k <= 0) {
        return List.of();
    }

    Map<Integer, Long> totalSpent = new HashMap<>();
    for (Transaction t : transactions) {
        totalSpent.merge(t.userId(), t.amount(), Long::sum);
    }

    // Min-heap: smallest total at top → evict when size > k
    PriorityQueue<Map.Entry<Integer, Long>> minHeap = new PriorityQueue<>(
        Comparator.comparingLong(Map.Entry::getValue)
    );

    for (Map.Entry<Integer, Long> e : totalSpent.entrySet()) {
        minHeap.offer(e);
        if (minHeap.size() > k) minHeap.poll();
    }

    List<Integer> result = new ArrayList<>();
    while (!minHeap.isEmpty()) {
        result.add(minHeap.poll().getKey());
    }
    result.sort((u1, u2) -> Long.compare(totalSpent.get(u2), totalSpent.get(u1)));
    return result;
}
```

**Sample**

```java
// user 2: 10000+20000=30000, user 3: 30000, user 4: 40000, user 5: 50000
// topK(transactions, 2) → [5, 4]
```

**Common bugs (they may ask what went wrong)**

| Bug | Fix |
|-----|-----|
| Forgot `totalSpent.put(userId, currAmt)` after merge | Use `merge()` or explicit `put` |
| Sorting inside the transaction loop | Aggregate first, then heap/sort once |
| Rebuilding result on every iteration | Build result only after aggregation |

**Complexity**

| Step | Time |
|------|------|
| HashMap aggregate | O(n) — n = transactions |
| Min-heap top K | O(u log k) — u = distinct users |
| Space | O(u + k) |

**30-second close**

*"One pass to sum per userId in a HashMap. Min-heap of size k keeps the top spenders — O(u log k). For 10k users and k=2, that's trivial. Don't sort inside the transaction loop."*

---

## 4. Java and Spring Topic-wise Q&A

A quick-revision bank grouped by topic. Each answer is a **spoken-style opening line** you can expand if the interviewer probes.

---

### 4.1 Java Core

**Q. How is Java platform independent? (JVM vs JRE vs JDK)**

Java source compiles to **bytecode** (`.class`), not native machine code. The same bytecode runs on any OS that has a **JVM** — "write once, run anywhere." The JVM is platform-specific; the bytecode is not.

- **JVM** — runs bytecode (JIT-compiles hot paths to native code).
- **JRE** = JVM + core libraries → enough to *run* Java apps.
- **JDK** = JRE + compiler (`javac`) + tools → needed to *develop*.

**Q. What is a ClassLoader?**

A JVM subsystem that loads `.class` files into memory at runtime, lazily. It follows the **parent-delegation model** — a loader asks its parent first.

- **Bootstrap** → core `java.*` classes
- **Platform/Extension** → JDK extension libraries
- **Application/System** → your classpath

**Q. ClassNotFoundException vs NoClassDefFoundError**

- **`ClassNotFoundException`** — a *checked exception* thrown when a class is looked up **dynamically** (`Class.forName(...)`, `loadClass(...)`) but isn't on the classpath.
- **`NoClassDefFoundError`** — an *Error* thrown when a class **was present at compile time** but is missing or failed to initialize at **runtime** (e.g., its static initializer threw).

**Q. String Pool, intern(), == vs equals()**

Literals live in the **String pool** (deduplicated). `new String("x")` makes a separate heap object. `intern()` returns the pooled reference. `==` compares references; `equals()` compares content.

```java
String a = "hi", b = "hi";     // same pooled reference
String c = new String("hi");   // new heap object
a == b;             // true
a == c;             // false
a.equals(c);        // true
a == c.intern();    // true
```

---

### 4.2 OOP Concepts

**Q. What is Encapsulation?**

Bundling data and the methods that act on it in one class, and hiding internal state behind `private` fields with controlled getters/setters. It protects invariants and lets you change internals without breaking callers.

**Q. Serializable interface**

A **marker interface** (no methods) that lets an object be converted to a byte stream (serialization) and back. Use `serialVersionUID` for version control; mark fields `transient` to skip them.

**Q. Can a class be static, final, or private?**

- **Top-level class:** can be `final` (no subclassing) or `abstract`, but **not** `static` or `private`.
- **Nested class:** can be `static`, `private`, `final`, or `protected`.

**Q. OOP vs scripting languages**

Frame it as **compiled + statically typed + class-structured** (Java) vs **interpreted + dynamically typed + quick-to-write** (Python/JS). It isn't either/or — Python is also object-oriented; the real contrast is compiled/static vs interpreted/dynamic.

---

### 4.3 Exceptions

**Q. Superclass of all exceptions**

`Throwable`. It splits into `Exception` (recoverable) and `Error` (serious JVM problems).

**Q. Error vs Exception**

`Error` = JVM-level, not meant to be caught (`OutOfMemoryError`, `StackOverflowError`). `Exception` = application-level and recoverable.

**Q. Checked vs Unchecked**

Checked (extends `Exception`) → the compiler forces you to handle or declare it (`IOException`, `SQLException`). Unchecked (extends `RuntimeException`) → not enforced (`NullPointerException`, `IllegalArgumentException`).

**Q. Try-with-resources**

Auto-closes any resource implementing `AutoCloseable` at the end of the block — no explicit `finally`. Resources close in reverse order; the original exception is preserved and close-time errors become "suppressed."

```java
try (var br = new BufferedReader(new FileReader("f.txt"))) {
    return br.readLine();
}   // br.close() called automatically
```

**Q. Exception propagation**

An uncaught exception bubbles up the call stack, method by method, until a matching `catch` handles it — otherwise the thread terminates. Checked exceptions must be declared along the way.

---

### 4.4 Java Language Features

**Q. AutoBoxing**

Automatic conversion between a primitive and its wrapper (`int` ↔ `Integer`); unboxing is the reverse. Watch out: unboxing a `null` wrapper throws `NullPointerException`, and `Integer` caches −128..127 so `==` on wrappers is unreliable.

**Q. Key Java 8 features**

Lambdas, the Streams API, functional interfaces, `default`/`static` interface methods, `Optional`, method references, and the new `java.time` Date/Time API.

**Q. Lambda functions and why they're useful**

A lambda is an anonymous function that concisely implements a functional interface. It lets you pass behavior as data, reduce boilerplate, and write functional-style code (Streams).

```java
Runnable r = () -> System.out.println("run");
list.forEach(x -> System.out.println(x));
```

**Q. Why interfaces cannot have constructors**

Constructors initialize instance state during object creation. An interface can't be instantiated and holds no instance state, so a constructor would have nothing to initialize.

**Q. Performance: for-loop vs for-each**

On `ArrayList`, an indexed `for` can be marginally faster (no iterator object), but for-each is cleaner. On `LinkedList`, for-each (iterator) is O(n) while indexed `get(i)` is O(n²). Prefer for-each for readability unless you need the index.

---

### 4.5 Concurrency

**Q. Code using 5 threads printing in sequence**

Use a shared lock and a turn counter so each thread waits for its turn.

```java
class SeqPrinter {
    private int turn = 0;
    private final int threads = 5;

    synchronized void print(int id) throws InterruptedException {
        for (int n = id; n <= 20; n += threads) {
            while (turn % threads != id) wait();
            System.out.println("T" + id + " -> " + n);
            turn++;
            notifyAll();
        }
    }
}
// Start 5 threads, each calling print(0), print(1) ... print(4)
```

Alternatives: an array of `Semaphore`s, or a `ReentrantLock` with `Condition`s.

**Q. Volatile vs Atomic**

`volatile` guarantees **visibility** (reads/writes go to main memory, no thread-local caching) but not atomicity of compound operations like `i++`. `AtomicInteger` and friends provide **atomic** read-modify-write via CAS.

---

### 4.6 Design Patterns

**Q. Builder pattern (usage + example)**

Builds a complex or immutable object step by step — ideal when there are many optional parameters (avoids telescoping constructors).

```java
User u = User.builder().name("Ann").age(30).email("a@x.com").build();
```

**Q. Singleton implementation**

One instance app-wide. An `enum` is the simplest thread-safe way; otherwise use double-checked locking.

```java
enum Config { INSTANCE; }               // simplest, thread-safe

class S {                               // double-checked locking
    private static volatile S i;
    private S() {}
    static S get() {
        if (i == null) synchronized (S.class) { if (i == null) i = new S(); }
        return i;
    }
}
```

**Q. Factory pattern concept**

Creates objects through a common interface without exposing the concrete class or instantiation logic to the caller. It centralizes object creation.

**Q. Why design patterns are needed**

They're proven, reusable solutions to recurring problems, give a team a shared vocabulary, and improve maintainability and flexibility.

**Q. Patterns you know / how to invent one**

Common ones: Singleton, Factory, Builder, Strategy, Observer, Decorator, Adapter. To "invent" one: spot a recurring problem, abstract the varying part behind an interface, and document the structure so others can reuse it.

---

### 4.7 Spring & Spring Boot

**Q. What is Spring Boot and why it's popular**

An opinionated layer on Spring: **auto-configuration**, **starter** dependencies, an **embedded server**, no XML, and production features (Actuator). The result is production-ready apps, fast.

**Q. @Component vs @Bean vs @Qualifier vs @Value**

- `@Component` — class-level; auto-detected by component scanning.
- `@Bean` — method-level inside `@Configuration`; you construct the bean (great for third-party classes).
- `@Qualifier` — disambiguates when multiple beans of a type exist.
- `@Value` — injects a property or SpEL expression value.

**Q. @Controller vs @RestController**

`@Controller` returns view names (MVC). `@RestController` = `@Controller` + `@ResponseBody`, so methods return data (JSON) directly.

**Q. @Mock vs @InjectMocks**

`@Mock` creates a mock dependency; `@InjectMocks` creates the real object under test and injects the mocks into it.

**Q. OAuth basics and role-based access**

OAuth2 is delegated authorization using access **tokens** — the client never handles the user's credentials. In Spring Security you guard endpoints by authority/role, e.g. `@PreAuthorize("hasRole('ADMIN')")`.

**Q. Spring Data JPA main interfaces**

`Repository` → `CrudRepository` → `PagingAndSortingRepository` → `JpaRepository` (adds batch, flush, and JPA-specific methods).

**Q. Exception handling in controllers**

`@ExceptionHandler` methods, centralized with `@RestControllerAdvice` / `@ControllerAdvice`, returning a proper `ResponseEntity` and HTTP status.

**Q. Transaction propagation**

How a method joins or creates a transaction: `REQUIRED` (default — join or create), `REQUIRES_NEW` (suspend + new), `NESTED` (savepoint), plus `SUPPORTS`, `MANDATORY`, `NEVER`, `NOT_SUPPORTED`.

**Q. application.properties purpose**

Externalized configuration — server port, datasource, JPA, logging, custom properties — without recompiling; supports per-environment profiles.

**Q. How Spring/Hibernate generates SQL**

Hibernate (JPA) maps entities to tables; from JPQL, derived query methods, or the Criteria API it generates **dialect-specific SQL**, manages lazy loading, and uses dirty-checking to emit inserts/updates on flush.

**Q. MVC: Controller vs Service vs Repository**

Controller handles HTTP (validate, route, respond); Service holds business logic and transactions; Repository does data access.

**Q. Pagination and unique constraints**

Pagination via `Pageable`/`Page<T>` (`findAll(PageRequest.of(page, size, sort))`). Uniqueness via `@Column(unique = true)` or `@Table(uniqueConstraints = @UniqueConstraint(...))`.

---

### 4.8 Collections

**Q. How HashMap works internally**

An array of buckets; `hashCode()` (spread) picks the bucket index and `equals()` resolves collisions within a bucket. Collisions chain in a linked list; from Java 8 a long chain (> 8, table ≥ 64) converts to a **red-black tree**. It resizes when size > capacity × load factor (0.75).

**Q. HashMap vs Hashtable vs ConcurrentHashMap**

- **HashMap** — not synchronized; one null key, many null values.
- **Hashtable** — legacy, fully synchronized, no nulls.
- **ConcurrentHashMap** — thread-safe with fine-grained locking/CAS, no nulls, high throughput.

**Q. List vs Set vs Map (when to use which)**

List — ordered, allows duplicates, index access. Set — unique elements. Map — key → value lookups.

**Q. What is LinkedList**

A doubly-linked list implementing `List` and `Deque`. O(1) add/remove at the ends, O(n) random access. Good for queues/deques, poor for indexed access.

**Q. Comparable interface**

`compareTo()` defines a type's **natural ordering** (used by `Collections.sort`, `TreeMap`). `Comparator` defines external/custom orderings.

**Q. How hashCode is generated**

Derived from the significant fields (e.g., `Objects.hash(a, b)`). Contract: equal objects must return equal hashCodes. The default `Object.hashCode()` is identity-based.

**Q. Iterable interface**

The root of collection iteration; it provides `iterator()` and enables the enhanced for-each loop.

---

### 4.9 Streams API

**Q. What the Streams API is**

A functional, declarative way to process sequences of elements (filter/map/reduce) — lazy, storage-free, and it doesn't mutate the source.

**Q. Ways to create Streams**

`collection.stream()`, `Stream.of(...)`, `Arrays.stream(arr)`, `Stream.iterate/generate`, `IntStream.range(...)`, `Files.lines(path)`.

**Q. Streams vs Collections**

Collections **store** data; streams **process** it. Streams are lazy, traversable once, and produce a result without changing the source.

**Q. Intermediate vs terminal operations**

Intermediate ops (`filter`, `map`, `sorted`) are lazy and return a stream. Terminal ops (`collect`, `forEach`, `reduce`, `count`) trigger execution and produce a result or side effect.

**Q. map vs flatMap**

`map` transforms each element 1→1. `flatMap` turns each element into a stream and **flattens** them into one (1→many → single stream) — use it for nested collections.

**Q. collect(), findFirst(), findAny()**

`collect` accumulates into a collection or summary. `findFirst` returns the first element (deterministic, respects order). `findAny` returns any element (parallel-friendly).

**Q. Exception handling in Streams**

Lambdas can't throw checked exceptions directly — wrap the call in try/catch inside the lambda, or use a helper that rethrows as unchecked or returns `Optional`.

**Q. Converting a Stream to a Collection**

`stream.collect(Collectors.toList() / toSet() / toMap(keyFn, valFn))`.

**Q. Sequential vs parallel streams**

Sequential runs on one thread. `parallelStream()` splits work across the common ForkJoinPool. Use parallel for large, CPU-bound, stateless, independent work; avoid it for small data, ordered/IO-bound work, or shared mutable state.

---

### 4.10 Functional Programming

**Q. What is a functional interface**

An interface with exactly **one abstract method** (SAM), optionally annotated `@FunctionalInterface`. It's the target type for a lambda or method reference.

**Q. Can it have default and static methods**

Yes — `default` and `static` methods don't count as abstract, so the interface stays functional.

**Q. Common examples**

`Runnable` (run), `Callable` (call), `Comparator` (compare), plus `Function`, `Predicate`, `Supplier`, and `Consumer`.

---

## 5. More companies coming soon

New company rounds will be added here as you share them. Each gets its own `## Company — Role, Round N` section with full Q&A.

**Planned format per entry:**
- Company / role / round metadata
- Questions grouped by topic
- Fast answer + deep answer + code where needed
- Test cases / edge cases for coding problems

*Send your next interview questions and we'll add the next section.*
