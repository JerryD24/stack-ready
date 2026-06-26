# Java — Core to Advanced
### Complete Interview Guide | Beginner → Advanced

---

## TABLE OF CONTENTS
1. [JVM, JDK, JRE Architecture](#1-jvm-jdk-jre)
2. [Data Types & Memory](#2-data-types--memory)
3. [Object-Oriented Programming](#3-object-oriented-programming)
4. [String Deep Dive](#4-string-deep-dive)
5. [Java Collections Framework](#5-java-collections-framework)
6. [Generics](#6-generics)
7. [Exception Handling](#7-exception-handling)
8. [Java 8 Features](#8-java-8-features)
9. [Java 9–21 Features](#9-java-921-features)
10. [Multithreading & Concurrency](#10-multithreading--concurrency)
11. [JVM Internals & GC](#11-jvm-internals--garbage-collection)
12. [Design Patterns](#12-design-patterns)
13. [DEEP DIVE: HashMap Internals (Java 7 vs 8+)](#13-deep-dive-hashmap-internals-java-7-vs-8)
14. [DEEP DIVE: Red-Black Tree in HashMap](#14-deep-dive-red-black-tree-in-hashmap)
15. [DEEP DIVE: ConcurrentHashMap (Complete)](#15-deep-dive-concurrenthashmap-complete)
16. [DEEP DIVE: volatile vs Atomic Variables](#16-deep-dive-volatile-vs-atomic-variables)
17. [DEEP DIVE: default Keyword in Interfaces (Java 8)](#17-deep-dive-default-keyword-in-interfaces-java-8)
18. [Real Interview Code Puzzles & Traps](#18-real-interview-code-puzzles--traps)
19. [Coding Problems with Solutions](#19-coding-problems-with-solutions)
20. [Tough Interview Q&A Bank](#20-tough-interview-qa-bank)
21. [INTERVIEW Q&A — JAVA](#interview-qa--java)
22. [Additional Core Java Interview Q&A](#22-additional-core-java-interview-qa)

---

## 1. JVM, JDK, JRE

```
JDK (Java Development Kit)
 ├── JRE (Java Runtime Environment)
 │    ├── JVM (Java Virtual Machine)
 │    │    ├── ClassLoader Subsystem
 │    │    ├── Runtime Data Areas (Heap, Stack, Method Area, etc.)
 │    │    └── Execution Engine (Interpreter + JIT Compiler)
 │    └── Core Libraries (java.lang, java.util, etc.)
 └── Development Tools (javac, javadoc, jar, etc.)
```

| | JDK | JRE | JVM |
|--|-----|-----|-----|
| Purpose | Develop + Run | Run only | Execute bytecode |
| Contains | JRE + tools | JVM + libraries | Runtime engine |
| Use case | Developers | End users | Inside JRE |

**How Java code runs:**
```
Source Code (.java)
      ↓ javac (compiler)
Bytecode (.class)
      ↓ ClassLoader
JVM loads into memory
      ↓ Execution Engine
Interpreter (line by line) + JIT Compiler (hot code → native)
      ↓
Native Machine Code
```

**Platform Independence**: Java is WORA (Write Once Run Anywhere) because `.class` bytecode is platform-independent. The JVM is platform-specific.

---

## 2. Data Types & Memory

### Primitive Types
| Type | Size | Default | Range |
|------|------|---------|-------|
| `byte` | 1 byte | 0 | -128 to 127 |
| `short` | 2 bytes | 0 | -32,768 to 32,767 |
| `int` | 4 bytes | 0 | -2^31 to 2^31-1 |
| `long` | 8 bytes | 0L | -2^63 to 2^63-1 |
| `float` | 4 bytes | 0.0f | ~±3.4e38 |
| `double` | 8 bytes | 0.0d | ~±1.7e308 |
| `char` | 2 bytes | '\u0000' | 0 to 65,535 |
| `boolean` | ~1 bit | false | true/false |

### Wrapper Classes
```java
int x = 5;
Integer obj = x;          // Autoboxing
int y = obj;              // Unboxing

Integer a = 127;
Integer b = 127;
System.out.println(a == b);   // true (cached -128 to 127)

Integer c = 128;
Integer d = 128;
System.out.println(c == d);   // false (new objects)
System.out.println(c.equals(d)); // true
```
> **Interview Trap**: Integer cache is -128 to 127. Beyond that, `==` returns false.

### Pass by Value
```java
// Java is ALWAYS pass by value
void change(int x) { x = 10; }      // primitive: original unchanged
void change(int[] arr) { arr[0]=10; } // reference: original CHANGED (ref copied, same object)
void change(String s) { s = "new"; }  // String: original unchanged (immutable + new ref)
```

---

## 3. Object-Oriented Programming

### The 4 Pillars

#### 3.1 Encapsulation
```java
public class BankAccount {
    private double balance;  // hidden

    public double getBalance() { return balance; }  // controlled access
    public void deposit(double amount) {
        if (amount > 0) balance += amount;          // validation logic
    }
}
```

#### 3.2 Inheritance
```java
class Animal {
    String name;
    void eat() { System.out.println(name + " eats"); }
}

class Dog extends Animal {
    void bark() { System.out.println("Woof!"); }
}

// Java supports: Single, Multilevel, Hierarchical
// Java does NOT support Multiple inheritance via classes (diamond problem)
// But supports it via Interfaces!
```

#### 3.3 Polymorphism

**Compile-time (Method Overloading):**
```java
class Calculator {
    int add(int a, int b) { return a + b; }
    double add(double a, double b) { return a + b; }  // different params
    int add(int a, int b, int c) { return a + b + c;} // different count
    // Return type alone CANNOT overload
}
```

**Runtime (Method Overriding):**
```java
class Shape {
    double area() { return 0; }
}
class Circle extends Shape {
    double radius;
    @Override
    double area() { return Math.PI * radius * radius; }
}

Shape s = new Circle();  // Upcasting
s.area();  // Calls Circle's area() → Dynamic Method Dispatch
```

**Rules for overriding:**
- Same method name, same params
- Return type: same OR covariant (subtype)
- Access modifier: same OR more permissive
- Cannot override `static`, `final`, `private` methods
- Can throw narrower checked exceptions

#### 3.4 Abstraction

**Abstract Class:**
```java
abstract class Vehicle {
    abstract void start();          // must implement
    void stop() { System.out.println("Stopped"); }  // can have body
    // Can have constructors, instance variables
    // Can have any access modifiers
}
```

**Interface:**
```java
interface Flyable {
    double MAX_ALTITUDE = 10000;  // implicitly public static final

    void fly();                   // implicitly public abstract

    default void land() {         // Java 8: default method with body
        System.out.println("Landing...");
    }

    static void checkWeather() {  // Java 8: static method
        System.out.println("Checking weather");
    }

    private void helper() {       // Java 9: private method
        System.out.println("Helper");
    }
}
```

**Abstract class vs Interface:**
| | Abstract Class | Interface |
|--|---------------|-----------|
| Instantiation | No | No |
| Constructor | Yes | No |
| Instance variables | Yes | No (only constants) |
| Multiple inheritance | No | Yes |
| Methods | Abstract + concrete | Abstract + default + static (Java 8+) |
| Use when | "is-a" with shared code | "can-do" / capability |

### 3.5 Object Class Methods
```java
// Every class implicitly extends Object
public class Person {
    String name;
    int age;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Person)) return false;
        Person p = (Person) o;
        return age == p.age && Objects.equals(name, p.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, age);  // MUST override when equals() is overridden
    }

    @Override
    public String toString() {
        return "Person{name=" + name + ", age=" + age + "}";
    }
}
```

> **Golden Rule**: If two objects are equal (`equals()` returns true), they MUST have the same `hashCode()`. The reverse is NOT required (hash collisions allowed).

### 3.6 Static Keyword
```java
class Counter {
    static int count = 0;     // shared across all instances
    int id;

    static {                  // static block: runs once when class loads
        System.out.println("Class loaded");
    }

    Counter() {
        count++;
        id = count;
    }

    static int getCount() {   // static method: no 'this'
        return count;
        // can't access 'id' directly here
    }
}
```

### 3.7 final keyword
```java
final int x = 10;          // constant variable, can't reassign
final class String {...}   // can't extend (String, Integer are final)
final void method() {}     // can't override in subclass
```

### 3.8 Nested Classes
```java
class Outer {
    class Inner {}                    // inner class (has Outer reference)
    static class StaticNested {}      // static nested (no Outer reference)
    void method() {
        class Local {}                // local class (inside method)
        Runnable r = new Runnable(){  // anonymous class
            public void run() {}
        };
    }
}
```

---

## 4. String Deep Dive

### String Immutability
```java
String s = "Hello";       // stored in String Pool
String s2 = "Hello";      // same reference from pool
String s3 = new String("Hello");  // new object on heap

System.out.println(s == s2);    // true (same pool reference)
System.out.println(s == s3);    // false (different objects)
System.out.println(s.equals(s3)); // true (same content)
```

**Why String is immutable?**
1. Thread safety (can be shared without synchronization)
2. String Pool (reuse is possible only if immutable)
3. Security (passwords, file paths can't be modified)
4. HashCode caching (used as HashMap keys safely)

### String vs StringBuilder vs StringBuffer
| | String | StringBuilder | StringBuffer |
|--|--------|--------------|--------------|
| Mutability | Immutable | Mutable | Mutable |
| Thread Safety | Yes (immutable) | No | Yes (synchronized) |
| Performance | Slow (concatenation) | Fastest | Slower than SB |
| Use case | Constants, keys | Single-threaded | Multi-threaded |

```java
// String concatenation in loop = BAD (creates many objects)
String s = "";
for(int i = 0; i < 1000; i++) s += i;  // creates 1000+ objects!

// StringBuilder = GOOD
StringBuilder sb = new StringBuilder();
for(int i = 0; i < 1000; i++) sb.append(i);
String result = sb.toString();
```

### Important String Methods
```java
String s = "Hello World";
s.length()           // 11
s.charAt(0)          // 'H'
s.indexOf("World")   // 6
s.substring(6)       // "World"
s.substring(0, 5)    // "Hello"
s.toLowerCase()      // "hello world"
s.toUpperCase()      // "HELLO WORLD"
s.trim()             // removes leading/trailing spaces
s.strip()            // Java 11: Unicode-aware trim
s.replace("World","Java")  // "Hello Java"
s.split(" ")         // ["Hello", "World"]
s.contains("Hello")  // true
s.startsWith("He")   // true
s.endsWith("ld")     // true
s.isEmpty()          // false
s.isBlank()          // Java 11: false (checks whitespace too)
s.toCharArray()      // char[]
String.valueOf(42)   // "42"
String.format("Hi %s, you are %d", "Alice", 25)
"  hi  ".strip()     // "hi"
"ha".repeat(3)       // "hahaha" (Java 11)
"line1\nline2".lines().collect(Collectors.toList())  // Java 11
```

---

## 5. Java Collections Framework

### Hierarchy
```
Iterable
  └── Collection
        ├── List (ordered, duplicates allowed)
        │     ├── ArrayList
        │     ├── LinkedList
        │     ├── Vector (synchronized)
        │     └── Stack
        ├── Set (no duplicates)
        │     ├── HashSet
        │     ├── LinkedHashSet (insertion order)
        │     └── TreeSet (sorted)
        └── Queue
              ├── PriorityQueue (min-heap by default)
              ├── ArrayDeque (double-ended, fast)
              └── LinkedList (also implements Queue)

Map (key-value, not part of Collection)
  ├── HashMap (no order, O(1) avg)
  ├── LinkedHashMap (insertion/access order)
  ├── TreeMap (sorted by key, O(log n))
  ├── Hashtable (synchronized, legacy)
  └── ConcurrentHashMap (thread-safe, modern)
```

### 5.1 ArrayList vs LinkedList
```java
ArrayList<Integer> al = new ArrayList<>();
// Backed by dynamic array
// get(i): O(1)
// add(end): O(1) amortized
// add(middle): O(n) — shifts elements
// remove: O(n) — shifts
// Best for: random access, iteration

LinkedList<Integer> ll = new LinkedList<>();
// Doubly linked list
// get(i): O(n) — traverses
// add/remove at head/tail: O(1)
// add/remove at middle: O(n) traversal + O(1) link change
// Best for: frequent insertions/deletions at ends, implements Deque
```

### 5.2 HashMap Internal Working (CRITICAL INTERVIEW TOPIC)

> **For full depth** — Java 7 vs 8 differences, resize mechanics, custom key puzzles, RB tree conditions → see [Section 13](#13-deep-dive-hashmap-internals-java-7-vs-8) and [Section 14](#14-deep-dive-red-black-tree-in-hashmap).

```
HashMap internals:
- Array of Node[] (buckets), default size 16
- Node: { hash, key, value, next } → singly linked list for collisions
- load factor = 0.75 (default) → resize when 75% full
- When resized: capacity doubles (16 → 32 → 64...)

Put operation:
  1. hashCode() called on key
  2. Hash is further scrambled: hash = key.hashCode() ^ (h >>> 16)
  3. index = hash & (capacity - 1)  (faster than modulo)
  4. If bucket empty → insert Node
  5. If collision → check equals() → if same key: update value
  6. If different key: add to linked list (Java 7: head insert, Java 8: tail insert)
  7. Java 8: If bucket list length ≥ 8 AND total capacity ≥ 64 → convert to Red-Black Tree (O(n) → O(log n))
  8. If list shrinks to ≤ 6 → convert back to linked list

Get operation:
  1. Compute hash, find bucket index
  2. Traverse list/tree, compare using equals()
  3. Return value or null
```

```java
// HashMap iteration order is NOT guaranteed
// LinkedHashMap: maintains insertion order (doubly-linked list across entries)
// TreeMap: sorted by natural order or custom Comparator (Red-Black Tree)
```

**Why override both `equals()` and `hashCode()` for custom keys?**
```java
// BAD: only equals() overridden
Map<Person, String> map = new HashMap<>();
map.put(new Person("Alice"), "Engineer");
map.get(new Person("Alice"));  // returns null! Different hashCode → different bucket

// GOOD: both overridden
@Override public boolean equals(Object o) { ... }
@Override public int hashCode() { return Objects.hash(name, age); }
```

### 5.3 ConcurrentHashMap

> **For full depth** — Java 7 segments vs Java 8 CAS, atomic operations, resize, vs synchronizedMap → see [Section 15](#15-deep-dive-concurrenthashmap-complete).

```
Java 7: Divided into Segments (16 by default), each with its own lock
        → Only one thread per segment

Java 8+: Uses CAS (Compare-And-Swap) for updates + synchronized only on bucket head
        → Lock striping at bucket level
        → putIfAbsent, computeIfAbsent are atomic
        → Full table is only locked during resize

Key differences from synchronized HashMap:
- No null keys or null values allowed
- Reads: no locking
- Writes: CAS + bucket-level locking
```

### 5.4 Fail-Fast vs Fail-Safe
```java
// Fail-Fast: throws ConcurrentModificationException
// Uses modCount to detect structural changes during iteration
List<String> list = new ArrayList<>(Arrays.asList("a", "b", "c"));
for (String s : list) {
    if (s.equals("b")) list.remove(s);  // ConcurrentModificationException!
}

// Safe way: use Iterator.remove()
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if (it.next().equals("b")) it.remove();
}

// Fail-Safe: CopyOnWriteArrayList, ConcurrentHashMap
// Work on a copy of the collection, no exception
// Trade-off: memory overhead, may not reflect latest changes
List<String> cowList = new CopyOnWriteArrayList<>(Arrays.asList("a","b","c"));
for (String s : cowList) {
    cowList.add("d");  // No exception! Adds to copy
}
```

### 5.5 Comparable vs Comparator
```java
// Comparable: natural ordering, implemented by the class itself
class Student implements Comparable<Student> {
    String name;
    int grade;

    @Override
    public int compareTo(Student other) {
        return Integer.compare(this.grade, other.grade);  // ascending
    }
}
Collections.sort(students);  // uses compareTo

// Comparator: external ordering, flexible
Comparator<Student> byName = (a, b) -> a.name.compareTo(b.name);
Comparator<Student> byGradeDesc = Comparator.comparingInt(Student::getGrade).reversed();
Comparator<Student> complex = Comparator.comparingInt(Student::getGrade)
                                        .thenComparing(Student::getName);
students.sort(byGradeDesc);
```

### 5.6 PriorityQueue
```java
// Min-heap by default (smallest element at top)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());

// Custom objects
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);  // sort by 2nd element

minHeap.offer(5);   // add
minHeap.peek();     // view top without removing
minHeap.poll();     // remove and return top
```

---

## 6. Generics

### Why Generics?
```java
// Without generics (pre Java 5)
List list = new ArrayList();
list.add("Hello");
String s = (String) list.get(0);  // casting required, ClassCastException risk

// With generics
List<String> list = new ArrayList<>();
list.add("Hello");
String s = list.get(0);  // no cast needed, compile-time safety
```

### Bounded Type Parameters
```java
// Upper bound: T must be Number or subclass
<T extends Number>
public <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) > 0 ? a : b;
}

// Lower bound (wildcards only)
List<? super Integer>  // Integer or parent (Number, Object)
List<? extends Number> // Number or child (Integer, Double, etc.)
```

### Wildcards — PECS Rule
```
Producer Extends, Consumer Super

If a collection PRODUCES (you read from it) → use ? extends
If a collection CONSUMES (you write to it) → use ? super
```

```java
// Read from list (producer)
void printNumbers(List<? extends Number> list) {
    for (Number n : list) System.out.println(n);
}

// Write to list (consumer)
void addNumbers(List<? super Integer> list) {
    list.add(1);
    list.add(2);
}
```

### Type Erasure
```java
// At runtime, all generic type info is erased
List<String> ls = new ArrayList<>();
List<Integer> li = new ArrayList<>();
System.out.println(ls.getClass() == li.getClass());  // true! Both are just ArrayList

// This is why you can't do: new T(), T.class, instanceof T
```

---

## 7. Exception Handling

### Hierarchy
```
Throwable
  ├── Error (JVM level, don't catch)
  │     ├── OutOfMemoryError
  │     ├── StackOverflowError
  │     └── VirtualMachineError
  └── Exception
        ├── Checked Exceptions (must handle or declare)
        │     ├── IOException
        │     ├── SQLException
        │     └── ClassNotFoundException
        └── Unchecked (RuntimeException)
              ├── NullPointerException
              ├── ArrayIndexOutOfBoundsException
              ├── ClassCastException
              ├── ArithmeticException
              ├── IllegalArgumentException
              └── IllegalStateException
```

### try-with-resources (Java 7+)
```java
// AutoCloseable: automatically closes resources
try (
    Connection conn = DriverManager.getConnection(url);
    PreparedStatement ps = conn.prepareStatement(sql)
) {
    // use resources
} catch (SQLException e) {
    log.error("DB error", e);
}
// conn and ps are automatically closed even if exception occurs
// close() is called in reverse order of creation
```

### Custom Exception Best Practices
```java
// For domain-specific errors
public class OrderNotFoundException extends RuntimeException {
    private final String orderId;

    public OrderNotFoundException(String orderId) {
        super("Order not found: " + orderId);
        this.orderId = orderId;
    }

    public OrderNotFoundException(String orderId, Throwable cause) {
        super("Order not found: " + orderId, cause);
        this.orderId = orderId;
    }

    public String getOrderId() { return orderId; }
}
```

### Exception Chaining
```java
try {
    // database operation
} catch (SQLException e) {
    throw new ServiceException("Failed to save order", e);  // preserve root cause
}
```

---

## 8. Java 8 Features

> **Interview note:** Java 8 is the most-asked version. For complete feature list + `default` keyword deep dive → [Section 17](#17-deep-dive-default-keyword-in-interfaces-java-8) and [Section 20](#20-tough-interview-qa-bank).

### 8.1 Lambda Expressions
```java
// Lambda: (parameters) -> expression OR { statements }

Runnable r = () -> System.out.println("Hello");

Comparator<String> c = (a, b) -> a.length() - b.length();

// Before Java 8
Runnable r = new Runnable() {
    @Override
    public void run() { System.out.println("Hello"); }
};
```

### 8.2 Functional Interfaces
```java
// @FunctionalInterface: exactly ONE abstract method

// Predicate<T>: T → boolean
Predicate<String> isEmpty = String::isEmpty;
Predicate<Integer> isPositive = n -> n > 0;
Predicate<Integer> isEven = n -> n % 2 == 0;
Predicate<Integer> isPositiveAndEven = isPositive.and(isEven);

// Function<T, R>: T → R
Function<String, Integer> strLen = String::length;
Function<Integer, Integer> doubleIt = x -> x * 2;
Function<String, Integer> strLenDoubled = strLen.andThen(doubleIt);

// Consumer<T>: T → void
Consumer<String> print = System.out::println;
Consumer<String> printUpper = s -> System.out.println(s.toUpperCase());
Consumer<String> printBoth = print.andThen(printUpper);

// Supplier<T>: () → T
Supplier<List<String>> listSupplier = ArrayList::new;
Supplier<LocalDate> today = LocalDate::now;

// BiFunction<T, U, R>: (T, U) → R
BiFunction<String, Integer, String> repeat = (s, n) -> s.repeat(n);

// UnaryOperator<T>: T → T (special Function)
UnaryOperator<String> toUpper = String::toUpperCase;

// BinaryOperator<T>: (T, T) → T
BinaryOperator<Integer> add = Integer::sum;
```

### 8.3 Stream API (MOST IMPORTANT)
```java
List<String> names = List.of("Alice", "Bob", "Charlie", "David", "Alex");

// Intermediate operations (lazy, return Stream):
//   filter, map, flatMap, distinct, sorted, limit, skip, peek

// Terminal operations (eager, trigger execution):
//   forEach, collect, reduce, count, min, max, findFirst, findAny, anyMatch, allMatch, noneMatch, toArray

// Example pipeline
List<String> result = names.stream()
    .filter(name -> name.startsWith("A"))   // ["Alice", "Alex"]
    .map(String::toUpperCase)               // ["ALICE", "ALEX"]
    .sorted()                               // ["ALEX", "ALICE"]
    .collect(Collectors.toList());          // collect to list
```

```java
// flatMap: flatten nested collections
List<List<Integer>> nested = List.of(List.of(1,2), List.of(3,4), List.of(5));
List<Integer> flat = nested.stream()
    .flatMap(Collection::stream)
    .collect(Collectors.toList());  // [1, 2, 3, 4, 5]

// reduce: combine elements
int sum = IntStream.rangeClosed(1, 10).reduce(0, Integer::sum);  // 55
Optional<String> longest = names.stream()
    .reduce((a, b) -> a.length() > b.length() ? a : b);

// collect with Collectors
Map<Integer, List<String>> byLength = names.stream()
    .collect(Collectors.groupingBy(String::length));
// {5=[Alice], 3=[Bob, Alex], 7=[Charlie], 5=[David]}  // Note: David has 5 chars

Map<Boolean, List<String>> partition = names.stream()
    .collect(Collectors.partitioningBy(n -> n.length() > 4));
// {false=[Bob, Alex], true=[Alice, Charlie, David]}

String joined = names.stream()
    .collect(Collectors.joining(", ", "[", "]"));  // "[Alice, Bob, Charlie, David, Alex]"

Map<String, Long> freq = names.stream()
    .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

// Statistics
IntSummaryStatistics stats = names.stream()
    .mapToInt(String::length)
    .summaryStatistics();
// count, sum, min, max, average

// Parallel Stream
long count = names.parallelStream()
    .filter(n -> n.startsWith("A"))
    .count();
// Be careful: ordering not guaranteed, not always faster (overhead for small collections)
```

### 8.4 Optional
```java
// Avoid NullPointerException
Optional<String> opt = Optional.of("Hello");       // non-null
Optional<String> empty = Optional.empty();          // empty
Optional<String> nullable = Optional.ofNullable(null);  // null-safe

// Use Optional
opt.isPresent()                    // true
opt.isEmpty()                      // false (Java 11)
opt.get()                          // "Hello" (throws if empty!)
opt.orElse("default")              // value or default
opt.orElseGet(() -> compute())     // lazy default
opt.orElseThrow(() -> new RuntimeException()) // throw if empty
opt.map(String::toUpperCase)       // Optional<String> with "HELLO"
opt.filter(s -> s.length() > 3)    // Optional<String> if condition met
opt.flatMap(s -> Optional.of(s.toLowerCase()))

// Chaining (avoid NPE in object chains)
Optional.ofNullable(user)
    .map(User::getAddress)
    .map(Address::getCity)
    .orElse("Unknown");
```

### 8.5 Method References
```java
// 4 types of method references

// 1. Static method reference: ClassName::staticMethod
Function<String, Integer> parseInt = Integer::parseInt;

// 2. Instance method on particular instance: instance::method
String prefix = "Hello";
Predicate<String> startsWith = prefix::startsWith;  // wait, this is wrong
Consumer<String> print = System.out::println;

// 3. Instance method on arbitrary instance: ClassName::instanceMethod
Function<String, String> toUpper = String::toUpperCase;
Predicate<String> isEmpty = String::isEmpty;

// 4. Constructor reference: ClassName::new
Supplier<ArrayList<String>> supplier = ArrayList::new;
Function<String, StringBuilder> sbCreator = StringBuilder::new;
```

### 8.6 Date/Time API
```java
// Old: java.util.Date and Calendar — mutable, not thread-safe, confusing months
// New: java.time — immutable, thread-safe, intuitive

LocalDate date = LocalDate.now();               // 2026-04-28
LocalDate date2 = LocalDate.of(2000, Month.JANUARY, 1);
LocalDate date3 = LocalDate.parse("2026-04-28");

LocalTime time = LocalTime.now();               // 23:54:00
LocalTime time2 = LocalTime.of(10, 30, 0);

LocalDateTime dt = LocalDateTime.now();
LocalDateTime dt2 = LocalDateTime.of(date, time2);

ZonedDateTime zdt = ZonedDateTime.now(ZoneId.of("America/New_York"));

// Arithmetic
LocalDate tomorrow = date.plusDays(1);
LocalDate lastMonth = date.minusMonths(1);
long daysBetween = ChronoUnit.DAYS.between(date2, date);

// Period (date-based)
Period period = Period.between(date2, date);
period.getYears();  // 26

// Duration (time-based)
Duration d = Duration.between(LocalTime.of(9,0), LocalTime.of(17,30));
d.toHours();   // 8
d.toMinutes(); // 510

// Formatting
DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
String formatted = date.format(fmt);
LocalDate parsed = LocalDate.parse("28/04/2026", fmt);
```

### 8.7 Collectors — Cheat Sheet
```java
Collectors.toList()
Collectors.toSet()
Collectors.toUnmodifiableList()
Collectors.toMap(keyMapper, valueMapper)
Collectors.toMap(keyMapper, valueMapper, mergeFunction)  // handle duplicates
Collectors.groupingBy(classifier)
Collectors.groupingBy(classifier, downstream)
Collectors.partitioningBy(predicate)
Collectors.counting()
Collectors.joining(delimiter, prefix, suffix)
Collectors.summingInt(mapper)
Collectors.averagingInt(mapper)
Collectors.summarizingInt(mapper)
Collectors.mapping(mapper, downstream)
Collectors.collectingAndThen(downstream, finisher)

// Multi-level grouping
Map<String, Map<String, List<Employee>>> = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::getDepartment,
        Collectors.groupingBy(Employee::getCity)
    ));
```

---

## 9. Java 9–21 Features

### Java 9
```java
// Immutable collections
List<String> list = List.of("a", "b", "c");       // unmodifiable
Set<Integer> set = Set.of(1, 2, 3);
Map<String, Integer> map = Map.of("a", 1, "b", 2);

// Stream improvements
Stream.of(1,2,3).takeWhile(n -> n < 3);   // [1, 2]
Stream.of(1,2,3).dropWhile(n -> n < 3);   // [3]
Stream.iterate(0, n -> n < 10, n -> n + 2); // [0, 2, 4, 6, 8]
Optional.stream()  // convert Optional to Stream

// Modules (Project Jigsaw)
// module-info.java
module com.myapp {
    requires java.sql;
    exports com.myapp.api;
}
```

### Java 10
```java
var list = new ArrayList<String>();     // type inferred: ArrayList<String>
var map = new HashMap<String, List<Integer>>();  // saves boilerplate
// var only works for local variables, not fields or method params
// var is not a keyword (can still be used as identifier)
```

### Java 11
```java
// String methods
"  hello  ".strip()      // "hello" (Unicode-aware)
"  ".isBlank()           // true
"abc".repeat(3)          // "abcabcabc"
"line1\nline2".lines()   // Stream<String>

// var in lambda
(var x, var y) -> x + y  // allows annotations: (@NonNull var x, var y) -> ...

// Files.readString() and Files.writeString()
String content = Files.readString(Path.of("file.txt"));
Files.writeString(Path.of("out.txt"), "Hello World");

// HttpClient (stable)
HttpClient client = HttpClient.newHttpClient();
HttpRequest req = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com"))
    .GET().build();
HttpResponse<String> response = client.send(req, BodyHandlers.ofString());
```

### Java 14/15/16 — Records, Switch, Text Blocks
```java
// Records (Java 16 stable)
record Point(int x, int y) {
    // auto-generates: constructor, getters (x(), y()), equals, hashCode, toString
    // can add compact constructor for validation
    Point {
        if (x < 0 || y < 0) throw new IllegalArgumentException("Coordinates must be non-negative");
    }
}
Point p = new Point(3, 4);
p.x();  // 3

// Switch Expressions (Java 14 stable)
int day = 3;
String dayName = switch (day) {
    case 1 -> "Monday";
    case 2 -> "Tuesday";
    case 3 -> "Wednesday";
    default -> "Unknown";
};

// Multiple labels
String type = switch (day) {
    case 1, 7 -> "Weekend";
    case 2, 3, 4, 5, 6 -> "Weekday";
    default -> throw new IllegalArgumentException();
};

// Text Blocks (Java 15 stable)
String json = """
        {
            "name": "Alice",
            "age": 30
        }
        """;
```

### Java 16 — Pattern Matching instanceof
```java
// Old way
if (obj instanceof String) {
    String s = (String) obj;
    System.out.println(s.length());
}

// New way (Java 16+)
if (obj instanceof String s) {
    System.out.println(s.length());  // s is already cast
}

// In switch (Java 21)
Object obj = "Hello";
String result = switch (obj) {
    case Integer i -> "Integer: " + i;
    case String s  -> "String: " + s;
    case null      -> "null";
    default        -> "Other: " + obj;
};
```

### Java 17 — Sealed Classes
```java
// Sealed classes restrict which classes can extend/implement them
public sealed class Shape permits Circle, Rectangle, Triangle {
    abstract double area();
}

public final class Circle extends Shape {
    double radius;
    Circle(double r) { this.radius = r; }
    double area() { return Math.PI * radius * radius; }
}

public non-sealed class Rectangle extends Shape {
    // non-sealed: anyone can extend Rectangle
    double w, h;
    Rectangle(double w, double h) { this.w = w; this.h = h; }
    double area() { return w * h; }
}
```

### Java 21 — Virtual Threads (Project Loom)
```java
// Platform threads: mapped 1-to-1 to OS threads (limited, heavy ~1MB stack)
// Virtual threads: managed by JVM, lightweight (~few KB), millions possible

// Creating virtual threads
Thread.ofVirtual().start(() -> System.out.println("Virtual thread!"));

// Using ExecutorService
try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 1_000_000; i++) {
        executor.submit(() -> {
            Thread.sleep(Duration.ofMillis(100));  // blocking OK!
            return "done";
        });
    }
}

// Virtual threads are ideal for I/O-bound tasks
// They unmount from carrier thread during blocking I/O (parking)
// Do NOT use thread pools for virtual threads — create new ones freely
// Avoid synchronized blocks with I/O inside (pinning issue — use ReentrantLock)
```

### Java 21 — Sequenced Collections
```java
// New interfaces: SequencedCollection, SequencedSet, SequencedMap
// All have getFirst(), getLast(), addFirst(), addLast(), reversed()

List<String> list = new ArrayList<>(List.of("a", "b", "c"));
list.getFirst();     // "a"
list.getLast();      // "c"
list.reversed();     // reversed view
```

---

## 10. Multithreading & Concurrency

### 10.1 Thread Lifecycle
```
NEW → RUNNABLE → (RUNNING) → BLOCKED/WAITING/TIMED_WAITING → TERMINATED

NEW: Thread created but not started
RUNNABLE: start() called, waiting for CPU or executing
BLOCKED: waiting for a monitor lock (synchronized)
WAITING: wait(), join(), LockSupport.park()
TIMED_WAITING: sleep(n), wait(n), join(n), parkNanos()
TERMINATED: run() finished or exception thrown
```

### 10.2 Creating Threads
```java
// Method 1: Extend Thread
class MyThread extends Thread {
    @Override
    public void run() { System.out.println("Thread: " + getName()); }
}
new MyThread().start();

// Method 2: Implement Runnable (preferred - avoids single inheritance issue)
Runnable task = () -> System.out.println("Runnable task");
new Thread(task).start();

// Method 3: Callable (returns result, throws checked exception)
Callable<Integer> callable = () -> 42;
FutureTask<Integer> future = new FutureTask<>(callable);
new Thread(future).start();
Integer result = future.get();  // blocking
```

### 10.3 synchronized
```java
class Counter {
    private int count = 0;

    // Method-level: locks on 'this' (instance)
    public synchronized void increment() { count++; }

    // Block-level: more granular
    public void decrement() {
        synchronized (this) {
            count--;
        }
    }

    // Static synchronized: locks on class object
    public static synchronized void staticMethod() { ... }
}

// Monitors: every object has a monitor (intrinsic lock)
// Only one thread can hold a monitor at a time
// synchronized is reentrant (same thread can re-acquire)
```

### 10.4 volatile

> **For full depth** — JMM, volatile vs Atomic vs synchronized, double-checked locking, solving concurrency without synchronized → [Section 16](#16-deep-dive-volatile-vs-atomic-variables).

```java
class SharedFlag {
    // Without volatile: other threads may see cached (stale) value
    // volatile: guarantees visibility (writes visible to all threads immediately)
    // volatile does NOT guarantee atomicity (i++ is still not thread-safe)
    private volatile boolean flag = false;

    public void stop() { flag = true; }
    public void run() {
        while (!flag) { /* do work */ }  // guaranteed to see latest flag
    }
}
```

### 10.5 wait/notify
```java
class ProducerConsumer {
    private final Queue<Integer> queue = new LinkedList<>();
    private final int MAX = 5;

    public synchronized void produce(int item) throws InterruptedException {
        while (queue.size() == MAX) wait();  // release lock, wait
        queue.offer(item);
        notifyAll();  // wake up all waiting threads
    }

    public synchronized int consume() throws InterruptedException {
        while (queue.isEmpty()) wait();
        int item = queue.poll();
        notifyAll();
        return item;
    }
}
// wait() and notify() MUST be called within synchronized block
```

### 10.6 ExecutorService & Thread Pools
```java
// Don't create threads manually in production — use pools

// Fixed thread pool
ExecutorService fixed = Executors.newFixedThreadPool(4);

// Cached (creates threads as needed, reuses idle ones)
ExecutorService cached = Executors.newCachedThreadPool();

// Single thread
ExecutorService single = Executors.newSingleThreadExecutor();

// Scheduled
ScheduledExecutorService scheduled = Executors.newScheduledThreadPool(2);
scheduled.scheduleAtFixedRate(task, initialDelay, period, TimeUnit.SECONDS);

// Custom ThreadPoolExecutor (production-grade)
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    4,              // corePoolSize
    8,              // maximumPoolSize
    60L,            // keepAliveTime
    TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(100),  // work queue
    Executors.defaultThreadFactory(),
    new ThreadPoolExecutor.CallerRunsPolicy()  // rejection policy
);

// Submit tasks
Future<String> future = executor.submit(() -> "result");
String result = future.get(5, TimeUnit.SECONDS);  // with timeout

// Always shutdown
executor.shutdown();
executor.awaitTermination(60, TimeUnit.SECONDS);
executor.shutdownNow();  // interrupt running tasks
```

### 10.7 CompletableFuture
```java
// Asynchronous, non-blocking composition

CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> "Hello")                    // run async
    .thenApply(s -> s + " World")                  // transform result
    .thenApply(String::toUpperCase);

future.thenAccept(System.out::println);             // consume result
future.get();                                       // block and get

// Chain multiple async operations
CompletableFuture<String> result = CompletableFuture
    .supplyAsync(() -> fetchUser(userId))
    .thenCompose(user -> fetchOrders(user.getId())) // flatMap equivalent
    .thenCombine(fetchInventory(), (orders, inv) -> merge(orders, inv))
    .exceptionally(ex -> "Error: " + ex.getMessage());

// Run multiple in parallel
CompletableFuture<Void> all = CompletableFuture.allOf(f1, f2, f3);  // wait for all
CompletableFuture<Object> any = CompletableFuture.anyOf(f1, f2, f3); // first one

// Exception handling
CompletableFuture<String> safe = future
    .handle((result, ex) -> ex != null ? "default" : result)  // always called
    .whenComplete((result, ex) -> log(result, ex));            // callback, doesn't transform
```

### 10.8 Locks (java.util.concurrent.locks)
```java
// ReentrantLock: like synchronized but more flexible
ReentrantLock lock = new ReentrantLock(true);  // fair lock

lock.lock();
try {
    // critical section
} finally {
    lock.unlock();  // ALWAYS in finally
}

// tryLock: don't block
if (lock.tryLock(500, TimeUnit.MILLISECONDS)) {
    try { ... } finally { lock.unlock(); }
}

// ReadWriteLock: multiple readers OR one writer
ReadWriteLock rwLock = new ReentrantReadWriteLock();
rwLock.readLock().lock();   // multiple threads can read simultaneously
rwLock.writeLock().lock();  // exclusive write
```

### 10.9 Synchronization Aids
```java
// CountDownLatch: wait for N events to complete
CountDownLatch latch = new CountDownLatch(3);
// worker threads call latch.countDown()
// main thread calls latch.await() — blocks until count reaches 0
// ONE-TIME USE, cannot be reset

// CyclicBarrier: all threads wait at a barrier
CyclicBarrier barrier = new CyclicBarrier(3, () -> System.out.println("All reached!"));
// each thread calls barrier.await()
// when all N arrive, the barrier action runs, all continue
// REUSABLE

// Semaphore: controls access to N resources
Semaphore sem = new Semaphore(3);  // 3 permits
sem.acquire();  // get permit (blocks if none available)
sem.release();  // return permit

// Phaser: flexible multi-phase barrier (advanced)
```

### 10.10 Atomic Classes
```java
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();    // atomic i++
counter.getAndIncrement();    // i++ but returns old value
counter.compareAndSet(5, 10); // CAS: if current==5, set to 10
counter.addAndGet(5);

AtomicReference<String> ref = new AtomicReference<>("initial");
ref.compareAndSet("initial", "updated");

// LongAdder: better than AtomicLong for high-contention counters
LongAdder adder = new LongAdder();
adder.increment();
adder.sum();  // read (not exact during concurrent update)
```

### 10.11 Deadlock, Livelock, Starvation
```java
// DEADLOCK: two threads each hold a lock the other needs
// Thread 1: lock A, then wants B
// Thread 2: lock B, then wants A

// Prevention:
// 1. Lock ordering: always acquire locks in same order
// 2. Lock timeout: tryLock with timeout
// 3. Use single lock for both resources

// LIVELOCK: threads keep changing state in response to each other, no progress
// Example: two people in corridor keep stepping same direction to avoid each other

// STARVATION: thread can never get CPU/lock due to other threads always winning
// Solution: fair locks (ReentrantLock(true)), increase priority
```

---

## 11. JVM Internals & Garbage Collection

### 11.1 JVM Memory Areas
```
Heap (shared across all threads)
  ├── Young Generation
  │     ├── Eden Space (new objects)
  │     └── Survivor Spaces (S0 and S1)
  └── Old Generation (Tenured) — long-lived objects

Non-Heap
  ├── Method Area (Metaspace in Java 8+) — class metadata, static vars, constant pool
  ├── JVM Stack (per thread) — stack frames, local variables, operand stack
  ├── PC Register (per thread) — current instruction
  └── Native Method Stack (per thread) — native methods
```

### 11.2 Object Lifecycle in Heap
```
1. New object → Eden space
2. Eden full → Minor GC (Young GC)
   - Alive objects → Survivor S0
   - Dead objects collected
3. Next Minor GC:
   - S0 alive → S1 (age++)
   - Eden alive → S0
4. When object age > threshold (default 15) → promoted to Old Gen
5. Old Gen full → Major GC (Full GC) — STW (Stop-The-World)
```

### 11.3 Garbage Collectors
| GC | Algorithm | STW Pauses | Best For |
|----|-----------|------------|---------|
| Serial | Mark-Sweep-Compact | Yes | Single-core, small heaps |
| Parallel | Parallel Mark-Sweep | Yes | Multi-core, throughput focus |
| CMS | Concurrent Mark Sweep | Short | Low latency (deprecated Java 9) |
| G1 (default Java 9+) | Region-based | Short, predictable | Balanced throughput + latency |
| ZGC (Java 15+) | Concurrent, colored pointers | < 1ms | Very low latency, large heaps |
| Shenandoah | Concurrent compaction | < 10ms | Low latency |

```bash
# JVM GC flags
-XX:+UseG1GC
-XX:+UseZGC
-Xms512m -Xmx4g       # initial and max heap size
-XX:NewRatio=2         # Old:Young ratio (2:1)
-XX:SurvivorRatio=8    # Eden:Survivor ratio
-XX:MaxTenuringThreshold=15
-verbose:gc            # print GC logs
-Xlog:gc*:file=gc.log  # Java 9+ logging
```

### 11.4 Memory Leaks in Java
Common causes:
1. **Static collections** accumulating objects without removal
2. **Unclosed resources** (connections, streams) without try-with-resources
3. **ThreadLocal** not removed (especially in thread pools)
4. **Event listeners** never deregistered
5. **Inner class** holding reference to outer class unintentionally
6. **Caches** without eviction policy

```java
// ThreadLocal leak example:
ThreadLocal<UserContext> ctx = new ThreadLocal<>();
ctx.set(new UserContext(user));
// In servlet/filter — MUST clean up:
try {
    // handle request
} finally {
    ctx.remove();  // CRITICAL! Otherwise leaks in thread pool
}
```

---

## 12. Design Patterns

### 12.1 Creational Patterns

#### Singleton (All Variants)
```java
// 1. Eager initialization (simplest, thread-safe)
public class EagerSingleton {
    private static final EagerSingleton INSTANCE = new EagerSingleton();
    private EagerSingleton() {}
    public static EagerSingleton getInstance() { return INSTANCE; }
}

// 2. Lazy + Double-checked locking (thread-safe, lazy)
public class Singleton {
    private static volatile Singleton instance;
    private Singleton() {}
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {     // second check inside lock
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}

// 3. Initialization-on-demand holder (best: lazy + thread-safe, no sync overhead)
public class Singleton {
    private Singleton() {}
    private static class Holder {
        static final Singleton INSTANCE = new Singleton();
    }
    public static Singleton getInstance() { return Holder.INSTANCE; }
}

// 4. Enum Singleton (Josh Bloch's recommended: serialization-safe, reflection-safe)
public enum EnumSingleton {
    INSTANCE;
    public void doSomething() { }
}
```

#### Builder Pattern
```java
public class Pizza {
    private final String size;
    private final boolean cheese, pepperoni, mushrooms;

    private Pizza(Builder builder) {
        this.size = builder.size;
        this.cheese = builder.cheese;
        this.pepperoni = builder.pepperoni;
        this.mushrooms = builder.mushrooms;
    }

    public static class Builder {
        private final String size;   // required
        private boolean cheese, pepperoni, mushrooms;

        public Builder(String size) { this.size = size; }
        public Builder cheese() { this.cheese = true; return this; }
        public Builder pepperoni() { this.pepperoni = true; return this; }
        public Builder mushrooms() { this.mushrooms = true; return this; }
        public Pizza build() { return new Pizza(this); }
    }
}
// Usage:
Pizza p = new Pizza.Builder("Large").cheese().pepperoni().build();
// Lombok: @Builder annotation generates this automatically
```

#### Factory & Abstract Factory
```java
// Factory Method: subclasses decide which class to instantiate
interface Animal { void sound(); }
class Dog implements Animal { public void sound() { System.out.println("Woof"); } }
class Cat implements Animal { public void sound() { System.out.println("Meow"); } }

class AnimalFactory {
    public static Animal create(String type) {
        return switch (type) {
            case "dog" -> new Dog();
            case "cat" -> new Cat();
            default -> throw new IllegalArgumentException("Unknown: " + type);
        };
    }
}

// Abstract Factory: factory of factories
interface GUIFactory {
    Button createButton();
    Checkbox createCheckbox();
}
class WindowsFactory implements GUIFactory { ... }
class MacFactory implements GUIFactory { ... }
```

### 12.2 Structural Patterns

#### Decorator Pattern
```java
interface Coffee { double getCost(); String getDescription(); }

class SimpleCoffee implements Coffee {
    public double getCost() { return 1.0; }
    public String getDescription() { return "Simple coffee"; }
}

abstract class CoffeeDecorator implements Coffee {
    protected Coffee coffee;
    CoffeeDecorator(Coffee c) { this.coffee = c; }
}

class MilkDecorator extends CoffeeDecorator {
    MilkDecorator(Coffee c) { super(c); }
    public double getCost() { return coffee.getCost() + 0.5; }
    public String getDescription() { return coffee.getDescription() + ", milk"; }
}

// Usage:
Coffee c = new MilkDecorator(new SimpleCoffee());
// Used in Java I/O: BufferedInputStream(new FileInputStream())
```

#### Proxy Pattern
```java
interface Service { String request(); }

class RealService implements Service {
    public String request() { return "Real response"; }
}

class ProxyService implements Service {
    private RealService real;
    private final Map<String, String> cache = new HashMap<>();

    public String request() {
        return cache.computeIfAbsent("key", k -> {
            real = new RealService();   // lazy init
            return real.request();
        });
    }
}
// Types: Virtual Proxy (lazy init), Protection Proxy (access control), Remote Proxy
// Spring AOP uses dynamic proxies (JDK proxy or CGLIB)
```

### 12.3 Behavioral Patterns

#### Observer Pattern
```java
interface Observer { void update(String event); }
interface Observable {
    void subscribe(Observer o);
    void unsubscribe(Observer o);
    void notify(String event);
}

class EventBus implements Observable {
    private final List<Observer> observers = new ArrayList<>();
    public void subscribe(Observer o) { observers.add(o); }
    public void unsubscribe(Observer o) { observers.remove(o); }
    public void notify(String event) { observers.forEach(o -> o.update(event)); }
}
// Java built-in: java.util.Observable (deprecated), PropertyChangeListener
// Used in: Spring Events, RxJava, Reactor
```

#### Strategy Pattern
```java
interface SortStrategy { void sort(int[] arr); }
class BubbleSort implements SortStrategy { ... }
class QuickSort implements SortStrategy { ... }

class Sorter {
    private SortStrategy strategy;
    Sorter(SortStrategy s) { this.strategy = s; }
    void setStrategy(SortStrategy s) { this.strategy = s; }
    void sort(int[] arr) { strategy.sort(arr); }
}
// Used in: Collections.sort(list, comparator)
// Replaces if-else chains with polymorphism
```

#### Template Method Pattern
```java
abstract class DataProcessor {
    // Template method — defines skeleton
    public final void process() {
        readData();
        processData();   // abstract — subclass defines
        writeData();
    }
    void readData() { System.out.println("Reading..."); }
    abstract void processData();
    void writeData() { System.out.println("Writing..."); }
}
class CSVProcessor extends DataProcessor {
    void processData() { System.out.println("Processing CSV"); }
}
// Used in: Spring's JdbcTemplate, RestTemplate, JmsTemplate
```

---

## 13. DEEP DIVE: HashMap Internals (Java 7 vs 8+)

### 13.1 Why HashMap Exists — The Problem It Solves

Array gives O(1) access by index but only when you know the index. TreeMap gives O(log n) sorted access. HashMap gives **average O(1)** key→value lookup by computing an index from the key's hash code. The trade-off: no ordering guarantee, hash collisions, and you must implement `equals()` + `hashCode()` correctly for custom keys.

### 13.2 Core Data Structures (Java 8+ source-level mental model)

```java
// Simplified — actual JDK uses internal classes
static class Node<K,V> {
    final int hash;
    final K key;
    V value;
    Node<K,V> next;           // linked list for collisions
}

static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {
    TreeNode<K,V> parent, left, right, prev;
    boolean red;
}

transient Node<K,V>[] table;    // bucket array, default length 16
int size;                       // number of key-value pairs
int threshold;                  // resize trigger = capacity * loadFactor
final float loadFactor;         // default 0.75
```

**Key fields explained:**
- `table` — array of buckets (not the entries themselves; each slot is head of a list or tree)
- `loadFactor` — how full before resize (0.75 = resize at 75% capacity = 12 entries when capacity is 16)
- `threshold` — `capacity × loadFactor`; when `size > threshold`, resize happens
- Power-of-2 capacity enables `index = hash & (capacity - 1)` instead of slow `%`

### 13.3 Hash Computation — Why XOR with Upper Bits?

```java
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
```

**Why?** When capacity is small (e.g. 16), only lower 4 bits of hash determine bucket index. Without spreading high bits, keys with similar `hashCode()` patterns (e.g. `Integer` keys 0,16,32...) all land in the same bucket → linked list → O(n). XOR-ing upper 16 bits into lower bits distributes keys more evenly across buckets even when capacity is small.

**Null key:** Always goes to bucket index 0. Only one null key allowed (Map contract).

### 13.4 PUT Operation — Step by Step (Java 8+)

```
put(key, value):
  1. Compute hash = hash(key)
  2. If table is null or empty → resize (lazy init on first put)
  3. index = (capacity - 1) & hash
  4. If bucket[index] is null → create new Node, size++, check resize
  5. Else (collision):
     a. Walk the linked list / tree at bucket[index]
     b. If key already exists (hash matches AND equals()) → update value, return old
     c. Else append new Node (TAIL insert in Java 8; HEAD insert in Java 7)
     d. If list length ≥ TREEIFY_THRESHOLD (8) AND capacity ≥ MIN_TREEIFY_CAPACITY (64)
        → treeifyBin(): convert linked list to Red-Black Tree
     e. size++, check resize
  6. If size > threshold → resize()
```

### 13.5 RESIZE Operation — What Actually Happens

When `size > threshold`:
1. Create new array of **double** the capacity (16 → 32 → 64...)
2. Recompute index for **every** entry (O(n) — expensive!)
3. Java 8 optimization: entries either stay at same index OR move by exactly `oldCapacity` offset (because capacity doubled, one more bit participates in index calculation)
4. During resize, Java 8 splits each bucket into **lo** and **hi** chains based on whether the new bit is 0 or 1

```
Old capacity = 16 (index uses bits 0-3)
New capacity = 32 (index uses bits 0-4)

For each node in bucket:
  if (hash & 16) == 0  → stays in same index
  if (hash & 16) != 0  → moves to index + 16
```

**Interview trap:** "Resize happens at 75% full" — technically when `size > threshold` where `threshold = capacity × 0.75`. With capacity 16, threshold is 12, so resize on 13th entry.

### 13.6 Java 7 vs Java 8 — Critical Differences

| Aspect | Java 7 | Java 8+ |
|--------|--------|---------|
| Collision structure | Singly linked list only | Linked list → Red-Black Tree |
| Insert on collision | **Head insert** (new node first) | **Tail insert** (new node last) |
| Worst-case get/put | O(n) — long chains | O(log n) — tree when chain ≥ 8 |
| Resize | Rehash all entries | Optimized lo/hi split |
| Hash function | 4 shifts + XOR (more complex) | Simpler: `h ^ (h >>> 16)` |
| Tree threshold | N/A | Treeify at 8, untreeify at 6 |
| Min capacity for tree | N/A | Must have capacity ≥ 64 to treeify |

**Why Java 7 used head insert:** Historically believed to improve locality for recently added entries (often accessed soon). Java 8 switched to tail insert because head insert could create **infinite loops** during concurrent resize in multi-threaded misuse (HashMap is NOT thread-safe). Tail insert + improved resize fixed the famous JDK-7 HashMap infinite loop bug.

**Why NOT treeify when capacity < 64?** Resizing is cheaper than maintaining trees on small maps. If you have 8 collisions in a bucket but total capacity is only 16, it's better to just resize and spread entries than pay tree overhead.

### 13.7 GET Operation — Step by Step

```
get(key):
  1. hash = hash(key)
  2. index = (capacity - 1) & hash
  3. If bucket[index] is null → return null
  4. If first node's hash/key matches → return value
  5. If first node is TreeNode → tree.search(hash, key)
  6. Else walk linked list, compare hash then equals()
  7. Not found → return null
```

**Important:** HashMap checks `hash` first (fast int compare), then `equals()` (potentially expensive). Custom keys must ensure: if `a.equals(b)` then `a.hashCode() == b.hashCode()`.

### 13.8 HashMap Custom Key — Interview Output Puzzle

```java
class Employee {
    String name;
    int id;
    Employee(String name, int id) { this.name = name; this.id = id; }
}

Map<Employee, String> map = new HashMap<>();
map.put(new Employee("Alice", 1), "Engineer");
System.out.println(map.get(new Employee("Alice", 1))); // depends on equals/hashCode
```

| Case | Output | Why |
|------|--------|-----|
| No override | `null` | `Object.equals()` compares references; different objects |
| Only equals | `null` | Different `hashCode()` → different bucket; never finds key |
| Both correct | `"Engineer"` | Same bucket, `equals()` matches |

**Mutable key trap:**
```java
Employee e = new Employee("Alice", 1);
map.put(e, "Engineer");
e.id = 2;  // MUTATED after insert!
map.get(e);  // null — hashCode changed, key is "lost" in map
```
**Rule:** Never mutate fields used in `equals()`/`hashCode()` while object is in a HashMap/HashSet.

### 13.9 HashMap vs Hashtable vs ConcurrentHashMap vs Collections.synchronizedMap

| | HashMap | Hashtable | synchronizedMap | ConcurrentHashMap |
|--|---------|-----------|-----------------|-------------------|
| Thread-safe | No | Yes (every method synchronized) | Yes (mutex on each op) | Yes (fine-grained) |
| Null key/value | 1 null key, many null values | Not allowed | Follows backing map | Not allowed |
| Iterator | Fail-fast | Fail-fast | Fail-fast | Weakly consistent |
| Performance (reads) | Fastest | Slow | Slow | Fast (no read lock) |
| Performance (writes) | Fastest | Slow | Slow | Good (bucket-level) |

---

## 14. DEEP DIVE: Red-Black Tree in HashMap

### 14.1 Why a Tree Inside HashMap?

When many keys hash to the same bucket (bad `hashCode()`, adversarial input, or hash collision attack), linked list traversal becomes O(n). Java 8 converts chains of length ≥ 8 to a **Red-Black Tree** for O(log n) worst-case — but only when total map capacity ≥ 64.

### 14.2 What is a Red-Black Tree?

A self-balancing Binary Search Tree with these rules:
1. Every node is RED or BLACK
2. Root is BLACK
3. All leaves (NIL) are BLACK
4. RED node cannot have RED child (no two consecutive reds)
5. Every path from node to descendant leaf has same number of BLACK nodes

**Result:** Height ≤ 2 × log₂(n+1) → guaranteed O(log n) search, insert, delete.

### 14.3 TreeNode in HashMap

```java
static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {
    TreeNode<K,V> parent, left, right;
    TreeNode<K,V> prev;    // doubly-linked for untreeify back to list
    boolean red;
}
```

TreeNode **also** maintains `prev` pointer — so converting tree → list (untreeify) is O(n) without re-sorting.

### 14.4 Treeify / Untreeify Conditions

```
TREEIFY_THRESHOLD   = 8   → list length ≥ 8 triggers treeify attempt
UNTREEIFY_THRESHOLD = 6   → tree size ≤ 6 converts back to list
MIN_TREEIFY_CAPACITY = 64 → won't treeify unless table length ≥ 64
```

**Scenario walkthrough:**
```
Capacity = 16, bucket has 7 nodes → stays as linked list
Capacity = 16, bucket gets 8th node → resize instead of treeify (capacity < 64)
Capacity = 64, bucket gets 8th node → treeify to Red-Black Tree
Tree shrinks to 6 nodes → untreeify back to linked list
Resize happens → all trees may untreeify and rehash
```

### 14.5 How Tree Search Works in get()

```java
TreeNode<K,V> p = root;
while (p != null) {
    int cmp = compare(key, p.key);  // uses Comparable or Comparator
    if (cmp < 0)       p = p.left;
    else if (cmp > 0)  p = p.right;
    else               return p;
}
return null;
```

**Critical:** TreeNode ordering uses `Comparable` if keys implement it, otherwise uses `tieBreakOrder` (class name comparison). Mixed key types in same bucket can cause `ClassCastException` on treeify.

### 14.6 Interview Questions on RB Tree in HashMap

**Q: Why Red-Black Tree and not AVL Tree?**
A: AVL is stricter balanced (faster lookups) but more rotations on insert/delete. HashMap buckets are small; RB tree's looser balance = fewer rotations = better insert performance.

**Q: What is the worst-case time complexity of HashMap get() in Java 8?**
A: O(log n) per bucket when treeified. Average remains O(1) assuming good hash distribution.

**Q: Can HashMap degenerate to O(n) even in Java 8?**
A: Yes — if capacity stays < 64 and all keys collide, it stays a linked list.

---

## 15. DEEP DIVE: ConcurrentHashMap (Complete)

### 15.1 The Problem ConcurrentHashMap Solves

`Hashtable` and `Collections.synchronizedMap(new HashMap<>())` lock the **entire map** for every read and write. Under high concurrency, threads queue up on one lock → throughput collapses. `ConcurrentHashMap` (CHM) allows concurrent reads and fine-grained writes.

### 15.2 Java 7 — Segment Locking (Lock Striping)

```
ConcurrentHashMap
  └── Segment[] (default 16 segments)
        └── each Segment extends ReentrantLock
              └── HashEntry[] (mini HashMap per segment)
```

- Segment count = default 16 → up to 16 threads can write to **different** segments simultaneously
- `concurrencyLevel` constructor param sets segment count (rounded to power of 2)
- Read operations: mostly lock-free (volatile reads on HashEntry chain)
- Write operations: lock only the relevant segment

**Limitation:** Hot segment (many keys hashing to same segment) becomes bottleneck.

### 15.3 Java 8+ — Node Array + CAS + synchronized Bucket Head

Java 8 completely rewrote CHM. No more segments. Structure mirrors HashMap but with concurrency primitives:

```
put(key, value):
  1. If table null → init via CAS
  2. Compute hash, find bucket index
  3. If bucket is null → CAS insert new Node (no lock!)
  4. If bucket head is TreeBin → acquire tree lock, insert in tree
  5. Else → synchronized on FIRST node of bucket (only that bucket locked)
  6. Walk list, update or append
  7. If list length ≥ 8 → treeify
  8. If size changed → addCount() with CAS or CounterCell
```

**Key insight:** Lock granularity = **single bucket head**, not entire map or segment.

### 15.4 CAS (Compare-And-Swap) Explained

```java
// Hardware-level atomic instruction (pseudocode)
boolean compareAndSet(location, expected, newValue) {
    if (location == expected) { location = newValue; return true; }
    return false;  // retry
}
```

CHM uses CAS for: initializing table, inserting into empty bucket, updating size counters (`CounterCell` array — similar to `LongAdder`).

### 15.5 Read Operations — Why No Lock?

`get()` has no `synchronized` block. `Node.val` and `Node.next` are `volatile` → visibility guaranteed. Iterator is **weakly consistent** — never throws `ConcurrentModificationException`.

### 15.6 ConcurrentHashMap Atomic Operations

```java
map.putIfAbsent("key", 1);
map.replace("key", 1, 2);           // CAS: only if current == 1
map.computeIfAbsent("count", k -> 0);
map.merge("count", 1, Integer::sum);
map.forEach(2, (k, v) -> System.out.println(k));  // parallel threshold
```

### 15.7 ConcurrentHashMap vs synchronized HashMap

| | synchronizedMap | ConcurrentHashMap |
|--|-----------------|-------------------|
| Lock scope | Entire map | Per bucket / CAS |
| Reads | Locked | Lock-free |
| Iterator | Fail-fast, needs external sync | Weakly consistent |
| Null key/value | Allowed (HashMap) | Not allowed |
| size() | Exact | Approximate under concurrency |

**Why no nulls in CHM?** `get(key)` returning null means either key absent OR value is null. In concurrent context, you can't distinguish these safely.

### 15.8 ConcurrentHashMap Resize (Java 8)

Multiple threads can **help resize** simultaneously. Uses `sizeCtl` field as coordination flag. `ForwardingNode` placed in old buckets points to new table while migration in progress.

---

## 16. DEEP DIVE: volatile vs Atomic Variables

### 16.1 The Java Memory Model (JMM)

Without synchronization, CPU caches and compiler optimizations mean Thread B may never see Thread A's writes. JMM defines **happens-before** rules that guarantee visibility.

### 16.2 volatile — Visibility, NOT Atomicity

```java
private volatile boolean flag = false;  // visibility guaranteed
private volatile int count = 0;
count++;  // NOT THREAD-SAFE! read → add → write (three steps)
```

**volatile guarantees:** visibility, ordering (memory barrier), happens-before.

**volatile does NOT guarantee:** atomicity of compound operations like `i++`.

### 16.3 Atomic Variables — Visibility AND Atomicity

```java
AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();
count.compareAndSet(5, 10);  // CAS

AtomicReference<String> ref = new AtomicReference<>("initial");
LongAdder adder = new LongAdder();  // better than AtomicLong under high contention
```

### 16.4 volatile vs synchronized vs Atomic

| Feature | volatile | synchronized | Atomic |
|---------|----------|--------------|--------|
| Visibility | Yes | Yes | Yes |
| Atomicity (compound) | No | Yes | Yes (single var) |
| Mutual exclusion | No | Yes | No (CAS retry) |
| Use case | flags | critical sections | counters |

### 16.5 Double-Checked Locking — Why volatile is Required

```java
private static volatile Singleton instance;  // MANDATORY

if (instance == null) {
    synchronized (Singleton.class) {
        if (instance == null) instance = new Singleton();
    }
}
```

Without `volatile`, another thread may see partially constructed object (reference assigned before constructor finishes).

### 16.6 Solving Concurrency Without synchronized

1. `java.util.concurrent` — CHM, BlockingQueue, Semaphore
2. Atomic classes — lock-free counters/state
3. `ReentrantLock`, `ReadWriteLock`
4. Immutable objects — no shared mutable state
5. `ThreadLocal` — thread confinement
6. Database locking — `SELECT FOR UPDATE`, optimistic `@Version`

```java
// Booking system — Semaphore + DB lock
Semaphore seats = new Semaphore(100);
void book(String seatId) {
    if (!seats.tryAcquire()) throw new BookingException("System busy");
    try {
        // SELECT ... FOR UPDATE WHERE seat_id = ? AND status = 'AVAILABLE'
    } finally { seats.release(); }
}
```

---

## 17. DEEP DIVE: default Keyword in Interfaces (Java 8)

### 17.1 Why default Methods Were Added

Before Java 8, adding a method to an interface **broke all implementing classes**. With millions of lines using `Collection`, `List`, etc., this was impossible. `default` methods allow adding new behavior without breaking existing implementations.

### 17.2 Syntax and Rules

```java
interface Vehicle {
    void start();  // abstract

    default void honk() {  // has body — inherited by implementors
        System.out.println("Beep beep!");
    }

    static void checkFuel() {  // belongs to interface, not inherited
        System.out.println("Checking fuel...");
    }

    private void logStart() {  // Java 9 — helper for default methods
        System.out.println("Starting...");
    }
}
```

### 17.3 Diamond Problem Resolution

```java
interface A { default void greet() { System.out.println("A"); } }
interface B { default void greet() { System.out.println("B"); } }

class C implements A, B {
    @Override
    public void greet() { A.super.greet(); }  // must explicitly resolve
}
```

**Resolution order:** Class method wins → subinterface default → compile error if ambiguous.

### 17.4 Real JDK Examples

```java
// Collection — Java 8 added without breaking ArrayList, HashSet
default void forEach(Consumer<? super T> action)
default boolean removeIf(Predicate<? super T> filter)
default Stream<E> stream()
default Spliterator<E> spliterator()
```

### 17.5 Polymorphism with default — Interview Puzzle

```java
class Car {
    void startEngine() { System.out.println("Car startEngine"); }
    void stopEngine()  { System.out.println("Car stopEngine"); }
}
class BMW extends Car {
    @Override
    void startEngine() { System.out.println("BMW startEngine"); }
}

Car ref = new BMW();
ref.startEngine();  // "BMW startEngine" — runtime dispatch
ref.stopEngine();   // "Car stopEngine" — not overridden

Car ref2 = new Car();
ref2.startEngine(); // "Car startEngine" — no polymorphism, same type
```

---

## 18. Real Interview Code Puzzles & Traps

### 18.1 main() Method Signature

| Keyword | Purpose |
|---------|---------|
| `public` | JVM (outside class) must access entry point |
| `static` | Runs without creating object |
| `void` | Returns nothing |
| `main` | Fixed entry point name |
| `String[] args` | Command-line arguments |

### 18.2 String Pool — Deep Explanation

```java
String s1 = "admin123";                // literal → String Pool
String s2 = "admin123";                // same pool reference
String s3 = new String("admin123");    // NEW heap object, NOT in pool

System.out.println(s1 == s2);    // true
System.out.println(s1 == s3);    // false — different objects
System.out.println(s1.equals(s3)); // true — same content
```

**Why `new String()` bypasses pool:** `new` always creates separate heap object even if literal exists in pool. User input (`Scanner.next()`) creates heap strings, not pool literals.

```java
String input = new String("admin123");  // heap
String literal = "admin123";            // pool
System.out.println(input == literal);   // false
System.out.println(input.equals(literal)); // true
```

**`intern()`:** moves/returns pooled reference → `new String("hello").intern() == "hello"` is true.

### 18.3 Integer Caching

```java
Integer a = 127, b = 127;  System.out.println(a == b);  // true (cached -128 to 127)
Integer c = 128, d = 128;  System.out.println(c == d);  // false
Integer x = new Integer(127), y = 127;
System.out.println(x == y);  // false — new always creates heap object
```

### 18.4 Arrays.asList() Trap

```java
List<String> list = Arrays.asList("a", "b", "c");
list.set(0, "x");   // OK
list.add("d");      // UnsupportedOperationException — fixed-size backed by array
// Fix: new ArrayList<>(Arrays.asList("a", "b", "c"))
```

### 18.5 Error vs Exception vs RuntimeException

| | Error | Checked Exception | Unchecked (RuntimeException) |
|--|-------|-------------------|------------------------------|
| Examples | OOM, StackOverflow | IOException, SQLException | NPE, IllegalArgumentException |
| Catch? | Should NOT | Must handle/declare | Optional |
| Cause | JVM/system | External conditions | Programming bugs |

### 18.6 Marker Interface

```java
public interface Serializable {}  // marks class for JVM serialization
public interface Cloneable {}     // permits Object.clone()
// Modern: annotations (@Entity, @Component) replace marker interfaces
```

### 18.7 Fail-Fast vs Fail-Safe

- **Fail-Fast** (ArrayList, HashMap): `modCount` check → `ConcurrentModificationException`
- **Fail-Safe** (CHM, CopyOnWriteArrayList): iterator on snapshot, no exception

---

## 19. Coding Problems with Solutions

### 19.1 Word Frequency Count

```java
List<String> list = Arrays.asList("apple", "banana", "apple", "orange", "banana", "apple");
Map<String, Long> frequency = list.stream()
    .collect(Collectors.groupingBy(s -> s, Collectors.counting()));
// Print: key -> frequency
frequency.forEach((k, v) -> System.out.println(k + " -> " + v));
```

### 19.2 Group Anagrams

```java
// Stream
List<List<String>> result = words.stream()
    .collect(Collectors.groupingBy(word -> {
        char[] ch = word.toCharArray();
        Arrays.sort(ch);
        return new String(ch);
    })).values().stream().collect(Collectors.toList());

// Without stream
Map<String, List<String>> map = new HashMap<>();
for (String word : words) {
    char[] ch = word.toCharArray();
    Arrays.sort(ch);
    map.computeIfAbsent(new String(ch), k -> new ArrayList<>()).add(word);
}
```

### 19.3 Best Time to Buy and Sell Stock

```java
public int maxProfit(int[] prices) {
    int minPrice = Integer.MAX_VALUE, maxProfit = 0;
    for (int price : prices) {
        minPrice = Math.min(minPrice, price);
        maxProfit = Math.max(maxProfit, price - minPrice);
    }
    return maxProfit;
}
```

### 19.4 Longest Substring with K Distinct Characters

```java
public int lengthOfLongestSubstringKDistinct(String s, int k) {
    Map<Character, Integer> freq = new HashMap<>();
    int left = 0, maxLen = 0;
    for (int right = 0; right < s.length(); right++) {
        freq.merge(s.charAt(right), 1, Integer::sum);
        while (freq.size() > k) {
            char c = s.charAt(left);
            if (freq.merge(c, -1, Integer::sum) == 0) freq.remove(c);
            left++;
        }
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

### 19.5 Valid Sudoku

```java
public boolean isValidSudoku(char[][] board) {
    Set<String> seen = new HashSet<>();
    for (int i = 0; i < 9; i++)
        for (int j = 0; j < 9; j++) {
            if (board[i][j] == '.') continue;
            String c = String.valueOf(board[i][j]);
            if (!seen.add(c + " row " + i) || !seen.add(c + " col " + j)
                || !seen.add(c + " box " + i/3 + j/3)) return false;
        }
    return true;
}
```

### 19.6 Stock Tracker — PriorityQueue

```java
PriorityQueue<Integer> buys = new PriorityQueue<>();  // min-heap
PriorityQueue<Integer> sells = new PriorityQueue<>(Collections.reverseOrder());
// Match sell > buy for profit; ideal for multiple price events
```

### 19.7 Booking System — Semaphore + DB Lock

Use `Semaphore` to limit concurrent requests + `SELECT FOR UPDATE` for row-level seat locking. See Section 16.6.

---

## 20. Tough Interview Q&A Bank

### Core Java

**Q: What is OOPS?**
A: Encapsulation, Inheritance, Polymorphism, Abstraction — code reuse, security, maintainability via objects.

**Q: Array vs ArrayList vs LinkedList?**

| | Array | ArrayList | LinkedList |
|--|-------|-----------|------------|
| Structure | Fixed contiguous | Dynamic array | Doubly linked nodes |
| get(i) | O(1) | O(1) | O(n) |
| add(end) | N/A if full | O(1) amortized | O(1) |
| add(middle) | O(n) | O(n) | O(n) find + O(1) link |
| Cache locality | Best | Good | Poor |

**Q: Comparable vs Comparator?**
A: Comparable = natural order inside class (`compareTo`). Comparator = external flexible ordering (`compare`), multiple sort strategies.

### Collections & Concurrency

**Q: HashMap all versions?** → Section 13
**Q: Red-Black Tree in HashMap?** → Section 14
**Q: ConcurrentHashMap deep dive?** → Section 15
**Q: volatile vs Atomic?** → Section 16
**Q: default keyword Java 8?** → Section 17
**Q: Arrays.asList() remove?** → UnsupportedOperationException (fixed-size)
**Q: Resource allocation without synchronized?** → CHM, Semaphore, Atomic, ReentrantLock, immutable objects, DB locks

### Java 8 / 17

**Q: All Java 8 features?**
1. Lambda expressions  2. Functional interfaces  3. Stream API  4. Optional
5. Method references  6. **default methods in interfaces**  7. Static methods in interfaces
8. java.time API  9. CompletableFuture  10. Parallel array sorting  11. StringJoiner, Base64

**Q: Java 8 vs 17?** Records, Sealed classes, Pattern matching, Text blocks, Switch expressions, ZGC production, HttpClient (11), var (10), modules (9).

### Spring (commonly asked with Java)

**Q: @Valid vs @Validated?** `@Valid` = JSR-380 standard. `@Validated` = Spring, supports validation groups.

**Q: @Transactional propagation?** REQUIRED (default), REQUIRES_NEW, NESTED, SUPPORTS, NOT_SUPPORTED, MANDATORY, NEVER.

**Q: ApplicationContext vs BeanFactory?** ApplicationContext = superset with events, i18n, AOP, eager init.

**Q: Circular dependency fix?** Redesign, `@Lazy`, setter injection, `ObjectProvider`.

**Q: JPA vs CrudRepository?** CrudRepository = basic CRUD. JpaRepository extends with flush, paging, batch delete.

**Q: Bean lifecycle?** Instantiate → inject → `@PostConstruct` → use → `@PreDestroy`.

### Architecture

**Q: Monolithic vs Microservices?** Single deploy vs independent services; trade-off complexity vs scaling isolation.

**Q: Saga orchestration vs choreography?** Orchestration = central coordinator. Choreography = event-driven, decentralized.

**Q: gRPC vs REST?** gRPC = HTTP/2, Protobuf, typed, streaming, fast inter-service. REST = HTTP/JSON, human-readable, browser-friendly.

### DSA in Java Rounds

| Problem | Technique | Structure |
|---------|-----------|-----------|
| Valid Sudoku | HashSet row/col/box | HashSet |
| Buy/sell stock | Single pass min | variables |
| K distinct substring | Sliding window | HashMap |
| Group anagrams | Sorted key | HashMap |
| Word frequency | groupingBy | Stream |
| Multi-event stock | Greedy + heap | PriorityQueue |
| Booking concurrency | Semaphore + DB lock | Semaphore |

### Hibernate / ORM

**Q: What is Hibernate?**
A: ORM framework mapping Java classes to DB tables, objects to rows. Features: automatic mapping, HQL, caching, lazy loading, transaction management. Reduces JDBC boilerplate, database independence.

---

## INTERVIEW Q&A — JAVA

**Q: Why is String immutable in Java?**
A: 1) String Pool requires immutability for safe sharing. 2) Thread-safe without synchronization. 3) Safe for use as HashMap keys (hashCode never changes). 4) Security — passwords and file paths can't be altered.

**Q: Difference between `==` and `equals()`?**
A: `==` compares references (memory address). `equals()` compares content. For `String`, `equals()` compares characters. Always use `equals()` for objects.

**Q: What happens when HashMap reaches 75% capacity?**
A: Rehashing occurs. A new array of double the capacity is created, all entries are re-computed (hash, index) and moved. This is O(n) operation. That's why initial capacity matters for performance-critical code. For full internals see [Section 13](#13-deep-dive-hashmap-internals-java-7-vs-8).

**Q: Why override `hashCode()` when overriding `equals()`?**
A: HashMap and HashSet use `hashCode()` to find the bucket. If two equal objects have different hashCodes, they land in different buckets and `get()` returns null even though the key "exists".

**Q: ConcurrentHashMap vs synchronized HashMap?**
A: `Collections.synchronizedMap()` locks the entire map for every operation. `ConcurrentHashMap` uses CAS and segment/bucket-level locking for much better concurrency. Also, `ConcurrentHashMap` doesn't allow null keys/values. For full depth see [Section 15](#15-deep-dive-concurrenthashmap-complete).

**Q: What is the difference between `Callable` and `Runnable`?**
A: `Runnable.run()` returns void and cannot throw checked exceptions. `Callable.call()` returns a value of generic type and can throw checked exceptions. `Callable` is used with `ExecutorService.submit()` and returns a `Future`.

**Q: Explain `volatile`.**
A: `volatile` ensures memory visibility — writes to a volatile variable are immediately visible to all threads. It prevents CPU cache and compiler reordering. It does NOT ensure atomicity. Use `AtomicInteger` for atomic compound operations. For full depth see [Section 16](#16-deep-dive-volatile-vs-atomic-variables).

**Q: What are virtual threads?**
A: Introduced in Java 21 (Project Loom). Lightweight threads managed by the JVM, not OS. Platform threads have ~1MB stack; virtual threads have ~few KB. You can create millions of virtual threads. During blocking I/O, the JVM "parks" the virtual thread and uses the carrier thread for other work. Ideal for I/O-bound, not CPU-bound tasks.

**Q: How does G1GC work?**
A: G1 divides the heap into equal-sized regions (1–32MB). Regions are dynamically assigned to Eden, Survivor, or Old. G1 tracks "liveness" of each region and collects the most garbage-dense ones first (hence "Garbage First"). This gives predictable, configurable pause times (`-XX:MaxGCPauseMillis=200`).

---

## 22. Additional Core Java Interview Q&A

### Multithreading & Concurrency

**Q: Difference between `wait()`, `sleep()`, and `join()`?**

| | `wait()` | `sleep()` | `join()` |
|--|----------|-----------|----------|
| Class | `Object` | `Thread` | `Thread` |
| Purpose | Wait for notification on a lock | Pause current thread for N ms | Wait for another thread to finish |
| Releases lock? | **Yes** (must be in `synchronized`) | No | No |
| Woken by | `notify()` / `notifyAll()` | Time expires | Target thread dies |
| Use case | Producer-consumer, coordination | Delay, backoff | Main waits for worker |

```java
// wait() — must hold monitor
synchronized (lock) {
    while (!condition) lock.wait();  // releases lock, waits
}

// sleep() — just pauses, keeps lock if inside synchronized
Thread.sleep(1000);

// join() — wait for thread t to complete
t.start();
t.join();
```

**Q: Explain `volatile` vs `synchronized`?**
A: See [Section 16](#16-deep-dive-volatile-vs-atomic-variables). **`volatile`** = visibility + ordering only; no mutual exclusion; `i++` still unsafe. **`synchronized`** = visibility + mutual exclusion; only one thread in block; can cause deadlock if misused. Use volatile for flags; synchronized or `Atomic*` for compound operations.

**Q: Explain ThreadLocal with a use case?**
A: Each thread gets its **own copy** of a variable — no sharing, no locking.

```java
ThreadLocal<UserContext> userCtx = new ThreadLocal<>();

// In filter/interceptor — set at request start
userCtx.set(new UserContext(userId, roles));

// Anywhere in same thread
UserContext ctx = userCtx.get();

// CRITICAL in thread pools — MUST remove or memory leak
try {
    // handle request
} finally {
    userCtx.remove();
}
```

**Use cases:** User context in web apps, `SimpleDateFormat` (not thread-safe), transaction IDs, per-request logging MDC.

**Q: Scenario — Payment gateway: multiple transactions update account balance in parallel. How to ensure thread safety?**

A: Layered approach:
1. **`@Version` optimistic locking** on `Account` entity — retry on `OptimisticLockException`
2. **Pessimistic lock** — `@Lock(PESSIMISTIC_WRITE)` or `SELECT balance FROM accounts WHERE id=? FOR UPDATE`
3. **`AtomicLong` / database `UPDATE balance = balance - ? WHERE id=? AND balance >= ?`** — atomic SQL, no read-modify-write race
4. **Serialize per account** — partition Kafka by `accountId` so one consumer per account
5. **Idempotency keys** — prevent duplicate charges on retry

```java
@Transactional
public void debit(String accountId, BigDecimal amount) {
    Account acc = accountRepo.findByIdWithLock(accountId);  // FOR UPDATE
    if (acc.getBalance().compareTo(amount) < 0)
        throw new InsufficientFundsException();
    acc.setBalance(acc.getBalance().subtract(amount));
}
```

Never: `balance = getBalance(); balance -= amount; setBalance(balance);` without a lock.

### JVM & Memory

**Q: Explain class loading mechanism (Bootstrap, Extension, Application classloader)?**

```
Bootstrap ClassLoader (null in Java)
  └── loads rt.jar / core JDK classes (java.lang.*)
        ↑ parent
Extension ClassLoader
  └── loads ext directories (javax.* extensions)
        ↑ parent
Application / System ClassLoader
  └── loads classpath (your .class files, JARs)
```

**Delegation model:** Child asks parent first. Parent loads if it can; else child tries. Prevents reloading `java.lang.String` from your JAR.

**Custom classloader:** Spring, Tomcat, OSGi use custom loaders for hot deploy / isolation.

**Q: How does Garbage Collection work in the JVM?**
A: See Section 11. Summary: objects created in Eden → Minor GC moves survivors to Survivor → promoted to Old Gen after age threshold → Major/Full GC when Old Gen full. Collectors: G1 (default Java 9+), ZGC, Shenandoah for low latency. GC roots: stack references, static fields, JNI refs. Unreachable objects are collected. Tune with `-Xms`, `-Xmx`, `-XX:+UseG1GC`.

### Object & Exceptions

**Q: Deep copy vs Shallow copy?**

| | Shallow copy | Deep copy |
|--|--------------|-----------|
| Primitive fields | Copied | Copied |
| Object references | **Same object shared** | **New objects created** |
| Risk | Mutating nested object affects both | Independent copies |

```java
// Shallow — clone() or copy constructor copies references
class Person implements Cloneable {
    Address address;
    public Object clone() throws CloneNotSupportedException {
        return super.clone();  // address ref shared!
    }
}

// Deep — manually clone nested objects
public Person deepClone() {
    return new Person(this.name, this.address.copy());
}
```

**Serialization** (`Serializable`) can deep-copy if all nested objects are serializable. Libraries: Apache Commons `SerializationUtils`, JSON round-trip.

**Q: Difference between Checked vs Unchecked exceptions?**

| | Checked | Unchecked |
|--|---------|-----------|
| Extends | `Exception` (not RuntimeException) | `RuntimeException` |
| Compile-time | Must catch or declare `throws` | Optional |
| Examples | `IOException`, `SQLException` | `NullPointerException`, custom `OrderNotFoundException` |
| Use when | Recoverable external failure | Programming bug / business rule violation |

### Object Methods (already in Q&A — expanded)

**Q: How does `equals()` differ from `==`? Why override `hashCode()` with `equals()`?**
A: `==` compares references. `equals()` compares content (if overridden). **hashCode contract:** equal objects → same hashCode. Needed for `HashMap`/`HashSet` — different hashCode → different bucket → `get()` returns null. See Sections 13, 18, and INTERVIEW Q&A above.

**Q: How does ConcurrentHashMap achieve thread safety internally?**
A: See [Section 15](#15-deep-dive-concurrenthashmap-complete). Java 8+: no full-map lock; CAS for empty buckets; `synchronized` on bucket head for collisions; `volatile` reads; weakly consistent iterator.
