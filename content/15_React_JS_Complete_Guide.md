# React.js — Complete Interview Guide
### Frontend Core → Hooks → Router → State → Performance → Pro | Beginner → Advanced

---

## TABLE OF CONTENTS
1. [What is React & How It Works](#1-what-is-react--how-it-works)
2. [JSX Deep Dive](#2-jsx-deep-dive)
3. [Components — Functional vs Class](#3-components--functional-vs-class)
4. [Props, State & Data Flow](#4-props-state--data-flow)
5. [Event Handling & Forms](#5-event-handling--forms)
6. [Lists, Keys & Conditional Rendering](#6-lists-keys--conditional-rendering)
7. [useEffect — The Most Important Hook](#7-useeffect--the-most-important-hook)
8. [All React Hooks (Complete Reference)](#8-all-react-hooks-complete-reference)
9. [Context API & Global State](#9-context-api--global-state)
10. [React Router (v6)](#10-react-router-v6)
11. [State Management — Redux, Zustand, RTK](#11-state-management--redux-zustand-rtk)
12. [Performance Optimization](#12-performance-optimization)
13. [Error Boundaries & Suspense](#13-error-boundaries--suspense)
14. [React 18 & 19 Features](#14-react-18--19-features)
15. [TypeScript with React](#15-typescript-with-react)
16. [Testing — Jest & React Testing Library](#16-testing--jest--react-testing-library)
17. [Build Tools — Vite, CRA, Next.js](#17-build-tools--vite-cra-nextjs)
18. [Advanced Patterns](#18-advanced-patterns)
19. [Real Interview Code Puzzles](#19-real-interview-code-puzzles)
20. [Coding Problems with Solutions](#20-coding-problems-with-solutions)
21. [Tough Interview Q&A Bank](#21-tough-interview-qa-bank)
22. [INTERVIEW Q&A — REACT](#interview-qa--react)

---

## 1. What is React & How It Works

### What is React?
React is a **JavaScript library** (not a full framework) for building user interfaces. Created by Facebook (Meta). You compose **components** that describe what the UI should look like for a given state.

**Theory.** If you come from Java or Python backend work, think of React like a **view layer** that maps data to UI — similar in spirit to how a template engine renders HTML from a model, but the "template" is JavaScript and React keeps the UI in sync when the model (state) changes. You do not manually find DOM nodes and update them; you declare *what* the UI should look like for the current state, and React figures out *how* to update the browser.

**What problem it solves.** Imperative DOM code (jQuery-style) becomes unmaintainable as UIs grow: every button, form, and list item needs manual wiring, and it's easy to leave the DOM out of sync with application state. React's **declarative** model means: state changes → re-run your component function → React patches the DOM. One source of truth, predictable updates.

**Interview angle.** "Library vs framework" is a classic opener: React only handles UI. You choose routing (React Router), data fetching (fetch, TanStack Query), and global state (Context, Redux, Zustand) yourself. Next.js wraps React into a full-stack framework with SSR and file-based routing.

```
Traditional DOM manipulation:
  document.getElementById('btn').addEventListener('click', () => {
    document.getElementById('count').innerText = count++;
  });

React declarative approach:
  function Counter() {
    const [count, setCount] = useState(0);
    return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
  }
```

### SPA (Single Page Application)
- One HTML page (`index.html`)
- JavaScript handles routing and renders different "views" without full page reload
- Faster navigation after initial load
- SEO harder (Next.js solves this with SSR)

**How it works.** On first visit, the browser downloads a JS bundle, React mounts into a root `<div>`, and subsequent "page" changes are really **component swaps** driven by the router — no round-trip to the server for HTML. The URL still changes (via the History API), so back/forward works.

**Example.** User lands on `/dashboard` → React renders `<Dashboard />`. They click "Settings" → router changes URL to `/settings` → React unmounts dashboard subtree and mounts `<Settings />`. Data for the new view is fetched via API calls, not a full page reload.

**Pitfall.** Initial bundle size can be large; code splitting (Section 12) and lazy routes mitigate this. Blank screen until JS loads — show a loading shell in `index.html`.

### Virtual DOM
```
State changes
    ↓
React creates new Virtual DOM tree (lightweight JS object)
    ↓
Diffing (Reconciliation) — compare new VDOM vs old VDOM
    ↓
React updates ONLY changed nodes in Real DOM (batch updates)
```

| Real DOM | Virtual DOM |
|----------|-------------|
| Browser's actual tree | Lightweight JS copy |
| Expensive to update | Cheap to create/compare |
| Direct manipulation | React batches & optimizes |

**Why Virtual DOM?** Minimizes expensive real DOM operations. React 18+ also uses **Fiber architecture** for interruptible rendering and prioritization.

**How it works.** When state changes, React does **not** wipe and rebuild the entire page. It runs your component functions again to produce a new virtual tree, then **reconciles** (diffs) it against the previous tree. Only nodes whose type, props, or children changed get updated in the real DOM. Updating one counter button does not re-touch unrelated parts of the page.

**Example.** A list of 100 items where only item #42's label changes: reconciliation matches items by `key`, sees one text node changed, and updates that single DOM text node — not all 100 `<li>` elements.

**Interview angle.** Virtual DOM is an implementation strategy, not magic — other frameworks use different approaches (e.g., fine-grained reactivity). The interview question is usually "what happens when setState is called?" → schedule re-render → render phase (build VDOM) → commit phase (apply DOM updates).

### React Fiber (Interview topic)
- Reimplementation of React's core algorithm (React 16+)
- Enables: concurrent rendering, suspense, priority-based updates
- Work can be **paused, resumed, aborted**
- Two phases: **Render** (pure, can be interrupted) → **Commit** (applies to DOM, synchronous)

**How it works.** Before Fiber (React 15 and earlier), reconciliation was synchronous — a large update could block the main thread and make typing feel laggy. Fiber breaks work into **units** linked in a tree. React can pause after a unit, handle a high-priority update (e.g., keystroke in a search box), then resume the lower-priority work (e.g., filtering a huge list). The **render phase** is interruptible; the **commit phase** is not — once React commits, the user sees the update.

**Example.** User types in a search box while a heavy `<ProductList />` is re-rendering. With concurrent features (`useTransition`), React keeps the input responsive and defers the expensive list re-filter to a lower priority.

**Pitfall.** Do not confuse Fiber with "Virtual DOM" — VDOM is the in-memory tree; Fiber is the engine that walks and schedules updates to that tree.

### React vs Angular vs Vue

| | React | Angular | Vue |
|--|-------|---------|-----|
| Type | Library | Full framework | Progressive framework |
| Learning curve | Medium | Steep | Easier |
| State | External (Redux, etc.) | Built-in services | Pinia/Vuex |
| Template | JSX | HTML + directives | HTML templates |
| Company use | Meta, Netflix, Airbnb | Google, enterprise | Alibaba, startups |

---

## 2. JSX Deep Dive

JSX = JavaScript XML. Syntax extension that looks like HTML inside JavaScript.

**Theory.** JSX is **not** HTML and **not** understood by browsers directly. Your build tool (Babel, Vite) transforms each JSX tag into a `React.createElement(type, props, ...children)` call (or the modern JSX runtime equivalent). That returns a plain JavaScript object describing a UI node — a building block of the Virtual DOM.

**Why JSX?** It keeps markup and logic in one place (colocation). You can use variables, map over arrays, and call functions right where you render — without string templates or separate `.html` files.

```jsx
// JSX
const element = <h1 className="title">Hello, {name}!</h1>;

// Compiles to (Babel):
const element = React.createElement('h1', { className: 'title' }, 'Hello, ', name, '!');
```

### JSX Rules
1. **Return single root** (or use Fragment `<>...</>`)
2. **Close all tags** — `<img />`, `<br />`
3. **`className`** not `class`, **`htmlFor`** not `for`
4. **camelCase** for attributes — `onClick`, `tabIndex`, `readOnly`
5. **JavaScript expressions** in `{}` only — not statements (`if`, `for`)
6. **`null`, `undefined`, `false`, `true`** don't render (boolean short-circuit)

```jsx
// Fragment — avoids extra DOM node
return (
  <>
    <Header />
    <Main />
  </>
);

// Or explicit
return (
  <React.Fragment>
    <Header />
  </React.Fragment>
);
```

### Embedding Expressions
```jsx
const user = { name: 'Prabhat', role: 'Developer' };

<h1>{user.name}</h1>                    // ✅
<h1>{user.name.toUpperCase()}</h1>      // ✅
<h1>{if (x) 'a'}</h1>                   // ❌ statements not allowed
<h1>{items.map(i => <li key={i.id}>{i.name}</li>)}</h1>  // ✅
```

### JSX Security — XSS
React **escapes** values by default before rendering:
```jsx
const userInput = '<script>alert("xss")</script>';
<div>{userInput}</div>  // Rendered as text, NOT executed
```
**Danger:** `dangerouslySetInnerHTML` — only use with sanitized HTML.

**How it works.** React escapes strings in `{}` by converting `<`, `>`, `&` to entities before inserting text nodes. Attackers cannot inject `<script>` through normal interpolation. `dangerouslySetInnerHTML` bypasses escaping — treat it like `innerHTML` in vanilla JS: sanitize with a library (DOMPurify) or avoid entirely.

**Interview angle.** "Can XSS happen in React?" → escaped by default; risk is `dangerouslySetInnerHTML`, passing unsanitized HTML from APIs, or rendering URLs in `href` without validation.

---

## 3. Components — Functional vs Class

### Functional Component (Modern — use this)

**Theory.** A component is a **function that returns UI**. Every time its parent re-renders or its own state changes, React calls the function again with new props/state and compares the output to the previous render.

```jsx
function Welcome({ name }) {
  return <h1>Hello, {name}</h1>;
}

// Arrow function style
const Welcome = ({ name }) => <h1>Hello, {name}</h1>;
```

### Class Component (Legacy — know for interviews)
```jsx
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
```

| Functional + Hooks | Class |
|--------------------|-------|
| Simpler, less boilerplate | `this` binding issues |
| Hooks for state/effects | `this.state`, lifecycle methods |
| Industry standard since 2019 | Legacy codebases |
| Easier to test | Verbose |

### Class Lifecycle (know for interviews — maps to hooks)

| Class Lifecycle | When | Hook Equivalent |
|-----------------|------|-----------------|
| `constructor` | Init state, bind | `useState` initial |
| `componentDidMount` | After first render | `useEffect(() => {}, [])` |
| `componentDidUpdate` | After re-render | `useEffect(() => {})` |
| `componentWillUnmount` | Before removal | `useEffect` cleanup |
| `shouldComponentUpdate` | Skip re-render? | `React.memo` |
| `getDerivedStateFromProps` | Sync state from props | Avoid — derive in render |
| `getSnapshotBeforeUpdate` | Before DOM update | Rare — refs |

**Interview angle.** Legacy codebases still use classes. Know that `componentDidMount` + cleanup in `componentWillUnmount` maps to `useEffect(() => { ...; return cleanup; }, [])`. `this.setState` batching behavior is analogous to multiple `useState` setters in one event handler (React 18 batches them into one render).

---

## 4. Props, State & Data Flow

### Props — Parent → Child (Read-only)
```jsx
function UserCard({ name, age, isActive = false }) {
  return (
    <div className={isActive ? 'active' : ''}>
      <h2>{name}</h2>
      <p>Age: {age}</p>
    </div>
  );
}

<UserCard name="Prabhat" age={28} />
```

**Props are immutable** — child cannot modify props.

**How it works.** Props flow **down** the component tree like function arguments. If the parent re-renders with new props, the child re-renders too (unless memoized). The child communicates **up** by calling callback props (`onSave`, `onChange`) that the parent passed in — the parent owns the state and updates it.

**Example.** `<UserCard name="Alex" age={28} />` — `name` and `age` are props. Changing them requires the **parent** to re-render with different values; `UserCard` cannot call `name = "Bob"` internally.

### PropTypes (runtime validation — optional with TS)
```jsx
import PropTypes from 'prop-types';

UserCard.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number,
  isActive: PropTypes.bool
};
```

### State — Component's own data
```jsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(prev => prev + 1)}>+ (safe)</button>
    </div>
  );
}
```

**Always use functional update** `setCount(prev => prev + 1)` when new state depends on old state (especially in async/batched updates).

**How it works.** `useState` returns a value and a setter. Calling the setter schedules a re-render — it does **not** mutate the current `count` variable in place. React 18 **batches** multiple setters in the same event handler into one re-render. Outside events (before React 18), each setter could trigger its own render; batching is now default everywhere.

**Example — why functional updates matter:**
```jsx
// User clicks once. count starts at 0.
setCount(count + 1);  // schedules update: 0 + 1 = 1
setCount(count + 1);  // still reads count as 0 → schedules 1 again
setCount(count + 1);  // still 0 → schedules 1 again
// Result after one click: count === 1 (not 3)

setCount(c => c + 1);  // 0 → 1
setCount(c => c + 1);  // 1 → 2
setCount(c => c + 1);  // 2 → 3
// Result: count === 3
```

**Pitfall.** Reading state immediately after `setCount(x)` still shows the old value — state updates are asynchronous relative to your function body.

### One-Way Data Flow
```
Parent state
    ↓ props
Child component
    ↓ callback props (e.g. onSave)
Parent updates state
```

### Lifting State Up
When two siblings need same data, move state to **common parent**.

```jsx
function Parent() {
  const [text, setText] = useState('');
  return (
    <>
      <Input value={text} onChange={setText} />
      <Preview text={text} />
    </>
  );
}
```

### State Colocation
Keep state as **close as possible** to where it's used. Don't put everything in global store.

**Example — lifting state up.** Two siblings `<TemperatureInput scale="C" />` and `<TemperatureInput scale="F" />` must stay in sync. Move `temperature` and `scale` to `Calculator` parent; each child receives `value` + `onChange` props. Same pattern as sharing data between two Java panels via a common controller.

**Interview angle.** "Prop drilling" = passing props through many layers. Fixes: Context (Section 9), component composition (pass `children`), or a state library — but don't reach for Redux until colocation and Context are insufficient.

---

## 5. Event Handling & Forms

### Events — SyntheticEvent
React wraps native events in `SyntheticEvent` for cross-browser consistency.

```jsx
function Button() {
  const handleClick = (e) => {
    e.preventDefault();   // like native
    e.stopPropagation();
    console.log('clicked');
  };
  return <button onClick={handleClick}>Click</button>;
}
```

**Note:** In React 17+, events attach to root, not document (event delegation change).

**How it works.** React uses **event delegation** — one listener on the root catches bubbled events, then React's SyntheticEvent dispatches to your handler. `e.preventDefault()` stops default browser behavior (form submit, link navigation). Handlers receive the same SyntheticEvent interface across browsers.

**Pitfall.** Do not call `e.persist()` unless you need the event after an async gap (rare). In async code, read `e.target.value` synchronously or store it in a variable first.

### Controlled vs Uncontrolled Components

| Controlled | Uncontrolled |
|------------|--------------|
| React state is source of truth | DOM is source of truth |
| `value={state}` + `onChange` | `useRef` to read DOM |
| Preferred for forms | File inputs, integrations |

```jsx
// Controlled
function ControlledForm() {
  const [email, setEmail] = useState('');
  return (
    <input
      value={email}
      onChange={e => setEmail(e.target.value)}
    />
  );
}

// Uncontrolled
function UncontrolledForm() {
  const inputRef = useRef();
  const handleSubmit = () => {
    console.log(inputRef.current.value);
  };
  return <input ref={inputRef} defaultValue="" />;
}
```

**Example — controlled search box.** User types "ord" → `onChange` fires → `setEmail` updates state → React re-renders → input shows "ord". The React state is always the source of truth; the DOM cannot drift. Uncontrolled is fine for one-off reads on submit (e.g., file input) where you don't need live validation.

### Form Submit Pattern
```jsx
function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    api.login(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" value={form.email} onChange={handleChange} />
      <input name="password" type="password" value={form.password} onChange={handleChange} />
      <button type="submit">Login</button>
    </form>
  );
}
```

---

## 6. Lists, Keys & Conditional Rendering

**Theory.** React has no special template syntax for conditionals — you use plain JavaScript (`if`, ternary, `&&`) inside JSX expressions `{}`. For lists, you transform arrays with `.map()` and return elements. Each list item needs a stable **`key`** so reconciliation can match items across renders.

### Conditional Rendering
```jsx
// if/else
{isLoggedIn ? <Dashboard /> : <Login />}

// && short-circuit
{error && <ErrorBanner message={error} />}

// Early return
if (loading) return <Spinner />;
if (error) return <ErrorPage error={error} />;
return <Content data={data} />;
```

### Lists & Keys
```jsx
const users = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];

<ul>
  {users.map(user => (
    <li key={user.id}>{user.name}</li>
  ))}
</ul>
```

**Why `key`?** Helps React identify which items changed, added, removed during reconciliation.

**How it works.** When a list reorders, React uses `key` to decide whether to **reuse** an existing component instance or create a new one. Wrong keys cause React to reuse the wrong DOM node — internal state (cursor position, expanded/collapsed, input value) sticks to the wrong row.

**Example.** Delete the first item from `[A, B, C]` with index keys: React thinks key `0` is still the first row and updates its content from A→B, leaving C's row with stale internal state. With stable IDs, React unmounts A's row and keeps B and C instances intact.

| Good keys | Bad keys |
|-----------|----------|
| Unique stable ID from DB | Array index (if list reorders) |
| UUID generated once | `Math.random()` on each render |

**Index as key** is OK only if list is static and never reorders.

**Pitfall.** `{error && <Banner />}` — if `error` is `0`, React renders `0` on screen (falsy number). Use `{error ? <Banner /> : null}` or `{Boolean(error) && ...}`.

---

## 7. useEffect — The Most Important Hook

**Theory.** React components should be **pure during render** — given the same props/state, return the same JSX. Side effects (fetching data, subscriptions, timers, manual DOM tweaks) do not belong in the render body. `useEffect` runs **after** React commits DOM updates, so the browser has painted (for `useEffect`; `useLayoutEffect` runs before paint).

**Mental model.** Render = "what should be on screen." Effect = "sync with the outside world based on what's on screen."

```jsx
useEffect(() => {
  // Side effect runs AFTER render
  return () => {
    // Cleanup runs before next effect or unmount
  };
}, [dependencies]);
```

### Dependency Array Rules

| Dependencies | Behavior |
|--------------|----------|
| `[]` empty | Run once on mount (like componentDidMount) |
| `[a, b]` | Run on mount + when `a` or `b` changes |
| omitted | Run on **every** render (rarely wanted) |

**How it works — effect lifecycle:**
1. Component renders (JSX computed).
2. React commits DOM changes.
3. Effect from **previous** render's cleanup runs (if deps changed or unmounting).
4. New effect runs.

**Example.** `[userId]` dependency: mount with `userId=1` → fetch user 1. User navigates, `userId=2` → cleanup cancels in-flight fetch for user 1 → fetch user 2. Without cleanup, a slow response for user 1 could overwrite user 2's data (**race condition**).

### Common Patterns
```jsx
// Fetch data — cancelled flag avoids setState after unmount or stale response
useEffect(() => {
  let cancelled = false;
  async function fetchData() {
    const res = await api.getUsers();
    if (!cancelled) setUsers(res.data);  // skip if component unmounted or deps changed
  }
  fetchData();
  return () => { cancelled = true; };
}, []);

// Subscribe / unsubscribe
useEffect(() => {
  const sub = eventBus.subscribe('order', handleOrder);
  return () => sub.unsubscribe();
}, [handleOrder]);

// Sync with external system (document title)
useEffect(() => {
  document.title = `${count} items`;
}, [count]);
```

### useEffect Mistakes (Interview favorites)
1. **Missing dependencies** — stale closures, ESLint `exhaustive-deps` warns
2. **Infinite loop** — `useEffect(() => { setX(x+1); })` without deps control
3. **Object/array in deps** — new reference every render → infinite loop
4. **Using useEffect for derived state** — compute in render instead

```jsx
// ❌ BAD — derived state in effect
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${first} ${last}`);
}, [first, last]);

// ✅ GOOD — derive during render
const fullName = `${first} ${last}`;
```

---

## 8. All React Hooks (Complete Reference)

### Rules of Hooks
1. Only call at **top level** — not inside loops, conditions, nested functions
2. Only call from **React functions** — components or custom hooks

**Why these rules exist.** React stores hook state in a **linked list** per component instance, keyed by call order. If you call `useState` inside an `if`, the order changes between renders and React attaches state to the wrong hook — corrupt state and crashes. Custom hooks are just functions that also call hooks; the same ordering rules apply.

**Interview angle.** "Can I call hooks in a regular function?" → No, only in components or custom hooks. "Can I call hooks conditionally?" → No; call unconditionally and put the condition inside the hook or early-return before any hooks (move conditional logic below all hooks, or split into child components).

### useState
```jsx
const [state, setState] = useState(initialValue);
const [state, setState] = useState(() => expensiveInitialComputation());
```

### useReducer — complex state logic
```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    case 'set': return { count: action.payload };
    default: return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return <button onClick={() => dispatch({ type: 'increment' })}>{state.count}</button>;
}
```

Use when: multiple sub-values, next state depends on previous, complex transitions (like Redux locally).

**Example.** A multi-step wizard with `step`, `formData`, and `errors` — one reducer with actions `NEXT_STEP`, `UPDATE_FIELD`, `RESET` is clearer than five interdependent `useState` calls.

### useContext
```jsx
const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  const theme = useContext(ThemeContext);
  return <div className={theme}>...</div>;
}
```

### useRef — DOM access & mutable values
```jsx
const inputRef = useRef(null);
inputRef.current.focus();

// Mutable value that doesn't trigger re-render
const renderCount = useRef(0);
renderCount.current += 1;
```

### useMemo — cache expensive computation
```jsx
const sortedList = useMemo(() => {
  return items.sort((a, b) => a.price - b.price);
}, [items]);
```

### useCallback — cache function reference
```jsx
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
// Pass to memoized child to prevent unnecessary re-renders
```

**How it works.** Every render creates new function/object references. `React.memo(Child)` does shallow prop compare — if `onClick` is a new function reference each render, memo is useless. `useCallback` returns the same function reference until dependencies change. `useMemo` does the same for computed **values** (sorted arrays, filtered lists).

**Pitfall.** Do not wrap everything in `useMemo`/`useCallback` by default — they cost memory and comparison overhead. Profile first; optimize hot paths (large lists, heavy memoized children).

### useMemo vs useCallback

| useMemo | useCallback |
|---------|-------------|
| Returns **memoized value** | Returns **memoized function** |
| `useMemo(() => compute(), [deps])` | `useCallback(() => fn(), [deps])` |
| Skip expensive calculation | Stable function reference for child props |

### useLayoutEffect
- Runs **synchronously** after DOM mutations, **before** browser paint
- Use for: measuring DOM, preventing visual flicker
- Prefer `useEffect` unless you need synchronous DOM read/write

### useId (React 18)
```jsx
const id = useId();
<label htmlFor={id}>Email</label>
<input id={id} />
// Stable across server/client hydration
```

### useTransition & useDeferredValue (React 18 — Concurrent)
```jsx
const [isPending, startTransition] = useTransition();

startTransition(() => {
  setSearchQuery(input);  // low-priority update
});

const deferredQuery = useDeferredValue(query);
// Show stale UI while new query processes
```

### Custom Hooks
```jsx
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(json => { if (!cancelled) setData(json); })
      .catch(err => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}

// Usage
const { data, loading, error } = useFetch('/api/users');
```

**Custom hook rules:** Name starts with `use`, can call other hooks.

---

## 9. Context API & Global State

**Theory.** Context solves **prop drilling** — passing the same data (theme, logged-in user, locale) through many intermediate components that don't use it. A Provider at the top supplies a value; any descendant calls `useContext` to read it without intermediate props.

### When to use Context
- Theme, locale, auth user, feature flags
- Avoid for **frequently changing** data (causes all consumers to re-render)

### Context Performance Pattern — split contexts
```jsx
// ❌ One big context — everything re-renders on any change
<AppContext.Provider value={{ user, cart, theme }}>

// ✅ Split by update frequency
<UserContext.Provider>
  <CartContext.Provider>
    <ThemeContext.Provider>
```

### Context + useReducer (mini Redux)
```jsx
const StateContext = createContext();
const DispatchContext = createContext();

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>
        {children}
      </StateContext.Provider>
    </DispatchContext.Provider>
  );
}
```

---

## 10. React Router (v6)

**How it works.** In an SPA, the server always serves `index.html`. React Router listens to URL changes (via History API) and renders the matching `<Route>` component — no full page reload. `BrowserRouter` uses clean URLs (`/users/42`); `HashRouter` uses `#/users/42` for static hosts without server rewrite rules.

**Interview angle.** v6 API is declarative: `<Routes>` + `<Route element={...} />` replaces v5's `<Switch>` + `component={...}`. Nested routes use `<Outlet />` in the parent layout — the parent stays mounted while child routes swap.

```jsx
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/users">Users</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <div>User {id} <button onClick={() => navigate(-1)}>Back</button></div>;
}
```

### Nested Routes
```jsx
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<Overview />} />
  <Route path="settings" element={<Settings />} />
</Route>
// DashboardLayout: <Outlet /> renders child route
```

### Protected Routes
```jsx
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

<Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
```

### Data Loading (React Router 6.4+)
```jsx
// loader pattern with createBrowserRouter
const router = createBrowserRouter([
  {
    path: '/users/:id',
    element: <User />,
    loader: ({ params }) => fetchUser(params.id),
  },
]);
```

---

## 11. State Management — Redux, Zustand, RTK

**Theory.** Local `useState` and Context work until: (a) many distant components need the same frequently-updated data, (b) update logic is complex with middleware needs (logging, persistence), or (c) you need time-travel debugging. External stores centralize state and make updates **predictable** — one direction: action → reducer → new state → subscribers re-render.

### When you need external state management
- Many components need same data
- State updates frequently across distant components
- Complex async flows, caching, optimistic updates

### Redux Toolkit (RTK) — industry standard
```jsx
// store/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchUsers = createAsyncThunk('users/fetch', async () => {
  const res = await api.getUsers();
  return res.data;
});

const userSlice = createSlice({
  name: 'users',
  initialState: { list: [], loading: false, error: null },
  reducers: {
    addUser: (state, action) => { state.list.push(action.payload); },  // Immer inside
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.loading = true; })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      });
  },
});

// Component
const users = useSelector(state => state.users.list);
const dispatch = useDispatch();
useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);
```

### Zustand — simpler alternative
```jsx
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
}));

function Counter() {
  const { count, increment } = useStore();
  return <button onClick={increment}>{count}</button>;
}
```

| Redux Toolkit | Zustand | Context |
|---------------|---------|---------|
| Large apps, devtools | Small-medium apps | Theme, auth |
| Boilerplate (reduced with RTK) | Minimal API | Built-in |
| Middleware, time-travel | Simple | Re-render issues at scale |

---

## 12. Performance Optimization

**Theory.** React re-renders a component when its state changes or its parent re-renders (default). Re-render ≠ DOM update — React still diffs and may skip DOM writes. Performance work targets **unnecessary renders** and **expensive render work**, measured with React DevTools Profiler before optimizing.

### React.memo — skip re-render if props unchanged
```jsx
const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  return items.map(i => <Row key={i.id} item={i} />);
});
```

### When NOT to optimize prematurely
- Measure first (React DevTools Profiler)
- Most apps don't need memo everywhere
- `useMemo`/`useCallback` have their own cost

### Code Splitting — React.lazy + Suspense
```jsx
const AdminPanel = React.lazy(() => import('./AdminPanel'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <AdminPanel />
    </Suspense>
  );
}
```

### Virtualization for long lists
Use `react-window` or `@tanstack/react-virtual` — render only visible rows.

### Key Performance Checklist
- [ ] Stable keys in lists
- [ ] Avoid inline object/array in props to memoized children
- [ ] Code split routes
- [ ] Debounce search inputs
- [ ] Virtualize 1000+ item lists
- [ ] Use production build (`npm run build`)

---

## 13. Error Boundaries & Suspense

**Theory.** JavaScript errors during render crash the whole React tree by default — white screen. Error boundaries catch render-time errors in **children** and show fallback UI. Suspense lets components "wait" for async data or lazy-loaded code, showing a fallback until ready.

### Error Boundary (class only — no hook yet)
```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logErrorToService(error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return <h1>Something went wrong.</h1>;
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Catches:** Render errors, lifecycle errors in children.  
**Does NOT catch:** Event handlers, async code, SSR, errors in boundary itself.

### Suspense for Data Fetching (React 18+)
Works with frameworks (Next.js, Relay). Experimental in plain React.

---

## 14. React 18 & 19 Features

**How it works — automatic batching.** Before React 18, only updates inside React event handlers were batched. Updates inside `setTimeout`, promises, or native handlers caused multiple re-renders. React 18 batches all updates in the same event loop tick regardless of source — fewer renders, better performance.

### React 18
| Feature | What it does |
|---------|--------------|
| **Automatic Batching** | Multiple setStates in async/event → one re-render |
| **Concurrent Rendering** | Interruptible, priority-based updates |
| **useTransition** | Mark updates as non-urgent |
| **useDeferredValue** | Defer expensive renders |
| **Suspense improvements** | SSR streaming, selective hydration |
| **Strict Mode double-invoke** | Effects run twice in dev to find bugs |
| **createRoot** | `ReactDOM.createRoot(el).render(<App />)` |

### React 19 (know for interviews)
- **Actions** — async transitions with pending states (`useActionState`, `useFormStatus`)
- **Server Components** — render on server, zero client JS for static parts
- **`use()` hook** — read promises/context in render
- **Document metadata** — `<title>`, `<meta>` in components
- **Improved hydration** — better mismatch errors

### Strict Mode
```jsx
<React.StrictMode>
  <App />
</React.StrictMode>
```
Dev only: double-renders, double-invokes effects to expose side effects.

---

## 15. TypeScript with React

**Theory.** TypeScript adds compile-time checks to props, state, and events — catching typos like `onClik` or wrong prop types before runtime. For backend developers used to Java interfaces, `interface UserCardProps` feels familiar.

```tsx
interface UserCardProps {
  name: string;
  age?: number;
  onSelect: (id: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ name, age = 0, onSelect }) => {
  return <div onClick={() => onSelect(name)}>{name} ({age})</div>;
};

// Event types
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

// useRef
const inputRef = useRef<HTMLInputElement>(null);

// Generic component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}
```

**Prefer `interface` for props**, avoid `React.FC` in new code (implicit children typing changed).

---

## 16. Testing — Jest & React Testing Library

### Philosophy — test behavior, not implementation
```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('increments counter on click', async () => {
  render(<Counter />);
  const button = screen.getByRole('button', { name: /increment/i });
  await userEvent.click(button);
  expect(screen.getByText('1')).toBeInTheDocument();
});

test('loads users', async () => {
  render(<UserList />);
  await waitFor(() => {
    expect(screen.getByText('Prabhat')).toBeInTheDocument();
  });
});
```

### Query Priority (RTL)
1. `getByRole` (best — accessibility)
2. `getByLabelText`
3. `getByPlaceholderText`
4. `getByText`
5. `getByTestId` (last resort)

### Mocking API
```jsx
jest.mock('./api', () => ({
  fetchUsers: jest.fn(() => Promise.resolve([{ id: 1, name: 'Test' }])),
}));
```

---

## 17. Build Tools — Vite, CRA, Next.js

**Theory.** React code in `.jsx` files must be **bundled** (combined, transpiled, minified) before browsers can run it. Build tools also provide dev servers with hot module replacement (HMR) — edit a file, see changes without full reload.

| Tool | Use case |
|------|----------|
| **Vite** | Modern default — fast HMR, ESM native |
| **CRA** | Legacy — deprecated, don't start new projects |
| **Next.js** | Full-stack React — SSR, SSG, API routes, App Router |
| **Remix** | Web standards, nested routing, loaders |

### Vite project structure
```
src/
  components/
  hooks/
  pages/
  App.jsx
  main.jsx
index.html
vite.config.js
```

### Next.js App Router (React 18+)
```
app/
  layout.tsx      # shared layout
  page.tsx        # route /
  users/
    page.tsx      # route /users
    [id]/
      page.tsx    # dynamic /users/:id
```

**SSR vs SSG vs CSR:**

| | CSR | SSR | SSG |
|--|-----|-----|-----|
| Render | Browser | Server per request | Build time |
| SEO | Poor | Good | Good |
| TTFB | Fast shell | Slower | Fast CDN |
| Use | Dashboards | Personalized pages | Blogs, marketing |

---

## 18. Advanced Patterns

### Compound Components
```jsx
function Tabs({ children }) {
  const [active, setActive] = useState(0);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      {children}
    </TabsContext.Provider>
  );
}
Tabs.List = TabList;
Tabs.Panel = TabPanel;

// <Tabs><Tabs.List /><Tabs.Panel /></Tabs>
```

### Render Props
```jsx
<DataFetcher url="/api/users" render={(data) => <UserList users={data} />} />
```

### HOC (Higher-Order Component)
```jsx
function withAuth(WrappedComponent) {
  return function AuthComponent(props) {
    const { user } = useAuth();
    if (!user) return <Login />;
    return <WrappedComponent {...props} user={user} />;
  };
}
```
**Modern preference:** Custom hooks over HOCs.

### Portal — render outside parent DOM
```jsx
ReactDOM.createPortal(
  <Modal>{children}</Modal>,
  document.getElementById('modal-root')
);
```

### Forwarding Refs
```jsx
const FancyInput = forwardRef((props, ref) => (
  <input ref={ref} {...props} />
));
```

---

## 19. Real Interview Code Puzzles

### Puzzle 1 — What prints?

**Theory.** These puzzles test whether you understand **closures**, **batching**, and **stale state** — not syntax trivia. Trace what value `count` has at each `setCount` call.

```jsx
function App() {
  const [count, setCount] = useState(0);
  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  };
  return <button onClick={handleClick}>{count}</button>;
}
// Answer: clicks once → count becomes 1 (not 3)
// Batching + same count value. Fix: setCount(c => c + 1) three times → 3
```

### Puzzle 2 — Infinite loop?
```jsx
const [data, setData] = useState([]);
useEffect(() => {
  setData([...data, 'new']);
}, [data]);  // ✅ YES — infinite loop
```

### Puzzle 3 — Stale closure
```jsx
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1);  // always uses count from first render
  }, 1000);
  return () => clearInterval(id);
}, []);  // Fix: setCount(c => c + 1) or add count to deps
```

### Puzzle 4 — Key problem
```jsx
{items.map((item, index) => <Row key={index} data={item} />)}
// Reorder/delete causes wrong component state reuse
```

---

## 20. Coding Problems with Solutions

### Problem 1 — Debounced Search Input

**Theory.** Typing triggers a state update every keystroke. Calling an API on every keystroke floods the server. Debouncing waits until the user pauses typing (e.g., 300ms) before firing the search — same pattern as backend rate limiting, applied client-side.

```jsx
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SearchUsers() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) api.searchUsers(debouncedQuery);
  }, [debouncedQuery]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

### Problem 2 — Todo App (CRUD)
```jsx
function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');

  const addTodo = () => {
    if (!text.trim()) return;
    setTodos(prev => [...prev, { id: Date.now(), text, done: false }]);
    setText('');
  };

  const toggle = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const remove = (id) => setTodos(prev => prev.filter(t => t.id !== id));

  return (
    <div>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map(t => (
          <li key={t.id}>
            <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
            <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
            <button onClick={() => remove(t.id)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Problem 3 — Infinite Scroll
```jsx
function InfiniteList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const loaderRef = useRef();

  useEffect(() => {
    api.fetchPage(page).then(newItems => setItems(prev => [...prev, ...newItems]));
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setPage(p => p + 1);
    });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {items.map(item => <Card key={item.id} item={item} />)}
      <div ref={loaderRef}>Loading...</div>
    </>
  );
}
```

---

## 21. Tough Interview Q&A Bank

**Q: What is reconciliation?**  
A: React's algorithm to compare new Virtual DOM with previous, compute minimal DOM updates. Uses heuristics: different element types → rebuild subtree; same type → update attributes; lists use keys.

**Q: Why can't we use index as key?**  
A: When list reorders, React reuses wrong component instances, causing state bugs and poor performance.

**Q: useEffect vs useLayoutEffect?**  
A: useEffect async after paint; useLayoutEffect sync before paint. Use layout when you need to measure/mutate DOM before user sees flicker.

**Q: How to prevent unnecessary re-renders?**  
A: React.memo, useMemo, useCallback, split context, colocate state, virtualization. Profile first.

**Q: What is lifting state up?**  
A: Moving shared state to closest common ancestor so siblings stay in sync via props.

**Q: Controlled vs uncontrolled?**  
A: Controlled = React state drives input value. Uncontrolled = DOM holds value, read via ref.

**Q: What happens when setState is called?**  
A: React schedules re-render, batches updates (React 18 batches even in timeouts), creates new VDOM, diffs, commits changes.

**Q: Redux vs Context?**  
A: Context for simple infrequent global data. Redux/RTK for complex state, middleware, devtools, predictable updates at scale.

**Q: What is Strict Mode double invoke?**  
A: Dev-only: mounts, unmounts, remounts components and runs effects twice to surface impure side effects.

**Q: SSR hydration mismatch?**  
A: Server HTML ≠ client first render. Causes React warning. Fix: consistent data, suppressClientRender, useEffect for client-only code.

**Q: How does React 18 automatic batching work?**  
A: Multiple setStates in same event loop tick batched into one render — including promises, setTimeout, native handlers.

**Q: Custom hook benefits?**  
A: Reuse stateful logic, separate concerns, composable, testable without UI.

---

## INTERVIEW Q&A — REACT

**Q: Is React a framework or library?**  
A: Library — UI layer only. You choose router, state, data fetching. Next.js is a framework built on React.

**Q: What is JSX?**  
A: Syntax sugar for `React.createElement`. Not HTML — `className`, camelCase attrs, JS expressions in `{}`.

**Q: Functional vs class components?**  
A: Functional + hooks is standard. Class uses lifecycle methods and `this.state`. Know both for legacy code.

**Q: Explain Virtual DOM.**  
A: In-memory JS representation of UI. On state change, new VDOM created, diffed with old, minimal real DOM updates applied.

**Q: What are props?**  
A: Read-only inputs from parent to child. Immutable in child. Can pass data and callback functions.

**Q: What is state?**  
A: Component's private mutable data. State change triggers re-render. Use `useState` or `useReducer`.

**Q: What are React Hooks?**  
A: Functions that let functional components use state, lifecycle, refs, context. Must follow rules of hooks.

**Q: Explain useEffect.**  
A: Runs side effects after render. Cleanup on unmount/re-run. Dependency array controls when it runs.

**Q: What is useContext?**  
A: Subscribe to context value without prop drilling. Good for theme, auth, locale.

**Q: useMemo vs useCallback?**  
A: useMemo caches a value; useCallback caches a function reference.

**Q: What is React Router?**  
A: Client-side routing library. Maps URLs to components without full page reload.

**Q: What is Redux?**  
A: Predictable state container. Single store, actions dispatch state changes, reducers produce new state. RTK is modern standard.

**Q: How do you test React components?**  
A: React Testing Library — query by role/label, simulate user events, assert visible behavior. Mock API with jest.mock.

**Q: What is code splitting?**  
A: Load components lazily with `React.lazy` + `Suspense` to reduce initial bundle size.

**Q: Error boundary?**  
A: Class component catching render errors in children. Shows fallback UI. Doesn't catch event/async errors.

**Q: React 18 concurrent features?**  
A: useTransition, useDeferredValue, automatic batching, Suspense SSR improvements, createRoot API.

**Q: Next.js vs CRA?**  
A: Next.js = SSR/SSG, file routing, API routes, production-ready. CRA deprecated — use Vite for SPA.

**Q: How would you optimize a slow React app?**  
A: Profile → memo/code split/virtualize → fix unnecessary re-renders → optimize images → CDN → server components for static content.

**Q: What is prop drilling?**  
A: Passing props through many intermediate components. Fix: Context, composition, state management library.

**Q: Composition vs inheritance in React?**  
A: React favors composition — combine components via children, render props, hooks. Inheritance rarely used.

**Q: What is `key` in lists?**  
A: Stable unique identifier for reconciliation. Helps React match items across renders.

**Q: Can hooks be used in class components?**  
A: No. Hooks only in functional components and custom hooks.

**Q: What is `ref` used for?**  
A: Access DOM nodes, store mutable values without re-render, forward refs to child DOM.

**Q: Server Components (React 19)?**  
A: Components that run only on server — zero client JS, can access DB directly. Client Components marked with `'use client'`.

---

*End of React.js Complete Interview Guide — revise hooks, useEffect, performance, and Router v6 before every frontend interview.*
