# Real Interview Questions — Company-wise Q&A
### Actual questions from real technical rounds, with full answers

---

## TABLE OF CONTENTS
1. [How to use this guide](#1-how-to-use-this-guide)
2. [Product Company — Java Backend, Round 1](#2-product-company--java-backend-round-1)
3. [AI SaaS Company — Java Backend, Round 2](#3-ai-saas-company--java-backend-round-2)
4. [Java and Spring Topic-wise Q&A](#4-java-and-spring-topic-wise-qa)
5. [Backend Interview Questions from LinkedIn Posts](#5-backend-interview-questions-from-linkedin-posts)
6. [More companies coming soon](#6-more-companies-coming-soon)

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

## 5. Backend Interview Questions from LinkedIn Posts

Questions shared by candidates after Java backend rounds at service and product companies (3–10 years of experience). Questions that repeat across posts are merged into one. Questions that are **already answered elsewhere on this site** are listed under each topic with a pointer, so nothing is answered twice.

---

### 5.1 Core Java & Language Features

**Already answered elsewhere:** Why String is immutable, why override `equals()` and `hashCode()` together, garbage collection, Java 8 vs Java 17 features, what happens when HashMap reaches 75% capacity (load factor) → *Java Core to Advanced (Interview Q&A)*. How HashMap works internally, HashMap vs Hashtable → *§4.8 of this page*. HashMap vs ConcurrentHashMap → *§2 Q6 of this page*. Checked exceptions pros and cons, exception hierarchy → *§2 Q7 and §4.3 of this page*. `@ControllerAdvice` → *§4.7 of this page*. Java 8 features → *§4.4 of this page*.

**Q. What is the `var` keyword? Can it be used as a generic type?**

`var` (Java 10) lets the compiler infer the type of a **local variable** from the value on the right. The variable is still statically typed — the type is just not written.

```java
var list = new ArrayList<String>();   // type is ArrayList<String>
var count = 10;                       // int
```

Rules:
- Only for local variables, `for` loop variables, and lambda parameters (Java 11).
- Not allowed for fields, method parameters, or return types.
- Must be initialized (`var x;` does not compile) and cannot be `null` alone.
- **Not a generic type argument:** `List<var>` is invalid. `var` is not a type, it is an instruction to infer one.

Use it when the type is obvious from the right side; avoid it when it hides meaning (`var result = service.process();`).

**Q. What is an effectively final variable?**

A local variable that is **never reassigned** after it is initialized, even though it is not marked `final`. Lambdas and anonymous classes can only capture local variables that are final or effectively final.

```java
String prefix = "ID-";              // effectively final
list.forEach(x -> System.out.println(prefix + x));   // OK

String tag = "A";
tag = "B";                          // reassigned → not effectively final
list.forEach(x -> System.out.println(tag + x));      // compile error
```

Reason: the lambda gets a **copy** of the value. If the variable could change, the copy and the original would silently disagree.

**Q. What is a Record class? How do you map query results to Records and fetch the first record?**

A `record` (Java 16) is a compact, **immutable data carrier**. The compiler generates the constructor, getters (`name()`), `equals()`, `hashCode()`, and `toString()`.

```java
public record UserDto(Long id, String name, String email) {}
```

Records are a good fit for **DTOs and query projections** (not JPA entities — entities need a no-arg constructor and mutable fields).

Mapping query results to a Record:

```java
// Spring Data JPA — constructor expression in JPQL
@Query("SELECT new com.acme.dto.UserDto(u.id, u.name, u.email) FROM User u WHERE u.active = true")
List<UserDto> findActiveUsers();

// Spring Data derived query returning a record projection
List<UserDto> findByActiveTrue();

// JdbcTemplate
List<UserDto> users = jdbc.query(
    "SELECT id, name, email FROM users",
    (rs, i) -> new UserDto(rs.getLong("id"), rs.getString("name"), rs.getString("email")));
```

Fetching the first record:

```java
Optional<UserDto> first = repo.findFirstByOrderByIdAsc();   // derived query with LIMIT 1
UserDto top = users.stream().findFirst().orElseThrow();     // from a list already loaded
```

Prefer `findFirst...` / `LIMIT 1` in the query over loading a full list and taking element 0.

**Q. What is the Optional class?**

`Optional<T>` (Java 8) is a container that **may or may not hold a value**. It makes "no result" explicit in a method's return type, so callers are forced to handle the empty case instead of hitting a `NullPointerException`.

```java
Optional<User> user = repo.findById(id);

String name = user.map(User::getName).orElse("Unknown");
User u = user.orElseThrow(() -> new UserNotFoundException(id));
user.ifPresent(x -> log.info("Found {}", x.getId()));
```

Good practice:
- Use it as a **return type**, not for fields, method parameters, or collections.
- Prefer `orElseGet(supplier)` over `orElse(value)` when the default is expensive — `orElse` always evaluates its argument.
- Avoid `optional.get()` without a check; use `orElseThrow()` instead.

**Q. What is the difference between the `final` keyword and a final variable?**

`final` is the **keyword**; a final variable is just **one of its three uses**.

| Applied to | Meaning |
|------------|---------|
| Variable | Can be assigned only once. For objects, the **reference** is fixed, but the object can still change (`final List<String> l` can still `add`). |
| Method | Cannot be overridden by a subclass. |
| Class | Cannot be extended (e.g., `String`). |

A `static final` field is a constant. A `final` field must be set by the end of the constructor.

**Q. How do you create a custom exception?**

Extend `Exception` for a **checked** exception (caller must handle it) or `RuntimeException` for an **unchecked** one (most common in Spring apps). Provide constructors that pass the message and the cause.

```java
public class OrderNotFoundException extends RuntimeException {
    private final Long orderId;

    public OrderNotFoundException(Long orderId) {
        super("Order not found: " + orderId);
        this.orderId = orderId;
    }

    public OrderNotFoundException(String message, Throwable cause) {
        super(message, cause);        // keeps the original stack trace
        this.orderId = null;
    }

    public Long getOrderId() { return orderId; }
}
```

Tips: give it a clear domain name, always keep the `cause` when wrapping another exception, and map it to an HTTP status in a `@RestControllerAdvice` handler.

**Q. What is the output? `Integer a = 120, b = 120; a == b` and `Integer a = 140, b = 140; a == b`**

```java
Integer a = 120, b = 120;
System.out.println(a == b);   // true

Integer c = 140, d = 140;
System.out.println(c == d);   // false
```

Autoboxing calls `Integer.valueOf()`, which returns **cached** objects for values from **-128 to 127**. So `120` gives the same object both times and `==` (reference comparison) is `true`. `140` is outside the cache, so two different objects are created and `==` is `false`.

- With primitives (`int a = 140, b = 140`) the answer is `true`, because `==` compares values.
- Always use `equals()` to compare wrapper objects.
- The upper limit can be raised with `-XX:AutoBoxCacheMax`, but never rely on that.

**Q. What is the maximum value of a `double` in Java?**

`Double.MAX_VALUE` ≈ **1.7976931348623157 × 10^308**. A `double` is a 64-bit IEEE 754 floating-point number (1 sign bit, 11 exponent bits, 52 fraction bits).

- `Double.MIN_VALUE` ≈ 4.9 × 10^-324 — the **smallest positive** value, not the most negative one. The most negative is `-Double.MAX_VALUE`.
- Going past the max gives `Infinity`, not an exception.
- `double` is about 15–17 significant digits accurate, so never use it for money — use `BigDecimal`.

**Q. Can HashMap keys be mutable? Why or why not?**

Technically yes, but it is a **bug waiting to happen**. HashMap puts an entry into a bucket based on the key's `hashCode()` **at insertion time**. If you change a field that `hashCode()` uses, the key now hashes to a different bucket, so `get()` looks in the wrong place and returns `null` — the entry is effectively lost and still takes memory.

```java
Map<List<Integer>, String> map = new HashMap<>();
List<Integer> key = new ArrayList<>(List.of(1, 2));
map.put(key, "value");
key.add(3);                       // hashCode changes
map.get(key);                     // null — entry is "lost"
```

That is why good keys are **immutable**: `String`, `Integer`, records, or classes with `final` fields.

**Q. Why does Hashtable not allow null keys or values?**

`Hashtable` calls `key.hashCode()` directly, so a `null` key throws `NullPointerException`. For values, it was designed for **multi-threaded use**: if `get(key)` returns `null`, you cannot tell whether the key is missing or mapped to `null`, and checking with `containsKey()` first is not atomic — another thread can change the map in between. Banning `null` removes that ambiguity. `ConcurrentHashMap` follows the same rule for the same reason. `HashMap` (single-threaded) allows one `null` key and many `null` values.

---

### 5.2 Interfaces & OOP

**Already answered elsewhere:** Interface vs abstract class → *§2 Q5 of this page*. Factory pattern and OCP → *§3 Q4–Q5 of this page*. Why interfaces cannot have constructors → *§4.4 of this page*.

**Q. What types of methods can an interface have? Can it have private methods?**

| Method type | Since | Notes |
|-------------|-------|-------|
| `abstract` | Java 1 | The default kind; implementing classes must provide the body. |
| `default` | Java 8 | Has a body; implementing classes inherit it and may override it. |
| `static` | Java 8 | Belongs to the interface; call as `MyInterface.helper()`. Not inherited. |
| `private` | Java 9 | Has a body; used only inside the interface to share code between default methods. |
| `private static` | Java 9 | Shared helper for static methods. |

Yes, private methods are allowed (Java 9+). They exist so that two default methods can reuse common logic without exposing it as public API.

```java
interface Report {
    default String pdf()  { return render("PDF"); }
    default String html() { return render("HTML"); }
    private String render(String type) { return "Rendering " + type; }
}
```

Interfaces can also hold constants (`public static final` fields).

**Q. Two interfaces have the same default method and a class implements both. What happens and how do you fix it?**

The class **does not compile** — the compiler cannot pick one (the "diamond problem"). You must override the method in the class. Inside the override, you can call a specific parent with `InterfaceName.super.method()`.

```java
interface Camera { default String start() { return "Camera on"; } }
interface Phone  { default String start() { return "Phone on"; } }

class SmartPhone implements Camera, Phone {
    @Override
    public String start() {
        return Phone.super.start() + " + " + Camera.super.start();
    }
}
```

Resolution rules: a class method always wins over an interface default; a more specific interface (a sub-interface) wins over its parent; otherwise you must override explicitly.

**Q. Explain the SOLID principles.**

Five rules for code that is easy to change and test:

- **S — Single Responsibility:** a class should have one reason to change. `InvoiceService` calculates invoices; it does not also send emails.
- **O — Open/Closed:** open for extension, closed for modification. Add a new payment type by adding a new class, not by editing a big `if/else`.
- **L — Liskov Substitution:** a subclass must be usable anywhere its parent is expected without breaking behavior.
- **I — Interface Segregation:** many small, focused interfaces are better than one large one. A class should not be forced to implement methods it does not use.
- **D — Dependency Inversion:** depend on abstractions, not concrete classes. `OrderService` depends on a `PaymentGateway` interface; Spring injects the actual implementation.

In Spring projects, D is what DI gives you, and O is usually done with Strategy + a `Map<String, Handler>` of beans.

**Q. Explain the Liskov Substitution Principle. If a subclass can replace its parent, why do we need inheritance at all?**

LSP says: if code works with a `Parent`, it must keep working when given any `Child` — same contract, no surprises. A subclass may **add** behavior but must not **break** what the parent promised (no stricter inputs, no weaker outputs, no unexpected exceptions).

Classic violation: `Square extends Rectangle`. Setting width on a square also changes height, so code that sets width=5, height=10 and expects area 50 gets 100.

Why inheritance is still needed: LSP is not a reason to avoid inheritance — it is the **rule that makes inheritance safe**. Inheritance gives you:
- **Polymorphism:** one piece of code (`process(Payment p)`) works for `CardPayment`, `UpiPayment`, and future types.
- **Code reuse** of shared behavior in the parent.
- **A common type** for collections and APIs.

Substitutability is exactly what allows that polymorphic code to work. When a child cannot honor the parent's contract, use composition or a separate interface instead.

---

### 5.3 Concurrency & Multithreading

**Already answered elsewhere:** `synchronized` vs `volatile`, what `volatile` is, virtual threads, ThreadLocal → *Java Core to Advanced (Interview Q&A)*. `volatile` vs Atomic classes, atomic variables → *§4.5 of this page*. `synchronized` vs `ReentrantLock` → *Java Multithreading Deep Dive Q1*. Thread safety for parallel balance updates → *Java Core to Advanced (scenario Q&A)*. Debugging a deadlock → *JVM Performance Q10*.

**Q. What is a deadlock, and how can you prevent it?**

A deadlock is when two or more threads wait for each other forever. Thread A holds lock 1 and waits for lock 2; thread B holds lock 2 and waits for lock 1. Neither can continue.

```java
// Thread 1                      // Thread 2
synchronized (accountA) {        synchronized (accountB) {
    synchronized (accountB) {        synchronized (accountA) {   // deadlock
```

It needs four conditions together: mutual exclusion, hold-and-wait, no preemption, and circular wait. Remove any one and deadlock is impossible.

Prevention:
- **Fixed lock order:** always lock in the same order (e.g., lower account ID first). This breaks circular wait and is the most common fix.
- **Timeouts:** `ReentrantLock.tryLock(500, ms)` — give up and retry instead of waiting forever.
- **Hold fewer locks for less time:** do slow work (I/O, remote calls) outside the lock.
- **Use higher-level tools:** `ConcurrentHashMap`, atomic classes, or a single-threaded queue instead of manual nested locks.

Detection: a thread dump (`jstack <pid>`) prints "Found one Java-level deadlock" with the threads and locks involved.

**Q. ExecutorService vs CompletableFuture — and what are the key CompletableFuture methods?**

- **`ExecutorService`** manages a **pool of threads** and runs tasks. `submit()` returns a `Future`, but `Future.get()` **blocks**, and you cannot chain steps or combine results easily.
- **`CompletableFuture`** (Java 8) is a `Future` you can **compose without blocking**: chain steps, combine several async calls, and handle errors in a pipeline. It runs on an executor too (the common ForkJoinPool by default, or one you pass in).

They work together: `ExecutorService` provides the threads, `CompletableFuture` describes the workflow.

```java
ExecutorService pool = Executors.newFixedThreadPool(10);

CompletableFuture<User>  user   = CompletableFuture.supplyAsync(() -> userClient.get(id), pool);
CompletableFuture<Order> orders = CompletableFuture.supplyAsync(() -> orderClient.get(id), pool);

CompletableFuture<Profile> profile = user
    .thenCombine(orders, Profile::new)          // run both in parallel, merge results
    .orTimeout(2, TimeUnit.SECONDS)
    .exceptionally(ex -> Profile.empty());      // fallback on any error
```

Key methods:

| Method | Use |
|--------|-----|
| `supplyAsync` / `runAsync` | Start async work (with or without a result). |
| `thenApply` | Transform the result (like `map`). |
| `thenAccept` / `thenRun` | Consume the result / run an action after. |
| `thenCompose` | Chain another async call that returns a `CompletableFuture` (like `flatMap`). |
| `thenCombine` | Merge two independent futures. |
| `allOf` / `anyOf` | Wait for all / the first of many futures. |
| `exceptionally` / `handle` / `whenComplete` | Recover from errors, or handle result and error together. |
| `orTimeout` / `completeOnTimeout` | Fail or use a default after a time limit (Java 9). |
| `join` / `get` | Block for the result — use only at the edge. |

Always pass your own executor for I/O calls; the common pool is small and shared by the whole JVM.

**Q. How do you avoid performance issues caused by synchronization?**

Synchronization makes threads wait for each other, so the goal is **less locking, shorter locking, or no locking**:

- **Keep critical sections small:** lock only the lines that touch shared state, not the whole method. Never do DB or HTTP calls while holding a lock.
- **Use concurrent collections:** `ConcurrentHashMap`, `CopyOnWriteArrayList`, `ConcurrentLinkedQueue` instead of `Collections.synchronizedMap` or `Hashtable`.
- **Use atomic classes** (`AtomicInteger`, `LongAdder`) for counters — lock-free CAS. `LongAdder` is better under heavy contention.
- **Split locks:** separate locks for independent data instead of one global lock (lock striping).
- **Read-heavy data:** `ReadWriteLock` or `StampedLock` lets many readers proceed together.
- **Avoid shared state:** immutable objects, `ThreadLocal`, or confine data to one thread and pass messages through a queue.
- **Measure first:** a thread dump with many threads `BLOCKED` on the same monitor shows where contention is.

**Q. What is a BlockingQueue, and where is it used in real applications?**

A thread-safe queue whose operations **wait** when needed: `put()` blocks when the queue is full, and `take()` blocks when it is empty. It is the standard building block for the **producer–consumer** pattern — no manual `wait()`/`notify()` needed.

```java
BlockingQueue<Order> queue = new LinkedBlockingQueue<>(1000);   // bounded

// Producer
queue.put(order);              // waits if 1000 items are already queued

// Consumer
Order next = queue.take();     // waits until an item is available
process(next);
```

Main types: `ArrayBlockingQueue` (bounded, array), `LinkedBlockingQueue` (optionally bounded), `PriorityBlockingQueue` (ordered by priority), `DelayQueue` (items available after a delay), `SynchronousQueue` (hand-off, no storage).

Real uses:
- The **task queue inside `ThreadPoolExecutor`** — every executor uses one.
- Buffering incoming events (e.g., Kafka records) between a fast reader and slower worker threads.
- Batch writers: collect items and flush them to the DB in groups.
- **Backpressure:** a bounded queue slows down the producer instead of running out of memory.

---

### 5.4 Spring & Spring Boot Internals

**Already answered elsewhere:** How `@Transactional` works (proxies, propagation, isolation) → *Spring Boot guide §8*. How auto-configuration works and what `@EnableAutoConfiguration` does, `@Component` vs `@Service` vs `@Repository`, why `@Transactional` may not roll back, N+1 problem, JWT security, `@PathVariable` vs `@RequestParam`, Actuator, BeanFactory vs ApplicationContext → *Spring Boot guide §17*. Bean lifecycle → *Spring Boot guide §13*. What `@SpringBootApplication` combines (vs `@ComponentScan`), field vs constructor injection → *Annotations Deep Dive Q3, Q6*. `@Controller` vs `@RestController` → *§4.7 of this page*. Design patterns in Spring Boot → *§3 Q3 of this page*.

**Q. What is the difference between IoC and Dependency Injection? What are the types of DI?**

- **IoC (Inversion of Control)** is the **principle**: your code does not create or manage its dependencies — a container does. Control over object creation moves from your code to the framework.
- **DI (Dependency Injection)** is the **technique** used to achieve IoC: the container passes (injects) dependencies into an object instead of the object creating them with `new`.

IoC is the "what", DI is the "how". Other forms of IoC exist (e.g., template methods, event callbacks), but in Spring, IoC is done through DI.

Types of DI in Spring:

| Type | How | When |
|------|-----|------|
| **Constructor** | Dependencies are constructor parameters | Recommended. Required dependencies, `final` fields, easy to unit test. |
| **Setter** | `@Autowired` on a setter | Optional dependencies, or values that can change. |
| **Field** | `@Autowired` on a field | Shortest, but hides dependencies and needs reflection to test. Avoid. |

**Q. Constructor vs setter injection — what if you don't use `@Autowired`, and how do you inject through the constructor without it?**

**Constructor injection** sets dependencies when the object is created, so the object is never half-built, fields can be `final`, and a missing bean fails fast at startup. **Setter injection** sets them after creation, so they can be optional or changed later, but the object can exist in an incomplete state. Constructor injection also exposes circular dependencies early instead of hiding them.

What happens without `@Autowired`:
- **Single constructor:** Spring (4.3+) uses it automatically. `@Autowired` is not needed.
- **Multiple constructors:** Spring uses the no-arg one unless one constructor is marked `@Autowired`.
- **Field or setter without `@Autowired`:** nothing is injected — the field stays `null` and you get a `NullPointerException` at runtime.

Constructor injection without `@Autowired`:

```java
@Service
public class OrderService {
    private final PaymentClient paymentClient;
    private final OrderRepository repo;

    public OrderService(PaymentClient paymentClient, OrderRepository repo) {   // no @Autowired
        this.paymentClient = paymentClient;
        this.repo = repo;
    }
}

// Same thing with Lombok
@Service
@RequiredArgsConstructor
public class OrderService {
    private final PaymentClient paymentClient;
    private final OrderRepository repo;
}
```

**Q. What happens if two beans of the same type exist? What is `@Qualifier` and how is it different from `@Primary`?**

If Spring finds two beans of the same type and nothing tells it which one to inject, startup fails with `NoUniqueBeanDefinitionException` ("expected single matching bean but found 2"). One exception: if the field/parameter name matches a bean name, Spring uses that as a fallback.

Two ways to fix it:
- **`@Primary`** — set on the bean. It becomes the **default** whenever that type is injected.
- **`@Qualifier("name")`** — set on the injection point. It picks a **specific** bean by name for that one place.

```java
@Bean @Primary
PaymentGateway stripeGateway() { ... }

@Bean
PaymentGateway paypalGateway() { ... }

public CheckoutService(PaymentGateway gateway) { }                                    // gets stripe (primary)
public RefundService(@Qualifier("paypalGateway") PaymentGateway gateway) { }         // gets paypal
```

`@Qualifier` wins over `@Primary`. Use `@Primary` for "the usual one", `@Qualifier` for exceptions. To use all implementations, inject `List<PaymentGateway>` or `Map<String, PaymentGateway>`.

**Q. What is the startup flow of a Spring Boot application? How does the Spring container work internally?**

When `SpringApplication.run(App.class, args)` is called:

1. **Create `SpringApplication`:** detect the app type (servlet, reactive, or none) from the classpath, and load initializers and listeners from `META-INF/spring.factories`.
2. **Prepare the Environment:** read config from command-line args, environment variables, and `application.properties`/`.yml`; activate profiles.
3. **Print the banner** and **create the ApplicationContext** (for web apps, `AnnotationConfigServletWebServerApplicationContext`).
4. **Load bean definitions:** start from the main class, run `@ComponentScan`, read `@Configuration` and `@Bean` methods, and import auto-configurations (`AutoConfiguration.imports`). At this point Spring only has **recipes** (`BeanDefinition`s), not objects.
5. **Refresh the context** (the core of the container):
   - `BeanFactoryPostProcessor`s run and can change definitions (e.g., resolve `${...}` placeholders).
   - `BeanPostProcessor`s are registered.
   - The **embedded web server** (Tomcat) is created.
   - All **singleton beans are created**: instantiate → inject dependencies → `@PostConstruct` / `afterPropertiesSet` → `BeanPostProcessor`s wrap them in proxies where needed (`@Transactional`, `@Async`, AOP).
6. **Start the web server** and begin accepting requests.
7. **Run `CommandLineRunner` / `ApplicationRunner`** beans, then publish `ApplicationReadyEvent`.

In short, the container reads bean definitions, builds a dependency graph, creates and wires singletons in the right order, and decorates them with proxies. Problems like missing beans or circular dependencies fail here, at startup.

**Q. What is a Spring Profile? How does Spring Boot load profile-specific configuration?**

A profile is a **named set of configuration and beans** for one environment (dev, test, prod). You keep one codebase and switch behavior by activating a profile.

```properties
# application.properties        → always loaded (shared defaults)
# application-dev.properties    → loaded only when 'dev' is active
# application-prod.properties   → loaded only when 'prod' is active

spring.profiles.active=dev
```

Activate a profile with `--spring.profiles.active=prod`, the env variable `SPRING_PROFILES_ACTIVE=prod`, or in tests with `@ActiveProfiles("test")`. Profile-specific files **override** the shared file for matching keys.

Beans can be tied to profiles too:

```java
@Bean @Profile("dev")
DataSource h2DataSource() { ... }       // in-memory DB locally

@Bean @Profile("prod")
DataSource postgresDataSource() { ... }
```

Typical use: different DB URLs, log levels, mock vs real external clients, and feature flags per environment. Secrets for prod come from environment variables or a vault, never from a committed properties file.

**Q. What are Fetch Types? Explain Lazy vs Eager loading.**

The fetch type decides **when** JPA/Hibernate loads a related entity.

- **EAGER:** the related data is loaded **immediately** with the parent (join or extra query), whether you use it or not.
- **LAZY:** Hibernate returns a **proxy**; the real data is loaded only when you first access it.

| Relationship | Default |
|--------------|---------|
| `@ManyToOne`, `@OneToOne` | EAGER |
| `@OneToMany`, `@ManyToMany` | LAZY |

Best practice: make **everything LAZY** (`@ManyToOne(fetch = FetchType.LAZY)`) and load what each use case needs with `JOIN FETCH` or `@EntityGraph`. EAGER everywhere loads too much and causes hidden extra queries.

Common error: accessing a lazy field after the session is closed throws **`LazyInitializationException`**. Fix by fetching it inside the transaction (`JOIN FETCH`, `@EntityGraph`, or mapping to a DTO in the service layer) — not by turning on `open-in-view` or switching to EAGER.

**Q. What happens internally when you add `spring-boot-starter-web`? How does Spring Boot detect embedded Tomcat?**

A starter is just a **dependency bundle**. `spring-boot-starter-web` brings in Spring MVC, Jackson (JSON), validation, and **embedded Tomcat**.

Auto-configuration then reacts to what is now on the classpath, using conditions:

- `ServletWebServerFactoryAutoConfiguration` sees `Tomcat.class` (`@ConditionalOnClass`) and creates a `TomcatServletWebServerFactory`. If you swap in Jetty or Undertow, their classes are found instead.
- `DispatcherServletAutoConfiguration` registers the `DispatcherServlet` at `/`.
- `WebMvcAutoConfiguration` sets up message converters (Jackson), static resources, and error handling.
- `JacksonAutoConfiguration` creates the `ObjectMapper`.
- `ErrorMvcAutoConfiguration` adds the default `/error` endpoint.

During context refresh, Spring Boot uses the factory to start Tomcat **inside** the application on port 8080. So "detecting Tomcat" just means: the class is on the classpath, the condition matches, and the bean is created. Each auto-config backs off (`@ConditionalOnMissingBean`) if you define your own bean.

**Q. Why does Spring Boot prefer Convention over Configuration? How did it remove most XML configuration?**

**Convention over configuration** means the framework assumes sensible defaults, and you configure only what is different. If you add `spring-boot-starter-data-jpa` and an H2 driver, you get a working DataSource, EntityManager, and transaction manager without writing any setup. This cuts boilerplate, makes projects look alike, and lets teams start quickly.

How XML disappeared:
- **Java config** (`@Configuration` + `@Bean`, Spring 3) replaced bean XML files.
- **Component scanning** with stereotype annotations (`@Service`, `@Repository`) replaced listing every bean.
- **Auto-configuration** creates infrastructure beans (DataSource, MVC, Jackson) based on the classpath and properties.
- **Starters** replaced hand-picked dependency lists.
- **`application.properties`/`.yml`** replaced XML property files for tuning defaults.
- **Embedded servers** removed `web.xml` and WAR deployment descriptors.

XML is still supported (`@ImportResource`) for legacy code, but it is rarely needed.

**Q. How does Spring Boot load `application.properties`? What if both `.properties` and `.yml` exist? How is the server port priority decided?**

At startup, Spring Boot builds an `Environment` made of several **property sources**, ordered by priority. When the same key appears in many places, the **higher-priority source wins**. From highest to lowest (simplified):

1. Command-line arguments (`--server.port=9090`)
2. `SPRING_APPLICATION_JSON`
3. Java system properties (`-Dserver.port=9090`)
4. OS environment variables (`SERVER_PORT=9090`)
5. Profile-specific files: `application-{profile}.properties/.yml`
6. `application.properties` / `application.yml`
7. `@PropertySource` on configuration classes
8. Default values in code

Files are searched in this order, with later locations overriding earlier ones: classpath root → classpath `/config` → current directory → `./config/`. So an external file next to the JAR overrides the one packaged inside it — useful for changing config without rebuilding.

**Both `.properties` and `.yml` exist:** both are loaded and merged. For the **same key** in the same location, `.properties` wins over `.yml`. Keep only one format per project to avoid confusion.

**Server port** follows the same order: command-line arg > system property > `SERVER_PORT` env variable > profile file > `application.properties` > default **8080**. `server.port=0` picks a random free port (handy in tests).

Values are read with `@Value("${key}")` or, better, bound to a typed class with `@ConfigurationProperties`.

**Q. What is the role of `SpringFactoriesLoader`? `@EnableAutoConfiguration` vs `@Import`? What happens when you exclude an auto-configuration?**

**`SpringFactoriesLoader`** is Spring's internal plugin mechanism. It reads files from **every JAR on the classpath** and returns the classes listed there. Spring Boot uses it to discover listeners, initializers, and failure analyzers (`META-INF/spring.factories`). Auto-configuration classes were also listed there before Boot 2.7; since 3.0 they are listed in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`, loaded the same way. This is how adding a JAR can add behavior without any code change.

**`@Import` vs `@EnableAutoConfiguration`:**
- `@Import(MyConfig.class)` adds **specific** configuration classes that you name explicitly. It always applies.
- `@EnableAutoConfiguration` imports **all discovered** auto-configuration classes (through `AutoConfigurationImportSelector`), and each one applies only if its `@Conditional...` checks pass.

**Excluding an auto-configuration:**

```java
@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
```

or `spring.autoconfigure.exclude=...` in properties. Spring Boot removes that class before evaluating conditions, so none of its beans are created. Then **you** must provide those beans yourself, or anything that needs them fails at startup. Common uses: an app that has a JDBC driver on the classpath but should not connect to a DB, or replacing the default setup with a fully custom one. Run with `--debug` to see the conditions report of what was applied and why.

**Q. How does Spring Boot manage dependency versions automatically?**

Through a **BOM (Bill of Materials)**. Your project inherits from `spring-boot-starter-parent` (or imports `spring-boot-dependencies` in `<dependencyManagement>`). That BOM lists tested, compatible versions of hundreds of libraries — Jackson, Hibernate, Tomcat, Kafka clients, and more.

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.4</version>
</parent>

<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>   <!-- no version: comes from the BOM -->
</dependency>
```

Benefits: no version conflicts between libraries, and upgrading Spring Boot upgrades the whole stack together. To change one version, override its property (e.g., `<jackson-bom.version>`). Gradle does the same with the Spring dependency-management plugin.

**Q. What is the difference between a `@Configuration` class and a normal class?**

A `@Configuration` class is a source of bean definitions, and Spring wraps it in a **CGLIB proxy**. When one `@Bean` method calls another, the proxy returns the **existing singleton** from the container instead of creating a new object.

```java
@Configuration
public class AppConfig {
    @Bean public Clock clock() { return Clock.systemUTC(); }
    @Bean public OrderService orderService() { return new OrderService(clock()); }   // same Clock bean
}
```

In a normal class (or a `@Component` with `@Bean` methods — "lite mode"), `clock()` is a plain Java call and creates a **new** `Clock` each time, breaking the singleton. `@Configuration(proxyBeanMethods = false)` turns the proxy off for faster startup when beans do not call each other — Spring Boot's own auto-configs use this.

A normal class without annotations is not managed by Spring at all.

**Q. How does Spring Boot auto-create a DataSource?**

`DataSourceAutoConfiguration` runs when JDBC classes are on the classpath and you have **not** defined your own `DataSource` bean.

1. It reads `spring.datasource.url`, `username`, `password`, and `driver-class-name` (the driver is usually detected from the URL).
2. It picks a connection pool: **HikariCP** first (included with `spring-boot-starter-jdbc`/`data-jpa`), then Tomcat JDBC, then Commons DBCP2.
3. If no URL is set but an embedded DB (H2, HSQL, Derby) is on the classpath, it creates an **in-memory** database.
4. Related auto-configs then build on it: `JdbcTemplate`, `EntityManagerFactory` (JPA), the transaction manager, and Flyway/Liquibase migrations.

Pool settings are tuned with `spring.datasource.hikari.*` (e.g., `maximum-pool-size`). Defining your own `@Bean DataSource` makes all of this back off.

**Q. What is the real use of `CommandLineRunner`?**

A `CommandLineRunner` (or `ApplicationRunner`) bean runs **once, right after the context has started** and before the app is marked ready. It receives the program arguments.

```java
@Bean
CommandLineRunner warmUp(ProductCache cache) {
    return args -> cache.loadTopProducts();
}
```

Real uses:
- Warm up caches or load reference data at startup.
- Seed test/demo data in dev profiles.
- Validate critical config or check that an external system is reachable, failing fast if not.
- Run one-off jobs or CLI-style tools built with Spring Boot (run the task, then exit).

Use `@Order` when you have several. Keep them short — slow runners delay startup and readiness. `ApplicationRunner` is the same, but gives parsed arguments (`ApplicationArguments`).

**Q. How does Spring handle exception translation?**

Different databases and libraries throw different low-level exceptions (`SQLException` with vendor error codes, `HibernateException`, `PersistenceException`). Spring **translates** them into its own consistent, unchecked **`DataAccessException`** hierarchy:

- `DuplicateKeyException` / `DataIntegrityViolationException` — constraint violated
- `OptimisticLockingFailureException` — concurrent update conflict
- `EmptyResultDataAccessException` — expected one row, found none
- `CannotAcquireLockException`, `QueryTimeoutException`, and others

How: beans marked **`@Repository`** get wrapped by `PersistenceExceptionTranslationPostProcessor`, which converts exceptions as they leave the repository. `JdbcTemplate` translates `SQLException` using `SQLErrorCodeSQLExceptionTranslator`.

Benefit: your service layer catches `DuplicateKeyException` the same way on Oracle, PostgreSQL, or MySQL, and does not depend on JDBC or Hibernate types. For REST, a separate step maps exceptions to HTTP responses in `@RestControllerAdvice`.

**Q. What is the difference between a fat JAR and a normal JAR?**

- **Normal (thin) JAR:** contains only **your** compiled classes and resources. To run it you must provide all dependencies on the classpath yourself.
- **Fat (uber/executable) JAR:** contains your classes **plus every dependency JAR** and the embedded server, so `java -jar app.jar` runs the whole app.

The Spring Boot Maven/Gradle plugin builds the fat JAR with this layout:

```
BOOT-INF/classes/   → your code
BOOT-INF/lib/       → all dependency JARs (nested, not unpacked)
org/springframework/boot/loader/  → JarLauncher, which can load nested JARs
META-INF/MANIFEST.MF → Main-Class: JarLauncher, Start-Class: your main class
```

Trade-off: one self-contained artifact that is easy to deploy and ideal for containers, but it is larger. For Docker, Spring Boot can split it into **layers** (dependencies vs your code) so rebuilding an image only re-uploads the small layer that changed.

**Q. How does Spring Boot handle logging by default?**

- **SLF4J** is the logging API your code calls; **Logback** is the default implementation (from `spring-boot-starter-logging`, included in every starter).
- Logs go to the **console** at **INFO** level with a standard pattern (time, level, PID, thread, logger, message).
- Calls through Commons Logging, Log4j, and java.util.logging are redirected to SLF4J, so all libraries log in one place.

Configuration:

```properties
logging.level.root=INFO
logging.level.com.acme.orders=DEBUG
logging.file.name=logs/app.log            # enable file logging (rotates at 10 MB by default)
```

For more control use `logback-spring.xml` (supports `<springProfile>` blocks). Log levels can be changed at runtime through the Actuator `/actuator/loggers` endpoint. In containers, log JSON to stdout and let the platform collect it. Use `log.debug("User {}", id)` placeholders instead of string concatenation.

**Q. What happens internally when you hit a REST endpoint?**

For `GET /api/orders/42` in a Spring MVC app:

1. **Tomcat** accepts the TCP connection and assigns a worker thread from its pool.
2. The request passes through the **servlet filter chain** — Spring Security, CORS, logging, and tracing filters.
3. It reaches the **`DispatcherServlet`** (the front controller).
4. **`HandlerMapping`** finds the controller method that matches the URL and HTTP method (`@GetMapping("/api/orders/{id}")`).
5. **`HandlerInterceptor.preHandle`** runs (if any).
6. **`HandlerAdapter`** calls the method. **Argument resolvers** fill parameters: `@PathVariable`, `@RequestParam`, and `@RequestBody` (JSON → object via Jackson `HttpMessageConverter`), plus `@Valid` validation.
7. The controller calls the service (through `@Transactional` proxies, if any) and the repository.
8. The return value is converted to JSON by the **message converter**, with the right status code and headers.
9. If an exception is thrown, `@RestControllerAdvice` / `HandlerExceptionResolver` turns it into an error response.
10. Interceptor `postHandle`/`afterCompletion` run, filters finish, and the response is written back. The thread returns to the pool.

**Q. Why is Spring Boot a good fit for microservices and cloud-native apps?**

- **Self-contained:** a fat JAR with an embedded server runs anywhere with `java -jar` — ideal for one-service-per-container.
- **Fast to build:** starters and auto-configuration remove boilerplate, so teams can create many small services quickly.
- **Externalized config:** the same build runs in every environment, configured by env variables, profiles, or a config server (12-factor app).
- **Production features built in:** Actuator health checks (used by Kubernetes liveness/readiness probes), metrics through Micrometer to Prometheus, and distributed tracing.
- **Spring Cloud ecosystem:** service discovery, API gateway, circuit breakers (Resilience4j), config server, and messaging with Kafka.
- **Cloud-friendly runtime:** graceful shutdown, container-aware JVM settings, layered Docker images, Buildpacks, and GraalVM native images for fast startup and low memory.

**Q. What are the most common Spring Boot performance mistakes?**

- **N+1 queries** and **EAGER** fetching everywhere; loading full entities when a small DTO projection would do.
- **No pagination** — `findAll()` on a large table.
- **Wrong connection pool size**, or long transactions that hold connections (e.g., an HTTP call inside `@Transactional`).
- **Blocking calls with no timeouts** on RestTemplate/WebClient/Feign, so slow downstream services use up all threads.
- **Unbounded thread pools or queues** (`Executors.newFixedThreadPool` with an unbounded queue, `@Async` with default settings).
- **Not caching** repeated reads of rarely-changing data — or caching without TTL and eviction.
- **`spring.jpa.open-in-view=true`** (the default), which keeps DB connections open during view rendering and hides lazy-loading problems.
- **Too much logging** in hot paths, especially DEBUG level or string concatenation.
- **Missing database indexes** for the queries the app actually runs.
- **Large JSON payloads** and heavy serialization — return only the fields clients need.
- **Not measuring** — no Actuator metrics or profiling, so tuning is guesswork.

**Q. Explain Spring Security fundamentals. How do you implement it in a project and across microservices?**

**Fundamentals:** Spring Security is a chain of **servlet filters** that runs before your controller.
- The **`SecurityFilterChain`** decides which URLs need authentication and which roles can access them.
- **Authentication** (who are you?): a filter extracts credentials (form login, Basic, or a JWT), the `AuthenticationManager` validates them using a `UserDetailsService` and `PasswordEncoder` (BCrypt), and the result is stored in the **`SecurityContextHolder`** for the request.
- **Authorization** (what can you do?): URL rules (`.requestMatchers("/admin/**").hasRole("ADMIN")`) and method rules (`@PreAuthorize("hasRole('ADMIN')")`).
- Built-in protection against CSRF, session fixation, and clickjacking.

**In one service (typical REST API):**

```java
@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())                                       // stateless API
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/auth/**", "/actuator/health").permitAll()
            .requestMatchers("/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated())
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))        // validate JWT
        .build();
}
```

**Across microservices:**
- A central **identity provider / auth server** (Keycloak, Okta, Spring Authorization Server) issues signed JWTs after login.
- The **API gateway** validates the token on every incoming request and rejects bad ones early.
- Each service is also an **OAuth2 resource server**: it validates the JWT signature locally using the provider's public keys (JWKS endpoint) — no call to the auth server per request, and no trust based only on network position (zero trust).
- Roles and scopes inside the token drive `@PreAuthorize` checks in each service.
- **Service-to-service calls** forward the user's token, or use the OAuth2 **client-credentials** flow for calls made by the service itself. mTLS can secure the network layer.
- Keep tokens short-lived and use refresh tokens; rotate signing keys.

---

### 5.5 Hibernate / JPA

**Already answered elsewhere:** What Hibernate is, `get()` vs `load()`, caching, locking, dirty checking, entity states → *Spring Boot guide §13–14*.

**Q. How do you define relationships between tables in Hibernate, and what types are there?**

Relationships are defined with annotations on entity fields. The **foreign key** lives on one side, called the **owning side**. The other side uses `mappedBy` and is only a mirror.

| Type | Example | Annotation |
|------|---------|------------|
| One-to-One | User ↔ Profile | `@OneToOne` + `@JoinColumn` |
| One-to-Many | Order → many OrderItems | `@OneToMany(mappedBy = "order")` |
| Many-to-One | many OrderItems → one Order | `@ManyToOne` + `@JoinColumn(name = "order_id")` |
| Many-to-Many | Student ↔ Course | `@ManyToMany` + `@JoinTable` (link table) |

```java
@Entity
class Order {
    @Id @GeneratedValue Long id;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public void addItem(OrderItem item) {      // keep both sides in sync
        items.add(item);
        item.setOrder(this);
    }
}

@Entity
class OrderItem {
    @Id @GeneratedValue Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")             // owning side: holds the FK
    private Order order;
}
```

Relationships can be **unidirectional** (only one entity knows about the other) or **bidirectional** (both do). Key options: `cascade` (pass save/delete to children), `orphanRemoval` (delete children removed from the list), and `fetch` (prefer LAZY). For many-to-many with extra columns (e.g., enrollment date), model the link table as its own entity with two `@ManyToOne`s.

---

### 5.6 SQL & Databases

**Already answered elsewhere:** Optimizing a slow query, isolation levels (READ COMMITTED vs REPEATABLE READ), N+1, locking, HikariCP sizing → *SQL at Scale Q1–Q9*.

**Q. INNER JOIN vs LEFT JOIN vs RIGHT JOIN — and when do you use LEFT JOIN?**

- **INNER JOIN:** only rows that have a match in **both** tables.
- **LEFT JOIN:** **all** rows from the left table, plus matching rows from the right. No match → right-side columns are `NULL`.
- **RIGHT JOIN:** the mirror — all rows from the right table. Any RIGHT JOIN can be written as a LEFT JOIN by swapping the tables, so most teams use only LEFT JOIN for readability.
- **FULL OUTER JOIN:** all rows from both sides.

```sql
-- Only customers who have placed orders
SELECT c.name, o.id FROM customers c INNER JOIN orders o ON o.customer_id = c.id;

-- All customers, with their orders if any
SELECT c.name, o.id FROM customers c LEFT JOIN orders o ON o.customer_id = c.id;
```

Use **LEFT JOIN** when the left-side rows must appear even without a match: reports that include zero counts ("all products and their sales, including 0"), optional details (a user and their address, if any), and finding missing matches. Watch out: a `WHERE` condition on the right table (`WHERE o.status = 'PAID'`) removes the `NULL` rows and turns it into an inner join — put such filters in the `ON` clause instead.

**Q. What is the difference between UNION and UNION ALL?**

Both stack the results of two queries with the same number and types of columns.

- **UNION** removes duplicate rows. To do that the database must sort or hash the full result, which is slower.
- **UNION ALL** keeps every row, including duplicates. No extra work, so it is faster.

```sql
SELECT email FROM customers
UNION ALL
SELECT email FROM newsletter_subscribers;
```

Use **UNION ALL** by default, and **UNION** only when duplicates are actually possible and must be removed. Column names come from the first query; `ORDER BY` applies to the final combined result.

**Q. How do you find records in one table that have no matching record in another?**

This is an **anti-join**. Example: customers who never placed an order.

```sql
-- Option 1: NOT EXISTS (recommended)
SELECT c.* FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);

-- Option 2: LEFT JOIN + IS NULL
SELECT c.* FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;

-- Option 3: NOT IN (careful)
SELECT * FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders WHERE customer_id IS NOT NULL);
```

Prefer `NOT EXISTS` or `LEFT JOIN ... IS NULL`; both are efficient with an index on `orders.customer_id`. Avoid plain `NOT IN` when the subquery can return `NULL` — a single `NULL` makes the whole condition unknown, and the query returns **no rows**.

**Q. How do you handle NULL values and conditional mapping (like A → Apple, B → Banana) in SQL?**

`NULL` means "unknown", so `NULL = NULL` is not true. Use `IS NULL` / `IS NOT NULL` to test for it.

```sql
SELECT
    name,
    COALESCE(phone, 'N/A')              AS phone,       -- first non-null value
    NULLIF(discount, 0)                 AS discount,    -- turn 0 into NULL (avoids divide-by-zero)
    CASE code
        WHEN 'A' THEN 'Apple'
        WHEN 'B' THEN 'Banana'
        ELSE 'Unknown'
    END                                 AS fruit,
    CASE
        WHEN amount >= 1000 THEN 'HIGH'
        WHEN amount >= 100  THEN 'MEDIUM'
        ELSE 'LOW'
    END                                 AS tier
FROM orders;
```

- `COALESCE(a, b, c)` — returns the first non-null value (standard SQL). Oracle also has `NVL`, MySQL `IFNULL`.
- `CASE` — the standard way to map values or apply if/else logic. Oracle's `DECODE(code, 'A', 'Apple', 'B', 'Banana', 'Unknown')` does the same.
- Aggregates like `SUM` and `AVG` ignore `NULL`s; `COUNT(*)` counts all rows, but `COUNT(column)` skips `NULL`s.

If the mapping is long or changes often, store it in a lookup table and `JOIN` instead of hard-coding a big `CASE`.

**Q. How do you remove duplicates in SQL?**

To **show** unique rows:

```sql
SELECT DISTINCT email FROM users;
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;   -- find which are duplicated
```

To **delete** duplicates and keep one row per group, use a window function:

```sql
DELETE FROM users
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
        FROM users
    ) t
    WHERE rn > 1          -- keep rn = 1 (the oldest), delete the rest
);
```

Then add a **unique constraint** (`ALTER TABLE users ADD CONSTRAINT uq_email UNIQUE (email)`) so duplicates cannot come back. On large tables, delete in batches to avoid long locks.

**Q. How do indexes improve query performance? How do you find missing indexes?**

Without an index, the database reads **every row** (full table scan) to find matches. An index is a separate, sorted structure — usually a **B-tree** — that stores column values with pointers to the rows, so the database can jump to the matching rows in about O(log n) steps, like using a book's index instead of reading every page.

Indexes help `WHERE` filters, `JOIN` columns, `ORDER BY` (rows already sorted), and `GROUP BY`. A **covering index** that contains every column a query needs can answer it without touching the table at all.

The cost: every `INSERT`, `UPDATE`, and `DELETE` must also update each index, and indexes use disk and memory. So index the columns your important queries actually filter and join on — not everything.

Finding missing indexes:
- Run **`EXPLAIN` / `EXPLAIN ANALYZE`** on slow queries and look for full table scans (`TABLE ACCESS FULL`, `Seq Scan`) on large tables.
- Check the **slow query log** (MySQL), `pg_stat_statements` (PostgreSQL), or AWR/ASH reports (Oracle) for the most expensive queries.
- Look at **foreign key columns** — they are not indexed automatically in most databases, and unindexed FKs slow down joins and parent deletes.
- In a composite index, column order matters: `(customer_id, created_at)` helps `WHERE customer_id = ?` but not `WHERE created_at = ?` alone.
- Watch for things that stop an index from being used: functions on the column (`WHERE UPPER(email) = ...`), leading wildcards (`LIKE '%abc'`), and type mismatches.

**Q. Explain ACID properties.**

ACID describes what a database guarantees for a **transaction** (a group of operations treated as one unit). Example: transferring ₹500 from account A to account B.

- **Atomicity — all or nothing.** Both the debit and the credit happen, or neither does. If anything fails, the whole transaction is rolled back.
- **Consistency — rules always hold.** The transaction moves the DB from one valid state to another; constraints (no negative balance, valid foreign keys) are never left broken.
- **Isolation — transactions don't interfere.** Two transfers running at the same time behave as if they ran one after another. The isolation level (READ COMMITTED, REPEATABLE READ, SERIALIZABLE) controls how strict this is.
- **Durability — committed means saved.** Once committed, the transfer survives a crash or power loss, because it is written to the transaction log (redo/WAL) on disk.

In Spring, `@Transactional` gives you atomicity at the service level. Many NoSQL and distributed systems relax ACID (BASE / eventual consistency) to gain scale, which is why microservices use patterns like Saga for cross-service transactions.

---

### 5.7 Build, Testing & Delivery

**Already answered elsewhere:** `@Mock` vs `@InjectMocks` → *§4.7 of this page*. TestNG vs JUnit → *Spring Boot guide §13*. Rolling updates and liveness/readiness probes → *Kubernetes guide Q2–Q3*.

**Q. What is a Maven build, and what does `mvn clean install` do?**

Maven is a build tool that **compiles, tests, packages, and manages dependencies** based on the `pom.xml`. A build runs a **lifecycle** of phases in a fixed order; running one phase runs all the phases before it:

`validate → compile → test → package → verify → install → deploy`

`mvn clean install`:
1. **`clean`** — deletes the `target/` folder, so nothing old is left over.
2. **`compile`** — compiles `src/main/java`.
3. **`test`** — runs unit tests (Surefire). A failing test stops the build.
4. **`package`** — creates the JAR/WAR in `target/`.
5. **`verify`** — runs integration tests and checks (Failsafe, JaCoCo coverage rules, static analysis).
6. **`install`** — copies the artifact into your **local repository** (`~/.m2/repository`) so other local projects can use it.

`deploy` goes one step further and uploads the artifact to a shared remote repository (Nexus/Artifactory). Useful flags: `-DskipTests` (skip running tests), `-pl module-name` (build one module), `-U` (force-update snapshots), `-o` (offline).

**Q. How do you push code to production?**

A typical CI/CD flow:

1. **Branch and pull request:** work on a feature branch, open a PR, and get code review.
2. **CI checks on the PR:** build, unit and integration tests, coverage gate, static analysis (SonarQube), and dependency/security scans.
3. **Merge to main** once checks pass and the PR is approved.
4. **Build the artifact once:** a versioned JAR and Docker image, pushed to a registry. The same image moves through every environment.
5. **Deploy to dev/QA/staging** automatically and run smoke, regression, and performance tests.
6. **Release approval** (change ticket or manual gate, depending on the team).
7. **Production deploy** with a safe strategy — rolling, blue-green, or canary — and DB migrations run with Flyway/Liquibase (backward-compatible).
8. **Verify and monitor:** health checks, error rates, latency dashboards, and logs. **Roll back** quickly if metrics get worse.

Tools vary (Jenkins, GitHub Actions, GitLab CI, ArgoCD, Kubernetes, Helm), but the principles are the same: automate everything, build once, deploy the same artifact everywhere, and keep rollback cheap.

**Q. What is code coverage vs line coverage? How do you improve coverage when the build fails?**

**Code coverage** is the general measure of how much of your code runs during tests. **Line coverage** is one type of it — the percentage of lines executed. Others:
- **Branch coverage:** were both the `true` and `false` paths of every `if`/`switch` tested? This is stricter and more meaningful than line coverage.
- **Method / class coverage:** were they called at least once?

A line can be "covered" while a branch on it is never tested (`if (a && b)`), so teams usually set gates on both line and branch coverage. Tool in Java: **JaCoCo**, often with SonarQube.

When the build fails because coverage is below the threshold (e.g., 80%):
1. **Open the JaCoCo report** (`target/site/jacoco/index.html`) to see exactly which lines and branches are red in the code you changed.
2. **Write tests for real behavior**, focusing on business logic, error paths, edge cases (null, empty, boundaries), and the missed branches — use `@ParameterizedTest` to cover many inputs with one test.
3. **Mock external dependencies** with Mockito so service logic can be tested in isolation.
4. **Exclude code that should not count:** generated code, DTOs/records, config classes, and the main class — through JaCoCo `excludes`, with team agreement.
5. **Refactor hard-to-test code:** extract logic out of big methods and static calls into small, injectable units.

Don't write tests that only call methods without asserting anything just to raise the number — coverage shows what is **not** tested, not that tested code is correct.

**Q. How do you verify that a method was called twice in Mockito?**

Use `verify` with `times(2)`:

```java
@Test
void sendsTwoNotifications() {
    orderService.placeOrder(order);

    verify(notificationClient, times(2)).send(any(Notification.class));
}
```

Other verification modes:

```java
verify(repo).save(order);                       // exactly once (same as times(1))
verify(repo, never()).delete(any());            // never called
verify(client, atLeast(2)).call();
verify(client, atMost(3)).call();
verifyNoMoreInteractions(client);               // nothing else was called

// Check the order of calls
InOrder inOrder = inOrder(repo, publisher);
inOrder.verify(repo).save(order);
inOrder.verify(publisher).publish(any());

// Inspect the arguments that were passed
ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
verify(notificationClient, times(2)).send(captor.capture());
assertEquals("SMS", captor.getAllValues().get(0).getType());
```

**Q. In which situations do you use PowerMock?**

Standard Mockito (older versions) could not mock **static methods, constructors (`new`), final classes/methods, or private methods**. PowerMock filled that gap by changing the bytecode with a custom classloader. It was used mainly for:
- Legacy code calling static utilities (`DateUtil.now()`, `LegacyConfig.get()`).
- Code that creates its dependencies with `new` inside a method.
- Final classes from third-party libraries.

Today PowerMock is **mostly unnecessary and largely unmaintained** — it does not support JUnit 5 well and is slow. Modern alternatives:
- **Mockito 5** uses the inline mock maker by default and can mock final classes and methods.
- `Mockito.mockStatic(...)` and `Mockito.mockConstruction(...)` cover static methods and constructors.

```java
try (MockedStatic<LocalDate> mocked = mockStatic(LocalDate.class)) {
    mocked.when(LocalDate::now).thenReturn(LocalDate.of(2026, 1, 1));
    // code under test sees the fixed date
}
```

The best fix is design: inject a `Clock` or a wrapper interface instead of calling statics, and you need no special mocking. If you must mock a private method, that is usually a sign the class should be split.

**Q. What if a deployment breaks production? How do you roll back safely? What are blue-green and canary releases?**

**When a deployment breaks production:**
1. **Restore service first, investigate later.** If the error rate or latency jumped right after the release, roll back immediately — don't debug live while users are affected.
2. **Communicate:** raise an incident, inform stakeholders, and assign one person to lead.
3. **Turn off the feature** with a feature flag if it is isolated — often faster than redeploying.
4. **Root cause and prevention:** postmortem, then add the missing test, alert, or pipeline check.

**Safe rollback:**
- Keep the previous version's artifact/image ready, so rollback is a redeploy of a known-good version (`kubectl rollout undo`, or switch traffic back).
- **Database changes must be backward-compatible** (expand/contract pattern): add the new column first, deploy code that works with both old and new schema, and remove old columns in a later release. Then the old code still works after a rollback.
- Make Kafka message and API changes backward-compatible for the same reason.

**Blue-green deployment:** run two identical environments. **Blue** serves live traffic; deploy the new version to **green**, test it, then switch the load balancer to green in one step. Rollback = switch back to blue instantly. Cost: double the infrastructure during the release, and both versions must work with the same database.

**Canary release:** send a **small share of traffic** (say 5%) to the new version, watch it, then increase step by step (25% → 50% → 100%). To validate a canary, compare it with the stable version on:
- Error rate (5xx), p95/p99 latency, and saturation (CPU, memory, DB connections).
- Business metrics — orders placed, payments succeeding, sign-ups.
- New error types in the logs.

Define pass/fail thresholds before rollout and automate the decision (Argo Rollouts, Flagger, Spinnaker): promote if healthy, roll back automatically if not.

---

### 5.8 Production Debugging & Scenarios

**Already answered elsewhere:** Slow API in production, debugging with no exceptions in logs, connection pool exhaustion, distributed tracing, scaling checklist, duplicate API requests, duplicate Kafka messages → *Spring Boot guide §17*. High CPU, memory leaks, deadlocks, container OOMKilled → *JVM Performance Q3–Q10*. Thread dumps → *Java Multithreading Deep Dive Q6*. Slow DB queries → *SQL at Scale Q1*. Cascading failures, circuit breaker states, idempotent retries, when not to retry → *Resilience Patterns Q1–Q4*. Kafka consumer lag (including lag of millions) → *§3 Q1 of this page*. Observability, metrics, alerts, slow endpoints → *Observability guide Q1–Q9*. Cache stampede, stale cache, Redis caching, rate limiter → *Redis & Caching Q1–Q10*. URL shortener, rate limiter design → *System Design HLD §14*.

**Q. Memory keeps increasing and the app throws OutOfMemoryError. What are the causes and how do you debug and fix it?**

**Common causes:**
- **Memory leak:** objects stay referenced and are never collected — static `Map`s used as caches with no eviction, listeners never removed, `ThreadLocal` values not cleared in thread pools, unclosed streams or connections.
- **Loading too much at once:** `findAll()` on a huge table, reading a whole file or response into memory, very large JSON payloads.
- **Heap simply too small** for the real load, or a traffic spike creating many objects at once.
- **Other OOM types** — the message tells you which memory ran out:
  - `Java heap space` — the heap is full.
  - `GC overhead limit exceeded` — almost all CPU goes to GC but little memory is freed.
  - `Metaspace` — too many classes loaded (classloader leaks on redeploy, heavy dynamic proxies).
  - `unable to create native thread` — too many threads.
  - `Direct buffer memory` — off-heap buffers (Netty, NIO).

**Investigation steps:**
1. **Capture evidence first:** run with `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps` so a heap dump is written when it happens. Take one manually with `jcmd <pid> GC.heap_dump`.
2. **Check GC behavior:** GC logs or Grafana/JVM metrics. If heap usage **after each full GC keeps rising** (a sawtooth with a rising floor), it is a leak. If it drops back but peaks at the limit, the heap is too small or there are load spikes.
3. **Analyze the heap dump** in Eclipse MAT or VisualVM: open the **Leak Suspects** report and the **dominator tree** to see which objects hold the most memory, then follow the **path to GC roots** to find who keeps them alive (often a static field or cache).
4. **Correlate with changes:** did it start after a deployment, a traffic change, or a new data size?

**Fixes:** remove the leaking reference (bounded caches with TTL — Caffeine, clear `ThreadLocal` in `finally`, close resources with try-with-resources), stream or paginate large data, and only then tune `-Xmx` and the container memory limit. Raising the heap without fixing a leak only delays the crash.

**Q. What happens if a thread pool is exhausted?**

A `ThreadPoolExecutor` handles new tasks in this order: use a core thread if one is free → otherwise put the task in the **queue** → if the queue is full, create extra threads up to `maxPoolSize` → if that limit is also reached, apply the **rejection policy**:

| Policy | Behavior |
|--------|----------|
| `AbortPolicy` (default) | Throws `RejectedExecutionException`. |
| `CallerRunsPolicy` | The calling thread runs the task itself — slows the producer down (natural backpressure). |
| `DiscardPolicy` | Silently drops the task. |
| `DiscardOldestPolicy` | Drops the oldest queued task and retries. |

Symptoms in production: requests time out or hang, `RejectedExecutionException` in logs, latency climbing, and a thread dump showing all pool threads `WAITING` or `BLOCKED` on the same slow call (DB, downstream API, lock). For Tomcat, when all request threads are busy, new connections wait in the accept queue and then get refused.

The real cause is usually **slow tasks**, not too few threads. Fix:
- Add **timeouts** to every external call so threads are released.
- Use **bounded queues** and a deliberate rejection policy; an unbounded queue hides the problem until memory runs out.
- **Separate pools per dependency** (bulkhead), so one slow service cannot take every thread.
- Size the pool based on measurements; monitor active threads, queue size, and rejections through Micrometer.
- For lots of blocking I/O, consider virtual threads (Java 21).

**Q. A request that normally takes 200 ms now takes 20 seconds under load, and one slow microservice is slowing down the whole system. How do you approach it?**

A request that is fast alone but slow under load means it is **waiting for a shared resource** — threads, DB connections, locks, or a slow dependency.

**Find where the time goes:**
1. **Distributed tracing** (Zipkin/Jaeger/Tempo) on a slow request shows which span — DB query, downstream call, or the service itself — takes the 20 seconds.
2. **Saturation metrics** at the same moment: Tomcat busy threads, HikariCP active/pending connections, CPU, GC pause time, queue sizes.
3. **Thread dumps** taken a few seconds apart: if most threads are stuck at the same line (waiting for a connection, a lock, or a socket read), that is the bottleneck.
4. **DB side:** slow query log and `EXPLAIN` for queries that only become slow with more data or concurrency (missing index, lock contention).
5. **Load test** in a staging environment to reproduce it, and **profile** (async-profiler, JFR) instead of guessing.

**Why one slow service slows everything:** callers wait for it with no timeout, their threads fill up, and they become slow for *their* callers — the slowness spreads upstream until every service is stuck.

**Fixes:**
- **Timeouts** on every call (connect and read), shorter than the caller's own timeout.
- **Circuit breaker** (Resilience4j) to fail fast while the dependency is unhealthy, with a **fallback** response.
- **Bulkheads:** separate thread or connection pools per dependency.
- **Caching** for data that is read often and changes rarely.
- **Async / event-driven** processing for work that does not need an immediate answer.
- Fix the root cause: add indexes, fix N+1 queries, right-size pools, or scale the slow service.

**Q. How do you debug timeout issues? What if a third-party API fails — how do you design fallback and retry with backoff?**

**Debugging timeouts:**
- First identify **which** timeout fired: connect timeout (cannot reach the host — DNS, firewall, the service is down), read/socket timeout (connected but no response in time — the other side is slow), connection-pool timeout (waiting for a free connection in **your** app), or a gateway/load-balancer timeout (504).
- Check that timeouts are **layered correctly**: the client's timeout must be shorter than the gateway's, which must be shorter than the end user's. Otherwise work continues after the caller has given up.
- Use tracing to find the slow span, and the dependency's metrics or status page to see if it is degraded.
- Look for missing timeouts — many HTTP clients wait **forever** by default.

**When a third-party API fails:**
1. **Timeouts** so your threads are not held.
2. **Retry with exponential backoff and jitter** — only for temporary errors (timeouts, 503, 429) and only for idempotent requests:

```java
RetryConfig config = RetryConfig.custom()
    .maxAttempts(3)
    .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(200, 2.0))   // 200ms, 400ms, 800ms + jitter
    .retryExceptions(SocketTimeoutException.class, HttpServerErrorException.ServiceUnavailable.class)
    .ignoreExceptions(HttpClientErrorException.BadRequest.class)              // never retry 4xx
    .build();
```

   Backoff gives the failing service time to recover; jitter stops all clients from retrying at the same moment. Respect a `Retry-After` header if one is sent.
3. **Circuit breaker** around the call: after repeated failures, stop calling for a while and fail fast.
4. **Fallback** — decide per use case what to return when the call fails:
   - Cached or last-known-good data (exchange rates, product info).
   - A default or reduced response (hide recommendations, show "price unavailable").
   - Queue the request and process it later (send the email or SMS asynchronously, retried by a worker), and tell the user it is pending.
   - A secondary provider (a backup payment or SMS gateway).
5. **Idempotency keys** on payment-type calls, so a retry never charges twice.
6. **Monitor and alert** on the dependency's error rate and circuit state.

**Q. What design patterns are used in microservices?**

| Area | Patterns |
|------|----------|
| **Entry and communication** | **API Gateway** (single entry point: routing, auth, rate limiting), **Backend for Frontend** (a gateway per client type), **Service Discovery** (Eureka, Kubernetes DNS). |
| **Data** | **Database per service**, **Saga** (distributed transaction as local steps with compensations — orchestration or choreography), **CQRS** (separate write and read models), **Event Sourcing**, **Transactional Outbox** (save the DB change and the event together, then publish reliably). |
| **Resilience** | **Circuit Breaker**, **Retry with backoff**, **Timeout**, **Bulkhead**, **Rate Limiter**, **Fallback**. |
| **Integration** | **Event-driven / publish-subscribe** (Kafka), **Asynchronous messaging**, **Strangler Fig** (move from a monolith piece by piece), **Anti-Corruption Layer**. |
| **Configuration and deployment** | **Externalized config** (config server), **Sidecar** (service mesh proxies like Envoy), **Blue-green / canary** releases. |
| **Observability** | **Distributed tracing** (correlation IDs), **Log aggregation**, **Health check API**, **Metrics**. |

In an interview, pick 3–4 you have actually used and explain the problem each one solved — for example, the outbox pattern to avoid losing events when the DB commit succeeds but the Kafka publish fails.

**Q. How do you check the state of a circuit breaker?**

A circuit breaker has three states: **CLOSED** (normal, calls go through), **OPEN** (calls fail fast without reaching the dependency), and **HALF_OPEN** (a few trial calls test whether the dependency has recovered).

With **Resilience4j + Spring Boot Actuator**:

```properties
management.endpoints.web.exposure.include=health,circuitbreakers,circuitbreakerevents
management.health.circuitbreakers.enabled=true
resilience4j.circuitbreaker.instances.paymentService.register-health-indicator=true
```

- `GET /actuator/circuitbreakers` — the current state of every breaker, plus failure rate and buffered/failed call counts.
- `GET /actuator/circuitbreakerevents` — recent state changes and errors.
- `GET /actuator/health` — breakers appear as health components (an OPEN breaker can mark the service as degraded).

In code:

```java
CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker("paymentService");
CircuitBreaker.State state = cb.getState();                       // CLOSED / OPEN / HALF_OPEN
float failureRate = cb.getMetrics().getFailureRate();

cb.getEventPublisher().onStateTransition(e ->
    log.warn("Circuit {} changed: {}", e.getCircuitBreakerName(), e.getStateTransition()));
```

In production, the metric `resilience4j_circuitbreaker_state` is exported through Micrometer to Prometheus, shown on a Grafana dashboard, and an **alert fires when a breaker opens**. You can also force a state manually during incidents (`transitionToForcedOpenState()`).

**Q. What is p95 vs p99 latency?**

Percentiles describe what most users experience, which an average hides.

- **p95 = 300 ms** → 95% of requests finished in 300 ms or less; the slowest 5% took longer.
- **p99 = 1.2 s** → 99% finished in 1.2 s or less; the slowest 1% took longer.

Why not the average: if 99 requests take 100 ms and 1 takes 10 seconds, the average is about 200 ms — which looks fine, while one user waited 10 seconds. At scale, 1% is a lot of people (at 1M requests a day, p99 covers 10,000 slow requests), and a single page load often makes many calls, so most users eventually hit the slow tail.

- **p50 (median)** — the typical experience.
- **p95** — common target for SLOs.
- **p99 / p99.9** — the "tail"; shows GC pauses, lock contention, cold caches, and slow dependencies.

Percentiles cannot be averaged across servers — compute them from a combined **histogram** (Micrometer with `publishPercentileHistogram`, then `histogram_quantile` in Prometheus).

**Q. How do you debug GC pauses and fix memory fragmentation?**

**Debug GC pauses:**
1. **Turn on GC logging:** `-Xlog:gc*:file=gc.log:time,uptime` (Java 9+), and watch `jvm_gc_pause_seconds` in Grafana.
2. **Analyze** the log with GCeasy or GCViewer: pause times, how often each GC type runs, heap usage after GC, and allocation rate.
3. **Find the cause:**
   - Frequent young-gen GCs → the app creates too many short-lived objects (allocation pressure).
   - Long or frequent **full GCs** → the old generation fills up (a leak, or a heap too small).
   - **Humongous allocations** in G1 → very large arrays/objects (> half a region).
   - Long safepoint times, swapping, or CPU throttling in containers.
4. **Fix:** reduce allocations (reuse buffers, stream instead of loading everything, avoid unnecessary boxing), fix leaks, right-size the heap (`-Xms` = `-Xmx` in containers), set a pause target (`-XX:MaxGCPauseMillis=200` for G1), or move to **ZGC/Shenandoah** for sub-millisecond pauses on large heaps.

**Memory fragmentation:** free memory is split into many small gaps, so a large object cannot find one continuous block even though total free memory is enough. That can trigger a full GC or an OOM.
- Modern collectors (G1, ZGC, Parallel) **compact** the heap — they move live objects together — so heap fragmentation is mostly handled for you. It was a real problem with the old CMS collector, which did not compact.
- In G1, fragmentation shows up as **humongous objects** wasting region space. Fix by avoiding huge arrays or raising `-XX:G1HeapRegionSize`.
- **Native (off-heap) fragmentation** — process RSS keeps growing while the heap looks fine — is often caused by glibc malloc arenas. Limit with `MALLOC_ARENA_MAX=2` or use jemalloc, and check with Native Memory Tracking (`-XX:NativeMemoryTracking=summary`).

**Q. How do you handle traffic spikes and scale an application quickly? What is a good autoscaling strategy?**

**Make the app easy to scale first:** stateless services (sessions in Redis or JWT, not in memory), externalized config, fast startup, and graceful shutdown. Then you can scale **horizontally** by just adding instances.

**Handling a spike right now:**
- **Scale out** — increase replicas (`kubectl scale`) or the autoscaling group's minimum.
- **Protect the system:** rate limiting at the gateway, load shedding (return 429/503 early instead of slowing everyone down), and circuit breakers so overloaded dependencies fail fast.
- **Reduce load per request:** caching (Redis, CDN for static content), and moving non-urgent work to a queue (Kafka) to process asynchronously.
- **Check the real bottleneck** — often the database or a downstream service, not app CPU. Adding app instances can make it worse by opening more DB connections. Use read replicas, connection limits, or scale the DB.

**Autoscaling strategy:**
- **Horizontal Pod Autoscaler (HPA)** on CPU and memory as a baseline; better, on **load metrics** that track demand — requests per second, latency, or **Kafka consumer lag** for consumers (KEDA).
- Set sensible **min/max replicas**; keep enough minimum replicas to absorb a sudden burst while new pods start.
- **Scale up fast, scale down slowly** (stabilization windows) to avoid flapping.
- **Cluster autoscaler** adds nodes when pods cannot be scheduled.
- **Scheduled scaling** for known peaks (sales, month-end, business hours).
- Use **readiness probes** so new pods receive traffic only after warm-up.
- Load test regularly to know each instance's real capacity and which component breaks first.

**Q. How do you handle configuration issues in production?**

Symptoms: the app fails at startup, connects to the wrong DB or endpoint, a feature behaves differently than in staging, or a secret is missing or expired.

**Debugging:**
- Check the startup logs — Spring Boot's failure analyzer usually names the missing or invalid property.
- See which value actually won: Actuator `/actuator/env` and `/actuator/configprops` show every property and **which source it came from** (secure these endpoints and mask secrets).
- Compare environments: env variables, ConfigMaps/Secrets, active profiles (`spring.profiles.active`), and the config server version.
- Check precedence — an environment variable or command-line argument may be overriding the file you edited.

**Prevention:**
- Keep config **in version control** and deploy it through the pipeline (GitOps), with review — no manual edits on servers.
- **Validate at startup:** `@ConfigurationProperties` with `@Validated` (`@NotBlank`, `@Min`) so a bad value fails the deploy immediately, not hours later.
- **Secrets** in a vault or Kubernetes Secrets, never in the repository; plan for rotation.
- Use the **same artifact** in every environment and change only config.
- Change config gradually (canary) and keep the last good config for quick rollback. Use feature flags for behavior changes so they can be turned off without a deploy.

**Q. What if the cache is not working? How do you debug Redis issues?**

**Cache not working (Spring Cache):**
- Is `@EnableCaching` present? Without it, `@Cacheable` is silently ignored.
- **Self-invocation:** calling a `@Cacheable` method from the same class bypasses the proxy, so the cache is skipped (same issue as `@Transactional`). Call it from another bean.
- **Key problems:** wrong or unstable key (parameters without proper `equals()`/`hashCode()`, or a key that includes a timestamp), so every call misses.
- **Serialization errors**, or the cache name/TTL configured differently than expected.
- Methods must be public; `condition`/`unless` expressions may be excluding results.
- **Measure:** check hit/miss ratio through Micrometer cache metrics or `INFO stats` (`keyspace_hits` vs `keyspace_misses`).

**Debugging Redis:**
- **Latency:** `SLOWLOG GET` shows slow commands; `redis-cli --latency` measures round-trip time. Watch for blocking commands like `KEYS *`, big `SMEMBERS`/`HGETALL` on huge keys, or Lua scripts — Redis is single-threaded, so one slow command blocks everyone. Use `SCAN` instead of `KEYS`.
- **Memory:** `INFO memory` — near `maxmemory`, keys get evicted (check `evicted_keys` and the eviction policy). `redis-cli --bigkeys` finds oversized keys.
- **Connections:** `INFO clients` / `CLIENT LIST` — pool exhaustion or connection leaks on the app side; check timeouts in Lettuce/Jedis.
- **Hot keys:** one key getting most of the traffic (`--hotkeys`).
- **Persistence and replication:** RDB/AOF fork pauses, replication lag, or failover events in Sentinel/Cluster.
- `MONITOR` shows live commands but is expensive — use it only briefly, never in steady production.

**Q. How do you debug authentication failures? What if the JWT expires too often?**

**Authentication failures (401/403):**
- **401 vs 403:** 401 = not authenticated (missing, invalid, or expired token); 403 = authenticated but not allowed (missing role or scope). This tells you where to look.
- Turn on `logging.level.org.springframework.security=DEBUG` to see which filter rejected the request and why.
- **Decode the token** (on jwt.io, never with production secrets) and check `exp`, `iss`, `aud`, and roles/scopes.
- Common causes: wrong header format (it must be `Authorization: Bearer <token>`), **issuer or audience mismatch** between environments, **clock skew** between servers (allow 30–60 s leeway), signing key rotated but the service has old cached public keys (JWKS), a role prefix mismatch (`ROLE_ADMIN` vs `ADMIN`), CORS preflight `OPTIONS` requests blocked by security, or the gateway stripping the header.

**JWT expires too frequently:**
- Check the configured lifetime and the server clocks (NTP) — skew makes tokens look expired early.
- Use the **access token + refresh token** pattern: a short-lived access token (5–15 min) for security, plus a long-lived refresh token to silently get a new one. The client refreshes **before** expiry or when it gets a 401, then retries the request once.
- Store refresh tokens securely (HttpOnly cookie), rotate them on every use, and allow revocation.
- Don't fix it by making access tokens valid for days — a stolen token would then work for days.

**Q. How do you debug CORS issues?**

CORS is enforced **by the browser**, not the server. When a page on `https://app.acme.com` calls an API on `https://api.acme.com`, the browser allows it only if the API's response includes the right `Access-Control-Allow-*` headers. That is why the same call works in Postman or curl but fails in the browser.

**Debugging:**
- Open browser DevTools → Network. Look at the failed request and the **preflight `OPTIONS`** request, and read the exact console error ("No 'Access-Control-Allow-Origin' header", "credentials not supported with wildcard").
- Check the response headers: `Access-Control-Allow-Origin`, `-Methods`, `-Headers`, `-Credentials`.

**Common causes and fixes:**
- **Preflight blocked:** Spring Security rejects the `OPTIONS` request before CORS headers are added. Enable CORS inside security with `http.cors(...)` so it runs first.
- **Origin mismatch:** the scheme, host, and port must match exactly (`http` vs `https`, `localhost:3000` vs `127.0.0.1:3000`).
- **Credentials with a wildcard:** `allowCredentials(true)` cannot be used with `allowedOrigins("*")` — list the origins explicitly (or use `allowedOriginPatterns`).
- **Custom headers** (like `Authorization`, `X-Request-Id`) must be listed in allowed headers; response headers the client reads must be in exposed headers.
- **Duplicate headers:** both the gateway and the service add CORS headers, and the browser rejects two values. Configure CORS in one place only (usually the gateway).

```java
@Bean
CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://app.acme.com"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    config.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

**Q. How do you debug network latency?**

First, prove whether the time is spent **on the network** or **inside the service**.

- **Compare timings:** the client sees 800 ms, but the server logs say the request took 50 ms → ~750 ms is network, a proxy, or queueing before the request reached the app. Tracing spans make this split visible.
- **Break down one request** with `curl -w "dns:%{time_namelookup} connect:%{time_connect} tls:%{time_appconnect} first_byte:%{time_starttransfer} total:%{time_total}\n" -o /dev/null -s <url>` — this shows DNS, TCP connect, TLS handshake, and server time separately.
- **Common causes:**
  - **No connection reuse:** a new TCP + TLS handshake on every call. Use connection pooling and keep-alive in HTTP clients.
  - **Slow DNS** resolution, or DNS results not cached.
  - **Cross-region or cross-AZ calls** — keep chatty services close to each other.
  - **Large payloads** — enable compression (gzip), paginate, return only needed fields.
  - **Too many sequential calls** (chatty APIs) — batch them or run them in parallel.
  - Overloaded load balancers, proxies, or a service mesh sidecar adding hops; packet loss causing retransmits.
- **Tools:** `ping`/`mtr`/`traceroute` (path and packet loss), `tcpdump`/Wireshark (retransmits, handshakes), cloud network metrics, and service-mesh telemetry.

**Q. What if the disk space is full?**

**Immediate response:**
1. Confirm what is full: `df -h` (space) and `df -i` (inodes — millions of tiny files can exhaust them even with free space).
2. Find what is using it: `du -sh /* | sort -h`, then drill down. Common culprits: application logs, heap and thread dumps, temp upload files, old Docker images and containers, and DB logs/WAL/archive files.
3. **Free space safely:** compress or move old logs, delete old dumps, `docker system prune`. Careful: deleting a log file that a process still has open does **not** free the space until the process closes it — check with `lsof | grep deleted`, and truncate (`> app.log`) or restart instead.
4. Restart affected services if they failed to write — a full disk can crash the app or the database, or corrupt writes.

**Prevention:**
- **Log rotation** with size and count limits (Logback `SizeAndTimeBasedRollingPolicy`, `logrotate`), and send logs to a central system instead of keeping them on local disk.
- **Alerts** at 75–80% disk usage, not at 100%.
- Clean temp files after processing; set retention on dumps and DB archives.
- In Kubernetes, set `ephemeral-storage` limits and log to stdout so the platform handles rotation.

**Q. How do you monitor logs efficiently?**

- **Centralize them:** send logs from every service to one place (ELK/OpenSearch, Loki + Grafana, Splunk, Datadog, CloudWatch). Never SSH into servers to read files.
- **Structured JSON logs** with consistent fields (timestamp, level, service, environment, traceId, userId/orderId) so you can filter and aggregate instead of searching free text.
- **Correlation IDs:** put the trace ID in every log line (MDC + Micrometer Tracing), so one search shows a request's full path across services.
- **Right levels:** ERROR = needs action, WARN = unexpected but handled, INFO = key business events, DEBUG off in production (turn it on temporarily through Actuator `/loggers`).
- **Alert on patterns, not by reading:** alerts on error-rate spikes or specific messages (payment failures), and dashboards for top errors.
- **Control volume and cost:** no logging inside tight loops, sample noisy logs, and set retention (e.g., 7–30 days hot, then archive).
- **Never log secrets or personal data** — passwords, tokens, card numbers. Mask them.
- Use **metrics** for counts and rates, and logs for details — don't parse logs to compute metrics.

**Q. What tools do you use for debugging?**

Group them by the question you are trying to answer:

| Need | Tools |
|------|-------|
| **Code-level debugging** | IDE debugger (IntelliJ breakpoints, conditional breakpoints, evaluate expression), remote debugging with `-agentlib:jdwp` in lower environments. |
| **API testing** | Postman, curl, Swagger UI. |
| **Logs** | Kibana/OpenSearch, Grafana Loki, Splunk — searched by trace ID. |
| **Metrics and dashboards** | Prometheus + Grafana, Micrometer, Spring Boot Actuator (`/health`, `/metrics`, `/loggers`, `/env`). |
| **Distributed tracing** | Zipkin, Jaeger, Grafana Tempo, OpenTelemetry. |
| **JVM: threads** | `jstack` / `jcmd <pid> Thread.print`, fastThread. |
| **JVM: memory** | `jcmd GC.heap_dump`, Eclipse MAT, VisualVM, GC logs with GCeasy. |
| **JVM: CPU and profiling** | Java Flight Recorder + JDK Mission Control, async-profiler (flame graphs). |
| **Database** | `EXPLAIN ANALYZE`, slow query log, `pg_stat_statements`, AWR reports (Oracle). |
| **Messaging and cache** | Kafka consumer-group lag (`kafka-consumer-groups.sh`, Kafka UI), `redis-cli` (`SLOWLOG`, `INFO`). |
| **Containers and network** | `kubectl logs/describe/exec`, `curl -w` timing, `tcpdump`, browser DevTools. |

A good answer adds the **order you use them in**: metrics and alerts to spot the problem → tracing to find the slow or failing service → logs for the details → thread/heap dumps or a profiler when the cause is inside the JVM.

**Q. You inherit a legacy service with no tests. How do you add new features safely?**

1. **Understand before changing:** read the code paths you will touch, check the logs and traffic for real usage, and talk to people who know the system.
2. **Add characterization tests first:** tests that record what the code **currently does** (even if it looks wrong) around the area you will change. They act as a safety net — if they break, you changed behavior. Start with integration or API-level tests (MockMvc, Testcontainers for the DB), since the code may be too tangled for unit tests.
3. **Make small, safe refactorings** to make code testable: extract methods, introduce interfaces, and inject dependencies instead of using `new` and static calls. Use IDE automated refactorings to reduce risk.
4. **Write the new feature test-first** (TDD) in the cleaned-up area. Prefer adding new code next to the old code (new class, Strategy) instead of editing a huge method.
5. **Release safely:** put the new behavior behind a **feature flag**, deploy with a canary, and compare metrics. For a large rewrite, use the **Strangler Fig** pattern — route traffic piece by piece to new code.
6. **Leave it better each time** (boy-scout rule): add coverage gates for new code in CI, so test coverage grows with every change.

**Q. A service works locally but fails in Kubernetes. How do you debug it?**

**Look at what Kubernetes tells you:**
- `kubectl get pods` — status: `CrashLoopBackOff`, `ImagePullBackOff`, `Pending`, `OOMKilled`, or running but not ready.
- `kubectl describe pod <pod>` — events: image pull errors, failed probes, scheduling problems (not enough CPU/memory), OOM kills.
- `kubectl logs <pod>` and `kubectl logs <pod> --previous` (logs of the crashed container).

**Common causes:**
- **Configuration:** missing env variables, ConfigMap/Secret not mounted, wrong active profile, or `localhost` URLs that only work on a laptop. Check with `kubectl exec <pod> -- env`.
- **Networking:** wrong Service name or port, DNS (`service.namespace.svc.cluster.local`), NetworkPolicies blocking traffic, or the DB/external API not allowing the cluster's IPs. Test from inside the pod with `kubectl exec` + `curl`/`nslookup`.
- **Probes:** the liveness probe runs before the app has finished starting (slow Spring Boot startup) and Kubernetes keeps killing it. Use a `startupProbe` or a longer `initialDelaySeconds`, and point probes at `/actuator/health/liveness` and `/readiness`.
- **Resources:** memory limit lower than the JVM needs → `OOMKilled` (exit code 137). Use `-XX:MaxRAMPercentage=75` so the JVM respects the container limit; CPU limits too low cause slow startup and probe failures.
- **Image and environment differences:** different base image, Java version, CPU architecture (ARM Mac vs AMD64 nodes), file permissions (running as non-root, read-only file system), or timezone.
- **Running it the same way locally:** run the same Docker image with the same env variables (`docker run`) to reproduce outside the cluster.

**Q. A batch job processing 1 million records fails halfway with no clear error. How do you fix it?**

**Find out why it failed:**
- "No clear error" often means the process was **killed**, not that it threw an exception: OOMKilled (exit code 137), a pod eviction, a timeout from the scheduler, a DB connection or transaction timeout, or the node restarting. Check the exit code, `kubectl describe`, system logs, and GC/memory graphs at that moment.
- Add **progress logging** (records processed, current chunk, IDs) and metrics so the next run shows where and when it stops.
- Look for a "poison" record: replay the batch around the last logged position.

**Make the job robust:**
- **Process in chunks** (e.g., 1,000 records at a time) with a **commit per chunk** — not one huge transaction that holds locks and memory for hours. Read with paging or a streaming cursor, never load all 1M rows into memory.
- **Checkpoint and restart:** save the last processed position, so a rerun **resumes** instead of starting over. Spring Batch does this out of the box (`JobRepository`, restartable steps).
- **Idempotency:** writes must be safe to repeat (upsert, unique keys, or a "processed" flag), because a rerun will reprocess the chunk that failed midway.
- **Skip and retry policies:** retry temporary errors (deadlock, timeout) a few times; **skip** bad records after logging them to an error table or a dead-letter file, instead of failing the whole job for one bad row.
- **Parallelize safely** with partitioning (split by ID range) when needed, sizing threads to what the DB can handle.
- **Monitor and alert** on job duration, failures, and skip counts.

---

### 5.9 DSA

**Q. Reverse a string without using built-in methods.**

Swap characters from both ends, moving towards the middle — O(n) time.

```java
public static String reverse(String input) {
    if (input == null) return null;
    char[] chars = input.toCharArray();
    int left = 0, right = chars.length - 1;
    while (left < right) {
        char temp = chars[left];
        chars[left] = chars[right];
        chars[right] = temp;
        left++;
        right--;
    }
    return new String(chars);
}
// reverse("hello") → "olleh"
```

Notes:
- If even `toCharArray()` is not allowed, loop from the end with `charAt(i)` and append to a `char[]` you fill yourself.
- Don't build the result with `result = result + c` in a loop — strings are immutable, so that is O(n²).
- Edge cases: `null`, empty string, single character.
- Follow-up: `StringBuilder.reverse()` correctly handles surrogate pairs (emoji); a plain char swap splits them.

**Q. Find the length of the longest substring without repeating characters.**

Use a **sliding window**: expand the right end one character at a time; when a character repeats inside the window, move the left end just past its previous position. Keep track of each character's last index in a map. O(n) time, O(k) space (k = distinct characters).

```java
public static int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> lastIndex = new HashMap<>();
    int maxLen = 0, left = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (lastIndex.containsKey(c) && lastIndex.get(c) >= left) {
            left = lastIndex.get(c) + 1;      // jump past the previous occurrence
        }
        lastIndex.put(c, right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
// "abcabcbb" → 3 ("abc"),  "bbbbb" → 1,  "pwwkew" → 3 ("wke"),  "" → 0
```

Why the `>= left` check matters: in `"abba"`, when we reach the last `a`, its old index (0) is already outside the window (left = 2), so the window must not move backwards. For ASCII-only input, an `int[128]` array is faster than a `HashMap`. To return the substring itself, also save the `left` index whenever `maxLen` improves.

---

### 5.10 HR & Managerial

**Q. Tell me about a challenging production bug you fixed (or the biggest production issue you handled).**

Use the **STAR** format — Situation, Task, Action, Result — and keep it to about 2 minutes. Interviewers check how you think under pressure, how you find the root cause, and what you changed so it never happens again.

Sample answer structure (adapt with your own real numbers):

> **Situation:** In a high-volume order-processing service, throughput suddenly dropped and a backlog of hundreds of thousands of events built up during peak hours.
> **Task:** I was on call and had to restore normal processing quickly without losing or double-processing any events.
> **Action:** Metrics showed consumer lag rising while CPU was low, so the service was waiting, not busy. Thread dumps showed most worker threads blocked waiting for DB connections. A recent change had put a slow downstream HTTP call inside a database transaction, so each thread held a connection for seconds. As a short-term fix I increased the timeout handling and scaled consumers carefully; the real fix moved the HTTP call outside the transaction and added a timeout and circuit breaker.
> **Result:** The backlog cleared within an hour, and peak throughput improved by about 3x. I added an alert on connection-pool wait time and a code-review checklist item for remote calls inside transactions.

Highlight: data-driven debugging, staying calm, communication with stakeholders, and **prevention**, not just the fix.

**Q. Why do you want to join our company?**

Connect three things: **what the company does**, **what the role offers**, and **what you bring**. Be specific — generic praise sounds rehearsed.

> "I've spent the last few years building backend services in Java, Spring Boot, and Kafka for large, high-volume platforms, and I want to apply that at a company where engineering quality directly affects many clients. What attracts me here is [a specific product, domain, or engineering practice you researched — e.g., the scale of your platform, your work in a particular domain, or how teams own services end to end]. This role matches what I do best — designing reliable distributed services and solving production problems — and it also lets me grow in [system design / cloud / a domain you want to learn]. I think I can contribute quickly while learning from strong engineers here."

Avoid answers only about salary, brand name, or "I need a change". Research the company's products, recent news, and tech stack before the interview.

**Q. How do you handle tight deadlines?**

Show that you **plan, prioritize, communicate early, and protect quality** — not that you simply work late.

> "First I break the work into small tasks and estimate them, so I know early whether the deadline is realistic. Then I prioritize with the stakeholders: what must ship by the date, and what can follow in the next release. If I see a risk, I raise it early with options — reduce scope, add help, or move the date — rather than surprising anyone at the end. While delivering, I focus on the critical path, avoid starting extra work, and keep the essentials: tests for the core logic, code review, and safe deployment. For example, during a migration release we had a fixed cutover date; we split features into must-have and nice-to-have, automated the repetitive checks, and delivered the must-haves on time with the rest in the next sprint."

Key message: deadlines are met by **managing scope and risk**, not by skipping testing.

**Q. Explain a technical decision you made and its trade-offs.**

Pick a real decision, describe the **options you considered**, **why** you chose one, and the **downside** you accepted. Interviewers want to see that you think in trade-offs, not "best" answers.

> "We had a service that called four downstream systems synchronously for every request, and it became slow and fragile — if one system was down, the whole flow failed. I proposed moving to an event-driven design with Kafka: the service publishes an event, and each downstream consumer processes it independently.
>
> **Options:** keep REST and add retries plus circuit breakers, or switch to asynchronous events.
> **Why Kafka:** it removed the tight coupling, absorbed traffic spikes, and let us replay events after failures. Throughput went up significantly and one slow system no longer blocked the others.
> **Trade-offs we accepted:** the system became **eventually consistent**, so the UI had to show a 'processing' status; debugging got harder, so we added correlation IDs and tracing; and we had to handle duplicate messages with idempotent consumers and a dead-letter topic for failures.
> **Looking back:** it was the right call for this load. For a simple, low-traffic service, I would keep plain REST, because the extra complexity would not pay off."

---

## 6. More companies coming soon

New company rounds will be added here as you share them. Each gets its own `## Company — Role, Round N` section with full Q&A.

**Planned format per entry:**
- Company / role / round metadata
- Questions grouped by topic
- Fast answer + deep answer + code where needed
- Test cases / edge cases for coding problems

*Send your next interview questions and we'll add the next section.*
