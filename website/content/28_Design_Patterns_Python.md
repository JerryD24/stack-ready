# Design Patterns in Python — The Pythonic Way (Advanced Examples)

> The GoF patterns were written for C++/Java. In Python, **first-class functions, duck typing, decorators, generators, and modules** let you express many patterns far more simply — and some patterns *disappear* entirely. This guide shows each pattern the **Pythonic** way, with the theory of *what changes vs Java* and realistic backend examples. Interview signal: knowing which patterns Python makes trivial (Strategy, Command, Iterator) and which still matter (State, Observer, Adapter).

## TABLE OF CONTENTS
- 1. Design Patterns the Pythonic Way
- 2. Python Idioms That Replace Patterns
- 3. Creational Patterns Overview
- 4. Singleton
- 5. Factory Method
- 6. Abstract Factory
- 7. Builder
- 8. Prototype
- 9. Adapter
- 10. Bridge
- 11. Composite
- 12. Decorator
- 13. Facade
- 14. Flyweight
- 15. Proxy
- 16. Chain of Responsibility
- 17. Command
- 18. Iterator
- 19. Mediator
- 20. Memento
- 21. Observer
- 22. State
- 23. Strategy
- 24. Template Method
- 25. Visitor
- 26. Interpreter
- 27. Interview Q&A

---

## 1. Design Patterns the Pythonic Way

**Theory.** A design pattern is a named solution to a recurring design problem. The *problems* are language-agnostic, but the *solutions* depend on what the language gives you for free. Python provides:

- **Functions are objects** — you can pass, store, and return them. Many patterns whose whole point is "wrap a behaviour in an object" become "just pass the function".
- **Duck typing** — you don't need a shared interface/`implements`; if it has the method, it works. This dissolves a lot of Adapter/Strategy boilerplate.
- **Decorators, generators, context managers, descriptors** — built-in language features that *are* patterns.

So the Pythonic rule is: **reach for a class-heavy GoF structure only when you genuinely need state, polymorphism over types, or a stable extension point** — otherwise use the lighter idiom.

---

## 2. Python Idioms That Replace Patterns

| GoF Pattern | Pythonic replacement |
|---|---|
| Strategy | a plain function / `Callable` passed as an argument |
| Command | a closure or `functools.partial` |
| Iterator | a **generator** (`yield`) |
| Singleton | a **module** (modules are singletons) |
| Template Method | a higher-order function taking step callbacks |
| Decorator (structural) | the `@decorator` syntax |
| Factory | a dict dispatch `{key: constructor}` |
| Observer | callbacks list, or `blinker`/signals |
| Adapter | duck typing / a small wrapper function |

> Key interview point: "In Python I'd first ask whether the pattern is even needed — e.g., Strategy is usually just a function. I use the full class structure when I need shared state, registration, or to switch on object *type*."

---

## 3. Creational Patterns Overview

Creational patterns hide *how* objects are made. In Python, construction is cheap and dynamic (`type()`, metaclasses, `__new__`, `@classmethod` factories), so heavy creational machinery is rarer. The common Pythonic creational tools:
- `@classmethod` **named constructors** (`User.from_dict(...)`) — far more common than Factory classes.
- **dict dispatch** for selecting a concrete type.
- **`dataclasses`** for boilerplate-free value objects.

---

## 4. Singleton

**Intent.** Exactly one instance, globally accessible.

**Pythonic theory.** A **module is already a singleton** — imported once and cached in `sys.modules`. So the cleanest Singleton in Python is "put state/functions in a module." When you must have a class, use a metaclass or `__new__`.

**Corporate example — a shared config/connection registry.**

```python
# Option A (preferred): module-level singleton — config.py
_settings = {}
def get(key): return _settings.get(key)
def load():   _settings.update(_fetch_from_vault())

# Option B: metaclass when you need a real class instance
class Singleton(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class DbPool(metaclass=Singleton):
    def __init__(self): self.conns = self._open()   # runs once
```

**Gotcha:** the metaclass approach is not thread-safe by default — guard `__call__` with a `threading.Lock` if instances may be created concurrently.

---

## 5. Factory Method

**Intent.** Decide which concrete class to instantiate without hard-coding it at the call site.

**Pythonic theory.** No need for a creator class hierarchy — use a **dict dispatch** or a `@classmethod`. Classes are first-class, so you map keys → classes.

**Corporate example — notifier selection.**

