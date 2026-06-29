# Python — Core to Advanced
### Complete Interview Guide | Beginner → Advanced

---

## TABLE OF CONTENTS
1. [Python Fundamentals](#1-python-fundamentals)
2. [Data Types & Data Structures](#2-data-types--data-structures)
3. [Functions & Functional Programming](#3-functions--functional-programming)
4. [Object-Oriented Programming](#4-object-oriented-programming)
5. [Iterators, Generators & Comprehensions](#5-iterators-generators--comprehensions)
6. [Decorators & Context Managers](#6-decorators--context-managers)
7. [Modules, Packages & Imports](#7-modules-packages--imports)
8. [Error Handling & Exceptions](#8-error-handling--exceptions)
9. [Concurrency & Parallelism](#9-concurrency--parallelism)
10. [Memory Management & Internals](#10-memory-management--internals)
11. [Python Type System & Annotations](#11-python-type-system--annotations)
12. [Testing in Python](#12-testing-in-python)
13. [Python vs Java — Key Differences](#13-python-vs-java--key-differences)
14. [Interview Q&A](#14-interview-qa)

---

## 1. Python Fundamentals

### Python Execution Model
```
Source (.py)
    ↓ CPython compiler
Bytecode (.pyc in __pycache__)
    ↓ Python Virtual Machine (PVM)
Execution

CPython: reference implementation (C), most common
PyPy:    JIT-compiled Python, 2-10x faster
Jython:  Python on JVM
IronPython: Python on .NET
```

### Variables & Dynamic Typing
```python
# Python is dynamically typed — type is determined at runtime
x = 10          # int
x = "hello"     # now str — same variable, different type
x = [1, 2, 3]   # now list

# type() to check type
print(type(x))   # <class 'list'>

# isinstance() — preferred over type() comparison
isinstance(x, list)    # True
isinstance(x, (list, tuple))  # True if either

# id() — memory address (object identity)
a = 256
b = 256
a is b   # True  — small integers are cached (-5 to 256)
a == b   # True  — value equality

a = 1000
b = 1000
a is b   # False — new objects (beyond cache range)
a == b   # True
```

### Mutable vs Immutable
```python
# IMMUTABLE: int, float, str, tuple, frozenset, bytes
# MUTABLE:   list, dict, set, bytearray, custom objects

s = "hello"
s[0] = "H"  # TypeError! strings are immutable

lst = [1, 2, 3]
lst[0] = 99  # OK — lists are mutable

# Important consequence for function arguments
def modify(lst, num):
    lst.append(4)  # modifies original list (mutable)
    num += 1       # does NOT modify original (immutable)

my_list = [1, 2, 3]
my_num = 10
modify(my_list, my_num)
print(my_list)  # [1, 2, 3, 4]  ← CHANGED
print(my_num)   # 10            ← UNCHANGED
```

### Python Naming Conventions
```python
variable_name     = "snake_case"
CONSTANT_NAME     = "UPPER_SNAKE_CASE"
ClassName         = "PascalCase"
_private_var      = "single underscore = convention for private"
__name_mangled    = "double underscore = name mangling in class"
__dunder__        = "double underscore both sides = magic/dunder methods"
module_name       = "snake_case"
```

---

## 2. Data Types & Data Structures

### Numbers
```python
x = 10          # int (unlimited precision!)
x = 10.5        # float (64-bit double precision)
x = 10 + 3j     # complex
x = 0b1010      # binary = 10
x = 0xFF        # hex = 255
x = 0o17        # octal = 15
x = 1_000_000   # readable large numbers

# Integer division
17 // 3    # 5  (floor division)
17 % 3     # 2  (modulo)
2 ** 10    # 1024 (exponentiation)
-17 // 3   # -6  (floors toward negative infinity!)
-17 % 3    # 1   (sign follows divisor in Python)

# Floating point
0.1 + 0.2      # 0.30000000000000004 — IEEE 754 issue
from decimal import Decimal
Decimal('0.1') + Decimal('0.2')  # Decimal('0.3')  — exact
```

### Strings
```python
# String methods
s = "Hello, World!"
s.upper()               # "HELLO, WORLD!"
s.lower()               # "hello, world!"
s.strip()               # removes whitespace from both ends
s.lstrip(), s.rstrip()  # left/right only
s.split(", ")           # ["Hello", "World!"]
s.split(", ", 1)        # ["Hello", "World!"] (max 1 split)
s.replace("World", "Python")  # "Hello, Python!"
s.startswith("Hello")   # True
s.endswith("!")         # True
s.find("World")         # 7 (index), -1 if not found
s.index("World")        # 7 (raises ValueError if not found)
s.count("l")            # 3
s.isdigit()             # False
s.isalpha()             # False
s.isalnum()             # False
"123".zfill(5)          # "00123" (zero-pad)
",".join(["a","b","c"]) # "a,b,c"
s.center(20, "*")       # "***Hello, World!****"

# f-strings (Python 3.6+) — preferred
name, age = "Alice", 30
f"Name: {name}, Age: {age}"
f"Pi = {3.14159:.2f}"         # "Pi = 3.14"
f"In hex: {255:#x}"           # "In hex: 0xff"
f"Big number: {1_000_000:,}"  # "Big number: 1,000,000"
f"{name!r}"                   # repr: "'Alice'"
f"{name!s}"                   # str: "Alice"
f"{name!a}"                   # ascii repr

# Python 3.12: f-string self-documenting
x = 42
f"{x=}"    # "x=42"  — great for debugging!

# Multiline strings
text = """
Line 1
Line 2
Line 3
"""

# Raw strings (no escape processing)
path = r"C:\Users\name\file.txt"   # no need to double backslashes
regex = r"\d+\.\d+"                 # regex patterns
```

### Lists
```python
lst = [1, 2, 3, 4, 5]

# Slicing [start:stop:step]
lst[1:4]       # [2, 3, 4]  (stop is exclusive)
lst[::2]       # [1, 3, 5]  (every 2nd element)
lst[::-1]      # [5, 4, 3, 2, 1]  (reverse)
lst[2:]        # [3, 4, 5]
lst[:3]        # [1, 2, 3]

# Modifying
lst.append(6)          # [1, 2, 3, 4, 5, 6]
lst.extend([7, 8])     # [1, 2, 3, 4, 5, 6, 7, 8]
lst.insert(0, 0)       # insert 0 at index 0
lst.remove(3)          # removes first occurrence of 3
lst.pop()              # removes and returns last element
lst.pop(0)             # removes and returns element at index 0
lst.sort()             # in-place, returns None
sorted(lst)            # returns new sorted list, original unchanged
lst.sort(key=lambda x: -x)  # sort descending
lst.reverse()          # in-place reverse
lst.index(5)           # find index of value 5
lst.count(2)           # count occurrences
lst.clear()            # empty the list
lst.copy()             # shallow copy

# List unpacking
a, b, c = [1, 2, 3]
first, *rest = [1, 2, 3, 4, 5]    # first=1, rest=[2,3,4,5]
*init, last = [1, 2, 3, 4, 5]     # init=[1,2,3,4], last=5
a, *mid, z = [1, 2, 3, 4, 5]      # a=1, mid=[2,3,4], z=5

# Swap (Pythonic)
a, b = b, a
```

### Tuples
```python
# Immutable ordered sequence
t = (1, 2, 3)
t = 1, 2, 3       # parentheses optional
t = (1,)          # single element tuple — NEED trailing comma!
t = ()            # empty tuple

# Use tuples for:
# - Function return values (return x, y)
# - Dictionary keys (since immutable and hashable)
# - Named constants grouping
# - Slightly faster than lists

from collections import namedtuple
Point = namedtuple('Point', ['x', 'y'])
p = Point(3, 4)
p.x    # 3
p.y    # 4
p[0]   # 3  — still accessible by index

# Python 3.6+: typing.NamedTuple
from typing import NamedTuple
class Point(NamedTuple):
    x: float
    y: float
    label: str = "origin"   # default value
```

### Dictionaries
```python
d = {"name": "Alice", "age": 30}

# Access
d["name"]                     # "Alice" — KeyError if missing
d.get("name")                 # "Alice"
d.get("city", "Unknown")      # "Unknown" — default if missing
d.setdefault("city", "NYC")   # set if missing, return value

# Modify
d["email"] = "a@b.com"        # add/update
del d["age"]                  # delete key
d.pop("name")                 # remove and return
d.pop("missing", None)        # with default — no error
d.update({"x": 1, "y": 2})   # merge another dict
d |= {"z": 3}                 # Python 3.9+: merge with |=
merged = d1 | d2              # Python 3.9+: new merged dict

# Iteration
d.keys()        # dict_keys view
d.values()      # dict_values view
d.items()       # dict_items view of (key, value) tuples
for k, v in d.items():
    print(f"{k} = {v}")

# Dict comprehension
squares = {x: x**2 for x in range(10)}
filtered = {k: v for k, v in d.items() if v > 0}
inverted = {v: k for k, v in d.items()}  # swap keys and values

# OrderedDict (Python 3.7+: regular dict maintains insertion order too)
from collections import OrderedDict
od = OrderedDict([("b", 2), ("a", 1)])
od.move_to_end("b")       # move key to end
od.move_to_end("b", False) # move to beginning

# defaultdict — auto-creates default values
from collections import defaultdict
dd = defaultdict(list)
dd["key"].append(1)    # no KeyError — creates empty list automatically
dd["key"].append(2)
dd                     # defaultdict(<class 'list'>, {'key': [1, 2]})

# Counter
from collections import Counter
c = Counter("hello world")  # {'l': 3, 'o': 2, 'h': 1, 'e': 1, ...}
c = Counter([1, 1, 2, 3, 3, 3])  # {3: 3, 1: 2, 2: 1}
c.most_common(2)               # [(3, 3), (1, 2)]
c["l"]                         # 3
c["z"]                         # 0 (no KeyError!)
c1 + c2                        # add counts
c1 - c2                        # subtract (negative removed)
c1 & c2                        # intersection (min counts)
c1 | c2                        # union (max counts)
```

### Sets
```python
s = {1, 2, 3, 4}
s = set([1, 2, 2, 3])  # {1, 2, 3} — deduplicates
s = set()              # empty set (NOT {} — that's empty dict!)

s.add(5)
s.remove(3)     # KeyError if not present
s.discard(3)    # no error if not present
s.pop()         # arbitrary element removed

# Set operations
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}
a | b           # union {1, 2, 3, 4, 5, 6}
a & b           # intersection {3, 4}
a - b           # difference {1, 2} (in a, not b)
a ^ b           # symmetric difference {1, 2, 5, 6}
a.issubset(b)   # False
a.issuperset(b) # False
a.isdisjoint(b) # False

# frozenset — immutable, can be dict key
fs = frozenset([1, 2, 3])
```

### Collections Module — Essential
```python
from collections import deque, namedtuple, Counter, defaultdict, OrderedDict, ChainMap

# deque — O(1) append/pop from both ends
d = deque([1, 2, 3], maxlen=5)  # maxlen = circular buffer
d.appendleft(0)    # O(1) left append
d.popleft()        # O(1) left pop
d.rotate(2)        # rotate right by 2
d.rotate(-2)       # rotate left by 2

# heapq — min-heap operations on list
import heapq
h = []
heapq.heappush(h, 3)
heapq.heappush(h, 1)
heapq.heappush(h, 4)
heapq.heappop(h)         # 1 (min)
heapq.nlargest(2, h)     # [4, 3]
heapq.nsmallest(2, h)    # [1, 3]
heapq.heapify(lst)        # convert list to heap in-place O(n)

# For max-heap: negate values
heapq.heappush(h, -val)
-heapq.heappop(h)        # negate back

# bisect — binary search on sorted list
import bisect
a = [1, 3, 4, 7, 9]
bisect.bisect_left(a, 4)    # 2 — leftmost position
bisect.bisect_right(a, 4)   # 3 — rightmost position
bisect.insort(a, 5)          # insert in sorted order
```

---

## 3. Functions & Functional Programming

**Theory.** Functions in Python are **first-class objects** — you can pass them as arguments, return them from other functions, and store them in variables or data structures. That single fact is what makes decorators, callbacks, and the functional tools below possible. Python's calling model is **"pass by object reference"**: the function gets a reference to the *same* object the caller holds, so rebinding a parameter (`x = ...`) doesn't affect the caller, but *mutating* a mutable argument (`lst.append(...)`) does — the root cause of the infamous mutable-default-argument bug. Python also lets you shape a function's calling convention precisely: `*args`/`**kwargs` for variadic functions, and the `/` and `*` markers to force positional-only or keyword-only arguments for clearer, more stable APIs. **Closures** (inner functions that capture variables from their enclosing scope) and helpers like `functools.partial` and `lru_cache` let you build and specialize behavior without writing classes.

### Function Fundamentals
```python
def greet(name: str, greeting: str = "Hello") -> str:
    """Docstring: describe what function does."""
    return f"{greeting}, {name}!"

# *args: variable positional arguments (tuple)
def sum_all(*args: int) -> int:
    return sum(args)

sum_all(1, 2, 3, 4)  # 10

# **kwargs: variable keyword arguments (dict)
def display(**kwargs):
    for k, v in kwargs.items():
        print(f"{k}: {v}")

display(name="Alice", age=30)

# Keyword-only arguments (after *)
def connect(host, port, *, timeout=30, retries=3):
    pass
connect("localhost", 8080, timeout=60)  # timeout must be keyword

# Positional-only arguments (before /)
def power(base, exp, /):
    return base ** exp
power(2, 10)           # OK
power(base=2, exp=10)  # TypeError — positional-only!

# Combined
def complex_func(pos_only, /, normal, *, kw_only):
    pass
```

### Lambda Functions
```python
# Lambda: anonymous function for simple expressions
add = lambda x, y: x + y
add(3, 4)   # 7

# Use in sorted/map/filter
nums = [3, 1, 4, 1, 5, 9]
sorted(nums, key=lambda x: -x)         # descending
sorted(words, key=lambda x: x.lower()) # case-insensitive sort
sorted(pairs, key=lambda x: (x[1], x[0]))  # sort by second, then first

# With map, filter
list(map(lambda x: x**2, nums))     # [9, 1, 16, 1, 25, 81]
list(filter(lambda x: x > 3, nums)) # [4, 5, 9]
```

### Functional Tools
```python
from functools import reduce, partial, lru_cache, wraps, cached_property

# reduce
from functools import reduce
reduce(lambda x, y: x + y, [1, 2, 3, 4])  # 10
reduce(lambda x, y: x * y, [1, 2, 3, 4], 1)  # 24 (with initial value)

# partial — fix some arguments
from functools import partial
double = partial(pow, exp=2)  # NO, pow signature is pow(base, exp)
# Better example:
def multiply(x, y): return x * y
double = partial(multiply, y=2)
double(5)   # 10

from functools import partial
add5 = partial(lambda x, y: x + y, 5)
add5(3)   # 8

# lru_cache — memoization decorator
from functools import lru_cache

@lru_cache(maxsize=None)  # None = unlimited cache
def fib(n):
    if n < 2: return n
    return fib(n-1) + fib(n-2)

fib.cache_info()    # CacheInfo(hits=..., misses=..., maxsize=None, currsize=...)
fib.cache_clear()   # clear the cache

# Python 3.9+: @cache (same as lru_cache(maxsize=None))
from functools import cache
@cache
def fib(n): ...

# map, filter, zip
list(map(str.upper, ["hello", "world"]))         # ["HELLO", "WORLD"]
list(filter(None, [0, 1, False, True, "", "hi"])) # [1, True, "hi"]
list(zip([1, 2, 3], ["a", "b", "c"]))             # [(1,'a'), (2,'b'), (3,'c')]
list(zip(*[[1,2,3],[4,5,6]]))                      # transpose: [(1,4),(2,5),(3,6)]

# zip_longest (fills missing with fillvalue)
from itertools import zip_longest
list(zip_longest([1,2,3], [4,5], fillvalue=0))  # [(1,4),(2,5),(3,0)]

# enumerate
for i, val in enumerate(["a", "b", "c"], start=1):
    print(f"{i}: {val}")  # 1: a, 2: b, 3: c

# any, all
any([0, False, "", 1])    # True (at least one truthy)
all([1, True, "hi", 2])   # True (all truthy)
any(x > 5 for x in nums)  # short-circuit evaluation
```

### Closures
```python
# A closure is a function that captures variables from enclosing scope
def make_counter(start=0):
    count = start  # captured variable

    def counter():
        nonlocal count  # needed to modify enclosing variable
        count += 1
        return count

    return counter

c1 = make_counter()
c1()  # 1
c1()  # 2
c2 = make_counter(10)
c2()  # 11  — independent from c1
```

---

## 4. Object-Oriented Programming

**Theory.** Python is multi-paradigm but fully object-oriented — even classes are objects. Several things differ from Java and trip people up: instance attributes live in a per-instance `__dict__`, so they're dynamic (you can add them at runtime) unless you opt into `__slots__`; there is **no real `private`** — a leading underscore is a convention and a double underscore only triggers name-mangling; and operator/built-in behavior is customized through **dunder ("magic") methods** (`__init__`, `__repr__`, `__eq__`, `__len__`, `__iter__`, `__enter__`, …) that hook your objects into the language. Python supports **multiple inheritance**, resolved deterministically by the **MRO** (Method Resolution Order via C3 linearization); `super()` walks the MRO, not merely the literal parent class. In practice, prefer composition and small **mixins** over deep hierarchies, expose computed/validated state with `@property`, provide alternative constructors with `@classmethod`, and use `@dataclass` to remove boilerplate (`__init__`/`__repr__`/`__eq__`) for data-holding classes.

### Classes & Objects
```python
class Animal:
    # Class variable (shared across all instances)
    species_count = 0

    # Constructor
    def __init__(self, name: str, age: int):
        # Instance variables
        self.name = name
        self.age = age
        Animal.species_count += 1

    # Instance method
    def speak(self) -> str:
        return f"{self.name} makes a sound"

    # String representation
    def __repr__(self) -> str:
        return f"Animal(name={self.name!r}, age={self.age})"

    def __str__(self) -> str:
        return f"{self.name} (age {self.age})"

    def __len__(self) -> int:
        return self.age

    def __eq__(self, other) -> bool:
        if not isinstance(other, Animal): return NotImplemented
        return self.name == other.name and self.age == other.age

    def __hash__(self) -> int:
        return hash((self.name, self.age))  # must define if __eq__ defined

    def __lt__(self, other) -> bool:
        return self.age < other.age

    # Class method — receives class, not instance
    @classmethod
    def from_dict(cls, data: dict) -> "Animal":
        return cls(data["name"], data["age"])

    # Static method — no self or cls
    @staticmethod
    def is_valid_age(age: int) -> bool:
        return 0 < age < 150

    # Property — controlled attribute access
    @property
    def info(self) -> str:
        return f"{self.name} is {self.age} years old"

    # Setter
    @info.setter
    def info(self, value: str):
        self.name, age_str = value.split(" is ")
        self.age = int(age_str.split()[0])

a = Animal("Rex", 5)
repr(a)      # "Animal(name='Rex', age=5)"
str(a)       # "Rex (age 5)"
len(a)       # 5
a.info       # "Rex is 5 years old"
```

### Inheritance
```python
class Dog(Animal):
    def __init__(self, name: str, age: int, breed: str):
        super().__init__(name, age)  # call parent __init__
        self.breed = breed

    def speak(self) -> str:
        return f"{self.name} barks!"

    def __repr__(self) -> str:
        return f"Dog(name={self.name!r}, age={self.age}, breed={self.breed!r})"

# Multiple Inheritance — Python uses MRO (Method Resolution Order)
class A:
    def hello(self): return "A"

class B(A):
    def hello(self): return "B"

class C(A):
    def hello(self): return "C"

class D(B, C):  # Diamond problem
    pass

d = D()
d.hello()     # "B" — follows MRO: D → B → C → A
D.__mro__     # (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)
D.mro()       # same as above, as list

# Mixins — add behavior without full inheritance
class JSONMixin:
    def to_json(self):
        import json
        return json.dumps(self.__dict__)

class LogMixin:
    def log(self, msg):
        print(f"[{self.__class__.__name__}] {msg}")

class Service(JSONMixin, LogMixin):
    def __init__(self, name):
        self.name = name
```

### Abstract Classes
```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float:
        """Subclasses must implement this."""
        ...

    @abstractmethod
    def perimeter(self) -> float: ...

    def describe(self) -> str:     # concrete method
        return f"Area: {self.area():.2f}, Perimeter: {self.perimeter():.2f}"

class Circle(Shape):
    def __init__(self, radius: float):
        self.radius = radius

    def area(self) -> float:
        import math
        return math.pi * self.radius ** 2

    def perimeter(self) -> float:
        import math
        return 2 * math.pi * self.radius

# Shape()  → TypeError: Can't instantiate abstract class
c = Circle(5)
c.describe()  # "Area: 78.54, Perimeter: 31.42"
```

### Dataclasses (Python 3.7+)
```python
from dataclasses import dataclass, field, fields, asdict, astuple

@dataclass
class Point:
    x: float
    y: float
    z: float = 0.0  # default value
    label: str = field(default="origin")
    _cache: dict = field(default_factory=dict, repr=False, compare=False)

    def distance_from_origin(self) -> float:
        return (self.x**2 + self.y**2 + self.z**2) ** 0.5

    def __post_init__(self):
        # Validation after __init__
        if self.x < 0:
            raise ValueError("x must be non-negative")

p = Point(3.0, 4.0)
p         # Point(x=3.0, y=4.0, z=0.0, label='origin')
p == Point(3.0, 4.0)  # True — __eq__ auto-generated

asdict(p)   # {'x': 3.0, 'y': 4.0, 'z': 0.0, 'label': 'origin'}
astuple(p)  # (3.0, 4.0, 0.0, 'origin')

# Frozen dataclass (immutable)
@dataclass(frozen=True)
class Config:
    host: str
    port: int = 8080

# Ordered dataclass
@dataclass(order=True)
class Version:
    major: int
    minor: int
    patch: int
```

### Dunder (Magic) Methods
```python
class Vector:
    def __init__(self, x, y): self.x = x; self.y = y

    # Arithmetic
    def __add__(self, other): return Vector(self.x+other.x, self.y+other.y)
    def __sub__(self, other): return Vector(self.x-other.x, self.y-other.y)
    def __mul__(self, scalar): return Vector(self.x*scalar, self.y*scalar)
    def __rmul__(self, scalar): return self.__mul__(scalar)  # scalar * vector
    def __truediv__(self, s): return Vector(self.x/s, self.y/s)
    def __neg__(self): return Vector(-self.x, -self.y)
    def __abs__(self): return (self.x**2 + self.y**2) ** 0.5

    # Comparison
    def __eq__(self, o): return self.x == o.x and self.y == o.y
    def __lt__(self, o): return abs(self) < abs(o)

    # Container protocol
    def __len__(self): return 2
    def __getitem__(self, i): return [self.x, self.y][i]
    def __iter__(self): yield self.x; yield self.y
    def __contains__(self, val): return val in (self.x, self.y)

    # Context manager protocol
    def __enter__(self): return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        return False  # don't suppress exceptions

    # Callable
    def __call__(self, factor): return Vector(self.x*factor, self.y*factor)

    # String
    def __repr__(self): return f"Vector({self.x}, {self.y})"
    def __str__(self): return f"({self.x}, {self.y})"
```

---

## 5. Iterators, Generators & Comprehensions

### Iterators
```python
# Iterator protocol: __iter__() and __next__()
class CountUp:
    def __init__(self, start, stop):
        self.current = start
        self.stop = stop

    def __iter__(self):
        return self  # iterator returns itself

    def __next__(self):
        if self.current >= self.stop:
            raise StopIteration
        val = self.current
        self.current += 1
        return val

for n in CountUp(1, 5):
    print(n)  # 1, 2, 3, 4
```

### Generators
```python
# Generator function: uses yield, returns a generator object
# Lazy evaluation — values generated on demand, not all at once
def fibonacci():
    a, b = 0, 1
    while True:          # infinite sequence!
        yield a
        a, b = b, a + b

fib = fibonacci()
next(fib)   # 0
next(fib)   # 1
next(fib)   # 1
[next(fib) for _ in range(5)]  # [2, 3, 5, 8, 13]

# Generator with return
def count_up(n):
    for i in range(n):
        yield i
    return "done"  # value of StopIteration exception

# yield from — delegate to another generator
def chain(*iterables):
    for it in iterables:
        yield from it

list(chain([1,2], [3,4], [5]))  # [1, 2, 3, 4, 5]

# Generator expressions (like list comp but lazy)
squares = (x**2 for x in range(1000000))  # uses ~a few hundred bytes
# vs: squares = [x**2 for x in range(1000000)]  # uses ~8 MB

# send() to send values into generator
def accumulator():
    total = 0
    while True:
        value = yield total  # yields current total, receives next value
        total += value

acc = accumulator()
next(acc)      # 0 (advance to first yield)
acc.send(10)   # 10
acc.send(20)   # 30
acc.send(5)    # 35
```

### Comprehensions
```python
# List comprehension
squares = [x**2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]
flat = [x for row in matrix for x in row]          # nested (outer first)
filtered = [f(x) for x in data if predicate(x)]

# Set comprehension
unique_lengths = {len(word) for word in words}

# Dict comprehension
square_map = {x: x**2 for x in range(10)}
inverted = {v: k for k, v in my_dict.items()}

# Generator expression
total = sum(x**2 for x in range(1000))  # no list built in memory

# Walrus operator := (Python 3.8+) — assign and return in expression
data = [y := f(x), y**2, y**3]  # compute f(x) once, reuse y
# In comprehension:
results = [clean for x in data if (clean := process(x)) is not None]
```

---

## 6. Decorators & Context Managers

**Theory.** A **decorator** is simply a function that takes a function (or class) and returns a replacement; the `@d` syntax above `def f` is sugar for `f = d(f)`. Because functions are first-class, decorators let you wrap **cross-cutting behavior** — logging, timing, caching, retries, access control — around existing code without editing it (the Wrapper/Proxy pattern). Always apply `@functools.wraps` to the inner wrapper so the original `__name__`/`__doc__` survive. A decorator that takes arguments is a *decorator factory* — a function that returns a decorator, i.e. one more level of nesting. A **context manager** (the `with` statement) guarantees that paired setup/teardown runs even when an exception is thrown: implement `__enter__`/`__exit__`, or more simply write a generator decorated with `@contextmanager` that `yield`s exactly once. Use context managers for anything that must be reliably released — files, locks, DB connections/transactions, timers, or temporary global state.

### Decorators
```python
from functools import wraps
import time, logging

# Simple decorator
def log_calls(func):
    @wraps(func)  # preserve original function metadata
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        result = func(*args, **kwargs)
        print(f"{func.__name__} returned {result}")
        return result
    return wrapper

@log_calls
def add(x, y):
    return x + y

# Equivalent to: add = log_calls(add)
add(3, 4)

# Decorator with parameters (factory pattern)
def retry(max_attempts=3, exceptions=(Exception,)):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    if attempt == max_attempts - 1:
                        raise
                    print(f"Attempt {attempt+1} failed: {e}. Retrying...")
            return None
        return wrapper
    return decorator

@retry(max_attempts=3, exceptions=(ConnectionError, TimeoutError))
def call_api(url):
    ...

# Class-based decorator
class Timer:
    def __init__(self, func):
        wraps(func)(self)
        self.func = func

    def __call__(self, *args, **kwargs):
        start = time.perf_counter()
        result = self.func(*args, **kwargs)
        end = time.perf_counter()
        print(f"{self.func.__name__} took {end-start:.4f}s")
        return result

@Timer
def slow_function():
    time.sleep(0.1)

# Stacking decorators (applied bottom to top)
@log_calls
@retry(max_attempts=3)
def risky_function():
    pass
# Equivalent to: risky_function = log_calls(retry(max_attempts=3)(risky_function))
```

### Context Managers
```python
# Protocol: __enter__ and __exit__
class ManagedFile:
    def __init__(self, filename, mode):
        self.filename = filename
        self.mode = mode
        self.file = None

    def __enter__(self):
        self.file = open(self.filename, self.mode)
        return self.file

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.file.close()
        # Return True to suppress exceptions, False/None to propagate
        return False

with ManagedFile("data.txt", "r") as f:
    data = f.read()

# @contextmanager decorator — simpler
from contextlib import contextmanager, suppress

@contextmanager
def timer(label=""):
    start = time.perf_counter()
    try:
        yield  # code inside 'with' block runs here
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label}: {elapsed:.4f}s")

with timer("Data processing"):
    process_data()

# suppress: silently ignore specific exceptions
with suppress(FileNotFoundError):
    os.remove("file.txt")  # won't raise if file doesn't exist

# ExitStack: dynamic context managers
from contextlib import ExitStack
with ExitStack() as stack:
    files = [stack.enter_context(open(f)) for f in filenames]
    # all files closed when exiting
```

---

## 7. Modules, Packages & Imports

```python
# Import styles
import os                          # use as os.path.join()
import os.path                     # use as os.path.join()
from os import path                # use as path.join()
from os.path import join, exists   # use directly as join()
from os import *                   # wildcard — avoid in production

# Relative imports (within a package)
from . import module               # import from same package
from .. import module              # import from parent package
from ..utils import helper         # import specific from parent

# __init__.py — makes directory a package
# Can expose public API:
# mypackage/__init__.py:
from .core import CoreClass
from .utils import helper_function
__all__ = ["CoreClass", "helper_function"]  # controls wildcard import

# __all__: controls what 'from module import *' exposes
__all__ = ["PublicClass", "public_function"]

# if __name__ == "__main__": pattern
# __name__ == "__main__" when file is run directly
# __name__ == "module_name" when imported
if __name__ == "__main__":
    main()  # only runs when script is executed directly

# Lazy imports — defer expensive imports
def get_data():
    import pandas as pd   # imported only when function is called
    return pd.read_csv("data.csv")

# importlib for dynamic imports
import importlib
module = importlib.import_module("mypackage.mymodule")
cls = getattr(module, "MyClass")
```

---

## 8. Error Handling & Exceptions

**Theory.** Python favors **EAFP** — "easier to ask forgiveness than permission": attempt the operation and handle the exception if it fails, rather than checking every precondition first (LBYL). Exceptions are objects in a class hierarchy rooted at `BaseException`; you catch by type and order handlers **most-specific first**, catching the *narrowest* exception you can genuinely handle instead of a bare `except`. `else` runs only when the `try` block raised nothing, and `finally` always runs (use it for cleanup). Define **custom exception classes** (subclassing a project-level base) so callers can react to domain-specific failures, and use **exception chaining** — `raise NewError(...) from original` — to keep the underlying cause visible in the traceback. Never silently swallow exceptions; if you catch only to re-raise, a bare `raise` preserves the original stack trace.

```python
# Exception hierarchy (Python)
BaseException
  ├── SystemExit
  ├── KeyboardInterrupt
  ├── GeneratorExit
  └── Exception
        ├── ArithmeticError
        │     └── ZeroDivisionError
        ├── LookupError
        │     ├── IndexError
        │     └── KeyError
        ├── ValueError
        ├── TypeError
        ├── AttributeError
        ├── FileNotFoundError
        ├── OSError
        ├── RuntimeError
        └── StopIteration

# try / except / else / finally
try:
    result = risky_operation()
except (ValueError, TypeError) as e:
    print(f"Type/Value error: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
    raise  # re-raise the exception
else:
    # runs only if NO exception occurred
    print(f"Success: {result}")
finally:
    # ALWAYS runs (cleanup)
    cleanup()

# Custom exceptions (best practices)
class AppError(Exception):
    """Base class for application errors."""
    pass

class ValidationError(AppError):
    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message
        super().__init__(f"Validation failed for '{field}': {message}")

class UserNotFoundError(AppError):
    def __init__(self, user_id: int):
        self.user_id = user_id
        super().__init__(f"User with ID {user_id} not found")

# Exception chaining
try:
    connect_to_db()
except ConnectionError as e:
    raise ServiceUnavailableError("DB unavailable") from e  # preserves original traceback

# suppress re-raising when original not relevant
raise ServiceUnavailableError("DB unavailable") from None  # suppress chain

# contextlib.suppress
from contextlib import suppress
with suppress(FileNotFoundError, PermissionError):
    os.remove("temp.txt")
```

---

## 9. Concurrency & Parallelism

**Theory.** Picking the right concurrency model in Python hinges on the **GIL** (Global Interpreter Lock): in CPython only one thread executes Python bytecode at a time, so **threads do not speed up CPU-bound work** — but because the GIL is released during I/O, threads *do* help **I/O-bound** work. That leads to three tools for three situations: **`threading`** for a modest number of blocking I/O tasks; **`asyncio`** — a single-threaded cooperative event loop driven by `async/await` — for *massive* I/O concurrency (thousands of connections); and **`multiprocessing`** — separate processes, each with its own interpreter and GIL — for true parallelism on **CPU-bound** work. `concurrent.futures` provides one uniform `Executor` API over both thread and process pools. Two rules to remember: never run a blocking call inside an asyncio event loop (it freezes everything), and protect shared mutable state in threads with locks or hand work off through queues.

### Threading
```python
import threading
from threading import Thread, Lock, RLock, Event, Semaphore, Condition

# Basic thread
def worker(n):
    print(f"Thread {n} running")

threads = [Thread(target=worker, args=(i,)) for i in range(5)]
for t in threads: t.start()
for t in threads: t.join()  # wait for all to complete

# Thread with lock
counter = 0
lock = Lock()

def increment():
    global counter
    for _ in range(100000):
        with lock:   # context manager for lock
            counter += 1

# GIL (Global Interpreter Lock):
# CPython has a GIL — only one thread executes Python bytecode at a time
# Threading is STILL useful for I/O-bound tasks (GIL released during I/O)
# For CPU-bound tasks: use multiprocessing instead

# RLock — reentrant lock (same thread can acquire multiple times)
rlock = RLock()
with rlock:
    with rlock:  # OK with RLock, would deadlock with Lock
        pass

# Event — signal between threads
event = Event()
def waiter():
    print("Waiting for event...")
    event.wait()          # blocks until event is set
    print("Event fired!")

def setter():
    time.sleep(1)
    event.set()           # wake up all waiters

# Condition — complex synchronization (producer-consumer)
condition = Condition()
buffer = []

def producer():
    for item in items:
        with condition:
            buffer.append(item)
            condition.notify()   # wake one consumer

def consumer():
    while True:
        with condition:
            while not buffer:
                condition.wait()  # releases lock and waits
            item = buffer.pop(0)
        process(item)
```

### concurrent.futures
```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed

# ThreadPoolExecutor — I/O-bound tasks
with ThreadPoolExecutor(max_workers=10) as executor:
    # submit returns Future
    future = executor.submit(fetch_url, url)
    result = future.result()  # blocks until done

    # map — like map() but concurrent
    results = list(executor.map(fetch_url, urls))

    # as_completed — process results as they finish (not in submission order)
    futures = {executor.submit(fetch_url, url): url for url in urls}
    for future in as_completed(futures):
        url = futures[future]
        try:
            data = future.result()
        except Exception as e:
            print(f"Error fetching {url}: {e}")

# ProcessPoolExecutor — CPU-bound tasks (bypasses GIL)
with ProcessPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(cpu_intensive_function, data_chunks))
```

### asyncio — Async/Await
```python
import asyncio
import aiohttp  # async HTTP client

# coroutine function
async def fetch(session, url):
    async with session.get(url) as response:
        return await response.json()

async def main():
    urls = ["https://api.example.com/users/1", "https://api.example.com/users/2"]

    async with aiohttp.ClientSession() as session:
        # gather — run concurrently
        results = await asyncio.gather(
            *[fetch(session, url) for url in urls]
        )

    # or: TaskGroup (Python 3.11+)
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(fetch(session, url)) for url in urls]
    results = [t.result() for t in tasks]

asyncio.run(main())

# async generator
async def paginated_fetch(base_url, page=1):
    while True:
        data = await fetch(base_url + f"?page={page}")
        if not data: break
        for item in data:
            yield item
        page += 1

async for item in paginated_fetch("https://api.example.com/data"):
    process(item)

# asyncio primitives
lock = asyncio.Lock()
event = asyncio.Event()
semaphore = asyncio.Semaphore(10)  # limit concurrent operations

async def limited_fetch(semaphore, url):
    async with semaphore:
        return await fetch(url)

# asyncio.Queue for producer-consumer
queue = asyncio.Queue(maxsize=10)

async def producer():
    for item in items:
        await queue.put(item)  # blocks if full

async def consumer():
    while True:
        item = await queue.get()
        await process(item)
        queue.task_done()

await queue.join()  # wait until all items processed
```

### Threading vs Multiprocessing vs asyncio
```
Threading:
  + Shared memory, lightweight
  + Good for I/O-bound (GIL released during I/O)
  - GIL limits CPU-bound parallelism
  - Race conditions, need locks

Multiprocessing:
  + True parallelism (separate processes, no GIL)
  + Good for CPU-bound tasks
  - Higher overhead (process creation, memory)
  - No shared memory (use Queue/Pipe/Manager)

asyncio:
  + Single-threaded, event loop
  + Best for I/O-bound, high concurrency (1000s of connections)
  + No race conditions (cooperative multitasking)
  - Can't use blocking I/O (blocks entire event loop)
  - Requires async-aware libraries (aiohttp, asyncpg, etc.)
  - More complex mental model

Rule of thumb:
  I/O-bound + few tasks:    threading
  I/O-bound + many tasks:   asyncio
  CPU-bound:                multiprocessing
```

---

## 10. Memory Management & Internals

### Reference Counting & GC
```python
import sys, gc

# CPython uses reference counting as primary GC
a = [1, 2, 3]
sys.getrefcount(a)  # 2 (variable a + getrefcount argument)

b = a
sys.getrefcount(a)  # 3

del b
sys.getrefcount(a)  # 2

# When refcount drops to 0 → object immediately freed
# BUT: circular references! — handled by cyclic GC

class Node:
    def __init__(self):
        self.ref = None

a = Node()
b = Node()
a.ref = b
b.ref = a  # circular reference!
del a, b   # refcount never reaches 0 without cyclic GC

# Python's gc module handles cycles
gc.collect()          # force collection
gc.disable()          # disable automatic gc
gc.enable()           # enable
gc.get_count()        # (gen0, gen1, gen2) collection counts

# __slots__ — save memory by avoiding __dict__
class Point:
    __slots__ = ['x', 'y']  # restricts attributes to these only
    def __init__(self, x, y):
        self.x = x
        self.y = y

# Regular class instance: ~232 bytes
# With __slots__: ~80 bytes (no __dict__, no __weakref__)
```

### Python Internals
```python
# Small integer caching (-5 to 256 in CPython)
a = 256; b = 256
a is b   # True

a = 257; b = 257
a is b   # False (different objects)

# String interning
a = "hello"
b = "hello"
a is b   # True (interned — same object for identifiers)

a = "hello world"
b = "hello world"
a is b   # False (not interned — contains space)
b = sys.intern(b)  # force interning

# Bytecode inspection
import dis
def func(x): return x + 1
dis.dis(func)  # shows Python bytecode instructions
```

---

## 11. Python Type System & Annotations

**Theory.** Python remains **dynamically typed at runtime** — type annotations are *hints*, not enforced by the interpreter. Their value comes from **static checkers** (mypy, pyright) that read them to catch type bugs *before* you run, and from IDEs that use them for autocomplete and safe refactoring. Hints turn a large codebase into self-documenting, safer code without giving up Python's flexibility. Beyond basic types you'll reach for `Optional[X]` / `X | None` for nullable values, `Union` / `X | Y` for alternatives, generics via `TypeVar` and `Generic` for reusable containers, `Protocol` for **structural typing** (duck typing made checkable — "anything with these methods"), `Literal` for a fixed set of allowed values, and `TypedDict`/`dataclass`/Pydantic for structured records. Note that runtime validation (as in Pydantic/FastAPI) is a *separate* concern layered on top of the same annotations.

```python
from typing import (
    Optional, Union, List, Dict, Tuple, Set, FrozenSet,
    Callable, Generator, Iterator, Iterable,
    Any, TypeVar, Generic, Protocol, TypedDict,
    ClassVar, Final, Literal, Annotated
)

# Basic annotations
def greet(name: str, times: int = 1) -> str:
    return (name + " ") * times

# Optional (same as Union[X, None])
def find_user(user_id: int) -> Optional[str]:
    return users.get(user_id)

# Union (Python 3.10+: int | str)
def process(value: int | str) -> str:
    return str(value)

# TypeVar — generic type variable
T = TypeVar('T')

def first(lst: list[T]) -> Optional[T]:
    return lst[0] if lst else None

# Generic class
class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

# Protocol — structural subtyping (duck typing formalized)
from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None: ...
    def get_position(self) -> tuple[int, int]: ...

def render(obj: Drawable) -> None:  # any object with draw() and get_position() works
    obj.draw()

# TypedDict
class UserInfo(TypedDict):
    name: str
    age: int
    email: str

def process_user(user: UserInfo) -> str:
    return f"{user['name']} ({user['age']})"

# Callable
from typing import Callable
def apply(func: Callable[[int, int], int], a: int, b: int) -> int:
    return func(a, b)

# Literal — specific values
from typing import Literal
def set_log_level(level: Literal["DEBUG", "INFO", "WARNING", "ERROR"]) -> None: ...

# Final — constant
MAX_SIZE: Final[int] = 100

# ClassVar — class-level variable
class Config:
    DEBUG: ClassVar[bool] = False
    instance_var: int = 0
```

---

## 12. Testing in Python

### pytest
```python
# test_mymodule.py
import pytest
from mymodule import add, divide, User

# Basic test
def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0
    assert add(0, 0) == 0

# Testing exceptions
def test_divide_by_zero():
    with pytest.raises(ZeroDivisionError):
        divide(10, 0)

def test_divide_by_zero_message():
    with pytest.raises(ZeroDivisionError, match="division by zero"):
        divide(10, 0)

# Parametrize — run same test with multiple inputs
@pytest.mark.parametrize("a, b, expected", [
    (2, 3, 5),
    (0, 0, 0),
    (-1, 1, 0),
    (100, -50, 50),
])
def test_add_parametrized(a, b, expected):
    assert add(a, b) == expected

# Fixtures
@pytest.fixture
def sample_user():
    return User(id=1, name="Alice", email="alice@example.com")

@pytest.fixture(scope="module")  # shared across all tests in module
def db_connection():
    conn = create_test_db()
    yield conn  # teardown after yield
    conn.close()

def test_user_name(sample_user):
    assert sample_user.name == "Alice"

# Mocking
from unittest.mock import Mock, patch, MagicMock, AsyncMock

def test_fetch_user():
    mock_repo = Mock()
    mock_repo.find_by_id.return_value = User(1, "Alice", "alice@example.com")

    service = UserService(mock_repo)
    user = service.get_user(1)

    mock_repo.find_by_id.assert_called_once_with(1)
    assert user.name == "Alice"

# patch — replace object for the duration of test
@patch("mymodule.requests.get")
def test_api_call(mock_get):
    mock_get.return_value.json.return_value = {"status": "ok"}
    result = call_api("https://api.example.com")
    assert result == {"status": "ok"}

# Async test
@pytest.mark.asyncio
async def test_async_function():
    mock = AsyncMock(return_value={"data": [1, 2, 3]})
    result = await fetch_data(mock)
    assert len(result) == 3
```

---

## 13. Python vs Java — Key Differences

| Aspect | Python | Java |
|--------|--------|------|
| Typing | Dynamic (duck typing) | Static (strong typing) |
| Compilation | Interpreted (bytecode) | Compiled to JVM bytecode |
| Performance | Slower (CPython) | Faster (JIT) |
| Concurrency | GIL limits CPU parallelism | True multithreading |
| Syntax | Concise, indentation-based | Verbose, braces |
| OOP | Multi-paradigm, flexible | Primarily OOP |
| Memory | Automatic GC (refcount + cyclic) | Automatic GC (generational) |
| Error handling | try/except | try/catch |
| Null safety | None, no null pointer magic | NullPointerException risk |
| Interfaces | Protocol (structural) | Interface (nominal) |
| Speed to develop | Fast | Slower (more boilerplate) |
| Ecosystem | Data science, ML, scripting | Enterprise, Android |
| Package manager | pip/poetry/uv | Maven/Gradle |

```python
# Python: concise
def factorial(n): return 1 if n <= 1 else n * factorial(n-1)

# Java equivalent:
# public static long factorial(long n) {
#     return n <= 1 ? 1 : n * factorial(n - 1);
# }

# Python list comprehension vs Java stream
squares = [x**2 for x in range(10) if x % 2 == 0]
# Java: IntStream.range(0,10).filter(x->x%2==0).map(x->x*x).boxed().toList()
```

---

## 14. Interview Q&A

**Q: What is the GIL and why does Python have it?**
A: The Global Interpreter Lock (GIL) is a mutex in CPython that allows only one thread to execute Python bytecode at a time. It exists because CPython's memory management (reference counting) is not thread-safe. The GIL simplifies the implementation and protects Python objects from concurrent modification. For CPU-bound parallel code, use `multiprocessing` (separate processes, no shared GIL). For I/O-bound code, `threading` and `asyncio` work well because the GIL is released during I/O operations.

**Q: Difference between `is` and `==`?**
A: `==` compares values (calls `__eq__`). `is` compares identity (same object in memory, same `id()`). Always use `==` for value comparison. Use `is` only for `None`, `True`, `False` checks (`if x is None`).

**Q: What is a generator and when would you use it?**
A: A generator is a function that uses `yield` to produce values lazily, one at a time. Unlike lists, generators don't store all values in memory. Use generators when: processing large datasets that don't fit in memory, implementing infinite sequences, creating pipelines of transformations, reading large files line by line.

**Q: How does Python's garbage collection work?**
A: CPython primarily uses reference counting. Every object has a reference count; when it drops to 0, the object is immediately freed. However, reference counting cannot handle circular references. CPython also has a cyclic garbage collector (generational: gen0, gen1, gen2) that periodically detects and breaks cycles. PyPy uses a different GC (mark-and-sweep).

**Q: What are `*args` and `**kwargs`?**
A: `*args` collects extra positional arguments into a tuple. `**kwargs` collects extra keyword arguments into a dictionary. In function calls, `*` unpacks a sequence as positional args and `**` unpacks a dict as keyword args. `def f(*args, **kwargs): ...` accepts any combination.

**Q: What is the difference between `@staticmethod`, `@classmethod`, and instance methods?**
A: Instance methods receive `self` (the instance). Class methods receive `cls` (the class) — used for alternative constructors or factory methods. Static methods receive neither — they're regular functions scoped to the class. Use `@classmethod` for `from_json()`, `from_dict()` patterns. Use `@staticmethod` for utility functions related to the class but not needing class/instance access.

**Q: Explain Python decorators.**
A: A decorator is a function that takes a function as input and returns a modified function. They implement the Proxy/Wrapper pattern. Common uses: logging, timing, access control, caching (`@lru_cache`), retry logic, validation. The `@functools.wraps(func)` call inside preserves the original function's metadata (`__name__`, `__doc__`).

**Q: What is `__slots__`?**
A: By default, Python stores instance attributes in a `__dict__`. `__slots__ = ['x', 'y']` replaces `__dict__` with a fixed set of attributes, reducing memory usage by ~50-70% for many objects. Drawback: can't add new attributes dynamically; doesn't work well with multiple inheritance unless all classes define `__slots__`.
