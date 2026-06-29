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

**What & why.** Think of an image as a sealed recipe and a container as one cooked meal from that recipe. VMs give each app its own full operating system (heavy, slow to boot). Containers share the host's Linux kernel but give each process its own isolated view of the filesystem, network, and process tree — you get portability ("runs the same on my laptop and in prod") without paying for a guest OS per app.

**How it works.** Isolation comes from two Linux kernel features:
- **Namespaces** — each container gets its own PID, network, mount, and UTS namespace so it *looks* like a mini-machine (process 1 inside the container is not process 1 on the host).
- **cgroups (control groups)** — cap and account for CPU, memory, and I/O so one container cannot starve others.

When you `docker run`, the container runtime (containerd, runc) unpacks image layers into a writable overlay filesystem, applies namespaces/cgroups, and starts your process as PID 1 inside that sandbox.

```
Image (layers)  ──run──►  Container (process)
VM = full OS per app (heavy) ;  Container = shared kernel, isolated userspace (light)
```
- Images are built from a **Dockerfile**, made of cached **layers**.
- Registries (Docker Hub, ECR, GHCR) store images.
- Key commands: `docker build -t app:1.0 .`, `docker run -p 8080:8080 app:1.0`, `docker ps`, `docker logs`, `docker exec -it <id> sh`.

**Example.** You build `orders-api:1.0` on your laptop, push to a registry, and a production host pulls the exact same digest. No "works on my machine" drift — the image *is* the deployment artifact.

**Pitfall.** Containers are not VMs: they share the kernel, so a kernel exploit or misconfigured `--privileged` container can affect the host. Also, PID 1 inside the container must handle signals correctly (Java apps often need an init wrapper or `exec` form of `ENTRYPOINT`) or graceful shutdown fails.

---

## 2. Production Dockerfiles

Use **multi-stage builds** to ship a small, secure runtime image.

**What & why.** A naive Dockerfile that runs `mvn package` and ships the result still contains Maven, source code, and build tools — a 800 MB image with a larger attack surface. Multi-stage builds compile in a "build" stage and copy only the artifact into a slim "runtime" stage. Smaller images pull faster, start faster, and expose fewer packages to CVE scanners.

**How it works.** Each `FROM` starts a new stage. Earlier stages can be discarded; only the final stage becomes your published image. Docker caches each instruction as a layer — if `pom.xml` hasn't changed, the `RUN mvn dependency:go-offline` layer is reused and builds skip re-downloading dependencies.

```dockerfile
# ---- build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline          # cache deps layer — only re-runs when pom.xml changes
COPY src ./src
RUN mvn -q clean package -DskipTests

# ---- runtime stage ----
FROM eclipse-temurin:21-jre-alpine       # JRE only — no compiler, no Maven (~150 MB vs ~700 MB)
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/target/*.jar app.jar   # copy artifact only, not src/ or .m2/
USER app                               # don't run as root — limits container breakout impact
EXPOSE 8080                            # documentation only; does not publish the port by itself
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","app.jar"]
# MaxRAMPercentage: JVM reads cgroup memory limit and caps heap at 75% of it
```

**Best practices:** order layers least→most changing (deps before source) for cache hits; small base (`alpine`/`distroless`); non-root user; pin versions; `.dockerignore`; one process per container; `-XX:MaxRAMPercentage` so the JVM respects the container memory limit.

**Example.** First build: ~3 min (downloads deps). You change one Java file and rebuild: Docker reuses the deps layer, recompiles only — ~30 sec. In CI, layer caching (or BuildKit cache mounts) is the difference between 5-minute and 45-second pipelines.

**Interview angle.** "Why not just `COPY . .` and `RUN mvn package` in one stage?" — acceptable for dev; in prod you ship build tools, leak source, and bloat the registry. Pin base image digests (`FROM eclipse-temurin:21-jre-alpine@sha256:...`) for reproducible builds.

---

## 3. Docker Networking, Volumes

