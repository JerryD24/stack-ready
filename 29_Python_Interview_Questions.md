# Python Interview Questions — 2026 Edition (with Deep Answers)

> Curated from current (2026) hiring trends. Modern Python interviews have moved **past syntax** — at mid/senior level they probe interpreter internals (the GIL, memory model, descriptors), concurrency trade-offs, async discipline, and production patterns. The follow-up that filters candidates is always **"why"** — why the GIL exists, why mutable defaults bite, why `__del__` is unreliable. Each answer below gives the *mechanism*, not just the symptom. Every question is in flashcard form (`**Qn. ...**`) so it appears in Practice mode.

## TABLE OF CONTENTS
- 1. Core Language & Data Model
- 2. Data Structures & Complexity
- 3. OOP, MRO & Dunder Methods
- 4. Decorators
- 5. Generators & Iterators
- 6. The GIL & Concurrency
- 7. Async / Await (asyncio)
- 8. Memory Management & Garbage Collection
- 9. Performance & Optimization
- 10. Type Hints, Dataclasses & Pydantic
- 11. Standard Library Idioms
- 12. Modern Python (3.10 - 3.13)
- 13. Exceptions & Context Managers
- 14. Testing & Tooling
- 15. Tricky Output & Gotchas
- 16. Coding Problems (Pythonic)

---

## 1. Core Language & Data Model

**Q1. What is the difference between `is` and `==`?**
`==` calls `__eq__` and compares *values*; `is` compares *identity* (same object in memory, i.e. same `id()`). Use `is` only for singletons like `None`, `True`, `False`. A classic gotcha: `a = 256; b = 256; a is b` is `True` because CPython caches small ints (−5..256), but `a = 257; b = 257; a is b` may be `False`. Never rely on `is` for value equality.

**Q2. Mutable vs immutable types — and why does it matter?**
Immutable: `int`, `float`, `str`, `tuple`, `frozenset`, `bytes`. Mutable: `list`, `dict`, `set`, most objects. It matters because (a) only immutable, hashable objects can be dict keys / set members; (b) immutables are safe to share across threads; (c) "modifying" an immutable creates a new object. A tuple is immutable but can *contain* mutable items, so it's only hashable if all its elements are hashable.

**Q3. How does Python pass arguments — by value or by reference?**
Neither classically — it's **"pass by object reference"** (call by sharing). The function receives a reference to the same object. Rebinding the parameter (`x = ...`) doesn't affect the caller, but mutating a mutable argument (`lst.append(...)`) does. So passing a list and appending to it changes the caller's list.

**Q4. Why are mutable default arguments dangerous?**
Default values are evaluated **once** at function definition time, not per call. So `def f(x, acc=[])` reuses the *same* list across calls, accumulating state. Fix: `def f(x, acc=None): acc = [] if acc is None else acc`. This is one of the most common Python "gotcha" interview questions.

**Q5. What's the difference between shallow and deep copy?**
`copy.copy` (shallow) copies the outer object but shares references to nested objects — mutating a nested list affects both. `copy.deepcopy` recursively copies everything, producing fully independent objects (and handles cycles). Deepcopy is slower; use it only when nested independence is required.

**Q6. Explain truthiness in Python.**
Objects are truthy unless they define `__bool__` returning `False` or `__len__` returning `0`. Falsy values: `None`, `False`, `0`, `0.0`, `""`, `[]`, `{}`, `set()`, `range(0)`. This enables idioms like `if items:` instead of `if len(items) > 0:`.

---

## 2. Data Structures & Complexity

**Q7. What are the time complexities of common list/dict/set operations?**
`list`: index/append O(1), insert/pop at front O(n), `in` O(n). `dict`/`set`: insert/lookup/delete average O(1) (hash table), worst case O(n) on pathological collisions. `dict` preserves insertion order since 3.7 (a language guarantee, not just CPython). Use a `set`/`dict` for membership tests, never a list, when n is large.

