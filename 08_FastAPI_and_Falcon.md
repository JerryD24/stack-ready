# FastAPI & Falcon — Complete Interview Guide
### Python Web Frameworks | REST APIs | Async | Production Patterns

---

## TABLE OF CONTENTS
1. [Framework Comparison Overview](#1-framework-comparison-overview)
2. [FastAPI — Core Concepts](#2-fastapi--core-concepts)
3. [FastAPI — Request & Response](#3-fastapi--request--response)
4. [FastAPI — Dependency Injection](#4-fastapi--dependency-injection)
5. [FastAPI — Authentication & Security](#5-fastapi--authentication--security)
6. [FastAPI — Database Integration](#6-fastapi--database-integration)
7. [FastAPI — Background Tasks & WebSockets](#7-fastapi--background-tasks--websockets)
8. [FastAPI — Testing](#8-fastapi--testing)
9. [FastAPI — Advanced Patterns](#9-fastapi--advanced-patterns)
10. [Falcon — Core Concepts](#10-falcon--core-concepts)
11. [Falcon — Routing & Resources](#11-falcon--routing--resources)
12. [Falcon — Middleware & Hooks](#12-falcon--middleware--hooks)
13. [Falcon — ASGI & Async](#13-falcon--asgi--async)
14. [FastAPI vs Falcon vs Flask vs Django REST](#14-fastapi-vs-falcon-vs-flask-vs-django-rest)
15. [Production Patterns & Deployment](#15-production-patterns--deployment)
16. [Interview Q&A](#16-interview-qa)

---

## 1. Framework Comparison Overview

```
FastAPI:
  - Built on Starlette (ASGI) + Pydantic
  - Async-first, high performance
  - Automatic OpenAPI/Swagger documentation
  - Type hints → validation + serialization + docs
  - Best for: Modern APIs, microservices, data-heavy APIs

Falcon:
  - Ultra-lightweight, minimal overhead
  - WSGI and ASGI support
  - No "batteries included" — bring your own tools
  - Extremely fast (lower overhead than Flask)
  - Best for: High-performance APIs, minimal footprint, when you control every layer

Flask:
  - Simple, minimal, synchronous (WSGI)
  - Large ecosystem
  - Best for: Small APIs, prototyping, when simplicity > performance

Django REST Framework:
  - Full-featured, opinionated
  - Built on Django ORM
  - Best for: Large apps, admin panels, monoliths

Performance (requests/second, approximate):
  Falcon ASGI > FastAPI > Falcon WSGI > Flask > Django REST
```

---

## 2. FastAPI — Core Concepts

### Installation & Basic App
```python
pip install fastapi uvicorn[standard] pydantic

# main.py
from fastapi import FastAPI

app = FastAPI(
    title="My API",
    description="A sample API with FastAPI",
    version="1.0.0",
    docs_url="/docs",          # Swagger UI
    redoc_url="/redoc",        # ReDoc
    openapi_url="/openapi.json"
)

# Run: uvicorn main:app --reload --port 8000
```

### Path Operations
```python
from fastapi import FastAPI, Path, Query, Body, Header, Cookie
from typing import Optional
from enum import Enum

app = FastAPI()

class Category(str, Enum):
    electronics = "electronics"
    clothing = "clothing"
    books = "books"

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/items/{item_id}")
async def get_item(
    item_id: int = Path(..., ge=1, le=1000, description="Item ID"),
    q: Optional[str] = Query(None, min_length=1, max_length=50),
    category: Optional[Category] = None
):
    result = {"item_id": item_id}
    if q:
        result["q"] = q
    if category:
        result["category"] = category
    return result

# Multiple path params
@app.get("/users/{user_id}/orders/{order_id}")
async def get_user_order(
    user_id: int,
    order_id: int,
    include_items: bool = Query(False)
):
    return {"user_id": user_id, "order_id": order_id, "items": include_items}

# Enum in path
@app.get("/category/{cat}")
async def get_by_category(cat: Category):
    return {"category": cat, "value": cat.value}
```

### Pydantic Models (Foundation of FastAPI)
```python
from pydantic import BaseModel, Field, validator, field_validator, model_validator
from pydantic import EmailStr, HttpUrl, constr, conint, confloat
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class Address(BaseModel):
    street: str
    city: str
    country: str = "India"
    pincode: constr(pattern=r'^\d{6}$')   # regex validation

class CreateUserRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name")
    email: EmailStr
    age: conint(ge=18, le=120)
    salary: confloat(ge=0)
    tags: List[str] = Field(default_factory=list)
    address: Optional[Address] = None
    website: Optional[HttpUrl] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Field-level validator (v2 style)
    @field_validator("name")
    @classmethod
    def name_must_have_space(cls, v: str) -> str:
        if " " not in v.strip():
            raise ValueError("name must contain first and last name")
        return v.strip().title()

    # Model-level validator
    @model_validator(mode="after")
    def check_email_matches_domain(self) -> "CreateUserRequest":
        if self.email and "test" in self.email:
            raise ValueError("Test email addresses not allowed")
        return self

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Alice Smith",
                "email": "alice@example.com",
                "age": 30,
                "salary": 75000.0
            }
        }
    }

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}  # allow ORM objects (Pydantic v2)
    # Pydantic v1: class Config: orm_mode = True
```

---

## 3. FastAPI — Request & Response

### Request Body
```python
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse, Response, StreamingResponse, FileResponse
from pydantic import BaseModel
from typing import Optional

class Item(BaseModel):
    name: str
    price: float
    is_offer: Optional[bool] = None

@app.post("/items/", status_code=status.HTTP_201_CREATED)
async def create_item(item: Item):
    return item

# Multiple body params
class User(BaseModel):
    username: str
    full_name: str

@app.post("/merge/")
async def merge(item: Item, user: User):
    # FastAPI expects: {"item": {...}, "user": {...}}
    return {"item": item, "user": user}

# Body with extra fields control
class StrictModel(BaseModel):
    model_config = {"extra": "forbid"}  # reject unknown fields
    name: str

class FlexModel(BaseModel):
    model_config = {"extra": "allow"}   # accept any extra fields
    name: str
```

### Response Models
```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

class ItemIn(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    tax: Optional[float] = None

class ItemOut(BaseModel):
    name: str
    price: float

# response_model filters and validates output
@app.post("/items/", response_model=ItemOut)
async def create_item(item: ItemIn):
    return item  # tax and description are filtered out!

# response_model_exclude_unset — only include fields that were explicitly set
@app.patch("/items/{item_id}", response_model=ItemOut, response_model_exclude_unset=True)
async def update_item(item_id: int, item: ItemIn):
    ...

# Multiple response types
from fastapi.responses import JSONResponse
from typing import Union

@app.get(
    "/items/{item_id}",
    responses={
        200: {"model": ItemOut},
        404: {"description": "Item not found"},
        403: {"description": "Not authorized"},
    }
)
async def get_item(item_id: int):
    if item_id == 0:
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    return ItemOut(name="Foo", price=10.5)

# Custom response
@app.get("/stream")
async def stream_data():
    async def generate():
        for i in range(10):
            yield f"data: {i}\n\n"
            await asyncio.sleep(0.1)
    return StreamingResponse(generate(), media_type="text/event-stream")
```

### Exception Handling
```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import http_exception_handler

# HTTPException
@app.get("/items/{item_id}")
async def get_item(item_id: int):
    if item_id not in db:
        raise HTTPException(
            status_code=404,
            detail={"message": "Item not found", "item_id": item_id}
        )
    return db[item_id]

# Custom exception
class ItemNotFoundError(Exception):
    def __init__(self, item_id: int):
        self.item_id = item_id

@app.exception_handler(ItemNotFoundError)
async def item_not_found_handler(request: Request, exc: ItemNotFoundError):
    return JSONResponse(
        status_code=404,
        content={"message": f"Item {exc.item_id} not found"}
    )

# Override default exception handlers
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": exc.body
        }
    )

# Global error handler (catch-all)
@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})
```

### Middleware
```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import time, uuid

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://myfrontend.com"],  # or ["*"] for all
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Custom middleware
@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Starlette BaseHTTPMiddleware (class-based)
from starlette.middleware.base import BaseHTTPMiddleware

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        print(f"Request: {request.method} {request.url}")
        response = await call_next(request)
        print(f"Response: {response.status_code}")
        return response

app.add_middleware(LoggingMiddleware)
```

---

## 4. FastAPI — Dependency Injection

```python
from fastapi import FastAPI, Depends, HTTPException, status
from typing import Annotated

# Simple dependency (function)
def get_db():
    db = SessionLocal()
    try:
        yield db       # provide db to the route
    finally:
        db.close()     # cleanup (always runs)

@app.get("/users")
async def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

# Using Annotated (Python 3.9+ preferred style)
DbDep = Annotated[Session, Depends(get_db)]

@app.get("/items")
async def get_items(db: DbDep):
    return db.query(Item).all()

# Dependency with params
def get_pagination(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100)
) -> dict:
    return {"skip": (page - 1) * size, "limit": size}

PaginationDep = Annotated[dict, Depends(get_pagination)]

@app.get("/products")
async def get_products(pagination: PaginationDep, db: DbDep):
    return db.query(Product).offset(pagination["skip"]).limit(pagination["limit"]).all()

# Class-based dependencies
class CommonQueryParams:
    def __init__(self, q: Optional[str] = None, skip: int = 0, limit: int = 100):
        self.q = q
        self.skip = skip
        self.limit = limit

@app.get("/items")
async def read_items(commons: Annotated[CommonQueryParams, Depends()]):
    # Notice: Depends() with no argument infers from type hint
    return {"q": commons.q, "skip": commons.skip}

# Dependency caching — same dependency called multiple times uses cached value
@app.get("/items/{item_id}")
async def get_item(
    item_id: int,
    db1: DbDep,
    db2: DbDep,  # same db instance (cached by default in same request)
):
    ...

# Disable caching (new instance each time)
@app.get("/items")
async def get_items(
    db: Annotated[Session, Depends(get_db, use_cache=False)]
):
    ...

# Sub-dependencies
def verify_token(x_token: str = Header(...)):
    if x_token != "valid-token":
        raise HTTPException(status_code=403, detail="Invalid token")
    return x_token

def get_current_user(token: str = Depends(verify_token)):
    return {"user": "Alice", "token": token}

@app.get("/protected")
async def protected_route(user: dict = Depends(get_current_user)):
    return user

# Global dependencies (applied to all routes)
app = FastAPI(dependencies=[Depends(verify_token)])

# Router-level dependencies
from fastapi import APIRouter
router = APIRouter(
    prefix="/admin",
    dependencies=[Depends(verify_admin_token)]
)
```

---

## 5. FastAPI — Authentication & Security

### OAuth2 + JWT
```python
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional

# Config
SECRET_KEY = "your-secret-key-keep-it-secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

# Password utilities
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# JWT utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Dependency: get current user from JWT
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = get_user(db=fake_db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Login endpoint
@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(fake_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user
```

### API Key Security
```python
from fastapi.security import APIKeyHeader, APIKeyQuery, APIKeyCookie

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

async def get_api_key(api_key: str = Depends(api_key_header)) -> str:
    if api_key != VALID_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key

@app.get("/secure-endpoint")
async def secure(api_key: str = Depends(get_api_key)):
    return {"message": "You have access!"}
```

---

## 6. FastAPI — Database Integration

### SQLAlchemy Async
```python
# requirements: sqlalchemy[asyncio] asyncpg (PostgreSQL) or aiosqlite (SQLite)

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey, select
from typing import Optional, List

DATABASE_URL = "postgresql+asyncpg://user:password@localhost/dbname"

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(200), unique=True)
    orders: Mapped[List["Order"]] = relationship(back_populates="user", lazy="selectin")

class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    total: Mapped[float]
    user: Mapped["User"] = relationship(back_populates="orders")

# DB dependency
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# CRUD operations
@app.get("/users/{user_id}", response_model=UserSchema)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/users/", response_model=UserSchema, status_code=201)
async def create_user(user_data: CreateUserSchema, db: AsyncSession = Depends(get_db)):
    user = User(**user_data.model_dump())
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
```

### Alembic Migrations
```bash
# Setup
pip install alembic
alembic init alembic

# Edit alembic.ini: sqlalchemy.url = postgresql://...
# Edit alembic/env.py: target_metadata = Base.metadata

# Generate migration
alembic revision --autogenerate -m "create users table"
# Apply
alembic upgrade head
# Rollback
alembic downgrade -1
```

### Redis Integration
```python
import redis.asyncio as aioredis
from fastapi import Depends
import json

redis_client = aioredis.from_url("redis://localhost:6379", decode_responses=True)

async def get_redis():
    return redis_client

@app.get("/users/{user_id}")
async def get_user_cached(user_id: int, redis: aioredis.Redis = Depends(get_redis),
                          db: AsyncSession = Depends(get_db)):
    # Try cache first
    cached = await redis.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)

    # Cache miss — get from DB
    user = await get_user_from_db(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Not found")

    # Store in cache
    await redis.setex(f"user:{user_id}", 300, json.dumps(user.model_dump()))
    return user
```

---

## 7. FastAPI — Background Tasks & WebSockets

### Background Tasks
```python
from fastapi import BackgroundTasks

def send_email(email: str, message: str):
    # Runs after response is sent
    print(f"Sending email to {email}: {message}")

def log_activity(user_id: int, action: str):
    print(f"User {user_id} performed: {action}")

@app.post("/register")
async def register(user: UserCreate, background_tasks: BackgroundTasks):
    new_user = create_user(user)
    background_tasks.add_task(send_email, user.email, "Welcome!")
    background_tasks.add_task(log_activity, new_user.id, "registered")
    return {"message": "Registered", "id": new_user.id}  # returns immediately

# For heavy background work: use Celery + Redis/RabbitMQ
```

### WebSockets
```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"You: {data}", websocket)
            await manager.broadcast(f"Client #{client_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"Client #{client_id} left")
```

### Server-Sent Events (SSE)
```python
from fastapi.responses import StreamingResponse
import asyncio, json

async def event_generator():
    for i in range(10):
        data = {"count": i, "timestamp": datetime.utcnow().isoformat()}
        yield f"data: {json.dumps(data)}\n\n"
        await asyncio.sleep(1)
    yield "event: done\ndata: complete\n\n"

@app.get("/events")
async def event_stream():
    return StreamingResponse(event_generator(), media_type="text/event-stream",
                              headers={"Cache-Control": "no-cache",
                                       "X-Accel-Buffering": "no"})
```

---

## 8. FastAPI — Testing

```python
# requirements: pytest pytest-asyncio httpx

from fastapi.testclient import TestClient
from httpx import AsyncClient
import pytest

from main import app

# Synchronous tests
client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}

def test_create_user():
    response = client.post("/users/", json={
        "name": "Alice Smith",
        "email": "alice@example.com",
        "age": 30
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Alice Smith"
    assert "id" in data

def test_validation_error():
    response = client.post("/users/", json={"name": "A", "age": 15})  # too young
    assert response.status_code == 422

# Async tests
@pytest.mark.asyncio
async def test_async_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/items")
    assert response.status_code == 200

# Override dependencies in tests
from fastapi.testclient import TestClient

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

# Mock authentication
def override_get_current_user():
    return User(id=1, username="testuser", email="test@test.com")

app.dependency_overrides[get_current_user] = override_get_current_user
```

---

## 9. FastAPI — Advanced Patterns

### Routers & APIRouter
```python
# users/router.py
from fastapi import APIRouter, Depends

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_current_user)],
    responses={404: {"description": "Not found"}}
)

@router.get("/", response_model=List[UserResponse])
async def get_users(): ...

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int): ...

# main.py
from users.router import router as users_router
from orders.router import router as orders_router

app = FastAPI()
app.include_router(users_router)
app.include_router(orders_router, prefix="/api/v1")

# Versioned API
v1_router = APIRouter(prefix="/v1")
v2_router = APIRouter(prefix="/v2")
```

### Lifespan Events (FastAPI 0.93+)
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: runs before app accepts requests
    print("Starting up...")
    await init_db()
    redis_client = await create_redis_pool()
    app.state.redis = redis_client
    yield
    # Shutdown: runs when app shuts down
    print("Shutting down...")
    await redis_client.close()
    await close_db()

app = FastAPI(lifespan=lifespan)

# Access in routes via request.app.state
@app.get("/cache")
async def use_cache(request: Request):
    redis = request.app.state.redis
    return await redis.get("key")
```

### Settings with Pydantic-Settings
```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "My API"
    debug: bool = False
    database_url: str
    redis_url: str = "redis://localhost:6379"
    secret_key: str
    allowed_origins: list[str] = ["*"]
    max_connections: int = 10

@lru_cache
def get_settings() -> Settings:
    return Settings()  # reads .env once, cached

@app.get("/info")
async def app_info(settings: Settings = Depends(get_settings)):
    return {"name": settings.app_name, "debug": settings.debug}
```

### Pagination Pattern
```python
from pydantic import BaseModel
from typing import Generic, TypeVar, List

T = TypeVar("T")

class Page(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

    @classmethod
    def create(cls, items: List[T], total: int, page: int, size: int):
        return cls(items=items, total=total, page=page, size=size,
                   pages=(total + size - 1) // size)

@app.get("/products", response_model=Page[ProductResponse])
async def get_products(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    offset = (page - 1) * size
    total = await db.scalar(select(func.count(Product.id)))
    result = await db.execute(select(Product).offset(offset).limit(size))
    products = result.scalars().all()
    return Page.create(products, total, page, size)
```

---

## 10. Falcon — Core Concepts

### Installation & Basic App
```python
pip install falcon gunicorn

# WSGI App
import falcon

class HelloResource:
    def on_get(self, req, resp):
        resp.media = {"message": "Hello, World!"}
        resp.status = falcon.HTTP_200

app = falcon.App()
app.add_route("/hello", HelloResource())

# Run: gunicorn myapp:app
# Run: uvicorn myapp:app (for ASGI version)
```

### App Configuration
```python
import falcon
from falcon import media

# Configure JSON handling
json_handler = media.JSONHandler(
    dumps=partial(json.dumps, cls=CustomJSONEncoder),
    loads=json.loads
)
extra_handlers = {
    "application/json": json_handler,
    "application/json; charset=UTF-8": json_handler,
}

app = falcon.App(
    cors_enable=True,
    req_options=falcon.RequestOptions(),
    resp_options=falcon.ResponseOptions()
)
app.req_options.media_handlers.update(extra_handlers)
app.resp_options.media_handlers.update(extra_handlers)
```

---

## 11. Falcon — Routing & Resources

```python
import falcon
from falcon import Request, Response
from typing import Optional

class UserResource:
    def __init__(self, user_service):
        self.service = user_service

    # Responders: on_<method>
    def on_get(self, req: Request, resp: Response):
        """List users with optional filtering."""
        page = req.get_param_as_int("page", default=1, min_value=1)
        size = req.get_param_as_int("size", default=10, max_value=100)
        name_filter = req.get_param("name")

        users = self.service.list_users(page=page, size=size, name=name_filter)
        resp.media = {"users": [u.to_dict() for u in users], "page": page}
        resp.status = falcon.HTTP_200

    def on_post(self, req: Request, resp: Response):
        """Create a new user."""
        body = req.get_media()  # parses JSON body
        # In async: body = await req.get_media()
        user = self.service.create_user(body)
        resp.media = user.to_dict()
        resp.status = falcon.HTTP_201
        resp.location = f"/users/{user.id}"

class UserItemResource:
    def __init__(self, user_service):
        self.service = user_service

    def on_get(self, req: Request, resp: Response, user_id: int):
        user = self.service.get_user(user_id)
        if not user:
            raise falcon.HTTPNotFound(description=f"User {user_id} not found")
        resp.media = user.to_dict()

    def on_put(self, req: Request, resp: Response, user_id: int):
        body = req.get_media()
        user = self.service.update_user(user_id, body)
        resp.media = user.to_dict()

    def on_delete(self, req: Request, resp: Response, user_id: int):
        self.service.delete_user(user_id)
        resp.status = falcon.HTTP_204  # No Content

# Register routes
user_service = UserService()
app = falcon.App()
app.add_route("/users", UserResource(user_service))
app.add_route("/users/{user_id:int}", UserItemResource(user_service))

# Route templates
app.add_route("/files/{filename}", file_resource)         # {name}
app.add_route("/items/{item_id:int}", item_resource)      # {name:int}
app.add_route("/slug/{slug:uuid}", post_resource)         # {name:uuid}

# Sink — catch-all for unmatched routes
def sink(req, resp):
    resp.status = falcon.HTTP_404
    resp.media = {"error": "Not Found"}

app.add_sink(sink, r"/api/.*")  # regex prefix
```

### Falcon Errors
```python
# Falcon built-in HTTP errors
raise falcon.HTTPBadRequest(title="Bad Request", description="Invalid input")
raise falcon.HTTPUnauthorized(description="Token required",
                               challenges=["Bearer realm=example"])
raise falcon.HTTPForbidden(description="Access denied")
raise falcon.HTTPNotFound(description="Resource not found")
raise falcon.HTTPConflict(description="Duplicate resource")
raise falcon.HTTPUnprocessableEntity(description="Validation failed")
raise falcon.HTTPTooManyRequests(description="Rate limit exceeded",
                                  retry_after=60)
raise falcon.HTTPInternalServerError()

# Custom error handler
class CustomError(Exception):
    def __init__(self, title, description, status=falcon.HTTP_500):
        self.title = title
        self.description = description
        self.status = status

def custom_error_handler(req, resp, ex, params):
    if isinstance(ex, CustomError):
        resp.status = ex.status
        resp.media = {"error": ex.title, "detail": ex.description}
    else:
        resp.status = falcon.HTTP_500
        resp.media = {"error": "Internal Server Error"}

app.add_error_handler(Exception, custom_error_handler)
```

---

## 12. Falcon — Middleware & Hooks

### Middleware
```python
# Middleware: process_request, process_resource, process_response
class AuthMiddleware:
    def process_request(self, req: Request, resp: Response):
        """Called before routing."""
        token = req.get_header("Authorization")
        if req.path.startswith("/public"):
            return  # skip auth for public routes
        if not token or not validate_token(token):
            raise falcon.HTTPUnauthorized(description="Invalid or missing token")
        # Set on request context
        req.context.user = get_user_from_token(token)

    def process_resource(self, req: Request, resp: Response, resource, params):
        """Called after routing, before responder."""
        pass

    def process_response(self, req: Request, resp: Response, resource, req_succeeded):
        """Called after responder."""
        resp.set_header("X-Response-Time", "10ms")

class CORSMiddleware:
    def process_response(self, req, resp, resource, req_succeeded):
        resp.set_header("Access-Control-Allow-Origin", "*")
        resp.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        resp.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

class LoggingMiddleware:
    def process_request(self, req, resp):
        req.context.start_time = time.time()

    def process_response(self, req, resp, resource, req_succeeded):
        duration = time.time() - req.context.start_time
        logger.info(f"{req.method} {req.path} {resp.status} {duration:.3f}s")

# Register middleware (order matters! processed in order for request, reverse for response)
app = falcon.App(middleware=[
    LoggingMiddleware(),
    AuthMiddleware(),
    CORSMiddleware(),
])
```

### Hooks
```python
# Hooks: decorators on individual responders
import falcon

def require_json(req, resp, resource, params):
    if req.content_type not in ("application/json", None):
        raise falcon.HTTPUnsupportedMediaType(description="JSON required")

def validate_user_id(req, resp, resource, params):
    if params.get("user_id", 0) <= 0:
        raise falcon.HTTPBadRequest(description="Invalid user ID")

class UserResource:
    @falcon.before(require_json)
    @falcon.before(validate_user_id)
    def on_post(self, req, resp, user_id):
        ...

    @falcon.after(lambda req, resp, resource, params: resp.set_header("X-Cached", "false"))
    def on_get(self, req, resp, user_id):
        ...
```

---

## 13. Falcon — ASGI & Async

```python
# ASGI Falcon (v3+) — full async support
import falcon.asgi

class AsyncUserResource:
    async def on_get(self, req, resp):
        users = await user_service.get_all_async()
        resp.media = [u.to_dict() for u in users]

    async def on_post(self, req, resp):
        body = await req.get_media()
        user = await user_service.create_async(body)
        resp.media = user.to_dict()
        resp.status = falcon.HTTP_201

class AsyncMiddleware:
    async def process_request(self, req, resp):
        # async middleware
        req.context.user = await auth_service.validate(req.get_header("Authorization"))

    async def process_response(self, req, resp, resource, req_succeeded):
        pass

# WebSocket in Falcon
class ChatResource:
    async def on_websocket(self, req, ws):
        await ws.accept()
        try:
            while True:
                message = await ws.receive_text()
                await ws.send_text(f"Echo: {message}")
        except falcon.WebSocketDisconnected:
            pass

# ASGI app
app = falcon.asgi.App(middleware=[AsyncMiddleware()])
app.add_route("/users", AsyncUserResource())
app.add_route("/chat", ChatResource())

# Run: uvicorn myapp:app
```

---

## 14. FastAPI vs Falcon vs Flask vs Django REST

### Feature Matrix
| Feature | FastAPI | Falcon | Flask | Django REST |
|---------|---------|--------|-------|-------------|
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Async | Native | Native (v3) | Limited | Limited |
| Auto Docs | ✅ Swagger + ReDoc | ❌ Manual | ❌ Manual | ✅ Browsable |
| Validation | ✅ Pydantic | ❌ Manual | ❌ Manual | ✅ Serializers |
| ORM | Any | Any | Any | Django ORM |
| Learning curve | Medium | Low | Low | High |
| Boilerplate | Low | Very Low | Low | High |
| Community | Growing fast | Smaller | Large | Large |
| Use case | Modern APIs | Perf-critical | Simple APIs | Full apps |

### When to Choose What
```
FastAPI:
  ✅ Building REST or GraphQL APIs
  ✅ Need auto-generated OpenAPI docs
  ✅ Type safety and validation are important
  ✅ Async I/O intensive operations
  ✅ Microservices, data APIs, ML model serving

Falcon:
  ✅ Maximum performance is critical
  ✅ Want complete control over every layer
  ✅ Building low-level HTTP services
  ✅ Telco, fintech, embedded systems
  ✅ Minimal footprint on constrained environments

Flask:
  ✅ Small to medium APIs
  ✅ Rapid prototyping
  ✅ Already using Flask ecosystem (Marshmallow, SQLAlchemy)

Django REST Framework:
  ✅ Building alongside a Django web application
  ✅ Need admin interface + ORM
  ✅ Complex permission systems
  ✅ CRUD-heavy applications
```

### Performance Comparison (RPS on simple JSON endpoint)
```
Benchmark (approximate, hardware-dependent):
  Falcon ASGI:      ~100,000 RPS
  FastAPI:          ~70,000 RPS
  Falcon WSGI:      ~60,000 RPS
  Flask:            ~25,000 RPS
  Django REST:      ~10,000 RPS

Note: Real-world performance depends on DB queries, business logic, etc.
At application level, difference is often negligible.
FastAPI wins on developer experience; Falcon wins on raw throughput.
```

---

## 15. Production Patterns & Deployment

### Uvicorn + Gunicorn Setup
```bash
# Development
uvicorn main:app --reload --port 8000

# Production (Gunicorn as process manager + Uvicorn workers)
gunicorn main:app \
  --workers 4 \                    # 2 * CPU cores + 1
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 30 \
  --max-requests 1000 \            # recycle workers to prevent memory leaks
  --max-requests-jitter 100 \
  --access-logfile - \
  --error-logfile -
```

### Docker
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Rate Limiting (Slowapi for FastAPI)
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/limited")
@limiter.limit("5/minute")
async def limited_endpoint(request: Request):
    return {"message": "OK"}
```

### Structured Logging
```python
import structlog, logging

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

log = structlog.get_logger()
log.info("user_created", user_id=123, email="a@b.com")
```

---

## 16. Interview Q&A

**Q: What makes FastAPI different from Flask?**
A: FastAPI is built on ASGI (async-native), uses Python type hints for automatic request validation via Pydantic, generates OpenAPI docs automatically, and has much better performance for async I/O. Flask is WSGI (synchronous), requires extensions for validation and docs, but has a larger ecosystem and is simpler to learn.

**Q: How does FastAPI validate request data?**
A: FastAPI uses Pydantic models. You declare request body as a Pydantic `BaseModel` parameter. FastAPI automatically: 1) Parses the JSON body, 2) Validates each field against the type annotation and Field constraints, 3) Returns HTTP 422 with detailed error messages if validation fails, 4) Converts the validated data into the Python model instance for your function.

**Q: Explain FastAPI's Dependency Injection system.**
A: `Depends()` declares a dependency. When a route is called, FastAPI resolves the dependency chain: it calls the dependency function, injects its return value into the route. Dependencies can be nested (sub-dependencies). By default, within the same request, each dependency is called once and the result is cached. Common uses: DB sessions, authentication, pagination parameters, shared business logic.

**Q: How does Falcon achieve high performance?**
A: Falcon has minimal overhead by design — it doesn't include an ORM, template engine, or admin interface. It processes requests with a lean middleware stack. Response/request objects are pre-allocated. Error handling is kept at a minimum. The ASGI version adds async I/O capabilities. Falcon avoids the overhead that frameworks like Django add for convenience features.

**Q: What is Pydantic v2 and what changed from v1?**
A: Pydantic v2 was rewritten in Rust (via pydantic-core), making it 5-50x faster. Key changes: `Config` class replaced by `model_config` dict, `orm_mode=True` replaced by `from_attributes=True`, `@validator` replaced by `@field_validator`/`@model_validator`, `schema_extra` replaced by `json_schema_extra`. FastAPI 0.100+ uses Pydantic v2 by default.

**Q: How do you handle database sessions in FastAPI?**
A: Use a generator dependency with `yield`. The DB session is created in the dependency, `yield`ed to the route function, and closed/committed in the `finally` block after the response is sent. This ensures the session is always cleaned up. For async, use `AsyncSession` with `async_sessionmaker`. Never hold sessions longer than the request lifetime.

**Q: How does FastAPI handle async vs sync route functions?**
A: If a route is `async def`, FastAPI runs it directly on the event loop. If it's a regular `def`, FastAPI runs it in a thread pool (using `run_in_executor`) to avoid blocking the event loop. Use `async def` for I/O-bound async code. Use `def` for CPU-bound or legacy synchronous code. Mixing is fine and handled automatically.
