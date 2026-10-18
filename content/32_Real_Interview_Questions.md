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

Questions shared by candidates after Java backend rounds at service and product companies (3–10 years of experience). Questions that repeated across posts are merged into one, so each question appears only once below, with a full answer.

---

### 5.1 Core Java & Language Features

**Q. Why is String immutable in Java?**

Immutable means once a `String` object is created, its value can never change. Methods like `toUpperCase()` or `concat()` do not change the original — they return a **new** String.

```java
String s = "hello";
s.toUpperCase();          // creates "HELLO" but s is still "hello"
s = s.toUpperCase();      // now s points to the new object "HELLO"
```

Java made String immutable for five main reasons:

1. **String Pool (saves memory):** Java keeps one copy of each string literal in a special memory area called the String Pool. If `a = "hi"` and `b = "hi"`, both point to the **same** object. This sharing is only safe because nobody can change the value — otherwise changing `a` would secretly change `b` too.
2. **Security:** Strings are used for file paths, database URLs, usernames, and class names. If a String could be changed after a security check, someone could pass the check with a safe value and then change it to a dangerous one.
3. **Thread safety:** Many threads can read the same String at the same time without any locking, because no thread can modify it.
4. **Safe as a HashMap key:** A String's `hashCode()` is calculated once and cached. Since the value never changes, the hash never changes, so the key is always found in the right bucket. This also makes String keys fast.
5. **Class loading:** The JVM loads classes by name (a String). Immutability guarantees the right class is loaded.

The class is also marked `final` so no subclass can break this behavior. When you need to build or change text many times (for example, in a loop), use `StringBuilder` instead — it is mutable and avoids creating many temporary objects.

**Q. Why should equals() and hashCode() be overridden together?**

Because hash-based collections like `HashMap` and `HashSet` use **both** methods, in this order:

1. `hashCode()` decides **which bucket** to look in.
2. `equals()` checks **which object inside that bucket** is the match.

The rule (the contract) is: **if two objects are equal by `equals()`, they must return the same `hashCode()`.**

What goes wrong if you override only `equals()`:

```java
class Employee {
    int id;
    Employee(int id) { this.id = id; }

    @Override
    public boolean equals(Object o) {
        return o instanceof Employee e && e.id == this.id;
    }
    // hashCode() NOT overridden
}

Set<Employee> set = new HashSet<>();
set.add(new Employee(1));
set.add(new Employee(1));
System.out.println(set.size());              // 2 — duplicate!

Map<Employee, String> map = new HashMap<>();
map.put(new Employee(1), "Rahul");
System.out.println(map.get(new Employee(1))); // null — not found!
```

The two objects are "equal", but the default `hashCode()` (based on memory identity) gives them different hash codes. So they go into **different buckets**, and `equals()` is never even called. Result: duplicates in a Set and failed lookups in a Map.

The correct way — use the **same fields** in both methods:

```java
@Override
public int hashCode() {
    return Objects.hash(id);
}
```

Notes:
- Two unequal objects **can** have the same hash code (a collision) — that is allowed, just slower.
- Use fields that do not change, otherwise the object gets "lost" in the map after a change.
- Java `record` classes, Lombok's `@EqualsAndHashCode`, and IDE generators create both methods correctly.

**Q. What is Garbage Collection in Java?**

Garbage Collection (GC) is the JVM's automatic process of **finding objects that are no longer used and freeing their memory**. In languages like C, you must free memory yourself; in Java, the GC does it for you, which prevents most memory bugs.

**How does the GC know an object is "garbage"?** An object is alive if it can be reached from a **GC root** — local variables in running methods, static fields, active threads. If no chain of references leads to an object, nothing can ever use it again, so it is garbage.

```java
User u = new User("Amit");   // reachable through variable u
u = null;                    // no reference left → eligible for GC
```

**Generational heap — the main idea:** most objects die young (temporary objects in a method). So the heap is split into areas:
- **Young Generation** — new objects are created here (in "Eden"). It is cleaned often and quickly (**Minor GC**). Objects that survive a few cleanups move to the Old Generation.
- **Old Generation** — long-lived objects (caches, singletons). Cleaned less often (**Major / Full GC**), which takes longer.
- **Metaspace** (outside the heap) — stores class information.

**Basic steps:** mark (find live objects) → sweep (remove dead ones) → compact (move live objects together so free memory is in one block).

**Common collectors:**

| Collector | Best for |
|-----------|----------|
| **G1** (default since Java 9) | Most server apps — balances throughput and short pauses. |
| **ZGC / Shenandoah** | Very large heaps needing pauses under a few milliseconds. |
| **Parallel GC** | Batch jobs where total throughput matters more than pauses. |
| **Serial GC** | Small apps and tiny containers. |

Points interviewers like:
- During some GC phases, application threads are paused — this is called **stop-the-world**.
- `System.gc()` is only a **request**; the JVM may ignore it. Don't use it in production code.
- GC removes unreachable objects only. If your code keeps references (for example, in a static map), those objects are never collected — that is a **memory leak** in Java.

**Q. What are the key features introduced in Java 17?**

Java 17 is a **Long-Term Support (LTS)** release, which is why companies moved to it from Java 8 or 11. These are the features you should know (many were added between Java 9 and 17 and became final by 17):

1. **Records (Java 16):** short, immutable data classes. `record User(Long id, String name) {}` gives you the constructor, getters, `equals()`, `hashCode()`, and `toString()` automatically.
2. **Sealed classes (Java 17):** control exactly which classes can extend a class or interface.
   ```java
   public sealed interface Payment permits CardPayment, UpiPayment {}
   ```
   Nobody else can implement `Payment`. Useful for fixed sets of types and safe `switch` statements.
3. **Pattern matching for `instanceof` (Java 16):** check and cast in one step.
   ```java
   if (obj instanceof String s) {   // no manual cast needed
       System.out.println(s.length());
   }
   ```
4. **Switch expressions (Java 14):** `switch` can return a value, uses arrows, and has no fall-through bugs.
   ```java
   String type = switch (day) {
       case SATURDAY, SUNDAY -> "Weekend";
       default -> "Weekday";
   };
   ```
5. **Text blocks (Java 15):** multi-line strings with `"""`, great for JSON and SQL inside code.
6. **Helpful NullPointerExceptions (Java 14):** the error message now tells you exactly which variable was null, e.g., "Cannot invoke getName() because user is null".
7. **`var` for local variables (Java 10)** and the **new HTTP Client (Java 11)**.
8. **Better garbage collectors:** ZGC is production-ready, and G1 is faster.
9. **Stronger encapsulation of JDK internals:** libraries can no longer use internal JDK classes freely, which is a common issue when upgrading old projects.

Spring Boot 3 requires Java 17 or higher, so it is now the common baseline.

**Q. What is load factor in HashMap, and what does the default 0.75 mean?**

**Load factor** decides **how full a HashMap can get before it grows**.

- Default capacity (number of buckets) = **16**
- Default load factor = **0.75**
- **Threshold** = capacity × load factor = 16 × 0.75 = **12**

So when the map holds **more than 12 entries**, it **resizes**: it creates a new bucket array of **double** the size (32), and moves every entry into its new bucket (rehashing). The next resize happens at 24 entries, then 48, and so on.

**Why 0.75?** It is a balance between memory and speed:
- **Lower load factor (e.g., 0.5):** resizes earlier, so buckets have fewer entries and lookups are fast — but it wastes memory on empty buckets.
- **Higher load factor (e.g., 1.0):** uses memory better, but buckets get crowded, causing more collisions and slower lookups.
- **0.75** keeps collisions low while not wasting too much space.

Resizing is costly (every entry is moved). If you know how many entries you will store, set the size upfront:

```java
// For about 1000 entries: 1000 / 0.75 ≈ 1334
Map<String, User> map = new HashMap<>(1334);
// Java 19+: HashMap.newHashMap(1000) does this calculation for you
```

**Q. How does HashMap work internally?**

A `HashMap` stores key–value pairs in an **array of buckets**. Each bucket holds the entries whose keys land at that position.

**`put(key, value)` step by step:**
1. Java calls `key.hashCode()` and mixes the bits a little (to spread values better).
2. It calculates the bucket index: `index = hash & (capacity - 1)` — basically, hash modulo array size.
3. If the bucket is **empty**, the new entry is stored there.
4. If the bucket already has entries (a **collision** — different keys, same bucket), Java walks through them and compares keys with `equals()`:
   - Same key found → **replace** the value.
   - Not found → **add** a new node to the bucket.
5. If the number of entries goes above the threshold (capacity × 0.75), the map **resizes** to double the size.

**`get(key)`:** same hash → same bucket → compare keys with `equals()` → return the value (or `null`).

**Collision handling (Java 8 improvement):**
- A bucket starts as a **linked list** of nodes.
- If one bucket gets more than **8** entries (and the table has at least 64 buckets), the list is turned into a **red-black tree**. Lookup in that bucket becomes O(log n) instead of O(n). If it shrinks to 6 or fewer, it turns back into a list.

**Performance:** `get` and `put` are **O(1) on average**. Worst case is O(log n) per bucket in Java 8+ (it was O(n) before).

**Other facts:**
- Allows **one `null` key** (always stored in bucket 0) and many `null` values.
- **Not ordered** — use `LinkedHashMap` for insertion order or `TreeMap` for sorted keys.
- **Not thread-safe** — use `ConcurrentHashMap` for multi-threaded code.
- Keys need correct `equals()` and `hashCode()`, and should be immutable.

**Q. What is the difference between HashMap and Hashtable?**

| Point | HashMap | Hashtable |
|-------|---------|-----------|
| Thread safety | Not thread-safe | Thread-safe — every method is `synchronized` |
| Speed | Fast | Slower, because one lock is shared by all threads |
| Null keys / values | One `null` key and many `null` values allowed | No `null` key or value (throws `NullPointerException`) |
| Iteration | `Iterator` — fails fast if the map is changed during iteration | `Enumeration` (old style) and `Iterator` |
| Added in | Java 1.2 (Collections Framework) | Java 1.0 — a **legacy** class |
| Parent class | `AbstractMap` | `Dictionary` (obsolete) |

**Which one to use today:**
- Single-threaded code → `HashMap`.
- Multi-threaded code → `ConcurrentHashMap`, **not** `Hashtable`. `Hashtable` locks the whole map for every read and write, so only one thread can work at a time. `ConcurrentHashMap` allows many threads to read and write in parallel.

`Hashtable` is kept only for backward compatibility with very old code.

**Q. What is the difference between HashMap and ConcurrentHashMap?**

| Point | HashMap | ConcurrentHashMap |
|-------|---------|-------------------|
| Thread safety | Not thread-safe | Thread-safe |
| Locking | None | Very fine-grained — only the one bucket being written is locked |
| Reads | — | No locking at all, so reads are very fast |
| Null keys / values | Allowed | **Not allowed** |
| Iterator | Fail-fast — throws `ConcurrentModificationException` if changed during iteration | Weakly consistent — never throws; may or may not show recent changes |
| Atomic operations | No | Yes — `putIfAbsent`, `computeIfAbsent`, `merge` |

**What goes wrong with HashMap in multi-threaded code:** two threads writing at the same time can overwrite each other's entries (lost updates), corrupt the internal structure during a resize, and before Java 8 could even cause an infinite loop that kept the CPU at 100%.

**How ConcurrentHashMap stays safe and fast (Java 8+):**
- If a bucket is empty, the new entry is inserted with **CAS** (Compare-And-Swap) — no lock at all.
- If the bucket already has entries, Java locks **only that bucket** (`synchronized` on its first node). Threads writing to different buckets never block each other.
- Reads use `volatile` fields, so they see the latest data without locking.
- Resizing is shared — several threads help move entries.
- (Before Java 8, it used 16 "segments", each with its own lock.)

**Why no nulls?** In a multi-threaded map, if `get(key)` returns `null`, you cannot tell whether the key is missing or the value is `null` — and checking with `containsKey()` first is not safe because another thread could change the map in between. Banning `null` removes this confusion.

**Important trap:** individual methods are thread-safe, but **combining** them is not.

```java
// NOT safe — another thread can change the value between get and put
map.put(word, map.getOrDefault(word, 0) + 1);

// Safe — done as one atomic step
map.merge(word, 1, Integer::sum);
```

**Q. Explain the hierarchy of exceptions in Java.**

Everything that can be thrown in Java comes from one class: **`Throwable`**. It has two branches:

```
Throwable
├── Error                         → serious JVM problems; don't catch
│   ├── OutOfMemoryError
│   ├── StackOverflowError
│   └── NoClassDefFoundError
└── Exception                     → problems your program can handle
    ├── IOException               ┐
    ├── SQLException              ├ Checked exceptions
    ├── InterruptedException      ┘ (compiler forces you to handle them)
    └── RuntimeException          ┐
        ├── NullPointerException  │
        ├── IllegalArgumentException
        ├── ArithmeticException   ├ Unchecked exceptions
        ├── ArrayIndexOutOfBoundsException
        └── ClassCastException    ┘
```

**1. `Error`:** problems with the JVM or the system itself, such as running out of memory or a stack overflow from infinite recursion. Your code usually cannot fix them, so you should not catch them.

**2. Checked exceptions** (subclasses of `Exception` but **not** `RuntimeException`): problems outside your control that can be expected — a file is missing, the network fails, the database is down. The **compiler forces** you to either catch them (`try/catch`) or declare them (`throws`).

**3. Unchecked exceptions** (subclasses of `RuntimeException`): usually **bugs in the code** — null values, wrong arguments, bad casts, dividing by zero. The compiler does not force you to handle them; you fix the code instead.

Points to remember:
- Catch the **most specific** exception first, then more general ones. Catching `Exception` before `IOException` is a compile error, because the second catch can never run.
- Never catch `Throwable` or `Error` in normal code.
- Custom business exceptions usually extend `RuntimeException`.