**Q8. When would you use a tuple over a list?**
Tuples are immutable → hashable (usable as dict keys / set members), slightly more memory-efficient, and signal "fixed structure" (e.g., a coordinate or a record). Lists are for homogeneous, growing/mutable sequences. Use `namedtuple`/`dataclass` for readable fixed records.

**Q9. What is `collections.defaultdict` and `Counter` used for?**
`defaultdict(list)` auto-creates a default value for missing keys, eliminating `if key not in d` boilerplate — great for grouping. `Counter` counts hashables and offers `.most_common(n)`. These are interview favourites: e.g., word frequency is `Counter(text.split()).most_common(3)`.

**Q10. `deque` vs `list` — when to use which?**
`collections.deque` gives O(1) appends/pops at *both* ends, making it ideal for queues, BFS, and sliding windows. A `list` is O(n) for front operations. Use `deque` whenever you push/pop from the left.

**Q11. How does a Python `set` ensure uniqueness, and what's required of members?**
A set is a hash table; membership uses `__hash__` then `__eq__`. Members must be **hashable** (immutable contract). Two objects that are `==` must have the same hash, or the set breaks — that's why if you override `__eq__` you must override `__hash__`.

---

## 3. OOP, MRO & Dunder Methods

**Q12. Explain the Method Resolution Order (MRO) and C3 linearization.**
MRO is the order Python searches base classes for an attribute/method. Python uses the **C3 linearization** algorithm, which guarantees a consistent order that respects (a) a class before its parents and (b) the order parents are listed, while handling diamond inheritance. Inspect with `Cls.__mro__` or `Cls.mro()`. `super()` follows the MRO, not just the immediate parent.

**Q13. What does `super()` actually do?**
`super()` returns a proxy that dispatches method calls to the **next class in the MRO** of the instance's type — not necessarily the literal parent. In multiple inheritance, this enables cooperative method chaining (each class calls `super().__init__()` and every base runs exactly once).

**Q14. What are dunder (magic) methods? Name important ones.**
Special methods Python calls implicitly to integrate with language syntax/protocols: `__init__`/`__new__` (construction), `__repr__`/`__str__` (representation), `__eq__`/`__hash__` (equality), `__lt__` etc. (ordering), `__len__`/`__getitem__`/`__iter__` (containers), `__enter__`/`__exit__` (context managers), `__call__` (callable objects), `__getattr__`/`__setattr__` (attribute access).

**Q15. `__new__` vs `__init__`?**
`__new__` is the static method that actually *creates and returns* the instance (used for immutable types, singletons, metaclasses). `__init__` *initializes* the already-created instance and returns `None`. `__new__` runs first; if it doesn't return an instance of the class, `__init__` is skipped.

**Q16. What is a metaclass and when would you use one?**
A metaclass is "the class of a class" — `type` is the default. It controls class *creation* (`__new__`/`__init__` at class-definition time). Real uses: enforcing API contracts, auto-registering subclasses (plugin systems), ORMs (Django models), and frameworks. Rule of thumb: "if you're not sure you need a metaclass, you don't" — a class decorator or `__init_subclass__` is usually simpler.

**Q17. What are descriptors?**
Objects defining `__get__`/`__set__`/`__delete__` that control attribute access when used as class attributes. They power `property`, `classmethod`, `staticmethod`, and ORM fields. A data descriptor (`__set__`/`__delete__`) takes precedence over instance `__dict__`; a non-data descriptor (only `__get__`) does not. This is a senior-level "internals" question.

**Q18. `@classmethod` vs `@staticmethod` vs instance method?**
Instance method receives `self`. `@classmethod` receives `cls` (used for alternative constructors like `User.from_json` and for subclass-aware behaviour). `@staticmethod` receives neither — it's a namespaced plain function with no access to instance/class state.

---

## 4. Decorators

