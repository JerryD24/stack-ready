# System Design HLD — Python Edition
### Concepts + Python-Specific Stack + Real-World Designs

---

## TABLE OF CONTENTS
1. [Python in Production Architecture](#1-python-in-production-architecture)
2. [Scalability with Python](#2-scalability-with-python)
3. [Python Web Servers & Deployment](#3-python-web-servers--deployment)
4. [Databases with Python](#4-databases-with-python)
5. [Caching with Python](#5-caching-with-python)
6. [Task Queues — Celery & Redis](#6-task-queues--celery--redis)
7. [Message Queues — Kafka & RabbitMQ in Python](#7-message-queues--kafka--rabbitmq-in-python)
8. [Microservices in Python](#8-microservices-in-python)
9. [API Design Patterns in Python](#9-api-design-patterns-in-python)
10. [Monitoring, Logging & Observability](#10-monitoring-logging--observability)
11. [Real-World System Designs (Python Stack)](#11-real-world-system-designs-python-stack)
12. [Python vs Go vs Java for System Design](#12-python-vs-go-vs-java-for-system-design)
13. [Interview Q&A](#13-interview-qa)

---

## 1. Python in Production Architecture

### Where Python Fits
```
Python EXCELS at:
  ✅ ML/AI model serving (TensorFlow, PyTorch, scikit-learn)
  ✅ Data pipelines (Pandas, Spark via PySpark, Airflow)
  ✅ REST APIs (FastAPI, Flask, Django REST)
  ✅ Scripting and automation
  ✅ Rapid prototyping

Python STRUGGLES at:
  ❌ CPU-intensive computation (GIL blocks parallelism)
  ❌ Very low latency requirements (< 1ms)
  ❌ High-throughput raw data processing (prefer Go/Rust)
  ❌ Heavy concurrency with thousands of threads
```

### Typical Python Backend Stack
```
Production Python Stack:
  ┌─────────────────────────────────────────────────────┐
  │  Load Balancer (Nginx / AWS ALB / Cloudflare)       │
  ├─────────────────────────────────────────────────────┤
  │  WSGI/ASGI Server: Gunicorn + Uvicorn workers       │
  ├─────────────────────────────────────────────────────┤
  │  Application: FastAPI / Django REST / Flask         │
  ├──────────────┬──────────────┬───────────────────────┤
  │  PostgreSQL  │  Redis Cache │  Celery Task Queue    │
  │  (SQLAlchemy)│  (redis-py)  │  (Worker Processes)   │
  ├──────────────┴──────────────┴───────────────────────┤
  │  Message Broker: Kafka / RabbitMQ                   │
  ├─────────────────────────────────────────────────────┤
  │  Object Storage: S3 / GCS (boto3)                   │
  │  Search: Elasticsearch (elasticsearch-py)           │
  │  Monitoring: Prometheus + Grafana                   │
  └─────────────────────────────────────────────────────┘
```

---

## 2. Scalability with Python

### The GIL Problem & Solutions
```
Python's GIL (Global Interpreter Lock):
  - Only one thread executes Python bytecode at a time
  - Kills multi-core CPU parallelism for Python code
  - I/O operations release the GIL (threading works for I/O-bound)

Solutions for Python Scalability:

1. MULTIPROCESSING (CPU-bound parallelism)
   - Python multiprocessing bypasses GIL (separate processes)
   - Use for: data processing, ML inference, batch jobs

2. ASYNC/AWAIT (I/O concurrency)
   - asyncio handles thousands of concurrent I/O operations
   - Use for: HTTP calls, DB queries, file I/O
   - Single thread, no GIL issue

3. HORIZONTAL SCALING
   - Deploy multiple instances behind load balancer
   - Stateless apps: scale freely
   - Shared state: use Redis/DB

4. C EXTENSIONS / NumPy
   - NumPy, Pandas release GIL during computation
   - Write performance-critical code in Cython or C extensions

5. WORKERS (Gunicorn / Uvicorn)
   - Multiple worker processes
   - Each worker is a full Python interpreter
   - Recommended: 2 * CPU_CORES + 1 workers
```

### Scaling Pattern in Python
```python
# Gunicorn + Uvicorn for production FastAPI
# gunicorn.conf.py
import multiprocessing

workers = multiprocessing.cpu_count() * 2 + 1  # e.g., 9 for 4-core
worker_class = "uvicorn.workers.UvicornWorker"
bind = "0.0.0.0:8000"
timeout = 30
keepalive = 5
max_requests = 1000          # recycle workers to prevent memory leaks
max_requests_jitter = 100    # random variance to avoid simultaneous restarts
accesslog = "-"
errorlog = "-"
loglevel = "info"
```

---

## 3. Python Web Servers & Deployment

### WSGI vs ASGI
```
WSGI (Web Server Gateway Interface):
  - Synchronous, one request at a time per worker
  - Servers: Gunicorn, uWSGI
  - Frameworks: Flask, Django
  - Good for CPU-bound, traditional web apps

ASGI (Asynchronous Server Gateway Interface):
  - Async, handles multiple requests per worker concurrently
  - Servers: Uvicorn, Hypercorn, Daphne
  - Frameworks: FastAPI, Django Channels, Starlette
  - Good for I/O-bound, WebSockets, streaming

Request flow:
  Client → Nginx (reverse proxy, SSL termination, static files)
         → Gunicorn (process manager) or Uvicorn (ASGI server)
         → Python Application (FastAPI/Django)
         → Database / Cache / External APIs
```

### Docker Deployment
```dockerfile
# Dockerfile for FastAPI
FROM python:3.12-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY . .

# Non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000",
     "--workers", "4", "--proxy-headers"]
```

```yaml
# docker-compose.yml
version: "3.9"
services:
  api:
    build: .
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379/0
    depends_on: [db, redis]
    deploy:
      replicas: 3

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  celery_worker:
    build: .
    command: celery -A app.celery worker --loglevel=info --concurrency=4
    depends_on: [db, redis]

  celery_beat:
    build: .
    command: celery -A app.celery beat --loglevel=info

volumes:
  pgdata:
```

---

## 4. Databases with Python

### SQLAlchemy — ORM & Core
```python
# Async SQLAlchemy (recommended for FastAPI)
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey, Index, select, func

DATABASE_URL = "postgresql+asyncpg://user:pass@localhost/mydb"

engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,           # connection pool
    max_overflow=20,
    pool_pre_ping=True,     # test connections before use
    echo=False,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_email", "email"),
        Index("ix_users_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100))
    orders: Mapped[list["Order"]] = relationship(
        back_populates="user",
        lazy="selectin",   # auto-join on load (avoids N+1)
        cascade="all, delete-orphan"
    )

# Repository pattern
class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id: int) -> User | None:
        return await self.session.get(User, user_id)

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def list_paginated(self, skip: int = 0, limit: int = 20) -> tuple[list[User], int]:
        count_query = select(func.count(User.id))
        total = await self.session.scalar(count_query)
        result = await self.session.execute(
            select(User).offset(skip).limit(limit).order_by(User.id)
        )
        return result.scalars().all(), total

    async def create(self, user_data: dict) -> User:
        user = User(**user_data)
        self.session.add(user)
        await self.session.flush()     # get ID without committing
        await self.session.refresh(user)
        return user
```

### Connection Pooling & Read Replicas
```python
# Connection pool per environment
import os

def get_db_url(read_only: bool = False) -> str:
    if read_only and os.getenv("DB_READ_REPLICA_URL"):
        return os.getenv("DB_READ_REPLICA_URL")   # read replica for SELECTs
    return os.getenv("DATABASE_URL")

# Two engines: one for writes, one for reads
write_engine = create_async_engine(get_db_url(read_only=False), pool_size=5)
read_engine  = create_async_engine(get_db_url(read_only=True),  pool_size=20)

WriteSession = async_sessionmaker(write_engine)
ReadSession  = async_sessionmaker(read_engine)

# Usage
async def get_write_db():
    async with WriteSession() as session:
        async with session.begin():
            yield session

async def get_read_db():
    async with ReadSession() as session:
        yield session
```

### Database Migrations — Alembic
```python
# alembic/env.py
from app.models import Base
target_metadata = Base.metadata

# Commands:
# alembic revision --autogenerate -m "add users table"
# alembic upgrade head
# alembic downgrade -1
# alembic history
# alembic current
```

### NoSQL — MongoDB with Motor
```python
# pip install motor
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client["mydb"]
users_collection = db["users"]

# CRUD
async def create_user(user: dict) -> str:
    result = await users_collection.insert_one(user)
    return str(result.inserted_id)

async def get_user(user_id: str) -> dict | None:
    from bson import ObjectId
    return await users_collection.find_one({"_id": ObjectId(user_id)})

async def update_user(user_id: str, updates: dict) -> bool:
    from bson import ObjectId
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": updates}
    )
    return result.modified_count > 0

# Aggregation pipeline
pipeline = [
    {"$match": {"status": "active"}},
    {"$group": {"_id": "$city", "count": {"$sum": 1}}},
    {"$sort": {"count": -1}},
    {"$limit": 10}
]
async for doc in users_collection.aggregate(pipeline):
    print(doc)
```

---

## 5. Caching with Python

### Redis with redis-py / aioredis
```python
# pip install redis[asyncio]
import redis.asyncio as aioredis
import json
import pickle
from functools import wraps

# Connection
redis = aioredis.from_url(
    "redis://localhost:6379",
    encoding="utf-8",
    decode_responses=True,
    max_connections=20
)

# --- Cache-Aside Pattern ---
async def get_user_cached(user_id: int, db: AsyncSession) -> dict:
    cache_key = f"user:{user_id}"

    # 1. Check cache
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)

    # 2. Cache miss — fetch from DB
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Not found")

    # 3. Store in cache
    user_dict = {"id": user.id, "name": user.name, "email": user.email}
    await redis.setex(cache_key, 300, json.dumps(user_dict))  # TTL: 5 min
    return user_dict

# --- Invalidation on write ---
async def update_user(user_id: int, data: dict, db: AsyncSession):
    user = await db.get(User, user_id)
    for k, v in data.items():
        setattr(user, k, v)
    await db.commit()
    await redis.delete(f"user:{user_id}")   # invalidate cache

# --- Decorator for caching ---
def cache(ttl: int = 300, key_prefix: str = ""):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{key_prefix}:{func.__name__}:{args}:{kwargs}"
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
            result = await func(*args, **kwargs)
            await redis.setex(cache_key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator

@cache(ttl=60, key_prefix="product")
async def get_product(product_id: int): ...

# --- Redis Data Structures ---
async def leaderboard_examples():
    # Sorted Set: LEADERBOARD
    await redis.zadd("scores", {"alice": 100, "bob": 85, "charlie": 92})
    top3 = await redis.zrevrange("scores", 0, 2, withscores=True)
    rank = await redis.zrevrank("scores", "alice")

    # Counter
    await redis.incr("page_views:home")
    views = await redis.get("page_views:home")

    # Set: unique visitors
    await redis.sadd("visitors:2026-04-29", "user:123")
    count = await redis.scard("visitors:2026-04-29")

    # Hash: user session
    await redis.hset("session:abc123", mapping={"user_id": "1", "role": "admin"})
    session = await redis.hgetall("session:abc123")

    # List: recent activity feed
    await redis.lpush("feed:user:1", json.dumps({"action": "login"}))
    await redis.ltrim("feed:user:1", 0, 49)   # keep last 50
    feed = await redis.lrange("feed:user:1", 0, 9)   # get last 10

# --- Distributed Lock ---
async def acquire_lock(resource: str, ttl: int = 30) -> str | None:
    import uuid
    lock_id = str(uuid.uuid4())
    lock_key = f"lock:{resource}"
    # SET key value NX PX ttl (atomic: only set if not exists)
    acquired = await redis.set(lock_key, lock_id, nx=True, px=ttl * 1000)
    return lock_id if acquired else None

async def release_lock(resource: str, lock_id: str):
    script = """
    if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
    else
        return 0
    end
    """
    await redis.eval(script, 1, f"lock:{resource}", lock_id)
```

### In-Memory Cache — cachetools / Functools
```python
from functools import lru_cache
from cachetools import TTLCache, LRUCache, cached

# lru_cache (no TTL, process-local)
@lru_cache(maxsize=128)
def get_config(key: str) -> str:
    return db.fetch_config(key)   # cached after first call

# TTLCache with cachetools (has TTL)
from cachetools import TTLCache
cache = TTLCache(maxsize=100, ttl=300)  # 100 items, 5 min TTL

@cached(cache)
def get_user_profile(user_id: int) -> dict:
    return db.fetch_user(user_id)
```

---

## 6. Task Queues — Celery & Redis

### Celery Setup
```python
# pip install celery[redis] flower

# celery_app.py
from celery import Celery
from celery.schedules import crontab
import os

celery = Celery(
    "myapp",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    include=["app.tasks.email", "app.tasks.reports"]
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,         # ack after task completes (safer)
    worker_prefetch_multiplier=1, # don't prefetch (for long tasks)
    task_soft_time_limit=300,    # SoftTimeLimitExceeded after 5 min
    task_time_limit=360,         # SIGKILL after 6 min
    # Beat schedule for periodic tasks
    beat_schedule={
        "cleanup-expired-sessions": {
            "task": "app.tasks.cleanup_sessions",
            "schedule": crontab(hour=2, minute=0),  # daily at 2 AM
        },
        "send-daily-report": {
            "task": "app.tasks.send_report",
            "schedule": crontab(hour=8, minute=0),  # daily at 8 AM
        },
    }
)
```

### Celery Tasks
```python
# app/tasks/email.py
from celery_app import celery
from celery import Task
from celery.exceptions import MaxRetriesExceededError

class EmailTask(Task):
    """Base task with error handling."""
    abstract = True
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        print(f"Task {task_id} failed: {exc}")

@celery.task(
    bind=True,
    base=EmailTask,
    max_retries=3,
    default_retry_delay=60,      # retry after 60 seconds
    autoretry_for=(ConnectionError, TimeoutError),
    retry_backoff=True,          # exponential backoff
    retry_jitter=True,           # add randomness
)
def send_welcome_email(self, user_id: int, email: str):
    try:
        result = email_service.send(
            to=email,
            subject="Welcome!",
            template="welcome.html",
            context={"user_id": user_id}
        )
        return {"status": "sent", "message_id": result.id}
    except (ConnectionError, TimeoutError) as exc:
        raise self.retry(exc=exc)

@celery.task
def generate_report(report_type: str, user_id: int):
    data = fetch_report_data(report_type, user_id)
    pdf = generate_pdf(data)
    s3_url = upload_to_s3(pdf)
    notify_user(user_id, s3_url)
    return s3_url

# Chaining tasks (pipeline)
from celery import chain, group, chord

# Chain: A → B → C (sequential)
workflow = chain(
    fetch_data.s(user_id),
    process_data.s(),
    send_notification.s()
)
workflow.delay()

# Group: run multiple tasks in parallel
job = group(
    send_email.s(user.email),
    send_sms.s(user.phone),
    push_notification.s(user.device_token)
)
job.apply_async()

# Chord: parallel tasks then callback when all done
callback = update_status.s(order_id)
job = chord(
    group(validate_payment.s(), check_inventory.s(), verify_address.s()),
    callback
)
job.apply_async()

# Calling tasks
send_welcome_email.delay(user_id=1, email="a@b.com")          # fire and forget
result = send_welcome_email.apply_async(args=[1, "a@b.com"],   # more control
                                         countdown=60)         # delay 60s
result = send_welcome_email.apply_async(eta=datetime(2026,5,1,9,0,0))  # schedule

# Check result
result = generate_report.delay("monthly", user_id=5)
result.id            # task ID
result.status        # PENDING, STARTED, SUCCESS, FAILURE, RETRY, REVOKED
result.get(timeout=30)  # blocking wait for result
result.get(propagate=False)  # don't raise exception on failure
```

---

## 7. Message Queues — Kafka & RabbitMQ in Python

### Kafka with confluent-kafka / aiokafka
```python
# pip install confluent-kafka
# pip install aiokafka  (async)

# --- PRODUCER ---
from confluent_kafka import Producer
import json

producer = Producer({
    "bootstrap.servers": "localhost:9092",
    "acks": "all",                  # wait for all replicas
    "retries": 3,
    "enable.idempotence": True,     # exactly-once semantics
})

def delivery_callback(err, msg):
    if err:
        print(f"Message delivery failed: {err}")
    else:
        print(f"Delivered to {msg.topic()} [{msg.partition()}] @ {msg.offset()}")

def publish_event(topic: str, key: str, data: dict):
    producer.produce(
        topic=topic,
        key=key.encode("utf-8"),
        value=json.dumps(data).encode("utf-8"),
        callback=delivery_callback
    )
    producer.poll(0)   # trigger callbacks

publish_event("orders", key="order-123", data={"order_id": 123, "status": "PLACED"})
producer.flush()   # wait for all messages to be delivered

# --- ASYNC PRODUCER (aiokafka) ---
from aiokafka import AIOKafkaProducer

async def kafka_producer_example():
    producer = AIOKafkaProducer(
        bootstrap_servers="localhost:9092",
        value_serializer=lambda v: json.dumps(v).encode()
    )
    await producer.start()
    try:
        await producer.send_and_wait("orders", value={"order_id": 123})
    finally:
        await producer.stop()

# --- CONSUMER ---
from confluent_kafka import Consumer

consumer = Consumer({
    "bootstrap.servers": "localhost:9092",
    "group.id": "payment-service",
    "auto.offset.reset": "earliest",
    "enable.auto.commit": False,      # manual commit
})
consumer.subscribe(["orders"])

try:
    while True:
        msg = consumer.poll(timeout=1.0)
        if msg is None:
            continue
        if msg.error():
            print(f"Consumer error: {msg.error()}")
            continue
        event = json.loads(msg.value())
        try:
            process_order_event(event)
            consumer.commit(message=msg)  # manual ack
        except Exception as e:
            print(f"Failed to process: {e}")
            # Dead letter queue, retry, etc.
finally:
    consumer.close()

# --- ASYNC CONSUMER (aiokafka) ---
from aiokafka import AIOKafkaConsumer

async def consume():
    consumer = AIOKafkaConsumer(
        "orders",
        bootstrap_servers="localhost:9092",
        group_id="payment-service",
        enable_auto_commit=False,
        value_deserializer=lambda m: json.loads(m.decode())
    )
    await consumer.start()
    try:
        async for msg in consumer:
            await handle_event(msg.value)
            await consumer.commit()
    finally:
        await consumer.stop()
```

### RabbitMQ with aio-pika
```python
# pip install aio-pika

import aio_pika, json

# --- PUBLISHER ---
async def publish(routing_key: str, message: dict):
    connection = await aio_pika.connect_robust("amqp://guest:guest@localhost/")
    async with connection:
        channel = await connection.channel()
        exchange = await channel.declare_exchange(
            "events", aio_pika.ExchangeType.TOPIC
        )
        await exchange.publish(
            aio_pika.Message(
                body=json.dumps(message).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type="application/json"
            ),
            routing_key=routing_key
        )

# --- CONSUMER ---
async def consume():
    connection = await aio_pika.connect_robust("amqp://guest:guest@localhost/")
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=1)  # process one at a time

    exchange = await channel.declare_exchange("events", aio_pika.ExchangeType.TOPIC)
    queue = await channel.declare_queue("payment_queue", durable=True)
    await queue.bind(exchange, routing_key="order.*")

    async with queue.iterator() as q_iter:
        async for message in q_iter:
            async with message.process():   # auto ack/nack
                event = json.loads(message.body)
                await process_event(event)
```

---

## 8. Microservices in Python

### Service-to-Service Communication
```python
# HTTP with httpx (async HTTP client)
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

http_client = httpx.AsyncClient(
    timeout=httpx.Timeout(connect=5, read=30, write=10, pool=5),
    limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10)
)
async def call_payment_service(order_id: str, amount: float) -> dict:
    response = await http_client.post(
        "http://payment-service:8001/api/payments",
        json={"order_id": order_id, "amount": amount},
        headers={"Authorization": f"Bearer {get_service_token()}"}
    )
    response.raise_for_status()
    return response.json()

# Circuit breaker with pybreaker
from pybreaker import CircuitBreaker, CircuitBreakerError

payment_breaker = CircuitBreaker(
    fail_max=5,          # open after 5 failures
    reset_timeout=30     # try again after 30 seconds
)

@payment_breaker
async def call_payment(order_id: str) -> dict:
    return await call_payment_service(order_id, 100.0)

async def process_payment(order_id: str) -> dict:
    try:
        return await call_payment(order_id)
    except CircuitBreakerError:
        # fallback: queue the payment for later
        await payment_queue.enqueue(order_id)
        return {"status": "queued", "order_id": order_id}
```

### Service Discovery with Consul
```python
import consul.aio

async def register_service():
    c = consul.aio.Consul()
    await c.agent.service.register(
        name="order-service",
        service_id="order-service-1",
        address="0.0.0.0",
        port=8000,
        check=consul.Check.http("http://localhost:8000/health", "10s")
    )

async def discover_service(name: str) -> str:
    c = consul.aio.Consul()
    _, services = await c.health.service(name, passing=True)
    if not services:
        raise ServiceUnavailableError(name)
    service = random.choice(services)  # simple load balancing
    addr = service["Service"]["Address"]
    port = service["Service"]["Port"]
    return f"http://{addr}:{port}"
```

### Distributed Tracing with OpenTelemetry
```python
# pip install opentelemetry-api opentelemetry-sdk opentelemetry-instrumentation-fastapi

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor

# Setup
provider = TracerProvider()
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://jaeger:4317"))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

# Auto-instrument FastAPI, SQLAlchemy, Redis
FastAPIInstrumentor.instrument_app(app)
SQLAlchemyInstrumentor().instrument(engine=engine)
RedisInstrumentor().instrument()

# Manual spans
tracer = trace.get_tracer(__name__)

async def process_order(order_id: str):
    with tracer.start_as_current_span("process_order") as span:
        span.set_attribute("order.id", order_id)
        span.set_attribute("service.name", "order-service")

        with tracer.start_as_current_span("validate_payment"):
            result = await validate_payment(order_id)
            span.set_attribute("payment.valid", result)

        with tracer.start_as_current_span("update_inventory"):
            await update_inventory(order_id)
```

---

## 9. API Design Patterns in Python

### Rate Limiting
```python
# Using slowapi (wraps limits library for FastAPI)
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["200/day", "50/hour"])
app.state.limiter = limiter

@app.get("/api/search")
@limiter.limit("10/minute")
async def search(request: Request, q: str):
    return {"results": await do_search(q)}

# Custom key function (per user, not IP)
def get_user_id(request: Request) -> str:
    return request.state.user.id if hasattr(request.state, "user") else get_remote_address(request)

limiter = Limiter(key_func=get_user_id)

# Redis-based custom rate limiter (sliding window)
async def check_rate_limit(user_id: str, limit: int = 100, window: int = 60) -> bool:
    key = f"rate_limit:{user_id}"
    now = time.time()
    pipe = redis.pipeline()
    pipe.zremrangebyscore(key, 0, now - window)    # remove old entries
    pipe.zadd(key, {str(now): now})                # add current request
    pipe.zcard(key)                                # count in window
    pipe.expire(key, window)
    results = await pipe.execute()
    request_count = results[2]
    return request_count <= limit
```

### Pagination
```python
from pydantic import BaseModel
from typing import Generic, TypeVar, List

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    has_next: bool
    has_prev: bool

    @classmethod
    def create(cls, items, total, page, size):
        return cls(
            items=items,
            total=total,
            page=page,
            size=size,
            has_next=(page * size) < total,
            has_prev=page > 1
        )

# Cursor-based pagination (better for large datasets)
class CursorPage(BaseModel, Generic[T]):
    items: List[T]
    next_cursor: str | None
    has_more: bool

async def get_orders_cursor(cursor: str | None, limit: int = 20):
    query = select(Order).order_by(Order.id)
    if cursor:
        # decode cursor (base64 encoded last ID)
        last_id = int(base64.b64decode(cursor))
        query = query.where(Order.id > last_id)
    query = query.limit(limit + 1)

    result = await db.execute(query)
    orders = result.scalars().all()
    has_more = len(orders) > limit
    items = orders[:limit]
    next_cursor = base64.b64encode(str(items[-1].id).encode()).decode() if has_more else None
    return CursorPage(items=items, next_cursor=next_cursor, has_more=has_more)
```

---

## 10. Monitoring, Logging & Observability

### Structured Logging
```python
import structlog, logging

# Configure structlog
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer(),   # JSON for ELK/Datadog
    ],
    logger_factory=structlog.PrintLoggerFactory(),
)

log = structlog.get_logger()

# In FastAPI middleware: bind request_id to all logs in request scope
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        path=request.url.path,
        method=request.method,
    )
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    log.info("request_completed", status=response.status_code, duration_ms=round(duration*1000))
    structlog.contextvars.clear_contextvars()
    return response

# In service
async def create_order(order_data: dict) -> Order:
    log.info("creating_order", user_id=order_data["user_id"])
    try:
        order = await order_repo.create(order_data)
        log.info("order_created", order_id=order.id)
        return order
    except Exception as e:
        log.error("order_creation_failed", error=str(e), exc_info=True)
        raise
```

### Prometheus Metrics
```python
# pip install prometheus-client prometheus-fastapi-instrumentator

from prometheus_client import Counter, Histogram, Gauge, Summary
from prometheus_fastapi_instrumentator import Instrumentator

# Auto-instrument FastAPI
Instrumentator().instrument(app).expose(app)  # exposes /metrics endpoint

# Custom metrics
REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"])
REQUEST_LATENCY = Histogram("http_request_duration_seconds", "HTTP request latency", ["endpoint"])
ACTIVE_ORDERS = Gauge("active_orders_total", "Current active orders")
DB_QUERY_DURATION = Summary("db_query_duration_seconds", "DB query duration", ["query_name"])

# Usage
@app.post("/orders")
async def create_order(data: CreateOrderRequest):
    REQUEST_COUNT.labels(method="POST", endpoint="/orders", status="200").inc()
    ACTIVE_ORDERS.inc()

    with REQUEST_LATENCY.labels(endpoint="/orders").time():
        order = await order_service.create(data)

    return order

# DB query timing
async def get_user_from_db(user_id: int):
    with DB_QUERY_DURATION.labels(query_name="get_user").time():
        return await db.get(User, user_id)
```

### Health Checks
```python
from fastapi import FastAPI
from enum import Enum

class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"

@app.get("/health")
async def health_check():
    checks = {}

    # Database
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = HealthStatus.HEALTHY
    except Exception as e:
        checks["database"] = HealthStatus.UNHEALTHY

    # Redis
    try:
        await redis.ping()
        checks["redis"] = HealthStatus.HEALTHY
    except Exception:
        checks["redis"] = HealthStatus.UNHEALTHY

    # Celery
    try:
        inspect = celery.control.inspect(timeout=1)
        checks["celery"] = HealthStatus.HEALTHY if inspect.ping() else HealthStatus.DEGRADED
    except Exception:
        checks["celery"] = HealthStatus.UNHEALTHY

    overall = HealthStatus.HEALTHY
    if any(v == HealthStatus.UNHEALTHY for v in checks.values()):
        overall = HealthStatus.UNHEALTHY
    elif any(v == HealthStatus.DEGRADED for v in checks.values()):
        overall = HealthStatus.DEGRADED

    status_code = 200 if overall == HealthStatus.HEALTHY else 503
    return JSONResponse({"status": overall, "checks": checks}, status_code=status_code)
```

---

## 11. Real-World System Designs (Python Stack)

### Design 1: URL Shortener in Python

```python
# Tech Stack: FastAPI + Redis + PostgreSQL

# Data Model
class URLMapping(Base):
    __tablename__ = "url_mappings"
    short_code: Mapped[str] = mapped_column(String(10), primary_key=True)
    original_url: Mapped[str] = mapped_column(Text, nullable=False)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    expires_at: Mapped[datetime | None]
    click_count: Mapped[int] = mapped_column(default=0)

# Short code generation
import base62  # pip install pybase62
import hashlib

def generate_short_code(url: str) -> str:
    # Hash + base62 encoding
    hash_bytes = hashlib.md5(url.encode()).digest()[:6]  # 6 bytes
    number = int.from_bytes(hash_bytes, "big")
    return base62.encode(number)[:7]  # 7 chars = 62^7 possibilities

# Auto-increment approach (collision-free)
async def generate_short_code_atomic() -> str:
    counter = await redis.incr("url_counter")  # atomic increment
    return base62.encode(counter)

# API
@app.post("/shorten", response_model=ShortenResponse)
async def shorten_url(req: ShortenRequest, db: AsyncSession = Depends(get_db)):
    short_code = await generate_short_code_atomic()
    mapping = URLMapping(short_code=short_code, original_url=str(req.url))
    db.add(mapping)
    await db.commit()
    # Cache in Redis
    await redis.setex(f"url:{short_code}", 86400, str(req.url))
    return {"short_url": f"https://sho.rt/{short_code}"}

@app.get("/{short_code}")
async def redirect(short_code: str, db: AsyncSession = Depends(get_db)):
    # Check Redis cache first
    original = await redis.get(f"url:{short_code}")
    if not original:
        # DB lookup
        result = await db.get(URLMapping, short_code)
        if not result:
            raise HTTPException(404, "Not found")
        original = result.original_url
        await redis.setex(f"url:{short_code}", 86400, original)

    # Async click tracking (don't block redirect)
    track_click.delay(short_code)   # Celery task
    return RedirectResponse(url=original, status_code=302)

@celery.task
def track_click(short_code: str):
    db.execute(
        update(URLMapping)
        .where(URLMapping.short_code == short_code)
        .values(click_count=URLMapping.click_count + 1)
    )
    db.commit()
```

### Design 2: Notification Service in Python

```python
# Tech Stack: FastAPI + Celery + Redis + Kafka + PostgreSQL

# Event-driven notification flow:
#   1. Event published to Kafka (order placed, payment failed, etc.)
#   2. Notification consumer reads events
#   3. Fetch user preferences
#   4. Route to appropriate channel (email/SMS/push)
#   5. Send via third-party provider (SES, Twilio, FCM)

# Models
class NotificationTemplate(Base):
    __tablename__ = "notification_templates"
    id: Mapped[int] = mapped_column(primary_key=True)
    event_type: Mapped[str]  # "ORDER_PLACED", "PAYMENT_FAILED"
    channel: Mapped[str]     # "EMAIL", "SMS", "PUSH"
    subject: Mapped[str | None]
    body_template: Mapped[str]  # Jinja2 template

class UserPreference(Base):
    __tablename__ = "user_notification_prefs"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    event_type: Mapped[str] = mapped_column(primary_key=True)
    email_enabled: Mapped[bool] = mapped_column(default=True)
    sms_enabled: Mapped[bool] = mapped_column(default=False)
    push_enabled: Mapped[bool] = mapped_column(default=True)
    quiet_hours_start: Mapped[int | None]  # hour 0-23
    quiet_hours_end: Mapped[int | None]

# Notification processor
class NotificationProcessor:
    def __init__(self, db, redis, email_svc, sms_svc, push_svc):
        self.db = db
        self.redis = redis
        self.channels = {"EMAIL": email_svc, "SMS": sms_svc, "PUSH": push_svc}

    async def process_event(self, event: dict):
        user_id = event["user_id"]
        event_type = event["event_type"]

        # Idempotency check
        idempotency_key = f"notif:{event.get('event_id', '')}"
        if await self.redis.get(idempotency_key):
            return  # already processed
        await self.redis.setex(idempotency_key, 86400, "1")

        # Get user preferences (cached)
        prefs = await self.get_prefs_cached(user_id, event_type)
        if not prefs:
            return  # user opted out

        # Get templates
        templates = await self.db.execute(
            select(NotificationTemplate).where(
                NotificationTemplate.event_type == event_type
            )
        )

        # Send per channel
        for template in templates.scalars():
            if not self.is_channel_enabled(prefs, template.channel):
                continue
            if self.is_quiet_hours(prefs):
                await self.schedule_for_later(user_id, event, template)
                continue
            await self.send(user_id, event, template)

    async def send(self, user_id: int, event: dict, template: NotificationTemplate):
        from jinja2 import Template
        body = Template(template.body_template).render(**event)
        channel_svc = self.channels[template.channel]
        await channel_svc.send(user_id=user_id, subject=template.subject, body=body)

# Kafka consumer
async def run_notification_consumer():
    consumer = AIOKafkaConsumer(
        "order-events", "payment-events", "promo-events",
        bootstrap_servers="localhost:9092",
        group_id="notification-service",
        value_deserializer=lambda m: json.loads(m.decode())
    )
    processor = NotificationProcessor(...)
    await consumer.start()
    async for msg in consumer:
        await processor.process_event(msg.value)
        await consumer.commit()
```

### Design 3: Real-Time Chat with WebSocket + Redis Pub/Sub

```python
# FastAPI WebSocket + Redis Pub/Sub for multi-instance chat

import asyncio
import json
import redis.asyncio as aioredis
from fastapi import WebSocket, WebSocketDisconnect

class ChatManager:
    def __init__(self, redis_url: str):
        self.redis = aioredis.from_url(redis_url)
        # Local connections on this server instance
        self.connections: dict[str, set[WebSocket]] = {}  # room_id → set of websockets

    async def join_room(self, room_id: str, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if room_id not in self.connections:
            self.connections[room_id] = set()
            asyncio.create_task(self._subscribe_to_room(room_id))  # subscribe to Redis
        self.connections[room_id].add(websocket)
        # Notify others
        await self.publish_to_room(room_id, {"type": "join", "user_id": user_id})

    async def leave_room(self, room_id: str, websocket: WebSocket, user_id: str):
        self.connections[room_id].discard(websocket)
        await self.publish_to_room(room_id, {"type": "leave", "user_id": user_id})

    async def publish_to_room(self, room_id: str, message: dict):
        # Publish to Redis — all server instances subscribed to this room receive it
        await self.redis.publish(f"chat:{room_id}", json.dumps(message))

    async def _subscribe_to_room(self, room_id: str):
        # Subscribe to Redis channel and forward to local WebSocket connections
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(f"chat:{room_id}")
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue
            data = message["data"]
            dead = set()
            for ws in self.connections.get(room_id, set()):
                try:
                    await ws.send_text(data)
                except Exception:
                    dead.add(ws)
            self.connections[room_id] -= dead

manager = ChatManager("redis://localhost:6379")

@app.websocket("/ws/chat/{room_id}")
async def chat_endpoint(websocket: WebSocket, room_id: str, user_id: str):
    await manager.join_room(room_id, websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = {"type": "message", "user_id": user_id, "text": data}
            await manager.publish_to_room(room_id, message)
            # Persist to DB asynchronously
            save_message.delay(room_id, user_id, data)
    except WebSocketDisconnect:
        await manager.leave_room(room_id, websocket, user_id)
```

---

## 12. Python vs Go vs Java for System Design

```
THROUGHPUT (requests/sec, simple JSON API, single instance):
  Java (Spring Boot):     ~50,000–80,000 RPS
  Go (Gin/Fiber):         ~100,000–500,000 RPS
  Python (FastAPI async): ~20,000–50,000 RPS
  Python (Flask sync):    ~5,000–15,000 RPS

MEMORY (idle REST service):
  Java (JVM):    200–500 MB
  Go:            10–50 MB
  Python:        50–100 MB

STARTUP TIME:
  Java:   5–30 seconds
  Go:     ~10 milliseconds
  Python: 0.5–3 seconds (fast without heavy imports)

WHEN TO CHOOSE PYTHON IN SYSTEM DESIGN:
  ✅ ML model serving (FastAPI + TensorFlow/PyTorch)
  ✅ Data processing pipelines (Pandas, Spark)
  ✅ Rapid feature delivery (less code, faster dev)
  ✅ NLP/AI features (Python has the best libraries)
  ✅ Internal tools, dashboards, admin APIs

WHEN TO CHOOSE GO/JAVA OVER PYTHON:
  ✅ Low-latency services (< 10ms SLA)
  ✅ High-throughput ingestion (millions of events/sec)
  ✅ CPU-intensive computation
  ✅ Critical infrastructure (proxies, load balancers)
```

---

## 13. Interview Q&A

**Q: How do you handle the GIL for CPU-bound tasks in Python?**
A: Use `multiprocessing` instead of `threading` — each process has its own GIL. For ML inference, use `ProcessPoolExecutor`. Celery workers are separate processes. Also, NumPy/Pandas release the GIL during their C-level computations, so Python threads work fine for numerical work. For extreme performance, consider offloading to Go or Rust microservices.

**Q: How do you scale a Python FastAPI application?**
A: 1) Vertical: increase resources, add more Uvicorn workers (`workers = 2 * CPU + 1`). 2) Horizontal: deploy multiple instances behind a load balancer (Nginx, AWS ALB), using stateless design — session in Redis, no local state. 3) Async I/O: use `async def` routes + `async` DB/Redis clients for high concurrency within each worker. 4) Caching: Redis for frequent reads. 5) Background tasks: Celery for heavy work.

**Q: How does Celery work and when would you use it?**
A: Celery is a distributed task queue. Tasks are Python functions decorated with `@celery.task`. When `.delay()` is called, Celery serializes the task + args and pushes to a broker (Redis/RabbitMQ). Worker processes pick tasks off the queue and execute them. Results are stored in a backend (Redis/DB). Use for: async email/SMS sending, report generation, image processing, scheduled jobs, anything that shouldn't block the HTTP response.

**Q: How would you implement idempotency in a Python API?**
A: Clients send an `Idempotency-Key` header (UUID). Server stores `key → result` in Redis with TTL. On first request: process and store result. On duplicate request: return cached result immediately. For financial transactions, also store in DB with a unique constraint on the idempotency key.

**Q: How do you prevent cache stampede in Python?**
A: 1) **Mutex lock**: use Redis `SET NX` (set if not exists) to allow only one process to recompute. 2) **Probabilistic early expiration**: before key expires, probabilistically recompute it. 3) **Background refresh**: a separate task refreshes cache before it expires. Example with Redis lock: acquire lock, check cache again (double check), if still miss fetch from DB, release lock.
