# Real Interview Questions — Company-wise Q&A
### Actual questions from real technical rounds, with full answers

---

## TABLE OF CONTENTS
1. [How to use this guide](#1-how-to-use-this-guide)
2. [Product Company — Java Backend, Round 1](#2-product-company--java-backend-round-1)
3. [More companies coming soon](#3-more-companies-coming-soon)

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

## 3. More companies coming soon

New company rounds will be added here as you share them. Each gets its own `## Company — Role, Round N` section with full Q&A.

**Planned format per entry:**
- Company / role / round metadata
- Questions grouped by topic
- Fast answer + deep answer + code where needed
- Test cases / edge cases for coding problems

*Send your next interview questions and we'll add the next section.*
