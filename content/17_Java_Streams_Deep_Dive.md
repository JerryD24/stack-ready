# Java Streams — Deep Dive
### Functional Data Processing | Beginner → Expert

---

## TABLE OF CONTENTS
1. [Why Streams & Stream vs Collection](#1-why-streams)
2. [Creating Streams](#2-creating-streams)
3. [Intermediate Operations](#3-intermediate-operations)
4. [Terminal Operations](#4-terminal-operations)
5. [Collectors Deep Dive](#5-collectors-deep-dive)
6. [flatMap & Nested Data](#6-flatmap-nested-data)
7. [Primitive Streams](#7-primitive-streams)
8. [Optional](#8-optional)
9. [Parallel Streams](#9-parallel-streams)
10. [Lazy Evaluation & Short-Circuiting](#10-lazy-evaluation)
11. [Common Pitfalls](#11-common-pitfalls)
12. [Real-World Examples](#12-real-world-examples)
13. [Interview Q&A](#13-interview-qa)

---

## 1. Why Streams

A **Stream** is a sequence of elements supporting **declarative, functional-style** operations. It is *not* a data structure — it carries no storage; it pulls from a source (collection, array, I/O, generator).

| Collection | Stream |
|------------|--------|
| Stores data | Carries data (no storage) |
| External iteration (`for`) | Internal iteration (you say *what*, not *how*) |
| Reusable | **Single-use** (consume once, then it's closed) |
| Eager | **Lazy** (nothing runs until a terminal op) |
| Mutable | Encourages immutability / no side effects |

```java
// Imperative
List<String> result = new ArrayList<>();
for (User u : users) if (u.isActive()) result.add(u.getName().toUpperCase());

// Declarative (stream)
List<String> result = users.stream()
    .filter(User::isActive)
    .map(u -> u.getName().toUpperCase())
    .collect(Collectors.toList());
```

**Anatomy:** `source → 0..n intermediate ops → 1 terminal op`. Intermediate ops are **lazy** and return a new Stream; the terminal op triggers execution and produces a result/side effect.

> **Single-use trap:** reusing a stream throws `IllegalStateException: stream has already been operated upon or closed`.

---

## 2. Creating Streams

```java
list.stream();                          // from a Collection
Arrays.stream(arr);                     // from an array
Stream.of("a", "b", "c");               // from values
Stream.empty();                         // empty stream
Stream.iterate(1, n -> n * 2).limit(10);        // infinite -> must bound
Stream.generate(Math::random).limit(5);          // infinite supplier
IntStream.range(0, 10);                  // 0..9   (rangeClosed = 0..10)
"a,b,c".chars();                         // IntStream of chars
Pattern.compile(",").splitAsStream("a,b,c");
Files.lines(Path.of("data.txt"));        // stream a file lazily (close it!)
new Random().ints(5, 0, 100);            // random IntStream
```
For infinite streams (`iterate`, `generate`) you **must** apply a short-circuiting op like `limit`/`findFirst`.

---

## 3. Intermediate Operations

All return a new Stream and are **lazy**.

| Op | Purpose |
|----|---------|
| `filter(Predicate)` | Keep matching elements |
| `map(Function)` | Transform each element |
| `flatMap(Function)` | Flatten nested streams (1→many) |
| `distinct()` | Remove duplicates (uses `equals`) |
| `sorted()` / `sorted(Comparator)` | Order |
| `peek(Consumer)` | Debug/side-effect (don't abuse) |
| `limit(n)` / `skip(n)` | Truncate / drop |
| `takeWhile` / `dropWhile` (Java 9+) | Take/drop while predicate holds |
| `mapToInt/Long/Double` | To primitive stream |
| `mapMulti` (Java 16+) | Imperative-style 1→many, less allocation than flatMap |

```java
users.stream()
     .filter(u -> u.getAge() >= 18)
     .sorted(Comparator.comparing(User::getName).thenComparing(User::getAge))
     .map(User::getEmail)
     .distinct()
     .limit(100);
```

**`takeWhile` vs `filter`:** `takeWhile` stops at the first non-match (assumes ordered/sorted data); `filter` scans everything.

---

## 4. Terminal Operations

Trigger execution; the stream is consumed after.

| Op | Returns |
|----|---------|
| `collect(Collector)` | Mutable reduction (List, Map, String...) |
| `toList()` (Java 16+) | Unmodifiable list (shortcut) |
| `forEach` / `forEachOrdered` | Side effect |
| `reduce` | Single value reduction |
| `count` | `long` |
| `min` / `max` | `Optional` |
| `anyMatch` / `allMatch` / `noneMatch` | `boolean` (short-circuit) |
| `findFirst` / `findAny` | `Optional` (short-circuit) |
| `toArray` | array |

```java
int total = orders.stream().mapToInt(Order::getQty).sum();
Optional<User> first = users.stream().filter(User::isAdmin).findFirst();
boolean anyExpired = tokens.stream().anyMatch(Token::isExpired);

// reduce: identity + accumulator
int sum = nums.stream().reduce(0, Integer::sum);
Optional<Integer> max = nums.stream().reduce(Integer::max);
```
`reduce` must be **associative** and stateless to be parallel-safe.

---

## 5. Collectors Deep Dive

The most powerful and most-asked part.
```java
import static java.util.stream.Collectors.*;

// To collections
List<X> l   = s.collect(toList());
Set<X> set  = s.collect(toSet());
List<X> ul  = s.collect(toUnmodifiableList());
TreeSet<X> ts = s.collect(toCollection(TreeSet::new));

// To map (watch for duplicate keys!)
Map<Long, User> byId = users.stream()
    .collect(toMap(User::getId, u -> u));
Map<String, Integer> merged = items.stream()
    .collect(toMap(Item::getName, Item::getQty, Integer::sum));  // merge fn for dup keys

// Joining strings
String csv = names.stream().collect(joining(", ", "[", "]"));

// Grouping
Map<Dept, List<Employee>> byDept = emps.stream()
    .collect(groupingBy(Employee::getDept));

// Grouping + downstream collector
Map<Dept, Long> countByDept = emps.stream()
    .collect(groupingBy(Employee::getDept, counting()));
Map<Dept, Double> avgSalary = emps.stream()
    .collect(groupingBy(Employee::getDept, averagingDouble(Employee::getSalary)));
Map<Dept, List<String>> namesByDept = emps.stream()
    .collect(groupingBy(Employee::getDept, mapping(Employee::getName, toList())));

// Partitioning (boolean key)
Map<Boolean, List<User>> parts = users.stream()
    .collect(partitioningBy(User::isActive));

// Statistics in one pass
IntSummaryStatistics stats = emps.stream()
    .collect(summarizingInt(Employee::getAge));
// stats.getAverage(), getMax(), getMin(), getSum(), getCount()

// teeing (Java 12) — two collectors, then combine
record MinMax(int min, int max) {}
MinMax mm = nums.stream().collect(teeing(minBy(naturalOrder()), maxBy(naturalOrder()),
    (min, max) -> new MinMax(min.orElse(0), max.orElse(0))));
```

**`toMap` duplicate-key trap:** without a merge function, duplicate keys throw `IllegalStateException`. Always supply a merge function when keys may collide.

---

## 6. flatMap & Nested Data

`flatMap` flattens a stream-of-streams into one stream (one-to-many).
```java
List<List<Integer>> nested = List.of(List.of(1,2), List.of(3,4));
List<Integer> flat = nested.stream()
    .flatMap(List::stream)            // Stream<List<Integer>> -> Stream<Integer>
    .collect(toList());               // [1, 2, 3, 4]

// All order line-items across all orders
List<Item> allItems = orders.stream()
    .flatMap(o -> o.getItems().stream())
    .collect(toList());

// Split sentences into words
List<String> words = lines.stream()
    .flatMap(line -> Arrays.stream(line.split("\\s+")))
    .collect(toList());
```
`map` = 1→1; `flatMap` = 1→many flattened.

---

## 7. Primitive Streams

`IntStream`, `LongStream`, `DoubleStream` avoid boxing overhead and add numeric ops.
```java
int sum = IntStream.rangeClosed(1, 100).sum();
OptionalDouble avg = arr.stream().mapToInt(Integer::intValue).average();
int[] squares = IntStream.range(0, 5).map(i -> i * i).toArray();

// box / unbox
Stream<Integer> boxed = IntStream.range(0,5).boxed();
IntStream back = list.stream().mapToInt(Integer::intValue);
```
Prefer primitive streams for heavy numeric work — no `Integer` boxing per element.

---

## 8. Optional

A container to model "value or absence" — avoid `NullPointerException` and explicit null checks.
```java
Optional<User> u = repo.findById(id);

user.map(User::getEmail).orElse("no-email");           // transform or default
user.filter(User::isActive).ifPresent(this::notify);   // conditional
user.orElseThrow(() -> new NotFoundException(id));      // throw if empty
user.flatMap(User::getManager);                          // chain Optional-returning calls
user.ifPresentOrElse(this::process, this::handleMissing); // Java 9
String name = user.map(User::getName).orElseGet(this::computeDefault); // lazy default
```
**Best practices:** use `Optional` for return types, **not** for fields or method parameters. Don't call `.get()` without checking. Prefer `orElseGet` (lazy) over `orElse` (eager) when the default is expensive.

---

## 9. Parallel Streams

```java
long count = list.parallelStream().filter(this::heavyCheck).count();
int sum = list.stream().parallel().mapToInt(this::compute).sum();
```
- Runs on the shared `ForkJoinPool.commonPool()` (size = cores − 1 by default).
- **Use when:** large dataset, splittable source (array/ArrayList), **stateless + associative** ops, CPU-bound work.
- **Avoid when:** small data, I/O-bound tasks, ordered/stateful ops, or operations with shared mutable state.
- `forEachOrdered` preserves order (slower); `forEach` does not in parallel.

> **Production warning:** parallel streams hijack the common pool JVM-wide. Don't do blocking I/O inside them. To isolate, run inside your own `ForkJoinPool`. For I/O-bound concurrency, prefer `CompletableFuture` or virtual threads.

---

## 10. Lazy Evaluation

Intermediate ops do nothing until a terminal op runs, and the pipeline processes elements **one at a time** (not stage-by-stage). This enables **short-circuiting**.
```java
Optional<String> r = Stream.of("a", "bb", "ccc", "dddd")
    .filter(s -> { System.out.println("filter " + s); return s.length() > 1; })
    .map(s -> { System.out.println("map " + s); return s.toUpperCase(); })
    .findFirst();
// Prints: filter a, filter bb, map bb  — STOPS after first match (never touches ccc/dddd)
```
Short-circuiting ops: `findFirst`, `findAny`, `anyMatch`, `allMatch`, `noneMatch`, `limit`. They let you work with infinite streams.

---

## 11. Common Pitfalls

- **Reusing a stream** → `IllegalStateException`. Create a fresh one each time.
- **Side effects in `map`/`filter`** → breaks parallelism and laziness. Keep them pure.
- **Mutating shared state in `forEach`** → race conditions; use `collect`/`reduce` instead.
- **`peek` for logic** → `peek` may be skipped by optimizations; use only for debugging.
- **`toMap` duplicate keys** → supply a merge function.
- **Overusing parallel** → often slower than sequential; measure first.
- **`Optional.get()` without check** → `NoSuchElementException`. Use `orElse*`.
- **Forgetting to close I/O streams** (`Files.lines`) → resource leak; use try-with-resources.
- **Premature `collect` then re-stream** → keep the pipeline going instead.

---

## 12. Real-World Examples

```java
// 1. Group orders by customer, sum revenue
Map<Long, BigDecimal> revenueByCustomer = orders.stream()
    .collect(groupingBy(Order::getCustomerId,
             mapping(Order::getAmount, reducing(BigDecimal.ZERO, BigDecimal::add))));

// 2. Top 5 products by quantity sold
List<String> top5 = orders.stream()
    .flatMap(o -> o.getItems().stream())
    .collect(groupingBy(Item::getProduct, summingInt(Item::getQty)))
    .entrySet().stream()
    .sorted(Map.Entry.<String,Integer>comparingByValue().reversed())
    .limit(5).map(Map.Entry::getKey).collect(toList());

// 3. Build a lookup index
Map<String, User> byEmail = users.stream()
    .collect(toMap(User::getEmail, identity(), (a, b) -> a));

// 4. Validate a batch, collect errors
List<String> errors = records.stream()
    .filter(r -> !r.isValid())
    .map(r -> "Invalid: " + r.getId())
    .collect(toList());

// 5. Frequency count (word histogram)
Map<String, Long> freq = words.stream()
    .collect(groupingBy(identity(), counting()));

// 6. CSV line -> objects
List<User> parsed = lines.stream()
    .skip(1)                              // header
    .map(line -> line.split(","))
    .map(c -> new User(c[0], c[1]))
    .collect(toList());
```

---

## 13. Interview Q&A

**Q1. Stream vs Collection?**
Collection stores data and is iterated externally; a Stream carries data, is iterated internally, is lazy, and is single-use.

**Q2. Intermediate vs terminal operations?**
Intermediate ops are lazy and return a Stream (`filter`, `map`). Terminal ops trigger execution and produce a result/side effect (`collect`, `count`, `forEach`). Nothing runs until a terminal op.

**Q3. `map` vs `flatMap`?**
`map` is 1→1 transform. `flatMap` is 1→many and flattens nested streams into one.

**Q4. Is a stream reusable?**
No. After a terminal op the stream is consumed; reusing throws `IllegalStateException`.

**Q5. How does laziness help?**
It enables short-circuiting (stop early via `findFirst`/`limit`) and lets you process infinite streams; elements flow one-at-a-time through the pipeline.

**Q6. When are parallel streams a bad idea?**
Small data, I/O-bound work, stateful/ordered ops, or shared mutable state. They also share the common pool JVM-wide.

**Q7. `findFirst` vs `findAny`?**
`findFirst` returns the first encounter-order element; `findAny` may return any (better for parallel performance).

**Q8. `reduce` requirements for parallel correctness?**
Identity, associativity, and statelessness; the combiner must be compatible with the accumulator.

**Q9. How to avoid `toMap` failures?**
Provide a merge function for duplicate keys (and optionally a map supplier).

**Q10. `orElse` vs `orElseGet`?**
`orElse(x)` always evaluates `x` (eager). `orElseGet(supplier)` evaluates only when empty (lazy) — prefer it when the default is expensive.
