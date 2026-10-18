# System Design LLD — Python Edition
### SOLID + Design Patterns + Real-World Problems in Python

---

## TABLE OF CONTENTS
1. [SOLID Principles in Python](#1-solid-principles-in-python)
2. [Other Design Principles](#2-other-design-principles)
3. [Design Patterns in Python](#3-design-patterns-in-python)
4. [Python-Specific OOP Patterns](#4-python-specific-oop-patterns)
5. [LLD Problems in Python](#5-lld-problems-in-python)
6. [How to Approach LLD in Python Interviews](#6-how-to-approach-lld-in-python-interviews)
7. [Interview Q&A](#7-interview-qa)

---

## 1. SOLID Principles in Python

**Theory.** SOLID is five object-oriented design principles that make code easy to change, test, and extend — the backbone of good Low-Level Design. The principles are language-agnostic, but Python expresses them with lighter machinery than Java: structural typing via `typing.Protocol` (no explicit `implements`), `@dataclass` to cut entity boilerplate, and duck typing that often removes the need for formal interfaces. Treat them as a review checklist — a violation almost always appears as code that's hard to modify without breaking something else. The mnemonic spells **SOLID**: **S**ingle Responsibility (one reason to change), **O**pen/Closed (extend without modifying), **L**iskov Substitution (subtypes are drop-in replacements), **I**nterface Segregation (small, focused interfaces), and **D**ependency Inversion (depend on abstractions, inject concretions).

### S — Single Responsibility Principle
```python
# BAD: One class doing too much
class UserManager:
    def get_user(self, user_id: int): ...
    def save_to_database(self, user): ...      # persistence concern
    def send_welcome_email(self, user): ...    # email concern
    def generate_report(self, user): ...       # report concern
    def validate_user(self, user): ...         # validation concern

# GOOD: Each class has one clear job
class UserRepository:
    def get(self, user_id: int) -> User: ...
    def save(self, user: User) -> None: ...

class EmailService:
    def send_welcome(self, user: User) -> None: ...

class UserValidator:
    def validate(self, user: User) -> list[str]: ...  # returns errors

class ReportGenerator:
    def generate_user_report(self, user: User) -> str: ...
```

### O — Open/Closed Principle
```python
# BAD: must modify existing class to add new discount
class DiscountCalculator:
    def calculate(self, order, discount_type: str) -> float:
        if discount_type == "seasonal":
            return order.total * 0.10
        elif discount_type == "loyalty":
            return order.total * 0.15
        elif discount_type == "flash":            # adding new type = modifying class
            return order.total * 0.20
        return 0

# GOOD: add new discount by adding new class, not modifying existing
from abc import ABC, abstractmethod

class DiscountStrategy(ABC):
    @abstractmethod
    def calculate(self, order_total: float) -> float:
        ...

class SeasonalDiscount(DiscountStrategy):
    def calculate(self, order_total: float) -> float:
        return order_total * 0.10

class LoyaltyDiscount(DiscountStrategy):
    def calculate(self, order_total: float) -> float:
        return order_total * 0.15

class FlashDiscount(DiscountStrategy):  # NEW: no modification to existing code
    def calculate(self, order_total: float) -> float:
        return order_total * 0.20

class DiscountCalculator:
    def __init__(self, strategy: DiscountStrategy):
        self._strategy = strategy

    def calculate(self, order_total: float) -> float:
        return self._strategy.calculate(order_total)
```

### L — Liskov Substitution Principle
```python
# BAD: Square breaks Rectangle contract
class Rectangle:
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height

    def area(self) -> float:
        return self.width * self.height

class Square(Rectangle):           # LSP violation!
    def __init__(self, side: float):
        super().__init__(side, side)

    @Rectangle.width.setter
    def width(self, value: float):
        self._width = value
        self._height = value        # breaks Rectangle expectation

# GOOD: use abstraction hierarchy
class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

class Rectangle(Shape):
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height
    def area(self) -> float:
        return self.width * self.height

class Square(Shape):                # independent — not inheriting Rectangle
    def __init__(self, side: float):
        self.side = side
    def area(self) -> float:
        return self.side ** 2
```

### I — Interface Segregation Principle
```python
# BAD: fat ABC forces unrelated implementations
class Animal(ABC):
    @abstractmethod
    def eat(self): ...
    @abstractmethod
    def walk(self): ...
    @abstractmethod
    def fly(self): ...   # Fish and dogs can't fly!
    @abstractmethod
    def swim(self): ...  # Not all animals swim

# GOOD: segregated interfaces (Python uses Protocol for structural typing)
from typing import Protocol

class Walkable(Protocol):
    def walk(self) -> None: ...

class Flyable(Protocol):
    def fly(self) -> None: ...

class Swimmable(Protocol):
    def swim(self) -> None: ...

class Dog:
    def walk(self) -> None: print("Dog walking")
    def swim(self) -> None: print("Dog swimming")

class Eagle:
    def walk(self) -> None: print("Eagle walking")
    def fly(self) -> None: print("Eagle flying")

class Fish:
    def swim(self) -> None: print("Fish swimming")

# Functions use only what they need
def make_fly(animal: Flyable) -> None:
    animal.fly()   # Dog would cause AttributeError, type checker catches it
```

### D — Dependency Inversion Principle
```python
# BAD: high-level depends on low-level
class OrderService:
    def __init__(self):
        self.repo = MySQLOrderRepository()    # tight coupling!
        self.notifier = SMSNotifier()         # tight coupling!

# GOOD: depend on abstractions
from abc import ABC, abstractmethod

class OrderRepository(ABC):
    @abstractmethod
    async def save(self, order: Order) -> Order: ...
    @abstractmethod
    async def get_by_id(self, order_id: int) -> Order | None: ...

class NotificationService(ABC):
    @abstractmethod
    async def notify(self, user_id: int, message: str) -> None: ...

class OrderService:
    def __init__(
        self,
        repo: OrderRepository,        # depends on abstraction
        notifier: NotificationService # depends on abstraction
    ):
        self._repo = repo
        self._notifier = notifier

    async def create_order(self, data: dict) -> Order:
        order = Order(**data)
        saved = await self._repo.save(order)
        await self._notifier.notify(order.user_id, f"Order #{saved.id} confirmed!")
        return saved

# Inject concrete implementations (FastAPI DI or manual)
class PostgresOrderRepository(OrderRepository): ...
class EmailNotifier(NotificationService): ...

# Test with mocks
class MockOrderRepository(OrderRepository):
    async def save(self, order): return order
    async def get_by_id(self, id): return None
```

---

## 2. Other Design Principles

```python
# DRY — Don't Repeat Yourself
# BAD
def validate_email_for_register(email: str) -> bool:
    import re
    return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))

def validate_email_for_login(email: str) -> bool:   # DUPLICATE!
    import re
    return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))

# GOOD
import re
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

def is_valid_email(email: str) -> bool:
    return bool(EMAIL_REGEX.match(email))

# KISS — Keep It Simple
# BAD: over-engineered
class AbstractUserCreationFactoryManagerSingleton:
    _instance = None
    def create_user_entity_from_data_transfer_object(self, dto): ...

# GOOD
class UserService:
    def create_user(self, data: dict) -> User: ...

# Law of Demeter
# BAD: trains of method calls
user.get_wallet().get_balance().deduct(price)

# GOOD: delegation
user.pay(price)  # User.pay() internally handles wallet/balance
```

---

## 3. Design Patterns in Python

**Theory.** Design patterns are **named, reusable solutions to recurring design problems** — a shared vocabulary that conveys an entire structure in a word. The classic Gang-of-Four catalog splits into **Creational** (how objects are made — Singleton, Factory, Builder), **Structural** (how objects are composed — Decorator, Proxy, Adapter, Facade), and **Behavioral** (how objects interact — Strategy, Observer, State, Template Method, Chain of Responsibility). What's distinctive in Python is that the language already *gives* you several patterns for free: a **module is a natural Singleton**, **first-class functions and decorators** replace many Strategy/Decorator class hierarchies, and **duck typing/Protocols** make the "program to an interface" advice almost effortless. So apply patterns where they clarify intent — but reach for Python's built-in idioms first rather than porting verbose Java structures.

### Creational Patterns

#### Singleton
```python
# Method 1: Module-level instance (Pythonic — modules are singletons!)
# config.py
class _Config:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        self.debug = os.getenv("DEBUG", "false").lower() == "true"

config = _Config()   # import config; config.db_url

# Method 2: Metaclass
class SingletonMeta(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class DatabasePool(metaclass=SingletonMeta):
    def __init__(self):
        self.connections = []

db = DatabasePool()
db2 = DatabasePool()
assert db is db2   # True

# Method 3: Class variable with classmethod
class Logger:
    _instance: "Logger | None" = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# Method 4: Thread-safe with threading.Lock
import threading

class ThreadSafeSingleton:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:   # double-checked
                    cls._instance = super().__new__(cls)
        return cls._instance
```

#### Factory Method
```python
from abc import ABC, abstractmethod
from enum import Enum

class PaymentMethod(str, Enum):
    CREDIT_CARD = "credit_card"
    UPI = "upi"
    WALLET = "wallet"
    NET_BANKING = "net_banking"

class PaymentProcessor(ABC):
    @abstractmethod
    def process(self, amount: float) -> dict: ...

    @abstractmethod
    def refund(self, transaction_id: str) -> dict: ...

class CreditCardProcessor(PaymentProcessor):
    def process(self, amount: float) -> dict:
        return {"status": "success", "method": "credit_card", "amount": amount}
    def refund(self, transaction_id: str) -> dict: ...

class UPIProcessor(PaymentProcessor):
    def process(self, amount: float) -> dict:
        return {"status": "success", "method": "upi", "amount": amount}
    def refund(self, transaction_id: str) -> dict: ...

class PaymentProcessorFactory:
    _registry: dict[PaymentMethod, type[PaymentProcessor]] = {
        PaymentMethod.CREDIT_CARD: CreditCardProcessor,
        PaymentMethod.UPI: UPIProcessor,
    }

    @classmethod
    def create(cls, method: PaymentMethod) -> PaymentProcessor:
        processor_class = cls._registry.get(method)
        if not processor_class:
            raise ValueError(f"Unsupported payment method: {method}")
        return processor_class()

    @classmethod
    def register(cls, method: PaymentMethod, processor: type[PaymentProcessor]):
        """Allow extending without modifying factory (OCP)."""
        cls._registry[method] = processor

# Usage
processor = PaymentProcessorFactory.create(PaymentMethod.UPI)
processor.process(500.0)
```

#### Builder Pattern
```python
from dataclasses import dataclass, field
from typing import Self

@dataclass
class QueryBuilder:
    _table: str = ""
    _conditions: list[str] = field(default_factory=list)
    _columns: list[str] = field(default_factory=list)
    _order_by: str | None = None
    _limit: int | None = None
    _offset: int | None = None
    _params: dict = field(default_factory=dict)

    def select(self, *columns: str) -> Self:
        self._columns.extend(columns)
        return self

    def from_table(self, table: str) -> Self:
        self._table = table
        return self

    def where(self, condition: str, **params) -> Self:
        self._conditions.append(condition)
        self._params.update(params)
        return self

    def order_by(self, column: str, desc: bool = False) -> Self:
        self._order_by = f"{column} {'DESC' if desc else 'ASC'}"
        return self

    def limit(self, n: int) -> Self:
        self._limit = n
        return self

    def offset(self, n: int) -> Self:
        self._offset = n
        return self

    def build(self) -> tuple[str, dict]:
        cols = ", ".join(self._columns) if self._columns else "*"
        sql = f"SELECT {cols} FROM {self._table}"
        if self._conditions:
            sql += " WHERE " + " AND ".join(self._conditions)
        if self._order_by:
            sql += f" ORDER BY {self._order_by}"
        if self._limit is not None:
            sql += f" LIMIT {self._limit}"
        if self._offset is not None:
            sql += f" OFFSET {self._offset}"
        return sql, self._params

# Usage — fluent interface
sql, params = (
    QueryBuilder()
    .select("id", "name", "email")
    .from_table("users")
    .where("status = :status", status="active")
    .where("age >= :min_age", min_age=18)
    .order_by("created_at", desc=True)
    .limit(20)
    .offset(0)
    .build()
)
```

### Structural Patterns

#### Decorator Pattern (via Python's actual decorators)
```python
import time, functools, logging
from typing import Callable, TypeVar, ParamSpec

P = ParamSpec("P")
T = TypeVar("T")

def retry(max_attempts: int = 3, delay: float = 1.0,
          exceptions: tuple = (Exception,)):
    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @functools.wraps(func)
        async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    if attempt == max_attempts - 1:
                        raise
                    wait = delay * (2 ** attempt)
                    logging.warning(f"Attempt {attempt+1} failed: {e}. Retrying in {wait}s")
                    await asyncio.sleep(wait)
        return async_wrapper
    return decorator

def timed(func: Callable[P, T]) -> Callable[P, T]:
    @functools.wraps(func)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        start = time.perf_counter()
        result = await func(*args, **kwargs)
        duration = time.perf_counter() - start
        logging.info(f"{func.__name__} completed in {duration:.3f}s")
        return result
    return wrapper

def validate_input(schema):
    """Validate function arguments against a Pydantic schema."""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            validated = schema(**kwargs)
            return await func(*args, **validated.model_dump())
        return wrapper
    return decorator

# Stack decorators
@retry(max_attempts=3, exceptions=(ConnectionError, TimeoutError))
@timed
async def call_external_api(url: str, data: dict) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=data)
        response.raise_for_status()
        return response.json()
```

#### Proxy Pattern
```python
# Caching Proxy
from typing import Any

class CachingProxy:
    """Lazy-loading caching proxy for expensive operations."""

    def __init__(self, subject, cache_ttl: int = 300):
        self._subject = subject
        self._cache: dict[str, tuple[Any, float]] = {}
        self._ttl = cache_ttl

    def __getattr__(self, name: str):
        attr = getattr(self._subject, name)
        if not callable(attr):
            return attr

        @functools.wraps(attr)
        def cached_method(*args, **kwargs):
            key = f"{name}:{args}:{sorted(kwargs.items())}"
            now = time.time()
            if key in self._cache:
                value, timestamp = self._cache[key]
                if now - timestamp < self._ttl:
                    return value
            result = attr(*args, **kwargs)
            self._cache[key] = (result, now)
            return result
        return cached_method

# Access Control Proxy
class SecureUserService:
    def __init__(self, service: UserService, current_user: User):
        self._service = service
        self._user = current_user

    def get_user(self, user_id: int) -> User:
        if self._user.role != "ADMIN" and self._user.id != user_id:
            raise PermissionError("Cannot access other users' data")
        return self._service.get_user(user_id)
```

#### Observer Pattern
```python
from typing import Callable, Any
import asyncio

class EventEmitter:
    """Event-driven pub/sub within a single process."""

    def __init__(self):
        self._handlers: dict[str, list[Callable]] = {}

    def on(self, event: str, handler: Callable) -> "EventEmitter":
        self._handlers.setdefault(event, []).append(handler)
        return self

    def off(self, event: str, handler: Callable) -> None:
        if event in self._handlers:
            self._handlers[event].remove(handler)

    async def emit(self, event: str, *args, **kwargs) -> None:
        for handler in self._handlers.get(event, []):
            if asyncio.iscoroutinefunction(handler):
                await handler(*args, **kwargs)
            else:
                handler(*args, **kwargs)

# Domain events
class OrderEvents(EventEmitter):
    ORDER_CREATED = "order.created"
    ORDER_PAID = "order.paid"
    ORDER_SHIPPED = "order.shipped"
    ORDER_CANCELLED = "order.cancelled"

events = OrderEvents()

# Register handlers
async def on_order_created(order: dict):
    await send_confirmation_email(order["user_id"])

async def on_order_created_inventory(order: dict):
    await reserve_inventory(order["items"])

events.on(OrderEvents.ORDER_CREATED, on_order_created)
events.on(OrderEvents.ORDER_CREATED, on_order_created_inventory)
events.on(OrderEvents.ORDER_PAID, lambda order: update_analytics(order))

# Emit in service
async def create_order(data: dict) -> dict:
    order = await order_repo.save(data)
    await events.emit(OrderEvents.ORDER_CREATED, order)
    return order
```

#### Strategy Pattern
```python
from typing import Protocol

class SortStrategy(Protocol):
    def sort(self, data: list[int]) -> list[int]: ...

class BubbleSort:
    def sort(self, data: list[int]) -> list[int]:
        arr = data.copy()
        n = len(arr)
        for i in range(n):
            for j in range(0, n-i-1):
                if arr[j] > arr[j+1]:
                    arr[j], arr[j+1] = arr[j+1], arr[j]
        return arr

class QuickSort:
    def sort(self, data: list[int]) -> list[int]:
        if len(data) <= 1:
            return data
        pivot = data[len(data) // 2]
        left = [x for x in data if x < pivot]
        mid = [x for x in data if x == pivot]
        right = [x for x in data if x > pivot]
        return self.sort(left) + mid + self.sort(right)

class Sorter:
    def __init__(self, strategy: SortStrategy):
        self._strategy = strategy

    def set_strategy(self, strategy: SortStrategy) -> None:
        self._strategy = strategy

    def sort(self, data: list[int]) -> list[int]:
        return self._strategy.sort(data)

sorter = Sorter(QuickSort())
result = sorter.sort([3, 1, 4, 1, 5, 9, 2, 6])
```

#### Template Method
```python
class DataExporter(ABC):
    """Template method defines the skeleton; subclasses fill in steps."""

    def export(self, data: list[dict], filename: str) -> str:
        """Template method — do not override."""
        validated = self._validate(data)
        transformed = self._transform(validated)
        formatted = self._format(transformed)
        path = self._save(formatted, filename)
        self._notify(path)
        return path

    def _validate(self, data: list[dict]) -> list[dict]:
        """Default: filter out empty records."""
        return [d for d in data if d]

    @abstractmethod
    def _transform(self, data: list[dict]) -> Any: ...

    @abstractmethod
    def _format(self, data: Any) -> str: ...

    def _save(self, content: str, filename: str) -> str:
        path = f"/exports/{filename}"
        with open(path, "w") as f:
            f.write(content)
        return path

    def _notify(self, path: str) -> None:
        pass  # optional hook

class CSVExporter(DataExporter):
    def _transform(self, data): return data  # no transform needed
    def _format(self, data) -> str:
        import csv, io
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        return output.getvalue()

class JSONExporter(DataExporter):
    def _transform(self, data): return data
    def _format(self, data) -> str:
        return json.dumps(data, indent=2, default=str)
```

#### Chain of Responsibility
```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class Request:
    user_role: str
    amount: float
    department: str

class ApprovalHandler(ABC):
    def __init__(self, successor: Optional["ApprovalHandler"] = None):
        self._successor = successor

    @abstractmethod
    def handle(self, request: Request) -> str | None: ...

    def pass_to_next(self, request: Request) -> str | None:
        if self._successor:
            return self._successor.handle(request)
        return None

class TeamLeadApproval(ApprovalHandler):
    LIMIT = 5_000

    def handle(self, request: Request) -> str | None:
        if request.amount <= self.LIMIT:
            return f"Team Lead approved ${request.amount}"
        return self.pass_to_next(request)

class ManagerApproval(ApprovalHandler):
    LIMIT = 25_000

    def handle(self, request: Request) -> str | None:
        if request.amount <= self.LIMIT:
            return f"Manager approved ${request.amount}"
        return self.pass_to_next(request)

class DirectorApproval(ApprovalHandler):
    def handle(self, request: Request) -> str | None:
        return f"Director approved ${request.amount} for {request.department}"

# Build chain
chain = TeamLeadApproval(ManagerApproval(DirectorApproval()))
print(chain.handle(Request("engineer", 3000, "Engineering")))   # Team Lead
print(chain.handle(Request("engineer", 15000, "Engineering")))  # Manager
print(chain.handle(Request("engineer", 50000, "Engineering")))  # Director
```

---

## 4. Python-Specific OOP Patterns

### Context Manager as Resource Pattern
```python
from contextlib import asynccontextmanager

class DatabaseTransaction:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def __aenter__(self) -> AsyncSession:
        await self.session.begin()
        return self.session

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await self.session.rollback()
        else:
            await self.session.commit()
        return False  # don't suppress exceptions

# Usage
async with DatabaseTransaction(db) as session:
    user = await session.get(User, user_id)
    user.balance -= amount
    order = Order(user_id=user_id, total=amount)
    session.add(order)
# auto commit or rollback

# Functional context manager
@asynccontextmanager
async def acquire_resource(resource_id: str):
    lock_id = await redis.acquire_lock(f"resource:{resource_id}")
    if not lock_id:
        raise ResourceLockError(f"Cannot acquire lock for {resource_id}")
    try:
        yield resource_id
    finally:
        await redis.release_lock(f"resource:{resource_id}", lock_id)

async with acquire_resource("account-123") as resource:
    await process_resource(resource)
```

### Descriptor Protocol
```python
class Validated:
    """Descriptor for validated attributes."""

    def __set_name__(self, owner, name: str):
        self.name = f"_{name}"
        self.public_name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.name, None)

    def __set__(self, obj, value):
        self.validate(value)
        setattr(obj, self.name, value)

    def validate(self, value): ...

class PositiveNumber(Validated):
    def validate(self, value):
        if not isinstance(value, (int, float)) or value <= 0:
            raise ValueError(f"{self.public_name} must be a positive number")

class NonEmptyString(Validated):
    def validate(self, value):
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"{self.public_name} cannot be empty")

class Product:
    name = NonEmptyString()
    price = PositiveNumber()
    quantity = PositiveNumber()

    def __init__(self, name: str, price: float, quantity: int):
        self.name = name
        self.price = price
        self.quantity = quantity

p = Product("Laptop", 50000, 5)   # OK
p = Product("", 50000, 5)          # ValueError: name cannot be empty
p = Product("Laptop", -100, 5)    # ValueError: price must be a positive number
```

### Mixin Pattern
```python
class TimestampMixin:
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def touch(self):
        self.updated_at = datetime.utcnow()

class SoftDeleteMixin:
    is_deleted: bool = False
    deleted_at: datetime | None = None

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()

    @property
    def is_active(self) -> bool:
        return not self.is_deleted

class SerializeMixin:
    def to_dict(self) -> dict:
        from dataclasses import asdict
        return asdict(self)

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), default=str)

    @classmethod
    def from_dict(cls, data: dict):
        return cls(**data)

@dataclass
class User(TimestampMixin, SoftDeleteMixin, SerializeMixin):
    id: int
    name: str
    email: str

u = User(id=1, name="Alice", email="alice@example.com")
u.to_json()     # includes created_at, updated_at, is_deleted
u.soft_delete() # sets is_deleted=True, deleted_at=now
```

### Repository Pattern
```python
from abc import ABC, abstractmethod
from typing import Generic, TypeVar

ModelT = TypeVar("ModelT")
IdT = TypeVar("IdT")

class BaseRepository(ABC, Generic[ModelT, IdT]):
    @abstractmethod
    async def get(self, id: IdT) -> ModelT | None: ...

    @abstractmethod
    async def get_all(self) -> list[ModelT]: ...

    @abstractmethod
    async def save(self, entity: ModelT) -> ModelT: ...

    @abstractmethod
    async def delete(self, id: IdT) -> bool: ...

class SQLUserRepository(BaseRepository[User, int]):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get(self, user_id: int) -> User | None:
        return await self.session.get(User, user_id)

    async def get_all(self) -> list[User]:
        result = await self.session.execute(select(User))
        return result.scalars().all()

    async def save(self, user: User) -> User:
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def delete(self, user_id: int) -> bool:
        user = await self.get(user_id)
        if not user:
            return False
        await self.session.delete(user)
        return True

class InMemoryUserRepository(BaseRepository[User, int]):
    """For testing — no DB needed."""
    def __init__(self):
        self._store: dict[int, User] = {}
        self._counter = 0

    async def get(self, user_id: int) -> User | None:
        return self._store.get(user_id)

    async def get_all(self) -> list[User]:
        return list(self._store.values())

    async def save(self, user: User) -> User:
        if not user.id:
            self._counter += 1
            user.id = self._counter
        self._store[user.id] = user
        return user

    async def delete(self, user_id: int) -> bool:
        return self._store.pop(user_id, None) is not None
```

---

## 5. LLD Problems in Python

### Problem 1: Parking Lot
```python
from enum import Enum, auto
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import threading

class VehicleType(Enum):
    MOTORCYCLE = auto()
    CAR = auto()
    TRUCK = auto()

class SpotType(Enum):
    MOTORCYCLE = auto()
    COMPACT = auto()
    LARGE = auto()

VEHICLE_TO_SPOT = {
    VehicleType.MOTORCYCLE: SpotType.MOTORCYCLE,
    VehicleType.CAR: SpotType.COMPACT,
    VehicleType.TRUCK: SpotType.LARGE,
}

SPOT_RATES = {   # per minute
    SpotType.MOTORCYCLE: 0.01,
    SpotType.COMPACT:    0.02,
    SpotType.LARGE:      0.03,
}

@dataclass
class Vehicle:
    plate: str
    vehicle_type: VehicleType

@dataclass
class ParkingSpot:
    spot_id: str
    spot_type: SpotType
    vehicle: Optional[Vehicle] = None

    @property
    def is_available(self) -> bool:
        return self.vehicle is None

    def park(self, vehicle: Vehicle) -> None:
        if not self.is_available:
            raise ValueError(f"Spot {self.spot_id} is occupied")
        self.vehicle = vehicle

    def release(self) -> Vehicle:
        vehicle = self.vehicle
        self.vehicle = None
        return vehicle

@dataclass
class Ticket:
    ticket_id: str
    vehicle: Vehicle
    spot: ParkingSpot
    entry_time: datetime = field(default_factory=datetime.now)
    exit_time: Optional[datetime] = None

    def calculate_fee(self) -> float:
        duration = (self.exit_time or datetime.now() - self.entry_time).total_seconds() / 60
        return duration * SPOT_RATES[self.spot.spot_type]

@dataclass
class ParkingFloor:
    floor_num: int
    spots: list[ParkingSpot] = field(default_factory=list)

    def find_available(self, spot_type: SpotType) -> Optional[ParkingSpot]:
        return next(
            (s for s in self.spots if s.spot_type == spot_type and s.is_available),
            None
        )

    def available_count(self, spot_type: SpotType) -> int:
        return sum(1 for s in self.spots if s.spot_type == spot_type and s.is_available)

class ParkingLot:
    _instance: Optional["ParkingLot"] = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._floors = []
                cls._instance._active_tickets: dict[str, Ticket] = {}
                cls._instance._ticket_counter = 0
        return cls._instance

    def add_floor(self, floor: ParkingFloor) -> None:
        self._floors.append(floor)

    def park_vehicle(self, vehicle: Vehicle) -> Ticket:
        required = VEHICLE_TO_SPOT[vehicle.vehicle_type]
        with self._lock:
            for floor in self._floors:
                spot = floor.find_available(required)
                if spot:
                    spot.park(vehicle)
                    self._ticket_counter += 1
                    ticket_id = f"TKT-{self._ticket_counter:06d}"
                    ticket = Ticket(ticket_id=ticket_id, vehicle=vehicle, spot=spot)
                    self._active_tickets[ticket_id] = ticket
                    return ticket
        raise Exception("Parking lot is full for this vehicle type")

    def exit_vehicle(self, ticket_id: str) -> float:
        with self._lock:
            ticket = self._active_tickets.pop(ticket_id, None)
            if not ticket:
                raise ValueError(f"Invalid ticket: {ticket_id}")
            ticket.exit_time = datetime.now()
            ticket.spot.release()
            fee = ticket.calculate_fee()
            return fee

    def get_availability(self) -> dict:
        return {
            floor.floor_num: {
                spot_type.name: floor.available_count(spot_type)
                for spot_type in SpotType
            }
            for floor in self._floors
        }
```

### Problem 2: Vending Machine (State Pattern)
```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal

@dataclass
class Product:
    name: str
    price: Decimal
    quantity: int

class VendingMachineState(ABC):
    @abstractmethod
    def insert_coin(self, machine: "VendingMachine", amount: Decimal) -> str: ...
    @abstractmethod
    def select_product(self, machine: "VendingMachine", product_id: str) -> str: ...
    @abstractmethod
    def dispense(self, machine: "VendingMachine") -> str: ...
    @abstractmethod
    def refund(self, machine: "VendingMachine") -> Decimal: ...

class IdleState(VendingMachineState):
    def insert_coin(self, machine, amount):
        machine.balance += amount
        machine.set_state(HasMoneyState())
        return f"Inserted ₹{amount}. Balance: ₹{machine.balance}"
    def select_product(self, machine, product_id):
        return "Please insert coins first"
    def dispense(self, machine):
        return "Please insert coins and select a product"
    def refund(self, machine):
        return Decimal("0")

class HasMoneyState(VendingMachineState):
    def insert_coin(self, machine, amount):
        machine.balance += amount
        return f"Added ₹{amount}. Balance: ₹{machine.balance}"

    def select_product(self, machine, product_id):
        product = machine.products.get(product_id)
        if not product:
            return "Product not found"
        if product.quantity == 0:
            return "Product out of stock"
        if machine.balance < product.price:
            return f"Insufficient balance. Need ₹{product.price - machine.balance} more"
        machine.selected_product = product
        machine.set_state(ProductSelectedState())
        return f"Selected: {product.name} (₹{product.price})"

    def dispense(self, machine):
        return "Please select a product first"

    def refund(self, machine):
        amount = machine.balance
        machine.balance = Decimal("0")
        machine.set_state(IdleState())
        return amount

class ProductSelectedState(VendingMachineState):
    def insert_coin(self, machine, amount):
        machine.balance += amount
        return f"Added ₹{amount}. Balance: ₹{machine.balance}"

    def select_product(self, machine, product_id):
        return "Product already selected. Press dispense or refund"

    def dispense(self, machine):
        product = machine.selected_product
        change = machine.balance - product.price
        product.quantity -= 1
        machine.balance = Decimal("0")
        machine.selected_product = None
        machine.set_state(IdleState())
        return f"Dispensing {product.name}. Change: ₹{change}"

    def refund(self, machine):
        amount = machine.balance
        machine.balance = Decimal("0")
        machine.selected_product = None
        machine.set_state(IdleState())
        return amount

class VendingMachine:
    def __init__(self):
        self._state: VendingMachineState = IdleState()
        self.balance: Decimal = Decimal("0")
        self.products: dict[str, Product] = {}
        self.selected_product: Product | None = None

    def set_state(self, state: VendingMachineState) -> None:
        self._state = state

    def load_product(self, product_id: str, product: Product) -> None:
        self.products[product_id] = product

    def insert_coin(self, amount: float) -> str:
        return self._state.insert_coin(self, Decimal(str(amount)))

    def select_product(self, product_id: str) -> str:
        return self._state.select_product(self, product_id)

    def dispense(self) -> str:
        return self._state.dispense(self)

    def refund(self) -> Decimal:
        return self._state.refund(self)
```

### Problem 3: Library Management System
```python
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

class BookStatus(Enum):
    AVAILABLE = "available"
    BORROWED = "borrowed"
    RESERVED = "reserved"
    LOST = "lost"

@dataclass
class Book:
    isbn: str
    title: str
    author: str
    copies: int = 1
    available_copies: int = field(init=False)
    status: BookStatus = BookStatus.AVAILABLE

    def __post_init__(self):
        self.available_copies = self.copies

@dataclass
class Member:
    member_id: str
    name: str
    email: str
    max_borrow_limit: int = 5
    borrowed_books: list["BorrowRecord"] = field(default_factory=list)
    fine: float = 0.0

    @property
    def active_borrows(self) -> list["BorrowRecord"]:
        return [r for r in self.borrowed_books if r.return_date is None]

    def can_borrow(self) -> bool:
        return len(self.active_borrows) < self.max_borrow_limit and self.fine == 0

@dataclass
class BorrowRecord:
    record_id: str
    book: Book
    member: Member
    borrow_date: datetime = field(default_factory=datetime.now)
    due_date: datetime = field(init=False)
    return_date: datetime | None = None
    LOAN_DAYS: int = 14
    FINE_PER_DAY: float = 2.0

    def __post_init__(self):
        self.due_date = self.borrow_date + timedelta(days=self.LOAN_DAYS)

    @property
    def is_overdue(self) -> bool:
        return self.return_date is None and datetime.now() > self.due_date

    def calculate_fine(self) -> float:
        if not self.is_overdue:
            return 0.0
        overdue_days = (datetime.now() - self.due_date).days
        return overdue_days * self.FINE_PER_DAY

class LibrarySystem:
    def __init__(self):
        self._books: dict[str, Book] = {}
        self._members: dict[str, Member] = {}
        self._records: dict[str, BorrowRecord] = {}
        self._record_counter = 0

    def add_book(self, book: Book) -> None:
        self._books[book.isbn] = book

    def register_member(self, member: Member) -> None:
        self._members[member.member_id] = member

    def borrow_book(self, member_id: str, isbn: str) -> BorrowRecord:
        member = self._members.get(member_id)
        book = self._books.get(isbn)

        if not member:
            raise ValueError(f"Member {member_id} not found")
        if not book:
            raise ValueError(f"Book {isbn} not found")
        if not member.can_borrow():
            raise ValueError("Member cannot borrow: limit reached or outstanding fine")
        if book.available_copies == 0:
            raise ValueError(f"No copies available for '{book.title}'")

        self._record_counter += 1
        record = BorrowRecord(
            record_id=f"BR-{self._record_counter:06d}",
            book=book,
            member=member
        )
        book.available_copies -= 1
        member.borrowed_books.append(record)
        self._records[record.record_id] = record
        return record

    def return_book(self, record_id: str) -> float:
        record = self._records.get(record_id)
        if not record:
            raise ValueError(f"Record {record_id} not found")
        if record.return_date:
            raise ValueError("Book already returned")

        record.return_date = datetime.now()
        record.book.available_copies += 1
        fine = record.calculate_fine()
        if fine > 0:
            record.member.fine += fine
        return fine

    def search_books(self, query: str) -> list[Book]:
        q = query.lower()
        return [b for b in self._books.values()
                if q in b.title.lower() or q in b.author.lower()]
```

### Problem 4: Splitwise
```python
from decimal import Decimal
from collections import defaultdict
import heapq

class SplitType(Enum):
    EQUAL = "equal"
    EXACT = "exact"
    PERCENTAGE = "percentage"

@dataclass
class Split:
    user_id: str
    amount: Decimal = Decimal("0")
    percentage: float = 0.0

@dataclass
class Expense:
    expense_id: str
    paid_by: str
    total_amount: Decimal
    description: str
    split_type: SplitType
    splits: list[Split]
    created_at: datetime = field(default_factory=datetime.now)

class ExpenseManager:
    def __init__(self):
        self._expenses: list[Expense] = []
        # net_balance[A][B] = how much A owes B (positive = owes, negative = is owed)
        self._balances: dict[str, dict[str, Decimal]] = defaultdict(lambda: defaultdict(Decimal))
        self._counter = 0

    def add_expense(self, paid_by: str, total: float,
                    description: str, split_type: SplitType,
                    splits: list[Split]) -> Expense:
        total_dec = Decimal(str(total))

        # Compute amounts based on split type
        computed_splits = self._compute_splits(total_dec, split_type, splits)

        self._counter += 1
        expense = Expense(
            expense_id=f"EXP-{self._counter:06d}",
            paid_by=paid_by,
            total_amount=total_dec,
            description=description,
            split_type=split_type,
            splits=computed_splits
        )
        self._expenses.append(expense)
        self._update_balances(expense)
        return expense

    def _compute_splits(self, total: Decimal, split_type: SplitType, splits: list[Split]):
        if split_type == SplitType.EQUAL:
            per_person = total / len(splits)
            for s in splits:
                s.amount = per_person
        elif split_type == SplitType.PERCENTAGE:
            for s in splits:
                s.amount = total * Decimal(str(s.percentage / 100))
        # EXACT: amounts already set
        return splits

    def _update_balances(self, expense: Expense):
        for split in expense.splits:
            if split.user_id == expense.paid_by:
                continue
            # split.user_id owes expense.paid_by
            self._balances[split.user_id][expense.paid_by] += split.amount
            self._balances[expense.paid_by][split.user_id] -= split.amount

    def get_balance(self, user_id: str) -> dict[str, Decimal]:
        return {k: v for k, v in self._balances[user_id].items() if v != 0}

    def simplify_debts(self) -> list[dict]:
        """Minimize number of transactions using heap-based greedy algorithm."""
        net: dict[str, Decimal] = defaultdict(Decimal)
        for creditor, debtors in self._balances.items():
            for debtor, amount in debtors.items():
                net[creditor] += amount  # negative = creditor, positive = debtor

        # Separate creditors (net < 0, they are owed) and debtors (net > 0, they owe)
        creditors = []  # (amount, person) max-heap (negate for min-heap)
        debtors = []    # (amount, person) min-heap

        for person, balance in net.items():
            if balance < 0:
                heapq.heappush(creditors, (balance, person))  # max owed (most negative)
            elif balance > 0:
                heapq.heappush(debtors, (-balance, person))   # most owing (negate)

        transactions = []
        while creditors and debtors:
            credit_amt, creditor = heapq.heappop(creditors)
            debt_amt, debtor = heapq.heappop(debtors)
            debt_amt = -debt_amt

            settle = min(-credit_amt, debt_amt)
            transactions.append({
                "from": debtor,
                "to": creditor,
                "amount": float(settle)
            })

            remaining_credit = credit_amt + settle
            remaining_debt = debt_amt - settle

            if remaining_credit < Decimal("-0.01"):
                heapq.heappush(creditors, (remaining_credit, creditor))
            if remaining_debt > Decimal("0.01"):
                heapq.heappush(debtors, (-remaining_debt, debtor))

        return transactions
```

---

## 6. How to Approach LLD in Python Interviews

```
1. REQUIREMENTS CLARIFICATION (5 min)
   - Core features? Actors?
   - Scale constraints? (usually ignore for LLD)
   - Thread safety? Persistence?

2. IDENTIFY CLASSES/ENTITIES (3 min)
   - Nouns in requirements = candidate classes
   - Use @dataclass for simple data holders
   - Use class for classes with behavior

3. DEFINE RELATIONSHIPS (3 min)
   - Has-A: composition (ParkingLot has Floors)
   - Is-A: inheritance (use sparingly in Python)
   - Uses-A: dependency (OrderService uses PaymentProcessor)

4. DESIGN INTERFACES (5 min)
   - Use ABC for must-implement contracts
   - Use Protocol for duck-typed interfaces (more Pythonic)
   - Keep interfaces small (ISP)

5. IMPLEMENT CORE LOGIC (15 min)
   - Start with entities (dataclasses)
   - Then service/manager classes
   - Apply design patterns where natural

6. APPLY PATTERNS (5 min)
   - State machine → State Pattern
   - Multiple algorithms → Strategy Pattern
   - Cross-cutting → Decorator Pattern
   - Central registry → Singleton (sparingly)

7. DISCUSS EXTENSIONS
   - How would you add feature X?
   - Thread safety?
   - Persistence layer?
```

### Python-Specific LLD Tips
```python
# 1. Use @dataclass for entities — less boilerplate
# 2. Use Protocol for structural typing instead of heavy ABC hierarchies
# 3. Use Enum for constants
# 4. Prefer composition over inheritance
# 5. Use __slots__ for memory-critical objects (millions of instances)
# 6. Use properties for computed attributes and validation
# 7. Use typing for clarity (helps reviewer understand design)
# 8. Use defaultdict, Counter, named tuples for clean data structures
# 9. Generators for lazy computation
# 10. Context managers for resource management

# Example: Pythonic Singleton using module
# config.py — module is a singleton
MAX_RETRIES = 3
TIMEOUT = 30

# user.py
from config import MAX_RETRIES  # always same object
```

---

## 7. Interview Q&A

**Q: How do you implement SOLID principles in Python differently from Java?**
A: Python uses `Protocol` for interface segregation (structural typing) instead of explicit `implements`. Python decorators are the idiomatic way to implement the Decorator pattern. Python's duck typing means you often don't need explicit interfaces for DIP — just type hint against an abstract class or Protocol. `@dataclass` reduces boilerplate. The principles are the same, but Python is more concise.

**Q: How do you make a Python class thread-safe?**
A: Use `threading.Lock()` or `threading.RLock()` around shared state access. Use `threading.local()` for thread-local storage. For counters, use `threading.Event()`, `threading.Semaphore()`. In Python, the GIL protects individual bytecode operations, but compound operations (check-then-act) still need locks. Use `queue.Queue` for thread-safe producer-consumer patterns.

**Q: When would you use ABC vs Protocol in Python?**
A: Use `ABC` when you want enforced abstract methods and want to provide default implementations. Subclasses must explicitly inherit. Use `Protocol` for duck typing — any class with the right methods satisfies the protocol without inheriting. Protocol is more Pythonic and flexible. Use Protocol for function parameters (structural subtyping), use ABC for class hierarchies with shared behavior.

**Q: How would you implement the Repository pattern in Python with FastAPI?**
A: Define an abstract `BaseRepository` with `ABC`. Create concrete implementations (`SQLUserRepository`, `MongoUserRepository`, `InMemoryUserRepository`). Inject via FastAPI's `Depends()` — switch implementations by changing what's injected. For testing, inject `InMemoryUserRepository` — no database needed. This follows DIP and makes the service layer testable in isolation.