```python
class EmailNotifier:
    def send(self, to, msg): ...
class SmsNotifier:
    def send(self, to, msg): ...
class PushNotifier:
    def send(self, to, msg): ...

_REGISTRY = {"email": EmailNotifier, "sms": SmsNotifier, "push": PushNotifier}

def make_notifier(channel: str):
    try:
        return _REGISTRY[channel]()      # the "factory"
    except KeyError:
        raise ValueError(f"unknown channel {channel}")

notifier = make_notifier(user.preferred_channel)
notifier.send(user.contact, "Your order shipped")
```

Adding a `WhatsAppNotifier` is one registry line — Open/Closed without a class hierarchy.

---

## 6. Abstract Factory

**Intent.** Create **families** of related objects that must stay consistent.

**Pythonic theory.** Often a single object (or module) exposing factory functions. Duck typing means the "abstract" part is implicit — any object with the right methods qualifies.

**Corporate example — pluggable cloud backend (queue + blob + secrets).**

```python
from typing import Protocol

class CloudBackend(Protocol):          # structural "interface", no inheritance needed
    def queue(self): ...
    def blob(self): ...
    def secrets(self): ...

class AwsBackend:
    def queue(self):   return SqsClient()
    def blob(self):    return S3Client()
    def secrets(self): return SecretsManager()

class GcpBackend:
    def queue(self):   return PubSubClient()
    def blob(self):    return GcsClient()
    def secrets(self): return GcpSecrets()

def get_backend(name: str) -> CloudBackend:
    return {"aws": AwsBackend, "gcp": GcpBackend}[name]()
```

`Protocol` (PEP 544) gives static checking without forcing runtime inheritance — very Pythonic.

---

## 7. Builder

**Intent.** Assemble a complex object step-by-step.

**Pythonic theory.** Python has **keyword arguments and defaults**, so telescoping constructors aren't a problem — Builder is far less needed. Use it for **fluent** APIs or when assembly has real steps/validation. `dataclasses` cover most "value object" cases.

**Corporate example — fluent query/report builder.**

```python
from dataclasses import dataclass, field

@dataclass
class Report:
    source: str
    columns: list[str] = field(default_factory=list)
    filters: dict = field(default_factory=dict)
    limit: int | None = None

class ReportBuilder:
    def __init__(self, source): self._r = Report(source=source)
    def select(self, *cols):   self._r.columns += cols; return self     # fluent
    def where(self, **kw):     self._r.filters.update(kw); return self
    def top(self, n):          self._r.limit = n; return self
    def build(self) -> Report: return self._r

report = (ReportBuilder("invoices")
          .select("id", "amount").where(status="PAID").top(100).build())
```

For simple objects, prefer just `Report(source="invoices", limit=100)` — kwargs *are* the builder.

---

## 8. Prototype

**Intent.** Create new objects by cloning an existing one.

**Pythonic theory.** Python has cloning **built in**: `copy.copy` (shallow) and `copy.deepcopy` (deep). You rarely write a Prototype class — you call `deepcopy` or implement `__copy__`/`__deepcopy__`.

**Corporate example — per-tenant config derived from a base template.**

```python
import copy
from dataclasses import dataclass, field

@dataclass
class TenantConfig:
    plan: str
    limits: dict = field(default_factory=dict)
    features: list[str] = field(default_factory=list)

base = TenantConfig(plan="standard", limits={"users": 50}, features=["sso"])
acme = copy.deepcopy(base)          # independent clone, nested dict/list copied too
acme.limits["users"] = 500          # base untouched
```

**Gotcha:** `copy.copy` is shallow — nested mutable objects stay shared. Use `deepcopy` when nested state must be independent.

---

## 9. Adapter

**Intent.** Make an incompatible interface match the one your code expects.

**Pythonic theory.** Duck typing means you often just need a thin wrapper (function or class) exposing the expected method names. Still genuinely useful for wrapping third-party SDKs.

**Corporate example — adapting a legacy payment SDK to our `charge()` port.**

```python
class LegacyPayGateway:                      # third-party, can't change
    def do_payment(self, acct, amount_dollars, currency): ...

class PaymentPort(Protocol):
    def charge(self, account: str, paise: int) -> bool: ...

class LegacyPayAdapter:                       # adapts to our port
    def __init__(self): self._sdk = LegacyPayGateway()
    def charge(self, account: str, paise: int) -> bool:
        res = self._sdk.do_payment(account, paise / 100, "INR")
        return res.get("status") == "OK"
```