**Q. What are checked exceptions? What are their advantages and disadvantages?**

A **checked exception** is one the **compiler checks at compile time**. If a method can throw it, the caller must either handle it with `try/catch` or pass it up with `throws`; otherwise the code does not compile. Examples: `IOException`, `SQLException`, `FileNotFoundException`, `InterruptedException`.

```java
public String readFile(String path) throws IOException {      // must declare
    return Files.readString(Path.of(path));
}

try {
    String data = readFile("config.txt");
} catch (IOException e) {                                      // must handle
    log.error("Could not read config", e);
}
```

**Advantages:**
- **Can't be forgotten:** the compiler makes sure every caller thinks about the failure case.
- **Self-documenting:** the method signature clearly shows what can go wrong.
- **Good for recoverable problems:** a missing file or network failure can often be handled — retry, use a default, or show a message.

**Disadvantages:**
- **Boilerplate:** `try/catch` blocks and `throws` clauses spread through many layers of code.
- **Bad habits:** developers often write empty `catch` blocks just to make the code compile, which hides real errors.
- **Don't work well with lambdas and streams:** `Function`, `Consumer`, etc. cannot throw checked exceptions, so you must wrap them.
- **Tight coupling:** if a low-level method adds a new checked exception, every method above it must change.

**What modern code does:** frameworks like Spring use mostly **unchecked** exceptions (for example, Spring turns `SQLException` into an unchecked `DataAccessException`). A common pattern is to catch a checked exception at a low level and wrap it in a meaningful unchecked one, **keeping the original cause**:

```java
try {
    return Files.readString(path);
} catch (IOException e) {
    throw new ConfigLoadException("Cannot load config: " + path, e);   // keep the cause
}
```

Rule of thumb: use checked exceptions when the caller can **realistically recover**; use unchecked exceptions for programming errors and problems the caller can't fix.

**Q. What is exception handling? What is @ControllerAdvice?**

**Exception handling** is how a program deals with errors at runtime so it does not crash and can respond properly. Java gives you:

- `try` — the code that might fail.
- `catch` — what to do if a specific exception happens.
- `finally` — code that always runs (for cleanup), whether or not there was an error.
- `throw` — throw an exception yourself.
- `throws` — declare that a method can throw an exception.
- **try-with-resources** — automatically closes files, connections, and streams.

```java
try (Connection con = dataSource.getConnection()) {   // closed automatically
    // use the connection
} catch (SQLException e) {
    log.error("DB error", e);
    throw new DataLoadException("Could not load orders", e);
}
```

**`@ControllerAdvice` (Spring):** In a REST API, you don't want a `try/catch` in every controller method. `@ControllerAdvice` (or `@RestControllerAdvice`, which also returns JSON) is a class that handles exceptions for **all controllers in one place**. Each `@ExceptionHandler` method says which exception it handles and what response to send.

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(OrderNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("ORDER_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(new ErrorResponse("VALIDATION_FAILED", msg));
    }

    @ExceptionHandler(Exception.class)          // catch-all, last
    public ResponseEntity<ErrorResponse> handleOther(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("INTERNAL_ERROR", "Something went wrong"));
    }
}
```

Benefits: controllers stay clean, every error has the **same JSON format**, each exception maps to the right HTTP status (404, 400, 409, 500), and you never leak stack traces to clients. You can limit an advice to certain packages with `@RestControllerAdvice(basePackages = "com.acme.orders")`. Spring 6 also supports the standard `ProblemDetail` error format.

**Q. What changes did you make when migrating from Java 7 to Java 8?**

Answer this as a real experience: what you changed in the code, and what you had to watch out for.

**Code changes:**
- **Anonymous classes → lambdas and method references:** `Comparator`, `Runnable`, and listeners became one line.
  ```java
  // Java 7
  Collections.sort(users, new Comparator<User>() {
      public int compare(User a, User b) { return a.getName().compareTo(b.getName()); }
  });
  // Java 8
  users.sort(Comparator.comparing(User::getName));
  ```
- **Loops → Streams API:** filtering, mapping, grouping, and summing became shorter and easier to read.
  ```java
  Map<String, List<Order>> byStatus = orders.stream()
      .filter(o -> o.getAmount() > 1000)
      .collect(Collectors.groupingBy(Order::getStatus));
  ```
- **Null checks → `Optional`** for methods that may not return a value (`findById` returns `Optional<User>`).
- **`Date`/`Calendar` → `java.time`** (`LocalDate`, `LocalDateTime`, `Instant`, `Duration`). The new classes are immutable, thread-safe, and much clearer. This also fixed bugs from sharing `SimpleDateFormat` between threads.
- **Interface default methods** to add new behavior to interfaces without breaking existing implementations.
- **`CompletableFuture`** instead of blocking `Future.get()` for parallel calls to other services.
- **New Map methods:** `getOrDefault`, `putIfAbsent`, `computeIfAbsent`, `merge`, `forEach`.

**Build and runtime changes:**
- Updated the compiler level in Maven (`<maven.compiler.source>1.8</maven.compiler.source>`) and CI build agents.
- Upgraded libraries that did not support Java 8 (old Spring, Hibernate, Mockito versions).
- **PermGen was removed and replaced by Metaspace**, so JVM flags like `-XX:MaxPermSize` had to be replaced with `-XX:MaxMetaspaceSize`.
- Retested performance, because HashMap and the garbage collector behaved differently.

**Lessons:** migrate in small steps, run the full test suite after each step, and don't rewrite working code into streams just for style — use them where they make the code clearer.

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

**Q. Interface vs Abstract Class?**

Both are used for abstraction (defining what a class should do), but they are meant for different situations.

| Point | Interface | Abstract class |
|-------|-----------|----------------|
| Purpose | A **contract** — "what a class can do" (`Comparable`, `Runnable`) | A **base class** — "what a class is", with shared code |
| Multiple inheritance | A class can implement **many** interfaces | A class can extend only **one** class |
| Methods | Abstract, `default`, `static`, `private` (Java 9+) | Abstract and normal (concrete) methods |
| Fields | Only constants (`public static final`) | Any fields — instance variables, any access level |
| Constructor | **No** | **Yes** (called by subclasses) |
| State | Cannot hold object state | Can hold state (fields shared by subclasses) |
| Access modifiers | Methods are `public` by default | Any access level (`protected`, `private`, …) |

**Use an interface when:**
- Unrelated classes should share a capability — a `Bird` and a `Drone` can both be `Flyable`.
- You want to support multiple implementations that can be swapped (e.g., `PaymentGateway` with `CardGateway` and `UpiGateway`). This is how Spring injects dependencies.
- You need multiple inheritance of type.

**Use an abstract class when:**
- Related classes share **common code and state** — for example, every `Vehicle` has `speed` and a `start()` method that works the same way.
- You want to give a common structure with some steps fixed and some left to subclasses (Template Method pattern).
- You need constructors or non-public members.

```java
interface Notifier {                 // contract
    void send(String msg);
}

abstract class BaseNotifier implements Notifier {   // shared code + state
    protected final String sender;
    protected BaseNotifier(String sender) { this.sender = sender; }

    public void send(String msg) {   // common steps
        validate(msg);
        deliver(sender + ": " + msg);
    }
    private void validate(String msg) { if (msg.isBlank()) throw new IllegalArgumentException(); }
    protected abstract void deliver(String text);   // each subclass decides how
}

class EmailNotifier extends BaseNotifier {
    EmailNotifier() { super("noreply@acme.com"); }
    protected void deliver(String text) { /* send email */ }
}
```

Since Java 8 (default methods), the gap is smaller, but the main rule still holds: **interface for capability, abstract class for shared code and state**. In practice, code to interfaces and use an abstract class to share the implementation.

**Q. Explain and implement the Factory Design Pattern with modifications.**

**Factory pattern** means: the code that **needs** an object does not create it with `new`; instead it asks a **factory**, which decides which class to create. The caller only knows the common interface.

**Why:** if object creation is spread across the code (`new CardPayment()`, `new UpiPayment()`), adding a new type means editing many places. A factory keeps the creation logic in **one place**.

**Step 1 — Basic factory:**

```java
public interface Payment {
    void pay(double amount);
}

public class CardPayment implements Payment {
    public void pay(double amount) { System.out.println("Paid " + amount + " by card"); }
}

public class UpiPayment implements Payment {
    public void pay(double amount) { System.out.println("Paid " + amount + " by UPI"); }
}

public class PaymentFactory {
    public static Payment create(String type) {
        return switch (type.toUpperCase()) {
            case "CARD" -> new CardPayment();
            case "UPI"  -> new UpiPayment();
            default     -> throw new IllegalArgumentException("Unknown payment type: " + type);
        };
    }
}

// Usage — the caller does not know which class it got
Payment payment = PaymentFactory.create("UPI");
payment.pay(500);
```

**The problem with the basic version:** every new payment type (say, `WALLET`) means **editing** the `switch`. That breaks the Open/Closed Principle (open for extension, closed for modification).

**Modification 1 — Registry-based factory (no switch):** keep a map from type to a creator function. A new type is added by registering it, not by editing the factory.

```java
public class PaymentFactory {
    private static final Map<String, Supplier<Payment>> REGISTRY = new HashMap<>();

    static {
        register("CARD", CardPayment::new);
        register("UPI", UpiPayment::new);
    }

    public static void register(String type, Supplier<Payment> creator) {
        REGISTRY.put(type.toUpperCase(), creator);
    }

    public static Payment create(String type) {
        Supplier<Payment> creator = REGISTRY.get(type.toUpperCase());
        if (creator == null) throw new IllegalArgumentException("Unknown payment type: " + type);
        return creator.get();
    }
}

PaymentFactory.register("WALLET", WalletPayment::new);   // new type, factory unchanged
```

**Modification 2 — Spring version (most common in real projects):** let Spring find all implementations automatically. Each implementation says which type it supports; adding a new type means **adding one new class** — nothing else changes.

```java
public interface PaymentService {
    String type();
    void pay(double amount);
}

@Service
public class CardPaymentService implements PaymentService {
    public String type() { return "CARD"; }
    public void pay(double amount) { /* card logic */ }
}

@Service
public class UpiPaymentService implements PaymentService {
    public String type() { return "UPI"; }
    public void pay(double amount) { /* UPI logic */ }
}

@Component
public class PaymentFactory {
    private final Map<String, PaymentService> services;

    public PaymentFactory(List<PaymentService> all) {      // Spring injects every implementation
        this.services = all.stream()
            .collect(Collectors.toMap(PaymentService::type, Function.identity()));
    }

    public PaymentService get(String type) {
        PaymentService service = services.get(type.toUpperCase());
        if (service == null) throw new IllegalArgumentException("Unsupported payment type: " + type);
        return service;
    }
}
```

**Modification 3 — Use an enum instead of strings** (`PaymentType.CARD`) so a typo becomes a compile error instead of a runtime error.

**Where you see factories in Java:** `Calendar.getInstance()`, `List.of()`, `LoggerFactory.getLogger()`, and Spring's `BeanFactory` itself.

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

### 5.3 Concurrency, Multithreading & Streams

**Q. What is the volatile keyword? What is the difference between synchronized and volatile?**

**The problem `volatile` solves — visibility:** each CPU core has its own cache. A thread may keep a copy of a variable in its cache and **never see** another thread's update.

```java
class Worker {
    private boolean running = true;        // without volatile

    void run() {
        while (running) { /* work */ }     // may loop forever — never sees running = false
    }
    void stop() { running = false; }       // called from another thread
}
```

Marking the field `volatile` fixes this: every read comes from **main memory** and every write goes straight to main memory, so all threads always see the latest value. It also stops the compiler and CPU from reordering instructions around that variable.

```java
private volatile boolean running = true;   // now stop() works immediately
```

**What `volatile` does NOT do — atomicity:** `count++` is really three steps: read, add 1, write. Two threads can both read 5 and both write 6, losing one update. `volatile` does not prevent this.

**`synchronized`** gives **both**:
- **Mutual exclusion (atomicity):** only one thread at a time can run the synchronized block for the same lock.
- **Visibility:** changes made inside the block are visible to the next thread that takes the lock.

| Point | `volatile` | `synchronized` |
|-------|------------|----------------|
| Used on | Variables only | Methods and blocks |
| Visibility | Yes | Yes |
| Atomicity (compound actions like `count++`) | **No** | **Yes** |
| Locking / blocking | No lock, threads never wait | Takes a lock; other threads wait |
| Speed | Very cheap | More expensive under contention |
| Can cause deadlock | No | Yes, if locks are taken in the wrong order |

**When to use which:**
- `volatile` → a simple **flag or status** written by one thread and read by others (`running`, `shutdownRequested`), or a reference that is replaced as a whole (a config object). Also used in double-checked locking for singletons.
- `synchronized` → when you **read-modify-write** shared data or must update several variables together.
- For counters, use `AtomicInteger` / `LongAdder` instead of either — atomic without a lock.

**Q. What is the difference between synchronized and ReentrantLock? What are the trade-offs?**

Both give mutual exclusion (only one thread at a time) and are **reentrant** — a thread that already holds the lock can take it again without blocking itself (for example, one synchronized method calling another).

| Feature | `synchronized` | `ReentrantLock` |
|---------|----------------|-----------------|
| Syntax | Keyword — lock is released **automatically** | Must call `lock()` and `unlock()` yourself (in `finally`) |
| Try without waiting | No | `tryLock()` — returns immediately if busy |
| Wait with timeout | No | `tryLock(2, TimeUnit.SECONDS)` |
| Interruptible wait | No — a waiting thread cannot be interrupted | `lockInterruptibly()` |
| Fairness | No guarantee of order | `new ReentrantLock(true)` — longest-waiting thread goes first |
| Multiple wait conditions | One (`wait`/`notify`) | Many `Condition` objects (`notFull`, `notEmpty`) |
| Check lock status | No | `isLocked()`, `getQueueLength()` |

```java
private final ReentrantLock lock = new ReentrantLock();

