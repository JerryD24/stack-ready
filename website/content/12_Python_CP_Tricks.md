# Python — Competitive Programming Tricks & Shortcuts
### Complete Cheat Sheet | LeetCode + Coding Interviews

---

## TABLE OF CONTENTS
1. [Fast I/O in Python](#1-fast-io-in-python)
2. [Built-in Power Tools](#2-built-in-power-tools)
3. [Collections Module — CP Arsenal](#3-collections-module--cp-arsenal)
4. [heapq — Priority Queue Tricks](#4-heapq--priority-queue-tricks)
5. [bisect — Binary Search on Sorted Lists](#5-bisect--binary-search-on-sorted-lists)
6. [itertools & functools](#6-itertools--functools)
7. [String Tricks](#7-string-tricks)
8. [Math & Number Theory](#8-math--number-theory)
9. [Bit Manipulation in Python](#9-bit-manipulation-in-python)
10. [Algorithm Templates](#10-algorithm-templates)
11. [Dynamic Programming Templates](#11-dynamic-programming-templates)
12. [Graph Templates](#12-graph-templates)
13. [Python-Specific Tricks & One-Liners](#13-python-specific-tricks--one-liners)
14. [Problem Pattern Recognition](#14-problem-pattern-recognition)
15. [Common Gotchas & Mistakes](#15-common-gotchas--mistakes)

---

## 1. Fast I/O in Python

```python
import sys
input = sys.stdin.readline        # ~3-5x faster than built-in input()

# Read integer
n = int(input())

# Read list of integers in one line
arr = list(map(int, input().split()))

# Read multiple variables
a, b, c = map(int, input().split())

# Read n lines of integers
data = [list(map(int, input().split())) for _ in range(n)]

# Fast output — sys.stdout.write is faster than print() for large output
sys.stdout.write("Hello\n")
print(*arr, sep="\n")             # print all elements, newline between

# Template for competitive programming
import sys
input = sys.stdin.readline

def solve():
    n = int(input())
    arr = list(map(int, input().split()))
    # your solution here
    print(answer)

t = int(input())
for _ in range(t):
    solve()
```

---

## 2. Built-in Power Tools

### Essential Built-ins
```python
# Number operations
abs(-5)           # 5
pow(2, 10)        # 1024
pow(2, 10, 1000)  # 2^10 % 1000 = 24 (FAST modular exponentiation!)
divmod(17, 5)     # (3, 2) — quotient and remainder together
round(3.567, 2)   # 3.57

# Sequence operations
len([1,2,3])      # 3
min(3,1,4)        # 1
max([3,1,4,1,5])  # 5
sum([1,2,3,4,5])  # 15
sorted([3,1,2], reverse=True)  # [3, 2, 1]
reversed([1,2,3]) # iterator (use list() to convert)

# ANY / ALL with generators (short-circuits!)
any(x > 5 for x in arr)   # True if any element > 5
all(x > 0 for x in arr)   # True if all elements > 0

# enumerate — (index, value) pairs
for i, val in enumerate(arr, start=1):   # start from 1
    print(i, val)

# zip — iterate multiple sequences together
for a, b in zip(list1, list2):
    print(a + b)

# unzip / transpose
matrix = [(1,2,3),(4,5,6),(7,8,9)]
cols = list(zip(*matrix))  # [(1,4,7),(2,5,8),(3,6,9)] — transpose!

# map and filter
doubled = list(map(lambda x: x*2, arr))
evens = list(filter(lambda x: x%2==0, arr))

# sorted with key
students = [("Alice", 85), ("Bob", 92), ("Charlie", 78)]
by_grade = sorted(students, key=lambda x: x[1], reverse=True)

# sort by multiple criteria
people.sort(key=lambda x: (x.age, x.name))  # by age, then by name

# chr and ord
chr(65)   # 'A'
ord('A')  # 65
chr(ord('a') + 2)  # 'c'
ord('z') - ord('a')  # 25

# bin, oct, hex
bin(10)    # '0b1010'
oct(8)     # '0o10'
hex(255)   # '0xff'
int('1010', 2)   # 10 (binary string to int)
int('ff', 16)    # 255 (hex to int)

# hash (for custom keys in sets/dicts)
hash((1, 2, 3))    # immutable tuple is hashable
# hash([1,2,3])    # TypeError! lists aren't hashable
```

### Useful Python Idioms
```python
# Swap in one line
a, b = b, a

# Default dictionary value
d.get(key, 0)           # returns 0 if key missing

# Conditional expression (ternary)
result = x if condition else y

# Multiple assignment
x = y = z = 0

# Chained comparisons
0 <= x < n              # Pythonic range check (no &&!)
a < b < c               # True if a < b AND b < c

# Unpack with *
first, *rest = [1, 2, 3, 4, 5]   # first=1, rest=[2,3,4,5]
*init, last = [1, 2, 3, 4, 5]    # init=[1,2,3,4], last=5
a, *_, z = [1, 2, 3, 4, 5]       # a=1, z=5, middle discarded

# Walrus operator (Python 3.8+)
# Assign and test in one expression
while chunk := f.read(8192):
    process(chunk)

results = [y for x in data if (y := transform(x)) is not None]

# Inline if in comprehension
[x if x > 0 else 0 for x in arr]  # replace negatives with 0

# Flatten a 2D list
flat = [x for row in matrix for x in row]
# OR
import itertools
flat = list(itertools.chain.from_iterable(matrix))

# Remove duplicates while preserving order
seen = set()
unique = [x for x in lst if not (x in seen or seen.add(x))]
# OR (Python 3.7+ dict preserves order)
unique = list(dict.fromkeys(lst))
```

---

## 3. Collections Module — CP Arsenal

```python
from collections import Counter, defaultdict, deque, OrderedDict

# ---- COUNTER ----
# Count occurrences of elements
c = Counter("abracadabra")
# Counter({'a': 5, 'b': 2, 'r': 2, 'c': 1, 'd': 1})
c['a']             # 5
c['z']             # 0 (NO KeyError!)
c.most_common(2)   # [('a', 5), ('b', 2)]
c.most_common()[:-3:-1]  # 2 least common elements

# Counter arithmetic
c1 = Counter("aab")
c2 = Counter("bbc")
c1 + c2   # add counts: Counter({'b': 3, 'a': 2, 'c': 1})
c1 - c2   # subtract (non-positive removed): Counter({'a': 2})
c1 & c2   # intersection (min): Counter({'b': 1})
c1 | c2   # union (max): Counter({'b': 2, 'a': 2, 'c': 1})

# Check if anagram
def is_anagram(s: str, t: str) -> bool:
    return Counter(s) == Counter(t)

# Count window characters
from collections import Counter
def check_inclusion(s1: str, s2: str) -> bool:
    need = Counter(s1)
    window = Counter(s2[:len(s1)])
    if window == need: return True
    for i in range(len(s1), len(s2)):
        window[s2[i]] += 1
        char_out = s2[i - len(s1)]
        window[char_out] -= 1
        if window[char_out] == 0:
            del window[char_out]
        if window == need:
            return True
    return False

# ---- defaultdict ----
# Auto-creates value on first access
graph = defaultdict(list)
graph[1].append(2)      # no KeyError even if key 1 doesn't exist

freq = defaultdict(int)
for c in "hello": freq[c] += 1

nested = defaultdict(lambda: defaultdict(int))
nested["a"]["b"] += 1

# Adjacency list for graph
def build_graph(edges):
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)
        graph[v].append(u)  # undirected
    return graph

# ---- deque ----
# O(1) append/pop from both ends (vs list: O(n) for left operations)
dq = deque([1, 2, 3], maxlen=5)   # maxlen = circular buffer

dq.append(4)        # right: [1, 2, 3, 4]
dq.appendleft(0)    # left:  [0, 1, 2, 3, 4]
dq.pop()            # right: returns 4
dq.popleft()        # left:  returns 0
dq.rotate(1)        # [4, 1, 2, 3] (right rotation)
dq.rotate(-1)       # [1, 2, 3, 4] (left rotation)

# Sliding window maximum (monotonic deque)
def max_sliding_window(nums: list[int], k: int) -> list[int]:
    dq = deque()    # stores INDICES, monotonically decreasing values
    result = []
    for i, num in enumerate(nums):
        # Remove elements outside window
        while dq and dq[0] < i - k + 1:
            dq.popleft()
        # Remove smaller elements from back
        while dq and nums[dq[-1]] <= num:
            dq.pop()
        dq.append(i)
        if i >= k - 1:
            result.append(nums[dq[0]])
    return result

# BFS with deque
def bfs(graph, start):
    visited = {start}
    queue = deque([start])
    while queue:
        node = queue.popleft()    # O(1) — use deque, not list!
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
```

---

## 4. heapq — Priority Queue Tricks

```python
import heapq

# MIN-HEAP by default
h = []
heapq.heappush(h, 3)
heapq.heappush(h, 1)
heapq.heappush(h, 4)
heapq.heappop(h)      # 1 (minimum)
h[0]                  # peek at min without removing

# Convert list to heap in-place: O(n)
arr = [5, 3, 8, 1, 9]
heapq.heapify(arr)    # arr is now a valid heap

# MAX-HEAP: negate values
max_heap = []
heapq.heappush(max_heap, -5)
heapq.heappush(max_heap, -3)
max_val = -heapq.heappop(max_heap)   # 5

# Kth largest element
def kth_largest(nums: list[int], k: int) -> int:
    heap = nums[:k]
    heapq.heapify(heap)      # min-heap of size k
    for n in nums[k:]:
        if n > heap[0]:
            heapq.heapreplace(heap, n)   # faster than heappop+heappush
    return heap[0]

# Top K frequent elements
from collections import Counter
def top_k_frequent(nums: list[int], k: int) -> list[int]:
    count = Counter(nums)
    return heapq.nlargest(k, count.keys(), key=count.get)

# nlargest and nsmallest (use when k << n)
heapq.nlargest(3, [5,3,8,1,9])   # [9, 8, 5]
heapq.nsmallest(3, [5,3,8,1,9])  # [1, 3, 5]

# Heap with custom key: store tuples (priority, item)
# Python compares tuples lexicographically
tasks = []
heapq.heappush(tasks, (1, "low priority task"))
heapq.heappush(tasks, (0, "urgent task"))
heapq.heappush(tasks, (2, "normal task"))
priority, task = heapq.heappop(tasks)  # (0, "urgent task")

# Tie-breaking with counter (avoid comparing objects)
import itertools
counter = itertools.count()
tasks = []
heapq.heappush(tasks, (priority, next(counter), item))

# Merge K sorted arrays
def merge_k_sorted(arrays: list[list[int]]) -> list[int]:
    heap = []
    for i, arr in enumerate(arrays):
        if arr:
            heapq.heappush(heap, (arr[0], i, 0))
    result = []
    while heap:
        val, arr_idx, elem_idx = heapq.heappop(heap)
        result.append(val)
        if elem_idx + 1 < len(arrays[arr_idx]):
            next_val = arrays[arr_idx][elem_idx + 1]
            heapq.heappush(heap, (next_val, arr_idx, elem_idx + 1))
    return result

# Find Median from Data Stream
class MedianFinder:
    def __init__(self):
        self.small = []   # max-heap (negated) — lower half
        self.large = []   # min-heap — upper half

    def addNum(self, num: int) -> None:
        heapq.heappush(self.small, -num)
        # Balance: ensure small's max <= large's min
        if self.large and -self.small[0] > self.large[0]:
            heapq.heappush(self.large, -heapq.heappop(self.small))
        # Balance sizes
        if len(self.small) > len(self.large) + 1:
            heapq.heappush(self.large, -heapq.heappop(self.small))
        elif len(self.large) > len(self.small):
            heapq.heappush(self.small, -heapq.heappop(self.large))

    def findMedian(self) -> float:
        if len(self.small) > len(self.large):
            return -self.small[0]
        return (-self.small[0] + self.large[0]) / 2
```

---

## 5. bisect — Binary Search on Sorted Lists

```python
import bisect

a = [1, 3, 4, 7, 9, 11]

# bisect_left: leftmost insertion point (first position where val can go)
bisect.bisect_left(a, 4)    # 2 — (a[2] == 4 exists)
bisect.bisect_left(a, 5)    # 3 — (insert before 7)

# bisect_right: rightmost insertion point (after any existing equal elements)
bisect.bisect_right(a, 4)   # 3
bisect.bisect_right(a, 5)   # 3

# insort: insert while keeping sorted
bisect.insort(a, 5)         # a = [1, 3, 4, 5, 7, 9, 11]
bisect.insort_left(a, 4)    # inserts before existing 4

# Count elements <= target
count_lte = bisect.bisect_right(a, target)

# Count elements in range [lo, hi]
count_range = bisect.bisect_right(a, hi) - bisect.bisect_left(a, lo)

# Find insertion rank
def search_insert(nums: list[int], target: int) -> int:
    return bisect.bisect_left(nums, target)

# Find first occurrence
def first_occurrence(nums: list[int], target: int) -> int:
    pos = bisect.bisect_left(nums, target)
    if pos < len(nums) and nums[pos] == target:
        return pos
    return -1

# Find last occurrence
def last_occurrence(nums: list[int], target: int) -> int:
    pos = bisect.bisect_right(nums, target) - 1
    if pos >= 0 and nums[pos] == target:
        return pos
    return -1

# Binary search on answer space
def min_days_to_bloom(blooms: list[int], m: int, k: int) -> int:
    def can_bloom(day: int) -> bool:
        bunches = consecutive = 0
        for b in blooms:
            if b <= day:
                consecutive += 1
                if consecutive == k:
                    bunches += 1
                    consecutive = 0
            else:
                consecutive = 0
        return bunches >= m

    lo, hi = min(blooms), max(blooms)
    pos = bisect.bisect_left(range(lo, hi+1), True, key=can_bloom)
    return lo + pos if pos < hi - lo + 1 else -1
```

---

## 6. itertools & functools

```python
import itertools, functools

# ---- itertools ----

# product — Cartesian product (nested loops)
list(itertools.product([1,2], [3,4]))   # [(1,3),(1,4),(2,3),(2,4)]
list(itertools.product("AB", repeat=2)) # [('A','A'),('A','B'),('B','A'),('B','B')]

# permutations
list(itertools.permutations([1,2,3]))   # all 3! = 6 permutations
list(itertools.permutations([1,2,3], 2)) # r=2: 6 permutations of length 2

# combinations
list(itertools.combinations([1,2,3,4], 2))       # C(4,2)=6, no repeat, sorted
list(itertools.combinations_with_replacement([1,2,3], 2))  # allow repeats

# chain — flatten iterables
list(itertools.chain([1,2],[3,4],[5]))   # [1,2,3,4,5]
list(itertools.chain.from_iterable([[1,2],[3,4]]))  # same but from nested list

# groupby — group consecutive equal elements
data = sorted([("Alice","Eng"),("Bob","Mkt"),("Carol","Eng")], key=lambda x: x[1])
for dept, members in itertools.groupby(data, key=lambda x: x[1]):
    print(dept, list(members))

# accumulate — running totals, products, etc.
list(itertools.accumulate([1,2,3,4,5]))            # [1,3,6,10,15] (prefix sums)
list(itertools.accumulate([1,2,3,4,5], max))       # [1,2,3,4,5] (running max)
list(itertools.accumulate([1,2,3,4,5], lambda a,b: a*b))  # [1,2,6,24,120] (prefix products)

# takewhile / dropwhile
list(itertools.takewhile(lambda x: x < 4, [1,2,3,4,5]))  # [1,2,3]
list(itertools.dropwhile(lambda x: x < 4, [1,2,3,4,5]))  # [4,5]

# islice — slice an iterator
list(itertools.islice(range(100), 5))               # [0,1,2,3,4]
list(itertools.islice(range(100), 2, 8, 2))         # [2,4,6] (start=2,stop=8,step=2)

# count, cycle, repeat — infinite iterators
itertools.count(10, 2)   # 10, 12, 14, 16, ... (infinite)
itertools.cycle([1,2,3]) # 1,2,3,1,2,3,1, ... (infinite)
itertools.repeat(7, 3)   # 7, 7, 7 (finite repeat)

# ---- functools ----
from functools import lru_cache, cache, reduce, partial, cmp_to_key

# lru_cache / cache — memoization
@cache
def fib(n: int) -> int:
    if n < 2: return n
    return fib(n-1) + fib(n-2)

# For methods (use lru_cache with maxsize)
@lru_cache(maxsize=None)
def dp(i: int, j: int) -> int: ...

# reduce
functools.reduce(lambda a, b: a + b, [1,2,3,4,5])  # 15
functools.reduce(lambda a, b: a * b, range(1,6), 1) # 120 (with initial value)

# cmp_to_key — custom comparison for sorting
import functools
def compare(a: str, b: str) -> int:
    if a + b > b + a: return -1   # a should come first
    elif a + b < b + + a: return 1
    return 0

nums = [3, 30, 34, 5, 9]
strs = list(map(str, nums))
strs.sort(key=functools.cmp_to_key(compare))
# Result: largest number formed: "9534330"

# partial — fix some arguments
double = functools.partial(pow, exp=2)  # no, wrong
add5 = functools.partial(lambda x, n: x + n, n=5)
add5(10)  # 15
```

---

## 7. String Tricks

```python
# Frequency count as sorted tuple (canonical anagram key)
def anagram_key(s: str) -> tuple:
    return tuple(sorted(s))
# OR
def anagram_key(s: str) -> str:
    return "".join(sorted(s))

# All ASCII letters
import string
string.ascii_lowercase   # 'abcdefghijklmnopqrstuvwxyz'
string.ascii_uppercase   # 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
string.digits            # '0123456789'
string.ascii_letters     # lowercase + uppercase
string.punctuation       # '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

# Alphabet tricks
ord('a')            # 97
ord('z') - ord('a') # 25
chr(ord('a') + k)   # kth letter from 'a'

# Frequency array (for lowercase only)
def char_freq(s: str) -> list[int]:
    freq = [0] * 26
    for c in s:
        freq[ord(c) - ord('a')] += 1
    return freq

# String multiplication
"ha" * 3          # "hahaha"
"=" * 20          # "====================" (separator)

# Check palindrome
def is_palindrome(s: str) -> bool:
    s = ''.join(c for c in s.lower() if c.isalnum())
    return s == s[::-1]

# Reverse words
"hello world".split()[::-1]   # ['world', 'hello']
" ".join("hello world".split()[::-1])  # "world hello"

# Rotate string
def rotate(s: str, k: int) -> str:
    k %= len(s)
    return s[k:] + s[:k]

# String to list of chars and back
chars = list("hello")     # ['h', 'e', 'l', 'l', 'o']
"".join(chars)            # "hello"

# Check substring existence
"lo" in "hello"           # True (O(n))

# Find all occurrences
def find_all(haystack: str, needle: str) -> list[int]:
    positions = []
    start = 0
    while (pos := haystack.find(needle, start)) != -1:
        positions.append(pos)
        start = pos + 1
    return positions

# Split and rejoin to normalize whitespace
" ".join("  hello   world  ".split())   # "hello world"

# Z-algorithm (pattern matching, O(n+m))
def z_function(s: str) -> list[int]:
    n = len(s)
    z = [0] * n
    z[0] = n
    l = r = 0
    for i in range(1, n):
        if i < r:
            z[i] = min(r - i, z[i - l])
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1
        if i + z[i] > r:
            l, r = i, i + z[i]
    return z

def pattern_search(text: str, pattern: str) -> list[int]:
    s = pattern + "#" + text
    z = z_function(s)
    m = len(pattern)
    return [i - m - 1 for i in range(m + 1, len(s)) if z[i] == m]
```

---

## 8. Math & Number Theory

```python
import math
from math import gcd, lcm, isqrt, comb, perm, log2, ceil, floor

# GCD and LCM
gcd(12, 8)                  # 4
gcd(12, 8, 6)               # 2 (Python 3.9+: multiple args)
lcm(4, 6)                   # 12 (Python 3.9+)
# For older Python:
def lcm(a, b): return a * b // gcd(a, b)

# Integer square root (exact, no float issues)
isqrt(16)   # 4
isqrt(17)   # 4 (floor)
isqrt(n)    # use instead of int(n**0.5) to avoid float imprecision

# Combinations and Permutations
comb(10, 3)   # 120 = C(10,3)
perm(10, 3)   # 720 = P(10,3) = 10*9*8

# Modular arithmetic
MOD = 10**9 + 7

# Fast modular exponentiation
pow(base, exp, mod)          # Python built-in: O(log exp)
pow(2, 100, MOD)             # very fast!

# Modular inverse (when MOD is prime, Fermat's little theorem)
def mod_inv(a: int, mod: int) -> int:
    return pow(a, mod - 2, mod)

# All operations modulo MOD
def add(a, b): return (a + b) % MOD
def mul(a, b): return (a % MOD) * (b % MOD) % MOD
def sub(a, b): return (a - b + MOD) % MOD
def div(a, b): return mul(a, mod_inv(b, MOD))

# Sieve of Eratosthenes
def sieve(n: int) -> list[bool]:
    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False
    for i in range(2, isqrt(n) + 1):
        if is_prime[i]:
            for j in range(i*i, n+1, i):
                is_prime[j] = False
    return is_prime

# Get all primes up to n
def get_primes(n: int) -> list[int]:
    sieve = [True] * (n + 1)
    sieve[0] = sieve[1] = False
    for i in range(2, isqrt(n) + 1):
        if sieve[i]:
            sieve[i*i::i] = [False] * len(sieve[i*i::i])  # Pythonic slice assignment!
    return [i for i, v in enumerate(sieve) if v]

# Check prime
def is_prime(n: int) -> bool:
    if n < 2: return False
    if n == 2: return True
    if n % 2 == 0: return False
    return all(n % i != 0 for i in range(3, isqrt(n) + 1, 2))

# Factorize
def factorize(n: int) -> dict[int, int]:
    factors = {}
    d = 2
    while d * d <= n:
        while n % d == 0:
            factors[d] = factors.get(d, 0) + 1
            n //= d
        d += 1
    if n > 1:
        factors[n] = factors.get(n, 0) + 1
    return factors

# Number of divisors
def count_divisors(n: int) -> int:
    factors = factorize(n)
    result = 1
    for exp in factors.values():
        result *= (exp + 1)
    return result

# nCr modular with precomputed factorials
def precompute_factorials(n: int, mod: int):
    fact = [1] * (n + 1)
    for i in range(1, n + 1):
        fact[i] = fact[i-1] * i % mod
    inv_fact = [1] * (n + 1)
    inv_fact[n] = pow(fact[n], mod - 2, mod)
    for i in range(n-1, -1, -1):
        inv_fact[i] = inv_fact[i+1] * (i+1) % mod
    def ncr(n, r):
        if r < 0 or r > n: return 0
        return fact[n] * inv_fact[r] % mod * inv_fact[n-r] % mod
    return ncr
```

---

## 9. Bit Manipulation in Python

```python
# Python integers have arbitrary precision — no overflow!
n = 1 << 100   # works! (Java would need BigInteger)

# Basic operations
n & (1 << i)          # check if bit i is set (returns 0 or non-zero)
bool(n & (1 << i))    # explicit bool
n | (1 << i)          # set bit i
n & ~(1 << i)         # unset bit i
n ^ (1 << i)          # toggle bit i
n & (-n)              # isolate rightmost set bit (lowest set bit)
n & (n - 1)           # clear rightmost set bit
n == 0 or (n & (n-1) == 0)   # is power of 2?
bin(n).count('1')     # count set bits (popcount)
n.bit_length()        # position of highest set bit + 1

# XOR tricks
a ^ a   # 0
a ^ 0   # a
a ^ b ^ a  # b (a cancels out)

# Single non-duplicate (XOR all)
def single_number(nums: list[int]) -> int:
    return functools.reduce(lambda a, b: a ^ b, nums)

# Missing number (XOR 0..n with array)
def missing_number(nums: list[int]) -> int:
    n = len(nums)
    return functools.reduce(lambda a, b: a ^ b, nums + list(range(n+1)))

# Two non-duplicate elements
def single_number_iii(nums: list[int]) -> list[int]:
    xor = functools.reduce(lambda a, b: a ^ b, nums)
    diff_bit = xor & (-xor)   # rightmost differing bit
    a = 0
    for n in nums:
        if n & diff_bit:
            a ^= n
    return [a, xor ^ a]

# All subsets using bitmask
def all_subsets(arr: list) -> list[list]:
    n = len(arr)
    result = []
    for mask in range(1 << n):
        subset = [arr[i] for i in range(n) if mask & (1 << i)]
        result.append(subset)
    return result

# Iterate all submasks of mask
def iterate_submasks(mask: int):
    sub = mask
    while sub:
        yield sub
        sub = (sub - 1) & mask   # next smaller submask

# Bitmask DP for TSP / subset problems
def tsp(n: int, dist: list[list[int]]) -> int:
    FULL = (1 << n) - 1
    dp = [[float('inf')] * n for _ in range(1 << n)]
    dp[1][0] = 0   # start at node 0, visited = {0}

    for mask in range(1, 1 << n):
        for u in range(n):
            if not (mask & (1 << u)) or dp[mask][u] == float('inf'):
                continue
            for v in range(n):
                if mask & (1 << v): continue   # already visited
                new_mask = mask | (1 << v)
                dp[new_mask][v] = min(dp[new_mask][v], dp[mask][u] + dist[u][v])

    return min(dp[FULL][v] + dist[v][0] for v in range(n))
```

---

## 10. Algorithm Templates

### Two Pointers
```python
# Template 1: Opposite ends (sorted array)
def two_sum_sorted(nums: list[int], target: int) -> list[int]:
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target: return [left, right]
        elif s < target: left += 1
        else: right -= 1
    return []

# Template 2: Fast-slow (remove duplicates / partition)
def remove_duplicates(nums: list[int]) -> int:
    slow = 0
    for fast in range(len(nums)):
        if slow == 0 or nums[fast] != nums[slow-1]:
            nums[slow] = nums[fast]
            slow += 1
    return slow

# Template 3: Sliding window (variable)
def longest_substring_k_distinct(s: str, k: int) -> int:
    count = defaultdict(int)
    left = res = 0
    for right, c in enumerate(s):
        count[c] += 1
        while len(count) > k:
            count[s[left]] -= 1
            if count[s[left]] == 0:
                del count[s[left]]
            left += 1
        res = max(res, right - left + 1)
    return res
```

### Binary Search Templates
```python
# Find leftmost position satisfying condition
def binary_search_left(lo: int, hi: int, condition) -> int:
    while lo < hi:
        mid = (lo + hi) // 2
        if condition(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo

# Find rightmost position satisfying condition
def binary_search_right(lo: int, hi: int, condition) -> int:
    while lo < hi:
        mid = (lo + hi + 1) // 2   # +1 to prevent infinite loop
        if condition(mid):
            lo = mid
        else:
            hi = mid - 1
    return lo

# Example: minimum speed to arrive on time
def min_speed_on_time(dist: list[int], hour: float) -> int:
    def can_arrive(speed: int) -> bool:
        time = sum(math.ceil(d / speed) for d in dist[:-1]) + dist[-1] / speed
        return time <= hour

    if hour <= len(dist) - 1: return -1   # impossible
    return binary_search_left(1, 10**7, can_arrive)
```

### Monotonic Stack
```python
# Next greater element
def next_greater(nums: list[int]) -> list[int]:
    result = [-1] * len(nums)
    stack = []  # stores indices
    for i, num in enumerate(nums):
        while stack and nums[stack[-1]] < num:
            result[stack.pop()] = num
        stack.append(i)
    return result

# Daily Temperatures
def daily_temperatures(temps: list[int]) -> list[int]:
    result = [0] * len(temps)
    stack = []  # indices
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            result[j] = i - j
        stack.append(i)
    return result

# Largest rectangle in histogram
def largest_rectangle(heights: list[int]) -> int:
    stack = [-1]
    max_area = 0
    for i, h in enumerate(heights):
        while stack[-1] != -1 and heights[stack[-1]] >= h:
            height = heights[stack.pop()]
            width = i - stack[-1] - 1
            max_area = max(max_area, height * width)
        stack.append(i)
    while stack[-1] != -1:
        height = heights[stack.pop()]
        width = len(heights) - stack[-1] - 1
        max_area = max(max_area, height * width)
    return max_area
```

### DFS/BFS on Grid
```python
DIRECTIONS = [(0,1),(0,-1),(1,0),(-1,0)]      # 4-directional
DIRECTIONS8 = [(i,j) for i in [-1,0,1] for j in [-1,0,1] if (i,j) != (0,0)]  # 8-directional

def dfs_grid(grid: list[list[int]], r: int, c: int, visited: set):
    if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]):
        return
    if (r, c) in visited or grid[r][c] == 0:
        return
    visited.add((r, c))
    for dr, dc in DIRECTIONS:
        dfs_grid(grid, r+dr, c+dc, visited)

def bfs_grid(grid: list[list[int]], start_r: int, start_c: int) -> int:
    """BFS from start to end, returns minimum steps."""
    R, C = len(grid), len(grid[0])
    queue = deque([(start_r, start_c, 0)])  # (row, col, steps)
    visited = {(start_r, start_c)}
    while queue:
        r, c, steps = queue.popleft()
        if is_target(r, c): return steps
        for dr, dc in DIRECTIONS:
            nr, nc = r + dr, c + dc
            if 0 <= nr < R and 0 <= nc < C and (nr,nc) not in visited and grid[nr][nc] != 0:
                visited.add((nr, nc))
                queue.append((nr, nc, steps + 1))
    return -1
```

### Union-Find
```python
class UnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.components = n

    def find(self, x: int) -> int:
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]

    def union(self, x: int, y: int) -> bool:
        px, py = self.find(x), self.find(y)
        if px == py: return False   # already connected (would form cycle!)
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        self.components -= 1
        return True

    def connected(self, x: int, y: int) -> bool:
        return self.find(x) == self.find(y)
```

---

## 11. Dynamic Programming Templates

### Memoization (Top-Down)
```python
from functools import cache

# Simple 1D DP
@cache
def dp(i: int) -> int:
    if i <= 1: return i        # base case
    return dp(i-1) + dp(i-2)  # recurrence

# 2D DP
@cache
def dp(i: int, j: int) -> int:
    if i == 0 or j == 0: return 0   # base case
    if text1[i-1] == text2[j-1]:
        return dp(i-1, j-1) + 1
    return max(dp(i-1, j), dp(i, j-1))

# With state tuple (when params can't be cached directly)
@cache
def dp(mask: int, pos: int) -> int: ...   # bitmask DP

# Memoize with unhashable args
memo = {}
def dp(arr_as_tuple, idx):
    key = (arr_as_tuple, idx)
    if key in memo: return memo[key]
    # compute
    memo[key] = result
    return result
```

### Tabulation (Bottom-Up) Templates
```python
# 1D DP
def climb_stairs(n: int) -> int:
    if n <= 2: return n
    dp = [0] * (n + 1)
    dp[1], dp[2] = 1, 2
    for i in range(3, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]

# Space optimized 1D DP
def climb_stairs_opt(n: int) -> int:
    a, b = 1, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

# 2D DP (LCS)
def lcs(s1: str, s2: str) -> int:
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i-1] == s2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]

# 0/1 Knapsack
def knapsack(W: int, weights: list[int], values: list[int]) -> int:
    n = len(weights)
    dp = [0] * (W + 1)
    for i in range(n):
        for w in range(W, weights[i]-1, -1):   # REVERSE for 0/1
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i])
    return dp[W]

# Unbounded Knapsack (coin change)
def coin_change(coins: list[int], amount: int) -> int:
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for coin in coins:
        for x in range(coin, amount + 1):       # FORWARD for unbounded
            dp[x] = min(dp[x], dp[x - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1
```

---

## 12. Graph Templates

```python
# Dijkstra
import heapq
from collections import defaultdict

def dijkstra(n: int, edges: list[tuple], src: int) -> list[int]:
    graph = defaultdict(list)
    for u, v, w in edges:
        graph[u].append((w, v))
        graph[v].append((w, u))   # omit for directed

    dist = [float('inf')] * n
    dist[src] = 0
    heap = [(0, src)]   # (distance, node)

    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]: continue
        for w, v in graph[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(heap, (dist[v], v))
    return dist

# Topological Sort (Kahn's)
def topo_sort(n: int, edges: list[tuple]) -> list[int]:
    graph = defaultdict(list)
    indegree = [0] * n
    for u, v in edges:
        graph[u].append(v)
        indegree[v] += 1

    queue = deque(i for i in range(n) if indegree[i] == 0)
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nei in graph[node]:
            indegree[nei] -= 1
            if indegree[nei] == 0:
                queue.append(nei)
    return order if len(order) == n else []   # empty = cycle

# Kruskal's MST
def kruskal(n: int, edges: list[tuple]) -> int:
    edges.sort(key=lambda x: x[2])   # sort by weight
    uf = UnionFind(n)
    total_weight = edges_used = 0
    for u, v, w in edges:
        if uf.union(u, v):
            total_weight += w
            edges_used += 1
            if edges_used == n - 1: break
    return total_weight if edges_used == n - 1 else -1
```

---

## 13. Python-Specific Tricks & One-Liners

```python
# Flatten nested list (any depth)
def flatten(lst):
    return [x for item in lst for x in (flatten(item) if isinstance(item, list) else [item])]

# Rotate matrix 90 degrees clockwise
def rotate(matrix):
    return [list(row) for row in zip(*matrix[::-1])]

# Transpose matrix
def transpose(matrix):
    return list(map(list, zip(*matrix)))

# All unique characters
def all_unique(s: str) -> bool:
    return len(s) == len(set(s))

# Most frequent element
from statistics import mode
mode([1,2,2,3])   # 2

# Split list into chunks
def chunks(lst, n):
    return [lst[i:i+n] for i in range(0, len(lst), n)]

# Zip to dict
keys = ['a', 'b', 'c']
values = [1, 2, 3]
d = dict(zip(keys, values))   # {'a':1,'b':2,'c':3}

# Merge dicts
d = {**dict1, **dict2}        # Python 3.5+
d = dict1 | dict2             # Python 3.9+

# Conditional list
[x for x in range(10) if x % 2 == 0]

# Flatten and filter in one
[x for row in matrix for x in row if x != 0]

# Count elements satisfying condition
sum(1 for x in arr if x > 0)   # faster than len([x for x in arr if x>0])

# Max by custom key
max(words, key=len)             # longest word
min(points, key=lambda p: p[0]**2 + p[1]**2)  # closest to origin

# Running maximum
from itertools import accumulate
list(accumulate(arr, max))      # [a[0], max(a[0],a[1]), ...]

# Prefix sums
from itertools import accumulate
prefix = [0] + list(accumulate(arr))
range_sum = lambda l, r: prefix[r+1] - prefix[l]

# Product of list
from math import prod
prod([1, 2, 3, 4, 5])    # 120 (Python 3.8+)

# Divmod for quotient and remainder
q, r = divmod(17, 5)    # q=3, r=2

# Infinity
INF = float('inf')
NEG_INF = float('-inf')

# Integer limits (Python has no max_int, but for CP logic)
MAX_INT = 10**18   # use this instead of sys.maxsize for safety
```

---

## 14. Problem Pattern Recognition

| Keywords | Python Approach | Data Structure |
|----------|----------------|----------------|
| "Anagram / permutation" | `Counter(s) == Counter(t)` | Counter |
| "Frequency count" | `Counter(arr)` | Counter |
| "BFS shortest path" | `deque` + visited set | deque |
| "Top K elements" | `heapq.nlargest(k, ...)` | heapq |
| "Kth largest" | min-heap of size k | heapq |
| "Merge K sorted" | heap with (val, list_idx, elem_idx) | heapq |
| "Sorted range queries" | `bisect.bisect_left/right` | bisect |
| "Consecutive elements" | `set()` + check `x-1 not in set` | set |
| "Two sum / pair sum" | `set` or `dict` for complement | set/dict |
| "Subarray sum = k" | prefix sum + `defaultdict(int)` | defaultdict |
| "Interval merging" | sort by start, compare with prev end | list |
| "Cycle detection" | slow/fast pointers | — |
| "Connected components" | UnionFind or DFS+visited | UnionFind/set |
| "Topological order" | Kahn's (BFS indegree) | deque |
| "All subsets" | bitmask `range(1 << n)` | — |
| "All permutations" | `itertools.permutations` | itertools |
| "Combinations" | `itertools.combinations` | itertools |
| "Cartesian product" | `itertools.product` | itertools |
| "Memoize recursion" | `@cache` / `@lru_cache` | functools |
| "Running total/prefix" | `itertools.accumulate` | itertools |
| "Sliding window max" | monotonic deque | deque |
| "Next greater element" | monotonic stack | list as stack |

---

## 15. Common Gotchas & Mistakes

```python
# 1. MUTABLE DEFAULT ARGUMENT (most common Python bug!)
# BAD:
def append_to(elem, to=[]):   # 'to' is created ONCE, shared across calls!
    to.append(elem)
    return to
append_to(1)  # [1]
append_to(2)  # [1, 2]  ← NOT [2]!

# GOOD:
def append_to(elem, to=None):
    if to is None:
        to = []
    to.append(elem)
    return to

# 2. CLOSURE CAPTURE IN LOOPS
# BAD:
funcs = [lambda: i for i in range(5)]
funcs[0]()  # 4 (not 0!) — all lambdas capture same 'i'

# GOOD: use default argument to capture value
funcs = [lambda i=i: i for i in range(5)]
funcs[0]()  # 0

# 3. INTEGER OVERFLOW — Python NEVER overflows!
2**1000   # works! Python handles arbitrary precision
# BUT: float overflow
2.0**1024   # inf
# Use Python integers for large numbers in DP

# 4. DEEP COPY vs SHALLOW COPY
original = [[1,2],[3,4]]
shallow = original.copy()     # or original[:]
shallow[0][0] = 99
print(original)   # [[99,2],[3,4]] ← MODIFIED! shallow copy

import copy
deep = copy.deepcopy(original)
deep[0][0] = 99
print(original)   # unchanged

# 5. MODIFYING LIST WHILE ITERATING
lst = [1, 2, 3, 4, 5]
# BAD:
for x in lst:
    if x % 2 == 0: lst.remove(x)   # skips elements!

# GOOD: iterate over copy
for x in lst[:]:
    if x % 2 == 0: lst.remove(x)
# OR: list comprehension
lst = [x for x in lst if x % 2 != 0]

# 6. FLOATING POINT COMPARISONS
0.1 + 0.2 == 0.3   # False!
abs(0.1 + 0.2 - 0.3) < 1e-9   # True — use epsilon comparison
import math
math.isclose(0.1 + 0.2, 0.3)   # True — Pythonic way

# 7. INTEGER DIVISION
7 / 2     # 3.5 (true division)
7 // 2    # 3 (floor division)
-7 // 2   # -4 (floors toward -infinity!)
int(-7/2) # -3 (truncates toward zero)
# For truncation toward zero:
import math
math.trunc(-7 / 2)   # -3

# 8. NEGATIVE MODULO
-1 % 5    # 4 in Python (result has sign of divisor)
-1 % -5   # -1 in Python
# For C-style modulo (truncated):
math.fmod(-1, 5)  # -1.0

# 9. COMPARING NESTED LISTS/DICTS
# Python compares lists lexicographically — works for sorting
[1,2,3] < [1,2,4]   # True
# But for checking equality, == works correctly
[1,2,3] == [1,2,3]  # True

# 10. sys.setrecursionlimit for deep recursion
import sys
sys.setrecursionlimit(10**6)   # increase from default ~1000
# But prefer iterative + explicit stack for very deep recursion

# 11. EMPTY LIST as DEFAULT RETURN
def find(arr, target):
    return next((i for i, x in enumerate(arr) if x == target), -1)
    # Returns -1, NOT None, on not found

# 12. HASH COLLISION — use sorted tuple for canonical form
# For anagram grouping:
key = tuple(sorted(word))      # NOT sorted(word) (returns list, not hashable)
```

---

## QUICK REFERENCE CARD

```python
# Data structures summary
list:       O(1) append, O(n) insert/search
dict:       O(1) insert/lookup average
set:        O(1) insert/lookup average
heapq:      O(log n) push/pop, O(1) min peek
deque:      O(1) both ends, O(n) middle
sorted list: O(n) insert, O(log n) search (use bisect)

# Sorting keys
sorted(items, key=len)                     # by length
sorted(items, key=lambda x: -x)           # descending
sorted(items, key=lambda x: (x[1], x[0])) # by 2nd, then 1st
sorted(items, key=lambda x: x.lower())    # case insensitive

# Common imports
from collections import Counter, defaultdict, deque, OrderedDict
from heapq import heappush, heappop, heapify, nlargest, nsmallest, heapreplace
from bisect import bisect_left, bisect_right, insort
from itertools import product, permutations, combinations, chain, accumulate, groupby
from functools import cache, lru_cache, reduce, cmp_to_key, partial
from math import gcd, lcm, isqrt, comb, perm, inf, log2, ceil, floor
import sys

# Template header for CP
import sys
from collections import *
from heapq import *
from bisect import *
from itertools import *
from functools import cache
from math import gcd, lcm, isqrt, comb, inf
input = sys.stdin.readline
MOD = 10**9 + 7
INF = float('inf')
```
