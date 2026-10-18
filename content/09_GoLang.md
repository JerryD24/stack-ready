# Go (Golang) — Complete Interview Guide
### Beginner to Advanced + Benefits Over Python

---

## TABLE OF CONTENTS
1. [Go vs Python — Why Go?](#1-go-vs-python--why-go)
2. [Go Fundamentals](#2-go-fundamentals)
3. [Data Types & Structures](#3-data-types--structures)
4. [Functions & Methods](#4-functions--methods)
5. [Structs, Interfaces & OOP in Go](#5-structs-interfaces--oop-in-go)
6. [Error Handling](#6-error-handling)
7. [Goroutines & Channels — Concurrency](#7-goroutines--channels--concurrency)
8. [Packages & Modules](#8-packages--modules)
9. [Go Standard Library Deep Dive](#9-go-standard-library-deep-dive)
10. [Building REST APIs in Go](#10-building-rest-apis-in-go)
11. [Go vs Java — Key Differences](#11-go-vs-java--key-differences)
12. [Memory Management in Go](#12-memory-management-in-go)
13. [Testing in Go](#13-testing-in-go)
14. [Advanced Go Patterns](#14-advanced-go-patterns)
15. [Interview Q&A](#15-interview-qa)

---

## 1. Go vs Python — Why Go?

### The Definitive Comparison

| Aspect | Go | Python |
|--------|----|----|
| **Performance** | ~10-100x faster (compiled, native) | Slower (interpreted, GIL) |
| **Concurrency** | Native goroutines (M:N threads) | GIL limits true parallelism |
| **Type System** | Statically typed, compiled | Dynamically typed, runtime checks |
| **Memory** | Manual-ish (low GC pauses) | Automatic (GC + reference counting) |
| **Compilation** | Compiles to single binary | Needs Python runtime installed |
| **Startup time** | Milliseconds | Seconds (for heavy libs) |
| **Docker image size** | ~5-15 MB (scratch) | ~200-500 MB |
| **Syntax** | Simple, minimal (25 keywords) | Clean, but many ways to do same thing |
| **Error handling** | Explicit (`if err != nil`) | Exceptions |
| **OOP** | Composition via interfaces | Full OOP + multiple inheritance |
| **Generics** | Yes (Go 1.18+) | Yes (via type hints) |
| **Ecosystem** | Growing, strong for infra | Massive, especially ML/data |
| **Learning curve** | Easy to learn, hard to master | Easy to learn, easy to start |
| **Best for** | Cloud infra, microservices, CLIs, networking | ML, scripting, data, prototyping |

### Where Go Beats Python
```
1. RAW PERFORMANCE:
   Python: web server handles ~1,000-5,000 RPS (Flask/FastAPI)
   Go:     web server handles ~100,000-500,000 RPS (net/http, Gin, Fiber)

2. CONCURRENCY:
   Python: GIL → only 1 thread runs Python code at a time
           asyncio: cooperative, single-threaded
   Go:     goroutines → millions of goroutines, true parallel execution
           Go runtime schedules goroutines on multiple OS threads (M:N)

3. MEMORY EFFICIENCY:
   Python: object overhead ~28 bytes for int
   Go:     int is 8 bytes on 64-bit

4. DEPLOYMENT:
   Python: "it works on my machine" — requires Python version, virtualenv, dependencies
   Go:     single static binary, copies to server and runs — that's it

5. STARTUP TIME:
   Python ML service: 10-30 seconds (loading TensorFlow, etc.)
   Go service:        ~10 milliseconds

6. PREDICTABLE LATENCY:
   Python GC pauses: unpredictable
   Go GC:            sub-millisecond pauses (tricolor mark-and-sweep, concurrent)
```

### Where Python Beats Go
```
1. DATA SCIENCE & ML: NumPy, Pandas, TensorFlow, PyTorch — no Go equivalent
2. SCRIPTING: Python is far more concise for quick scripts
3. RAPID PROTOTYPING: Fewer lines of code, no compilation step
4. ECOSYSTEM SIZE: pip has ~500K packages; Go modules smaller but growing
5. INTERACTIVE: Jupyter notebooks, REPL
6. READABILITY: Code is often shorter and more readable
```

---

## 2. Go Fundamentals

### Program Structure
```go
package main   // every file belongs to a package; 'main' is the entry point

import (
    "fmt"
    "math"
    "strings"
    "os"
)

func main() {
    fmt.Println("Hello, World!")
}

// Run: go run main.go
// Build: go build -o myapp main.go
// Test:  go test ./...
// Format: go fmt ./...
// Vet:    go vet ./...
```

### Variables
```go
// var declaration
var x int         // zero value: 0
var y int = 10
var z = 10        // type inferred

// Multiple variables
var (
    name    string = "Alice"
    age     int    = 30
    active  bool   = true
)

// Short declaration (INSIDE functions only)
x := 10
name := "Alice"
x, y := 1, 2   // multiple assignment

// Constants
const Pi = 3.14159
const (
    StatusOK    = 200
    StatusNotFound = 404
)

// iota — auto-incrementing constant generator
type Direction int
const (
    North Direction = iota  // 0
    South                   // 1
    East                    // 2
    West                    // 3
)

// Bit flags with iota
type Permission uint
const (
    Read    Permission = 1 << iota  // 1
    Write                           // 2
    Execute                         // 4
)
user := Read | Write  // 3 (has Read and Write)
canRead := user & Read != 0   // true
```

### Zero Values
```go
// Every variable has a zero value (no uninitialized variables!)
var i int       // 0
var f float64   // 0.0
var b bool      // false
var s string    // ""
var p *int      // nil
var sl []int    // nil (but len(sl)==0, cap(sl)==0, can append)
var m map[string]int  // nil (do NOT write to nil map!)
var ch chan int  // nil
var fn func()   // nil
var iface interface{} // nil
```

### Type Conversions
```go
// Go requires EXPLICIT conversions (no implicit casting)
var i int = 42
var f float64 = float64(i)
var u uint = uint(f)
s := strconv.Itoa(i)       // int to string
n, err := strconv.Atoi("42")  // string to int
fmt.Sprintf("%d", i)          // int to string via fmt

// Type assertion (interface → concrete type)
var any interface{} = "hello"
s, ok := any.(string)    // s="hello", ok=true
n, ok := any.(int)       // n=0, ok=false (no panic with two-value form)
s = any.(string)          // panics if wrong type (single-value form)

// Type switch
switch v := any.(type) {
case string:
    fmt.Printf("String: %s\n", v)
case int:
    fmt.Printf("Int: %d\n", v)
default:
    fmt.Printf("Unknown: %T\n", v)
}
```

### Control Flow
```go
// if (no parentheses required)
if x > 10 {
    fmt.Println("big")
} else if x > 5 {
    fmt.Println("medium")
} else {
    fmt.Println("small")
}

// if with init statement (scope limited to if block)
if err := doSomething(); err != nil {
    log.Fatal(err)
}

// for (Go's only loop construct)
for i := 0; i < 10; i++ { }       // C-style
for i < 10 { i++ }                 // while-style
for { break }                       // infinite loop

// range
for i, v := range []int{1, 2, 3} {
    fmt.Println(i, v)
}
for k, v := range map[string]int{"a": 1} {
    fmt.Println(k, v)
}
for i, ch := range "hello" {       // iterates over runes (Unicode)
    fmt.Println(i, string(ch))
}
for range make([]int, 3) { }       // just iterate 3 times

// switch (no fallthrough by default)
switch day {
case "Monday", "Tuesday", "Wednesday", "Thursday", "Friday":
    fmt.Println("Weekday")
case "Saturday", "Sunday":
    fmt.Println("Weekend")
default:
    fmt.Println("Unknown")
}

// switch with no condition (like if-else)
switch {
case x < 0:
    fmt.Println("negative")
case x == 0:
    fmt.Println("zero")
default:
    fmt.Println("positive")
}

// defer — runs when surrounding function returns (LIFO order)
func readFile(filename string) error {
    f, err := os.Open(filename)
    if err != nil { return err }
    defer f.Close()   // always closes, even on early return or panic
    // read file...
    return nil
}

// Multiple defers run in LIFO order
func example() {
    defer fmt.Println("third")
    defer fmt.Println("second")
    defer fmt.Println("first")  // prints: first, second, third
}
```

---

## 3. Data Types & Structures

### Arrays and Slices
```go
// Arrays — fixed size, value type (copied on assignment)
var arr [5]int              // [0 0 0 0 0]
arr2 := [3]string{"a", "b", "c"}
arr3 := [...]int{1, 2, 3, 4}  // compiler counts elements

// Slices — dynamic, reference type (shares underlying array)
s := []int{1, 2, 3}
s = append(s, 4, 5)          // append (may allocate new array)
s2 := append(s, []int{6,7}...) // spread operator

// Slice operations
s[1:3]        // [2, 3] — indices 1 to 2
s[:3]         // first 3 elements
s[2:]         // from index 2 to end
s[:]          // full slice
len(s)        // number of elements
cap(s)        // capacity of underlying array

// make — create slice with length and capacity
s := make([]int, 5)      // length 5, capacity 5
s := make([]int, 0, 10)  // length 0, capacity 10 (preallocate)

// copy
src := []int{1, 2, 3}
dst := make([]int, len(src))
n := copy(dst, src)  // n = 3 (elements copied)

// 2D slice
matrix := make([][]int, 3)
for i := range matrix {
    matrix[i] = make([]int, 4)
}

// IMPORTANT: slice mutation
func modify(s []int) {
    s[0] = 99       // MODIFIES original (shared underlying array)
    s = append(s, 4) // does NOT modify original's slice header
}
```

### Maps
```go
// Map — key-value pairs, reference type
m := map[string]int{"a": 1, "b": 2}
m := make(map[string]int)          // empty map
m := make(map[string]int, 100)     // pre-sized hint

m["key"] = 42         // set
v := m["key"]         // get (zero value if missing)
v, ok := m["key"]     // ok=false if missing
delete(m, "key")       // delete
len(m)                 // number of key-value pairs

// Iterate (order NOT guaranteed)
for k, v := range m {
    fmt.Printf("%s: %d\n", k, v)
}

// Nested map
graph := map[string]map[string]int{
    "A": {"B": 1, "C": 4},
    "B": {"C": 2, "D": 5},
}
graph["A"]["B"]  // 1

// Maps are NOT safe for concurrent use
// Use sync.Map or mutex for concurrent access
```

### Strings and Runes
```go
// Strings are immutable byte slices (UTF-8 encoded)
s := "Hello, 世界"
len(s)            // 13 (bytes, not characters!)
len([]rune(s))    // 9 (Unicode code points)

// Iterating bytes
for i := 0; i < len(s); i++ {
    fmt.Printf("%d: %x\n", i, s[i])
}

// Iterating runes (Unicode-aware)
for i, r := range s {
    fmt.Printf("%d: %c (%d)\n", i, r, r)
}

// Rune = int32, represents a Unicode code point
var r rune = '世'   // r = 19990
string(r)           // "世"
[]rune("Hello")     // [72 101 108 108 111]

// String manipulation
import "strings"
strings.Contains("seafood", "foo")    // true
strings.HasPrefix("Go", "G")          // true
strings.HasSuffix("hello.go", ".go")  // true
strings.Index("chicken", "ken")       // 4 (-1 if not found)
strings.Count("cheese", "e")          // 3
strings.Replace("oink oink oink", "oink", "moo", 2) // "moo moo oink"
strings.ReplaceAll("oink oink", "oink", "moo")       // "moo moo"
strings.ToUpper("Go")                 // "GO"
strings.ToLower("GO")                 // "go"
strings.TrimSpace("  Go  ")           // "Go"
strings.Trim("¡¡¡Hello!!!", "!¡")     // "Hello"
strings.Split("a,b,c", ",")           // ["a", "b", "c"]
strings.Join([]string{"a","b","c"}, ",") // "a,b,c"
strings.Repeat("na", 3)               // "nanana"
strings.Fields("  foo bar  baz  ")    // ["foo", "bar", "baz"]

// strings.Builder — efficient string building
var sb strings.Builder
for i := 0; i < 5; i++ {
    fmt.Fprintf(&sb, "Item %d\n", i)
}
result := sb.String()

// fmt.Sprintf — string formatting
s := fmt.Sprintf("Name: %s, Age: %d, GPA: %.2f", "Alice", 30, 3.95)
// Verbs: %v (default), %T (type), %d (int), %f (float), %s (string), %q (quoted), %p (pointer)
```

---

## 4. Functions & Methods

**Theory.** Functions are first-class values in Go (you can assign, pass, and return them), but the standout feature is **multiple return values** — idiomatically `(result, error)` — which is how Go reports failures without exceptions. **Methods** are just functions with a *receiver*, which attaches behavior to a type. The key decision is **value vs pointer receiver**: a value receiver operates on a copy (safe, but can't mutate the original), while a pointer receiver can modify the struct and avoids copying large values. The rule of thumb: be consistent per type, and prefer a pointer receiver when the method mutates state or the struct is large. `defer` (which runs at function return in LIFO order) and **closures** round out the toolkit for reliable cleanup and stateful callbacks.

```go
// Basic function
func add(x, y int) int {
    return x + y
}

// Multiple return values (Go's way to handle errors)
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

result, err := divide(10, 2)
if err != nil {
    log.Fatal(err)
}

// Named return values
func minMax(arr []int) (min, max int) {
    min, max = arr[0], arr[0]
    for _, v := range arr[1:] {
        if v < min { min = v }
        if v > max { max = v }
    }
    return  // "naked return" — returns named values
}

// Variadic functions
func sum(nums ...int) int {
    total := 0
    for _, n := range nums {
        total += n
    }
    return total
}
sum(1, 2, 3)
sum([]int{1, 2, 3}...)  // spread slice

// First-class functions
type Transform func(int) int

func apply(nums []int, f Transform) []int {
    result := make([]int, len(nums))
    for i, n := range nums {
        result[i] = f(n)
    }
    return result
}

doubled := apply([]int{1, 2, 3}, func(n int) int { return n * 2 })

// Closures
func makeCounter() func() int {
    count := 0
    return func() int {
        count++
        return count
    }
}
counter := makeCounter()
counter()  // 1
counter()  // 2

// defer with named returns (powerful pattern)
func safeDiv(a, b int) (result int, err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("recovered: %v", r)
        }
    }()
    result = a / b  // panics if b == 0
    return
}
```

---

## 5. Structs, Interfaces & OOP in Go

**Theory.** Go deliberately has **no classes and no inheritance**. Its OOP is three simpler pieces: **structs** (group related data), **methods** (attach behavior to a type), and **interfaces** (declare required behavior). Reuse comes from **composition** via struct *embedding* — embedding one struct inside another "promotes" its fields and methods — instead of an inheritance hierarchy. The defining feature is that interfaces are satisfied **implicitly (structural typing)**: any type that has the required methods automatically implements the interface, with no `implements` keyword. This keeps code loosely coupled — you define a small interface describing exactly what you need and accept any type that fits — which is why idiomatic Go favors many tiny interfaces (`io.Reader`, `fmt.Stringer`) over a few large ones.

### Structs
```go
// Go's OOP = Structs + Methods + Interfaces (no inheritance!)
type Person struct {
    FirstName string
    LastName  string
    Age       int
    address   address  // unexported (lowercase) field
}

type address struct {
    Street string
    City   string
}

// Constructor convention (New... function)
func NewPerson(first, last string, age int) *Person {
    return &Person{
        FirstName: first,
        LastName:  last,
        Age:       age,
    }
}

// Struct literal
p := Person{FirstName: "Alice", LastName: "Smith", Age: 30}
p := Person{"Alice", "Smith", 30}  // positional (fragile, avoid)
p := &Person{FirstName: "Alice"}   // pointer to struct

// Accessing fields
p.FirstName       // "Alice"
p.address.City    // "" (zero value)

// Struct embedding (Go's composition / "inheritance")
type Employee struct {
    Person              // embedded — "promotes" Person's fields and methods
    Company  string
    Position string
}

e := Employee{
    Person:   Person{FirstName: "Bob", LastName: "Jones", Age: 25},
    Company:  "Acme",
    Position: "Engineer",
}
e.FirstName   // "Bob" — promoted from Person
e.Person.FirstName  // also works
```

### Methods
```go
// Methods — functions with a receiver
// Value receiver: copy of struct
func (p Person) FullName() string {
    return p.FirstName + " " + p.LastName
}

// Pointer receiver: can modify struct, more efficient for large structs
func (p *Person) Birthday() {
    p.Age++
}

p := Person{FirstName: "Alice", LastName: "Smith", Age: 30}
p.FullName()    // "Alice Smith"
p.Birthday()    // p.Age is now 31

// Go automatically takes address: p.Birthday() == (&p).Birthday()

// Method sets:
// Value type T:   has methods with value receiver
// Pointer type *T: has methods with both value AND pointer receivers
```

### Interfaces
```go
// Interface = set of method signatures
// Go uses STRUCTURAL (implicit) typing — no "implements" keyword!
// If a type has all the methods, it implicitly implements the interface

type Shape interface {
    Area() float64
    Perimeter() float64
}

type Circle struct {
    Radius float64
}

// Circle implicitly implements Shape
func (c Circle) Area() float64      { return math.Pi * c.Radius * c.Radius }
func (c Circle) Perimeter() float64 { return 2 * math.Pi * c.Radius }

type Rectangle struct {
    Width, Height float64
}
func (r Rectangle) Area() float64      { return r.Width * r.Height }
func (r Rectangle) Perimeter() float64 { return 2 * (r.Width + r.Height) }

// Polymorphism
func printShapeInfo(s Shape) {
    fmt.Printf("Area: %.2f, Perimeter: %.2f\n", s.Area(), s.Perimeter())
}

printShapeInfo(Circle{Radius: 5})
printShapeInfo(Rectangle{Width: 3, Height: 4})

// Empty interface — accepts any type
func printAny(v interface{}) { fmt.Println(v) }
// Go 1.18+: use 'any' alias
func printAny(v any) { fmt.Println(v) }

// Interface composition
type Reader interface {
    Read(p []byte) (n int, err error)
}
type Writer interface {
    Write(p []byte) (n int, err error)
}
type ReadWriter interface {
    Reader
    Writer
}

// Key interfaces to know:
// io.Reader, io.Writer, io.Closer, io.ReadWriter
// fmt.Stringer (String() string)
// error (Error() string)
// sort.Interface (Len, Less, Swap)

// Stringer interface — custom printing
func (p Person) String() string {
    return fmt.Sprintf("%s %s (%d)", p.FirstName, p.LastName, p.Age)
}
fmt.Println(p)  // Alice Smith (30)
```

### Generics (Go 1.18+)
```go
// Type parameters with constraints
func Map[T, U any](s []T, f func(T) U) []U {
    result := make([]U, len(s))
    for i, v := range s {
        result[i] = f(v)
    }
    return result
}

Map([]int{1, 2, 3}, func(n int) string { return strconv.Itoa(n) })
// ["1", "2", "3"]

// Constraints
type Number interface {
    int | int8 | int16 | int32 | int64 |
    float32 | float64
}

func Sum[T Number](nums []T) T {
    var total T
    for _, n := range nums {
        total += n
    }
    return total
}

// golang.org/x/exp/constraints package
import "golang.org/x/exp/constraints"

func Min[T constraints.Ordered](a, b T) T {
    if a < b { return a }
    return b
}

// Generic Stack
type Stack[T any] struct {
    items []T
}
func (s *Stack[T]) Push(item T) { s.items = append(s.items, item) }
func (s *Stack[T]) Pop() (T, bool) {
    var zero T
    if len(s.items) == 0 { return zero, false }
    item := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return item, true
}
```

---

## 6. Error Handling

**Theory.** Go treats **errors as ordinary values**, not exceptions. Any function that can fail returns an `error` as its last result, and the caller is expected to check it explicitly (`if err != nil`). This makes every failure path visible right at the call site — more verbose than try/catch, but errors can't be silently swallowed or invisibly propagate. Add context while preserving the original by wrapping with `%w`, then inspect the chain with `errors.Is` (does it match a known **sentinel** value?) or `errors.As` (extract a specific concrete error type). `panic`/`recover` exist too, but they're reserved for truly unexpected, programmer-level bugs — not for normal, expected error conditions.

```go
// Go's philosophy: errors are values, not exceptions
// Always check errors explicitly

// Creating errors
err1 := errors.New("something went wrong")
err2 := fmt.Errorf("user %d not found", userID)

// Wrapping errors (Go 1.13+)
err := fmt.Errorf("getUser: %w", originalErr)  // wraps with %w
errors.Is(err, originalErr)    // true — unwraps chain to check
errors.As(err, &targetErr)     // extract specific error type

// Custom error types
type ValidationError struct {
    Field   string
    Message string
}
func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error on field '%s': %s", e.Field, e.Message)
}

func validateAge(age int) error {
    if age < 0 {
        return &ValidationError{Field: "age", Message: "must be non-negative"}
    }
    if age > 150 {
        return &ValidationError{Field: "age", Message: "must be <= 150"}
    }
    return nil
}

// Check for specific error type
err := validateAge(-1)
var valErr *ValidationError
if errors.As(err, &valErr) {
    fmt.Println("Field:", valErr.Field)  // "age"
}

// Sentinel errors — comparable error values
var (
    ErrNotFound    = errors.New("not found")
    ErrUnauthorized = errors.New("unauthorized")
)

func getUser(id int) (*User, error) {
    if id <= 0 { return nil, ErrNotFound }
    ...
}

if errors.Is(err, ErrNotFound) {
    // handle not found
}

// panic and recover (use sparingly — for programming errors, not expected errors)
func mustPositive(n int) int {
    if n <= 0 {
        panic(fmt.Sprintf("expected positive number, got %d", n))
    }
    return n
}

func safeOperation() (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("recovered panic: %v", r)
        }
    }()
    // code that might panic
    mustPositive(-1)
    return nil
}
```

---

## 7. Goroutines & Channels — Concurrency

**Theory.** Concurrency is Go's signature strength. A **goroutine** is an extremely cheap unit of concurrent execution (~2 KB initial stack) that the Go runtime multiplexes onto a small pool of OS threads (an **M:N scheduler**), so a single program can run *millions* of them. Goroutines coordinate through **channels** — typed pipes that pass values between them — embodying Go's motto: *"don't communicate by sharing memory; share memory by communicating."* Unbuffered channels synchronize sender and receiver (a rendezvous); buffered ones decouple them up to a capacity; and `select` waits on several channel operations at once, which is how you build timeouts and cancellation. When shared mutable state is unavoidable, fall back to the `sync` package (`Mutex`, `RWMutex`, `WaitGroup`, `Once`), and use the `context` package to propagate deadlines and cancellation across goroutine boundaries.

### Goroutines
```go
// Goroutine: lightweight concurrent execution unit
// Go runtime manages goroutines, scheduling them on OS threads (M:N model)
// Initial stack: ~2KB (grows/shrinks dynamically, up to 1GB by default)
// Can run MILLIONS of goroutines (vs ~thousands of OS threads)

func hello(name string) {
    fmt.Println("Hello,", name)
}

go hello("Alice")   // start goroutine — runs concurrently
go hello("Bob")     // another goroutine

// Problem: main function exits before goroutines complete
// Solution: WaitGroup
```

### sync.WaitGroup
```go
var wg sync.WaitGroup

for i := 0; i < 5; i++ {
    wg.Add(1)   // increment counter
    go func(n int) {
        defer wg.Done()   // decrement counter when done
        fmt.Println("Worker", n)
    }(i)   // pass i as argument! (avoid closure capture bug)
}

wg.Wait()   // block until counter reaches 0
```

### Channels
```go
// Channel: typed conduit for communicating between goroutines
// "Do not communicate by sharing memory; share memory by communicating."

// Unbuffered channel (synchronous — sender blocks until receiver ready)
ch := make(chan int)

go func() {
    ch <- 42   // send
}()
v := <-ch      // receive (blocks until value available)
fmt.Println(v) // 42

// Buffered channel (async up to buffer size)
ch := make(chan int, 3)  // buffer size 3
ch <- 1   // doesn't block (buffer not full)
ch <- 2
ch <- 3
// ch <- 4  // would block (buffer full)
<-ch  // 1

// Direction-restricted channels
func producer(ch chan<- int) {  // write-only
    ch <- 42
}
func consumer(ch <-chan int) {  // read-only
    v := <-ch
    fmt.Println(v)
}

// Ranging over channel
ch := make(chan int)
go func() {
    for i := 0; i < 5; i++ {
        ch <- i
    }
    close(ch)  // IMPORTANT: close after all sends
}()

for v := range ch {   // receives until channel closed
    fmt.Println(v)
}

// Check if channel is closed
v, ok := <-ch
if !ok {
    fmt.Println("channel closed")
}
```

### Select Statement
```go
// select: wait on multiple channel operations (like switch for channels)
select {
case msg := <-ch1:
    fmt.Println("Received from ch1:", msg)
case msg := <-ch2:
    fmt.Println("Received from ch2:", msg)
case ch3 <- "hello":
    fmt.Println("Sent to ch3")
case <-time.After(1 * time.Second):
    fmt.Println("Timeout!")
default:
    fmt.Println("No channel ready (non-blocking)")
}

// Done channel pattern (cancellation)
func doWork(done <-chan struct{}) {
    for {
        select {
        case <-done:
            fmt.Println("Stopping...")
            return
        default:
            // do work
        }
    }
}

done := make(chan struct{})
go doWork(done)
time.Sleep(2 * time.Second)
close(done)  // broadcast cancellation to all listeners
```

### sync Package — Mutexes
```go
import "sync"

// Mutex — mutual exclusion
type SafeCounter struct {
    mu    sync.Mutex
    count int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}

func (c *SafeCounter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count
}

// RWMutex — multiple readers, one writer
type Cache struct {
    mu   sync.RWMutex
    data map[string]string
}

func (c *Cache) Get(key string) (string, bool) {
    c.mu.RLock()    // multiple goroutines can read simultaneously
    defer c.mu.RUnlock()
    v, ok := c.data[key]
    return v, ok
}

func (c *Cache) Set(key, value string) {
    c.mu.Lock()     // exclusive write lock
    defer c.mu.Unlock()
    c.data[key] = value
}

// sync.Once — run initialization exactly once
var (
    instance *Singleton
    once     sync.Once
)
func GetInstance() *Singleton {
    once.Do(func() {
        instance = &Singleton{}
    })
    return instance
}

// sync.Map — concurrent map
var m sync.Map
m.Store("key", "value")
v, ok := m.Load("key")
m.Delete("key")
m.LoadOrStore("key", "default")
m.Range(func(k, v any) bool {
    fmt.Println(k, v)
    return true  // return false to stop
})

// sync.Pool — reuse objects
var bufPool = sync.Pool{
    New: func() any { return new(bytes.Buffer) },
}
buf := bufPool.Get().(*bytes.Buffer)
buf.Reset()
defer bufPool.Put(buf)
// use buf...
```

### Context Package
```go
import "context"

// context.Context: carries deadlines, cancellation signals, and request-scoped values

// With timeout
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()   // always call cancel to free resources

result, err := callExternalAPI(ctx)
if errors.Is(err, context.DeadlineExceeded) {
    fmt.Println("Request timed out")
}

// With cancellation
ctx, cancel := context.WithCancel(context.Background())

go func() {
    <-someSignal
    cancel()  // cancel all work
}()

func worker(ctx context.Context) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()  // context.Canceled or context.DeadlineExceeded
        default:
            doWork()
        }
    }
}

// With value (pass request-scoped data)
type contextKey string
const userKey contextKey = "user"

ctx = context.WithValue(ctx, userKey, user)
user := ctx.Value(userKey).(*User)  // retrieve

// Context in HTTP handlers
func handler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()  // already has cancellation for client disconnect
    result, err := db.QueryContext(ctx, "SELECT ...")
    // query cancelled if client disconnects
}
```

### Worker Pool Pattern
```go
func workerPool(jobs <-chan Job, results chan<- Result, numWorkers int) {
    var wg sync.WaitGroup
    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range jobs {
                results <- process(job)
            }
        }()
    }
    go func() {
        wg.Wait()
        close(results)  // signal that all results are sent
    }()
}

// Usage
jobs := make(chan Job, 100)
results := make(chan Result, 100)

workerPool(jobs, results, runtime.NumCPU())

// Send jobs
for _, j := range allJobs {
    jobs <- j
}
close(jobs)

// Collect results
for r := range results {
    fmt.Println(r)
}
```

---

## 8. Packages & Modules

```
Go Module System (go.mod):
  go mod init github.com/username/myproject
  go get github.com/gin-gonic/gin@latest
  go mod tidy   — remove unused dependencies
  go mod vendor — copy deps into vendor/

Package naming:
  - lowercase, single word: package user
  - Exported: starts with uppercase (User, GetUser)
  - Unexported: starts with lowercase (user, getUser)
  - Visible outside package: uppercase only

File structure:
  myproject/
    go.mod
    go.sum
    main.go
    user/
      user.go        (package user)
      user_test.go   (package user)
    order/
      order.go       (package order)
    internal/        (cannot be imported by external projects)
      db/
        db.go
```

---

## 9. Go Standard Library Deep Dive

```go
// net/http — HTTP client and server
import "net/http"

// Simple server
http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"message": "hello"})
})
http.ListenAndServe(":8080", nil)

// HTTP client
client := &http.Client{Timeout: 10 * time.Second}
resp, err := client.Get("https://api.example.com/users")
defer resp.Body.Close()
body, _ := io.ReadAll(resp.Body)

// encoding/json
import "encoding/json"

type Person struct {
    Name  string `json:"name"`
    Age   int    `json:"age,omitempty"`   // omit if zero value
    Email string `json:"email,omitempty"`
    pass  string                           // unexported = not serialized
}

// Marshal: Go → JSON
data, err := json.Marshal(Person{Name: "Alice", Age: 30})
// {"name":"Alice","age":30}

// Unmarshal: JSON → Go
var p Person
err := json.Unmarshal([]byte(`{"name":"Bob","age":25}`), &p)

// Streaming (large data)
json.NewEncoder(w).Encode(data)     // write to io.Writer
json.NewDecoder(r.Body).Decode(&v)  // read from io.Reader

// os — file operations
f, err := os.Open("file.txt")
f, err := os.Create("file.txt")
f, err := os.OpenFile("file.txt", os.O_APPEND|os.O_WRONLY, 0644)
defer f.Close()
os.Remove("file.txt")
os.Mkdir("dir", 0755)
os.MkdirAll("a/b/c", 0755)
os.Getenv("HOME")
os.Setenv("KEY", "value")

// io / bufio — I/O primitives
import "io", "bufio"

// Read entire file
data, err := os.ReadFile("file.txt")

// Write file
err := os.WriteFile("file.txt", []byte("hello"), 0644)

// Buffered reading (efficient for large files)
scanner := bufio.NewScanner(file)
for scanner.Scan() {
    line := scanner.Text()
}

// time
import "time"
now := time.Now()
t := time.Date(2026, time.April, 28, 12, 0, 0, 0, time.UTC)
t.Format("2006-01-02 15:04:05")      // MUST use this specific reference time
time.Parse("2006-01-02", "2026-04-28")
t.Add(24 * time.Hour)
t.Sub(other)                          // Duration
time.Since(t)                         // time.Now().Sub(t)
time.Sleep(100 * time.Millisecond)

// strings, strconv
strconv.Itoa(42)            // "42"
strconv.Atoi("42")          // 42, nil
strconv.ParseFloat("3.14", 64)  // 3.14, nil
strconv.FormatFloat(3.14, 'f', 2, 64)  // "3.14"
strconv.ParseBool("true")   // true, nil
```

---

## 10. Building REST APIs in Go

### Using net/http (Standard Library)
```go
package main

import (
    "encoding/json"
    "log"
    "net/http"
    "strconv"
    "strings"
)

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

var users = map[int]User{
    1: {1, "Alice", "alice@example.com"},
}

func respond(w http.ResponseWriter, status int, data any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func usersHandler(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case http.MethodGet:
        list := make([]User, 0, len(users))
        for _, u := range users { list = append(list, u) }
        respond(w, http.StatusOK, list)
    case http.MethodPost:
        var u User
        if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
            respond(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
            return
        }
        respond(w, http.StatusCreated, u)
    }
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/users", usersHandler)
    log.Fatal(http.ListenAndServe(":8080", mux))
}
```

### Using Gin (Most Popular Web Framework)
```go
// go get github.com/gin-gonic/gin

package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type CreateUserRequest struct {
    Name  string `json:"name" binding:"required,min=2"`
    Email string `json:"email" binding:"required,email"`
    Age   int    `json:"age" binding:"required,min=18"`
}

func main() {
    r := gin.Default()  // includes Logger and Recovery middleware

    // Route groups
    api := r.Group("/api/v1")
    api.Use(AuthMiddleware())

    users := api.Group("/users")
    {
        users.GET("", listUsers)
        users.POST("", createUser)
        users.GET("/:id", getUser)
        users.PUT("/:id", updateUser)
        users.DELETE("/:id", deleteUser)
    }

    r.Run(":8080")
}

func listUsers(c *gin.Context) {
    page := c.DefaultQuery("page", "1")
    c.JSON(http.StatusOK, gin.H{"users": []string{}, "page": page})
}

func getUser(c *gin.Context) {
    id := c.Param("id")
    user, err := userService.GetByID(id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }
    c.JSON(http.StatusOK, user)
}

func createUser(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    user, err := userService.Create(req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
        return
    }
    c.JSON(http.StatusCreated, user)
}

// Middleware
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
            return
        }
        user, err := validateToken(token)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
            return
        }
        c.Set("user", user)   // store in context
        c.Next()               // call next handler
    }
}
```

### Database with sqlx or pgx
```go
// go get github.com/jackc/pgx/v5

import (
    "context"
    "github.com/jackc/pgx/v5/pgxpool"
)

var pool *pgxpool.Pool

func initDB(ctx context.Context) error {
    config, err := pgxpool.ParseConfig("postgres://user:pass@localhost:5432/mydb")
    if err != nil { return err }
    config.MaxConns = 10
    pool, err = pgxpool.NewWithConfig(ctx, config)
    return err
}

func getUser(ctx context.Context, id int) (*User, error) {
    var u User
    err := pool.QueryRow(ctx,
        "SELECT id, name, email FROM users WHERE id = $1", id,
    ).Scan(&u.ID, &u.Name, &u.Email)
    if err != nil {
        return nil, fmt.Errorf("getUser: %w", err)
    }
    return &u, nil
}

func createUser(ctx context.Context, u User) (*User, error) {
    err := pool.QueryRow(ctx,
        "INSERT INTO users(name, email) VALUES($1, $2) RETURNING id",
        u.Name, u.Email,
    ).Scan(&u.ID)
    return &u, err
}

// Transaction
func transferFunds(ctx context.Context, from, to int, amount float64) error {
    tx, err := pool.Begin(ctx)
    if err != nil { return err }
    defer tx.Rollback(ctx)  // no-op if already committed

    _, err = tx.Exec(ctx, "UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, from)
    if err != nil { return err }

    _, err = tx.Exec(ctx, "UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, to)
    if err != nil { return err }

    return tx.Commit(ctx)
}
```

---

## 11. Go vs Java — Key Differences

| Aspect | Go | Java |
|--------|----|----|
| OOP | Composition (no inheritance) | Classical inheritance |
| Interfaces | Implicit (structural) | Explicit (`implements`) |
| Error handling | Return values | Exceptions |
| Concurrency | Goroutines + channels | Threads + synchronized |
| Null safety | nil (explicit check) | NullPointerException risk |
| Generics | Yes (v1.18+) | Yes (v5+) |
| Compilation | Fast (~seconds) | Slower (~minutes for large projects) |
| Binary | Static, no runtime needed | Requires JVM |
| Pointers | Yes (but no pointer arithmetic) | No (only references) |
| Package manager | Go modules (built-in) | Maven/Gradle |
| Verbosity | Less verbose | More verbose |

---

## 12. Memory Management in Go

```
Go uses automatic garbage collection:
  - Tri-color mark-and-sweep (concurrent)
  - Very low STW (stop-the-world) pauses (< 1ms)
  - Does NOT use reference counting

Stack vs Heap allocation:
  - Go compiler determines where variables live (escape analysis)
  - Local variables → stack (fast, automatically freed)
  - If variable "escapes" (returned, stored in heap, etc.) → heap (GC managed)

Memory layout:
  - Pointers: 8 bytes (64-bit)
  - int: 8 bytes on 64-bit
  - string: 16 bytes (pointer + length)
  - slice: 24 bytes (pointer + length + capacity)
  - interface: 16 bytes (type pointer + value pointer)

GOGC environment variable:
  - Controls GC frequency (default: 100 = run when heap doubles)
  - GOGC=off: disable GC
  - GOMAXPROCS: number of OS threads (default: num CPUs)
```

```go
import "runtime"

// Force GC
runtime.GC()

// Get memory stats
var stats runtime.MemStats
runtime.ReadMemStats(&stats)
fmt.Println("Heap alloc:", stats.HeapAlloc / 1024 / 1024, "MB")
fmt.Println("Sys:", stats.Sys / 1024 / 1024, "MB")
fmt.Println("GC cycles:", stats.NumGC)

// Escape analysis: go build -gcflags="-m" main.go
```

---

## 13. Testing in Go

```go
// file: calculator_test.go (must end in _test.go)
package calculator_test  // or package calculator (white-box testing)

import (
    "testing"
    "github.com/stretchr/testify/assert"   // popular testing library
)

func TestAdd(t *testing.T) {
    result := Add(2, 3)
    if result != 5 {
        t.Errorf("Add(2,3) = %d; want 5", result)
    }
    // Or with testify:
    assert.Equal(t, 5, result)
}

// Table-driven tests (Go idiom)
func TestAdd_TableDriven(t *testing.T) {
    cases := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive", 2, 3, 5},
        {"negative", -1, -1, -2},
        {"zero", 0, 0, 0},
    }

    for _, tc := range cases {
        t.Run(tc.name, func(t *testing.T) {
            assert.Equal(t, tc.expected, Add(tc.a, tc.b))
        })
    }
}

// Benchmark
func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(2, 3)
    }
}
// go test -bench=. -benchmem ./...

// Mocking with interfaces
type UserRepository interface {
    GetByID(id int) (*User, error)
}

type MockUserRepo struct {
    users map[int]*User
}
func (m *MockUserRepo) GetByID(id int) (*User, error) {
    if u, ok := m.users[id]; ok { return u, nil }
    return nil, ErrNotFound
}

func TestGetUser(t *testing.T) {
    repo := &MockUserRepo{users: map[int]*User{1: {ID: 1, Name: "Alice"}}}
    service := NewUserService(repo)
    user, err := service.GetUser(1)
    assert.NoError(t, err)
    assert.Equal(t, "Alice", user.Name)
}

// httptest for HTTP handler tests
func TestUserHandler(t *testing.T) {
    req := httptest.NewRequest(http.MethodGet, "/users/1", nil)
    w := httptest.NewRecorder()

    handler(w, req)

    assert.Equal(t, http.StatusOK, w.Code)
    var user User
    json.NewDecoder(w.Body).Decode(&user)
    assert.Equal(t, "Alice", user.Name)
}

// Run tests
// go test ./...
// go test -v ./...          verbose
// go test -run TestAdd ./... run specific test
// go test -cover ./...      coverage
// go test -race ./...       race condition detection
```

---

## 14. Advanced Go Patterns

### Functional Options Pattern
```go
// Flexible constructor without many parameters
type Server struct {
    host    string
    port    int
    timeout time.Duration
    maxConn int
}

type Option func(*Server)

func WithHost(host string) Option {
    return func(s *Server) { s.host = host }
}
func WithPort(port int) Option {
    return func(s *Server) { s.port = port }
}
func WithTimeout(t time.Duration) Option {
    return func(s *Server) { s.timeout = t }
}

func NewServer(opts ...Option) *Server {
    s := &Server{
        host:    "localhost",       // defaults
        port:    8080,
        timeout: 30 * time.Second,
        maxConn: 100,
    }
    for _, opt := range opts { opt(s) }
    return s
}

// Usage — very readable, order doesn't matter
s := NewServer(
    WithHost("0.0.0.0"),
    WithPort(9090),
    WithTimeout(60 * time.Second),
)
```

### Pipeline Pattern
```go
// Chain goroutines via channels
func generate(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums { out <- n }
        close(out)
    }()
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in { out <- n * n }
        close(out)
    }()
    return out
}

func filter(in <-chan int, pred func(int) bool) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            if pred(n) { out <- n }
        }
        close(out)
    }()
    return out
}

// Chain pipeline
nums := generate(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
squares := square(nums)
evens := filter(squares, func(n int) bool { return n%2 == 0 })
for n := range evens {
    fmt.Println(n)  // 4, 16, 36, 64, 100
}
```

---

## 15. Interview Q&A

**Q: What are goroutines and how are they different from OS threads?**
A: Goroutines are lightweight concurrent execution units managed by the Go runtime, not the OS. OS threads have ~1-8MB fixed stack and are expensive to create. Goroutines start with ~2KB stack that grows/shrinks dynamically. You can run millions of goroutines. The Go runtime uses an M:N scheduler — M goroutines are multiplexed across N OS threads. Goroutines are cheaper than threads in both creation time and memory.

**Q: How do channels work in Go?**
A: Channels are typed conduits for goroutine communication. Unbuffered channels block the sender until a receiver is ready (synchronous rendezvous). Buffered channels allow asynchronous sends up to the buffer capacity. `select` allows waiting on multiple channels simultaneously. Close a channel to signal "no more values" — receivers can detect this. Never close a channel from the receiver side, and never close an already-closed channel (panic).

**Q: Explain Go's interface system and why it's different from Java.**
A: Go interfaces are implicit/structural. A type implements an interface simply by having the required methods — no `implements` keyword needed. This enables duck typing in a statically-typed language. Java interfaces are nominal — you must explicitly declare `implements`. Go's approach allows decoupling: you can define an interface in your package that matches a type in another package without modifying that package. This is called "satisfy an interface retroactively."

**Q: How does Go handle errors differently from Python/Java?**
A: Go treats errors as values, not exceptions. Functions return `(result, error)` tuples. The caller must explicitly check `if err != nil`. This makes error handling visible at every call site. Python/Java use exceptions which can be silently swallowed or propagate up without explicit handling. Go's approach is more verbose but ensures errors are never accidentally ignored. `errors.Is()` and `errors.As()` handle error wrapping/unwrapping.

**Q: What is the Go GC like compared to JVM?**
A: Go uses a concurrent, tri-color mark-and-sweep GC with very low STW pauses (typically < 1ms). JVM uses generational GC (G1, ZGC) which has more sophisticated algorithms but can have longer pauses. Go's GC is simpler and more predictable for latency-sensitive workloads. Go doesn't use reference counting (unlike CPython), so circular references are handled automatically.

**Q: What is the difference between `var` and `:=` in Go?**
A: `var x int = 5` is a full declaration and can be used at package level or inside functions. `:=` is short variable declaration and can only be used inside functions. `:=` infers the type from the right-hand side. At least one variable on the left of `:=` must be new (otherwise use `=`). `var` is required for zero-value initialization without assignment: `var x int` gives x=0.

**Q: Why is Go better than Python for microservices?**
A: 1) **Performance**: Go is 10-100x faster for CPU-bound work. 2) **Concurrency**: Goroutines handle 10,000+ concurrent connections easily; Python's GIL prevents true CPU parallelism. 3) **Deployment**: Go compiles to a single static binary — no Python runtime, no virtualenv, Docker images are ~5MB vs 200MB+. 4) **Memory**: Go uses 10-50x less memory than Python for equivalent workloads. 5) **Predictable latency**: Go GC pauses < 1ms; Python GC less predictable. 6) **Type safety**: Compile-time errors catch bugs Python would find at runtime.