- **Networking:** containers on a user-defined bridge network resolve each other by name. `-p host:container` publishes ports.
- **Volumes:** persist data beyond container life (`-v data:/var/lib/...`); containers are ephemeral by design.

**How it works — networking.** By default, containers on the default bridge cannot resolve each other by name. A **user-defined bridge network** gives each container a DNS name (`db`, `app`) via Docker's embedded DNS. Traffic between containers stays on the internal network; `-p 8080:8080` only maps host port 8080 → container port 8080 for access from your laptop browser.

**How it works — volumes.** Container filesystems are ephemeral: `docker rm` deletes the writable layer. **Named volumes** (`pgdata`) survive container restarts and are managed by Docker — ideal for database data. **Bind mounts** (`./config:/app/config`) map a host directory for live-reload dev configs.

**Pitfall.** `depends_on` in Compose only waits for the container to *start*, not for Postgres to accept connections. Your app may crash on boot; use a healthcheck or retry logic in the app.

- **docker-compose** for local multi-service dev:
```yaml
services:
  app:
    build: .
    ports: ["8080:8080"]              # expose to host; db/kafka stay internal-only
    environment: { SPRING_PROFILES_ACTIVE: dev }
    depends_on: [db, kafka]           # start order only — not readiness
  db:
    image: postgres:16
    environment: { POSTGRES_PASSWORD: secret }
    volumes: ["pgdata:/var/lib/postgresql/data"]   # data survives db container recreation
volumes: { pgdata: {} }
```

**Example.** From inside the `app` container, JDBC URL is `jdbc:postgresql://db:5432/orders` — hostname `db` resolves via Docker DNS. From your laptop, you use `localhost:8080` for the API and typically don't expose Postgres at all.

---

## 4. Kubernetes Architecture

Kubernetes orchestrates containers across a cluster: scheduling, self-healing, scaling, networking.