Now the app depends on `charge()` and never sees the vendor's `do_payment` shape.

---

## 10. Bridge

**Intent.** Separate an abstraction from its implementation so both vary independently (avoid M×N subclasses).

**Pythonic theory.** Implemented with composition — inject the "implementor" object. Duck typing keeps it light.

**Corporate example — alert *type* × delivery *channel*.**

```python
class Channel(Protocol):
    def send(self, to: str, body: str) -> None: ...

class EmailChannel:
    def send(self, to, body): ...
class SlackChannel:
    def send(self, to, body): ...

class Alert:                                  # abstraction holds a channel
    def __init__(self, channel: Channel): self.channel = channel
    def fire(self, to: str): raise NotImplementedError

class OutageAlert(Alert):
    def fire(self, to): self.channel.send(to, "SERVICE DOWN")

class BillingAlert(Alert):
    def fire(self, to): self.channel.send(to, "Payment failed")

OutageAlert(SlackChannel()).fire("#ops")      # mix any alert with any channel
```

---

## 11. Composite

**Intent.** Treat individual objects and groups uniformly via a tree.

**Pythonic theory.** Same as Java but lighter — a common base or just duck typing on a `size()`/`render()` method. Recursion + generators read cleanly.

**Corporate example — folder/asset hierarchy size roll-up.**

```python
class File:
    def __init__(self, size): self._size = size
    def size(self): return self._size

class Folder:
    def __init__(self): self.children = []
    def add(self, node): self.children.append(node); return self
    def size(self):                                   # uniform recursion
        return sum(child.size() for child in self.children)

root = Folder().add(File(100)).add(Folder().add(File(50)).add(File(25)))
print(root.size())   # 175
```

---

## 12. Decorator

**Intent.** Add responsibilities to an object dynamically.

**Pythonic theory.** Python has **two** things called "decorator": (a) the GoF *structural* pattern (wrap an object), and (b) the `@decorator` *syntax* (wrap a function/class). The syntax version is the everyday tool for cross-cutting concerns. Always use `functools.wraps` to preserve metadata.

**Corporate example — a retry-with-backoff decorator for flaky external calls (a classic senior interview ask).**

```python
import functools, random, time

def retry(times=3, base_delay=0.2, exceptions=(Exception,)):
    def deco(fn):
        @functools.wraps(fn)                  # preserve __name__/__doc__
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return fn(*args, **kwargs)
                except exceptions as e:
                    if attempt == times:
                        raise
                    delay = base_delay * (2 ** (attempt - 1))
                    delay += random.uniform(0, delay)   # jitter
                    time.sleep(delay)
        return wrapper
    return deco

@retry(times=4, exceptions=(TimeoutError, ConnectionError))
def fetch_rate(pair): ...                     # now auto-retries with backoff
```

**Structural decorator (wrapping an object), for stacking concerns:**

```python
class PricingService:
    def quote(self, sku): ...

class CachingPricing:                          # wraps and adds caching
    def __init__(self, inner): self._inner = inner; self._cache = {}
    def quote(self, sku):
        if sku not in self._cache: self._cache[sku] = self._inner.quote(sku)
        return self._cache[sku]
```

---

## 13. Facade

**Intent.** One simple entry point over a complex subsystem.

**Pythonic theory.** Often just a **module** of high-level functions, or one class delegating to several. Modules make excellent facades.

**Corporate example — onboarding facade.**

```python
class OnboardingService:
    def __init__(self, kyc, accounts, wallet, mailer):
        self.kyc, self.accounts, self.wallet, self.mailer = kyc, accounts, wallet, mailer

    def onboard(self, signup) -> str:          # hides the choreography
        self.kyc.verify(signup.documents)
        cid = self.accounts.create(signup.profile)
        self.wallet.open(cid)
        self.mailer.welcome(cid)
        return cid
```

---

## 14. Flyweight

**Intent.** Share immutable, fine-grained objects to save memory.

**Pythonic theory.** Python already interns small ints (−5..256) and some strings. You implement Flyweight with a cache (often via `functools.lru_cache` on a factory) and `__slots__` to shrink per-object memory.

**Corporate example — shared currency objects across millions of line items.**