**Q19. What is a decorator and how does it work?**
A decorator is a callable that takes a function (or class) and returns a replacement. `@deco` above `def f` is sugar for `f = deco(f)`. They implement cross-cutting concerns (logging, caching, auth, retry, timing) without editing the wrapped function's body. They rely on closures and first-class functions.

**Q20. Why must you use `functools.wraps`?**
Without it, the wrapper replaces the original function's metadata (`__name__`, `__doc__`, `__module__`, signature), breaking introspection, debugging, and tools. `@functools.wraps(fn)` on the wrapper copies that metadata across. Forgetting it is a common red flag in code review.

**Q21. Write a decorator that retries with exponential backoff (a frequent senior ask).**
A parameterized decorator (decorator factory) returns a wrapper that loops up to N attempts, catches the given exceptions, sleeps `base * 2**(attempt-1)` plus random jitter, and re-raises on the final attempt:
```python
import functools, random, time
def retry(times=3, base=0.2, exc=(Exception,)):
    def deco(fn):
        @functools.wraps(fn)
        def wrap(*a, **k):
            for i in range(1, times + 1):
                try: return fn(*a, **k)
                except exc:
                    if i == times: raise
                    d = base * 2 ** (i - 1); time.sleep(d + random.uniform(0, d))
        return wrap
    return deco
```
Adding a `jitter` parameter and configurable exceptions is what signals "I've built real services that call real services."

**Q22. What's a stateful / class-based decorator?**
Use a class with `__call__` to keep state across invocations (e.g., a call counter, rate limiter, or memo cache). `__init__` receives the function (or config); `__call__` runs the wrapped logic. Class decorators are handy when the decorator itself needs attributes/methods.

**Q23. What does `functools.lru_cache` do?**
It memoizes a function's return values keyed by its arguments (args must be hashable), bounded by `maxsize` with LRU eviction. Huge for expensive pure functions / recursion (e.g., it turns naive recursive Fibonacci from exponential to linear). `functools.cache` (3.9+) is `lru_cache(maxsize=None)`.

---

## 5. Generators & Iterators

**Q24. What is a generator and why use one?**
A function with `yield` that produces values **lazily** — each `next()` resumes after the last `yield`, keeping local state. It doesn't materialize the whole sequence, so it's memory-efficient for large/infinite streams and pipelines. Example: streaming a multi-GB file line by line instead of `f.readlines()`.

**Q25. Iterator vs iterable vs generator?**
An **iterable** has `__iter__` returning an iterator (lists, dicts). An **iterator** has `__iter__` *and* `__next__`, and is consumed once. A **generator** is the easiest way to make an iterator (a function with `yield`, or a generator expression `(x*x for x in it)`).

**Q26. What does `yield from` do?**
It delegates to a sub-iterator: `yield from sub` yields all of `sub`'s values, transparently forwards `.send()`/`.throw()`/`.close()`, and captures the sub-generator's return value. It flattens nested generators without a manual loop and is the foundation of generator-based coroutines.

**Q27. How are generators related to coroutines?**
Generators can receive values via `.send()`, making them two-way (the historical basis for `asyncio` before `async def`). Today `async def` coroutines are the dedicated construct, but they share the suspend/resume model: execution pauses at `await`/`yield` and resumes later, preserving state.

**Q28. What's the difference between a list comprehension and a generator expression?**
`[x for x in it]` builds the whole list in memory eagerly; `(x for x in it)` returns a generator that yields lazily. For large data or when you only iterate once (e.g., `sum(x*x for x in nums)`), the generator expression saves memory.

---

## 6. The GIL & Concurrency

**Q29. What is the GIL and why does it exist?**
The Global Interpreter Lock is a mutex in CPython that allows only **one thread to execute Python bytecode at a time**. It exists because CPython's memory management (reference counting) is **not thread-safe** — without the GIL, concurrent ref-count updates could corrupt memory and crash the interpreter. The GIL was the simplest way to make the interpreter safe and single-threaded-fast.

