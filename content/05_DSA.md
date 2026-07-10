# Data Structures & Algorithms (DSA)
### Complete Guide for Java Backend Developers | Interview Focused

---

## TABLE OF CONTENTS
1. [Complexity Analysis](#1-complexity-analysis)
2. [Arrays & Strings](#2-arrays--strings)
3. [Linked List](#3-linked-list)
4. [Stack & Queue](#4-stack--queue)
5. [Trees & BST](#5-trees--bst)
6. [Heaps](#6-heaps)
7. [Graphs](#7-graphs)
8. [Hashing](#8-hashing)
9. [Sorting Algorithms](#9-sorting-algorithms)
10. [Binary Search](#10-binary-search)
11. [Dynamic Programming](#11-dynamic-programming)
12. [Greedy Algorithms](#12-greedy-algorithms)
13. [Backtracking](#13-backtracking)
14. [Trie](#14-trie)
15. [Union-Find (DSU)](#15-union-find-dsu)
16. [Real Interview Problems (With Solutions)](#16-real-interview-problems-with-solutions)
17. [Tough Interview Q&A Bank](#17-tough-interview-qa-bank)

---

## 1. Complexity Analysis

**Theory — why we measure with Big-O.** We can't compare algorithms by stopwatch (hardware differs), so we count how the number of operations **grows as input size n grows**. Big-O describes the *worst-case upper bound* on that growth — it ignores constants and lower-order terms because they stop mattering as n gets large (O(2n+5) is just O(n)). The goal in interviews is to pick the algorithm whose curve grows slowest for the expected input size: O(log n) and O(n) scale to millions; O(n²) collapses past a few thousand; O(2ⁿ)/O(n!) only work for tiny n. Always state **both time and space** complexity — a fast algorithm that needs O(n) extra memory may be the wrong trade-off. Also know **amortized** cost (e.g., `ArrayList.add` is O(1) on average even though an occasional resize is O(n)).

### Big-O Reference Table
| Algorithm | Best | Average | Worst | Space |
|-----------|------|---------|-------|-------|
| Binary Search | O(1) | O(log n) | O(log n) | O(1) |
| Linear Search | O(1) | O(n) | O(n) | O(1) |
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) |
| DFS/BFS | O(V+E) | O(V+E) | O(V+E) | O(V) |
| Dijkstra | - | O((V+E) log V) | O((V+E) log V) | O(V) |

### Common Complexities
```
O(1)       → Constant: HashMap get, array index
O(log n)   → Logarithmic: Binary Search, balanced BST operations
O(n)       → Linear: Linear search, single loop
O(n log n) → Linearithmic: Merge sort, heap sort, efficient sorting
O(n²)      → Quadratic: Bubble/insertion/selection sort, nested loops
O(2^n)     → Exponential: Subset generation, brute-force recursion
O(n!)      → Factorial: Permutations
```

---

## 2. Arrays & Strings

**Theory.** An array is a **contiguous block of memory**, so element *i* is found by simple address arithmetic (`base + i × size`) — that's why indexing is O(1) and arrays are cache-friendly (neighbours are physically adjacent). The cost is that inserting/deleting in the middle is O(n) because everything after must shift. Most array interview problems are really about **avoiding the naive O(n²) double loop** by exploiting structure. The three patterns below cover the majority:
- **Two pointers** — when data is sorted (or you compare from both ends), move two indices toward/with each other to get O(n) instead of checking all pairs.
- **Sliding window** — for "best/longest/shortest contiguous subarray/substring", grow and shrink a window so each element is visited at most twice → O(n).
- **Prefix sum** — precompute cumulative sums once so any range-sum query is O(1).

### Key Patterns

#### Two Pointers
```java
// Pattern: Two pointers moving toward each other
// Use: sorted arrays, palindromes, pair sum

// Example: Two Sum in sorted array
int[] twoSum(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) return new int[]{left, right};
        else if (sum < target) left++;
        else right--;
    }
    return new int[]{-1, -1};
}

// Example: Valid Palindrome
boolean isPalindrome(String s) {
    int l = 0, r = s.length() - 1;
    while (l < r) {
        while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;
        while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
        if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;
        l++; r--;
    }
    return true;
}

// Example: Container With Most Water
int maxWater(int[] height) {
    int left = 0, right = height.length - 1, max = 0;
    while (left < right) {
        max = Math.max(max, (right - left) * Math.min(height[left], height[right]));
        if (height[left] < height[right]) left++;
        else right--;
    }
    return max;
}
```

#### Sliding Window
```java
// Pattern: Window of fixed or variable size moves through array
// Use: max/min subarray, substring problems, k-distinct characters

// Fixed window: Max sum subarray of size k
int maxSumSubarray(int[] arr, int k) {
    int sum = 0;
    for (int i = 0; i < k; i++) sum += arr[i];
    int max = sum;
    for (int i = k; i < arr.length; i++) {
        sum += arr[i] - arr[i - k];
        max = Math.max(max, sum);
    }
    return max;
}

// Variable window: Longest substring without repeating characters
int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> map = new HashMap<>();
    int max = 0, left = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (map.containsKey(c) && map.get(c) >= left) {
            left = map.get(c) + 1;
        }
        map.put(c, right);
        max = Math.max(max, right - left + 1);
    }
    return max;
}

// Variable window: Minimum window substring
String minWindow(String s, String t) {
    Map<Character, Integer> need = new HashMap<>();
    for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);
    int have = 0, required = need.size();
    int[] result = {-1, 0, 0};
    Map<Character, Integer> window = new HashMap<>();
    int left = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        window.merge(c, 1, Integer::sum);
        if (need.containsKey(c) && window.get(c).equals(need.get(c))) have++;
        while (have == required) {
            if (result[0] == -1 || right - left + 1 < result[0]) {
                result[0] = right - left + 1;
                result[1] = left;
                result[2] = right;
            }
            char lc = s.charAt(left++);
            window.merge(lc, -1, Integer::sum);
            if (need.containsKey(lc) && window.get(lc) < need.get(lc)) have--;
        }
    }
    return result[0] == -1 ? "" : s.substring(result[1], result[2] + 1);
}
```

#### Prefix Sum
```java
// Precompute cumulative sums for O(1) range sum queries
int[] buildPrefixSum(int[] arr) {
    int[] prefix = new int[arr.length + 1];
    for (int i = 0; i < arr.length; i++) {
        prefix[i + 1] = prefix[i] + arr[i];
    }
    return prefix;
}

// Range sum [l, r] (0-indexed, inclusive)
int rangeSum(int[] prefix, int l, int r) {
    return prefix[r + 1] - prefix[l];
}

// Subarray sum equals k
int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1);  // empty prefix
    int count = 0, sum = 0;
    for (int num : nums) {
        sum += num;
        count += prefixCount.getOrDefault(sum - k, 0);
        prefixCount.merge(sum, 1, Integer::sum);
    }
    return count;
}
```

#### Important Array Problems
```java
// Kadane's Algorithm: Maximum subarray sum
int maxSubArray(int[] nums) {
    int maxSum = nums[0], currentSum = nums[0];
    for (int i = 1; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }
    return maxSum;
}

// Trapping Rain Water
int trap(int[] height) {
    int n = height.length;
    int[] leftMax = new int[n], rightMax = new int[n];
    leftMax[0] = height[0];
    for (int i = 1; i < n; i++) leftMax[i] = Math.max(leftMax[i-1], height[i]);
    rightMax[n-1] = height[n-1];
    for (int i = n-2; i >= 0; i--) rightMax[i] = Math.max(rightMax[i+1], height[i]);
    int water = 0;
    for (int i = 0; i < n; i++) water += Math.min(leftMax[i], rightMax[i]) - height[i];
    return water;
}

// Product of Array Except Self (no division)
int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    result[0] = 1;
    for (int i = 1; i < n; i++) result[i] = result[i-1] * nums[i-1];  // prefix products
    int right = 1;
    for (int i = n-1; i >= 0; i--) {
        result[i] *= right;
        right *= nums[i];
    }
    return result;
}

// Next Permutation
void nextPermutation(int[] nums) {
    int i = nums.length - 2;
    while (i >= 0 && nums[i] >= nums[i+1]) i--;  // find first decrease from right
    if (i >= 0) {
        int j = nums.length - 1;
        while (nums[j] <= nums[i]) j--;           // find smallest greater than nums[i]
        swap(nums, i, j);
    }
    reverse(nums, i + 1, nums.length - 1);         // reverse suffix
}
```

---

## 3. Linked List

**Theory.** A linked list stores elements as **nodes**, each holding a value plus a pointer to the next node (and `prev` too in a doubly-linked list). Because nodes are scattered in memory, there's no index arithmetic: reaching the *i*-th element is O(n), but once you hold a node, inserting or deleting is O(1) (just relink pointers). Prefer a linked list over an array when you do many insertions/removals at known positions and rarely need random access. Two techniques solve most interview questions: the **dummy head** node (so you don't special-case the first element when inserting/deleting), and **slow/fast pointers** — advancing one pointer twice as fast as the other to find the middle, detect a cycle (Floyd's algorithm), or locate the *n*-th node from the end in a single pass.

```java
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

// Reverse Linked List (iterative)
ListNode reverse(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}

// Detect Cycle (Floyd's Algorithm)
boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}

// Find Cycle Start
ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            slow = head;
            while (slow != fast) { slow = slow.next; fast = fast.next; }
            return slow;
        }
    }
    return null;
}

// Merge Two Sorted Lists
ListNode mergeTwoLists(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0), curr = dummy;
    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) { curr.next = l1; l1 = l1.next; }
        else { curr.next = l2; l2 = l2.next; }
        curr = curr.next;
    }
    curr.next = (l1 != null) ? l1 : l2;
    return dummy.next;
}

// Find Middle (slow-fast pointers)
ListNode findMiddle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;  // middle (for even, returns second middle)
}

// Remove Nth Node from End
ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode fast = dummy, slow = dummy;
    for (int i = 0; i <= n; i++) fast = fast.next;
    while (fast != null) { slow = slow.next; fast = fast.next; }
    slow.next = slow.next.next;
    return dummy.next;
}

// Palindrome Linked List
boolean isPalindrome(ListNode head) {
    ListNode mid = findMiddle(head);
    ListNode secondHalf = reverse(mid);
    ListNode p1 = head, p2 = secondHalf;
    while (p2 != null) {
        if (p1.val != p2.val) return false;
        p1 = p1.next; p2 = p2.next;
    }
    return true;
}
```

---

## 4. Stack & Queue

**Theory.** A **stack** is LIFO (last-in, first-out) — like a stack of plates; you only touch the top. A **queue** is FIFO (first-in, first-out) — like a line at a counter. Both give O(1) push/pop. Use a stack whenever the problem has **nesting or "undo/most-recent"** semantics: matching brackets, expression evaluation, function call frames, backtracking, and DFS. Use a queue for **level-by-level / first-come processing**: BFS, scheduling, buffering. The **monotonic stack** (keeping elements in increasing or decreasing order) is the key trick for "next greater/smaller element" and histogram problems — it turns an O(n²) scan into O(n) because each index is pushed and popped at most once. In Java use `ArrayDeque` for both (faster than `Stack`/`LinkedList`).

```java
// Monotonic Stack Pattern — key for next greater/smaller element problems

// Next Greater Element
int[] nextGreaterElement(int[] nums) {
    int[] result = new int[nums.length];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();  // stores indices
    for (int i = 0; i < nums.length; i++) {
        while (!stack.isEmpty() && nums[i] > nums[stack.peek()]) {
            result[stack.pop()] = nums[i];
        }
        stack.push(i);
    }
    return result;
}

// Largest Rectangle in Histogram
int largestRectangleArea(int[] heights) {
    Deque<Integer> stack = new ArrayDeque<>();
    int maxArea = 0;
    for (int i = 0; i <= heights.length; i++) {
        int h = (i == heights.length) ? 0 : heights[i];
        while (!stack.isEmpty() && h < heights[stack.peek()]) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, height * width);
        }
        stack.push(i);
    }
    return maxArea;
}

// Implement Stack using Queue
class MyStack {
    Queue<Integer> q = new LinkedList<>();
    void push(int x) {
        q.offer(x);
        for (int i = 0; i < q.size() - 1; i++) q.offer(q.poll());
    }
    int pop() { return q.poll(); }
    int top() { return q.peek(); }
    boolean empty() { return q.isEmpty(); }
}

// Min Stack (O(1) min)
class MinStack {
    Deque<Integer> stack = new ArrayDeque<>();
    Deque<Integer> minStack = new ArrayDeque<>();
    void push(int val) {
        stack.push(val);
        minStack.push(minStack.isEmpty() ? val : Math.min(val, minStack.peek()));
    }
    void pop() { stack.pop(); minStack.pop(); }
    int top() { return stack.peek(); }
    int getMin() { return minStack.peek(); }
}
```

---

## 5. Trees & BST

**Theory.** A tree is a hierarchical structure of nodes with one **root** and no cycles; each node points to its children. A **binary tree** has at most two children per node. A **Binary Search Tree (BST)** adds an ordering invariant: everything in the left subtree is smaller, everything in the right is larger — which makes search/insert/delete O(h) where h is the height (O(log n) when balanced, but O(n) if it degenerates into a linked list, which is why self-balancing trees like Red-Black/AVL exist). Master the **four traversals**: *inorder* (left-root-right — gives sorted order in a BST), *preorder* (root first — good for copying/serializing), *postorder* (children before parent — good for deleting/computing sizes), and *level-order* (BFS with a queue). Most tree problems are solved with **recursion**: solve for the children, then combine — the trick is identifying what each call should return up to its parent (e.g., height, whether it's balanced, the LCA).

```java
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

// Tree Traversals
void inorder(TreeNode root, List<Integer> result) {    // Left, Root, Right
    if (root == null) return;
    inorder(root.left, result);
    result.add(root.val);
    inorder(root.right, result);
}

void preorder(TreeNode root, List<Integer> result) {   // Root, Left, Right
    if (root == null) return;
    result.add(root.val);
    preorder(root.left, result);
    preorder(root.right, result);
}

void postorder(TreeNode root, List<Integer> result) {  // Left, Right, Root
    if (root == null) return;
    postorder(root.left, result);
    postorder(root.right, result);
    result.add(root.val);
}

// Level Order (BFS)
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
    }
    return result;
}

// Height of tree
int height(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(height(root.left), height(root.right));
}

// Diameter of Binary Tree
int diameter = 0;
int diameterOfBinaryTree(TreeNode root) {
    diameter = 0;
    depth(root);
    return diameter;
}
int depth(TreeNode node) {
    if (node == null) return 0;
    int left = depth(node.left), right = depth(node.right);
    diameter = Math.max(diameter, left + right);
    return 1 + Math.max(left, right);
}

// Lowest Common Ancestor (LCA)
TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);
    if (left != null && right != null) return root;  // p and q on different sides
    return left != null ? left : right;
}

// Validate BST
boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}
boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.val <= min || node.val >= max) return false;
    return validate(node.left, min, node.val) && validate(node.right, node.val, max);
}

// BST: kth smallest element
int kthSmallest(TreeNode root, int k) {
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode curr = root;
    while (curr != null || !stack.isEmpty()) {
        while (curr != null) { stack.push(curr); curr = curr.left; }
        curr = stack.pop();
        if (--k == 0) return curr.val;
        curr = curr.right;
    }
    return -1;
}

// Construct tree from inorder and preorder
TreeNode buildTree(int[] preorder, int[] inorder) {
    Map<Integer, Integer> inMap = new HashMap<>();
    for (int i = 0; i < inorder.length; i++) inMap.put(inorder[i], i);
    return build(preorder, 0, preorder.length - 1, 0, inorder.length - 1, inMap);
}
int[] pre;
TreeNode build(int[] pre, int preL, int preR, int inL, int inR, Map<Integer,Integer> inMap) {
    if (preL > preR) return null;
    TreeNode root = new TreeNode(pre[preL]);
    int mid = inMap.get(pre[preL]);
    int leftSize = mid - inL;
    root.left = build(pre, preL+1, preL+leftSize, inL, mid-1, inMap);
    root.right = build(pre, preL+leftSize+1, preR, mid+1, inR, inMap);
    return root;
}
```

---

## 6. Heaps

**Theory.** A heap is a **complete binary tree** (filled left-to-right) kept as a flat array, satisfying the heap property: in a **min-heap** every parent ≤ its children (so the minimum is always at the root); a max-heap is the mirror. It gives O(1) peek of the min/max and O(log n) insert/extract — but it is *not* fully sorted, only the root is guaranteed. Reach for a heap whenever you repeatedly need the "best" element so far: **top-K** problems (keep a min-heap of size k → O(n log k)), merging k sorted lists, scheduling by priority, or running medians (two heaps). Java's `PriorityQueue` is a min-heap by default; pass `Comparator.reverseOrder()` for a max-heap. Building a heap from an existing array is O(n) (`heapify`), cheaper than n inserts.

```java
// Java's PriorityQueue is a min-heap
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());

// Kth Largest Element (min-heap of size k)
int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    for (int num : nums) {
        minHeap.offer(num);
        if (minHeap.size() > k) minHeap.poll();  // remove smallest
    }
    return minHeap.peek();  // top of heap = kth largest
}

// Top K Frequent Elements
int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int n : nums) freq.merge(n, 1, Integer::sum);

    PriorityQueue<Map.Entry<Integer,Integer>> minHeap =
        new PriorityQueue<>(Comparator.comparingInt(Map.Entry::getValue));

    for (var entry : freq.entrySet()) {
        minHeap.offer(entry);
        if (minHeap.size() > k) minHeap.poll();
    }
    return minHeap.stream().mapToInt(Map.Entry::getKey).toArray();
}

// Merge K Sorted Arrays
int[] mergeKSortedArrays(int[][] arrays) {
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    // [value, arrayIndex, elementIndex]
    for (int i = 0; i < arrays.length; i++) {
        if (arrays[i].length > 0) pq.offer(new int[]{arrays[i][0], i, 0});
    }
    List<Integer> result = new ArrayList<>();
    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        result.add(curr[0]);
        int ai = curr[1], ei = curr[2];
        if (ei + 1 < arrays[ai].length) {
            pq.offer(new int[]{arrays[ai][ei+1], ai, ei+1});
        }
    }
    return result.stream().mapToInt(Integer::intValue).toArray();
}

// Find Median from Data Stream (two heaps)
class MedianFinder {
    PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder()); // lower half
    PriorityQueue<Integer> minHeap = new PriorityQueue<>(); // upper half

    void addNum(int num) {
        maxHeap.offer(num);
        minHeap.offer(maxHeap.poll());
        if (maxHeap.size() < minHeap.size()) maxHeap.offer(minHeap.poll());
    }

    double findMedian() {
        return maxHeap.size() > minHeap.size()
            ? maxHeap.peek()
            : (maxHeap.peek() + minHeap.peek()) / 2.0;
    }
}
```

---

## 7. Graphs

**Theory.** A graph is a set of **vertices** connected by **edges**; it generalizes trees (a tree is just an acyclic connected graph). Edges may be *directed* or *undirected*, *weighted* or not. Representation matters: an **adjacency list** (`Map<node, neighbors>`) is the default — O(V+E) space, efficient for sparse graphs; an adjacency matrix is O(V²) but gives O(1) edge lookup. The two core traversals are **BFS** (queue, explores level by level → gives the shortest path in *unweighted* graphs) and **DFS** (stack/recursion → natural for cycle detection, topological sort, connected components). Build up from there: **Dijkstra** (BFS + a priority queue) for shortest paths with non-negative weights; **topological sort** (Kahn's indegree method or DFS) for ordering dependencies in a DAG; **Union-Find** for connectivity/cycle questions in undirected graphs. Recognising "this is a graph problem" (grid cells, dependencies, networks) is half the battle.

```java
// Adjacency List representation
Map<Integer, List<Integer>> graph = new HashMap<>();

// BFS — shortest path in unweighted graph
int[] bfs(Map<Integer, List<Integer>> graph, int start) {
    int n = graph.size();
    int[] dist = new int[n];
    Arrays.fill(dist, -1);
    Queue<Integer> queue = new LinkedList<>();
    queue.offer(start);
    dist[start] = 0;
    while (!queue.isEmpty()) {
        int node = queue.poll();
        for (int neighbor : graph.getOrDefault(node, List.of())) {
            if (dist[neighbor] == -1) {
                dist[neighbor] = dist[node] + 1;
                queue.offer(neighbor);
            }
        }
    }
    return dist;
}

// DFS — iterative
void dfs(Map<Integer, List<Integer>> graph, int start) {
    Set<Integer> visited = new HashSet<>();
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(start);
    while (!stack.isEmpty()) {
        int node = stack.pop();
        if (visited.contains(node)) continue;
        visited.add(node);
        // process node
        for (int neighbor : graph.getOrDefault(node, List.of())) {
            if (!visited.contains(neighbor)) stack.push(neighbor);
        }
    }
}

// Topological Sort (Kahn's Algorithm — BFS)
List<Integer> topologicalSort(int n, int[][] edges) {
    int[] indegree = new int[n];
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] edge : edges) {
        adj.get(edge[0]).add(edge[1]);
        indegree[edge[1]]++;
    }
    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < n; i++) if (indegree[i] == 0) queue.offer(i);
    List<Integer> result = new ArrayList<>();
    while (!queue.isEmpty()) {
        int node = queue.poll();
        result.add(node);
        for (int next : adj.get(node)) {
            if (--indegree[next] == 0) queue.offer(next);
        }
    }
    return result.size() == n ? result : new ArrayList<>();  // empty = cycle exists
}

// Detect Cycle in Directed Graph (DFS)
boolean hasCycle(int n, int[][] edges) {
    List<List<Integer>> adj = buildAdj(n, edges);
    int[] color = new int[n]; // 0=white, 1=gray(in progress), 2=black(done)
    for (int i = 0; i < n; i++) {
        if (color[i] == 0 && dfsHasCycle(adj, i, color)) return true;
    }
    return false;
}
boolean dfsHasCycle(List<List<Integer>> adj, int node, int[] color) {
    color[node] = 1;
    for (int neighbor : adj.get(node)) {
        if (color[neighbor] == 1) return true;  // back edge = cycle
        if (color[neighbor] == 0 && dfsHasCycle(adj, neighbor, color)) return true;
    }
    color[node] = 2;
    return false;
}

// Dijkstra's Shortest Path
int[] dijkstra(int n, int[][] edges, int src) {
    Map<Integer, List<int[]>> adj = new HashMap<>();
    for (int[] e : edges) {
        adj.computeIfAbsent(e[0], k -> new ArrayList<>()).add(new int[]{e[1], e[2]});
        adj.computeIfAbsent(e[1], k -> new ArrayList<>()).add(new int[]{e[0], e[2]});
    }
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>((a,b) -> a[0] - b[0]);  // [dist, node]
    pq.offer(new int[]{0, src});
    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], node = curr[1];
        if (d > dist[node]) continue;  // stale entry
        for (int[] neighbor : adj.getOrDefault(node, List.of())) {
            int newDist = dist[node] + neighbor[1];
            if (newDist < dist[neighbor[0]]) {
                dist[neighbor[0]] = newDist;
                pq.offer(new int[]{newDist, neighbor[0]});
            }
        }
    }
    return dist;
}

// Number of Islands (DFS/BFS flood fill)
int numIslands(char[][] grid) {
    int count = 0;
    for (int i = 0; i < grid.length; i++) {
        for (int j = 0; j < grid[0].length; j++) {
            if (grid[i][j] == '1') {
                dfsFlood(grid, i, j);
                count++;
            }
        }
    }
    return count;
}
void dfsFlood(char[][] grid, int r, int c) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] != '1') return;
    grid[r][c] = '0';  // mark visited
    dfsFlood(grid, r+1, c); dfsFlood(grid, r-1, c);
    dfsFlood(grid, r, c+1); dfsFlood(grid, r, c-1);
}

// Kruskal's MST (Minimum Spanning Tree)
int minimumSpanningTree(int n, int[][] edges) {
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);  // sort by weight
    int[] parent = new int[n];
    int[] rank = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;

    int totalWeight = 0, edgesUsed = 0;
    for (int[] edge : edges) {
        int p = find(parent, edge[0]);
        int q = find(parent, edge[1]);
        if (p != q) {
            union(parent, rank, p, q);
            totalWeight += edge[2];
            if (++edgesUsed == n - 1) break;
        }
    }
    return edgesUsed == n - 1 ? totalWeight : -1;
}
```

---

## 8. Hashing

**Theory.** A hash table stores key→value pairs in an array, using a **hash function** to convert each key into an array index. This gives **O(1) average** insert/lookup/delete — the single most useful trick in interviews for trading space to save time. Collisions (two keys hashing to the same bucket) are handled by chaining (a list per bucket) or open addressing; Java 8+ converts long chains into balanced trees, so worst case is O(log n). The mental pattern: whenever a brute-force solution does "for each element, search the rest" (O(n²)), ask **"can I remember what I've seen in a HashMap/HashSet?"** — that usually collapses it to O(n) (e.g., Two Sum, longest consecutive sequence, anagram grouping, frequency counts). Caveat: a custom key class must override **both** `equals()` and `hashCode()` consistently, and keys must be immutable.

```java
// Common patterns

// Two Sum
int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (map.containsKey(complement)) return new int[]{map.get(complement), i};
        map.put(nums[i], i);
    }
    return new int[]{};
}

// Group Anagrams
List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> map = new HashMap<>();
    for (String s : strs) {
        char[] arr = s.toCharArray();
        Arrays.sort(arr);
        String key = new String(arr);
        map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(map.values());
}

// Longest Consecutive Sequence
int longestConsecutive(int[] nums) {
    Set<Integer> set = new HashSet<>();
    for (int n : nums) set.add(n);
    int longest = 0;
    for (int n : set) {
        if (!set.contains(n - 1)) {  // start of sequence
            int len = 1;
            while (set.contains(n + len)) len++;
            longest = Math.max(longest, len);
        }
    }
    return longest;
}
```

---

## 9. Sorting Algorithms

**Theory.** Sorting is the warm-up step for countless problems (it enables two pointers, binary search, greedy, and dedup). Comparison-based sorts cannot beat **O(n log n)** in the worst case. Know the trade-offs: **Merge sort** is always O(n log n) and **stable** (keeps equal elements in original order) but needs O(n) extra memory — it's how Java sorts objects (`Arrays.sort` on `Object[]`/`Collections.sort`). **Quick sort** is O(n log n) average, in-place, and cache-friendly, but degrades to O(n²) on bad pivots — it's how Java sorts primitives (a dual-pivot variant). **Heap sort** is O(n log n) in-place but not stable. When the input is special — small integer range — a non-comparison **counting/radix sort** achieves O(n). In interviews, you rarely write a sort from scratch; you call the library sort and a **custom `Comparator`**, then reason about stability and complexity.

```java
// Merge Sort — O(n log n), stable
void mergeSort(int[] arr, int left, int right) {
    if (left >= right) return;
    int mid = left + (right - left) / 2;
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);
    merge(arr, left, mid, right);
}

void merge(int[] arr, int left, int mid, int right) {
    int[] temp = new int[right - left + 1];
    int i = left, j = mid + 1, k = 0;
    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) temp[k++] = arr[i++];
        else temp[k++] = arr[j++];
    }
    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];
    System.arraycopy(temp, 0, arr, left, temp.length);
}

// Quick Sort — O(n log n) avg, O(n²) worst
void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int partition(int[] arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            int tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
    }
    int tmp = arr[i+1]; arr[i+1] = arr[high]; arr[high] = tmp;
    return i + 1;
}

// Counting Sort — O(n + k), for small range integers
int[] countingSort(int[] arr, int maxVal) {
    int[] count = new int[maxVal + 1];
    for (int n : arr) count[n]++;
    int[] sorted = new int[arr.length];
    int idx = 0;
    for (int i = 0; i <= maxVal; i++) {
        while (count[i]-- > 0) sorted[idx++] = i;
    }
    return sorted;
}
```

---

## 10. Binary Search

**Theory.** Binary search repeatedly halves a **sorted** search space, giving O(log n) — 30 steps suffice for a billion elements. The classic form finds a target in a sorted array, but the powerful interview idea is **"binary search on the answer"**: when the answer is a number in a known range and there's a *monotonic* check (`canDo(x)` is false for small x and becomes true past some threshold), you binary-search that threshold even though there's no array to search (e.g., minimum ship capacity, minimum eating speed, smallest feasible time). Two implementation hazards to recite: compute mid as `left + (right - left) / 2` to **avoid integer overflow**, and be deliberate about boundaries (`<` vs `<=`, whether to move to `mid` or `mid ± 1`) to avoid infinite loops — the "first/last occurrence" variants below show the standard templates.

```java
// Standard Binary Search
int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;  // avoid overflow
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

// Find First Occurrence (leftmost)
int firstOccurrence(int[] arr, int target) {
    int left = 0, right = arr.length - 1, result = -1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) { result = mid; right = mid - 1; }  // go left
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return result;
}

// Find Last Occurrence (rightmost)
int lastOccurrence(int[] arr, int target) {
    int left = 0, right = arr.length - 1, result = -1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) { result = mid; left = mid + 1; }   // go right
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return result;
}

// Search in Rotated Sorted Array
int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[left] <= nums[mid]) {  // left half is sorted
            if (target >= nums[left] && target < nums[mid]) right = mid - 1;
            else left = mid + 1;
        } else {  // right half is sorted
            if (target > nums[mid] && target <= nums[right]) left = mid + 1;
            else right = mid - 1;
        }
    }
    return -1;
}

// Binary Search on Answer Space
// "Find minimum capacity to ship packages within D days"
int shipWithinDays(int[] weights, int days) {
    int left = Arrays.stream(weights).max().getAsInt();   // minimum possible (max weight)
    int right = Arrays.stream(weights).sum();              // maximum (ship all in 1 day)
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (canShip(weights, days, mid)) right = mid;     // try smaller
        else left = mid + 1;
    }
    return left;
}

boolean canShip(int[] weights, int days, int capacity) {
    int daysNeeded = 1, currentLoad = 0;
    for (int w : weights) {
        if (currentLoad + w > capacity) { daysNeeded++; currentLoad = 0; }
        currentLoad += w;
    }
    return daysNeeded <= days;
}

// Sqrt using binary search
int mySqrt(int x) {
    if (x < 2) return x;
    int left = 1, right = x / 2;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        long sq = (long) mid * mid;
        if (sq == x) return mid;
        else if (sq < x) left = mid + 1;
        else right = mid - 1;
    }
    return right;  // floor of sqrt
}
```

---

## 11. Dynamic Programming

**Theory.** Dynamic Programming (DP) solves a big problem by combining solutions to **overlapping subproblems**, storing each subproblem's answer so it's computed only once. Two conditions must hold: **optimal substructure** (the optimal answer is built from optimal answers of smaller pieces) and **overlapping subproblems** (the same smaller pieces recur). There are two equivalent styles: **top-down memoization** (write the natural recursion, then cache results) and **bottom-up tabulation** (fill a table from base cases upward). The hard part is always **defining the state** — what do the indices of your `dp` array mean, and what's the **transition** (recurrence) from smaller states? A reliable recipe: (1) write the brute-force recursion, (2) notice repeated calls, (3) add a cache, (4) optionally convert to a table and shrink the dimensions (many 2D DPs only need the previous row → 1D). The patterns below (1D, knapsack, subsequence, grid, interval) cover most interview DP.

### Patterns

#### 1D DP
```java
// Fibonacci / Staircase
int climbStairs(int n) {
    if (n <= 2) return n;
    int prev = 1, curr = 2;
    for (int i = 3; i <= n; i++) { int next = prev + curr; prev = curr; curr = next; }
    return curr;
}

// House Robber
int rob(int[] nums) {
    int prev2 = 0, prev1 = 0;
    for (int n : nums) {
        int curr = Math.max(prev1, prev2 + n);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}

// Coin Change (minimum coins)
int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);  // "infinity"
    dp[0] = 0;
    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i) dp[i] = Math.min(dp[i], dp[i - coin] + 1);
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}
```

#### 0/1 Knapsack
```java
// Given weights and values, maximize value within capacity W
int knapsack(int W, int[] weights, int[] values) {
    int n = weights.length;
    int[][] dp = new int[n + 1][W + 1];
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            dp[i][w] = dp[i-1][w];  // don't take item i
            if (weights[i-1] <= w)
                dp[i][w] = Math.max(dp[i][w], dp[i-1][w-weights[i-1]] + values[i-1]);
        }
    }
    return dp[n][W];
}

// Space-optimized (1D)
int knapsack1D(int W, int[] weights, int[] values) {
    int[] dp = new int[W + 1];
    for (int i = 0; i < weights.length; i++) {
        for (int w = W; w >= weights[i]; w--) {  // MUST go right to left!
            dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
        }
    }
    return dp[W];
}
```

#### Subsequence Problems
```java
// Longest Common Subsequence (LCS)
int lcs(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m+1][n+1];
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1.charAt(i-1) == s2.charAt(j-1)) dp[i][j] = dp[i-1][j-1] + 1;
            else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
        }
    }
    return dp[m][n];
}

// Longest Increasing Subsequence (LIS) — O(n log n)
int lis(int[] nums) {
    List<Integer> tails = new ArrayList<>();  // smallest tail for LIS of each length
    for (int num : nums) {
        int pos = Collections.binarySearch(tails, num);
        if (pos < 0) pos = -(pos + 1);
        if (pos == tails.size()) tails.add(num);
        else tails.set(pos, num);
    }
    return tails.size();
}

// Edit Distance (Levenshtein)
int minDistance(String word1, String word2) {
    int m = word1.length(), n = word2.length();
    int[][] dp = new int[m+1][n+1];
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (word1.charAt(i-1) == word2.charAt(j-1)) dp[i][j] = dp[i-1][j-1];
            else dp[i][j] = 1 + Math.min(dp[i-1][j-1], Math.min(dp[i-1][j], dp[i][j-1]));
        }
    }
    return dp[m][n];
}
```

#### 2D Grid DP
```java
// Unique Paths
int uniquePaths(int m, int n) {
    int[][] dp = new int[m][n];
    for (int[] row : dp) Arrays.fill(row, 1);
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            dp[i][j] = dp[i-1][j] + dp[i][j-1];
    return dp[m-1][n-1];
}

// Minimum Path Sum
int minPathSum(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    int[][] dp = new int[m][n];
    dp[0][0] = grid[0][0];
    for (int i = 1; i < m; i++) dp[i][0] = dp[i-1][0] + grid[i][0];
    for (int j = 1; j < n; j++) dp[0][j] = dp[0][j-1] + grid[0][j];
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            dp[i][j] = grid[i][j] + Math.min(dp[i-1][j], dp[i][j-1]);
    return dp[m-1][n-1];
}
```

#### Interval DP
```java
// Burst Balloons
int maxCoins(int[] nums) {
    int n = nums.length;
    int[] arr = new int[n + 2];
    arr[0] = arr[n+1] = 1;
    System.arraycopy(nums, 0, arr, 1, n);
    int[][] dp = new int[n+2][n+2];
    for (int len = 1; len <= n; len++) {
        for (int left = 1; left <= n - len + 1; left++) {
            int right = left + len - 1;
            for (int k = left; k <= right; k++) {
                dp[left][right] = Math.max(dp[left][right],
                    arr[left-1]*arr[k]*arr[right+1] + dp[left][k-1] + dp[k+1][right]);
            }
        }
    }
    return dp[1][n];
}
```

---

## 12. Greedy Algorithms

**Theory.** A greedy algorithm builds the answer by always taking the **locally best choice** at each step, never reconsidering. It's simple and fast (often just a sort + single pass), but it's only *correct* when the problem has the **greedy-choice property**: a local optimum provably leads to the global optimum. That proof is the catch — greedy gives wrong answers when future consequences matter (that's when you need DP instead). The usual tell is a sort by the right key followed by a sweep: sort intervals by **end time** for maximum non-overlapping selection, sort by start time + a heap for "minimum meeting rooms", track a running reach for "jump game". In an interview, after proposing greedy, briefly justify *why* the local choice is safe (an exchange argument) or give a counterexample and switch to DP.

```java
// Activity Selection (maximum non-overlapping intervals)
int eraseOverlapIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[1] - b[1]);  // sort by end time
    int count = 0, end = Integer.MIN_VALUE;
    for (int[] interval : intervals) {
        if (interval[0] >= end) {  // no overlap
            end = interval[1];
        } else {
            count++;  // remove this one
        }
    }
    return count;
}

// Meeting Rooms II (minimum rooms needed)
int minMeetingRooms(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    PriorityQueue<Integer> ends = new PriorityQueue<>();  // min-heap of end times
    for (int[] interval : intervals) {
        if (!ends.isEmpty() && ends.peek() <= interval[0]) ends.poll();  // room freed
        ends.offer(interval[1]);
    }
    return ends.size();
}

// Jump Game
boolean canJump(int[] nums) {
    int maxReach = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > maxReach) return false;
        maxReach = Math.max(maxReach, i + nums[i]);
    }
    return true;
}

// Gas Station
int canCompleteCircuit(int[] gas, int[] cost) {
    int total = 0, tank = 0, start = 0;
    for (int i = 0; i < gas.length; i++) {
        total += gas[i] - cost[i];
        tank += gas[i] - cost[i];
        if (tank < 0) { start = i + 1; tank = 0; }
    }
    return total >= 0 ? start : -1;
}
```

---

## 13. Backtracking

**Theory.** Backtracking is **systematic brute force**: it explores the tree of all possible choices via DFS, and as soon as a partial solution can't possibly work, it **prunes** that branch and backs up to try the next option. The universal shape is *choose → explore (recurse) → un-choose* — you mutate the state, recurse, then undo the mutation so the next sibling starts clean. Use it for problems asking to **generate all** combinations/permutations/subsets, or to find *a* valid configuration under constraints (N-Queens, Sudoku, word search). It's inherently exponential (there are exponentially many candidates), so good **pruning** (skipping invalid choices early) is what makes it fast enough. If the question instead asks for a *count* or an *optimal* value rather than enumerating everything, consider DP.

```java
// Template for backtracking
void backtrack(State current, List<State> result, /* other params */ ) {
    if (isGoal(current)) { result.add(new State(current)); return; }
    for (Choice choice : getChoices(current)) {
        makeChoice(current, choice);
        backtrack(current, result);
        undoChoice(current, choice);
    }
}

// Permutations
List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrackPerm(nums, new boolean[nums.length], new ArrayList<>(), result);
    return result;
}
void backtrackPerm(int[] nums, boolean[] used, List<Integer> curr, List<List<Integer>> result) {
    if (curr.size() == nums.length) { result.add(new ArrayList<>(curr)); return; }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true;
        curr.add(nums[i]);
        backtrackPerm(nums, used, curr, result);
        curr.remove(curr.size() - 1);
        used[i] = false;
    }
}

// Subsets
List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrackSubsets(nums, 0, new ArrayList<>(), result);
    return result;
}
void backtrackSubsets(int[] nums, int start, List<Integer> curr, List<List<Integer>> result) {
    result.add(new ArrayList<>(curr));
    for (int i = start; i < nums.length; i++) {
        curr.add(nums[i]);
        backtrackSubsets(nums, i + 1, curr, result);
        curr.remove(curr.size() - 1);
    }
}

// N-Queens
List<List<String>> solveNQueens(int n) {
    List<List<String>> result = new ArrayList<>();
    char[][] board = new char[n][n];
    for (char[] row : board) Arrays.fill(row, '.');
    solveNQ(board, 0, result);
    return result;
}
void solveNQ(char[][] board, int row, List<List<String>> result) {
    if (row == board.length) {
        List<String> sol = new ArrayList<>();
        for (char[] r : board) sol.add(new String(r));
        result.add(sol);
        return;
    }
    for (int col = 0; col < board.length; col++) {
        if (isValid(board, row, col)) {
            board[row][col] = 'Q';
            solveNQ(board, row + 1, result);
            board[row][col] = '.';
        }
    }
}
boolean isValid(char[][] board, int row, int col) {
    for (int i = 0; i < row; i++) if (board[i][col] == 'Q') return false;
    for (int i = row-1, j = col-1; i >= 0 && j >= 0; i--, j--) if (board[i][j] == 'Q') return false;
    for (int i = row-1, j = col+1; i >= 0 && j < board.length; i--, j++) if (board[i][j] == 'Q') return false;
    return true;
}
```

---

## 14. Trie

**Theory.** A trie (prefix tree) stores strings by **sharing common prefixes** along a tree path — each edge is a character, and a flag marks where a complete word ends. Lookups, inserts, and prefix checks cost **O(L)** where L is the word length, *independent of how many words are stored* — that's why it beats a HashMap for **prefix queries** like autocomplete, spell-check, and "does any stored word start with X". The trade-off is memory (a child array/map per node). Reach for a trie whenever a problem is about prefixes, dictionaries, or matching many strings at once (e.g., word-search boards, IP routing, replacing words by roots).

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEnd;
}

class Trie {
    private TrieNode root = new TrieNode();

    void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null) node.children[idx] = new TrieNode();
            node = node.children[idx];
        }
        node.isEnd = true;
    }

    boolean search(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null) return false;
            node = node.children[idx];
        }
        return node.isEnd;
    }

    boolean startsWith(String prefix) {
        TrieNode node = root;
        for (char c : prefix.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null) return false;
            node = node.children[idx];
        }
        return true;
    }
}
```

---

## 15. Union-Find (DSU)

**Theory.** Union-Find (Disjoint Set Union) tracks a collection of elements partitioned into **disjoint groups**, supporting two operations: `find(x)` (which group is x in?) and `union(x, y)` (merge two groups). With the two standard optimizations — **path compression** (flatten the tree during `find`) and **union by rank/size** (always attach the smaller tree under the larger) — each operation is *almost* O(1) (inverse-Ackermann, effectively constant). It's the go-to for **connectivity** questions on undirected graphs: counting connected components, detecting a cycle (a `union` whose endpoints already share a root closes a cycle), Kruskal's MST, and "are these two nodes connected?" queries that arrive online. Choose Union-Find over BFS/DFS when edges are added incrementally or you only care about grouping, not paths.

```java
class UnionFind {
    int[] parent, rank;

    UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);  // path compression
        return parent[x];
    }

    boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;  // already connected (cycle!)
        if (rank[px] < rank[py]) { int tmp = px; px = py; py = tmp; }
        parent[py] = px;
        if (rank[px] == rank[py]) rank[px]++;
        return true;
    }

    boolean connected(int x, int y) { return find(x) == find(y); }
}

// Number of connected components
int countComponents(int n, int[][] edges) {
    UnionFind uf = new UnionFind(n);
    int components = n;
    for (int[] edge : edges) {
        if (uf.union(edge[0], edge[1])) components--;
    }
    return components;
}
```

---

## PROBLEM-PATTERN MAP

| Problem Type | Pattern | Data Structure |
|-------------|---------|---------------|
| Find pair with sum | Two pointers / HashMap | Array / Map |
| Longest subarray | Sliding window | Array |
| Shortest path (unweighted) | BFS | Queue |
| Shortest path (weighted) | Dijkstra | Priority Queue |
| Detect cycle in directed graph | DFS with colors | Graph |
| Detect cycle in undirected | Union-Find | DSU |
| Topological order | Kahn's / DFS | Graph + Queue |
| Kth largest element | Min-heap of size k | Priority Queue |
| Prefix search | Trie | TrieNode |
| Range sum query | Prefix sum | Array |
| Next greater element | Monotonic stack | Stack |
| LCS, Edit distance | DP | 2D array |
| Subset / Permutation | Backtracking | Recursion |
| Count inversions | Merge sort | Array |
| Frequent elements | HashMap + Heap | Map + PQ |

---

## 16. Real Interview Problems (With Solutions)

### 16.1 Valid Sudoku (Asked in multiple rounds)

```java
public boolean isValidSudoku(char[][] board) {
    Set<String> seen = new HashSet<>();
    for (int i = 0; i < 9; i++) {
        for (int j = 0; j < 9; j++) {
            if (board[i][j] == '.') continue;
            String c = String.valueOf(board[i][j]);
            if (!seen.add(c + " row " + i)) return false;
            if (!seen.add(c + " col " + j)) return false;
            if (!seen.add(c + " box " + i/3 + "-" + j/3)) return false;
        }
    }
    return true;
}
// Time O(81) = O(1), Space O(81)
```

### 16.2 Best Time to Buy and Sell Stock (One Transaction)

```java
public int maxProfit(int[] prices) {
    int minPrice = Integer.MAX_VALUE, maxProfit = 0;
    for (int p : prices) {
        minPrice = Math.min(minPrice, p);
        maxProfit = Math.max(maxProfit, p - minPrice);
    }
    return maxProfit;
}
// Pattern: track running minimum, max diff — O(n)
```

### 16.3 Best Time to Buy/Sell — At Most 2 Transactions

```java
public int maxProfit(int[] prices) {
    int buy1 = Integer.MAX_VALUE, buy2 = Integer.MAX_VALUE;
    int sell1 = 0, sell2 = 0;
    for (int p : prices) {
        buy1 = Math.min(buy1, p);
        sell1 = Math.max(sell1, p - buy1);
        buy2 = Math.min(buy2, p - sell1);
        sell2 = Math.max(sell2, p - buy2);
    }
    return sell2;
}
// Pattern: DP state machine — buy1, sell1, buy2, sell2
```

### 16.4 Longest Substring with K Distinct Characters

```java
public int lengthOfLongestSubstringKDistinct(String s, int k) {
    if (k == 0) return 0;
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
// Pattern: sliding window + HashMap frequency
```

### 16.5 Group Anagrams

```java
public List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> map = new HashMap<>();
    for (String word : strs) {
        char[] ch = word.toCharArray();
        Arrays.sort(ch);
        String key = new String(ch);
        map.computeIfAbsent(key, k -> new ArrayList<>()).add(word);
    }
    return new ArrayList<>(map.values());
}
// Key insight: sorted chars are identical for anagrams
```

### 16.6 Word Frequency Count

```java
Map<String, Long> freq = list.stream()
    .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
```

### 16.7 Stock Price — Multiple Events (PriorityQueue)

```java
// Process events in timestamp order; match buy/sell for max profit
class StockProcessor {
    PriorityQueue<int[]> events = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    // event: [timestamp, type (0=buy,1=sell), price]

    PriorityQueue<Integer> buys = new PriorityQueue<>();  // min-heap
    int profit = 0;

    void process() {
        while (!events.isEmpty()) {
            int[] e = events.poll();
            if (e[1] == 0) buys.offer(e[2]);
            else if (!buys.isEmpty() && e[2] > buys.peek())
                profit += e[2] - buys.poll();
        }
    }
}
```

### 16.8 Two Pointer — Max Loss / Stock Variants

```java
// Find pair with max difference where larger index > smaller (max gain)
// Same as maxProfit above

// Container with most water
public int maxArea(int[] height) {
    int left = 0, right = height.length - 1, max = 0;
    while (left < right) {
        max = Math.max(max, Math.min(height[left], height[right]) * (right - left));
        if (height[left] < height[right]) left++;
        else right--;
    }
    return max;
}
```

---

## 17. Tough Interview Q&A Bank

**Q: Array vs ArrayList vs LinkedList internal working?**

| | Array | ArrayList | LinkedList |
|--|-------|-----------|------------|
| Memory | Contiguous block | Dynamic array (1.5x grow) | Scattered nodes with prev/next |
| get(i) | O(1) | O(1) | O(n) |
| add(end) | O(1) if space | O(1) amortized | O(1) |
| add(i) | O(n) shift | O(n) shift | O(n) traverse + O(1) link |
| remove(i) | O(n) | O(n) | O(n) |
| Cache | Best | Good | Worst |

**Q: When to use HashMap vs TreeMap vs LinkedHashMap?**
A: HashMap — O(1) avg, no order. TreeMap — sorted O(log n). LinkedHashMap — insertion/access order O(1).

**Q: HashMap custom key — what to override?**
A: Both `equals()` and `hashCode()`. Never mutate key fields after insertion.

**Q: BFS vs DFS — when to use?**
A: BFS — shortest path unweighted, level-order. DFS — cycle detect, path find, connected components, backtracking.

**Q: DP vs Greedy — how to decide?**
A: Greedy if local optimal = global optimal (proof needed). DP if overlapping subproblems + optimal substructure.

**Q: Time complexity of HashMap operations?**
A: O(1) average put/get/remove. O(log n) worst case Java 8+ with treeification.

**Q: How to find cycle in linked list?**
A: Floyd's tortoise-hare — slow moves 1, fast moves 2; if they meet, cycle exists.

**Q: Top K elements — best approach?**
A: Min-heap of size K — O(n log k). Or QuickSelect — O(n) average.