```python
import functools

class Currency:
    __slots__ = ("code", "minor_units")        # no per-instance __dict__ -> less memory
    def __init__(self, code, minor_units=2):
        self.code, self.minor_units = code, minor_units

@functools.lru_cache(maxsize=None)             # returns the same instance per code
def currency(code: str) -> Currency:
    return Currency(code)

assert currency("INR") is currency("INR")      # shared flyweight
```

`__slots__` is itself a key memory-optimization interview topic — mention it.

---

## 15. Proxy

**Intent.** A surrogate that controls access (lazy, security, caching, remote).

**Pythonic theory.** Implement with a wrapper, or dynamically via `__getattr__` to forward calls. `functools.cached_property` is a built-in lazy proxy for attributes.

**Corporate example — lazy + access-controlled report proxy.**

```python
class RealReportService:
    def generate(self, report_id): ...         # heavy: warehouse query

class ReportProxy:
    def __init__(self, user): self._user = user; self._real = None
    def generate(self, report_id):
        if not self._user.can_access(report_id):
            raise PermissionError(report_id)    # access control
        if self._real is None:
            self._real = RealReportService()    # lazy init
        return self._real.generate(report_id)
```

**Dynamic forwarding variant:** `def __getattr__(self, name): return getattr(self._real, name)` proxies everything else automatically.

---

## 16. Chain of Responsibility

**Intent.** Pass a request through ordered handlers until one handles it.

**Pythonic theory.** Can be a list of callables you iterate, or linked handler objects. The callable-list version is very Pythonic.

**Corporate example — request validation pipeline.**

```python
from typing import Callable

Middleware = Callable[[dict], dict]            # each step transforms/validates ctx

def authenticate(ctx): ...; return ctx
def validate(ctx):     ...; return ctx
def enrich(ctx):       ...; return ctx

def run_pipeline(ctx: dict, steps: list[Middleware]):
    for step in steps:                          # the "chain"
        ctx = step(ctx)
    return ctx

run_pipeline(request_ctx, [authenticate, validate, enrich])
```

This is exactly how WSGI/ASGI middleware and Django middleware work.

---

## 17. Command

**Intent.** Encapsulate a request as an object for queuing, logging, undo.

**Pythonic theory.** A command is usually just a **closure** or `functools.partial` — you don't need a `Command` class with `execute()`.

**Corporate example — a deferred job queue.**

```python
import functools
from collections import deque

def charge_customer(payment_svc, order_id):
    payment_svc.charge(order_id)

queue = deque()
queue.append(functools.partial(charge_customer, payment_svc, "ORD-1"))  # a "command"
queue.append(lambda: send_email("welcome", user))                        # another

while queue:
    command = queue.popleft()
    command()                                    # execute, decoupled from creator
```

Use a class only if you need `undo()` or to persist/serialize the command.

---

## 18. Iterator

**Intent.** Sequential access without exposing internals.

**Pythonic theory.** This pattern is **built into the language** — `__iter__`/`__next__`, and most powerfully **generators** (`yield`). Generators give lazy, memory-efficient iteration for free; you almost never write the explicit class.

**Corporate example — transparently streaming a paginated API.**

```python
def iter_customers(api):
    cursor = ""
    while cursor is not None:
        page = api.fetch(cursor)
        yield from page.items                    # lazily yields each customer
        cursor = page.next_cursor                # None when exhausted

for customer in iter_customers(api):             # caller never sees paging
    process(customer)
```

Generators are lazy: nothing is fetched until iterated, and only one page is in memory at a time.

---

## 19. Mediator

**Intent.** Centralize complex interactions so peers don't reference each other.

**Pythonic theory.** Same as Java — a coordinator class. Often combined with callbacks/events.

**Corporate example — order saga coordinator.**

```python
class OrderMediator:
    def __init__(self, inventory, payment, shipping):
        self.inventory, self.payment, self.shipping = inventory, payment, shipping

    def place(self, order):
        if not self.inventory.reserve(order):
            return self._fail(order, "OUT_OF_STOCK")
        if not self.payment.charge(order):
            self.inventory.release(order)
            return self._fail(order, "PAYMENT_FAILED")
        self.shipping.schedule(order)            # peers never call each other

    def _fail(self, order, reason): ...
```

---

## 20. Memento

**Intent.** Capture and restore an object's state without breaking encapsulation.

**Pythonic theory.** Often implemented with `copy.deepcopy`, `dataclasses.replace`, or `__getstate__`/`__setstate__` (the pickle protocol).

**Corporate example — undo for a document/workflow.**