**Q30. How does the GIL affect performance, and how do you work around it?**
CPU-bound multithreading **doesn't scale** across cores (threads serialize on the GIL). Workarounds: use **multiprocessing** (separate processes, each with its own GIL) for CPU-bound work; use **threading/asyncio** for I/O-bound work (the GIL is released during blocking I/O and in many C extensions like NumPy). Mention **free-threaded Python (PEP 703, experimental in 3.13+)** which can disable the GIL using per-object locks — a strong signal of current knowledge.

**Q31. threading vs multiprocessing vs asyncio — when to use each?**
**asyncio**: thousands of concurrent **I/O-bound** tasks on one thread via an event loop (web servers, API clients). **threading**: I/O-bound work, especially legacy/blocking libraries (GIL released during I/O). **multiprocessing**: **CPU-bound** work needing true parallelism across cores (data crunching, ML inference), at the cost of process overhead and inter-process communication.

**Q32. Is the GIL released during I/O?**
Yes — when a thread blocks on I/O (socket read, file read, `time.sleep`) it releases the GIL so other threads can run. That's why threading still helps I/O-bound workloads despite the GIL. C extensions can also explicitly release it around long computations.

---

## 7. Async / Await (asyncio)

**Q33. What are `async def` and `await`?**
`async def` defines a **coroutine**. Calling it returns a coroutine object that does nothing until awaited or scheduled on the event loop. `await` suspends the current coroutine until the awaited awaitable completes, yielding control back to the loop so other coroutines run. `asyncio.run(main())` starts the loop.

**Q34. How do you run coroutines concurrently?**
`await asyncio.gather(coro1(), coro2(), coro3())` schedules them concurrently and waits for all (returning results in order). `asyncio.create_task(coro)` schedules a coroutine to run in the background and returns a `Task` you can await later. `asyncio.TaskGroup` (3.11+) gives structured concurrency with automatic cancellation on failure.

**Q35. What's the danger of calling a blocking function inside async code?**
A blocking call (CPU work, `time.sleep`, blocking DB driver) freezes the **entire event loop** — all coroutines stall because there's one thread. Fixes: use async libraries, or offload blocking work via `await asyncio.to_thread(fn, ...)` / `loop.run_in_executor`. This "don't block the loop" discipline is a key senior signal.

**Q36. Why is `await asyncio.sleep(0)` useful?**
It yields control to the event loop without delay, letting other ready tasks run. It's used to prevent a tight loop or long-running coroutine from starving others — a cooperative-scheduling courtesy point.

**Q37. How do you implement timeouts and cancellation?**
`asyncio.timeout()` (3.11+) or `asyncio.wait_for(coro, timeout)` cancel a coroutine that exceeds a deadline by raising `TimeoutError`/`CancelledError`. Coroutines should handle `CancelledError` to clean up (close connections) and then re-raise. Proper cancellation handling is essential for resilient async services.

---

## 8. Memory Management & Garbage Collection

**Q38. How does Python manage memory?**
Primarily via **reference counting**: every object tracks how many references point to it; when the count hits zero the memory is freed immediately (deterministic). A supplementary **generational cyclic garbage collector** (`gc` module) detects and frees reference cycles that ref-counting alone can't. Small objects use **pymalloc** arenas/pools for efficiency.

**Q39. Why is a cyclic garbage collector needed on top of reference counting?**
Reference counting cannot reclaim **reference cycles** (`a.ref = b; b.ref = a`) — their counts never reach zero even when unreachable. The cyclic GC periodically scans for unreachable cycles and collects them. It's generational (objects surviving collections are promoted) to amortize cost.

**Q40. Why is `__del__` unreliable for cleanup?**
`__del__` runs when the ref count hits zero, but timing is non-deterministic (especially with cycles, where the GC decides when), it may not run at interpreter shutdown, and exceptions inside it are ignored. For resource cleanup use **context managers (`with`)** or `try/finally`, not `__del__`.

