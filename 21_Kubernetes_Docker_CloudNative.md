# Kubernetes, Docker & Cloud-Native — Deep Dive
### Containerization → Orchestration → AWS | Backend Engineer Edition

---

## TABLE OF CONTENTS
1. [Why Containers — Docker Fundamentals](#1-docker-fundamentals)
2. [Writing Production Dockerfiles](#2-production-dockerfiles)
3. [Docker Networking, Volumes, Compose](#3-docker-networking-volumes)
4. [Kubernetes Architecture](#4-kubernetes-architecture)
5. [Pods, ReplicaSets & Deployments](#5-pods-deployments)
6. [Services & Ingress](#6-services-ingress)
7. [ConfigMaps & Secrets](#7-configmaps-secrets)
8. [Liveness, Readiness & Startup Probes](#8-probes)
9. [Resource Requests, Limits & QoS](#9-resources-limits)
10. [Horizontal Pod Autoscaler](#10-hpa)
11. [Rolling Deploys & Rollbacks](#11-rolling-deploys)
12. [Stateful Workloads & Storage](#12-stateful-storage)
13. [AWS for Backend Engineers](#13-aws)
14. [CI/CD to Kubernetes](#14-cicd)
15. [Troubleshooting Pods](#15-troubleshooting)
16. [Interview Q&A](#16-interview-qa)

---

## 1. Docker Fundamentals

A **container** packages your app + dependencies into an isolated, portable unit sharing the host kernel (lighter than a VM). An **image** is the immutable template; a **container** is a running instance.

```
Image (layers)  ──run──►  Container (process)
VM = full OS per app (heavy) ;  Container = shared kernel, isolated userspace (light)
```
- Images are built from a **Dockerfile**, made of cached **layers**.
- Registries (Docker Hub, ECR, GHCR) store images.
- Key commands: `docker build -t app:1.0 .`, `docker run -p 8080:8080 app:1.0`, `docker ps`, `docker logs`, `docker exec -it <id> sh`.

---

## 2. Production Dockerfiles

Use **multi-stage builds** to ship a small, secure runtime image.
```dockerfile
# ---- build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline          # cache deps layer
COPY src ./src
RUN mvn -q clean package -DskipTests

# ---- runtime stage ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/target/*.jar app.jar
USER app                               # don't run as root
EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","app.jar"]
```
**Best practices:** order layers least→most changing (deps before source) for cache hits; small base (`alpine`/`distroless`); non-root user; pin versions; `.dockerignore`; one process per container; `-XX:MaxRAMPercentage` so the JVM respects the container memory limit.

---

## 3. Docker Networking, Volumes

- **Networking:** containers on a user-defined bridge network resolve each other by name. `-p host:container` publishes ports.
- **Volumes:** persist data beyond container life (`-v data:/var/lib/...`); containers are ephemeral by design.
- **docker-compose** for local multi-service dev:
```yaml
services:
  app:
    build: .
    ports: ["8080:8080"]
    environment: { SPRING_PROFILES_ACTIVE: dev }
    depends_on: [db, kafka]
  db:
    image: postgres:16
    environment: { POSTGRES_PASSWORD: secret }
    volumes: ["pgdata:/var/lib/postgresql/data"]
volumes: { pgdata: {} }
```

---

## 4. Kubernetes Architecture

Kubernetes orchestrates containers across a cluster: scheduling, self-healing, scaling, networking.
```
Control Plane:
  ├── kube-apiserver   (front door; all changes go through it)
  ├── etcd             (cluster state store)
  ├── scheduler        (places pods on nodes)
  └── controller-mgr   (reconciles desired vs actual state)
Worker Node:
  ├── kubelet          (runs pods, reports status)
  ├── kube-proxy       (networking/routing)
  └── container runtime (containerd)
```
**Core idea — declarative reconciliation:** you declare *desired state* (YAML); controllers continuously drive *actual state* toward it. This is why K8s self-heals.

---

## 5. Pods, ReplicaSets & Deployments

- **Pod** — smallest unit; one or more containers sharing network/storage. Usually one app container (+ optional sidecars).
- **ReplicaSet** — keeps N identical pods running.
- **Deployment** — manages ReplicaSets, enabling **rolling updates & rollbacks** (what you actually use).

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: orders-api }
spec:
  replicas: 3
  selector: { matchLabels: { app: orders-api } }
  template:
    metadata: { labels: { app: orders-api } }
    spec:
      containers:
        - name: app
          image: 123.dkr.ecr.ap-south-1.amazonaws.com/orders-api:1.4.2
          ports: [{ containerPort: 8080 }]
```

---

## 6. Services & Ingress

Pods are ephemeral with changing IPs; a **Service** gives a stable virtual IP + DNS name and load-balances across matching pods.
| Service type | Use |
|--------------|-----|
| `ClusterIP` (default) | Internal-only access |
| `NodePort` | Expose on each node's port (dev) |
| `LoadBalancer` | Cloud LB (e.g., AWS ELB) for external traffic |

```yaml
apiVersion: v1
kind: Service
metadata: { name: orders-api }
spec:
  selector: { app: orders-api }
  ports: [{ port: 80, targetPort: 8080 }]
```
**Ingress** + an ingress controller (NGINX/ALB) routes external HTTP(S) by host/path to services — one entry point, TLS termination, path routing.

---

## 7. ConfigMaps & Secrets

Externalize configuration from images (12-factor).
```yaml
apiVersion: v1
kind: ConfigMap
metadata: { name: orders-config }
data:
  SPRING_PROFILES_ACTIVE: "prod"
  LOG_LEVEL: "INFO"
---
apiVersion: v1
kind: Secret
metadata: { name: orders-secrets }
type: Opaque
data:
  DB_PASSWORD: c2VjcmV0       # base64 (NOT encrypted by default)
```
Inject into pods via `envFrom` or mounted files. **Secrets are only base64-encoded** → enable encryption-at-rest, RBAC, and prefer an external manager (AWS Secrets Manager + External Secrets Operator, Vault). Never bake secrets into images.

---

## 8. Probes

K8s uses probes to know pod health — critical for zero-downtime.
| Probe | Question | On failure |
|-------|----------|-----------|
| **liveness** | Is it alive? | Restart the container |
| **readiness** | Can it serve traffic? | Remove from Service endpoints (no restart) |
| **startup** | Has it finished booting? | Protects slow-starting apps from liveness kills |

```yaml
livenessProbe:
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  initialDelaySeconds: 30
  periodSeconds: 10
readinessProbe:
  httpGet: { path: /actuator/health/readiness, port: 8080 }
  periodSeconds: 5
```
> Classic bug: readiness pointing at a deep health check that depends on a flaky downstream → pod flaps out of rotation. Keep liveness shallow; readiness reflects ability to serve.

---

## 9. Resource Requests, Limits & QoS

```yaml
resources:
  requests: { cpu: "250m", memory: "512Mi" }   # scheduler reserves this
  limits:   { cpu: "1",    memory: "1Gi" }      # hard cap
```
- **Requests** drive scheduling; **limits** cap usage.
- Exceeding **memory** limit → **OOMKilled**. Exceeding **CPU** limit → throttled (not killed).
- **QoS classes:** *Guaranteed* (requests==limits), *Burstable*, *BestEffort* — affects eviction order under node pressure.
- For JVMs, set heap relative to the memory limit (`-XX:MaxRAMPercentage=75`) or you'll get OOMKills.

---

## 10. HPA

**Horizontal Pod Autoscaler** scales replica count on metrics.
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  scaleTargetRef: { kind: Deployment, name: orders-api }
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
```
- Needs the **metrics-server** (or custom/external metrics via Prometheus Adapter).
- For event-driven scaling (e.g., **Kafka lag**, queue depth) use **KEDA**.
- HPA scales pods; **Cluster Autoscaler** scales nodes when pods can't be scheduled.

---

## 11. Rolling Deploys & Rollbacks

Default Deployment strategy is **RollingUpdate** — gradually replace old pods with new, no downtime.
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }   # keep capacity during rollout
```
```bash
kubectl set image deploy/orders-api app=orders-api:1.4.3
kubectl rollout status deploy/orders-api
kubectl rollout undo deploy/orders-api          # instant rollback to previous ReplicaSet
kubectl rollout history deploy/orders-api
```
Other strategies (via Argo Rollouts/flags): **blue-green**, **canary**. Readiness probes make rollouts safe (traffic only to ready pods).

---

## 12. Stateful Workloads & Storage

- **Deployment** = stateless. For databases/Kafka use **StatefulSet** (stable network IDs, ordered start, per-pod **PersistentVolumeClaim**).
- **PV/PVC**: PersistentVolume (actual storage, e.g., AWS EBS) bound to a PersistentVolumeClaim requested by a pod; **StorageClass** enables dynamic provisioning.
- General advice: run stateful infra (DB, Kafka) as **managed cloud services** (RDS, MSK) rather than self-managing on K8s unless you must.

---

## 13. AWS

Core services backend JDs name:
| Service | Use |
|---------|-----|
| **EKS** | Managed Kubernetes |
| **ECS / Fargate** | Container orchestration (serverless containers) |
| **EC2** | VMs |
| **S3** | Object storage (files, backups, static assets) |
| **RDS / Aurora** | Managed relational DB |
| **DynamoDB** | Managed NoSQL (key-value, single-digit ms) |
| **SQS / SNS** | Queue / pub-sub messaging |
| **MSK** | Managed Kafka |
| **ElastiCache** | Managed Redis |
| **Lambda** | Serverless functions |
| **IAM** | Identity & permissions (least privilege) |
| **CloudWatch** | Metrics, logs, alarms |
| **ALB** | Application load balancer |

**Concepts to articulate:** VPC/subnets/security groups, IAM roles (use **IRSA** for pods, not static keys), multi-AZ for HA, autoscaling groups, and cost-awareness (right-sizing, spot instances).

---

## 14. CI/CD

```yaml
# GitHub Actions: build, push to ECR, deploy to EKS
name: deploy
on: { push: { branches: [main] } }
jobs:
  ship:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: mvn -q clean package
      - run: docker build -t $ECR/orders-api:${{ github.sha }} .
      - run: docker push $ECR/orders-api:${{ github.sha }}
      - run: kubectl set image deploy/orders-api app=$ECR/orders-api:${{ github.sha }}
```
- Pipeline stages: build → test → scan (Trivy/Snyk) → push image → deploy → smoke test.
- **GitOps** (Argo CD / Flux): git is the source of truth; the cluster syncs to the manifests in the repo — auditable, easy rollback.
- Tools: GitHub Actions, Jenkins, GitLab CI, Harness.

---

## 15. Troubleshooting Pods

```bash
kubectl get pods                       # STATUS: CrashLoopBackOff? ImagePullBackOff? Pending?
kubectl describe pod <p>               # events: scheduling, probe failures, OOMKilled
kubectl logs <p> --previous            # logs from the crashed container
kubectl exec -it <p> -- sh             # shell in
kubectl top pod <p>                    # CPU/mem usage
kubectl get events --sort-by=.lastTimestamp
```
| Symptom | Likely cause |
|---------|--------------|
| `CrashLoopBackOff` | App crashes on start / failing liveness |
| `ImagePullBackOff` | Bad image name/tag or registry auth |
| `Pending` | No node with enough resources / unbound PVC |
| `OOMKilled` | Memory limit too low (or JVM heap > limit) |
| 503 from service | No ready pods (readiness failing) |

---

## 16. Interview Q&A

**Q1. Container vs VM?**
Containers share the host kernel and isolate userspace — lightweight, fast start. VMs run a full guest OS — heavier, stronger isolation.

**Q2. Liveness vs readiness probe?**
Liveness restarts a hung container; readiness removes a pod from the load balancer until it can serve. Failing readiness ≠ restart.

**Q3. How does a rolling update achieve zero downtime?**
New pods start and pass readiness before old pods are terminated (`maxUnavailable: 0`, `maxSurge`), so there's always healthy capacity; rollback reverts to the previous ReplicaSet.

**Q4. requests vs limits, and what is OOMKilled?**
Requests are guaranteed/scheduled resources; limits are caps. Exceeding the memory limit kills the container (OOMKilled); CPU over-limit throttles.

**Q5. How do you autoscale on Kafka lag?**
HPA on CPU isn't enough; use **KEDA** with a Kafka lag scaler to scale consumers by lag, plus Cluster Autoscaler for nodes.

**Q6. How are Secrets secured in K8s?**
By default only base64-encoded. Enable encryption-at-rest, restrict via RBAC, and prefer external managers (AWS Secrets Manager + External Secrets, Vault); never bake into images.

**Q7. Deployment vs StatefulSet?**
Deployment for stateless, interchangeable pods. StatefulSet for stable identities + persistent per-pod storage (databases, Kafka).

**Q8. How does a Service find its pods?**
Via label selectors; kube-proxy/endpoints route traffic to matching, ready pods; clients use the stable Service DNS name.

**Q9. What is GitOps?**
Declarative deployment where git holds the desired manifests and a controller (Argo CD/Flux) continuously reconciles the cluster to match — auditable, reversible.

**Q10. JVM in a container — common pitfall?**
Old JVMs ignored cgroup limits and sized heap to the host. Use a modern JDK + `-XX:MaxRAMPercentage` so heap fits the container limit, avoiding OOMKills.