public boolean transfer(Account from, Account to, double amount) throws InterruptedException {
    if (lock.tryLock(2, TimeUnit.SECONDS)) {      // don't wait forever
        try {
            from.debit(amount);
            to.credit(amount);
            return true;
        } finally {
            lock.unlock();                         // ALWAYS in finally
        }
    }
    return false;                                  // busy — retry later or report
}
```

**Trade-offs:**
- `synchronized` is **simpler and safer** — you can't forget to release the lock, and it shows up clearly in thread dumps. Its performance is now similar to `ReentrantLock`.
- `ReentrantLock` gives **more control** (timeouts, interruption, fairness, multiple conditions) but if you forget `unlock()` — or don't put it in `finally` — the lock stays held forever and other threads hang.
- Fair locks reduce throughput, so use them only when starvation is a real problem.
- With **virtual threads (Java 21)**, `synchronized` can "pin" the virtual thread to its carrier thread during blocking calls (fixed in Java 24), so `ReentrantLock` was recommended there.

**Rule:** use `synchronized` by default; use `ReentrantLock` when you need one of its extra features. For read-heavy data, consider `ReentrantReadWriteLock`.

**Q. What are atomic variables? What is the difference between volatile and Atomic classes such as AtomicInteger?**

**Atomic variables** are classes in `java.util.concurrent.atomic` — `AtomicInteger`, `AtomicLong`, `AtomicBoolean`, `AtomicReference`, `LongAdder` — that let you update a single value **safely from many threads without using locks**.

They use **CAS (Compare-And-Swap)**, a single CPU instruction: "set the value to X **only if** it is still Y". If another thread changed it in the meantime, the CAS fails and Java simply retries with the new value. No thread ever waits for a lock.

```java
AtomicInteger count = new AtomicInteger(0);

count.incrementAndGet();                 // safe count++
count.addAndGet(5);
count.compareAndSet(10, 0);              // set to 0 only if it is currently 10
count.updateAndGet(x -> x * 2);          // any update, done atomically
```

**volatile vs Atomic:**

| Point | `volatile int` | `AtomicInteger` |
|-------|----------------|-----------------|
| Visibility | Yes | Yes (it uses a volatile field inside) |
| Atomic `count++` | **No** — updates can be lost | **Yes** |
| Compare-and-set | No | Yes |
| Use case | Flags, status values set by one thread | Counters, sequence numbers, values updated by many threads |

```java
volatile int a = 0;          // 1000 threads doing a++ → result may be less than 1000
AtomicInteger b = new AtomicInteger();   // 1000 threads doing b.incrementAndGet() → always 1000
```

**About `AtomicFloat`:** Java has **no** `AtomicFloat` or `AtomicDouble` class. Options: store the bits in an `AtomicInteger`/`AtomicLong` (`Float.floatToIntBits`), use `DoubleAdder`/`DoubleAccumulator` for sums, or `AtomicReference<BigDecimal>` for money.

**Extra point:** under very heavy contention (many threads updating one counter), CAS retries a lot. **`LongAdder`** spreads the count across several cells and adds them up when read — much faster for metrics and hit counters.

**Limit:** atomic classes protect **one** variable. If two values must change together (e.g., debit one account and credit another), you still need a lock or a transaction.

**Q. What are Virtual Threads in Java 21?**

**Normal (platform) threads** are tied 1-to-1 to operating-system threads. Each one uses about 1 MB of stack memory and is expensive to create, so a server can handle only a few thousand at once. In a typical web app, most of these threads spend their time **waiting** — for the database, another API, or a file. That waste is why we use thread pools and complex async code.

**Virtual threads** (final in Java 21, Project Loom) are **lightweight threads managed by the JVM**, not the OS. You can create **millions** of them. The JVM runs them on a small pool of real "carrier" threads. When a virtual thread waits for I/O, the JVM **unmounts** it from the carrier and uses that carrier for another virtual thread. When the I/O completes, the virtual thread continues where it left off.

```java
// One new virtual thread per task — no pool sizing needed
try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10_000; i++) {
        executor.submit(() -> callExternalApi());   // 10,000 blocking calls, no problem
    }
}

Thread.startVirtualThread(() -> System.out.println("Hello from a virtual thread"));
```

```properties
# Spring Boot 3.2+ — run every web request on a virtual thread
spring.threads.virtual.enabled=true
```

**Benefits:**
- Write **simple, blocking-style code** (`repo.findById()`, `restClient.get()`) and still handle huge numbers of concurrent requests — no need for reactive/WebFlux complexity.
- No more tuning thread pool sizes for I/O work.

**Limits to know:**
- They help **I/O-bound** work (waiting). They do **not** make CPU-heavy work faster.
- **Don't pool them** — create one per task; they are cheap.
- **Pinning:** in Java 21, a virtual thread doing blocking I/O inside a `synchronized` block stays stuck to its carrier (fixed in Java 24). Use `ReentrantLock` in such code on Java 21.
- The real limit moves to **other resources** — if 10,000 virtual threads hit the database, the connection pool (say, 20 connections) becomes the bottleneck. Limit concurrency with a `Semaphore` where needed.
- Be careful with heavy `ThreadLocal` use, since there can be millions of threads.

**Q. What is ThreadLocal and where is it used?**

`ThreadLocal` gives **each thread its own separate copy** of a variable. Two threads reading the same `ThreadLocal` see different values, so no synchronization is needed.

```java
public class UserContext {
    private static final ThreadLocal<String> CURRENT_USER = new ThreadLocal<>();

    public static void set(String user) { CURRENT_USER.set(user); }
    public static String get()          { return CURRENT_USER.get(); }
    public static void clear()          { CURRENT_USER.remove(); }
}
```

**Where it is used in real applications:**
- **Per-request data in web apps:** the logged-in user, tenant ID, or request/trace ID. A filter sets it at the start of the request and any layer can read it, without passing it through every method.
- **Spring uses it internally:** `SecurityContextHolder` (current user), `@Transactional` (the current transaction and DB connection), and `RequestContextHolder`.
- **Logging MDC:** `MDC.put("traceId", id)` stores the value in a ThreadLocal so every log line in that request includes the trace ID.
- **Non-thread-safe objects:** giving each thread its own `SimpleDateFormat` (before Java 8's thread-safe `DateTimeFormatter`).

```java
ThreadLocal<SimpleDateFormat> formatter =
    ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));
```

**The big danger — memory leaks and data leaks in thread pools:** web servers **reuse** threads. If you set a ThreadLocal and don't remove it, the value stays on that thread. The next request handled by the same thread may **see the previous user's data**, and the objects are never garbage-collected. Always clear it in `finally`:

```java
try {
    UserContext.set(userId);
    chain.doFilter(request, response);
} finally {
    UserContext.clear();          // must always run
}
```

Also note: values are **not** passed automatically to child threads or async tasks (`@Async`, `CompletableFuture`) — you must copy them (e.g., with a `TaskDecorator`). Java 21 adds **Scoped Values** as a safer alternative for virtual threads (preview).

**Q. What are the different ways to ensure thread safety?**

Thread safety means shared data stays correct when many threads use it at the same time. The options, from simplest to most involved:

1. **Don't share data (stateless code):** use local variables and method parameters — each thread has its own stack. Spring singleton services are thread-safe as long as they don't keep changing data in fields.
2. **Immutable objects:** if an object cannot change after creation (`final` fields, no setters — `String`, records, `List.of()`), any number of threads can read it safely.
3. **Thread confinement:** give each thread its own copy with `ThreadLocal`, or let only one thread own the data.
4. **`synchronized`:** only one thread at a time runs the block for a given lock.
5. **Explicit locks:** `ReentrantLock` (timeouts, fairness), `ReentrantReadWriteLock` (many readers, one writer), `StampedLock`.
6. **Atomic classes:** `AtomicInteger`, `AtomicReference`, `LongAdder` — lock-free updates of single values.
7. **`volatile`:** visibility for simple flags (not for compound updates).
8. **Concurrent collections:** `ConcurrentHashMap`, `CopyOnWriteArrayList`, `BlockingQueue`, `ConcurrentLinkedQueue` instead of `HashMap` or `ArrayList`.
9. **Higher-level tools:** `ExecutorService` instead of manual threads; `Semaphore`, `CountDownLatch`, and `CompletableFuture` for coordination.
10. **Outside the JVM:** when several app instances share data, JVM locks don't help — use **database locks or transactions** (optimistic locking with `@Version`, `SELECT ... FOR UPDATE`) or a **distributed lock** (Redis).

**Example — updating an account balance from parallel requests:** `synchronized` works only inside one JVM. With multiple instances, use the database: optimistic locking (`@Version` on the entity, retry on conflict) or an atomic SQL update — `UPDATE account SET balance = balance - ? WHERE id = ? AND balance >= ?`.

**How to choose:** prefer immutability and stateless design first (no locking needed), then concurrent collections and atomics, and use locks only where you must update several things together.

**Q. What is the difference between sequential and parallel streams? Have you used parallel streams in a production project?**

- A **sequential stream** processes elements **one at a time on the current thread**. It is the default (`list.stream()`).
- A **parallel stream** splits the data into chunks and processes them **at the same time on multiple threads**, then combines the results (`list.parallelStream()` or `.parallel()`). It uses the shared **ForkJoinPool common pool**, which by default has (number of CPU cores − 1) threads.

```java
long count = numbers.stream().filter(n -> isPrime(n)).count();          // one thread
long count2 = numbers.parallelStream().filter(n -> isPrime(n)).count(); // many threads
```

**Parallel streams are faster only when:**
- The data is **large** (tens of thousands of elements or more).
- Each element needs **CPU-heavy work** (calculations, not waiting).
- The source **splits easily** — `ArrayList`, arrays, `IntStream.range` (not `LinkedList` or I/O streams).
- The operations are **stateless and independent** — the result for one element doesn't depend on another.

**When parallel streams hurt:**
- **Small lists:** splitting and merging costs more than the work itself — it becomes slower.
- **I/O or blocking calls** (DB or REST calls inside the stream): they block the **shared** common pool, which is also used by `CompletableFuture` and other code in the whole JVM. One slow call can slow down unrelated parts of the app.
- **Shared mutable state:** adding to a normal `ArrayList` from a parallel stream causes lost data or exceptions. Use `collect()` instead.
- **Order:** `forEach` does not keep order; `findFirst()` and `limit()` become expensive. Use `forEachOrdered` or `findAny` when order doesn't matter.

**Sample production answer:**

> "I've used parallel streams carefully, only for CPU-bound work on large in-memory data — for example, calculating summaries over a large list already loaded in memory, where it cut processing time noticeably. I measured before and after. For anything involving DB or API calls, I don't use parallel streams; I use a dedicated `ExecutorService` with `CompletableFuture`, so I control the thread count and don't block the common pool. In web request code, I usually avoid parallel streams because many requests run at once and already use the CPU cores."

**Q. What is the difference between map and flatMap?**

- **`map`** transforms **each element into exactly one new element**. One in, one out.
- **`flatMap`** transforms each element into **a stream of zero or more elements**, and then **flattens** all those small streams into one stream. One in, many out.

```java
List<String> names = List.of("amit", "neha");

// map: each name → its length (one value each)
List<Integer> lengths = names.stream()
    .map(String::length)
    .toList();                                   // [4, 4]

// map with a list result gives a "list of lists"
List<List<String>> nested = List.of(List.of("a", "b"), List.of("c"));

// flatMap: flatten the list of lists into one list
List<String> flat = nested.stream()
    .flatMap(List::stream)
    .toList();                                   // [a, b, c]
```

**Real example:** every order has a list of items, and you want all item names across all orders:

```java
List<String> allItems = orders.stream()
    .flatMap(order -> order.getItems().stream())   // Stream<Order> → Stream<Item>
    .map(Item::getName)
    .distinct()
    .toList();