**Q41. What is `__slots__` and why use it?**
`__slots__` declares a fixed set of attributes, removing each instance's `__dict__`. Benefits: **lower memory** (significant when you have millions of instances) and slightly faster attribute access. Trade-offs: no dynamic attributes and some complications with multiple inheritance. A common memory-optimization interview answer.

**Q42. What's the difference between `del x` and garbage collection?**
`del x` removes the *name* binding and decrements the object's ref count; the object is freed only when its count reaches zero. It does **not** force collection by itself. To force a cyclic collection you call `gc.collect()`.

---

## 9. Performance & Optimization

**Q43. How do you profile and optimize Python code?**
Measure first: `cProfile`/`profile` for function-level hotspots, `timeit` for micro-benchmarks, `tracemalloc`/`memory_profiler` for memory, line-profilers for line-level. Then optimize the proven hotspot: better algorithm/data structure, vectorize with NumPy, cache (`lru_cache`), use generators to cut memory, move CPU-bound work to multiprocessing or C extensions. Never optimize without profiling.

**Q44. Why are list comprehensions faster than equivalent for-loops?**
They're optimized at the bytecode level (the list building loop runs in C, avoiding repeated `LOAD_METHOD`/`append` Python-level calls). They're also more readable. For pure transformation/filtering they're both faster and clearer — but don't sacrifice readability for nested comprehensions.

**Q45. What are some idiomatic ways to speed up CPU-bound Python?**
Use libraries that release the GIL and run in C (NumPy, pandas), use `multiprocessing`/`concurrent.futures.ProcessPoolExecutor`, compile hotspots with Cython/Numba, cache results, and choose better algorithms/data structures. For truly parallel pure-Python, watch free-threaded (no-GIL) builds.

---

## 10. Type Hints, Dataclasses & Pydantic

**Q46. What are type hints and what benefits do they bring?**
Optional annotations (`def f(x: int) -> str`) that don't affect runtime behaviour but enable **static checking** (mypy/pyright), better IDE autocomplete, and self-documentation. Modern syntax: `str | None` (3.10+), `list[int]` (3.9+), `TypeVar`/`Generic` for generics, and `Protocol` for structural (duck) typing with checking.

**Q47. What are dataclasses and why use them?**
`@dataclass` auto-generates `__init__`, `__repr__`, `__eq__` (and `__hash__`/ordering with options) from annotated fields, removing boilerplate. Options: `frozen=True` (immutable + hashable), `slots=True` (3.10+, memory), `field(default_factory=...)` for mutable defaults. Ideal for value objects and DTOs.

**Q48. Dataclass vs `namedtuple` vs Pydantic `BaseModel`?**
`namedtuple` is an immutable, tuple-backed lightweight record. `@dataclass` is a mutable-by-default class with rich options but **no runtime validation**. **Pydantic** validates and coerces data at runtime against the types (raising `ValidationError`) — the go-to for parsing external input (FastAPI request bodies, config). Choose Pydantic when data crosses a trust boundary.

**Q49. What is `Protocol` (structural typing)?**
`typing.Protocol` (PEP 544) defines an interface by *shape*: any object with the required methods/attributes satisfies it, no explicit inheritance needed (static duck typing). It lets you type-check duck-typed code — e.g., "anything with a `.read()` method" — which is far more Pythonic than forcing ABC inheritance.

---

## 11. Standard Library Idioms

**Q50. Which `collections` types should every Python dev know?**
`Counter` (counting/most_common), `defaultdict` (auto-default values for grouping), `deque` (O(1) both-ends queue), `OrderedDict` (mostly historical now), `namedtuple` (lightweight record), `ChainMap` (layered dict lookup, e.g., config overrides).

**Q51. What does `itertools` give you?**
Memory-efficient iterator building blocks: `chain` (concatenate), `islice` (slice an iterator), `groupby`, `product`/`permutations`/`combinations`, `cycle`, `count`, `accumulate`, `takewhile`/`dropwhile`. They let you build lazy data pipelines without loading everything into memory.