```python
import copy

class Editor:
    def __init__(self): self.content = ""
    def save(self):        return copy.deepcopy(self.content)   # memento = snapshot
    def restore(self, m):  self.content = m

editor = Editor()
history = []
history.append(editor.save())          # checkpoint
editor.content = "risky edit"
editor.content = editor.__init__() or history.pop()  # rollback to last snapshot
```

For dataclasses: `snapshot = dataclasses.replace(obj)` then restore by reassignment.

---

## 21. Observer

**Intent.** One-to-many notification (pub/sub).

**Pythonic theory.** A list of callbacks is the idiomatic form; libraries like `blinker` or framework signals (Django signals) formalize it.

**Corporate example — domain events on order placed.**

```python
class OrderService:
    def __init__(self): self._subscribers = []
    def subscribe(self, callback): self._subscribers.append(callback)
    def place(self, order):
        # persist...
        for cb in self._subscribers:             # fan-out
            cb(order)

svc = OrderService()
svc.subscribe(lambda o: send_email("order", o))
svc.subscribe(lambda o: analytics.track("order_placed", o))
svc.place(order)
```

For async fan-out, subscribers can be coroutines awaited via `asyncio.gather`.

---

## 22. State

**Intent.** Behaviour changes with internal state; replace big `if/elif` with state objects.

**Pythonic theory.** Still valuable — Python's dynamism doesn't remove the need for explicit state machines. Use classes or `enum` + transition table.

**Corporate example — order lifecycle as state objects.**

```python
class OrderState:
    def pay(self, ctx):  raise NotImplementedError
    def ship(self, ctx): raise NotImplementedError

class Created(OrderState):
    def pay(self, ctx):  ctx.state = Paid()
    def ship(self, ctx): raise RuntimeError("pay first")

class Paid(OrderState):
    def pay(self, ctx):  raise RuntimeError("already paid")
    def ship(self, ctx): ctx.state = Shipped()

class Shipped(OrderState):
    def pay(self, ctx):  raise RuntimeError("done")
    def ship(self, ctx): raise RuntimeError("done")

class Order:
    def __init__(self): self.state = Created()
    def pay(self):  self.state.pay(self)
    def ship(self): self.state.ship(self)
```

**State vs Strategy:** identical shape; State transitions itself based on events, Strategy is chosen by the client.

---

## 23. Strategy

**Intent.** Swap interchangeable algorithms at runtime.

**Pythonic theory.** The poster child for "just use a function." Since functions are first-class, a Strategy is usually a `Callable` passed in — no interface, no class.

**Corporate example — pluggable discount policy.**

```python
from typing import Callable

Money = float
DiscountStrategy = Callable[[Money], Money]

no_discount: DiscountStrategy   = lambda s: s
def percent_off(pct): return lambda s: s * (1 - pct / 100)
def loyalty(tier):    return lambda s: s * (0.9 if tier == "GOLD" else 1.0)

class Checkout:
    def __init__(self, strategy: DiscountStrategy = no_discount):
        self.strategy = strategy
    def total(self, subtotal: Money) -> Money:
        return self.strategy(subtotal)

Checkout(percent_off(10)).total(1000)    # 900
```

Compare to Java's interface + multiple classes — Python collapses it to functions.

---

## 24. Template Method

**Intent.** Fixed algorithm skeleton with overridable steps.

**Pythonic theory.** Use either classic inheritance (abstract base with `abstractmethod`) or a higher-order function that takes step callbacks (often more Pythonic).

**Corporate example — ETL pipeline skeleton.**

```python
from abc import ABC, abstractmethod

class ImportJob(ABC):
    def run(self):                       # template method (fixed order)
        rows = self.extract()
        rows = self.transform(rows)
        self.load(rows)

    @abstractmethod
    def extract(self): ...
    @abstractmethod
    def transform(self, rows): ...
    @abstractmethod
    def load(self, rows): ...

class CsvBillingImport(ImportJob):
    def extract(self): ...
    def transform(self, rows): ...
    def load(self, rows): ...
```

Functional alternative: `def run_etl(extract, transform, load): load(transform(extract()))`.

---

## 25. Visitor

**Intent.** Add operations over a fixed set of element types without modifying them.

**Pythonic theory.** Classic double-dispatch works, but Python often uses `functools.singledispatch` to dispatch on type — much cleaner than `accept/visit`.

**Corporate example — tax computation over heterogeneous bill items via `singledispatch`.**

