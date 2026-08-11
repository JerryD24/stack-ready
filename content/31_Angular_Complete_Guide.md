# Angular — Complete Guide
### Beginner → Pro | Components, RxJS, DI, Signals, Interview Q&A

---

## TABLE OF CONTENTS
1. [What Is Angular & How It Works](#1-what-is-angular-how-it-works)
2. [TypeScript Essentials for Angular](#2-typescript-essentials-for-angular)
3. [Components & Templates](#3-components-templates)
4. [Data Binding & Directives](#4-data-binding-directives)
5. [Component Communication](#5-component-communication)
6. [Services & Dependency Injection](#6-services-dependency-injection)
7. [RxJS & Observables](#7-rxjs-observables)
8. [HTTP Client & APIs](#8-http-client-apis)
9. [Routing & Navigation](#9-routing-navigation)
10. [Forms — Template-Driven & Reactive](#10-forms-template-driven-reactive)
11. [Pipes](#11-pipes)
12. [Lifecycle Hooks](#12-lifecycle-hooks)
13. [Change Detection & Performance](#13-change-detection-performance)
14. [Modules vs Standalone Components](#14-modules-vs-standalone-components)
15. [Signals (Modern Angular)](#15-signals-modern-angular)
16. [State Management (NgRx)](#16-state-management-ngrx)
17. [Testing Angular](#17-testing-angular)
18. [Build Tools & Angular CLI](#18-build-tools-angular-cli)
19. [Angular vs React](#19-angular-vs-react)
20. [Coding Problems & Patterns](#20-coding-problems-patterns)
21. [Interview Q&A](#21-interview-qa)

---

## 1. What Is Angular & How It Works

**Theory.** **Angular** is a complete, opinionated **framework** (not just a library) for building large single-page web applications, maintained by Google. Unlike React — which is a UI library you assemble with other tools — Angular ships *everything in the box*: a component system, routing, an HTTP client, forms, dependency injection, testing utilities, and a powerful CLI. It uses **TypeScript** as its primary language, so your app is strongly typed end to end. (Note: modern "Angular" means Angular 2+; "AngularJS" is the unrelated, retired 1.x version — don't confuse them in an interview.)

**Analogy.** React is a high-quality engine you bolt into a chassis you build yourself; Angular is the whole car, pre-assembled — fewer decisions, more consistency across teams, at the cost of a steeper initial learning curve.

**How it works — the big picture.**
- The UI is a **tree of components**. Each component is a TypeScript **class** (logic) + an HTML **template** (view) + CSS (styles), tied together by the `@Component` decorator.
- **Data binding** keeps the template and the class in sync — change a class field and the view updates; a user event updates the class.
- **Dependency Injection (DI)** supplies components with shared services (data access, business logic) instead of components creating those themselves.
- A **change detection** mechanism figures out what changed and updates only the affected DOM.

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-counter',           // use as <app-counter></app-counter>
  standalone: true,
  template: `<button (click)="inc()">Count: {{ count }}</button>`,
})
export class CounterComponent {
  count = 0;
  inc() { this.count++; }            // change the field → view updates automatically
}
```

**What problem it solves.** For large apps with many teams, Angular's opinionated structure (a standard project layout, DI, typed everything, a single CLI) means any developer can move between projects and feel at home. That consistency is exactly why enterprises pick it.

**Interview angle.** "Angular vs React vs AngularJS?" — Angular is a full *framework* (batteries included, TypeScript, DI); React is a UI *library*; AngularJS (1.x) is the legacy, fundamentally different predecessor. "Why a framework over a library?" — consistency, built-in solutions, and less decision fatigue for big teams.

---

## 2. TypeScript Essentials for Angular

**Theory.** Angular is written in and for **TypeScript** — JavaScript plus a static type system. Types are checked at compile time and erased at runtime, catching a whole class of bugs (wrong shapes, typos, null misuse) before the app runs. You can't be productive in Angular without being comfortable here.

**The pieces you'll use constantly:**

```typescript
// Interfaces — describe the shape of data (e.g., an API response)
interface User { id: number; name: string; email?: string; }  // email optional

// Classes with typed members and access modifiers
class UserService {
  private users: User[] = [];
  addUser(u: User): void { this.users.push(u); }
}

// Generics — reusable, type-safe containers
function first<T>(arr: T[]): T { return arr[0]; }

// Union & literal types
type Status = 'active' | 'inactive' | 'pending';

// Decorators — metadata Angular reads to wire things up
@Component({ /* ... */ })          // @Component, @Injectable, @Input, @Output, etc.
```

**How it works — decorators.** Angular relies heavily on **decorators** (`@Component`, `@Injectable`, `@Input`). A decorator is a function that attaches *metadata* to a class, method, or property; Angular's compiler reads that metadata to know "this class is a component," "inject this dependency here," "this property is an input." They're the glue between your code and the framework.

**Pitfall.** Using `any` everywhere defeats the purpose — you lose all type safety. Prefer real interfaces for your data; reserve `any` for genuinely dynamic cases (and prefer `unknown` when you must, since it forces a check before use).

**Interview angle.** "Why TypeScript for Angular?" — compile-time safety, better tooling/autocomplete, self-documenting interfaces, and decorators that the framework depends on. Expect to explain `interface` vs `class` (interface = compile-time shape only, no runtime code; class = real runtime construct with logic).

---

## 3. Components & Templates

**Theory.** A **component** is the fundamental UI building block: a class decorated with `@Component` that controls a patch of screen (its template). Every Angular app is a tree of components rooted at a single root component. The decorator's metadata wires the class to its view.

```typescript
@Component({
  selector: 'app-user-card',          // the custom HTML tag
  standalone: true,
  templateUrl: './user-card.html',    // or inline `template: '...'`
  styleUrls: ['./user-card.css'],     // styles scoped to THIS component by default
})
export class UserCardComponent {
  name = 'Asha';
  role = 'Engineer';
  greet() { return `Hello, ${this.name}`; }
}
```
```html
<!-- user-card.html -->
<h3>{{ name }}</h3>                    <!-- interpolation: class field → view -->
<p>{{ greet() }}</p>                   <!-- can call methods too -->
```

**How it works — view encapsulation.** By default, the CSS you write in a component is **scoped to that component only** (Angular adds unique attributes to the elements and rewrites your selectors). So two components can both define `.title` styles without clashing — a big advantage over global CSS in large apps.

**Templates** are HTML enriched with Angular syntax: `{{ }}` interpolation, `[prop]` property binding, `(event)` binding, and structural directives (`*ngIf`, `*ngFor`). They're declarative — you describe what the UI should show for the current state, and Angular keeps the DOM in sync.

**Interview angle.** "What's in a component?" — a `@Component` decorator (with selector, template, styles) plus a class holding state and methods. "How is component CSS scoped?" — view encapsulation isolates styles to the component by default.

---

## 4. Data Binding & Directives

**Theory.** **Data binding** is how the template and the component class stay synchronized. Angular has four binding forms — knowing the syntax and direction of each is a guaranteed interview question.

| Binding | Syntax | Direction | Use |
|---|---|---|---|
| Interpolation | `{{ value }}` | class → view | Display a value as text |
| Property binding | `[prop]="value"` | class → view | Set an element/component property |
| Event binding | `(event)="handler()"` | view → class | Respond to user actions |
| Two-way binding | `[(ngModel)]="value"` | both | Form inputs (sync field ⇄ input) |

```html
<img [src]="user.avatarUrl">                 <!-- property binding -->
<button (click)="save()">Save</button>       <!-- event binding -->
<input [(ngModel)]="searchTerm">             <!-- two-way: the "banana in a box" [()] -->
<p>You typed: {{ searchTerm }}</p>
```

**How it works — two-way binding is not magic.** `[(ngModel)]` is just **syntactic sugar** for a property binding plus an event binding: `[ngModel]="searchTerm"` (class→view) combined with `(ngModelChange)="searchTerm = $event"` (view→class). Understanding this demystifies it and explains why two-way binding is really one-way binding in both directions.

**Directives** are instructions that change the DOM. Three kinds:
- **Structural** (`*ngIf`, `*ngFor`, `*ngSwitch`) — add/remove elements. The `*` means they restructure the DOM.
- **Attribute** (`[ngClass]`, `[ngStyle]`) — change appearance/behavior of an existing element.
- **Custom** — your own (e.g., a `appHighlight` directive).

```html
<div *ngIf="isLoggedIn; else login">Welcome!</div>
<ng-template #login>Please sign in</ng-template>

<li *ngFor="let item of items; trackBy: trackById">{{ item.name }}</li>
```
Modern Angular (17+) also offers built-in control flow: `@if`, `@for`, `@switch` — cleaner and faster than the `*ngIf`/`*ngFor` directives.

**Pitfall.** In `*ngFor`, always provide **`trackBy`** for lists that change. Without it, Angular re-renders the entire list on any change (it can't tell which items are the same); `trackBy` lets it reuse DOM nodes by a stable id — a major performance fix (the Angular equivalent of React's `key`).

**Interview angle.** "Explain the four data bindings." "What does `[(ngModel)]` desugar to?" "Structural vs attribute directives?" — structural add/remove elements (`*`), attribute modify existing ones. "Why `trackBy`?" — to avoid full list re-rendering.

---

## 5. Component Communication

**Theory.** Components form a tree, so they need ways to talk. The core mechanisms: **`@Input`** (parent → child data), **`@Output`** with `EventEmitter` (child → parent events), and a **shared service** for components that aren't directly related.

```typescript
// CHILD: receives data via @Input, emits events via @Output
@Component({ selector: 'app-child', standalone: true,
  template: `<button (click)="remove.emit(id)">Delete {{ name }}</button>` })
export class ChildComponent {
  @Input() name = '';                          // parent → child
  @Input() id!: number;
  @Output() remove = new EventEmitter<number>(); // child → parent
}
```
```html
<!-- PARENT -->
<app-child [name]="user.name" [id]="user.id" (remove)="onRemove($event)"></app-child>
```

**How it works.**
- **`@Input`** marks a property the parent can bind to; when the parent's bound value changes, Angular updates the child's property (and you can react in `ngOnChanges`).
- **`@Output`** exposes an `EventEmitter` the child calls (`.emit(value)`); the parent listens with event-binding syntax and receives the value as `$event`.
- For **unrelated components** (e.g., a header and a sidebar), share a **service** holding the state (often a `BehaviorSubject`) and inject it into both — both read and write the same source of truth.

**Pitfall.** Don't build long `@Input`/`@Output` chains through many intermediate components ("prop drilling"). When data needs to reach far-apart components, a shared service (or a state library) is cleaner.

**Interview angle.** "How do components communicate?" — `@Input` down, `@Output`/`EventEmitter` up, shared service for siblings/distant components. Be ready to write a child that takes an `@Input` and emits an `@Output`.

---

## 6. Services & Dependency Injection

**Theory.** A **service** is a plain class (decorated `@Injectable`) that holds reusable logic or state — data fetching, business rules, logging — kept *out* of components so components stay focused on the view. **Dependency Injection (DI)** is the mechanism Angular uses to *create and supply* those services to whoever needs them, instead of each class doing `new MyService()` itself. DI is arguably Angular's most important architectural feature.

```typescript
@Injectable({ providedIn: 'root' })     // one shared singleton for the whole app
export class UserService {
  private users: User[] = [];
  getUsers(): User[] { return this.users; }
  addUser(u: User) { this.users.push(u); }
}

@Component({ /* ... */ })
export class UserListComponent {
  // DI: Angular sees this constructor parameter and injects the singleton for you
  constructor(private userService: UserService) {}
  users = this.userService.getUsers();
}
```

**How it works.** Angular maintains an **injector** — a registry of how to create each dependency (its "providers"). When it builds a component, it reads the constructor's parameter types and **looks up or creates** each one from the injector, then passes them in. `providedIn: 'root'` registers a service as an app-wide **singleton** (one instance shared everywhere). You can also provide a service at the component level to get a fresh instance per component.

**Why DI matters (the payoff):**
- **Testability** — in tests you inject a mock service instead of the real one, with no code change to the component.
- **Loose coupling** — components depend on an abstraction, not a concrete construction.
- **Single source of truth** — a root singleton service is the standard way to share state across the app.

**Pitfall.** Misunderstanding scope: `providedIn: 'root'` = one shared instance (state persists app-wide); providing a service in a component's `providers` array = a new instance per component (state is isolated). Choosing the wrong one causes "my data resets" or "my data leaks between components" bugs.

**Interview angle.** "What is DI and why use it?" — the framework creates and supplies dependencies, giving testability and loose coupling. "How do you make a service a singleton?" — `@Injectable({ providedIn: 'root' })`. "Service vs component responsibility?" — services hold logic/state, components handle the view.

---

## 7. RxJS & Observables

**Theory.** Angular is built on **RxJS** — reactive programming with **Observables**. An **Observable** is a stream of values over time that you **subscribe** to: HTTP responses, user input events, route changes, timers — all are streams. Instead of callbacks or one-shot Promises, you compose streams with **operators** (`map`, `filter`, `switchMap`, `debounceTime`). This is the part of Angular newcomers find hardest, so understanding it sets you apart.

**Observable vs Promise (a key comparison):**

| | Promise | Observable |
|---|---|---|
| Values | One (resolves once) | Many (a stream over time) |
| Lazy? | No (runs immediately) | Yes (runs on subscribe) |
| Cancelable | No | Yes (unsubscribe) |
| Operators | No | Rich (map, filter, switchMap…) |

```typescript
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

// A live search box: react to typing, but call the API efficiently
this.searchControl.valueChanges.pipe(
  debounceTime(300),               // wait for a 300ms pause in typing
  distinctUntilChanged(),          // ignore if the term didn't actually change
  switchMap(term => this.api.search(term))  // cancel the previous request, run the new one
).subscribe(results => this.results = results);
```

**How it works — why operators matter.** Without RxJS, a search box would fire an API call on every keystroke and you'd get out-of-order responses. The pipeline above: `debounceTime` waits for the user to stop typing, `distinctUntilChanged` skips duplicate terms, and `switchMap` **cancels the in-flight request** when a new term arrives — so you always show results for the latest query. That's a real bug class solved declaratively in four lines.

**Subjects.** A **`Subject`** is an Observable you can also push values into (it's both producer and consumer). A **`BehaviorSubject`** additionally remembers the last value and emits it to new subscribers — the standard tool for sharing state in a service.

```typescript
@Injectable({ providedIn: 'root' })
export class CartService {
  private items$ = new BehaviorSubject<Item[]>([]);  // holds current cart
  cart$ = this.items$.asObservable();                // components subscribe to this
  add(item: Item) { this.items$.next([...this.items$.value, item]); }
}
```

**Pitfall — memory leaks.** A subscription stays active until you unsubscribe; forgetting to do so leaks memory and can cause callbacks on destroyed components. Fixes: the **`async` pipe** in templates (auto-subscribes and unsubscribes), `takeUntilDestroyed()`, or manual unsubscribe in `ngOnDestroy`. The `async` pipe is the cleanest and most recommended.

```html
<!-- async pipe: subscribes, renders, and auto-unsubscribes for you -->
<div *ngFor="let item of cart$ | async">{{ item.name }}</div>
```

**Interview angle.** "Observable vs Promise?" — many vs one, lazy, cancelable, composable. "`switchMap` vs `mergeMap`?" — `switchMap` cancels the previous inner stream (perfect for search/autocomplete); `mergeMap` runs them concurrently. "How do you avoid subscription leaks?" — `async` pipe / `takeUntilDestroyed` / unsubscribe in `ngOnDestroy`.

---

## 8. HTTP Client & APIs

**Theory.** Angular's **`HttpClient`** is the built-in service for talking to REST APIs. It returns **Observables** (not Promises), so responses plug straight into RxJS pipelines, and it integrates with **interceptors** for cross-cutting concerns like auth headers and error handling.

```typescript
@Injectable({ providedIn: 'root' })
export class UserApi {
  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');     // typed response
  }
  createUser(u: User): Observable<User> {
    return this.http.post<User>('/api/users', u);
  }
}
```
```typescript
// In a component — note: nothing happens until you subscribe (or use async pipe)
this.userApi.getUsers().subscribe({
  next: users => this.users = users,
  error: err => this.error = 'Failed to load users',
});
```

**How it works — interceptors.** An **HTTP interceptor** sits in the request/response pipeline and can modify *every* request or response — the standard place to attach a JWT auth header, log calls, show a loading spinner, or centrally handle 401/500 errors. This keeps that logic out of every individual service.

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  // clone (requests are immutable) and add the header to every outgoing call
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(authReq);
};
```

**Pitfall.** `HttpClient` calls are **lazy** — if you forget to `subscribe` (and don't use the `async` pipe), **the request never fires**. This trips up developers coming from `fetch`/Promises. Also, requests are immutable; you must `req.clone()` to modify them in an interceptor.

**Interview angle.** "How do you call an API in Angular?" — inject `HttpClient`, return a typed `Observable`, subscribe (or async pipe). "What's an interceptor for?" — cross-cutting request/response logic like auth headers and global error handling. "Why didn't my request fire?" — you didn't subscribe.

---

## 9. Routing & Navigation

**Theory.** The **Angular Router** maps URL paths to components, enabling a single-page app to have multiple "pages" without full reloads. You declare a route table (path → component), render the active component in a `<router-outlet>`, and navigate with links or programmatically.

```typescript
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'users', component: UserListComponent },
  { path: 'users/:id', component: UserDetailComponent },   // route param
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] }, // protected
  { path: '**', component: NotFoundComponent },            // wildcard (404)
];
```
```html
<a routerLink="/users">Users</a>
<router-outlet></router-outlet>            <!-- active component renders here -->
```

**How it works.**
- **Route parameters** (`:id`) are read via `ActivatedRoute` (e.g., to load the right user). Prefer subscribing to `paramMap` so navigation between `/users/1` and `/users/2` (which reuses the component) still updates.
- **Guards** (`canActivate`, `canDeactivate`) run *before* a route activates/deactivates — the standard way to block unauthenticated users or warn about unsaved changes.
- **Lazy loading** (`loadComponent` / `loadChildren`) loads a feature's code only when its route is first visited, shrinking the initial bundle.

```typescript
// Lazy-loaded route: the admin bundle downloads only when /admin is visited
{ path: 'admin', loadComponent: () => import('./admin.component').then(m => m.AdminComponent) }
```

**Pitfall.** Reading a route param once in `ngOnInit` breaks when the user navigates to another id of the *same* component (Angular reuses the instance, so `ngOnInit` doesn't re-run). Subscribe to `paramMap` instead.

**Interview angle.** "How does routing work?" — route table maps paths to components rendered in `<router-outlet>`. "What are guards?" — pre-navigation checks (auth, unsaved changes). "How do you reduce initial load?" — lazy-load feature routes.

---

## 10. Forms — Template-Driven & Reactive

**Theory.** Angular offers two form approaches. **Template-driven** forms put the logic in the HTML (with `ngModel`) — simple and quick for small forms. **Reactive** forms define the form model in the TypeScript class (`FormGroup`/`FormControl`) — more powerful, testable, and the right choice for anything non-trivial.

```typescript
// REACTIVE form — the model lives in code, fully typed and testable
export class SignupComponent {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });
  submit() {
    if (this.form.valid) console.log(this.form.value);
  }
}
```
```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <input formControlName="email">
  <!-- show error only after the user touches the field -->
  <span *ngIf="form.get('email')?.touched && form.get('email')?.invalid">Invalid email</span>
  <button [disabled]="form.invalid">Sign up</button>
</form>
```

**How it works.** A reactive form is a **tree of `FormControl`s** (each tracks value + validity + touched/dirty state) grouped in `FormGroup`s. Because the model is in code, you can subscribe to `form.valueChanges` (an Observable!), add dynamic controls, and unit-test validation without rendering the DOM.

**Template-driven vs Reactive:**

| | Template-driven | Reactive |
|---|---|---|
| Where logic lives | HTML template | Component class |
| Best for | Simple forms | Complex/dynamic forms |
| Testability | Harder | Easy (model in code) |
| Validation | Directives in template | `Validators` in code |

**Pitfall.** Showing validation errors immediately (before the user interacts) is jarring. Gate error messages on `touched`/`dirty`. Also, build **custom validators** as functions returning `null` (valid) or an error object — don't cram complex rules into the template.

**Interview angle.** "Template-driven vs reactive — when to use which?" — reactive for anything complex/dynamic/testable; template-driven for trivial forms. "How do you do cross-field validation (e.g., password match)?" — a validator on the `FormGroup` itself.

---

## 11. Pipes

**Theory.** A **pipe** transforms a value *in the template* for display — formatting dates, currency, text, or filtering — without changing the underlying data. They keep templates clean and reusable.

```html
{{ price | currency:'USD' }}              <!-- $1,299.00 -->
{{ today | date:'mediumDate' }}           <!-- Jun 30, 2026 -->
{{ name | uppercase }}
{{ user$ | async }}                       <!-- the async pipe (special: subscribes) -->
{{ longText | slice:0:100 }}
```

**How it works — pure vs impure pipes.** By default pipes are **pure**: Angular only re-runs them when the input *reference* changes, which makes them fast. An **impure** pipe re-runs on *every* change detection cycle (needed for things like filtering a mutating array) — flexible but a performance risk if overused. The `async` pipe is a special built-in impure pipe that subscribes to an Observable/Promise and auto-unsubscribes.

**Custom pipe:**
```typescript
@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 50): string {
    return value.length > limit ? value.slice(0, limit) + '…' : value;
  }
}
```

**Pitfall.** Don't use an impure pipe to filter/sort large lists on every cycle — it kills performance. Do the filtering in the component (or with an RxJS pipeline) and bind the result.

**Interview angle.** "What's a pipe?" — a template value transformer. "Pure vs impure pipe?" — pure re-runs only on reference change (fast); impure runs every cycle. "What does the `async` pipe do?" — subscribes to an Observable and manages unsubscription automatically.

---

## 12. Lifecycle Hooks

**Theory.** Angular calls specific methods on a component at well-defined moments in its life — creation, change, destruction. Implementing these **lifecycle hooks** lets you run code at the right time (fetch data, react to input changes, clean up subscriptions).

**The ones you must know:**

| Hook | When it runs | Typical use |
|---|---|---|
| `ngOnInit` | Once, after first inputs set | Initial data fetch, setup |
| `ngOnChanges` | Whenever an `@Input` changes | React to new input values |
| `ngOnDestroy` | Just before the component is removed | **Unsubscribe**, cleanup |
| `ngAfterViewInit` | After the view & child views render | Access DOM/`@ViewChild` |

```typescript
export class WidgetComponent implements OnInit, OnDestroy {
  private sub?: Subscription;
  ngOnInit() { this.sub = this.service.data$.subscribe(d => this.data = d); }
  ngOnDestroy() { this.sub?.unsubscribe(); }   // prevent a memory leak
}
```

**How it works.** During change detection, Angular invokes these hooks in a fixed order (`ngOnChanges` → `ngOnInit` → ... → `ngAfterViewInit`, and `ngOnDestroy` at teardown). Putting code in the wrong hook causes bugs — e.g., touching a `@ViewChild` in `ngOnInit` fails because the view isn't rendered yet (use `ngAfterViewInit`).

**Pitfall.** The most common real-world bug: forgetting `ngOnDestroy` cleanup, leaking subscriptions. Prefer the `async` pipe or `takeUntilDestroyed()` so you don't have to manage this manually. Also, don't put heavy work in `ngOnChanges` (it fires often).

**Interview angle.** "Why `ngOnInit` instead of the constructor for data fetching?" — the constructor is for DI/cheap setup; `ngOnInit` runs after Angular has set the inputs, so it's the correct place for initialization logic. "How do you prevent memory leaks?" — clean up in `ngOnDestroy` (or use async pipe).

---

## 13. Change Detection & Performance

**Theory.** **Change detection (CD)** is how Angular keeps the DOM in sync with your data: after any event (click, HTTP response, timer), Angular walks the component tree and updates the DOM where bound values changed. Understanding CD is the key to Angular performance.

**How it works.** Angular uses a library called **Zone.js** that patches async APIs (events, `setTimeout`, XHR). When any async task completes, Zone tells Angular "something might have changed," and Angular runs change detection from the root down the tree, comparing each binding's current value to its previous value and updating the DOM on a difference. By default this checks **every component** on every cycle — usually fast, but wasteful in large trees.

**The big optimization — `OnPush`.** Setting a component's `changeDetection: ChangeDetectionStrategy.OnPush` tells Angular: "only re-check me when my `@Input` reference changes, an event fires inside me, or an `async` pipe emits." This skips entire subtrees that can't have changed.

```typescript
@Component({
  selector: 'app-row',
  changeDetection: ChangeDetectionStrategy.OnPush,   // check only when inputs change
  template: `{{ data.name }}`,
})
export class RowComponent { @Input() data!: Item; }
```

**Why `OnPush` needs immutability.** Because `OnPush` compares input *references*, you must replace objects/arrays rather than mutating them (`this.items = [...this.items, x]`, not `this.items.push(x)`). Mutating in place keeps the same reference, so `OnPush` won't detect the change and the view goes stale.

**Other performance levers:**
- **`trackBy`** in `*ngFor` (reuse DOM nodes).
- **Lazy-load** feature routes (smaller initial bundle).
- **`async` pipe** instead of manual subscribe (fewer manual CD triggers, no leaks).
- The modern **Signals** model (next section) gives fine-grained updates without checking the whole tree.

**Interview angle.** "How does change detection work?" — Zone.js notices async events and Angular re-checks the tree, updating changed bindings. "What does `OnPush` do and what does it require?" — checks only on input reference change/events/async; requires immutable data. "Performance tips?" — `OnPush` + immutability, `trackBy`, lazy loading, signals.

---

## 14. Modules vs Standalone Components

**Theory.** Historically, Angular grouped components, directives, and pipes into **NgModules** (`@NgModule`) that declared what belonged together and what was imported. Since Angular 14+ (and the default in 17+), **standalone components** remove the need for NgModules: a component declares its own dependencies in its `imports` array and is used directly. This is now the recommended approach.

```typescript
// STANDALONE — no NgModule needed; the component imports what it uses
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, UserCardComponent],  // its own dependencies
  template: `<app-user-card *ngFor="let u of users" [name]="u.name"></app-user-card>`,
})
export class DashboardComponent { users: User[] = []; }
```

```typescript
// The OLD NgModule way (still seen in existing codebases)
@NgModule({
  declarations: [DashboardComponent, UserCardComponent],
  imports: [CommonModule, RouterModule],
  exports: [DashboardComponent],
})
export class DashboardModule {}
```

**How it works & why it changed.** NgModules added boilerplate and indirection — you had to register every component in a module's `declarations` and manage what each module imported/exported. Standalone components make each component self-describing (it lists its own imports), which is simpler to reason about, easier to lazy-load, and friendlier to newcomers.

**Pitfall.** Mixed codebases: you'll encounter both styles. A standalone component is `imported` (in another component's `imports`), while an NgModule-declared component is `declared` (in a module). Mixing them up ("component is part of the declaration of two modules" errors) is a classic beginner trap.

**Interview angle.** "NgModule vs standalone components?" — standalone (the modern default) removes NgModule boilerplate; each component declares its own imports, simplifying structure and lazy loading. Be aware NgModules still exist in older apps.

---

## 15. Signals (Modern Angular)

**Theory.** **Signals** (stable since Angular 17) are a new **reactive primitive** for state: a signal holds a value, and anything that reads it automatically tracks it, so when the value changes, only the things that depend on it update. This brings **fine-grained reactivity** — updates without relying on Zone.js scanning the whole component tree — making apps faster and the data flow easier to follow.

```typescript
import { signal, computed, effect } from '@angular/core';

export class CartComponent {
  items = signal<Item[]>([]);                         // a writable signal
  total = computed(() =>                               // derived, auto-recomputes
    this.items().reduce((sum, i) => sum + i.price, 0));

  constructor() {
    effect(() => console.log('Cart changed, total:', this.total()));  // runs on change
  }
  add(item: Item) { this.items.update(list => [...list, item]); }     // update the signal
}
```
```html
<p>Items: {{ items().length }} — Total: {{ total() }}</p>  <!-- read with () -->
```

**How it works — the three pieces.**
- **`signal(value)`** — a container you read by calling it (`items()`) and write with `.set()` / `.update()`.
- **`computed(fn)`** — a derived signal that automatically recalculates *only* when the signals it reads change (and caches otherwise).
- **`effect(fn)`** — runs a side effect whenever any signal it reads changes (logging, syncing).

Because reads are tracked precisely, Angular updates exactly the DOM bindings that depend on a changed signal — no tree-wide check. This is the future direction of Angular (eventually reducing the Zone.js dependency).

**Signals vs RxJS (a likely 2026 interview question).** Signals are great for **synchronous component state** (simple, no subscriptions, no leaks). RxJS still shines for **async streams and event composition** (HTTP, debounced search, websockets). They coexist — use signals for local state, RxJS for streams, with interop helpers (`toSignal`/`toObservable`) bridging them.

**Interview angle.** "What are signals and why were they added?" — a fine-grained reactivity primitive for state that updates only dependents, improving performance and simplicity over whole-tree change detection. "Signals vs RxJS?" — signals for sync state, RxJS for async streams; they interoperate.

---

## 16. State Management (NgRx)

**Theory.** As apps grow, sharing and coordinating state across many components gets hard. For *simple* needs, a **shared service with a `BehaviorSubject`** (or signals) is enough. For *large, complex* apps, **NgRx** provides a **Redux-style** centralized store: a single immutable state tree updated through a strict, predictable, debuggable flow.

**How it works — the NgRx data flow:**
```
Component --dispatch--> Action --> Reducer --> new State --> Selector --> Component
                          │
                          └--> Effect (async: call API) --> dispatch result Action
```
- **Store** — the single source of truth (one immutable state object).
- **Action** — a plain event describing "something happened" (`loadUsers`, `loadUsersSuccess`).
- **Reducer** — a *pure function* `(state, action) => newState` that produces the next state immutably (never mutates).
- **Selector** — a memoized query to read a slice of state efficiently.
- **Effect** — handles side effects (API calls): listens for an action, does async work, dispatches a result action.

**Example flow.** A component dispatches `loadUsers`. An **effect** catches it, calls the API, and on success dispatches `loadUsersSuccess(users)`. The **reducer** for that action returns new state with the users. A **selector** feeds those users back into any component that subscribes — all unidirectional and traceable.

**Pitfall — over-engineering.** NgRx adds significant boilerplate. Don't reach for it on a small app; a service with signals/`BehaviorSubject` is simpler and sufficient. Use NgRx when many components share complex state, you need time-travel debugging, or strict predictability across a large team.

**Interview angle.** "When do you use NgRx vs a service?" — services for simple shared state; NgRx for large apps needing a predictable, centralized, debuggable store. "Explain the NgRx flow" — action → reducer (pure) → store → selector → component, with effects for async. "Why must reducers be pure?" — predictability, testability, and so the store can track every state change.

---

## 17. Testing Angular

**Theory.** Angular ships with first-class testing support: **Jasmine** (assertion/spec framework) + **Karma** (test runner), plus the **`TestBed`** utility to create components with their dependencies injected (often mocked). Testability is a core reason DI exists — you swap real services for fakes effortlessly.

```typescript
describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  const mockService = { getUsers: () => [{ id: 1, name: 'Asha' }] };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [{ provide: UserService, useValue: mockService }],  // inject a mock
    });
    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();   // trigger change detection (runs ngOnInit, renders)
  });

  it('loads users on init', () => {
    expect(component.users.length).toBe(1);
  });
});
```

**How it works.** `TestBed` builds a miniature Angular environment: it configures a testing module, instantiates the component, and wires DI — letting you provide mock services via `{ provide: Real, useValue: mock }`. `fixture.detectChanges()` runs change detection so lifecycle hooks fire and the template renders, which you can then query and assert on.

**The testing pyramid for Angular:**
- **Unit tests** — services and component logic in isolation (fast, most numerous).
- **Component/integration tests** — component + template via `TestBed`.
- **E2E tests** — the full app in a browser (Cypress/Playwright), fewest.

**Pitfall.** Forgetting `fixture.detectChanges()` means the template never renders and `ngOnInit` may not run — your assertions test nothing. Also, prefer mocking `HttpClient` (via `HttpTestingController`) over hitting real endpoints.

**Interview angle.** "How do you test an Angular component?" — `TestBed` to create it with mocked dependencies, `detectChanges()` to render, then assert. "How does DI help testing?" — you inject mocks in place of real services without touching the component.

---

## 18. Build Tools & Angular CLI

**Theory.** The **Angular CLI** is the official command-line tool that scaffolds, builds, serves, tests, and optimizes Angular apps — a major productivity boost and a reason teams choose Angular. It enforces a consistent project structure and handles the complex build pipeline for you.

```bash
ng new my-app             # scaffold a new project (with routing, testing, etc.)
ng serve                  # dev server with live reload
ng generate component foo # scaffold a component (alias: ng g c foo)
ng generate service bar   # scaffold a service
ng build --configuration production   # optimized production build
ng test                   # run unit tests (Karma + Jasmine)
ng lint                   # lint the code
```

**How it works — the production build.** `ng build --configuration production` does **AOT (Ahead-of-Time) compilation** (compiles templates to JS at build time, not in the browser), **tree-shaking** (drops unused code), **minification**, and **bundling** — producing small, fast assets. AOT also catches template errors at build time instead of at runtime.

**JIT vs AOT (interview point):**
- **JIT (Just-in-Time)** — compiles templates in the browser at runtime (old dev default; slower startup, bigger bundle).
- **AOT (Ahead-of-Time)** — compiles at build time (the default now; faster, smaller, errors caught early). Production always uses AOT.

**Pitfall.** Shipping a dev build to production (no AOT/minification) gives slow load times and a huge bundle. Always build with the production configuration. Watch bundle size — lazy-load routes and check the `ng build` size report.

**Interview angle.** "What does the Angular CLI do?" — scaffold, serve, build, test, and optimize. "AOT vs JIT?" — AOT compiles at build time (faster, smaller, errors caught early) and is the production default; JIT compiles in the browser.

---

## 19. Angular vs React

**Theory.** A near-guaranteed question if the role touches both. Frame it as **framework vs library** and trade-offs, not "which is better."

| Aspect | Angular | React |
|---|---|---|
| Type | Full **framework** (batteries included) | UI **library** (assemble your own stack) |
| Language | TypeScript (first-class) | JavaScript or TypeScript |
| Structure | Opinionated, consistent | Flexible, you decide |
| DI | Built-in, powerful | Not built-in (use context/props) |
| Data flow | Two-way binding available | One-way by default |
| Reactivity | RxJS + Signals + Zone.js CD | Hooks + virtual DOM diffing |
| Routing/HTTP/Forms | Built-in | Separate libraries |
| Learning curve | Steeper (more concepts) | Gentler core, choices add up |
| Best fit | Large enterprise apps, big teams | Anything from widgets to large apps |

**How to answer well.** "Angular gives you a complete, consistent framework with DI, routing, forms, and HTTP built in and TypeScript throughout — great for large teams that value uniformity. React is a focused UI library you compose with your chosen tools — more flexibility, lighter core. Angular has a steeper learning curve but less decision-making; React is quicker to start but you assemble the ecosystem yourself."

**Interview angle.** Don't say one is "better." Show you understand the trade-off (consistency/built-ins vs flexibility/ecosystem) and can pick based on team size, app scale, and need for structure.

---

## 20. Coding Problems & Patterns

**1. Debounced search (RxJS) — the canonical Angular task:**
```typescript
search = new FormControl('');
results$ = this.search.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => this.api.search(term ?? '')),
);
// template: <div *ngFor="let r of results$ | async">{{ r.name }}</div>
```

**2. Reusable confirm dialog via a service** — encapsulate shared UI/logic in an injectable service, return an Observable the caller subscribes to for the result.

**3. Custom structural directive** (e.g., `*appIfRole="'admin'"`) — show/hide content based on a condition; demonstrates understanding of `TemplateRef`/`ViewContainerRef`.

**4. `OnPush` + immutable update** — given a list component, make it `OnPush` and update the list with `this.items = [...this.items, newItem]` (not `.push`) so change detection fires.

**5. Parent–child with `@Input`/`@Output`** — a list (parent) renders rows (child); each row emits a `delete` event the parent handles. Classic whiteboard component task.

**Tips:** narrate your reasoning, use the `async` pipe to avoid leaks, prefer reactive forms, and mention `trackBy`/`OnPush` for performance — interviewers love unprompted performance awareness.

---

## 21. Interview Q&A

**Q1. Angular vs AngularJS vs React?**
Angular (2+) is a modern TypeScript framework; AngularJS (1.x) is the retired, architecturally different predecessor; React is a UI library, not a full framework.

**Q2. Explain the four types of data binding.**
Interpolation `{{ }}` and property `[ ]` (class→view), event `( )` (view→class), two-way `[( )]` (both — sugar for property + event binding).

**Q3. What is dependency injection and why does Angular use it?**
The framework creates and supplies dependencies (services) to classes instead of them constructing their own — giving testability, loose coupling, and easy singletons (`providedIn: 'root'`).

**Q4. Observable vs Promise?**
Observable = lazy, multiple values over time, cancelable, composable with operators; Promise = eager, single value, not cancelable. Angular APIs (HTTP, router, forms) return Observables.

**Q5. What is `switchMap` and when do you use it?**
It maps to an inner Observable and **cancels the previous** one when a new value arrives — ideal for type-ahead search so only the latest request's results are used.

**Q6. How do you prevent subscription memory leaks?**
Use the `async` pipe, `takeUntilDestroyed()`, or unsubscribe in `ngOnDestroy`.

**Q7. How does change detection work, and what is `OnPush`?**
Zone.js notifies Angular of async events; Angular re-checks bindings down the tree and updates the DOM. `OnPush` limits checks to input reference changes/events/async emissions and requires immutable data.

**Q8. Template-driven vs reactive forms?**
Template-driven (logic in HTML, simple forms) vs reactive (model in code, complex/dynamic, testable). Prefer reactive for non-trivial forms.

**Q9. `ngOnInit` vs constructor?**
Constructor is for DI and cheap setup; `ngOnInit` runs after inputs are set — the right place for initialization like data loading.

**Q10. NgModules vs standalone components?**
Standalone (modern default) removes NgModule boilerplate — each component declares its own imports; simpler and better for lazy loading.

**Q11. What are signals?**
A fine-grained reactivity primitive for state (`signal`, `computed`, `effect`) that updates only dependents — faster and simpler than whole-tree change detection; complements RxJS (sync state vs async streams).

**Q12. What is an HTTP interceptor?**
A function in the request/response pipeline used for cross-cutting concerns — attaching auth headers, logging, and global error handling.

**Q13. When would you use NgRx?**
For large apps with complex shared state needing a predictable, centralized, debuggable store; for simple cases a service with `BehaviorSubject`/signals is enough.

**Q14. AOT vs JIT?**
AOT compiles templates at build time (smaller, faster, errors caught early — production default); JIT compiles in the browser at runtime.

**Q15. What does `trackBy` do in `*ngFor`?**
Gives Angular a stable identity per item so it reuses DOM nodes instead of re-rendering the whole list — a key performance optimization (like React's `key`).