```

If you used `map(order -> order.getItems())`, you would get a `Stream<List<Item>>` — a stream of lists, not a stream of items.

**Easy way to remember:** `map` = **transform**; `flatMap` = **transform and flatten**. The same idea exists for `Optional`: use `flatMap` when your function already returns an `Optional`, so you don't end up with `Optional<Optional<T>>`.

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

**Q. How does @Transactional work internally?**

A **transaction** groups several database operations so that **either all succeed or none do**. `@Transactional` lets Spring manage this for you — no manual `commit()` or `rollback()`.

**How it works — through a proxy:**

1. At startup, Spring sees `@Transactional` on a bean and creates a **proxy** (a wrapper object) around it. Other beans get the proxy injected, not the real object.
2. When a caller calls the method, the call goes to the **proxy first**.
3. The proxy asks the `PlatformTransactionManager` (for JPA, `JpaTransactionManager`) to **start a transaction**: it takes a DB connection from the pool and sets `autoCommit = false`.
4. The connection is stored in a **ThreadLocal**, so every repository call in the same thread uses the **same connection and transaction**.
5. The proxy calls your **real method**.
6. If the method finishes normally → **commit**. If it throws a `RuntimeException` or `Error` → **rollback**.
7. The connection goes back to the pool.

```java
@Service
public class TransferService {

    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        Account from = repo.findById(fromId).orElseThrow();
        Account to   = repo.findById(toId).orElseThrow();
        from.debit(amount);
        to.credit(amount);       // if this throws, the debit is rolled back too
    }
}
```

**Important settings:**
- **`propagation`** — what happens if a transaction already exists:
  - `REQUIRED` (default): join the existing one, or start a new one.
  - `REQUIRES_NEW`: pause the current one and start a separate transaction (used for audit logs that must be saved even if the main work fails).
  - Others: `SUPPORTS`, `MANDATORY`, `NEVER`, `NOT_SUPPORTED`, `NESTED`.
- **`isolation`** — how much one transaction can see of another's uncommitted or changing data (`READ_COMMITTED`, `REPEATABLE_READ`, `SERIALIZABLE`).
- **`rollbackFor`** — roll back for checked exceptions too: `@Transactional(rollbackFor = Exception.class)`.
- **`readOnly = true`** — for read-only methods; Hibernate skips dirty checking, which makes them faster.
- **`timeout`** — roll back if the transaction runs too long.

**Q. Why might @Transactional not roll back (or not work at all)?**

These are the most common reasons, and all come from how the proxy works:

1. **Checked exception thrown:** by default Spring rolls back only for `RuntimeException` and `Error`. A checked exception like `IOException` **commits**. Fix: `@Transactional(rollbackFor = Exception.class)`.
2. **Exception caught inside the method:** if you `catch` the exception and don't rethrow it, the proxy never sees it and commits.
3. **Self-invocation:** calling a `@Transactional` method from **another method in the same class** (`this.save()`) skips the proxy, so no transaction starts. Fix: move the method to another bean, or call it through the injected proxy.
4. **Method is not `public`:** proxies only apply to public methods (Spring 6 also supports protected and package-private for class-based proxies, but public is the safe rule).
5. **Class is not a Spring bean:** creating the object with `new` means there's no proxy.
6. **Wrong propagation:** with `REQUIRES_NEW` or `NOT_SUPPORTED`, part of the work runs outside the main transaction.
7. **New thread / `@Async`:** the transaction is tied to the thread (ThreadLocal), so work done in another thread is not part of it.
8. **Database doesn't support transactions** — e.g., an old MySQL MyISAM table.
9. **Multiple data sources:** the wrong transaction manager is used for that database.

**Q. How does Spring Boot decide which auto-configuration to apply? What does @EnableAutoConfiguration do?**

**`@EnableAutoConfiguration`** (part of `@SpringBootApplication`) tells Spring Boot: "look at my classpath and my properties, and **create the beans I'm likely to need**."

**Step by step:**

1. It imports `AutoConfigurationImportSelector`.
2. That class reads the list of all auto-configuration classes from
   `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` (in Spring Boot 2.7+; older versions used `spring.factories`). There are 100+ entries — `DataSourceAutoConfiguration`, `WebMvcAutoConfiguration`, `KafkaAutoConfiguration`, and so on.
3. Each auto-configuration class is guarded by **conditions**. Spring Boot applies it **only if all its conditions are true**:

| Condition | Meaning |
|-----------|---------|
| `@ConditionalOnClass(DataSource.class)` | Apply only if this class is on the classpath (the library is added) |
| `@ConditionalOnMissingClass` | Apply only if a class is NOT present |
| `@ConditionalOnMissingBean` | Apply only if **you haven't defined your own bean** of this type |
| `@ConditionalOnBean` | Apply only if some other bean exists |
| `@ConditionalOnProperty("spring.kafka.enabled")` | Apply only if a property is set to a certain value |
| `@ConditionalOnWebApplication` | Apply only in a web app |

```java
@AutoConfiguration
@ConditionalOnClass(DataSource.class)
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean           // backs off if you define your own DataSource
    public DataSource dataSource(DataSourceProperties props) { ... }
}
```

**Key idea — "your config wins":** because of `@ConditionalOnMissingBean`, if you define your own bean, the auto-configured one is skipped.

**Useful tips:**
- Start the app with `--debug` (or `debug=true`) to see the **Conditions Evaluation Report** — which auto-configurations were applied and why others were skipped.
- Turn off one: `@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)` or `spring.autoconfigure.exclude=...`.

**Q. What is the difference between @Component, @Service, and @Repository?**

All three mark a class as a **Spring bean**, so component scanning finds it and creates it. `@Service` and `@Repository` are actually `@Component` with a more specific name.

| Annotation | Layer | Extra behavior |
|------------|-------|----------------|
| `@Component` | Any general-purpose class (helpers, utilities) | None |
| `@Service` | Business logic layer | None today — it shows the **purpose** of the class |
| `@Repository` | Data access layer (DAO) | **Exception translation:** converts database-specific exceptions (like `SQLException` or Hibernate exceptions) into Spring's `DataAccessException` family |
| `@Controller` / `@RestController` | Web layer | Handles HTTP requests |

**Why not use `@Component` everywhere?**
- **Readability:** anyone reading the code knows the role of the class.
- **`@Repository` really does something extra** (exception translation through `PersistenceExceptionTranslationPostProcessor`).
- **Targeting:** AOP pointcuts and tools can target a layer, e.g., "log all methods in `@Service` classes".

Note: Spring Data interfaces (`interface UserRepository extends JpaRepository<User, Long>`) don't need `@Repository` — Spring Data creates the implementation and applies translation automatically.

**Q. What is the N+1 problem and how do you fix it?**

**The problem:** you load a list of N parent records with **1 query**, and then Hibernate runs **1 extra query for each parent** to load its children. Total: **N + 1 queries**.

```java
List<Order> orders = orderRepo.findAll();        // 1 query: SELECT * FROM orders
for (Order o : orders) {
    o.getItems().size();                         // 1 query PER order: SELECT * FROM items WHERE order_id = ?
}
// 100 orders → 101 queries
```

This happens because relationships like `@OneToMany` are **lazy** — the children load only when you first touch them. It is fast with 5 rows in testing and very slow with 10,000 rows in production.

**How to detect it:** turn on SQL logging (`spring.jpa.show-sql=true` or `logging.level.org.hibernate.SQL=DEBUG`) and look for the same query repeating with different IDs. Hibernate statistics and APM tools also show it.

**Fixes:**

1. **`JOIN FETCH`** — load parents and children in one query:
```java
@Query("SELECT DISTINCT o FROM Order o JOIN FETCH o.items WHERE o.status = :status")
List<Order> findWithItems(@Param("status") String status);
```

2. **`@EntityGraph`** — tell Spring Data which relations to load together:
```java
@EntityGraph(attributePaths = {"items"})
List<Order> findByStatus(String status);
```

3. **Batch fetching** — load children for many parents at once, with `IN (...)`:
```java
@BatchSize(size = 50)
@OneToMany(mappedBy = "order")
private List<Item> items;
// or globally: spring.jpa.properties.hibernate.default_batch_fetch_size=50
```
   100 orders → 1 + 2 queries instead of 101.

4. **DTO projection** — select only the columns you need into a DTO, which avoids loading entities at all.

**Note:** `JOIN FETCH` on a collection together with pagination makes Hibernate paginate in memory (warning `HHH90003004`). For paged lists, use batch fetching or fetch IDs first, then fetch the details.

**Q. How does JWT authentication work?**

**JWT (JSON Web Token)** is a signed token that proves who the user is. The server doesn't need to store sessions — the token itself carries the user info. This makes it a good fit for REST APIs and microservices.

**A JWT has three parts**, separated by dots: `header.payload.signature`
- **Header:** the algorithm used, e.g., `{"alg": "HS256", "typ": "JWT"}`.
- **Payload (claims):** user data, e.g., `{"sub": "user123", "roles": ["ADMIN"], "exp": 1735689600}`. It is only Base64-encoded, **not encrypted** — never put passwords or secrets in it.
- **Signature:** created from the header + payload using a secret key (HS256) or a private key (RS256). If anyone changes the payload, the signature no longer matches.

**The flow:**

1. **Login:** the user sends username and password to `/login`.
2. The server checks the credentials and **creates a JWT** signed with its key, with an expiry time (e.g., 15 minutes).
3. The client stores the token and sends it on every request:
   `Authorization: Bearer eyJhbGciOi...`
4. On each request, a **filter** (in Spring Security, `OncePerRequestFilter` or the built-in OAuth2 resource server) reads the token, **checks the signature and expiry**, and reads the user and roles.
5. If valid, it puts the user in the `SecurityContext`, and `@PreAuthorize("hasRole('ADMIN')")` checks permissions. If invalid or expired → **401 Unauthorized**.

```java
@Bean
SecurityFilterChain security(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/auth/**").permitAll()
            .anyRequest().authenticated())
        .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))
        .build();
}
```

**Good practices:**
- Keep **access tokens short-lived** (5–15 min) and use a **refresh token** (stored safely, can be revoked) to get new ones.
- Use **RS256** in microservices: the auth server signs with a private key; other services verify with the public key and never hold the secret.
- Always use **HTTPS**.
- **Logout/revocation** is the weak point of JWT, since tokens are valid until they expire. Use short expiry plus a deny-list (e.g., in Redis) when needed.

**Q. What is the difference between @PathVariable and @RequestParam?**

Both read values from the URL, but from different parts of it.

| Point | `@PathVariable` | `@RequestParam` |
|-------|-----------------|-----------------|
| Where the value is | Inside the URL **path** — `/users/42` | In the **query string** after `?` — `/users?status=active` |
| Typical use | **Identify a specific resource** | **Filter, sort, search, paginate** |
| Required? | Yes — it's part of the path | Optional if you set `required = false` or a `defaultValue` |

```java
// GET /users/42
@GetMapping("/users/{id}")
public User getUser(@PathVariable Long id) { ... }

// GET /users?status=active&page=0&size=20
@GetMapping("/users")
public List<User> search(@RequestParam String status,
                         @RequestParam(defaultValue = "0") int page,
                         @RequestParam(defaultValue = "20") int size) { ... }

// Both together: GET /users/42/orders?status=PAID
@GetMapping("/users/{id}/orders")
public List<Order> orders(@PathVariable Long id,
                          @RequestParam(required = false) String status) { ... }
```

**Simple rule:** if it says **which** resource → `@PathVariable`; if it says **how** to filter or view the results → `@RequestParam`.

**Q. How does Spring Boot integrate with Actuator internally?**

**Actuator** adds production-ready endpoints to your app — health, metrics, info, environment, thread dump, and more — just by adding `spring-boot-starter-actuator`.

**How it works internally:**

1. **Auto-configuration:** the actuator JAR brings its own auto-configuration classes (e.g., `HealthEndpointAutoConfiguration`, `MetricsAutoConfiguration`). Like all auto-config, they are applied based on conditions — what's on the classpath and which properties are set.
2. **Endpoints are beans:** each endpoint is a class annotated with `@Endpoint(id = "health")` and methods marked `@ReadOperation`, `@WriteOperation`, or `@DeleteOperation`.
3. **Exposure:** Actuator maps these endpoints to **HTTP** (`/actuator/health`) and/or **JMX**, based on the `management.endpoints.web.exposure.include` setting. By default only `health` is exposed over HTTP.
4. **Health indicators:** Spring Boot automatically adds a `HealthIndicator` for each technology it finds — `DataSourceHealthIndicator` (runs a test query), `RedisHealthIndicator`, `DiskSpaceHealthIndicator`, and so on. The health endpoint combines them: if any is DOWN, the overall status is DOWN.
5. **Metrics through Micrometer:** Actuator uses **Micrometer**, which automatically records JVM memory, GC, threads, HTTP request timings, HikariCP pool usage, and more. Add `micrometer-registry-prometheus` and you get `/actuator/prometheus` for Prometheus to scrape.
6. **Kubernetes probes:** `/actuator/health/liveness` and `/actuator/health/readiness` are available for liveness and readiness probes.

```properties
management.endpoints.web.exposure.include=health,info,metrics,prometheus
management.endpoint.health.show-details=when-authorized
management.server.port=9090          # serve actuator on a separate, internal port
```

**Custom health check:**

```java
@Component
public class PaymentGatewayHealth implements HealthIndicator {
    public Health health() {
        return gatewayClient.ping()
            ? Health.up().build()
            : Health.down().withDetail("reason", "gateway unreachable").build();
    }
}
```

**Security:** endpoints like `env`, `heapdump`, and `beans` can leak secrets. Expose only what you need, and protect the rest with Spring Security or a separate internal port.

**Q. Explain the Spring Bean lifecycle.**

The bean lifecycle is the set of steps Spring follows from **creating** a bean to **destroying** it:

1. **Bean definition loaded:** Spring reads `@Component` classes, `@Bean` methods, and configuration, and builds a "recipe" for each bean.
2. **Instantiation:** Spring creates the object (calls the constructor). Constructor injection happens here.
3. **Populate properties:** dependencies are injected (`@Autowired` fields and setters, `@Value`).
4. **Aware callbacks:** if the bean implements `BeanNameAware`, `BeanFactoryAware`, or `ApplicationContextAware`, Spring gives it its name or the container.
5. **`BeanPostProcessor` — before init:** `postProcessBeforeInitialization()` runs for every bean.
6. **Initialization:** your setup code runs, in this order:
   - `@PostConstruct` method
   - `afterPropertiesSet()` (if it implements `InitializingBean`)
   - custom `initMethod` (`@Bean(initMethod = "init")`)
7. **`BeanPostProcessor` — after init:** `postProcessAfterInitialization()` runs. **This is where Spring creates proxies** for `@Transactional`, `@Async`, `@Cacheable`, and AOP.
8. **Bean is ready** and used by the application.
9. **Destruction (on shutdown):**
   - `@PreDestroy` method
   - `destroy()` (if it implements `DisposableBean`)
   - custom `destroyMethod`

```java
@Component
public class CacheLoader {

    @PostConstruct
    public void init() {
        // runs once after dependencies are injected — e.g., warm up a cache
    }

    @PreDestroy
    public void cleanup() {
        // runs on shutdown — e.g., close connections, flush data
    }
}
```

**Scope matters:**
- **Singleton** (default): one instance, created at startup, destroyed at shutdown.
- **Prototype**: a new instance every time it's requested. Spring does **not** call destroy methods for prototype beans — you must clean them up yourself.
- **Request / Session** (web apps): one per HTTP request or per user session.

**Q. What is the difference between @ComponentScan and @SpringBootApplication?**

**`@ComponentScan`** does one job: it tells Spring **which packages to scan** for classes marked `@Component`, `@Service`, `@Repository`, `@Controller`, and `@Configuration`, and registers them as beans.

**`@SpringBootApplication`** is a **shortcut that combines three annotations**:

```java
@SpringBootConfiguration      // same as @Configuration — this class can define @Bean methods
@EnableAutoConfiguration      // turn on Spring Boot auto-configuration
@ComponentScan                // scan this package and all its sub-packages
public @interface SpringBootApplication { }
```

| Point | `@ComponentScan` | `@SpringBootApplication` |
|-------|------------------|--------------------------|
| What it does | Only finds and registers your beans | Configuration + auto-configuration + component scanning |
| Auto-configuration | No | Yes |
| Where used | Any `@Configuration` class, plain Spring too | The main class of a Spring Boot app |

**Common interview trap — package location:** `@SpringBootApplication` scans **only the package of the main class and its sub-packages**. If the main class is in `com.acme.app` and a service is in `com.acme.common`, that service **won't be found**, and you'll get "No qualifying bean" errors.

Fixes: move the main class to the top-level package (best), or widen the scan:

```java
@SpringBootApplication(scanBasePackages = {"com.acme.app", "com.acme.common"})
```

Also note: entity and repository scanning follow the same base package; if they live elsewhere, use `@EntityScan` and `@EnableJpaRepositories`.

**Q. What is the difference between @RestController and @Controller internally?**

**`@RestController` = `@Controller` + `@ResponseBody`** on every method.

```java
@Controller
@ResponseBody
public @interface RestController { }
```

**What happens internally:**

**With `@Controller`** (used for web pages):
1. `DispatcherServlet` calls your method.
2. The method returns a **view name** such as `"home"`.
3. A `ViewResolver` finds the template (Thymeleaf/JSP, e.g., `templates/home.html`), fills it with model data, and returns **HTML**.

```java
@Controller
public class PageController {
    @GetMapping("/home")
    public String home(Model model) {
        model.addAttribute("name", "Amit");
        return "home";                       // view name → home.html
    }
}
```

**With `@RestController`** (used for REST APIs):
1. `DispatcherServlet` calls your method.
2. Because of `@ResponseBody`, Spring **skips view resolution**.
3. The return value goes to an `HttpMessageConverter` — usually `MappingJackson2HttpMessageConverter` (Jackson) — which converts the object to **JSON** (or XML) based on the request's `Accept` header, and writes it straight into the response body.

```java
@RestController
public class UserApi {
    @GetMapping("/api/users/{id}")
    public User get(@PathVariable Long id) {
        return service.find(id);             // converted to JSON
    }
}
```

**Mixing:** in a `@Controller`, you can still return JSON from one method by adding `@ResponseBody` to just that method, or by returning `ResponseEntity<T>`.

**Q. What is the difference between BeanFactory and ApplicationContext?**

Both are Spring **IoC containers** — they create and manage beans. `ApplicationContext` extends `BeanFactory` and adds many features.

| Feature | `BeanFactory` | `ApplicationContext` |
|---------|---------------|----------------------|
| Bean creation | **Lazy** — created when first requested | **Eager** — singletons created at startup (errors show up early) |
| Auto-registers `BeanPostProcessor`s | No (manual) | Yes — so `@Autowired`, `@Transactional`, AOP work automatically |
| Events | No | Yes — `ApplicationEvent`, `@EventListener` |
| Internationalization (messages) | No | Yes — `MessageSource` |
| Environment & profiles | Basic | Full support — `@Profile`, properties |
| Resource loading | Basic | `getResource("classpath:...")` |
| Used in | Very memory-limited cases (rare today) | **Every Spring Boot app** |

In practice, you always use `ApplicationContext` (in a Spring Boot web app, it's `AnnotationConfigServletWebServerApplicationContext`). `BeanFactory` is mainly an interview concept and the low-level base.

**Q. Field injection vs constructor injection — which is better?**

**Field injection:**
```java
@Service
public class OrderService {
    @Autowired private PaymentClient paymentClient;     // injected by reflection
}
```

**Constructor injection:**
```java
@Service
public class OrderService {
    private final PaymentClient paymentClient;

    public OrderService(PaymentClient paymentClient) {   // @Autowired not needed with one constructor
        this.paymentClient = paymentClient;
    }
}
```

**Constructor injection is the recommended approach because:**
- **Fields can be `final`:** the dependency can't be changed or left null by accident.
- **No half-built objects:** the object can't exist without its dependencies. With field injection, `new OrderService()` creates an object with a null field, which causes `NullPointerException` later.
- **Easy unit testing:** just call `new OrderService(mockClient)` — no Spring or reflection needed.
- **Shows design problems:** a constructor with 8 parameters clearly says "this class does too much".
- **Circular dependencies fail fast at startup** instead of hiding.

**Field injection** is shorter, but it hides dependencies, needs reflection for tests, and doesn't allow `final`. It's acceptable in test classes (`@Autowired MockMvc mockMvc`).

**Setter injection** is used for **optional** dependencies that may be changed later.

With Lombok, `@RequiredArgsConstructor` generates the constructor for all `final` fields, so constructor injection is just as short.

**Q. Which design patterns are used in Spring Boot?**

| Pattern | Where Spring uses it |
|---------|----------------------|
| **Singleton** | Every bean is a singleton by default — one instance per container |
| **Factory** | `BeanFactory` / `ApplicationContext` create beans; `@Bean` methods are factory methods |
| **Proxy** | `@Transactional`, `@Async`, `@Cacheable`, and AOP work through proxies (JDK dynamic proxy or CGLIB) |
| **Template Method** | `JdbcTemplate`, `RestTemplate`, `KafkaTemplate` — Spring handles the fixed steps (open connection, handle errors, close), you provide only the variable part |
| **Dependency Injection / IoC** | The core of Spring — the container provides dependencies instead of classes creating them |
| **Front Controller** | `DispatcherServlet` receives every HTTP request and sends it to the right controller |
| **Observer** | Application events — `ApplicationEventPublisher` and `@EventListener` |
| **Adapter** | `HandlerAdapter` lets `DispatcherServlet` call different kinds of handlers in the same way |
| **Strategy** | Swappable implementations — `PlatformTransactionManager`, `ViewResolver`, `HttpMessageConverter` |
| **Builder** | `UriComponentsBuilder`, `WebClient.builder()`, `ResponseEntity.ok().header(...).body(...)` |
| **Decorator** | `BeanPostProcessor` wraps beans with extra behavior |
| **Chain of Responsibility** | The Spring Security filter chain — each filter handles its part and passes the request on |

A good interview answer names 4–5 of these with a one-line example each — Singleton, Factory, Proxy, Template Method, and Front Controller are the most expected.

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

**Q. How do you optimize a slow SQL query? What if database queries suddenly become slow in production?**

**Step 1 — Find the slow query.** Don't guess:
- Database slow query log (MySQL `slow_query_log`, PostgreSQL `log_min_duration_statement`).
- PostgreSQL `pg_stat_statements` — shows which queries take the most total time.
- APM tools (New Relic, Datadog, Dynatrace) or Hibernate SQL logs with timings.

**Step 2 — Read the execution plan** with `EXPLAIN` (or `EXPLAIN ANALYZE` in PostgreSQL, which actually runs the query and shows real times):

```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 42 AND status = 'PAID' ORDER BY created_at DESC;
```

Look for:
- **Full table scan** (`Seq Scan` / `type: ALL`) on a big table → missing or unused index.
- **Rows examined much bigger than rows returned** → the filter isn't using an index.
- **`Using filesort` / `Using temporary`** → sorting or grouping without an index.
- **Estimated rows far from actual rows** → outdated table statistics.

**Step 3 — Fix it. Common fixes:**

1. **Add the right index** — on columns used in `WHERE`, `JOIN`, and `ORDER BY`:
   ```sql
   CREATE INDEX idx_orders_customer_status_date
       ON orders (customer_id, status, created_at);
   ```
   In a **composite index, column order matters**: put equality columns first, then range or sort columns. An index on `(a, b)` helps `WHERE a = ?` but not `WHERE b = ?` alone.

2. **Don't block index usage:**
   - Avoid functions on indexed columns: `WHERE YEAR(created_at) = 2024` → use `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`.
   - Avoid a leading wildcard: `LIKE '%abc'` can't use a normal index; `LIKE 'abc%'` can.
   - Match data types: comparing a `VARCHAR` column with a number causes a conversion and skips the index.
   - `OR` across different columns often skips indexes — `UNION ALL` can help.

3. **Select only the columns you need** — no `SELECT *`. If the index contains all needed columns (a **covering index**), the database doesn't even read the table.

4. **Paginate properly:** `OFFSET 100000` reads and throws away 100,000 rows. Use **keyset pagination**: `WHERE id > :lastId ORDER BY id LIMIT 20`.

5. **Rewrite heavy queries:** replace correlated subqueries with joins, use `EXISTS` instead of `IN` for large subqueries, and avoid huge `IN (...)` lists.

6. **Fix the application side:** N+1 queries (use `JOIN FETCH` or batch fetching), queries inside loops (use batch inserts and updates), and missing caching for data that's read often and rarely changes.

7. **Bigger data fixes:** partition very large tables (e.g., by month), archive old data, use read replicas for reports, or precompute results (summary tables / materialized views).

**When queries were fine and SUDDENLY become slow,** ask "what changed?":

| Possible cause | How to check | Fix |
|----------------|--------------|-----|
| **New deployment** added a query or removed an index | Compare release changes and the slow query list before and after | Add the index, roll back, fix the query |
| **Data grew** past a point (a table went from 1 million to 50 million rows) | Table sizes, plans now doing full scans | Indexes, partitioning, archiving |
| **Outdated statistics** — the optimizer picks a bad plan | Estimated vs actual rows in `EXPLAIN ANALYZE` | `ANALYZE TABLE` (MySQL) / `ANALYZE` (PostgreSQL) |
| **Locks / blocking** — a long transaction holds locks | `SHOW PROCESSLIST`, `pg_stat_activity`, `pg_locks`, lock-wait metrics | Kill the blocker, keep transactions short, don't call external APIs inside a transaction |
| **Connection pool exhausted** — the query is fast, but requests wait for a connection | HikariCP metrics: `pending` connections, `connectionTimeout` errors | Fix connection leaks and slow transactions, size the pool correctly |
| **DB server resources** — CPU, memory, disk I/O full | DB monitoring dashboards | Find the heavy query, scale up, add replicas |
| **Batch job or report** running at the same time | Check scheduled jobs | Move it to off-peak hours or a read replica |
| **Table bloat** (PostgreSQL) after many updates/deletes | Dead-tuple stats | `VACUUM`, tune autovacuum |

**Always measure before and after each change** — confirm the fix with `EXPLAIN ANALYZE` and production metrics.

**Q. Explain transaction isolation levels.**

**Isolation** is the "I" in ACID. It controls **how much one running transaction can see of changes made by other transactions** at the same time. More isolation means more correct data, but less concurrency (more waiting and locking).

**First, the three problems isolation levels protect against:**

1. **Dirty read:** you read data that another transaction changed but **hasn't committed yet**. If it rolls back, you used data that never really existed.
2. **Non-repeatable read:** you read a row, another transaction **updates and commits** it, and when you read the same row again in your transaction, you get a **different value**.
3. **Phantom read:** you run the same query twice (e.g., `WHERE amount > 1000`), and the second time **new rows appear** (or disappear) because another transaction inserted or deleted rows.

**The four isolation levels:**

| Level | Dirty read | Non-repeatable read | Phantom read | Speed |
|-------|-----------|---------------------|--------------|-------|
| **READ UNCOMMITTED** | Possible | Possible | Possible | Fastest |
| **READ COMMITTED** | Prevented | Possible | Possible | Fast |
| **REPEATABLE READ** | Prevented | Prevented | Possible (in the SQL standard) | Medium |
| **SERIALIZABLE** | Prevented | Prevented | Prevented | Slowest |

- **READ UNCOMMITTED:** you can see uncommitted changes. Almost never used.
- **READ COMMITTED:** you only see **committed** data, but each query sees the latest committed data, so values can change within your transaction. **Default in PostgreSQL, Oracle, and SQL Server.** A good choice for most applications.
- **REPEATABLE READ:** rows you've read **stay the same** for the whole transaction. **Default in MySQL (InnoDB)**, which also prevents most phantoms using MVCC snapshots and gap locks.
- **SERIALIZABLE:** transactions behave as if they ran **one after another**. Fully safe, but with the most blocking or failed transactions that need retrying. Used for critical cases like financial calculations where any anomaly is unacceptable.

**How databases do this without heavy locking — MVCC:** PostgreSQL, MySQL InnoDB, and Oracle keep **multiple versions** of a row. Readers see a consistent snapshot, so **readers don't block writers and writers don't block readers**.

**Setting it in Spring:**

```java
@Transactional(isolation = Isolation.READ_COMMITTED)
public void processPayment(...) { ... }
```

**Important practical point:** isolation levels alone don't solve the **lost update** problem — two transactions read balance = 100, both subtract, both write, and one update is lost. For that, use:
- **Optimistic locking:** a `@Version` column; the second update fails and you retry.
- **Pessimistic locking:** `SELECT ... FOR UPDATE` (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) — locks the row until commit.
- **Atomic SQL:** `UPDATE account SET balance = balance - 50 WHERE id = 1 AND balance >= 50`.

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

**Q. An API is slow in production. How do you debug it?**

Follow a fixed order — **measure first, then narrow down**. Don't start by changing code.

**1. Understand the problem:**
- Is it **one endpoint or all of them**? All endpoints slow → shared problem (CPU, GC, DB, network). One endpoint → its own code or query.
- **Always slow or only sometimes?** Only under load → a shared resource is running out. Only for some users → specific data (a customer with 1 million orders).
- **When did it start?** Match the time with deployments, config changes, traffic increases, or batch jobs.

**2. Check the metrics dashboard (Grafana / APM)** for that time window:
- Latency **p95/p99** (not just the average), request rate, error rate.
- **JVM:** CPU, heap usage, **GC pause time**, thread count.
- **Tomcat:** busy threads vs max threads.
- **HikariCP:** active, idle, and **pending** connections.
- Downstream services: their latency and error rates.

**3. Trace a slow request** with distributed tracing (Zipkin, Jaeger, Tempo, or an APM tool). The trace shows a timeline of every step — controller, each DB query, each HTTP call — so you can see exactly which step takes the time.

**4. Dig into the slow part:**
- **Database:** slow query log, `EXPLAIN ANALYZE`, N+1 queries, missing indexes, lock waits.
- **External API:** its response time, missing timeouts, retries piling up.
- **Inside the JVM:** take **thread dumps** (threads stuck at the same line?) and run a **profiler** (async-profiler, Java Flight Recorder) to find CPU-heavy methods.
- **GC:** long or frequent pauses mean memory pressure.

**5. Fix, then confirm with metrics.** Common fixes: add an index, fix N+1, add caching, add timeouts and circuit breakers, size pools correctly, move slow work to async processing, paginate large responses, or scale out.

**6. Prevent it next time:** alerts on p99 latency per endpoint, load tests before releases, and a short post-incident review.

**Q. CPU is high after a deployment. How do you find the cause?**

Since it started **after a deployment**, the new code or config is the main suspect. First decide whether to **roll back** — if users are affected, roll back to restore service and investigate on the side.

**Find what's using the CPU:**

1. **Confirm it's the Java process:** `top` or `htop` on the server, or `kubectl top pod` in Kubernetes.
2. **Check whether it's GC:** look at GC metrics or run `jstat -gcutil <pid> 1000`. If GC runs constantly, the CPU is busy **cleaning memory** — that's a memory problem (a leak or a much bigger allocation rate), not a code-loop problem.
3. **Find the hot threads:**
   ```bash
   top -H -p <pid>                    # list threads by CPU usage; note the top thread ID
   printf '%x\n' <threadId>           # convert it to hex, e.g., 4a3f
   jstack <pid> > dump.txt            # take a thread dump
   # search dump.txt for nid=0x4a3f → that thread's stack shows the exact code
   ```
   Take 3–4 dumps a few seconds apart. A thread showing the **same stack each time** is your hot spot.
4. **Profile it:** **async-profiler** or **Java Flight Recorder** gives a **flame graph** — the widest bars are the methods using the most CPU. This is the most reliable way to find the cause.
5. **Compare with the release:** what changed in this deployment? New library version, new logging, new feature, changed config.

**Common causes:**
- **Infinite or very long loops**, e.g., a `while` condition that never becomes false, or a retry loop with no delay.
- **Inefficient code** on a hot path: nested loops over big lists (O(n²)), repeated regex compilation, building huge strings, heavy JSON parsing.
- **Too much logging** — e.g., DEBUG level enabled in production, or logging large objects.
- **GC pressure** from creating many temporary objects, or from a memory leak.
- **Thread contention / spinning:** many threads fighting for the same lock, or busy-waiting loops.
- **A HashMap used by many threads** without synchronization — in old Java versions this could cause an infinite loop.
- **Retry storms:** missing backoff makes the app retry a failing call in a tight loop.
- **Smaller container CPU limit** in the new config, which causes **throttling**.

**After the fix:** add CPU and GC alerts, and run load tests that compare CPU usage before and after each release.

**Q. How do you identify a memory leak? How do you analyze a heap dump?**

**A memory leak in Java** means objects are **still referenced** (so GC can't remove them) even though the application doesn't need them anymore. The heap keeps growing until `OutOfMemoryError`.

**How to recognize it:**
- In the heap graph, look at memory usage **right after each full GC**. In a healthy app it returns to roughly the same level. With a leak, this **baseline keeps rising** over hours or days — a "staircase" pattern.
- GC runs more and more often and frees less and less, CPU rises because of GC, and finally `OutOfMemoryError: Java heap space`.

**Take a heap dump** (a snapshot of every object in memory):

```bash
# Automatically when OOM happens — always set this in production
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps

# Manually from a running app
jcmd <pid> GC.heap_dump /tmp/heap.hprof
jmap -dump:live,format=b,file=/tmp/heap.hprof <pid>
```

Note: taking a dump pauses the app and the file is about the size of the heap. Do it on one instance, ideally after removing it from the load balancer.

**Analyze it with Eclipse MAT (Memory Analyzer Tool)**, VisualVM, or IntelliJ's profiler:

1. **Leak Suspects report** (MAT): automatically points to the objects holding the most memory — often enough to find the problem.
2. **Dominator tree:** lists objects by **retained size** — the memory that would be freed if that object were removed. A single `HashMap` or `ArrayList` retaining 2 GB is a strong sign.
3. **Histogram:** counts objects by class. Millions of `byte[]`, `String`, or one of your own classes (`OrderDTO`) shows what's piling up.
4. **Path to GC roots:** for a suspicious object, this shows **the chain of references keeping it alive** — for example, `static field CACHE → HashMap → entries → OrderDTO`. This tells you exactly which code holds it.
5. **Compare two dumps** taken some time apart: the classes that keep growing are the leak.

**Common causes of leaks:**
- **Static collections / caches without limits** — a `static Map` that only gets new entries. Fix: use a bounded cache (Caffeine with `maximumSize` and `expireAfterWrite`).
- **`ThreadLocal` not cleared** in thread pools.
- **Listeners or callbacks registered and never removed.**
- **Unclosed resources** — streams, connections, result sets. Use try-with-resources.
- **Objects with a mutable key in a `HashMap`** — the key's hashCode changes, so the entry can never be found or removed.
- **Classloader leaks** after redeploying in an app server.
- **Large session data** or huge query results loaded fully into memory.

**Not everything is a leak:** if the heap is simply too small for real traffic (memory grows with load and drops after), increase the heap or reduce what you load at once. If the container is killed with **OOMKilled** (exit code 137) but there's no Java OOM, the **total** memory (heap + metaspace + thread stacks + direct buffers) is above the container limit — set `-XX:MaxRAMPercentage=75` so the heap leaves room for the rest.

**Q. How do you analyze a thread dump? How do you debug a deadlock?**

**A thread dump** is a snapshot of **every thread in the JVM**: its name, its state, and the exact line of code (stack trace) it's running. It is the best tool for apps that **hang, are slow, or have high CPU**.

**Take one:**
```bash
jstack <pid> > dump1.txt
jcmd <pid> Thread.print > dump1.txt
kill -3 <pid>                 # prints the dump to the app's console output
```
Spring Boot Actuator also offers `/actuator/threaddump`. **Always take 3–5 dumps, 5–10 seconds apart** — one dump is a single moment; several show which threads are really stuck.

**Thread states to know:**

| State | Meaning |
|-------|---------|
| `RUNNABLE` | Running or ready to run (also shows threads waiting on a socket read) |
| `BLOCKED` | Waiting to enter a `synchronized` block that another thread holds |
| `WAITING` | Waiting forever for another thread (`wait()`, `join()`, `LockSupport.park()`) |
| `TIMED_WAITING` | Waiting with a timeout (`sleep()`, `wait(ms)`, a poll with a timeout) |

**How to read it — look for patterns:**
- **Many threads `BLOCKED` on the same lock** → lock contention. Find the thread that **holds** that lock (`- locked <0x...>`) and see what it's doing.
- **Many threads `WAITING` in `HikariPool.getConnection`** → the DB connection pool is exhausted.
- **Many threads `RUNNABLE` in `SocketInputStream.read`** → waiting for a slow DB or API, probably with no timeout.
- **The same `RUNNABLE` stack in every dump**, using CPU → a hot loop.
- **The total thread count keeps growing** → a thread leak (threads or executors created and never shut down).

Tools that make reading easier: **fastthread.io**, IntelliJ, VisualVM, or TDA (Thread Dump Analyzer).

**Deadlock:** two (or more) threads each hold a lock and wait for the lock the other holds — neither can ever continue.

```text
Thread-1: holds lock A, waiting for lock B
Thread-2: holds lock B, waiting for lock A
```

**Debugging a deadlock:**
- The JVM detects Java-level deadlocks automatically. At the bottom of the thread dump you'll see **"Found one Java-level deadlock"** with the threads involved, which lock each holds, and which lock each is waiting for, plus the exact lines of code.
- In code: `ThreadMXBean.findDeadlockedThreads()` can detect it for monitoring.
- Symptoms: the app (or some requests) hangs completely, CPU is **low**, and the same threads are `BLOCKED` in every dump.

**Fixing and preventing deadlocks:**
- **Always take locks in the same order** everywhere — e.g., lock the account with the smaller ID first. This is the most important fix.
- Use `tryLock(timeout)` so a thread gives up instead of waiting forever.
- Keep synchronized blocks **small**, and never call external services while holding a lock.
- Prefer higher-level tools (`ConcurrentHashMap`, atomics, queues) over manual locking.
- **Database deadlocks** are different: the database detects them and rolls one transaction back with a deadlock error. Fix by updating rows in a consistent order, keeping transactions short, and retrying the failed transaction.

**Q. How do you handle database connection pool exhaustion?**

A **connection pool** (HikariCP in Spring Boot) keeps a fixed number of open DB connections and lends them to requests. **Exhaustion** means all connections are in use, so new requests **wait**, and after `connectionTimeout` (30 seconds by default) they fail with:

```text
HikariPool-1 - Connection is not available, request timed out after 30000ms
```

**Symptoms:** requests suddenly become very slow and then fail; thread dumps show many threads waiting in `HikariPool.getConnection`; metrics show `hikaricp_connections_pending` > 0 and `active` = maximum.

**The pool is usually too small only rarely. Usually connections are held too long. Common causes:**
1. **Slow queries** keep connections busy — fix with indexes and query tuning.
2. **Long transactions** — especially calling an **external API inside `@Transactional`**. The connection is held while waiting for the API. Do the API call outside the transaction.
3. **Connection leaks** — code that gets a connection and doesn't close it (manual JDBC without try-with-resources).
4. **Open Session in View** (`spring.jpa.open-in-view=true`, the default) holds the connection for the **whole request**, including view rendering. Set it to `false`.
5. **Traffic spike** or more app instances than the database can handle.
6. **Lock waits in the DB** — queries waiting on locks while holding connections.

**Fixes and settings:**

```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.connection-timeout=3000        # fail fast (3s) instead of hanging for 30s
spring.datasource.hikari.leak-detection-threshold=20000 # log a stack trace if a connection is held > 20s
spring.jpa.open-in-view=false
```

- **Leak detection** logs exactly which code took a connection and didn't return it.
- **Pool size:** bigger is **not** better. The database can only run a limited number of queries in parallel; too many connections cause more contention. A common starting formula is `connections ≈ (CPU cores × 2) + effective disks` on the DB server, then tune with measurements. Also remember: **pool size × number of app instances** must stay below the DB's `max_connections`.
- Set **query timeouts** so one bad query can't hold a connection forever.
- Use **read replicas** for heavy reads and reports.
- Monitor `active`, `idle`, `pending`, and connection acquire time, and alert when `pending` stays above 0.

**Q. What are cascading failures? What is a real use case of a circuit breaker?**

**A cascading failure** is when **one failing service causes others to fail too**, like dominoes.

**How it happens:**
1. Service C (say, a recommendation service) becomes slow.
2. Service B calls C and waits. B's threads are all stuck waiting for C.
3. B can't serve anything else — even requests that don't need C — so B becomes slow too.
4. Service A calls B, and A's threads fill up as well.
5. Retries from every layer **multiply the load** on C, so C can't recover.
6. The whole system is down because of one non-critical service.

**How to prevent it:**
- **Timeouts** on every remote call — never wait forever.
- **Circuit breakers** — stop calling a service that is failing.
- **Bulkheads** — separate thread pools or connection limits per dependency, so one slow dependency can use only its own share.
- **Limited retries** with exponential backoff and jitter — never retry endlessly.
- **Fallbacks** — return something useful when a dependency fails.
- **Rate limiting and load shedding** — reject extra traffic early instead of collapsing.
- **Async messaging** (Kafka) for work that doesn't need an instant answer.

**How a circuit breaker works** (like an electrical fuse):
- **CLOSED** (normal): calls go through, and failures are counted.
- **OPEN**: when the failure rate passes a threshold (e.g., 50% of the last 20 calls failed or were slow), the breaker opens. Calls **fail immediately** without calling the service, and the fallback runs. This protects your threads and gives the failing service time to recover.
- **HALF_OPEN**: after a wait time (e.g., 30 seconds), a few test calls are allowed. If they succeed → CLOSED again. If they fail → OPEN again.

**Real use case — product page calling a recommendation service:**

The product page in an online store shows "You may also like" recommendations from a separate service. During a sale, the recommendation service slows down. Without a circuit breaker, every product page request waits for it, Tomcat threads run out, and **customers can't even see products or place orders**. With a circuit breaker and a fallback, the page loads without recommendations (or with a cached "best sellers" list), and the important flows keep working.

```java
@CircuitBreaker(name = "recommendations", fallbackMethod = "defaultRecommendations")
@TimeLimiter(name = "recommendations")
public CompletableFuture<List<Product>> getRecommendations(Long productId) {
    return CompletableFuture.supplyAsync(() -> recommendationClient.fetch(productId));
}

private CompletableFuture<List<Product>> defaultRecommendations(Long productId, Throwable ex) {
    return CompletableFuture.completedFuture(cache.getBestSellers());   // safe fallback
}
```

```yaml
resilience4j:
  circuitbreaker:
    instances:
      recommendations:
        sliding-window-size: 20
        failure-rate-threshold: 50
        slow-call-duration-threshold: 2s
        slow-call-rate-threshold: 50
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 3
  timelimiter:
    instances:
      recommendations:
        timeout-duration: 2s
```

Other real examples: a **payment gateway** (when open, show "payment temporarily unavailable" or switch to a backup provider), **SMS/email providers** (queue the message and send it later), and **exchange-rate or address-check APIs** (use the last cached value).

**Q. A Kafka consumer has a lag of millions of messages. How do you fix it?**

**Consumer lag** = the latest message offset in a partition minus the offset the consumer group has processed. A lag of millions means **messages arrive faster than the consumers process them**, or the consumers stopped.

**Step 1 — Find out why (check before scaling):**
- **Are consumers running at all?** Check `kafka-consumer-groups.sh --describe --group <group>` — look at lag per partition and whether each partition has an assigned consumer.
- **Is lag on all partitions or a few?** A few partitions → **hot partitions** (a bad message key sends most traffic to one partition) or one stuck consumer.
- **Rebalance storms:** if processing a batch takes longer than `max.poll.interval.ms`, Kafka thinks the consumer died, removes it, and rebalances — again and again. Logs show frequent "rebalancing" messages.
- **A "poison" message** that fails every time and is retried forever, blocking that partition.
- **Slow processing:** each message makes a slow DB or API call. Check processing time per message.
- **Traffic spike:** producers suddenly sending much more (a backfill, a campaign, a retry storm).

**Step 2 — Fix based on the cause:**

1. **Scale consumers — up to the number of partitions.** In one consumer group, each partition is read by only **one** consumer. With 12 partitions, more than 12 consumers sit idle. If you need more, **increase partitions** (note: this changes which partition a key goes to, so ordering per key is affected during the change).
2. **Make processing faster:**
   - Batch the work — read many records per poll (`max.poll.records`) and do **batch DB inserts/updates** instead of one per message.
   - Remove slow calls from the hot path, add caching, fix slow queries.
   - Process in parallel **inside** a consumer with a worker pool (keep order per key, and commit offsets carefully), or use Confluent's Parallel Consumer.
3. **Stop rebalance storms:** reduce `max.poll.records` or increase `max.poll.interval.ms` so a batch can finish in time; use cooperative-sticky assignment to make rebalances lighter.
4. **Handle poison messages:** retry a few times, then send the message to a **dead letter topic (DLT)** and move on.
   ```java
   @Bean
   DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
       return new DefaultErrorHandler(
           new DeadLetterPublishingRecoverer(template),
           new FixedBackOff(1000L, 3));          // 3 retries, then send to <topic>.DLT
   }
   ```
5. **Fix hot partitions:** choose a better message key that spreads the load evenly.
6. **Drain the backlog safely:** temporarily add more consumer instances (up to the partition count), or run a separate catch-up job. If old messages no longer matter (e.g., stale price updates), you can — with business approval — **reset offsets** to skip them.

**Step 3 — Prevent it:** alert on lag (and on **lag growth rate**, not just size) using Burrow, Kafka exporter + Prometheus, or your cloud's metrics; load test consumers at peak traffic; and autoscale consumers based on lag (e.g., KEDA in Kubernetes).

**Q. How do you handle duplicate messages? How do you make retries idempotent?**

**Why duplicates happen:** Kafka and most message systems guarantee **at-least-once** delivery. If a consumer processes a message but crashes **before committing the offset**, the message is delivered again after restart. Producers retrying after a network error can also send a message twice. HTTP clients retry too. So **your code must assume a message or request can arrive more than once**.

**Idempotent** means: **doing the same operation once or many times gives the same result.** Setting `status = PAID` is idempotent; `balance = balance - 100` is not.

**Ways to make processing idempotent:**

1. **Store processed message IDs** (most common). Each message has a unique ID (an event ID or idempotency key). Before processing, check whether it was already done — in the **same DB transaction** as the business change:
   ```java
   @Transactional
   public void handle(PaymentEvent event) {
       if (processedRepo.existsById(event.getEventId())) {
           return;                                       // duplicate — skip
       }
       paymentService.apply(event);
       processedRepo.save(new ProcessedEvent(event.getEventId()));
   }
   ```
   Put a **unique constraint** on the `event_id` column. Even if two copies are processed at the same moment, the second insert fails and its transaction rolls back.

2. **Use naturally idempotent operations:** an **upsert** (`INSERT ... ON CONFLICT DO NOTHING/UPDATE`) or "set to a value" instead of "add to a value".

3. **Business unique keys:** e.g., a unique constraint on `(order_id, payment_type)` so the same payment can't be recorded twice.

4. **Version or state checks:** "update only if the current status is PENDING" — `UPDATE orders SET status='PAID' WHERE id=? AND status='PENDING'`. A second run changes 0 rows.

5. **Kafka features:**
   - **Idempotent producer** (`enable.idempotence=true`, the default in newer versions) prevents duplicates caused by producer retries.
   - **Transactions / exactly-once** work for Kafka-to-Kafka flows (read → process → write to another topic). They don't cover writes to an external database, so you still need idempotent consumers.

**Idempotency for API retries (e.g., payments):** the client sends an `Idempotency-Key` header (a UUID) with the request. The server saves the key with the result. If the same key comes again, it **returns the saved result** instead of charging again. This is how payment providers like Stripe work.

**When NOT to retry:**
- **Client errors (4xx)** like 400 Bad Request, 401, 403, 404, or validation errors — retrying gives the same failure.
- **Non-idempotent operations without an idempotency key** (like creating a payment) — a retry may do the work twice.
- **When the circuit breaker is open** — the service is known to be down.
- **When the caller has already given up** (its timeout has passed) — the extra work is wasted.
- **Too many attempts** — limit retries (e.g., 3), use exponential backoff with jitter, and avoid retrying at **every layer** (3 layers × 3 retries = 27 calls).

**Q. Random 500 errors are happening, but the logs look clean (or logs are not enough). How do you debug it?**

"Clean logs" usually means the error is **not being logged where you're looking**, or it happens **outside your application code**.

**1. Find out who actually returns the 500:**
- Check the **load balancer, API gateway, ingress (NGINX), or service mesh (Envoy)** logs. A 502/503/504 or 500 can come from them — e.g., the app restarted, a pod was killed, a health check failed, or the upstream timed out — and your app never even saw the request.
- Compare the gateway's request count with the app's request count.

**2. Check whether errors are being swallowed:**
- A `@ControllerAdvice` that returns 500 **without logging** the exception.
- `catch (Exception e) { return null; }` or `e.printStackTrace()` (goes to stdout, not the log system).
- Exceptions thrown in **filters, interceptors, or async threads** (`@Async`, `CompletableFuture`) that never reach your normal handler.
- Logging level set too high (only ERROR), or logs not shipped from some pods.

**3. Find the pattern in the "random" errors:**
- **One pod/instance only?** → a bad node, memory pressure, or old config on that pod.
- **Specific time?** → GC pauses, scheduled jobs, certificate or token refresh, cache expiry.
- **Specific users or data?** → null values, special characters, very large payloads.
- **Specific dependency?** → timeouts to the DB or a downstream service.
- **During deployments?** → no graceful shutdown, so in-flight requests are cut off.

**4. Look at other signals:**
- **Distributed tracing:** find a failed trace and see which span errored.
- **Metrics:** error rate per endpoint, per pod, per status code; JVM/GC; connection pool.
- **Kubernetes:** `kubectl get events`, pod **restarts**, `OOMKilled`, and failing readiness probes.

**5. Improve logging so this doesn't happen again (when logs are not enough):**
- Log **every unhandled exception with its full stack trace** in the global exception handler.
- Add a **correlation/trace ID** to every log line (MDC + Micrometer Tracing) and return it in the response, so a user's error can be matched to the logs.
- Use **structured JSON logs** with context (user ID, order ID, endpoint, duration) in a central system (ELK, Loki, Splunk).
- Temporarily raise the log level for one package at runtime with Actuator `/actuator/loggers`, without redeploying.
- Configure **graceful shutdown** (`server.shutdown=graceful`) so deployments don't cause errors.

**Q. How do you improve observability? What is distributed tracing? Which metrics do you monitor?**

**Observability** means being able to understand **what's happening inside your system from the outside**, so you can answer "why is it slow / failing?" without adding new code. It rests on **three pillars**:

| Pillar | What it tells you | Tools |
|--------|-------------------|-------|
| **Metrics** | Numbers over time — **is something wrong?** (latency, error rate, CPU) | Micrometer + Prometheus + Grafana, Datadog |
| **Logs** | Detailed events — **what exactly happened?** | ELK (Elasticsearch, Logstash, Kibana), Loki, Splunk |
| **Traces** | The path of one request across services — **where is the problem?** | OpenTelemetry, Zipkin, Jaeger, Tempo |

**Distributed tracing:**

In microservices, one user request may go through the gateway → order service → payment service → database → Kafka. When it's slow, logs from 5 services don't tell you **which step** was slow.

Tracing solves this:
- When a request enters, it gets a unique **trace ID**.
- Each step (an HTTP call, DB query, Kafka publish) is recorded as a **span** with a start time, duration, and its parent span.
- The trace ID is **passed along** to every service through HTTP headers (`traceparent` — W3C standard) and Kafka message headers.
- A tracing UI shows the whole request as a **timeline**, so you immediately see that, for example, the payment service took 4 of the 5 seconds.

In Spring Boot 3, add **Micrometer Tracing** with an OpenTelemetry bridge and an exporter. Spring then automatically creates spans for incoming requests, `RestTemplate`/`WebClient` calls, JDBC, and Kafka, and adds `traceId` to the logs through MDC:

```properties
management.tracing.sampling.probability=0.1      # trace 10% of requests in production
logging.pattern.level=%5p [${spring.application.name},%X{traceId},%X{spanId}]
```

**Which metrics to monitor:**

- **The four golden signals** (for every service):
  - **Latency** — p50, p95, p99 response times (averages hide slow requests).
  - **Traffic** — requests per second.
  - **Errors** — error rate (5xx, and unusual 4xx).
  - **Saturation** — how full resources are: CPU, memory, thread pools, connection pools, queue sizes.
- **JVM:** heap usage after GC, GC pause time and frequency, thread count, class loading.
- **Database:** connection pool active/pending, query duration, slow queries, replication lag.
- **Messaging:** Kafka consumer lag, processing time, dead letter topic count.
- **Cache:** hit ratio, evictions, Redis memory and latency.
- **Dependencies:** latency and errors of each downstream service, circuit breaker states.
- **Business metrics:** orders per minute, payment success rate, logins — these often reveal problems that technical metrics miss.

**Good practices to improve observability:**
- Use **structured logs** with a trace ID on every line, in one central place.
- Build a **dashboard per service** with the golden signals.
- **Alert on symptoms users feel** (high p99 latency, high error rate, SLO breaches), not on every CPU spike — too many alerts get ignored.
- Every alert should link to a **runbook** describing what to check.
- Use **OpenTelemetry** as a vendor-neutral standard.
- Define **SLOs** (e.g., 99.9% of requests under 500 ms) and track error budgets.

**Q. How do you detect slow endpoints?**

1. **Per-endpoint latency metrics:** Spring Boot Actuator + Micrometer automatically record `http.server.requests` for each endpoint (tagged with URI, method, and status). In Prometheus/Grafana, show **p95 and p99 per endpoint**:
   ```text
   histogram_quantile(0.99,
     sum(rate(http_server_requests_seconds_bucket[5m])) by (le, uri))
   ```
   Enable percentile histograms: `management.metrics.distribution.percentiles-histogram.http.server.requests=true`.
2. **Sort endpoints by p99 latency and by total time** (`request count × average duration`). An endpoint that's a bit slow but called a million times can matter more than a rare, very slow one.
3. **APM tools** (New Relic, Datadog, Dynatrace, Elastic APM) list the slowest transactions automatically and show the slow DB query or call inside each one.
4. **Distributed tracing:** search for traces longer than a threshold (e.g., `duration > 2s`) and look at the slow span.
5. **Access logs** with response time (Tomcat access log `%D`, or NGINX `$request_time`), analyzed in Kibana or Loki.
6. **Database side:** slow query logs often explain why an endpoint is slow.
7. **Alerts:** alert when an endpoint's p99 stays above its target (e.g., > 1s for 5 minutes).
8. **Before production:** load tests (JMeter, Gatling, k6) in CI to catch slow endpoints before release.

**Q. What is the difference between a cache miss and a cache stampede? How do you prevent stale cache data?**

**Cache miss:** the requested data **is not in the cache**, so the app reads it from the database and usually stores it in the cache for next time. Misses are normal — the first request after startup, or after data expires. Only a **low hit ratio** (lots of misses) is a problem.

**Cache stampede (thundering herd):** a **popular key expires**, and **thousands of requests miss at the same moment**. All of them go to the database together to rebuild the same value. The database gets overloaded and may go down — just because one cache entry expired.

**Preventing a cache stampede:**
1. **Lock so only one request rebuilds the value:** the first request takes a lock and loads from the DB; the others wait briefly and then read the fresh cached value.
   - Inside one JVM: Spring `@Cacheable(sync = true)`, or Caffeine (which loads each key only once).
   - Across instances: a Redis lock — `SET lock:key value NX EX 10`.
2. **Random expiry (jitter):** instead of giving every key exactly 60 minutes, use 55–65 minutes, so many keys don't expire together.
3. **Refresh before expiry:** rebuild hot keys in the background shortly before they expire (Caffeine's `refreshAfterWrite`, or a scheduled job), so they never actually expire.
4. **Serve stale data while refreshing:** return the old value and update it in the background.
5. **Cache warm-up** at startup for known hot keys.

Related problems: **cache penetration** — requests for keys that **don't exist** always go to the DB (fix by caching "not found" for a short time, or using a Bloom filter); **cache avalanche** — many keys expire at once, or Redis goes down (fix with jitter, Redis high availability, and a circuit breaker to the DB).

**Preventing stale cache data** (cache shows old values after the DB changed):
1. **Set a TTL (expiry) on every key** — even if other steps fail, stale data lives only that long. Pick it based on how fresh the data must be.
2. **Evict on update (cache-aside):** after updating the DB, **delete** the cache key. The next read loads fresh data.
   ```java
   @CacheEvict(value = "products", key = "#product.id")
   @Transactional
   public Product update(Product product) { return repo.save(product); }
   ```
   **Delete, don't update,** the cache — two concurrent updates can write cache values in the wrong order.
3. **Evict after the transaction commits**, not before — otherwise another request can re-cache the old value before the commit (use `@TransactionalEventListener(phase = AFTER_COMMIT)`). For extra safety, use a **delayed second delete**.
4. **Multiple instances with local caches:** when one instance updates data, others still have the old value in memory. Publish an **invalidation event** (Redis pub/sub or Kafka) so all instances evict, or use only a shared Redis cache.
5. **Change data capture (CDC):** use Debezium to read DB changes and evict the related cache keys — this also catches changes made outside the app.
6. **Versioned keys:** include a version in the key (`product:42:v7`); a change creates a new key, so the old one is simply never read again.
7. **Don't cache data that must always be exact** (account balances, stock during checkout) — or use a very short TTL and read from the DB for the final decision.

**Q. How do you implement Redis caching in Spring Boot?**

**1. Add dependencies and configuration:**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      timeout: 2s
  cache:
    type: redis
```

**2. Turn on caching and configure TTL and JSON serialization:**

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))                       // default expiry
            .disableCachingNullValues()
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer())); // readable JSON, not Java serialization

        return RedisCacheManager.builder(factory)
            .cacheDefaults(defaults)
            .withCacheConfiguration("products", defaults.entryTtl(Duration.ofHours(1)))   // per-cache TTL
            .build();
    }
}
```

**3. Use the cache annotations:**

```java
@Service
public class ProductService {

    @Cacheable(value = "products", key = "#id", sync = true)     // read: cache first, then DB
    public Product getProduct(Long id) {
        return repo.findById(id).orElseThrow();
    }

    @CachePut(value = "products", key = "#result.id")           // always run, then update cache
    public Product create(Product product) {
        return repo.save(product);
    }

    @CacheEvict(value = "products", key = "#id")                // remove from cache
    public void delete(Long id) {
        repo.deleteById(id);
    }
}
```

- `@Cacheable` — checks the cache; on a miss, runs the method and stores the result. `sync = true` lets only one thread load a missing key (helps prevent stampedes within one instance).
- `@CachePut` — always runs the method and updates the cache.
- `@CacheEvict` — deletes a key (or `allEntries = true` for the whole cache).
- `@Caching` — combine several of the above.

**4. For more control, use `RedisTemplate` directly:**

```java
redisTemplate.opsForValue().set("otp:" + userId, otp, Duration.ofMinutes(5));
String otp = redisTemplate.opsForValue().get("otp:" + userId);
```

**Important points:**
- **The proxy rule applies:** calling a `@Cacheable` method from the same class bypasses the cache (same as `@Transactional`).
- **Always set a TTL.** Set Redis `maxmemory` and an eviction policy (`allkeys-lru`).
- Use **JSON serialization** — Java's default serialization breaks when the class changes and is not readable.
- **Redis down shouldn't mean app down:** add a `CacheErrorHandler` that logs the error and falls back to the DB, with short timeouts.
- **Cache only** data that is read often and changes rarely; avoid caching huge objects.
- Monitor **hit ratio**, memory, evictions, and latency. Use Redis Sentinel or Cluster (or a managed service) for high availability.

**Q. Design a URL shortener.**

**1. Requirements:**
- **Functional:** given a long URL, return a short one (`sho.rt/aZ3kQ9`); opening the short URL **redirects** to the long one. Optional: custom aliases, expiry dates, click analytics.
- **Non-functional:** very fast redirects (< 50 ms), highly available, short codes must be unique and hard to guess.

**2. Rough numbers:** say 100 million new URLs per month and 100:1 reads to writes:
- Writes ≈ 40 per second; reads (redirects) ≈ 4,000 per second, more at peaks.
- Storage: about 500 bytes per record × 1.2 billion per year ≈ 600 GB/year.
- **Short code length:** using Base62 (`a–z`, `A–Z`, `0–9`), 7 characters give 62⁷ ≈ **3.5 trillion** codes — more than enough.

**3. API:**
```text
POST /api/urls      { "longUrl": "https://...", "customAlias": "sale", "expiresAt": "..." }
                    → 201 { "shortUrl": "https://sho.rt/aZ3kQ9" }
GET  /{code}        → 301 or 302 redirect, Location: <long URL>
```
- **301 (permanent):** browsers cache it, which means less load, but you lose click tracking.
- **302 (temporary):** every click comes to your server, which allows analytics. Most shorteners use 302.

**4. Generating the short code — the key design decision:**

| Approach | How it works | Pros / cons |
|----------|--------------|-------------|
| **Hash the URL** (MD5/SHA-256, take the first 7 chars) | Same URL → same code | Collisions are possible → must check the DB and retry |
| **Counter + Base62** | A unique number (1, 2, 3 …) converted to Base62 | **No collisions**, short codes; but codes are guessable and the counter must be shared across servers |
| **Pre-generated keys (Key Generation Service)** | A separate service creates random unused codes in advance; app servers take batches | Fast, no collisions, not guessable; one more service to run |

A practical choice: **a distributed ID generator** (Snowflake-style IDs, or each server reserves a **range** of numbers — e.g., from Redis `INCR` or a DB sequence: server A gets 1–10,000, server B gets 10,001–20,000) **+ Base62 encoding**. Shuffle or mix the number first if codes must not be guessable.

```java
private static final String ALPHABET =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

static String toBase62(long id) {
    StringBuilder sb = new StringBuilder();
    while (id > 0) {
        sb.append(ALPHABET.charAt((int) (id % 62)));
        id /= 62;
    }
    return sb.reverse().toString();
}
```

**5. Data model:**
```text
url_mapping: short_code (PK), long_url, user_id, created_at, expires_at
```
Lookups are always by `short_code`, so a **key-value / NoSQL store** (DynamoDB, Cassandra) fits well and scales easily. A relational DB with an index on `short_code` also works at a moderate scale.

**6. High-level architecture:**
```text
Client → CDN / Load Balancer → URL Service (stateless, many instances)
                                   ├── Redis cache (short_code → long_url)
                                   ├── Database (sharded by short_code)
                                   ├── ID generator (ranges)
                                   └── Kafka → Analytics service (click events)
```

**7. Read path (redirect) — must be very fast:**
1. Look up the code in **Redis**. Most traffic hits a small set of popular links, so the cache hit ratio is very high.
2. On a miss, read from the DB and store it in Redis with a TTL.
3. Return a 302 redirect.
4. **Publish a click event to Kafka asynchronously** — never slow down the redirect to record analytics.

**8. Other points to mention:**
- **Scaling:** stateless services behind a load balancer, DB sharding by `short_code`, read replicas, and a CDN at the edge.
- **Expiry:** check `expires_at` on read; a background job deletes expired links.
- **Custom aliases:** check that the alias is free (unique constraint) before saving.
- **Abuse protection:** rate limit link creation per user/IP, and check long URLs against malware/phishing lists.
- **Same long URL submitted twice:** either return the existing code (needs an index on `long_url`) or create a new one — a product decision.

**Q. Design a rate limiter.**

**A rate limiter** controls **how many requests a client can make in a time window** — for example, 100 requests per minute per user. It protects the system from overload and abuse (bots, brute-force logins, scraping) and enforces API plans (free vs paid). Extra requests get **HTTP 429 Too Many Requests**.

**1. Requirements:**
- Limit by **user ID, API key, or IP address**, with different rules per endpoint (e.g., login: 5 per minute; search: 100 per minute).
- Must work across **many app instances** (a distributed limit).
- Very low added latency (~1 ms), and the system should keep working if the limiter's store fails.
- Return useful headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`.

**2. Where to put it:** usually at the **API gateway** (Spring Cloud Gateway, Kong, NGINX, AWS API Gateway) so bad traffic is rejected before reaching services. It can also run inside a service as a filter for fine-grained business limits.

**3. Algorithms:**

| Algorithm | How it works | Pros / cons |
|-----------|--------------|-------------|
| **Fixed window counter** | Count requests per fixed minute (12:00–12:01); reset each minute | Very simple; but allows bursts at the edges — 100 at 12:00:59 and 100 more at 12:01:00 |
| **Sliding window log** | Store the timestamp of each request; count those in the last 60 seconds | Exact; but uses a lot of memory |
| **Sliding window counter** | Mix of the current and previous window counts, weighted by time | Accurate enough, low memory — a good default |
| **Token bucket** | A bucket holds up to N tokens and refills at a steady rate; each request uses one token; empty bucket → reject | **Allows short bursts** while keeping the average rate — the most widely used |
| **Leaky bucket** | Requests go into a queue that is processed at a fixed rate | Smooth, steady output; bursts wait or are dropped |

**4. Distributed implementation with Redis:** all app instances share the counters in Redis. The check-and-update must be **atomic**, so use a **Lua script** (it runs as one step in Redis) — otherwise two instances could both read "99" and both allow a request.

Simple fixed-window version:

```lua
-- KEYS[1] = "rate:user42:202501011200", ARGV[1] = limit, ARGV[2] = window seconds
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[2])
end
if current > tonumber(ARGV[1]) then
    return 0          -- reject
end
return 1              -- allow
```

In practice, use a ready library instead of writing your own: **Bucket4j** (token bucket with Redis), **Spring Cloud Gateway's `RedisRateLimiter`**, or **Resilience4j RateLimiter** (inside one instance).

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: orders
          uri: lb://order-service
          predicates: [ Path=/api/orders/** ]
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10     # tokens added per second
                redis-rate-limiter.burstCapacity: 20     # bucket size (max burst)
                key-resolver: "#{@userKeyResolver}"      # limit per user
```

**5. Other points to mention:**
- **If Redis is down:** usually **fail open** (allow requests) so a limiter problem doesn't take down the API; fail closed only for sensitive endpoints like login.
- **Performance:** Redis adds about 1 ms. For extremely high traffic, keep a small local count per instance and sync with Redis now and then (slightly less exact).
- **Rules** are stored in config or a DB and can change without redeploying.
- **Clients** should respect `429` + `Retry-After` and retry with backoff.
- Monitor how many requests are rejected, per client and per rule.

**Q. How do you prevent duplicate API requests (e.g., a user clicks "Pay" twice)?**

Duplicate requests happen when a user **double-clicks**, the **network is slow and the client retries**, a **mobile app retries after a timeout**, or a gateway retries. For actions like payments or order creation, a duplicate means **charging twice or creating two orders**.

**Use several layers together:**

**1. Idempotency key (the main solution):**
- The client generates a unique key (a UUID) **once per user action** and sends it in a header: `Idempotency-Key: 7f3c...`. If it retries, it sends the **same** key.
- The server:
  1. Tries to save the key as "IN_PROGRESS" — **atomically** (Redis `SET key value NX EX 86400`, or a DB insert with a **unique constraint**).
  2. If the save succeeds → this is the first request → process it and store the **response** with the key.
  3. If the key already exists and is completed → **return the saved response**; don't process again.
  4. If it exists but is still in progress → return **409 Conflict** (or wait briefly).

```java
@PostMapping("/payments")
public ResponseEntity<PaymentResponse> pay(@RequestHeader("Idempotency-Key") String key,
                                           @RequestBody PaymentRequest req) {
    Boolean firstTime = redis.opsForValue()
        .setIfAbsent("idem:" + key, "IN_PROGRESS", Duration.ofHours(24));

    if (Boolean.FALSE.equals(firstTime)) {
        String saved = redis.opsForValue().get("idem:" + key);
        if ("IN_PROGRESS".equals(saved)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();   // still being processed
        }
        return ResponseEntity.ok(fromJson(saved));                       // return the same result as before
    }

    try {
        PaymentResponse response = paymentService.process(req);
        redis.opsForValue().set("idem:" + key, toJson(response), Duration.ofHours(24));
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        redis.delete("idem:" + key);       // allow a retry if processing failed
        throw e;
    }
}
```

Also check that a reused key comes with the **same request body**; if not, reject it (422).

**2. Database unique constraints (the final safety net):** e.g., unique on `(order_id)` in the payments table, or on `(user_id, client_request_id)`. Even if everything else fails, the database will reject the duplicate insert.

**3. State checks:** process only if the current state allows it — `UPDATE orders SET status='PAID' WHERE id=? AND status='PENDING'`. A second request changes 0 rows and can be ignored.

**4. Client side (helpful, but never enough alone):** disable the button after the first click, show a loading spinner, and debounce clicks. A user can still refresh or the network can still retry, so the server must protect itself.

**5. Locks for concurrent requests:** a short Redis lock on the business key (e.g., `lock:order:123`) stops two identical requests that arrive at the same moment from both processing.

**For messages (Kafka) instead of HTTP,** use the same idea: store processed message IDs with a unique constraint and skip IDs that were already processed.

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