**Q52. What's in `functools`?**
`lru_cache`/`cache` (memoization), `wraps` (preserve metadata in decorators), `partial` (pre-bind arguments → a new callable), `reduce`, `singledispatch` (type-based function overloading), `cached_property` (compute once per instance). Senior favourites: `partial` for command objects and `singledispatch` as a Pythonic Visitor.

**Q53. How do you read a large file without exhausting memory?**
Iterate the file object directly (`for line in f:`) which yields lines lazily, or read in chunks (`while chunk := f.read(8192):`). Avoid `f.readlines()`/`f.read()` on huge files. For structured data, use streaming parsers (e.g., `csv.reader` over the file iterator).

---

## 12. Modern Python (3.10 - 3.13)

**Q54. What is structural pattern matching (`match`/`case`)?**
Introduced in 3.10, it matches a value against structural patterns — literals, sequences, mappings, class patterns with capture, and guards (`case Point(x, y) if x == y:`). It's more powerful than a `switch`: it can destructure and bind. Great for parsing ASTs, command dispatch, and handling tagged unions.

**Q55. What is the walrus operator `:=`?**
Assignment expressions assign *and* return a value inline. Useful to avoid recomputation/duplication: `if (n := len(data)) > 10: print(n)` or `while (chunk := f.read(1024)):`. Use sparingly for readability.

**Q56. What is free-threaded Python (PEP 703)?**
An experimental build (3.13+) that **removes the GIL**, using per-object locking and atomic reference counting so multiple threads can execute Python bytecode in parallel. It enables true multithreaded CPU parallelism but has overhead and ecosystem caveats. Mentioning it shows you track Python's direction.

**Q57. Name a few other recent improvements worth knowing.**
`str | None` union syntax (3.10), `tomllib` for TOML config (3.11), exception groups + `except*` and much faster interpreter (3.11), `asyncio.TaskGroup`/`timeout` (3.11), `@dataclass(slots=True)` (3.10), and per-interpreter GIL / improved error messages with carets pointing at the exact expression.

---

## 13. Exceptions & Context Managers

**Q58. How do context managers work?**
Objects implementing `__enter__`/`__exit__` used with `with` to guarantee setup/teardown even on exceptions (files, locks, DB transactions). `__exit__` receives exception info and can suppress it by returning `True`. The simpler form is `@contextlib.contextmanager` on a generator that `yield`s once between setup and cleanup.

**Q59. How do you write an async context manager?**
Implement `__aenter__`/`__aexit__` and use `async with`, or decorate a generator with `@contextlib.asynccontextmanager`. Used for async resources like DB connection pools and HTTP sessions that must be awaited on acquire/release.

**Q60. What are exception groups and `except*`?**
Added in 3.11, `ExceptionGroup` bundles multiple exceptions raised together (e.g., several failing tasks in a `TaskGroup`), and `except*` selectively handles subsets by type. Essential for structured concurrency where many coroutines can fail simultaneously.

**Q61. EAFP vs LBYL — what's the Pythonic style?**
EAFP ("Easier to Ask Forgiveness than Permission") — try the operation and catch the exception (`try: d[k] except KeyError:`) — is idiomatic Python, avoids race conditions, and is often faster on the happy path. LBYL ("Look Before You Leap") checks first (`if k in d:`) and can race in concurrent code.

---

## 14. Testing & Tooling

**Q62. How do you test Python code? What's the ecosystem?**
`pytest` is the de facto standard (fixtures, parametrize, plain `assert`). `unittest` is built-in. Use `unittest.mock`/`pytest-mock` for mocking, `coverage`/`pytest-cov` for coverage, `hypothesis` for property-based testing. Structure tests by behaviour and isolate external systems with fakes/mocks.