**What & why.** Running 50 containers across 10 servers by hand — restarting crashed ones, rolling out new versions, wiring networking — does not scale. Kubernetes is a control plane that continuously compares *desired state* (your YAML) to *actual state* (what's running) and acts to close the gap. You describe what you want; K8s figures out how.

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

**How it works — the control loop.** Every K8s object (Deployment, Service, Pod) is watched by a **controller**. Example: you apply a Deployment with `replicas: 3`. The Deployment controller creates a ReplicaSet; the ReplicaSet controller creates 3 Pod objects. The **scheduler** picks a node for each unscheduled Pod (based on CPU/memory requests, affinity, taints). The **kubelet** on that node pulls the image via containerd and starts the container. If a Pod dies, the ReplicaSet controller sees "only 2 running, want 3" and creates a replacement — self-healing without human intervention.

**How a Pod gets scheduled and networked (end-to-end):**
1. `kubectl apply` → apiserver validates and stores the Pod spec in **etcd**.
2. Scheduler binds the Pod to a node (writes `nodeName` in etcd).
3. Kubelet on that node sees the new Pod, pulls the image, starts containers with cgroups/namespaces.
4. Kubelet reports Pod status back to apiserver.
5. If the Pod matches a Service's label selector, an **Endpoint** object is created; **kube-proxy** on every node updates iptables/IPVS rules so traffic to the Service VIP reaches a ready Pod.

**Core idea — declarative reconciliation:** you declare *desired state* (YAML); controllers continuously drive *actual state* toward it. This is why K8s self-heals.

**Interview angle.** etcd is the source of truth — if etcd is corrupted or slow, the cluster is in trouble. The apiserver is the only component that talks to etcd directly; everything else goes through the apiserver API.

---

## 5. Pods, ReplicaSets & Deployments

- **Pod** — smallest unit; one or more containers sharing network/storage. Usually one app container (+ optional sidecars).
- **ReplicaSet** — keeps N identical pods running.
- **Deployment** — manages ReplicaSets, enabling **rolling updates & rollbacks** (what you actually use).

**How it works — Pod internals.** All containers in a Pod share one IP address and one set of volumes. They communicate via `localhost`. A common pattern is an app container + a **sidecar** (e.g., log shipper, service mesh proxy) that augments the main process without changing the app image.

**How it works — Deployment → ReplicaSet → Pod.** When you update a Deployment's image tag, the Deployment controller creates a *new* ReplicaSet with the new template and gradually scales it up while scaling the old ReplicaSet down. Old ReplicaSets are kept (with `replicas: 0`) so `kubectl rollout undo` can instantly revert.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: orders-api }
spec:
  replicas: 3
  selector: { matchLabels: { app: orders-api } }   # how Deployment finds its Pods
  template:
    metadata: { labels: { app: orders-api } }       # labels must match selector
    spec:
      containers:
        - name: app
          image: registry.example.com/orders-api:1.4.2
          ports: [{ containerPort: 8080 }]          # documents port; Service uses targetPort
```

**Example — Pod lifecycle states.** `Pending` (scheduled but image not pulled yet) → `Running` → `Succeeded`/`Failed`. If a node dies, Pods on it go to `Unknown`; the ReplicaSet creates replacements on healthy nodes.

**Pitfall.** Never create bare Pods in production — they are not self-healing. Always use a Deployment (stateless) or StatefulSet (stateful).

---

## 6. Services & Ingress

Pods are ephemeral with changing IPs; a **Service** gives a stable virtual IP + DNS name and load-balances across matching pods.

**How it works.** A Service is a stable front door. K8s assigns it a cluster-internal IP (ClusterIP) and DNS name (`orders-api.default.svc.cluster.local`). The Service controller watches Pods with matching labels and populates an **Endpoints** (or **EndpointSlice**) object with their IPs. **kube-proxy** on each node programs routing rules (iptables or IPVS) so any Pod in the cluster can reach `orders-api:80` and traffic is load-balanced to a ready backend Pod.

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
  selector: { app: orders-api }                    # routes to Pods with this label
  ports: [{ port: 80, targetPort: 8080 }]          # Service port 80 → container port 8080
```

**Ingress** + an ingress controller (NGINX/ALB) routes external HTTP(S) by host/path to services — one entry point, TLS termination, path routing.

**Example.** External request: `https://api.example.com/orders` → cloud LoadBalancer → Ingress controller → `orders-api` Service (port 80) → one of 3 ready Pods (port 8080). If one Pod fails readiness, it is removed from Endpoints automatically — no manual intervention.

**Pitfall.** A Service with no ready endpoints returns connection refused or 503. This is almost always a readiness probe failure, not a Service misconfiguration. Check `kubectl get endpoints orders-api`.

---

## 7. ConfigMaps & Secrets

Externalize configuration from images (12-factor).

**What & why.** Baking config into an image means rebuilding and redeploying for every env change. ConfigMaps hold non-sensitive config; Secrets hold sensitive data. Both decouple "what to run" (image) from "how to configure it" (env-specific values).

**How it works — injection.** You can inject config two ways:
- **Environment variables** — `envFrom: configMapRef` loads all keys as env vars at Pod start. Changing the ConfigMap does *not* restart running Pods unless you use a reloader or rolling restart.
- **Volume mounts** — ConfigMap/Secret mounted as files. Some apps watch the file for hot reload; most Java/Spring apps read env at startup only.

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
  DB_PASSWORD: c2VjcmV0       # base64-encoded — NOT encrypted at rest by default
```

Inject into pods via `envFrom` or mounted files. **Secrets are only base64-encoded** → enable encryption-at-rest, RBAC, and prefer an external manager (AWS Secrets Manager + External Secrets Operator, Vault). Never bake secrets into images.

**Example.** Same `orders-api:1.4.2` image runs in dev (ConfigMap: `LOG_LEVEL=DEBUG`) and prod (ConfigMap: `LOG_LEVEL=WARN`, Secret: real DB password) — zero image rebuild.

**Interview angle.** "Are K8s Secrets encrypted?" — Only base64 by default. Enable `EncryptionConfiguration` at rest, restrict with RBAC, and prefer syncing from an external secrets manager so rotation doesn't require editing YAML.

---

## 8. Probes

K8s uses probes to know pod health — critical for zero-downtime.

**What & why.** Without probes, K8s only knows "the process started." A JVM can be alive but stuck in GC, or alive but unable to reach the database. Probes let the platform distinguish "running" from "healthy" and "ready for traffic."

| Probe | Question | On failure |
|-------|----------|-----------|
| **liveness** | Is it alive? | Restart the container |
| **readiness** | Can it serve traffic? | Remove from Service endpoints (no restart) |
| **startup** | Has it finished booting? | Protects slow-starting apps from liveness kills |

**How it works.** The kubelet runs probe checks on a schedule (`periodSeconds`). For HTTP probes, it hits the path from inside the cluster network. Three consecutive failures (by default) trigger action. **Startup probes** disable liveness/readiness until they succeed — essential for apps that take 60+ seconds to boot (large Spring contexts, cache warm-up).

```yaml
livenessProbe:
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  initialDelaySeconds: 30    # wait before first check (avoid killing during boot)
  periodSeconds: 10
readinessProbe:
  httpGet: { path: /actuator/health/readiness, port: 8080 }
  periodSeconds: 5           # checked more often — traffic routing depends on this
startupProbe:
  httpGet: { path: /actuator/health, port: 8080 }
  failureThreshold: 30       # 30 × periodSeconds = max boot time before liveness kicks in
  periodSeconds: 10
```

**Example — the classic bug.** Readiness checks `/health` which calls the payment gateway. Gateway is slow → readiness fails → Pod removed from load balancer → all Pods flap → 503 for everyone. Fix: liveness checks a shallow `/live` (JVM up); readiness checks DB connectivity only, not every downstream.

> Classic bug: readiness pointing at a deep health check that depends on a flaky downstream → pod flaps out of rotation. Keep liveness shallow; readiness reflects ability to serve.

**Interview angle.** "Failing readiness vs failing liveness?" — Readiness = temporary "don't send traffic" (DB migration in progress). Liveness = "this process is dead, restart it" (deadlock). Never put downstream checks on liveness.

---

## 9. Resource Requests, Limits & QoS

**What & why.** Without limits, one memory-leaking Pod can OOM the entire node, killing neighbors. Without requests, the scheduler may pack too many Pods onto one node, causing CPU starvation. Requests and limits map directly to **cgroup** settings the kubelet applies to each container.

```yaml
resources:
  requests: { cpu: "250m", memory: "512Mi" }   # scheduler reserves this on a node ("250 millicores")
  limits:   { cpu: "1",    memory: "1Gi" }      # hard cap enforced by cgroup
```
- **Requests** drive scheduling; **limits** cap usage.
- Exceeding **memory** limit → **OOMKilled**. Exceeding **CPU** limit → throttled (not killed).
- **QoS classes:** *Guaranteed* (requests==limits), *Burstable*, *BestEffort* — affects eviction order under node pressure.
- For JVMs, set heap relative to the memory limit (`-XX:MaxRAMPercentage=75`) or you'll get OOMKills.

**How it works — scheduling math.** A node with 4 CPU and 16 Gi RAM can fit at most ~16 Pods with `requests: 250m CPU, 512Mi memory` (CPU-bound: 4000m / 250m = 16). The scheduler will not place a Pod on a node that lacks unrequested capacity.

**Example — OOMKilled scenario.** Pod limit: `memory: 1Gi`. JVM defaults heap to ~25% of *host* RAM (8 Gi host → 2 Gi heap attempt). Container cgroup limit is 1 Gi → kernel OOM killer terminates the Java process → `CrashLoopBackOff`. Fix: `-XX:MaxRAMPercentage=75` so heap ≈ 768 Mi, leaving room for metaspace, threads, and native memory.

**Pitfall.** CPU throttling (hitting CPU limit) doesn't kill the Pod but causes latency spikes that look like downstream slowness. Check `kubectl top pod` and compare CPU usage to limits.

---

## 10. HPA

**Horizontal Pod Autoscaler** scales replica count on metrics.

**What & why.** Traffic spikes at 2 PM — CPU goes from 30% to 85%. Without HPA, latency climbs until you manually scale. HPA watches metrics and adjusts `replicas` on your Deployment automatically.

**How it works.** Every ~15 seconds, the HPA controller reads metrics (from metrics-server for CPU/memory, or Prometheus Adapter for custom metrics), compares current utilization to the target, and computes desired replicas:

```
desiredReplicas = ceil(currentReplicas × (currentMetric / targetMetric))
```

Example: 3 replicas at 90% CPU, target 70% → `ceil(3 × 90/70)` = `ceil(3.86)` = **4 replicas**.

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
      # 70% of each Pod's CPU *request* (not limit) averaged across Pods
```

- Needs the **metrics-server** (or custom/external metrics via Prometheus Adapter).
- For event-driven scaling (e.g., **Kafka lag**, queue depth) use **KEDA**.
- HPA scales pods; **Cluster Autoscaler** scales nodes when pods can't be scheduled.

**Pitfall.** HPA on CPU alone is laggy — by the time CPU rises, you're already slow. For queue consumers, scale on **lag** (KEDA), not CPU. Also: if `requests.cpu` is unset, HPA cannot compute utilization percentage.

---

## 11. Rolling Deploys & Rollbacks

Default Deployment strategy is **RollingUpdate** — gradually replace old pods with new, no downtime.

**How it works — step by step.** With `replicas: 3`, `maxSurge: 1`, `maxUnavailable: 0`:
1. New ReplicaSet created with updated image.
2. One new Pod starts (total: 4 Pods temporarily — surge of 1).
3. New Pod must pass **readiness** before old Pod is terminated.
4. Repeat until all 3 Pods run the new version; old ReplicaSet scaled to 0.
5. Old ReplicaSet retained for instant rollback.

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

**Example — bad rollout caught early.** You deploy `1.4.3`; new Pods fail readiness (bad config). With `maxUnavailable: 0`, old Pods keep serving — users see no downtime. You `kubectl rollout undo` and investigate.

**Interview angle.** "How is this zero downtime?" — Traffic only goes to ready Pods (Endpoints). New Pods must pass readiness before old ones die; `maxUnavailable: 0` guarantees minimum capacity throughout.

---

## 12. Stateful Workloads & Storage

- **Deployment** = stateless. For databases/Kafka use **StatefulSet** (stable network IDs, ordered start, per-pod **PersistentVolumeClaim**).
- **PV/PVC**: PersistentVolume (actual storage, e.g., AWS EBS) bound to a PersistentVolumeClaim requested by a pod; **StorageClass** enables dynamic provisioning.
- General advice: run stateful infra (DB, Kafka) as **managed cloud services** (RDS, MSK) rather than self-managing on K8s unless you must.

**How it works — StatefulSet identity.** Pods get stable names: `kafka-0`, `kafka-1`, `kafka-2` (not random hashes). Each Pod gets its own PVC that persists across restarts — `kafka-0` always reattaches to the same disk. Pods start and stop in order (0 before 1 before 2) for cluster bootstrap scenarios.

**How it works — PV/PVC binding.**
1. Pod requests `volumeClaimTemplates` → PVC created (`data-kafka-0`).
2. PVC asks StorageClass for a dynamically provisioned PV (e.g., 100 Gi EBS volume).
3. PV binds to PVC 1:1; Pod mounts it at `/var/lib/kafka`.
4. If Pod is rescheduled to another node, the EBS volume reattaches (same AZ required for block storage).

**Example.** You delete `kafka-1` Pod — StatefulSet recreates it with the same name and same PVC. Data survives. A Deployment Pod deleted and recreated gets a new identity and no guaranteed storage.

**Interview angle.** "Would you run Postgres on K8s?" — Default answer: use managed RDS unless you have a dedicated platform team. StatefulSets add operational complexity (backups, failover, upgrades) that managed services handle for you.

---

## 13. AWS

Core services backend JDs name:

**How to think about this table.** Backend engineers don't need to know every AWS service — but interviews expect you to map a problem to the right building block: compute (EKS/ECS/Lambda), storage (S3/RDS/DynamoDB), messaging (SQS/SNS/MSK), caching (ElastiCache), and cross-cutting concerns (IAM, VPC, CloudWatch).

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

**Example — IRSA (IAM Roles for Service Accounts).** A Pod needs to read from S3. Instead of mounting AWS access keys as Secrets (rotations nightmare), you attach an IAM role to the Pod's ServiceAccount via OIDC. The Pod gets temporary credentials automatically — no static keys in the cluster.

**Interview angle.** "EKS vs ECS?" — EKS when you need K8s portability and ecosystem (Helm, operators, multi-cloud). ECS/Fargate when you want simpler AWS-native orchestration without managing control plane nodes.

---

## 14. CI/CD

**What & why.** Manual `docker push` + `kubectl set image` doesn't scale and isn't auditable. CI/CD automates build → test → deploy on every merge, with rollback paths when something breaks.

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
      - run: docker build -t $ECR/orders-api:${{ github.sha }} .   # tag with git SHA for traceability
      - run: docker push $ECR/orders-api:${{ github.sha }}
      - run: kubectl set image deploy/orders-api app=$ECR/orders-api:${{ github.sha }}
      # imperative deploy — updates live cluster directly
```

- Pipeline stages: build → test → scan (Trivy/Snyk) → push image → deploy → smoke test.
- **GitOps** (Argo CD / Flux): git is the source of truth; the cluster syncs to the manifests in the repo — auditable, easy rollback.
- Tools: GitHub Actions, Jenkins, GitLab CI, Harness.

**How GitOps differs.** Instead of CI pushing to the cluster (`kubectl apply`), CI updates a git repo with the new image tag. Argo CD watches that repo and syncs the cluster to match. Deploy history = git history. Rollback = revert a commit.

**Example flow.** Developer merges PR → CI builds image `orders-api:abc123`, pushes to registry, updates `k8s/deployment.yaml` image tag in git → Argo CD detects drift, applies → rolling update begins → smoke test hits `/health` → Slack notification.

**Pitfall.** Deploying `:latest` tag — K8s may not pull a new `:latest` if the image is already present on the node (depends on `imagePullPolicy`). Always tag with immutable identifiers (git SHA, semver).

---

## 15. Troubleshooting Pods

**Theory.** Pod problems fall into a few buckets: can't be scheduled (Pending), can't pull image (ImagePullBackOff), crashes on start (CrashLoopBackOff), or runs but isn't ready (readiness failing). The debugging flow is: `get pods` → `describe pod` (Events section) → `logs` → layer-specific checks.

```bash
kubectl get pods                       # STATUS: CrashLoopBackOff? ImagePullBackOff? Pending?
kubectl describe pod <p>               # events: scheduling, probe failures, OOMKilled
kubectl logs <p> --previous            # logs from the crashed container (before last restart)
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

**Example — worked debug: Pod won't start.**

1. `kubectl get pods` → `orders-api-7x2k9 Pending` for 5 minutes.
2. `kubectl describe pod orders-api-7x2k9` → Events: `0/3 nodes available: 3 Insufficient memory`.
3. Root cause: new deployment raised memory `requests` from 512Mi to 2Gi; nodes can't fit new Pods.
4. Fix: reduce requests to realistic values, or add nodes (Cluster Autoscaler), or reduce replicas temporarily.
5. Verify: Pod → `Running`, readiness passes, `kubectl get endpoints` shows Pod IP.

**Example — CrashLoopBackOff.**

1. `kubectl logs orders-api-7x2k9 --previous` → `Connection refused: jdbc:postgresql://db:5432` — app starts before DB is reachable.
2. Fix: add retry logic in app startup, or use init container to wait for DB, or fix readiness to not mark ready until DB connected (not liveness — that would restart forever).

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
