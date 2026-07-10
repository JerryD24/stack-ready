# Competitive Programming — Tricks, Shortcuts & Templates
### Java Edition | For Interviews + CP Contests

---

## TABLE OF CONTENTS
1. [Fast I/O in Java](#1-fast-io-in-java)
2. [Bit Manipulation](#2-bit-manipulation)
3. [Math & Number Theory](#3-math--number-theory)
4. [String Tricks](#4-string-tricks)
5. [Array & Collection Tricks](#5-array--collection-tricks)
6. [Two Pointers & Sliding Window Templates](#6-two-pointers--sliding-window-templates)
7. [Binary Search Templates](#7-binary-search-templates)
8. [Dynamic Programming Templates](#8-dynamic-programming-templates)
9. [Graph Templates](#9-graph-templates)
10. [Java-Specific Tricks](#10-java-specific-tricks)
11. [Problem Recognition Cheat Sheet](#11-problem-recognition-cheat-sheet)
12. [Common Mistakes to Avoid](#12-common-mistakes-to-avoid)
13. [Real Interview Problem Templates](#13-real-interview-problem-templates)
14. [Tough Interview Q&A Bank](#14-tough-interview-qa-bank)

---

## 1. Fast I/O in Java

```java
import java.io.*;
import java.util.*;

// Standard fast I/O template for competitive programming
public class Main {
    static BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    static PrintWriter out = new PrintWriter(new BufferedOutputStream(System.out));
    static StringTokenizer st;

    static int nextInt() throws IOException {
        while (st == null || !st.hasMoreTokens())
            st = new StringTokenizer(br.readLine());
        return Integer.parseInt(st.nextToken());
    }

    static long nextLong() throws IOException {
        while (st == null || !st.hasMoreTokens())
            st = new StringTokenizer(br.readLine());
        return Long.parseLong(st.nextToken());
    }

    static String nextToken() throws IOException {
        while (st == null || !st.hasMoreTokens())
            st = new StringTokenizer(br.readLine());
        return st.nextToken();
    }

    public static void main(String[] args) throws IOException {
        int n = nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = nextInt();

        // Use out.println() instead of System.out.println()
        out.println(arr[0]);
        out.flush();  // IMPORTANT: flush at end
    }
}

// Why? Scanner is ~10x slower than BufferedReader for large inputs
// System.out.println() flushes every time → slow
// out.println() + single flush at end → fast
```

---

## 2. Bit Manipulation

**Theory.** Bit manipulation treats an integer as a fixed array of 32 (or 64) bits and uses the bitwise operators (`&`, `|`, `^`, `~`, `<<`, `>>`) to compute things far faster than arithmetic or loops. It matters in interviews and contests for three reasons: **speed** (each operation is a single CPU instruction), **space** (a bitmask packs up to 32 boolean flags into one int — the basis of bitmask DP and subset enumeration), and a family of **classic identities** you'll be expected to recognize — XOR to cancel duplicate values, `n & (n-1)` to drop the lowest set bit, and `n & -n` to isolate it. Also know the JDK built-ins so you don't reinvent them: `Integer.bitCount`, `highestOneBit`, `numberOfTrailingZeros`.

### The Essential Bit Tricks
```java
// Check if bit i is set
boolean isBitSet(int n, int i) { return (n & (1 << i)) != 0; }

// Set bit i
int setBit(int n, int i) { return n | (1 << i); }

// Unset bit i
int unsetBit(int n, int i) { return n & ~(1 << i); }

// Toggle bit i
int toggleBit(int n, int i) { return n ^ (1 << i); }

// Get rightmost set bit
int rightmostSetBit(int n) { return n & (-n); }  // also n & (~n + 1)

// Clear rightmost set bit
int clearRightmostBit(int n) { return n & (n - 1); }

// Check if power of 2
boolean isPowerOf2(int n) { return n > 0 && (n & (n - 1)) == 0; }

// Count set bits (Brian Kernighan's algorithm)
int countSetBits(int n) {
    int count = 0;
    while (n != 0) { n &= (n - 1); count++; }  // clears rightmost bit each iteration
    return count;
}
// Or: Integer.bitCount(n)  — built-in, use in interviews!

// Check if number is even
boolean isEven(int n) { return (n & 1) == 0; }

// Swap two numbers without temp
void swap(int a, int b) { a ^= b; b ^= a; a ^= b; }

// Absolute value without branching
int abs(int n) { int mask = n >> 31; return (n + mask) ^ mask; }

// Multiply by 2^k
int multiplyByPow2(int n, int k) { return n << k; }

// Divide by 2^k (integer)
int divideByPow2(int n, int k) { return n >> k; }

// Round down to nearest power of 2
int floorPow2(int n) {
    n |= (n >> 1); n |= (n >> 2); n |= (n >> 4);
    n |= (n >> 8); n |= (n >> 16);
    return n - (n >> 1);
}

// Round up to nearest power of 2
int ceilPow2(int n) {
    n--;
    n |= (n >> 1); n |= (n >> 2); n |= (n >> 4);
    n |= (n >> 8); n |= (n >> 16);
    return n + 1;
}
```

### XOR Tricks
```java
// XOR properties:
// a ^ a = 0 (any number XOR itself = 0)
// a ^ 0 = a (any number XOR 0 = itself)
// XOR is commutative and associative

// Find the single non-duplicate element
int singleNumber(int[] nums) {
    int result = 0;
    for (int n : nums) result ^= n;
    return result;
}

// Find two non-duplicate elements
int[] singleNumberIII(int[] nums) {
    int xor = 0;
    for (int n : nums) xor ^= n;  // xor = a ^ b
    int bit = xor & (-xor);       // rightmost differing bit between a and b
    int a = 0;
    for (int n : nums) if ((n & bit) != 0) a ^= n;
    return new int[]{a, xor ^ a};
}

// Missing number (0 to n, one missing)
int missingNumber(int[] nums) {
    int result = nums.length;
    for (int i = 0; i < nums.length; i++) result ^= i ^ nums[i];
    return result;
}

// Reverse bits of a 32-bit integer
int reverseBits(int n) {
    int result = 0;
    for (int i = 0; i < 32; i++) {
        result <<= 1;
        result |= (n & 1);
        n >>= 1;
    }
    return result;
}
```

### Subset Generation with Bits
```java
// Generate all subsets of array using bitmask
void generateSubsets(int[] arr) {
    int n = arr.length;
    for (int mask = 0; mask < (1 << n); mask++) {
        List<Integer> subset = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if ((mask & (1 << i)) != 0) subset.add(arr[i]);
        }
        System.out.println(subset);
    }
}

// Iterate over all submasks of a bitmask
for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {
    // process submask 'sub'
    // Note: this doesn't include the empty mask
}
```

---

## 3. Math & Number Theory

### GCD, LCM
```java
// GCD — Euclidean algorithm
int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }

// LCM (be careful of overflow with int!)
long lcm(long a, long b) { return a / gcd(a, b) * b; }  // divide before multiply

// Java built-in (Java 5+)
import java.math.BigInteger;
BigInteger.valueOf(12).gcd(BigInteger.valueOf(8));  // = 4
```

### Modular Arithmetic
```java
// CRITICAL: use modular arithmetic to avoid overflow
// (a + b) % m == ((a % m) + (b % m)) % m
// (a * b) % m == ((a % m) * (b % m)) % m
// (a - b) % m == ((a % m) - (b % m) + m) % m  // +m to avoid negative
// (a / b) % m == (a * modInverse(b, m)) % m

static final int MOD = 1_000_000_007;

long add(long a, long b) { return (a + b) % MOD; }
long mul(long a, long b) { return (a % MOD) * (b % MOD) % MOD; }
long sub(long a, long b) { return ((a - b) % MOD + MOD) % MOD; }

// Fast Modular Exponentiation: a^b % mod
long power(long base, long exp, long mod) {
    long result = 1;
    base %= mod;
    while (exp > 0) {
        if ((exp & 1) == 1) result = result * base % mod;
        base = base * base % mod;
        exp >>= 1;
    }
    return result;
}

// Modular Inverse (using Fermat's little theorem, mod must be prime)
// a^(-1) ≡ a^(mod-2) (mod mod)
long modInverse(long a, long mod) { return power(a, mod - 2, mod); }

// Modular division
long divide(long a, long b, long mod) { return mul(a, modInverse(b, mod)); }
```

### Prime Numbers
```java
// Sieve of Eratosthenes — O(n log log n)
boolean[] sieve(int n) {
    boolean[] isPrime = new boolean[n + 1];
    Arrays.fill(isPrime, true);
    isPrime[0] = isPrime[1] = false;
    for (int i = 2; i * i <= n; i++) {
        if (isPrime[i]) {
            for (int j = i * i; j <= n; j += i) {
                isPrime[j] = false;
            }
        }
    }
    return isPrime;
}

// Smallest Prime Factor sieve (for fast factorization)
int[] spf(int n) {
    int[] spf = new int[n + 1];
    for (int i = 0; i <= n; i++) spf[i] = i;
    for (int i = 2; i * i <= n; i++) {
        if (spf[i] == i) {  // i is prime
            for (int j = i * i; j <= n; j += i) {
                if (spf[j] == j) spf[j] = i;
            }
        }
    }
    return spf;
}

// Factorize n using spf in O(log n)
List<Integer> factorize(int n, int[] spf) {
    List<Integer> factors = new ArrayList<>();
    while (n > 1) { factors.add(spf[n]); n /= spf[n]; }
    return factors;
}

// Is prime? O(sqrt(n))
boolean isPrime(long n) {
    if (n < 2) return false;
    if (n == 2 || n == 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;
    for (long i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false;
    }
    return true;
}
```

### Combinations & Permutations
```java
// nCr with modular inverse (precompute factorials)
long[] fact = new long[MAX];
long[] inv_fact = new long[MAX];

void precompute() {
    fact[0] = 1;
    for (int i = 1; i < MAX; i++) fact[i] = fact[i-1] * i % MOD;
    inv_fact[MAX-1] = power(fact[MAX-1], MOD-2, MOD);
    for (int i = MAX-2; i >= 0; i--) inv_fact[i] = inv_fact[i+1] * (i+1) % MOD;
}

long nCr(int n, int r) {
    if (r < 0 || r > n) return 0;
    return fact[n] * inv_fact[r] % MOD * inv_fact[n-r] % MOD;
}

// Pascal's Triangle (small n)
long[][] pascalTriangle(int n) {
    long[][] C = new long[n+1][n+1];
    for (int i = 0; i <= n; i++) {
        C[i][0] = 1;
        for (int j = 1; j <= i; j++) C[i][j] = C[i-1][j-1] + C[i-1][j];
    }
    return C;
}
```

---

## 4. String Tricks

```java
// Reverse a string
String reversed = new StringBuilder(str).reverse().toString();

// Check anagram
boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] count = new int[26];
    for (char c : s.toCharArray()) count[c - 'a']++;
    for (char c : t.toCharArray()) if (--count[c - 'a'] < 0) return false;
    return true;
}

// Sort characters of string
String sortChars(String s) {
    char[] arr = s.toCharArray();
    Arrays.sort(arr);
    return new String(arr);
}

// Check all permutations in O(n) using sliding window + frequency array
boolean checkInclusion(String p, String s) {
    int[] need = new int[26], window = new int[26];
    for (char c : p.toCharArray()) need[c - 'a']++;
    int have = 0, required = (int) IntStream.range(0, 26).filter(i -> need[i] > 0).count();
    int left = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        window[c - 'a']++;
        if (need[c - 'a'] > 0 && window[c - 'a'] == need[c - 'a']) have++;
        if (right - left + 1 == p.length()) {
            if (have == required) return true;
            char lc = s.charAt(left++);
            if (need[lc - 'a'] > 0 && window[lc - 'a'] == need[lc - 'a']) have--;
            window[lc - 'a']--;
        }
    }
    return false;
}

// KMP — pattern matching O(n + m)
int[] buildKMPTable(String pattern) {
    int m = pattern.length();
    int[] lps = new int[m];  // longest proper prefix which is also suffix
    int len = 0, i = 1;
    while (i < m) {
        if (pattern.charAt(i) == pattern.charAt(len)) { lps[i++] = ++len; }
        else if (len != 0) { len = lps[len - 1]; }
        else { lps[i++] = 0; }
    }
    return lps;
}

List<Integer> kmpSearch(String text, String pattern) {
    int[] lps = buildKMPTable(pattern);
    List<Integer> matches = new ArrayList<>();
    int i = 0, j = 0;
    while (i < text.length()) {
        if (text.charAt(i) == pattern.charAt(j)) { i++; j++; }
        if (j == pattern.length()) { matches.add(i - j); j = lps[j - 1]; }
        else if (i < text.length() && text.charAt(i) != pattern.charAt(j)) {
            if (j != 0) j = lps[j - 1]; else i++;
        }
    }
    return matches;
}

// Count characters frequency
int[] freq(String s) {
    int[] f = new int[26];
    for (char c : s.toCharArray()) f[c - 'a']++;
    return f;
}

// Split and join
String[] parts = "a,b,c".split(",");          // ["a", "b", "c"]
String joined = String.join("-", "a","b","c"); // "a-b-c"
String joinedList = String.join(", ", parts);  // "a, b, c"
```

---

## 5. Array & Collection Tricks

```java
// Sort array in descending order
Integer[] arr = {3, 1, 4, 1, 5};
Arrays.sort(arr, Comparator.reverseOrder());  // only works with Integer[], not int[]

// Sort int[] descending
int[] arr2 = {3, 1, 4};
// Method 1: sort then reverse
Arrays.sort(arr2);
for (int i = 0, j = arr2.length-1; i < j; i++, j--) {
    int tmp = arr2[i]; arr2[i] = arr2[j]; arr2[j] = tmp;
}
// Method 2: use IntStream
int[] sorted = IntStream.of(arr2).boxed()
    .sorted(Comparator.reverseOrder())
    .mapToInt(Integer::intValue).toArray();

// Copy array
int[] copy = Arrays.copyOf(arr2, arr2.length);
int[] range = Arrays.copyOfRange(arr2, 1, 3);  // indices 1 to 2

// Fill array
Arrays.fill(arr2, -1);

// 2D array sort by column
int[][] matrix = {{3, 1}, {1, 4}, {2, 2}};
Arrays.sort(matrix, (a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);

// Frequency map in one line
Map<Integer, Long> freq = Arrays.stream(arr2).boxed()
    .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

// Max/min of array
int max = IntStream.of(arr2).max().getAsInt();
int min = IntStream.of(arr2).min().getAsInt();
int sum = IntStream.of(arr2).sum();

// Collections tricks
Collections.sort(list);
Collections.sort(list, Comparator.reverseOrder());
Collections.reverse(list);
Collections.shuffle(list);
Collections.frequency(list, element);  // count occurrences
Collections.nCopies(5, "hello");       // ["hello", "hello", "hello", "hello", "hello"]
Collections.unmodifiableList(list);    // immutable view
Collections.singletonList(item);       // single element immutable list

// TreeMap tricks for ordered operations
TreeMap<Integer, Integer> treeMap = new TreeMap<>();
treeMap.floorKey(5);   // largest key <= 5
treeMap.ceilingKey(5); // smallest key >= 5
treeMap.lowerKey(5);   // largest key < 5
treeMap.higherKey(5);  // smallest key > 5
treeMap.firstKey();    // smallest key
treeMap.lastKey();     // largest key
treeMap.headMap(5);    // keys < 5
treeMap.tailMap(5);    // keys >= 5

// TreeSet for ordered set operations
TreeSet<Integer> treeSet = new TreeSet<>();
treeSet.floor(5);      // largest element <= 5
treeSet.ceiling(5);    // smallest element >= 5
treeSet.lower(5);      // largest element < 5
treeSet.higher(5);     // smallest element > 5
```

---

## 6. Two Pointers & Sliding Window Templates

```java
// Template 1: Two Pointers (Opposite Ends)
void twoPointers(int[] arr) {
    int left = 0, right = arr.length - 1;
    while (left < right) {
        // process arr[left] and arr[right]
        if (shouldMoveLeft(arr, left, right)) left++;
        else right--;
    }
}

// Template 2: Two Pointers (Same Direction / Fast-Slow)
void fastSlow(int[] arr) {
    int slow = 0;
    for (int fast = 0; fast < arr.length; fast++) {
        if (isValid(arr[fast])) {
            arr[slow++] = arr[fast];  // keep valid elements
        }
    }
    // arr[0..slow-1] contains valid elements
}

// Template 3: Fixed-Size Sliding Window
void fixedWindow(int[] arr, int k) {
    // Initialize first window
    int windowSum = 0;
    for (int i = 0; i < k; i++) windowSum += arr[i];
    int result = windowSum;

    // Slide the window
    for (int i = k; i < arr.length; i++) {
        windowSum += arr[i] - arr[i - k];
        result = Math.max(result, windowSum);
    }
}

// Template 4: Variable-Size Sliding Window (Find minimum window satisfying condition)
void variableWindow(int[] arr) {
    int left = 0;
    // maintain window state
    int result = Integer.MAX_VALUE;

    for (int right = 0; right < arr.length; right++) {
        // Add arr[right] to window

        while (windowIsValid()) {  // shrink from left while valid
            result = Math.min(result, right - left + 1);
            // Remove arr[left] from window
            left++;
        }
    }
}

// Template 5: Variable-Size Sliding Window (Find maximum window satisfying condition)
void variableWindowMax(int[] arr) {
    int left = 0;
    // maintain window state

    for (int right = 0; right < arr.length; right++) {
        // Add arr[right] to window

        if (!windowIsValid()) {  // shrink exactly one from left when invalid
            // Remove arr[left] from window
            left++;
        }
        // Window size right - left + 1 is always the current max valid window
    }
}
```

---

## 7. Binary Search Templates

```java
// Template 1: Standard binary search (exact match)
int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

// Template 2: Find leftmost/first occurrence
int leftmostOccurrence(int[] arr, int target) {
    int left = 0, right = arr.length;
    while (left < right) {  // NOTE: left < right (not <=)
        int mid = left + (right - left) / 2;
        if (arr[mid] < target) left = mid + 1;
        else right = mid;  // could be answer, keep looking left
    }
    return left;  // left == right at end
    // Verify: arr[left] == target? → found. else → not present
}

// Template 3: Find rightmost/last occurrence
int rightmostOccurrence(int[] arr, int target) {
    int left = 0, right = arr.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] <= target) left = mid + 1;  // include mid, keep going right
        else right = mid;
    }
    return left - 1;
    // Verify: arr[left-1] == target? → found. else → not present
}

// Template 4: Binary search on answer space
// "Find minimum X such that condition(X) is true"
int binarySearchOnAnswer(int lo, int hi) {
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (condition(mid)) hi = mid;    // mid could be answer, shrink right
        else lo = mid + 1;
    }
    return lo;
}

// "Find maximum X such that condition(X) is true"
int binarySearchOnAnswerMax(int lo, int hi) {
    while (lo < hi) {
        int mid = lo + (hi - lo + 1) / 2;  // +1 to avoid infinite loop
        if (condition(mid)) lo = mid;    // mid could be answer, expand left
        else hi = mid - 1;
    }
    return lo;
}
```

---

## 8. Dynamic Programming Templates

**Theory.** Every dynamic-programming solution comes down to the same three decisions: define the **state** (what does each index/parameter represent?), write the **transition** (how is a state built from smaller states?), and set the **base cases**. The templates below are the two ways to fill that in. **Top-down** (recursion + a memo cache) is written in the natural order of the problem and is usually easier to reason about. **Bottom-up** (a table filled from the base cases upward) avoids recursion-depth limits and often allows a **space optimization** down to one or two rows. Choose top-down when the recurrence is clearer; choose bottom-up when you need to save memory or stack space.

### Top-Down (Memoization)
```java
// Template: Top-down DP with memoization
Map<String, Long> memo = new HashMap<>();

long solve(/* state params */) {
    String key = stateToString(/* params */);
    if (memo.containsKey(key)) return memo.get(key);

    // Base cases
    if (isBaseCase()) return baseValue;

    // Recursive cases
    long result = /* compute from sub-problems */;
    memo.put(key, result);
    return result;
}

// For int state, use int[] or int[][] array instead of HashMap
int[] dp = new int[MAX];
Arrays.fill(dp, -1);

int solve(int state) {
    if (dp[state] != -1) return dp[state];
    // base cases
    int result = /* subproblems */;
    return dp[state] = result;
}
```

### Bottom-Up (Tabulation)
```java
// 1D DP
int[] dp = new int[n + 1];
dp[0] = /* base case */;
for (int i = 1; i <= n; i++) {
    dp[i] = /* transition using dp[i-1], dp[i-2], etc. */;
}

// 2D DP
int[][] dp = new int[m + 1][n + 1];
// Initialize base cases (row 0 and column 0)
for (int i = 1; i <= m; i++) {
    for (int j = 1; j <= n; j++) {
        dp[i][j] = /* transition using dp[i-1][j], dp[i][j-1], dp[i-1][j-1] */;
    }
}

// Space optimization (if only need previous row)
int[] prev = new int[n + 1], curr = new int[n + 1];
for (int i = 1; i <= m; i++) {
    for (int j = 1; j <= n; j++) {
        curr[j] = /* transition using prev[j], curr[j-1], prev[j-1] */;
    }
    int[] tmp = prev; prev = curr; curr = tmp;  // swap
    Arrays.fill(curr, 0);
}
```

### DP Common Patterns
```java
// Knapsack variants:
// 0/1 Knapsack: items can be taken at most once → iterate weight in REVERSE
// Unbounded Knapsack: items can be taken multiple times → iterate weight FORWARD
// Group Knapsack: pick at most one from each group

// Interval DP pattern:
for (int len = 2; len <= n; len++) {           // length of interval
    for (int l = 0; l + len - 1 < n; l++) {   // left boundary
        int r = l + len - 1;                   // right boundary
        for (int k = l; k < r; k++) {          // split point
            dp[l][r] = Math.max(dp[l][r], dp[l][k] + dp[k+1][r] + /* cost */);
        }
    }
}

// Digit DP skeleton:
// Count numbers in [0, N] with some property
// States: (position, tight, sum/count/last_digit, ...)
int[] digits = getDigits(N);
int[][][] dp = new int[digits.length][2][/* other state */];
// tight=1: current prefix matches N's digits (can't exceed)
// tight=0: already diverged (free to use 0-9)
```

---

## 9. Graph Templates

```java
// Build adjacency list
List<List<Integer>> buildAdj(int n, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] e : edges) {
        adj.get(e[0]).add(e[1]);
        // adj.get(e[1]).add(e[0]);  // uncomment for undirected
    }
    return adj;
}

// DFS recursive
boolean[] visited;
void dfs(List<List<Integer>> adj, int node) {
    visited[node] = true;
    for (int neighbor : adj.get(node)) {
        if (!visited[neighbor]) dfs(adj, neighbor);
    }
}

// BFS
int[] bfs(List<List<Integer>> adj, int src, int n) {
    int[] dist = new int[n];
    Arrays.fill(dist, -1);
    Queue<Integer> queue = new LinkedList<>();
    dist[src] = 0;
    queue.offer(src);
    while (!queue.isEmpty()) {
        int node = queue.poll();
        for (int next : adj.get(node)) {
            if (dist[next] == -1) {
                dist[next] = dist[node] + 1;
                queue.offer(next);
            }
        }
    }
    return dist;
}

// Dijkstra (weighted, non-negative)
int[] dijkstra(List<List<int[]>> adj, int src, int n) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>((a,b) -> a[0]-b[0]);
    pq.offer(new int[]{0, src});
    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], u = curr[1];
        if (d > dist[u]) continue;
        for (int[] e : adj.get(u)) {
            if (dist[u] + e[1] < dist[e[0]]) {
                dist[e[0]] = dist[u] + e[1];
                pq.offer(new int[]{dist[e[0]], e[0]});
            }
        }
    }
    return dist;
}

// Union-Find (DSU)
int[] parent, rank;
void init(int n) {
    parent = new int[n]; rank = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
}
int find(int x) { return parent[x] == x ? x : (parent[x] = find(parent[x])); }
boolean union(int x, int y) {
    x = find(x); y = find(y);
    if (x == y) return false;
    if (rank[x] < rank[y]) { int t = x; x = y; y = t; }
    parent[y] = x;
    if (rank[x] == rank[y]) rank[x]++;
    return true;
}
```

---

## 10. Java-Specific Tricks

### Collections Power Usage
```java
// Deque as Stack (preferred over Stack class)
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);  // addFirst
stack.pop();    // removeFirst
stack.peek();   // peekFirst

// Deque as Queue
Deque<Integer> queue = new ArrayDeque<>();
queue.offer(1); // addLast
queue.poll();   // removeFirst
queue.peek();   // peekFirst

// Deque as Sliding Window Maximum
Deque<Integer> mono = new ArrayDeque<>();  // stores indices, decreasing values
// on add right: while (!mono.isEmpty() && arr[mono.peekLast()] <= arr[i]) mono.pollLast();
// mono.offerLast(i);
// on remove left: if (mono.peekFirst() == leftIdx) mono.pollFirst();
// max = arr[mono.peekFirst()];

// PriorityQueue with custom key
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] != b[0] ? a[0]-b[0] : a[1]-b[1]);

// Combine multiple sort criteria
Comparator<int[]> cmp = Comparator.comparingInt((int[] a) -> a[0])
    .thenComparingInt(a -> a[1])
    .reversed();

// computeIfAbsent for multi-map
Map<String, List<Integer>> multiMap = new HashMap<>();
multiMap.computeIfAbsent("key", k -> new ArrayList<>()).add(1);

// merge for counting/accumulating
Map<String, Integer> count = new HashMap<>();
count.merge("key", 1, Integer::sum);  // add 1 to existing or set to 1

// getOrDefault
int val = map.getOrDefault(key, 0);
```

### Integer/Long Tricks
```java
Integer.MAX_VALUE   // 2^31 - 1 = 2,147,483,647
Integer.MIN_VALUE   // -2^31 = -2,147,483,648
Long.MAX_VALUE      // 2^63 - 1
Long.MIN_VALUE      // -2^63

Integer.toBinaryString(n)   // "1010"
Integer.toHexString(n)      // "a"
Integer.toOctalString(n)    // "12"
Integer.parseInt("1010", 2) // parse binary string to int
Integer.parseInt("ff", 16)  // parse hex string to int

Integer.bitCount(n)         // count set bits
Integer.highestOneBit(n)    // highest bit set (power of 2 <= n)
Integer.numberOfLeadingZeros(n)
Integer.numberOfTrailingZeros(n)
Integer.reverse(n)          // reverse bits
Integer.reverseBytes(n)     // reverse bytes

Math.max(a, b)
Math.min(a, b)
Math.abs(n)
Math.pow(2, 10)             // 1024.0 (returns double)
Math.sqrt(n)
Math.log(n)                 // natural log
Math.log10(n)
Math.floor(3.7)             // 3.0
Math.ceil(3.2)              // 4.0
Math.round(3.5)             // 4
```

### String Conversion Tricks
```java
// int to String
String s = String.valueOf(42);
String s = Integer.toString(42);
String s = "" + 42;  // works but not preferred

// String to int
int n = Integer.parseInt("42");
int n = Integer.parseInt("-42");

// char to int (value)
int n = '5' - '0';  // = 5
int n = 'A' - 'A';  // = 0
int n = 'z' - 'a';  // = 25

// char to lowercase/uppercase
char c = Character.toLowerCase('A');  // 'a'
char c = Character.toUpperCase('a');  // 'A'

// Check character type
Character.isDigit('5')        // true
Character.isLetter('A')       // true
Character.isLetterOrDigit('5') // true
Character.isWhitespace(' ')   // true
Character.isUpperCase('A')    // true
Character.isLowerCase('a')    // true

// int[] to List<Integer>
List<Integer> list = Arrays.stream(arr).boxed().collect(Collectors.toList());

// List<Integer> to int[]
int[] arr = list.stream().mapToInt(Integer::intValue).toArray();
```

---

## 11. Problem Recognition Cheat Sheet

### Look for These Keywords → Use This Approach

| Keywords in Problem | Approach |
|--------------------|----------|
| "Subarray with max/min sum" | Sliding Window / Kadane's |
| "Two numbers that sum to target" | Two Pointers (sorted) / HashMap |
| "K closest elements / Kth largest" | Heap (Priority Queue) |
| "All subsets / all combinations" | Backtracking / Bitmask |
| "All permutations" | Backtracking |
| "Shortest path / minimum hops" | BFS |
| "Longest path in DAG" | Topological Sort + DP |
| "Minimum spanning tree" | Kruskal's (sort edges) / Prim's |
| "Connected components / cycle detection" | Union-Find / DFS |
| "Count distinct / frequency" | HashMap |
| "Range sum query" | Prefix Sum / Segment Tree |
| "Prefix matching / autocomplete" | Trie |
| "Overlapping intervals" | Sort + Greedy / Stack |
| "Matrix path / islands" | DFS/BFS on grid |
| "Minimum cost / optimal choice at each step" | Greedy |
| "Minimize/maximize with overlapping subproblems" | Dynamic Programming |
| "Count ways / number of paths" | DP |
| "Find element in sorted array" | Binary Search |
| "Next greater element" | Monotonic Stack |
| "Sliding window maximum" | Monotonic Deque |
| "Top K frequent / K smallest" | Heap / QuickSelect |
| "Parentheses matching / valid sequence" | Stack |
| "Single non-duplicate / XOR problems" | Bit Manipulation |
| "Expression evaluation / calculator" | Stack |

### Complexity-Based Selection
```
n ≤ 20      → O(2^n) or O(n!) → Bitmask DP or Backtracking
n ≤ 100     → O(n³) → Floyd-Warshall, Interval DP
n ≤ 1000    → O(n²) → Nested loops, simple DP
n ≤ 10^5    → O(n log n) → Sort, Merge sort, Heap, Binary Search
n ≤ 10^6    → O(n) → Single pass, Hashing, Linear DP
n ≤ 10^9    → O(log n) → Binary Search, Math
n ≤ 10^18   → O(log n) → Modular exponentiation
```

---

## 12. Common Mistakes to Avoid

```java
// 1. INTEGER OVERFLOW
int a = 100000, b = 100000;
int wrong = a * b;        // OVERFLOW! (10^10 > Integer.MAX_VALUE)
long right = (long) a * b; // Correct: cast before multiplication

// 2. ARRAY INDEX OUT OF BOUNDS
// Always check: 0 <= index < arr.length
// For 2D: 0 <= r < rows && 0 <= c < cols

// 3. EMPTY COLLECTION
PriorityQueue<Integer> pq = new PriorityQueue<>();
pq.peek(); // returns null on empty (OK)
pq.poll(); // returns null on empty (OK)
pq.element(); // THROWS NoSuchElementException
pq.remove(); // THROWS NoSuchElementException

// 4. MODIFYING COLLECTION WHILE ITERATING
// Use Iterator.remove() or collect indices first, then remove

// 5. WRONG MID CALCULATION
int wrong_mid = (left + right) / 2;  // can OVERFLOW if left+right > Integer.MAX_VALUE
int right_mid = left + (right - left) / 2;  // always safe

// 6. INFINITE LOOP IN BINARY SEARCH
// Ensure: left or right always moves
// Template: left < right with right = mid (not mid-1) → use mid = (left+right+1)/2
// to avoid infinite loop when left+1 == right

// 7. STRING COMPARISON
String s1 = "hello";
if (s1 == "hello") { }      // WRONG: compares references
if (s1.equals("hello")) { } // CORRECT: compares content

// 8. NULL POINTER EXCEPTION
Map<String, Integer> map = new HashMap<>();
int val = map.get("key");              // NPE if key not present → returns null → unboxing fails
int val = map.getOrDefault("key", 0); // Safe

// 9. NOT RESETTING STATE IN BACKTRACKING
void backtrack(List<Integer> curr) {
    curr.add(x);
    backtrack(curr);
    curr.remove(curr.size() - 1); // MUST undo — if you forget, result is wrong
}

// 10. FORGETTING DISCONNECTED COMPONENTS IN GRAPH
// Always loop over all nodes, not just from node 0
for (int i = 0; i < n; i++) {
    if (!visited[i]) dfs(adj, i);  // handles disconnected components
}

// 11. STACK OVERFLOW FOR DEEP RECURSION
// Java default stack ~512KB → ~5000-10000 recursive calls
// For large n: convert recursion to iteration with explicit stack
// Or: increase stack size (not possible in most online judges)

// 12. LONG vs INT
// Use long for: products, sums over large arrays, distances in 2D
// Distances: long dist = (long)(x2-x1)*(x2-x1) + (long)(y2-y1)*(y2-y1)

// 13. COMPARATOR INTEGER SUBTRACTION OVERFLOW
// WRONG: (a, b) -> a - b  // if a is MIN_VALUE and b > 0 → overflow!
// RIGHT: (a, b) -> Integer.compare(a, b)
// RIGHT: Comparator.comparingInt(...)

// 14. MODULO WITH NEGATIVE NUMBERS
int mod = 1_000_000_007;
int wrong = (-5) % mod;          // -5 in Java (not positive!)
int right = ((-5) % mod + mod) % mod;  // always positive
```

---

## QUICK REFERENCE CARD

```
HashMap operations: O(1) average
TreeMap operations: O(log n)
PriorityQueue offer/poll: O(log n), peek: O(1)
ArrayDeque push/pop/peek: O(1)
Sorting: O(n log n)
Binary Search: O(log n)

Key formulas:
  Combinations C(n,r) = n! / (r! * (n-r)!)
  Permutations P(n,r) = n! / (n-r)!
  Sum of 1 to n = n*(n+1)/2
  Sum of squares = n*(n+1)*(2n+1)/6

Bit tricks:
  n & 1 → last bit (odd/even)
  n >> 1 → divide by 2
  n << 1 → multiply by 2
  n & (n-1) → clear lowest set bit
  n & (-n) → isolate lowest set bit
  n ^ n = 0, n ^ 0 = n

Modular:
  MOD = 1_000_000_007  (prime)
  Always: (a * b) % MOD, never just a*b

Java imports for CP:
  import java.util.*;
  import java.io.*;
  import java.util.stream.*;
```

---

## 13. Real Interview Problem Templates

### 13.1 Valid Sudoku — One-Liner Set Trick

```java
boolean valid = IntStream.range(0, 81).allMatch(i -> {
    if (board[i/9][i%9] == '.') return true;
    String s = "" + board[i/9][i%9] + i/9 + i%9 + (i/27*3 + i%9/3);
    return seen.add(s);  // HashSet seen — duplicate → false
});
```

### 13.2 Stock Buy/Sell — Template

```java
// Template: running min + max profit
int min = INF, ans = 0;
for (int p : prices) {
    min = Math.min(min, p);
    ans = Math.max(ans, p - min);
}
```

### 13.3 Sliding Window — K Distinct Template

```java
Map<Character, Integer> freq = new HashMap<>();
int left = 0, ans = 0;
for (int right = 0; right < s.length(); right++) {
    freq.merge(s.charAt(right), 1, Integer::sum);
    while (freq.size() > k) {
        char c = s.charAt(left);
        if (freq.merge(c, -1, Integer::sum) == 0) freq.remove(c);
        left++;
    }
    ans = Math.max(ans, right - left + 1);
}
```

### 13.4 Group Anagrams — Key Generation

```java
// Option 1: sort chars — O(k log k) per word
// Option 2: char count signature — O(k) per word
String key = Arrays.toString(count);  // count[26] frequency array
```

### 13.5 Frequency Count — Stream One-Liner

```java
list.stream().collect(Collectors.groupingBy(x -> x, Collectors.counting()))
    .forEach((k, v) -> out.println(k + " -> " + v));
```

### 13.6 Two Pointer — Opposite Ends Template

```java
int l = 0, r = arr.length - 1;
while (l < r) {
    // process arr[l], arr[r]
    if (condition) l++;
    else r--;
}
```

### 13.7 Monotonic Stack — Next Greater Element

```java
Deque<Integer> stack = new ArrayDeque<>();
int[] result = new int[n];
Arrays.fill(result, -1);
for (int i = 0; i < n; i++) {
    while (!stack.isEmpty() && arr[stack.peek()] < arr[i]) {
        result[stack.pop()] = arr[i];
    }
    stack.push(i);
}
```

### 13.8 Binary Search — Lower Bound Template

```java
int lo = 0, hi = n;  // hi = n (not n-1) for lower bound
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid;
}
// lo = first index where arr[lo] >= target
```

### 13.9 PriorityQueue — Top K / Merge K Lists

```java
// Min-heap of size K for Kth largest
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
for (int x : nums) {
    minHeap.offer(x);
    if (minHeap.size() > k) minHeap.poll();
}
// minHeap.peek() = Kth largest
```

### 13.10 Union-Find — Connectivity Template

```java
UnionFind uf = new UnionFind(n);
for (int[] edge : edges) uf.union(edge[0], edge[1]);
return uf.countComponents();  // or detect cycle: union returns false
```

---

## 14. Tough Interview Q&A Bank

**Q: Integer caching trap in Java CP?**
A: `Integer a = 127, b = 127` → `a==b` true. `128, 128` → false. Always use `.equals()` for objects.

**Q: Arrays.asList() — can you remove?**
A: No. Fixed-size backed by array. `add()`/`remove()` throw `UnsupportedOperationException`. Wrap in `new ArrayList<>()`.

**Q: String pool — `new String("x") == "x"`?**
A: false. `new` creates heap object. Literal is in pool. Use `.equals()` or `.intern()`.

**Q: Comparator — why not `(a,b) -> a-b`?**
A: Integer overflow when `a=MIN_VALUE`. Use `Integer.compare(a,b)`.

**Q: How to avoid TLE in Java?**
A: Fast I/O (BufferedReader/PrintWriter), StringBuilder not `+=`, `Arrays.sort` not bubble, right complexity, `HashMap` not nested loops.

**Q: When to use long instead of int?**
A: Products, sums over 10^5 elements, graph distances, modulo arithmetic intermediate values.

**Q: Modulo with negative numbers in Java?**
A: `(-5 % MOD)` is negative. Use `((x % MOD) + MOD) % MOD`.

**Q: Recognize sliding window problem?**
A: Keywords: "longest/shortest subarray/substring", "at most K distinct", "sum ≤ target", contiguous elements.

**Q: Recognize binary search on answer?**
A: "Minimize maximum", "find minimum capacity/speed", monotonic feasibility function.