**Q63. What modern tooling improves Python code quality?**
`ruff` (extremely fast linter + formatter, replacing flake8/isort and often black), `black` (formatter), `mypy`/`pyright` (static typing), `uv`/`poetry`/`pip-tools` (dependency & env management), `pre-commit` (run checks on commit). Mentioning `ruff`/`uv` signals current ecosystem awareness.

**Q64. How do you manage dependencies and virtual environments?**
Isolate per-project with `venv`/`virtualenv`. Pin dependencies with `requirements.txt` (+ hashes) or a lockfile via `poetry`/`pip-tools`/`uv`. `pyproject.toml` is the modern standard for project + tool config. Reproducible builds matter for production parity.

---

## 15. Tricky Output & Gotchas

**Q65. What does `0.1 + 0.2 == 0.3` return and why?**
`False`. Floats are IEEE-754 binary and can't represent 0.1/0.2/0.3 exactly, so the sum is `0.30000000000000004`. Compare floats with `math.isclose(a, b)` or use `decimal.Decimal` for money. This is a classic "do you understand floating point" check.

**Q66. What does `[[0]*3]*3` produce, and what's the trap?**
A list of **three references to the same inner list**, so `m[0][0] = 1` sets column 0 in *every* row (`[[1,0,0],[1,0,0],[1,0,0]]`). The `*` replicates references, not copies. Correct: `[[0]*3 for _ in range(3)]`.

**Q67. What does this print: `def f(): x = 10; def g(): print(x); x = 20; return g; f()()`?**
It raises `UnboundLocalError`. Because `g` assigns to `x`, Python treats `x` as local to `g` throughout, so the `print(x)` before assignment references an unbound local. Fix with `nonlocal x` (to use the enclosing scope) — tests understanding of scoping/closures.

**Q68. Why might `for i in range(3): funcs.append(lambda: i)` capture the wrong value?**
Closures capture the **variable**, not its value at creation time. After the loop, all lambdas see `i == 2`. Fix by binding via default arg: `lambda i=i: i`, or use a factory function. Late binding of closures is a frequent gotcha.

**Q69. What's the difference between `append` and `extend`, and what does `a += b` do for lists?**
`append(x)` adds one element; `extend(iterable)` adds each element. `a += b` is in-place `extend` (mutates `a`), whereas `a = a + b` creates a new list. The in-place behaviour matters when `a` is shared/aliased.

---

## 16. Coding Problems (Pythonic)

**Q70. Reverse words / count word frequency idiomatically.**
Frequency: `from collections import Counter; Counter(text.lower().split()).most_common(3)`. Reverse words: `" ".join(reversed(text.split()))`. Interviewers want idiomatic stdlib use (`Counter`, slicing, comprehensions) over manual loops.

**Q71. Flatten a nested list.**
For one level: `[x for sub in nested for x in sub]`. For arbitrary depth, recurse or use a generator: `def flat(xs): for x in xs: yield from flat(x) if isinstance(x, list) else [x]`. Generators keep it memory-efficient.

**Q72. Deduplicate a list while preserving order.**
`list(dict.fromkeys(items))` — dicts preserve insertion order (3.7+) and keys are unique, so this is the cleanest O(n) approach. A `set` deduplicates but loses order.

**Q73. Merge two dictionaries.**
3.9+: `merged = d1 | d2` (right wins on conflicts); in-place `d1 |= d2`. Pre-3.9: `{**d1, **d2}`. For deep/recursive merges you write a helper or use a library.

**Q74. Group a list of records by a key.**
`from collections import defaultdict; g = defaultdict(list); for r in records: g[r.dept].append(r)`. Or `itertools.groupby` **after sorting** by the key (groupby only groups consecutive equal keys). `defaultdict` is usually clearer for unsorted data.

**Q75. Implement an LRU cache.**
Easiest: decorate with `@functools.lru_cache(maxsize=128)`. To implement manually, use `collections.OrderedDict` (move accessed keys to the end with `move_to_end`, `popitem(last=False)` to evict the oldest) — a common system-design-flavoured coding question.