```python
from functools import singledispatch
from dataclasses import dataclass

@dataclass
class Product:      price: float
@dataclass
class Subscription: monthly: float

@singledispatch
def tax(item) -> float:
    raise NotImplementedError(type(item))

@tax.register
def _(item: Product) -> float:      return item.price * 0.18
@tax.register
def _(item: Subscription) -> float: return item.monthly * 0.18

total_tax = sum(tax(i) for i in bill_items)   # adds new operation w/o touching classes
```

`singledispatch` is the Pythonic Visitor — add a new operation as a new generic function.

---

## 26. Interpreter

**Intent.** Model a small grammar/DSL and evaluate it.

**Pythonic theory.** Build expression objects (or use `ast`/`eval` carefully). For real DSLs use `lark`/`pyparsing`; the pattern is mostly for interview/teaching.

**Corporate example — a promotion eligibility rule engine.**

```python
class Expr:                                   # base
    def eval(self, ctx: dict) -> bool: ...

class And(Expr):
    def __init__(self, l, r): self.l, self.r = l, r
    def eval(self, ctx): return self.l.eval(ctx) and self.r.eval(ctx)

class Gt(Expr):
    def __init__(self, key, val): self.key, self.val = key, val
    def eval(self, ctx): return ctx[self.key] > self.val

class Eq(Expr):
    def __init__(self, key, val): self.key, self.val = key, val
    def eval(self, ctx): return ctx[self.key] == self.val

rule = And(Gt("age", 18), Eq("tier", "GOLD"))
rule.eval({"age": 25, "tier": "GOLD"})        # True
```

**Never** use bare `eval()` on user-supplied strings — it's a code-execution vulnerability.

---

## 27. Interview Q&A

**Q1. Which design patterns become unnecessary or trivial in Python, and why?**
Strategy and Command (functions/closures are first-class), Iterator (generators), Singleton (modules are singletons), Template Method (higher-order functions), and parts of Factory (dict dispatch / `@classmethod`). Python's dynamic features replace the boilerplate classes these patterns need in Java.

**Q2. There are two "decorators" in Python — explain the difference.**
The **GoF Decorator** is a structural pattern: wrap an object to add behaviour, stackable, same interface. The **`@decorator` syntax** is a language feature that wraps a *function or class*. They share a name and spirit (wrapping) but the syntax version is for cross-cutting concerns on callables.

**Q3. How would you write a retry decorator with exponential backoff?**
A parameterized decorator (decorator factory) returning a wrapper that loops up to N times, catches specified exceptions, sleeps `base * 2**attempt` with jitter, and re-raises on the final attempt. Use `functools.wraps` to preserve metadata. (See section 12.)

**Q4. What's the Pythonic way to implement Strategy?**
Pass a `Callable`. Since functions are objects, you inject the algorithm directly instead of defining an interface and concrete classes. Lambdas or module-level functions act as strategies.

**Q5. How does `functools.singledispatch` relate to the Visitor pattern?**
It provides type-based dispatch: register a different implementation per argument type. This achieves Visitor's "operation over many types" goal without `accept()/visit()` double dispatch — you add a new operation as a new generic function with registrations.

**Q6. Why is a module a good Singleton?**
Python imports a module once and caches it in `sys.modules`; subsequent imports return the same object. Module-level state and functions are therefore inherently single-instance and globally accessible — no metaclass needed.

**Q7. How do you make a class memory-efficient for the Flyweight pattern?**
Use `__slots__` to eliminate the per-instance `__dict__`, and cache shared instances (e.g., `functools.lru_cache` on a factory) so identical intrinsic state isn't duplicated.

**Q8. Iterator vs generator in Python?**
An iterator implements `__iter__`/`__next__` and raises `StopIteration`. A generator is a function with `yield` that *produces* an iterator automatically, maintaining state between calls — lazy and memory-efficient. Generators are the idiomatic Iterator.

**Q9. When would you still write a full class-based pattern in Python?**
When you need (a) shared mutable state, (b) polymorphism dispatched on object *type*, (c) an explicit, registrable extension point, or (d) lifecycle/transition logic (State machines). Otherwise prefer functions/idioms.

**Q10. What's the danger of the Interpreter pattern with `eval`?**
`eval`/`exec` on untrusted input executes arbitrary code (RCE). Build an explicit expression tree or use a safe parsing library (`ast.literal_eval`, `lark`) instead.
