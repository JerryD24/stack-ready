# AWS — Complete Guide: Beginner to Pro
### All Services + Real-Life Scenarios + Interview Q&A + Situation-Based Answers

---

## TABLE OF CONTENTS
### PART 1 — FOUNDATIONS
1. [What is AWS? Cloud Fundamentals](#1-what-is-aws-cloud-fundamentals)
2. [IAM — Identity and Access Management](#2-iam--identity-and-access-management)
3. [Compute — EC2](#3-compute--ec2)
4. [Compute — Lambda (Serverless)](#4-compute--lambda-serverless)
5. [Compute — ECS, EKS, Fargate (Containers)](#5-compute--ecs-eks-fargate-containers)
6. [Storage — S3](#6-storage--s3)
7. [Storage — EBS, EFS, FSx](#7-storage--ebs-efs-fsx)

### PART 2 — NETWORKING & DATABASES
8. [Networking — VPC Deep Dive](#8-networking--vpc-deep-dive)
9. [Networking — Route 53, CloudFront, API Gateway, ELB](#9-networking--route-53-cloudfront-api-gateway-elb)
10. [Databases — RDS & Aurora](#10-databases--rds--aurora)
11. [Databases — DynamoDB](#11-databases--dynamodb)
12. [Databases — ElastiCache (Redis/Memcached)](#12-databases--elasticache-redismemcached)
13. [Messaging — SQS, SNS, EventBridge, Kinesis](#13-messaging--sqs-sns-eventbridge-kinesis)

### PART 3 — DEVOPS, SECURITY & MONITORING
14. [Security — KMS, Secrets Manager, WAF, Shield, GuardDuty, Cognito](#14-security--kms-secrets-manager-waf-shield-guardduty-cognito)
15. [Monitoring — CloudWatch, X-Ray, CloudTrail](#15-monitoring--cloudwatch-x-ray-cloudtrail)
16. [DevOps — CodePipeline, CloudFormation, CDK, Elastic Beanstalk](#16-devops--codepipeline-cloudformation-cdk-elastic-beanstalk)
17. [Analytics — Kinesis Data Streams, Glue, Athena, Redshift](#17-analytics--kinesis-data-streams-glue-athena-redshift)
18. [Other Key Services — Step Functions, AppSync, SES, Cognito](#18-other-key-services--step-functions-appsync-ses)

### PART 4 — ARCHITECTURE & INTERVIEWS
19. [Real-World Architecture Patterns](#19-real-world-architecture-patterns)
20. [AWS Well-Architected Framework](#20-aws-well-architected-framework)
21. [Interview Questions — Core Concepts](#21-interview-questions--core-concepts)
22. [Situation-Based Interview Q&A](#22-situation-based-interview-qa)
23. [AWS Cost Optimization Strategies](#23-aws-cost-optimization-strategies)
24. [Quick Reference Cheat Sheet](#24-quick-reference-cheat-sheet)
25. [DEEP DIVE: AWS CDK (Infrastructure as Real Code)](#25-deep-dive-aws-cdk-infrastructure-as-real-code)

---

# PART 1 — FOUNDATIONS

## 1. What is AWS? Cloud Fundamentals

### Cloud Computing Models
```
IaaS (Infrastructure as a Service):
  - AWS provides raw infrastructure: VMs, storage, networking
  - YOU manage: OS, runtime, middleware, app, data
  - Examples: EC2, S3, VPC
  - Use when: Full control needed, complex/custom workloads

PaaS (Platform as a Service):
  - AWS provides platform to deploy apps
  - YOU manage: app code + data only
  - Examples: Elastic Beanstalk, RDS, Lambda
  - Use when: Focus on code, not infrastructure

SaaS (Software as a Service):
  - Complete software delivered via cloud
  - YOU manage: nothing (just use it)
  - Examples: AWS WorkMail, AWS Chime

FaaS (Function as a Service):
  - Event-driven, stateless, auto-scaling functions
  - YOU manage: code only
  - Example: AWS Lambda
```

### Cloud Deployment Models
```
Public Cloud:  Resources shared with others (AWS multi-tenant)
Private Cloud: Dedicated infrastructure (AWS Outposts on-premises)
Hybrid Cloud:  Mix of on-prem + cloud (AWS Direct Connect / VPN)
Multi-Cloud:   Using AWS + Azure + GCP simultaneously
```

### AWS Global Infrastructure
```
Region:          Independent geographic area (e.g., us-east-1, ap-south-1)
                 Each region has 3+ AZs
                 Data stays in region unless you explicitly move it

Availability Zone (AZ):
                 One or more data centers in a region
                 Connected via private low-latency fiber
                 Independent power, cooling, physical security
                 Design for HA: deploy across multiple AZs

Edge Locations:  Points of Presence (PoP) for CloudFront CDN
                 200+ locations worldwide (more than regions)

Local Zones:     AWS infrastructure closer to end users in specific cities

AWS Wavelength: AWS infra embedded in telecom 5G networks (ultra-low latency)

Key Regions:
  us-east-1 (N. Virginia)  ← oldest, most services available, cheapest
  us-west-2 (Oregon)
  eu-west-1 (Ireland)
  ap-south-1 (Mumbai)       ← for India
  ap-southeast-1 (Singapore)
```

### Shared Responsibility Model
```
AWS Responsible FOR ("Security OF the cloud"):
  ✅ Physical data centers security
  ✅ Hardware, networking, hypervisor
  ✅ Managed service infrastructure (e.g., RDS OS patches)

YOU Responsible FOR ("Security IN the cloud"):
  ✅ IAM (users, roles, policies)
  ✅ OS patches on EC2 instances
  ✅ Security Groups and NACLs
  ✅ Application code
  ✅ Data encryption (at rest + in transit)
  ✅ Network traffic protection
```

### AWS Pricing Model
```
Pay-as-you-go:     Pay only for what you use, no long-term contracts
Save when commit:  Reserved Instances (1-3 year), Savings Plans (up to 72% off)
Pay less with more: Volume discounts (S3 tiered pricing)
Free Tier:         12 months free on many services for new accounts

Pricing by resource type:
  Compute (EC2/Lambda): per hour or per GB-second
  Storage (S3/EBS):     per GB-month stored + per request
  Data Transfer:        Inbound FREE, Outbound charges apply
  Requests/API calls:   Per million requests (Lambda, API Gateway)
```

---

## 2. IAM — Identity and Access Management

### Core Concepts
```
IAM User:    A person or service with long-term credentials (username+password or access keys)
IAM Group:   Collection of users — assign policies to group
IAM Role:    Temporary credentials for AWS services, cross-account, or federation
IAM Policy:  JSON document defining permissions (Allow/Deny on Actions and Resources)

Root Account: First account created — has FULL access
              ⚠️ Never use for daily work
              ⚠️ Enable MFA immediately
              ⚠️ Create an admin IAM user instead
```

### Policy Types
```
Identity-based policies: Attached to users/groups/roles
Resource-based policies: Attached to resources (S3 bucket policy, SQS policy)
Permission boundaries:   Maximum permissions an identity can have (ceiling)
SCPs (Service Control Policies): Organization-wide restrictions (AWS Organizations)
Session policies:        Passed during role assumption to limit session

Policy evaluation order:
  Explicit DENY > Any ALLOW
  Default: everything is DENIED unless explicitly allowed

Effect: Allow or Deny
Action: AWS service action (e.g., "s3:GetObject")
Resource: ARN of resource ("arn:aws:s3:::my-bucket/*")
Condition: Optional conditions (IP, time, MFA required, etc.)
```

### IAM Policy Example
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ReadOnMyBucket",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-company-data",
        "arn:aws:s3:::my-company-data/*"
      ]
    },
    {
      "Sid": "DenyDeleteEverywhere",
      "Effect": "Deny",
      "Action": "s3:DeleteObject",
      "Resource": "*"
    },
    {
      "Sid": "RequireMFAForSensitiveOps",
      "Effect": "Deny",
      "Action": ["iam:CreateUser", "iam:DeleteUser"],
      "Resource": "*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    }
  ]
}
```

### IAM Roles — Key Scenarios
```
1. EC2 Instance Role:
   - Attach role to EC2 → app can call AWS APIs without storing access keys
   - SDK auto-fetches temporary credentials from EC2 metadata service
   - Best practice: ALWAYS use roles for EC2, never hardcode keys

2. Lambda Execution Role:
   - Lambda assumes this role to run
   - Grant only permissions the function needs (Least Privilege)

3. Cross-Account Role:
   - Account A has a role that Account B can assume
   - Useful for: multi-account AWS Organizations

4. Service-Linked Role:
   - Predefined by AWS for services (e.g., AWSServiceRoleForECS)
   - Cannot delete while service uses it

5. Identity Federation:
   - SAML 2.0: integrate corporate directory (Active Directory) with AWS
   - Web Identity: allow users authenticated via Google/Facebook to access AWS
   - AWS SSO (IAM Identity Center): modern, recommended approach
```

### IAM Best Practices
```
✅ Enable MFA for root and all privileged users
✅ Use roles instead of long-term access keys
✅ Apply Least Privilege Principle
✅ Rotate access keys regularly (90 days)
✅ Use AWS Organizations + SCPs for multi-account
✅ Enable CloudTrail to audit all API calls
✅ Use IAM Access Analyzer to find unintended access
✅ Never embed credentials in code (use Secrets Manager or Parameter Store)
✅ Use Permission Boundaries to delegate user creation safely
```

---

## 3. Compute — EC2

### EC2 Instance Types
```
General Purpose (t, m):
  t3, t3a, t4g: Burstable — cheap baseline CPU + burst credits
                Use: web servers, dev environments, small DBs
  m5, m6g:      Balanced CPU/RAM
                Use: web apps, small-medium DBs, gaming servers

Compute Optimized (c):
  c5, c6g, c7g: High CPU-to-RAM ratio
                Use: batch processing, ML inference, web servers (high RPS)

Memory Optimized (r, x, z):
  r5, r6g:      High RAM
                Use: in-memory caches, real-time big data, large DBs
  x1e:          Extreme RAM (up to 3904 GB)
                Use: SAP HANA, large in-memory workloads

Storage Optimized (i, d, h):
  i3, i4g:      High IOPS NVMe SSD
                Use: NoSQL DBs (Cassandra), OLTP, Elasticsearch
  d3:           HDD, high sequential throughput
                Use: data warehouses, Hadoop, big data

Accelerated Computing (p, g, trn, inf):
  p4, p5:       NVIDIA GPUs for ML training
  g4dn, g5:     GPU for ML inference + graphics
  inf1, inf2:   AWS Inferentia — cheapest ML inference
  trn1:         AWS Trainium — ML training

Naming convention: [family][generation][variant].[size]
  e.g., c6gn.large = Compute, Gen 6, Graviton ARM, Network-optimized, Large
```

### EC2 Purchasing Options
```
On-Demand:
  - Pay per hour/second, no commitment
  - Most expensive but maximum flexibility
  - Use: unpredictable workloads, development/testing

Reserved Instances (RI):
  - 1 or 3-year commitment → up to 72% discount
  - Standard RI: locked to instance type + region
  - Convertible RI: can change instance type
  - Use: steady-state production workloads (web servers, DBs)

Savings Plans:
  - 1 or 3-year commitment on $/hour spend
  - More flexible than Reserved: applies to Lambda + Fargate too
  - Compute Savings Plans: any EC2 type, region, OS

Spot Instances:
  - Bid for unused capacity → up to 90% discount
  - Can be terminated with 2-min warning
  - Use: batch jobs, ML training, stateless fault-tolerant workloads
  - ⚠️ NOT for databases or stateful workloads

Dedicated Hosts:
  - Physical server dedicated to you
  - Use: compliance requirements, bring-your-own license (BYOL Windows Server)

Dedicated Instances:
  - Instance on hardware dedicated to you (but you don't control placement)
  - Use: compliance that forbids shared hardware

Capacity Reservations:
  - Reserve capacity in a specific AZ (no discount, ensure capacity)
  - Use: disaster recovery, critical event capacity guarantee
```

### EC2 Key Features
```
AMI (Amazon Machine Image):
  - Blueprint for EC2: OS + pre-installed software + config
  - Types: AWS-provided, AWS Marketplace, Custom
  - Create custom AMI: launch → configure → create image
  - AMIs are region-specific (copy to share across regions)

Security Groups:
  - Virtual firewall for EC2 (instance level)
  - STATEFUL: if you allow inbound, outbound response automatically allowed
  - Rules are ALLOW only (no explicit deny)
  - Can reference other security groups (not just IPs)
  - Changes apply immediately

Key Pairs:
  - RSA or ED25519 key pair for SSH access
  - AWS stores public key, you keep private key
  - Lose private key = no SSH access (use Systems Manager Session Manager instead)

Elastic IP:
  - Static public IP that survives instance stop/start
  - Attached to account (charged when NOT associated with running instance)
  - ⚠️ AWS gives 5 per region, request increase if needed
  - Best practice: use DNS names, not IPs (prefer Route 53)

User Data:
  - Bootstrap script that runs at instance launch
  - Use to install packages, pull code, configure services
  - Runs as root
  - Runs ONCE on first launch only (unless configured otherwise)

Instance Metadata:
  - http://169.254.169.254/latest/meta-data/
  - Instance ID, AMI ID, public IP, IAM role credentials, etc.
  - IMDSv2 (secure): requires session token (prevents SSRF attacks)
```

### EC2 Auto Scaling
```
Auto Scaling Group (ASG):
  - Minimum, desired, maximum instance count
  - Automatically launches/terminates instances based on policy

Scaling Policies:
  1. Target Tracking: maintain a target metric (e.g., CPU = 50%)
     - Simplest and recommended for most use cases
  2. Step Scaling: increase/decrease by specific amounts at thresholds
  3. Simple Scaling: single scaling action when alarm triggered
  4. Scheduled Scaling: scale at specific times (e.g., every Monday 9 AM)
  5. Predictive Scaling: ML-based forecasting

Launch Template (preferred over Launch Config):
  - Defines instance: type, AMI, key pair, SG, user data
  - Supports versioning and multiple instance types (mixed fleet)

Health Checks:
  - EC2 health check: checks hardware/hypervisor
  - ELB health check: checks HTTP endpoint — more application-aware

Lifecycle Hooks:
  - Pause instance during launch or termination
  - Use: drain connections, pull logs, deregister from service mesh

Warm Pools (advanced):
  - Pre-launch instances in stopped/hibernated state
  - Reduces scale-out latency for slow-to-boot instances
```

### Real-Life EC2 Scenario
```
Scenario: E-commerce app handling variable traffic (10x spike during sales)

Solution:
  Baseline: 3x m5.large Reserved Instances (24/7 constant traffic)
  Burst: Auto Scaling Group with Spot Instances (for sale spikes)
  Front-end: Application Load Balancer distributing across AZs
  Deployment: Blue/Green via CodeDeploy (zero-downtime deploys)

ASG config:
  Min: 3 (matching reserved instances)
  Desired: 3
  Max: 30
  Target tracking: ALBRequestCountPerTarget = 1000

Cost savings:
  Reserved = 72% cheaper than on-demand for baseline
  Spot = 80% cheaper for burst instances
  Result: ~60% overall cost reduction vs all on-demand
```

---

## 4. Compute — Lambda (Serverless)

### Lambda Fundamentals
```
What: Run code without managing servers
Billing: Per invocation + per GB-second of compute (down to 1ms)
Free tier: 1 million invocations/month + 400,000 GB-seconds/month (forever!)

Limits:
  Memory:         128 MB to 10 GB (also controls CPU allocation)
  Execution time: max 15 minutes
  Ephemeral disk: /tmp — 512 MB to 10 GB
  Package size:   50 MB (zipped), 250 MB (unzipped), 10 GB (container image)
  Concurrency:    1,000 per region by default (request increase)

Cold Start:
  - First invocation (or after idle period): container init + code init
  - Latency: 100ms–2000ms depending on runtime and package size
  - Mitigation:
    → Provisioned Concurrency: keep N instances warm (costs money)
    → SnapStart (Java 11+): snapshot initialized environment
    → Use Python/Node.js over Java for shorter cold starts
    → Keep deployment package small
    → Minimize package-level imports (lazy import inside handler)
```

### Lambda Triggers & Use Cases
```
Synchronous triggers (wait for response):
  - API Gateway / ALB: REST APIs
  - Lambda URL: direct HTTPS endpoint
  - CloudFront (Lambda@Edge): transform requests at CDN
  - Cognito: custom auth flow
  - ELB: process requests

Asynchronous triggers (fire and forget):
  - S3: process uploads (thumbnails, virus scan, ETL)
  - SNS: handle notifications
  - EventBridge: respond to events
  - CloudWatch Events: scheduled cron jobs
  - CodeCommit, CodePipeline: CI/CD events

Poll-based triggers (Lambda polls the source):
  - SQS: process messages from queue
  - Kinesis: process streaming data records
  - DynamoDB Streams: react to DynamoDB changes
  - MSK/Kafka: consume Kafka events
```

### Lambda Configuration Deep Dive
```python
# Lambda function structure (Python)
import json
import boto3
import os

# Initialize clients OUTSIDE handler (reused across warm invocations)
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['ORDERS_TABLE'])

def handler(event, context):
    """
    event:   Input data (dict from trigger)
    context: Runtime info (function name, remaining time, request ID)
    """
    # context.function_name
    # context.get_remaining_time_in_millis()  # how much time left
    # context.aws_request_id                  # unique request ID for tracing

    try:
        # Process different event sources
        if 'Records' in event:
            return process_s3_event(event['Records'])
        elif 'httpMethod' in event:
            return process_api_request(event)
        else:
            return process_direct_invocation(event)
    except Exception as e:
        print(f"ERROR: {str(e)}")   # goes to CloudWatch Logs
        raise   # re-raise to mark invocation as failed

def process_api_request(event):
    body = json.loads(event.get('body', '{}'))
    path = event['path']
    method = event['httpMethod']

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'message': 'Success', 'data': body})
    }

# Environment variables (set in Lambda config, NOT in code)
DB_URL = os.environ['DATABASE_URL']
SECRET_NAME = os.environ['SECRET_NAME']
```

### Lambda Best Practices
```
Architecture:
  ✅ Keep functions small and single-purpose
  ✅ Initialize connections/clients outside handler
  ✅ Use environment variables for config
  ✅ Store secrets in Secrets Manager (not env vars)
  ✅ Use Lambda Layers for shared libraries
  ✅ Use container images for >250MB dependencies

Performance:
  ✅ Increase memory to increase CPU (proportional)
  ✅ Enable X-Ray tracing for profiling
  ✅ Use Provisioned Concurrency for latency-sensitive APIs
  ✅ Use async invocation for non-critical work

Error Handling:
  ✅ Sync: exceptions propagate to caller
  ✅ Async: Lambda retries 3 times, then sends to Dead Letter Queue (SQS/SNS)
  ✅ SQS trigger: use visibility timeout > Lambda timeout to avoid duplicate processing
  ✅ Idempotent functions (same input = same output, safe to retry)

Security:
  ✅ Use execution role with minimal permissions
  ✅ Place Lambda in VPC to access private resources (RDS, ElastiCache)
  ✅ Use Lambda resource-based policies to control who can invoke
```

### Lambda Real-Life Scenarios
```
Scenario 1: Image Resize Service
  Trigger: S3 → upload to "raw-images" bucket
  Lambda: download from S3, resize to 3 sizes (thumb/medium/large),
          upload results to "processed-images" bucket,
          update DynamoDB with metadata
  Cost: ~$0.001 per 1000 images vs EC2 would be $50+/month idle

Scenario 2: Scheduled Report Generation
  Trigger: EventBridge cron (every day at 8 AM)
  Lambda: query RDS, generate CSV, upload to S3, send SNS → email report
  No servers running 23.5 hours/day

Scenario 3: Real-Time Stream Processing
  Trigger: Kinesis Data Stream (user clickstream events)
  Lambda: batch of 100 records → enrich → write to DynamoDB
  Scales automatically with stream volume
```

---

## 5. Compute — ECS, EKS, Fargate (Containers)

### Container Services Overview
```
ECR (Elastic Container Registry):
  - Private Docker image registry (like DockerHub, but AWS)
  - Integrated with IAM, ECS, EKS
  - Image scanning for vulnerabilities
  - Lifecycle policies (auto-delete old images)

ECS (Elastic Container Service):
  - AWS-native container orchestration
  - Simpler than Kubernetes, less control
  - Task = one or more containers running together
  - Service = manages desired count of tasks, rolling deploys, health checks

EKS (Elastic Kubernetes Service):
  - Managed Kubernetes
  - Use when: you need Kubernetes features, portability, existing K8s workloads
  - More complex, more flexible

Fargate:
  - Serverless compute engine for containers
  - No EC2 instances to manage — AWS handles the servers
  - Works with BOTH ECS and EKS
  - More expensive per vCPU/GB than EC2, but no idle costs
```

### ECS Key Concepts
```
Task Definition:
  - Blueprint for your container(s): image, CPU, RAM, ports, volumes, IAM role, logging

  {
    "family": "my-app",
    "containerDefinitions": [
      {
        "name": "api",
        "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/my-api:latest",
        "cpu": 256,
        "memory": 512,
        "portMappings": [{"containerPort": 8000}],
        "environment": [{"name": "ENV", "value": "prod"}],
        "secrets": [{"name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:..."}],
        "logConfiguration": {
          "logDriver": "awslogs",
          "options": {
            "awslogs-group": "/ecs/my-app",
            "awslogs-region": "us-east-1",
            "awslogs-stream-prefix": "ecs"
          }
        }
      }
    ],
    "requiresCompatibilities": ["FARGATE"],
    "networkMode": "awsvpc",
    "cpu": "256",
    "memory": "512"
  }

Service:
  - Desired count, min/max (for auto-scaling)
  - ALB integration (register/deregister tasks automatically)
  - Rolling update: deploymentConfiguration
    minimumHealthyPercent: 50
    maximumPercent: 200

ECS Auto Scaling:
  - Scale ECS Service tasks based on CPU/Memory/Custom metrics
  - For EC2 launch type: also need to scale the underlying EC2 cluster
  - For Fargate: just scale the service tasks (AWS handles the rest)
```

### EKS Essentials
```
When to use EKS over ECS:
  ✅ Team already knows Kubernetes
  ✅ Need Kubernetes ecosystem (Helm, Prometheus, service mesh)
  ✅ Multi-cloud portability
  ✅ Complex microservices orchestration (sidecars, service mesh)

EKS Components:
  Control Plane:   AWS managed (you don't see these nodes, pay $0.10/hr)
  Worker Nodes:    EC2 instances or Fargate pods running your containers
  Node Groups:     Managed EC2 ASGs for worker nodes

Key EKS Features:
  - AWS Load Balancer Controller: creates ALB/NLB from Kubernetes Ingress/Service
  - EKS Pod Identity / IRSA: IAM roles for Kubernetes pods (fine-grained access)
  - EKS Add-ons: CoreDNS, kube-proxy, VPC CNI, EBS/EFS CSI drivers
  - Cluster Autoscaler or Karpenter: auto-scale EC2 nodes
  - Fargate Profiles: run specific pods on Fargate (no node management)
```

---

## 6. Storage — S3

### S3 Fundamentals
```
Object storage: Store any file as "object" (key + value + metadata)
Buckets: Global namespace (unique across ALL of AWS), created in a region
Objects: Up to 5 TB each; use Multipart Upload for >100 MB
URL: https://bucket-name.s3.region.amazonaws.com/object-key

NOT a file system (no hierarchy — just flat key space):
  "folder/file.txt" is actually key = "folder/file.txt"
```

### S3 Storage Classes (Cost Optimization)
```
Standard:
  - Frequently accessed data
  - 99.999999999% durability (11 nines), 99.99% availability
  - Most expensive storage, lowest retrieval cost
  - Use: active data, content delivery

Standard-IA (Infrequent Access):
  - Same durability, 99.9% availability
  - Lower storage cost + retrieval fee
  - Min 30-day charge
  - Use: backups, disaster recovery data

One Zone-IA:
  - Stored in single AZ (less available than Standard-IA)
  - 20% cheaper than Standard-IA
  - Use: secondary backups, re-creatable data

Glacier Instant Retrieval:
  - Archival, retrieval in milliseconds
  - Min 90-day storage charge
  - Use: quarterly accessed archival data

Glacier Flexible Retrieval:
  - Retrieval: Minutes (Expedited $$$) → Hours (Standard) → 12h (Bulk $)
  - Min 90-day charge
  - Use: yearly archives, compliance data

Glacier Deep Archive:
  - Cheapest storage ($0.00099/GB/month)
  - Retrieval: 12h (Standard) or 48h (Bulk)
  - Min 180-day charge
  - Use: 7+ year compliance retention, rarely accessed

Intelligent-Tiering:
  - Auto-moves objects between tiers based on access patterns
  - Small monitoring fee per object
  - Best for unknown or changing access patterns

Lifecycle Rules:
  - Automate transitions between storage classes
  - Example: Standard → IA after 30 days → Glacier after 90 days → Delete after 365 days
```

### S3 Security
```
By default: Buckets are PRIVATE (Block Public Access is ON)

Bucket Policies (resource-based IAM):
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::ACCOUNT:role/MyRole"},
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::my-bucket/*"
  }]
}

ACLs: Legacy, generally avoid (use bucket policies instead)

Pre-signed URLs:
  - Temporarily grant access to a private object
  - URL includes credentials + expiry (e.g., 1 hour)
  - Use: let users download/upload without exposing bucket

Pre-signed POST:
  - Allow browser to upload directly to S3
  - You set conditions (max file size, content type, path)
  - Bypasses your server for upload (offloads bandwidth)

Encryption:
  SSE-S3 (AES-256):   AWS manages keys (default for new buckets)
  SSE-KMS:            Customer managed keys via AWS KMS (audit trail)
  SSE-C:              Customer-provided keys (you manage keys)
  Client-side:        Encrypt before uploading

S3 Block Public Access:
  - Bucket-level or account-level setting
  - Recommended: always ON unless explicitly needed for static website

CORS:
  - Configure allowed origins for browser-side S3 requests
  - Required for: SPA uploading directly to S3, cross-domain image loading
```

### S3 Advanced Features
```
Versioning:
  - Keep multiple versions of an object
  - Protection against accidental delete/overwrite
  - Delete creates a "delete marker" (soft delete)
  - Restore: delete the delete marker

MFA Delete:
  - Require MFA to permanently delete versioned objects
  - Protects against ransomware, accidental deletion

Replication:
  CRR (Cross-Region Replication):  Compliance, latency, backup
  SRR (Same-Region Replication):   Log aggregation, live staging

S3 Object Lock:
  - WORM (Write Once Read Many) — cannot delete/modify
  - Compliance mode: even root/AWS cannot remove
  - Governance mode: only privileged users can remove
  - Use: SEC/FINRA compliance, audit logs, ransomware protection

S3 Event Notifications:
  - Trigger Lambda, SQS, SNS on object create/delete
  - Use: real-time processing of uploads

S3 Transfer Acceleration:
  - Upload via CloudFront edge → AWS backbone → S3
  - 50-500% faster for global users uploading large files

Multipart Upload:
  - Required for >5 GB, recommended for >100 MB
  - Parallel uploads → faster
  - Lifecycle rule to abort incomplete multipart uploads (saves cost)

S3 Select / Glacier Select:
  - SQL queries directly on S3 objects (CSV, JSON, Parquet)
  - Only retrieve needed data (reduces data transfer + cost)

S3 Inventory:
  - Daily/weekly CSV list of all objects with metadata
  - Use instead of ListObjects for large buckets (cheaper, async)
```

---

## 7. Storage — EBS, EFS, FSx

### EBS (Elastic Block Store)
```
What: Network-attached block storage for EC2 (like a hard disk)
Key fact: LOCKED to an AZ (cannot attach to EC2 in different AZ)
         Must snapshot to move to different AZ/region

Volume Types:
  gp3 (General Purpose SSD — default):
    - 3,000 IOPS baseline, can provision up to 16,000 IOPS independently
    - Use: most workloads, boot volumes, dev/test

  gp2 (older General Purpose):
    - IOPS scales with size (3 IOPS/GB, max 16,000)
    - Migrate to gp3 for more control + lower cost

  io1/io2 (Provisioned IOPS SSD):
    - Up to 64,000 IOPS (io1) / 256,000 IOPS (io2 Block Express)
    - io2 multi-attach: one volume → multiple EC2 instances (same AZ)
    - Use: databases (Oracle, SQL Server), I/O intensive apps

  st1 (Throughput Optimized HDD):
    - Low cost, high throughput, cannot be boot volume
    - Use: Big Data, data warehouses, log processing

  sc1 (Cold HDD):
    - Cheapest EBS, infrequently accessed
    - Use: cold data, archival

EBS Snapshots:
  - Point-in-time backup stored in S3 (managed by AWS, not in your bucket)
  - Incremental: only changed blocks saved
  - Cross-region copy for disaster recovery
  - Fast Snapshot Restore (FSR): pre-warm for immediate full IOPS on restore

EBS Encryption:
  - Transparent encryption using KMS
  - Snapshots of encrypted volumes are encrypted
  - Encrypt at creation OR via "Create Encrypted Snapshot + Restore" trick
```

### EFS (Elastic File System)
```
What: Managed NFS (Network File System) — POSIX-compliant shared storage
Key difference from EBS: Multiple EC2 instances (across AZs) can mount simultaneously

Use cases:
  - Shared content: web servers sharing HTML/media files
  - Home directories: mount user home dirs across multiple EC2
  - Machine learning: shared training data access
  - CMS: WordPress media library across multiple servers

Performance Modes:
  General Purpose (default): lower latency, up to 7,000 ops/sec
  Max I/O: higher ops/sec, higher latency (for massively parallel workloads)

Throughput Modes:
  Elastic (default): auto-scales, pay for what you use
  Provisioned: set specific throughput level
  Bursting: burst to high throughput based on storage size

Storage Tiers (lifecycle policies):
  Standard: frequently accessed
  Standard-IA: infrequently accessed (92% cheaper per GB)
  Archive: rarely accessed

EFS vs EBS:
  EFS: Multi-AZ, multi-instance mount, NFS, Linux only, scales automatically
  EBS: Single instance (except io2 multi-attach), lower latency, Linux+Windows
```

### AWS FSx
```
FSx for Windows File Server:
  - Fully managed Windows SMB file shares
  - Native Windows features: ACLs, DFS, Active Directory
  - Use: lift-and-shift Windows workloads to AWS

FSx for Lustre:
  - High-performance parallel file system (HPC)
  - Can link to S3 (transparent reads/writes to S3 backend)
  - Use: ML training, video processing, genomics, financial simulations

FSx for NetApp ONTAP:
  - Multi-protocol: NFS, SMB, iSCSI
  - Snapshots, compression, dedup
  - Use: enterprises with NetApp on-prem, lift-and-shift

FSx for OpenZFS:
  - ZFS features: snapshots, clones, compression
  - Use: Linux workloads needing ZFS, dev/test with quick clones
```

---

# PART 2 — NETWORKING & DATABASES

## 8. Networking — VPC Deep Dive

### VPC Fundamentals
```
VPC (Virtual Private Cloud):
  - Your own isolated network within AWS
  - Defined by a CIDR block (e.g., 10.0.0.0/16 = 65,536 IPs)
  - Per region (but spans all AZs in that region)
  - Default VPC: AWS creates one in each region (don't delete it)

Subnets:
  - Sub-division of a VPC within ONE AZ
  - Public subnet: has route to Internet Gateway
  - Private subnet: no route to internet (or only NAT Gateway for outbound)

  Best practice:
    3 Public subnets  (one per AZ): Load balancers
    3 Private subnets (one per AZ): Application servers
    3 Database subnets (one per AZ): RDS, ElastiCache (sometimes separate)

Route Tables:
  - Every subnet needs a route table
  - Public subnet route table: 0.0.0.0/0 → Internet Gateway (IGW)
  - Private subnet route table: 0.0.0.0/0 → NAT Gateway
  - Local: 10.0.0.0/16 → local (always present, cannot delete)
```

### VPC Components
```
Internet Gateway (IGW):
  - Allows public subnet resources to reach internet (two-way)
  - Horizontally scaled, redundant, no bandwidth limit
  - Attach one IGW per VPC
  - For EC2 to be publicly accessible: public IP + SG allow + route to IGW

NAT Gateway:
  - Allows PRIVATE subnet resources to initiate outbound internet (one-way)
  - Managed by AWS (no maintenance), highly available within AZ
  - Deploy in EACH AZ for HA (each private subnet routes to same-AZ NAT GW)
  - Not free: $0.045/hr + $0.045/GB processed
  - EC2 NAT Instance: old, cheaper alternative, not recommended

Security Groups (SG):
  - Instance-level stateful firewall
  - ALLOW rules only (default deny)
  - Changes take effect immediately
  - Can reference other SGs (e.g., allow traffic from "web-tier-sg")

Network ACL (NACL):
  - Subnet-level stateless firewall
  - Both ALLOW and DENY rules (evaluated in number order, lowest first)
  - Must explicitly allow both inbound and outbound (stateless!)
  - Last rule: 100 DENY ALL

SG vs NACL:
  SG:   Instance level | Stateful  | ALLOW only   | All rules evaluated
  NACL: Subnet level   | Stateless | ALLOW + DENY | Rules in order (first match)

VPC Peering:
  - Direct network connection between two VPCs (same or different account/region)
  - NOT transitive: A<->B<->C does NOT mean A<->C
  - Lowest latency, full bandwidth
  - CIDR blocks CANNOT overlap

Transit Gateway:
  - Hub connecting multiple VPCs, on-premises, Direct Connect, VPN
  - TRANSITIVE routing (unlike VPC peering)
  - Centralized routing, single management point
  - Use when: >10 VPCs to interconnect (VPC peering mesh gets complex)
```

### VPC Advanced Features
```
VPC Endpoints (no internet needed to reach AWS services):

  Interface Endpoint (PrivateLink):
    - ENI (network interface) in your subnet
    - Private IP address for AWS service (S3, DynamoDB, API Gateway, etc.)
    - Billed: hourly + per GB
    - Use: EC2 to access SQS/SNS/Secrets Manager without internet

  Gateway Endpoint:
    - Free, route table entry (not an ENI)
    - Only for S3 and DynamoDB
    - No extra cost → always use for S3/DynamoDB in production

VPN:
  Site-to-Site VPN: connect on-premises to VPC via internet tunnel (encrypted)
    - Virtual Private Gateway (VGW) on VPC side
    - Customer Gateway (CGW) on on-prem side
    - ~100Mbps, higher latency, uses internet

Direct Connect (DX):
  - Dedicated private network connection from on-premises to AWS
  - 1Gbps to 100Gbps, lower latency, consistent bandwidth
  - NOT encrypted by default (add VPN over DX for encryption)
  - Setup takes weeks (physical fiber provisioning)
  - Use: high-bandwidth data transfer, compliance, consistent latency

Flow Logs:
  - Capture IP traffic in/out of VPC, subnet, or ENI
  - Stored in CloudWatch Logs or S3
  - Use: security analysis, troubleshooting, compliance

Bastion Host:
  - EC2 in public subnet for SSH access to private EC2 instances
  - Alternative: AWS Systems Manager Session Manager (no bastion needed!)
```

---

## 9. Networking — Route 53, CloudFront, API Gateway, ELB

### Route 53
```
What: AWS's DNS service + health checking + routing policies

Record Types:
  A:     hostname → IPv4
  AAAA:  hostname → IPv6
  CNAME: hostname → another hostname (cannot be root domain!)
  Alias: hostname → AWS resource (ALB, CloudFront, S3 website, etc.)
         ROOT DOMAIN SUPPORTED (unlike CNAME)
         Free queries, health check integration

Routing Policies:
  Simple:          Single resource, no health check
  Weighted:        % split between multiple resources (A/B testing, blue/green)
  Latency-based:   Route to lowest latency AWS region
  Failover:        Primary/secondary (health check gates failover)
  Geolocation:     Route based on WHERE user is (country/continent)
  Geoproximity:    Route based on geographic distance (with bias adjustment)
  Multi-value:     Return multiple IPs + health check (not a load balancer!)
  IP-based:        Route based on client IP ranges

Health Checks:
  - HTTP/HTTPS/TCP checks every 30s (10s fast = more expensive)
  - Healthy threshold: 3 successful checks
  - Unhealthy threshold: 3 failed checks
  - Can check CloudWatch alarms (for private resources)
  - Calculated health checks: logical AND/OR of multiple checks
```

### CloudFront (CDN)
```
What: Content Delivery Network with 400+ edge locations globally

Benefits:
  - Cache static content at edge (S3, EC2 response)
  - DDoS protection (AWS Shield Standard free)
  - SSL/TLS termination at edge
  - Serve content from nearest edge to user (latency)
  - Reduce load on origin

Components:
  Distribution:    CloudFront CDN configuration
  Origin:          Source of content (S3, ALB, API Gateway, EC2, custom HTTP)
  Behavior:        Cache rules per path pattern (e.g., /api/* vs /static/*)
  TTL:             How long to cache (default 24h, min 0, max 1 year)

Cache Control:
  Cache-Control: max-age=31536000  → 1 year (for hashed static assets)
  Cache-Control: no-cache          → always revalidate at origin
  Invalidation: CloudFront CreateInvalidation (/index.html, /*) — $0.005/path

Lambda@Edge / CloudFront Functions:
  - Run code at edge locations (without cold start for CF Functions)
  - Use cases:
    → A/B testing (modify response based on cookie)
    → URL redirects / rewrites
    → Authentication (JWT validation at edge)
    → Add security headers (X-Frame-Options, CSP)
    → Bot detection

Signed URLs / Signed Cookies:
  - Restrict access to CloudFront content
  - Signed URL: one object, includes expiry
  - Signed Cookie: multiple objects, maintains browsing experience
  - Use: premium content, time-limited access, paid downloads
```

### Elastic Load Balancing (ELB)
```
Application Load Balancer (ALB):
  - Layer 7 (HTTP/HTTPS/WebSocket/HTTP2)
  - Route by: path, hostname, query string, headers, source IP
  - Sticky sessions via cookie
  - Target types: EC2, IP addresses, Lambda, ECS tasks
  - Connection draining: in-flight request completion during deregistration
  - WAF integration
  - Use: web applications, microservices, REST APIs

Network Load Balancer (NLB):
  - Layer 4 (TCP/UDP/TLS)
  - Extremely high performance: millions of requests/sec, ultra-low latency
  - Static IP per AZ (or Elastic IP)
  - Preserves client IP (unlike ALB)
  - Use: gaming, IoT, real-time streaming, high-throughput workloads

Gateway Load Balancer (GWLB):
  - Layer 3 (IP packets)
  - Insert virtual appliances in traffic path (firewalls, IDS/IPS)
  - Use: network security appliances

ALB Rules Example:
  IF path = /api/* THEN forward to → api-target-group
  IF path = /images/* THEN redirect → CloudFront URL
  IF header "X-Version: v2" THEN forward to → v2-target-group
  DEFAULT: forward to → main-target-group

Health Checks:
  - ALB pings /health endpoint every 30s (configurable)
  - Unhealthy threshold: 2 failures → removed from rotation
  - Healthy threshold: 5 successes → added back
```

### API Gateway
```
What: Fully managed API front door (REST, HTTP, WebSocket APIs)

Types:
  REST API:   Full features, request/response transform, WAF, usage plans, caching
  HTTP API:   Cheaper (71% less), lower latency, for Lambda/HTTP backends
  WebSocket:  Bidirectional real-time (chat, notifications)

Key Features:
  Throttling:     Default 10,000 RPS (burst 5,000) — prevent DDoS
  Usage Plans:    API keys + quotas + throttling per customer
  Caching:        Cache responses (300s TTL) to reduce backend load
  Authorizers:
    - Lambda Authorizer: custom auth logic (JWT, OAuth token)
    - Cognito Authorizer: JWT from Cognito User Pool
  CORS:           Configure for browser clients
  Stage:          Environment (dev/staging/prod), canary deployments
  Request mapping: Transform request format before hitting Lambda
```

---

## 10. Databases — RDS & Aurora

### RDS (Relational Database Service)
```
Supported engines: MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, Db2

What AWS manages:
  ✅ OS installation and patching
  ✅ DB software installation and patching
  ✅ Automated backups
  ✅ Hardware provisioning
  ✅ Storage scaling (Auto Scaling enabled)

What YOU manage:
  ✅ Schema design, queries, indexes
  ✅ Security (VPC, SGs, IAM, encryption)
  ✅ Instance size / class selection
  ✅ Read replica configuration

Instance Classes:
  db.t3/t4g: Burstable (dev/test, small workloads)
  db.m5/m6g: General purpose (most production workloads)
  db.r5/r6g: Memory optimized (large DBs, caching)
  db.x2g:    Extreme memory (SAP HANA)

Storage:
  gp2/gp3:   General purpose SSD
  io1/io2:   High IOPS (provisioned)
  Magnetic:  Legacy, avoid

Multi-AZ Deployment:
  - Synchronous replication to standby in another AZ
  - Automatic failover if primary fails (~60-120 seconds)
  - Standby is NOT readable (only for failover)
  - Use: production workloads requiring HA

Read Replicas:
  - Asynchronous replication (slight lag)
  - Up to 15 replicas (RDS), up to 15 Aurora
  - Can be in same region or cross-region
  - CAN be read for SELECT queries (offload reporting/analytics)
  - Can be promoted to standalone DB (break replication link)
  - Cross-region replica for DR

Backups:
  Automated: Daily snapshot + transaction logs → restore to any second in retention window
  Manual snapshots: You take them, you delete them, survive even if RDS deleted
  Backup window: Nightly backup (brief I/O spike)
  Retention: 1–35 days for automated

RDS Proxy:
  - Sits between app and RDS
  - Connection pooling (critical for Lambda → RDS)
  - Failover time: 66% faster for Multi-AZ
  - IAM auth to RDS (no password in app code)
  - Use whenever Lambda functions connect to RDS
```

### Aurora
```
What: AWS-designed cloud-native relational DB, MySQL & PostgreSQL compatible

Performance:
  MySQL compatible: 5x faster than regular MySQL
  PostgreSQL compatible: 3x faster than regular PostgreSQL

Architecture (different from RDS!):
  - Shared distributed storage layer across 6 copies in 3 AZs
  - 4/6 copies needed for writes
  - 3/6 copies needed for reads
  - Self-healing: automatically repairs bad sectors

Cluster:
  Primary instance:    Read + Write
  Up to 15 read replicas: Read only (shared same storage — no replication lag!)
  Custom Endpoints:    Route reads to specific replica groups

Aurora Serverless v2:
  - Auto-scales in fine-grained increments (0.5 ACU steps)
  - Scales to 0 when idle (saves cost)
  - Instant scale-up for spikes
  - Use: variable workloads, dev/test, infrequently used apps

Aurora Global Database:
  - Primary region (writes) + up to 5 secondary read-only regions
  - <1 second replication lag globally
  - Promote secondary to primary in <1 minute for DR
  - Use: globally distributed apps, DR with RPO <1s

Aurora vs RDS Comparison:
  Aurora: Higher performance, shared storage, faster failover (30s), Global DB
  RDS:    Simpler, Oracle/SQL Server support, Aurora not available for all engines
  Cost:   Aurora ~20% more than RDS MySQL, but often worth it for production

Aurora Machine Learning:
  - Direct ML predictions from SQL (SageMaker, Comprehend)
  - SELECT aws_comprehend_detect_sentiment(review_text) FROM reviews;
```

---

## 11. Databases — DynamoDB

### DynamoDB Fundamentals
```
What: AWS managed NoSQL key-value + document database
Key properties: Single-digit millisecond latency, auto-scaling, serverless option

Data model:
  Table:             Collection of items
  Item:              Like a row (can be up to 400 KB, each item different schema)
  Attribute:         Like a column (can be nested JSON)
  Primary Key:       Required, must be unique

Primary Key Types:
  Simple (Partition Key):  Single attribute hashed to determine partition
  Composite (Partition + Sort Key): Partition for sharding, Sort for ordering within partition

Read/Write Capacity Modes:
  Provisioned:  Set RCU and WCU; auto-scaling adjusts capacity
  On-Demand:    Pay per request; no capacity planning; more expensive per request
                Use: unpredictable traffic, new apps, traffic spikes

1 RCU = 1 strongly consistent read OR 2 eventually consistent reads of ≤4KB item
1 WCU = 1 write of ≤1KB item
```

### DynamoDB Access Patterns
```
GetItem:    Get single item by primary key (PK + optional SK) → O(1)
PutItem:    Create or replace item
UpdateItem: Update specific attributes
DeleteItem: Delete by primary key
Query:      All items with same partition key (and optional SK range filter)
            Up to 1MB per query → paginate with LastEvaluatedKey
Scan:       Read ALL items in table (AVOID in production, very expensive)

Global Secondary Index (GSI):
  - Alternative partition key (and optional sort key)
  - Has its own RCU/WCU (or inherits on-demand)
  - Can project (copy) specific attributes
  - Use: query by non-primary-key attributes

Local Secondary Index (LSI):
  - Same partition key as table, different sort key
  - Shares table's RCU/WCU
  - MUST be created at table creation time
  - Max 10 GB per partition key

Access Pattern Design (most important DynamoDB skill!):
  Know your access patterns BEFORE designing table schema
  Design table around access patterns (opposite of relational!)

Single-Table Design example (e-commerce):
  PK          | SK              | Type    | Data
  USER#123    | PROFILE         | User    | name, email
  USER#123    | ORDER#456       | Order   | total, date
  USER#123    | ORDER#456#ITEM#1| OrderItem | product, qty
  PRODUCT#789 | METADATA        | Product | name, price

  Access pattern: Get all orders for user → Query PK=USER#123, SK begins_with ORDER#
```

### DynamoDB Advanced
```
Streams:
  - Ordered log of item changes (create/update/delete)
  - Retention: 24 hours
  - Trigger Lambda for real-time reactions to data changes
  - Use: event sourcing, cross-region replication, audit trail

TTL (Time To Live):
  - Set epoch timestamp attribute → item auto-deleted after expiry
  - No WCU consumed (free deletion)
  - Deleted within 48 hours of expiry
  - Use: session data, temporary tokens, event logs

Transactions:
  - All-or-nothing: up to 25 items across tables in same region
  - TransactWriteItems: atomic write to multiple items/tables
  - TransactGetItems: consistent read of multiple items
  - Costs 2x RCU/WCU
  - Use: financial transactions, order creation (reserve stock + create order)

DynamoDB Accelerator (DAX):
  - In-memory cache for DynamoDB (microsecond latency)
  - Fully compatible with DynamoDB API (drop-in replacement)
  - Write-through cache: writes go to both DAX and DynamoDB
  - Use: read-heavy, cache-friendly workloads, hot partitions
  - NOT for: strongly consistent reads (goes directly to DynamoDB), write-heavy

Backup:
  On-demand backups:  Manual snapshots, no performance impact
  PITR (Point in Time Recovery): Continuous backups, restore to any second in 35 days

DynamoDB Global Tables:
  - Multi-region, multi-active (read AND write anywhere)
  - DynamoDB handles conflict resolution (last-writer-wins)
  - Use: globally distributed apps, regional data residency
```

---

## 12. Databases — ElastiCache (Redis/Memcached)

### ElastiCache Overview
```
What: Managed in-memory caching service
Engines: Redis (feature-rich) and Memcached (simple, multithreaded)

Why use cache:
  - Reduce DB load (database expensive, cache cheap)
  - Reduce latency (memory: microseconds vs DB: milliseconds)
  - Session store (horizontal scaling of stateless apps)
  - Real-time leaderboards, pub/sub
```

### Redis vs Memcached
```
                Redis               Memcached
Data Types:     Rich (string, hash, list, set, sorted set, bitmap, stream)
                Basic (string/binary only)
Persistence:    RDB snapshots + AOF append-only log   None (pure cache)
Replication:    Yes (Primary + up to 5 replicas)       No
Clustering:     Redis Cluster (sharding)              Built-in multi-threading
Multi-AZ:       Yes (automatic failover)              No
Pub/Sub:        Yes                                   No
Lua scripting:  Yes                                   No
Backup:         Yes                                   No
Threads:        Single-threaded (mostly)              Multi-threaded

Use Redis for: Leaderboards, session store, pub/sub, persistent cache, complex data
Use Memcached for: Simple volatile cache, multi-threaded performance, large nodes
```

### ElastiCache Redis Architecture
```
Standalone (non-clustered):
  - One primary node + up to 5 replica nodes
  - Replicas are read-only
  - Multi-AZ: primary in one AZ, replicas in others
  - Automatic failover: if primary fails, replica promoted

Redis Cluster (Cluster Mode):
  - Sharding: data split across 1-500 shards
  - Each shard: 1 primary + up to 5 replicas
  - Total: up to 500 shards × 500 TB data
  - Use: datasets too large for single node, write-heavy workloads

Common Patterns:
  Lazy Loading (Cache-Aside):
    1. App checks cache
    2. Cache miss → fetch from DB
    3. Store in cache with TTL
    4. Return data
    Pros: Only cache what's needed
    Cons: Cache miss = extra DB call, stale data possible

  Write-Through:
    1. On DB write → also write to cache
    2. Cache always fresh
    Pros: Cache never stale
    Cons: Unnecessary caching (writes to cache for rarely-read data)

  Session Store:
    - Store session in Redis instead of local memory
    - Any app server can read any user's session
    - Enables stateless horizontal scaling
```

---

## 13. Messaging — SQS, SNS, EventBridge, Kinesis

### SQS (Simple Queue Service)
```
What: Managed message queue (async, decoupled communication)

Queue Types:
  Standard Queue:
    - Unlimited throughput
    - At-least-once delivery (rare duplicates)
    - Best-effort ordering (NOT guaranteed)
    - Use: most use cases, when order doesn't matter

  FIFO Queue:
    - First-In-First-Out ordering (guaranteed)
    - Exactly-once processing (deduplication)
    - Limited: 300 TPS (3000 with batching)
    - Message group ID: parallel ordered processing per group
    - Use: financial transactions, order processing, inventory management

Key Settings:
  Visibility Timeout:  Time message is invisible after received (default 30s, max 12h)
                       Set to > processing time to avoid double-processing
  Message Retention:   1 minute to 14 days (default 4 days)
  Delay Queue:         Delay initial delivery 0-900 seconds
  Long Polling:        Wait up to 20s for messages (reduces empty polls, cheaper)
  Message Size:        Max 256 KB; use S3 + SQS Extended Client for larger

Dead Letter Queue (DLQ):
  - After N failed processing attempts, message moved to DLQ
  - Set maxReceiveCount (e.g., 3)
  - Debug failed messages without losing them
  - Alarm on DLQ depth → trigger alert

Real-Life Pattern: Order Service
  Order API → SQS → Payment Service (consumer 1)
                   → Inventory Service (consumer 2)
                   → Notification Service (consumer 3)
  But wait: SQS is 1 consumer per message (not fan-out)
  For fan-out: SNS → multiple SQS queues (see below)
```

### SNS (Simple Notification Service)
```
What: Pub/Sub messaging — one message to many subscribers

Protocols:
  - SQS (most common — durable delivery)
  - Lambda (event-driven processing)
  - Email / Email-JSON
  - HTTP/HTTPS webhooks
  - SMS text messages
  - Mobile push (FCM, APNS)

Fan-Out Pattern (SNS + SQS):
  Order Created → SNS Topic
                    ├── SQS (payment processing)
                    ├── SQS (inventory update)
                    ├── SQS (email notification)
                    └── Lambda (analytics)

  Benefits:
    - Each subscriber independently processes at own pace
    - Subscriber failures don't affect others
    - Durable (SQS buffers if downstream is slow/down)

Message Filtering:
  - JSON filter on message attributes
  - Each SQS subscriber can receive only relevant messages
  - Example: Payment SQS only receives "order.paid" events
             Notification SQS receives all events

SNS FIFO:
  - Strict ordering + deduplication (like SQS FIFO)
  - Fanout to SQS FIFO queues only
```

### EventBridge
```
What: Serverless event bus — route events between AWS services, SaaS, custom apps

Event Bus:
  Default: receives events from AWS services
  Custom: your application events
  Partner: SaaS provider events (Stripe, PagerDuty, DataDog, Zendesk)

Rules:
  - Filter events by pattern (event source, detail-type, fields)
  - Route to targets (Lambda, SQS, SNS, Step Functions, Kinesis, etc.)
  - Schedule rules: cron or rate (like CloudWatch Events — same service!)

EventBridge vs SNS:
  EventBridge: Schema registry, replay events, SaaS integration, richer filtering
  SNS:         Simpler, cheaper, mobile push support, SMS

EventBridge Pipes:
  - Direct source → enrichment (Lambda/Step Functions) → target
  - Built-in filtering, batching, transformation
  - Use: replace simple Lambda glue functions

Schema Registry:
  - Discover and version event schemas
  - Generate code bindings (Java, Python, TypeScript)
```

### Kinesis
```
Kinesis Data Streams (KDS):
  What: Real-time data streaming at scale
  Shard: unit of capacity (1 MB/s write, 2 MB/s read, 1000 records/s)
  Retention: 24h (default) to 365 days (extended)
  Consumers:
    - Lambda: auto-invoked per batch
    - Kinesis Data Analytics: real-time SQL queries
    - Custom consumer (KCL, SDK)
  Ordering: per shard (use partition key for related events to same shard)
  Use: real-time analytics, clickstream, IoT telemetry, fraud detection

Kinesis Data Firehose:
  What: Load streaming data to destinations (S3, Redshift, OpenSearch, Datadog, Splunk)
  Fully managed: no shards to manage, auto-scales
  Buffering: buffer by size (1MB-128MB) or time (60-900s) before delivery
  Transform: inline Lambda transform before delivery
  Near real-time: 60-second minimum delivery lag
  Use: log delivery to S3/Elasticsearch, data lake ingestion

Kinesis vs SQS:
  Kinesis: Real-time streaming, replay, multiple consumers, ordered per shard
  SQS:     Decoupled async jobs, message visibility, DLQ, simpler

Kinesis Data Analytics:
  SQL or Apache Flink queries on streaming data
  Real-time dashboards, anomaly detection, windowed aggregations
```

---

# PART 3 — DEVOPS, SECURITY & MONITORING

## 14. Security — KMS, Secrets Manager, WAF, Shield, GuardDuty, Cognito

### KMS (Key Management Service)
```
What: Create and manage cryptographic keys for encryption

CMK (Customer Managed Key):
  - You create, you control, you can audit usage in CloudTrail
  - $1/month per key
  - Can configure rotation (auto-rotate yearly)
  - Can restrict who can use key via key policy

AWS Managed Key:
  - Created by AWS for specific service (e.g., aws/s3)
  - Cannot manage or control directly
  - Free

KMS Operations:
  Encrypt:    Encrypt up to 4KB data directly with KMS
  Decrypt:    Decrypt data encrypted with KMS
  GenerateDataKey: Create plaintext + encrypted data key pair
                   Use for envelope encryption

Envelope Encryption (how S3/EBS encryption works):
  1. Generate random Data Encryption Key (DEK)
  2. Encrypt YOUR DATA with DEK (fast, AES-256)
  3. Encrypt DEK with KMS CMK
  4. Store encrypted data + encrypted DEK together
  5. To decrypt: call KMS to decrypt DEK, then decrypt data locally

KMS Multi-Region Keys:
  - Replicate key to other regions
  - Same key material, different ARN
  - Use: global DynamoDB, cross-region replication with same key
```

### Secrets Manager
```
What: Store, rotate, and manage sensitive credentials

vs Parameter Store:
  Secrets Manager: Auto-rotation, higher cost ($0.40/secret/month + API calls)
                   Designed specifically for secrets (DB passwords, API keys)
  Parameter Store: Free tier available, also stores config (not just secrets),
                   No auto-rotation

Auto-Rotation:
  - Built-in support for RDS, Aurora, Redshift, DocumentDB
  - Lambda function rotates secret AND updates DB simultaneously
  - No downtime: multiple versions active (AWSCURRENT, AWSPENDING)

Integration:
  - ECS/Lambda/EC2: fetch secret at runtime (not in env var)
  - CloudFormation: use {{resolve:secretsmanager:...}} in templates
  - RDS Proxy: native integration for DB credential rotation

Usage (Python):
  import boto3, json

  def get_db_password(secret_name: str) -> str:
      client = boto3.client("secretsmanager")
      response = client.get_secret_value(SecretId=secret_name)
      secret = json.loads(response["SecretString"])
      return secret["password"]
```

### WAF (Web Application Firewall)
```
What: Protect web apps from common exploits

Integrates with: ALB, API Gateway, CloudFront, AppSync

Rule types:
  IP rules:           Block/allow specific IPs or CIDR ranges
  Rate-based:         Block IPs making > N requests per 5 minutes
  Managed rule groups: Pre-built by AWS or AWS Marketplace (OWASP Top 10, SQL injection)
  Custom rules:       Match on headers, URI, body, method

Web ACL:
  - Collection of rules
  - Default action: ALLOW or BLOCK

Use cases:
  - Block SQL injection, XSS, LFI, RFI
  - Allow only specific countries (geoblocking)
  - Rate limit login endpoints (brute force protection)
  - Block known bad bots (using Bot Control managed rule group)
```

### Shield
```
Shield Standard (FREE):
  - Automatic protection for all AWS customers
  - Protects against common Layer 3/4 DDoS attacks
  - SYN/UDP floods, reflection attacks

Shield Advanced ($3,000/month per organization):
  - Advanced DDoS protection for EC2, ELB, CloudFront, Route 53, Global Accelerator
  - DDoS cost protection (no extra charges if attack causes scale-out)
  - 24/7 DDoS Response Team (DRT) access
  - Near-real-time attack visibility + reports
  - WAF integration included
  - Use: financial services, gaming, e-commerce with DDoS risk
```

### GuardDuty
```
What: ML-based threat detection analyzing AWS logs

Data sources:
  - CloudTrail (API calls)
  - VPC Flow Logs (network traffic)
  - DNS logs
  - S3 data events
  - EKS audit logs
  - Lambda network activity

Threat types detected:
  - Unusual API calls from unusual location/IP
  - EC2 communicating with known malware C&C servers
  - Cryptocurrency mining activity
  - Compromised credentials
  - Port scanning

Integration: EventBridge → SNS → PagerDuty/Slack alert
30-day free trial, then $x per GB of analyzed data
```

### Cognito
```
What: Authentication/Authorization for web and mobile apps

User Pools:
  - User directory with sign-up/sign-in (email, phone, social)
  - JWT tokens: ID token, Access token, Refresh token
  - MFA support
  - Email/SMS verification
  - Hosted UI (pre-built login page)
  - Integrates natively with API Gateway and ALB

Identity Pools (Federated Identities):
  - Exchange User Pool JWT (or Google/Facebook/SAML token) for AWS credentials
  - Temporary AWS credentials to call AWS services directly (S3, DynamoDB)
  - Use: mobile apps directly accessing AWS resources

Common Pattern:
  User → Cognito User Pool (login) → JWT
  App → API Gateway + Cognito Authorizer (validates JWT)
  App → Cognito Identity Pool (exchange JWT for AWS creds) → S3 upload directly
```

---

## 15. Monitoring — CloudWatch, X-Ray, CloudTrail

### CloudWatch
```
What: AWS monitoring and observability service

CloudWatch Metrics:
  - Numeric time-series data from AWS services (CPU, memory, requests)
  - Standard metrics: free (EC2 CPU every 5 min)
  - Detailed monitoring: 1-minute granularity ($)
  - Custom metrics: publish your app metrics to CloudWatch
    aws cloudwatch put-metric-data --namespace MyApp --metric-name OrderCount --value 42

  Custom metric resolution:
    Standard: 1 minute
    High resolution: 1, 5, 10, 30 seconds (for anomaly detection)

CloudWatch Alarms:
  - Trigger on metric thresholds
  - Actions: SNS notification, EC2 action (stop/start/reboot), Auto Scaling
  - States: OK, ALARM, INSUFFICIENT_DATA
  - Composite Alarms: AND/OR multiple alarms (reduce alert noise)

CloudWatch Logs:
  - Collect logs from EC2 (CloudWatch Agent), Lambda (auto), ECS, API Gateway, etc.
  - Log Group: container for logs from same source
  - Log Stream: sequence of log events from one instance/function
  - Log Insights: query and analyze logs (like SQL for logs)
    fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20
  - Metric Filters: extract metrics from log patterns (count ERROR occurrences)
  - Export to S3 for long-term storage
  - Subscription Filters: stream logs to Lambda, Kinesis, OpenSearch in real-time

CloudWatch Dashboards:
  - Custom dashboards with graphs, numbers, text
  - Cross-region, cross-account
  - Share publicly or via AWS console

CloudWatch Agent:
  - Install on EC2 to collect: OS metrics (memory, disk), custom app logs
  - Configure via SSM Parameter Store (JSON config)
  - Essential: EC2 memory/disk NOT collected by default!
```

### X-Ray (Distributed Tracing)
```
What: Distributed request tracing across services

Key concepts:
  Trace:    End-to-end journey of a request
  Segment:  Work done by a single service
  Subsegment: Detailed part of a segment (DB call, HTTP call)
  Annotation: Key-value pair indexed for filtering (user_id, order_id)
  Metadata:   Non-indexed data (full request/response)

Integration:
  - Lambda: enable X-Ray in function config
  - EC2/ECS: install X-Ray daemon
  - API Gateway: enable tracing in stage settings
  - SDK: instrument your code (Python: aws_xray_sdk)

Usage (Python FastAPI):
  from aws_xray_sdk.core import xray_recorder, patch_all
  patch_all()  # auto-instrument boto3, requests, sqlalchemy

  @xray_recorder.capture("process_order")
  def process_order(order_id: str):
      xray_recorder.current_segment().put_annotation("order_id", order_id)
      # ... processing

Service Map:
  - Visual graph of all services and their connections
  - Response time and error rates on each connection
  - Quickly identify bottleneck or error source

X-Ray Analytics:
  - Filter traces by annotation, error, response time
  - Groups: save filter expressions
  - Trace comparisons: compare before/after deployments
```

### CloudTrail
```
What: Audit log of ALL AWS API calls in your account

Records:
  - Who made the call (user, role, service)
  - When it happened
  - What was called (service, action)
  - From where (IP, region)
  - What was affected (resource ARN)
  - Success or failure

Types:
  Management events: Control plane operations (create/delete/modify resources) — FREE for first copy
  Data events:       S3 object operations, Lambda invocations — costs $
  Insight events:    Unusual activity detection

Trail:
  - Send events to S3 (long-term storage) and/or CloudWatch Logs
  - Multi-region trail: single trail covers all regions
  - Organization trail: covers all accounts in AWS Organization

Key use cases:
  - Security forensics: "who deleted that S3 bucket?"
  - Compliance: prove all access is authorized
  - Change tracking: "who changed this security group?"
  - CloudTrail + GuardDuty = detect + investigate threats

Log file integrity:
  - SHA-256 hash of each log file
  - Detect tampered/deleted log files (compliance requirement)
```

---

## 16. DevOps — CodePipeline, CloudFormation, CDK, Elastic Beanstalk

### CI/CD on AWS
```
CodeCommit:    Managed Git repository (like GitHub on AWS) — being deprecated, use GitHub
CodeBuild:     Managed build server (compile, test, produce artifacts)
               Build spec file (buildspec.yml) defines build steps
               Integrates with ECR (Docker builds)
CodeDeploy:    Automated deployment to EC2, Lambda, ECS, on-premises
CodePipeline:  Orchestrates CI/CD pipeline (Source → Build → Test → Deploy)

Full Pipeline:
  Source: GitHub/CodeCommit (on code push)
  Build:  CodeBuild (run tests, build Docker image, push to ECR)
  Deploy: CodeDeploy (rolling/blue-green deploy to EC2/ECS/Lambda)
  Approval: Manual approval gate before production

CodeDeploy Deployment Strategies:
  In-Place (EC2):   Stop app, deploy, start app (brief downtime)
  Rolling:          Deploy to % of instances at a time
  Blue/Green (EC2): Launch new instances, switch traffic, terminate old
  Canary (Lambda):  5% → 100% over 10 minutes (CodeDeployDefault.LambdaCanary10Percent10Minutes)
  Linear (Lambda):  10% per minute until 100%
  All-At-Once:      Deploy everywhere simultaneously (fastest, highest risk)
```

### CloudFormation (Infrastructure as Code)
```
What: Define AWS infrastructure in JSON or YAML templates

Template Structure:
  AWSTemplateFormatVersion: '2010-09-09'
  Description: My application stack
  Parameters:         # User inputs (environment, instance type, etc.)
  Mappings:           # Key-value lookup tables (AMI by region)
  Conditions:         # Conditional resource creation
  Resources:          # REQUIRED: actual AWS resources
  Outputs:            # Values to export (Load Balancer URL, etc.)

Example (EC2 + SG):
  Resources:
    WebServerSG:
      Type: AWS::EC2::SecurityGroup
      Properties:
        GroupDescription: Web server security group
        VpcId: !Ref VPC
        SecurityGroupIngress:
          - IpProtocol: tcp
            FromPort: 80
            ToPort: 80
            CidrIp: 0.0.0.0/0

    WebServer:
      Type: AWS::EC2::Instance
      Properties:
        InstanceType: t3.micro
        ImageId: !FindInMap [RegionMap, !Ref AWS::Region, AMI]
        SecurityGroupIds:
          - !Ref WebServerSG
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y python3
            pip3 install flask

Intrinsic Functions:
  !Ref             → Reference parameter or resource
  !Sub             → String substitution (${ParameterName})
  !GetAtt          → Get attribute of resource (!GetAtt ALB.DNSName)
  !FindInMap       → Lookup in Mappings
  !If              → Conditional value
  !Select          → Select from list
  !ImportValue     → Import output from another stack

Stack:
  - Deployed CloudFormation template
  - Create/update/delete as a unit
  - Rollback on failure

Nested Stacks:
  - Reference other CloudFormation templates
  - Reusable components (VPC stack, RDS stack)

Stack Sets:
  - Deploy same stack to multiple accounts/regions
  - For AWS Organizations

Drift Detection:
  - Compare actual resource config vs template
  - Detect manual changes made outside CloudFormation
```

### AWS CDK (Cloud Development Kit)
```
What: Define infrastructure using Python/TypeScript/Java (compiles to CloudFormation)

Why CDK over raw CloudFormation:
  ✅ Real programming language (loops, conditions, abstractions)
  ✅ IDE support (autocomplete, type checking)
  ✅ Level 2/3 constructs (sensible defaults, less boilerplate)
  ✅ Easier to share and reuse (like npm packages)

Python CDK Example:
  from aws_cdk import (
      Stack, App,
      aws_ec2 as ec2,
      aws_ecs as ecs,
      aws_ecs_patterns as ecs_patterns,
  )

  class MyStack(Stack):
      def __init__(self, scope, id, **kwargs):
          super().__init__(scope, id, **kwargs)

          vpc = ec2.Vpc(self, "VPC", max_azs=2)

          cluster = ecs.Cluster(self, "Cluster", vpc=vpc)

          # ApplicationLoadBalancedFargateService: ALB + ECS + Fargate in one construct!
          service = ecs_patterns.ApplicationLoadBalancedFargateService(
              self, "MyApp",
              cluster=cluster,
              cpu=256,
              memory_limit_mib=512,
              desired_count=2,
              task_image_options=ecs_patterns.ApplicationLoadBalancedTaskImageOptions(
                  image=ecs.ContainerImage.from_asset("./app"),
                  container_port=8000,
              ),
          )

  app = App()
  MyStack(app, "MyStack")
  app.synth()

CDK Commands:
  cdk init    → Create new CDK project
  cdk synth   → Synthesize to CloudFormation template
  cdk deploy  → Deploy stack
  cdk diff    → Show what will change
  cdk destroy → Delete stack
```

### Elastic Beanstalk
```
What: PaaS — deploy web apps without managing infrastructure
Think: Heroku on AWS

Supports: Node.js, Python, Ruby, Java, Go, .NET, PHP, Docker

What Beanstalk creates for you:
  - EC2 instances
  - Auto Scaling Group
  - Load Balancer
  - Security Groups
  - CloudWatch monitoring
  - S3 for deployments/logs

Deployment policies:
  All at once:        Fastest, brief downtime
  Rolling:            Partial downtime, no extra cost
  Rolling with batch: No downtime, no extra cost, slower
  Immutable:          Zero downtime, create new instances (safe, expensive)
  Blue/Green:         Create separate environment, switch DNS (safest)

.ebextensions:
  - YAML/JSON config files in .ebextensions/ directory
  - Customize EC2 config, install packages, set environment variables
  - Run commands before/after deployment

Use when: Simple apps, small teams, don't want to manage infrastructure
Avoid for: Complex microservices, when you need fine control over infrastructure
```

---

## 17. Analytics — Kinesis Data Streams, Glue, Athena, Redshift

### AWS Glue
```
What: Managed ETL (Extract, Transform, Load) service

Components:
  Data Catalog:     Metadata repository — tables, schemas, databases
                    Integrate with Athena, Redshift, EMR
  Crawlers:         Scan data sources (S3, RDS, DynamoDB) → populate Data Catalog
  ETL Jobs:         Apache Spark jobs (Python or Scala)
                    Serverless Spark execution
  Glue Studio:      Visual drag-and-drop ETL builder
  Glue DataBrew:    Visual data prep for analysts (no code)

Use case:
  Raw logs in S3 → Glue Crawler (discover schema) → Glue ETL job (clean/transform)
  → Parquet in S3 → Athena (query) or Redshift (load for BI)
```

### Athena
```
What: Serverless SQL query engine for data in S3

Pay per query: $5 per TB scanned (reduce cost with Parquet/ORC + partitioning)

Use cases:
  - Ad hoc analysis of S3 data (logs, CSV, JSON, Parquet)
  - Query CloudTrail logs, ALB access logs, VPC flow logs
  - Cost Explorer alternative
  - Data lake querying

Best practices:
  - Convert to columnar format (Parquet, ORC) → 10-100x less data scanned
  - Partition data (year/month/day) → only scan relevant partitions
  - Use compression (Snappy, GZIP)
  - Avoid SELECT * (columnar = only scan needed columns)
```

### Redshift
```
What: Managed data warehouse for OLAP (Online Analytical Processing)

Architecture:
  Leader node:    Query planning, result aggregation
  Compute nodes:  Parallel query execution (up to 128 nodes)

Key concepts:
  Columnar storage:   Fast for analytical queries (read specific columns)
  MPP (Massively Parallel Processing): Distribute queries across nodes
  Redshift Spectrum:  Query S3 data directly (without loading to Redshift)
  Materialized Views: Pre-compute expensive queries

COPY command (load data from S3):
  COPY orders FROM 's3://my-bucket/orders/'
  IAM_ROLE 'arn:aws:iam::123:role/RedshiftRole'
  FORMAT AS PARQUET;

Use when: Business intelligence, complex analytical queries, data warehouse
Avoid for: OLTP (use RDS), unstructured data (use Athena on S3)
```

---

## 18. Other Key Services — Step Functions, AppSync, SES

### Step Functions
```
What: Visual workflow service for coordinating distributed systems

State Types:
  Task:     Call Lambda, ECS, SNS, SQS, Glue, Athena, DynamoDB, HTTP endpoint
  Choice:   Conditional branching (like if/else)
  Parallel: Run branches simultaneously
  Map:      Iterate over array items
  Wait:     Pause for duration or until timestamp
  Pass:     Pass input to output (with optional transformation)
  Succeed:  End workflow successfully
  Fail:     End workflow with error

Workflow Types:
  Standard: Exactly-once, up to 1 year duration, full audit history
  Express:  At-least-once, up to 5 minutes, cheaper for high-volume

Real-Life Use Cases:
  1. Order Processing Workflow:
     Validate Order → Reserve Inventory → Charge Payment → (fail → Refund)
     → Send Confirmation Email → Update Order Status

  2. Document Processing Pipeline:
     Upload to S3 → Lambda (extract text) → Comprehend (analyze) →
     Map state (process each page in parallel) → Store results in DynamoDB

  3. CI/CD Pipeline coordination
  4. ML training pipeline (SageMaker integration)
  5. Human approval workflow (Wait for callback + task token)
```

### Amazon SES (Simple Email Service)
```
What: Cloud email service for sending transactional/marketing email

Use cases:
  - Transactional: order confirmations, password resets, notifications
  - Marketing: bulk email campaigns
  - Bounce/complaint handling (critical for sender reputation)

Key concepts:
  Verified identities: Verify domain or email address before sending
  Sending limits:      Sandbox (200/day, 1/sec) → Production (increase via request)
  Dedicated IPs:       Warm up dedicated IPs for marketing (reputation isolation)
  Configuration Sets:  Track opens, clicks, bounces per campaign
  Suppression List:    SES auto-suppresses bounced/complaint addresses

Integration:
  import boto3
  client = boto3.client("ses", region_name="us-east-1")
  client.send_email(
      Source="noreply@mycompany.com",
      Destination={"ToAddresses": ["user@example.com"]},
      Message={
          "Subject": {"Data": "Your order is confirmed!"},
          "Body": {"Html": {"Data": "<h1>Thank you!</h1>"}}
      }
  )
```

---

# PART 4 — ARCHITECTURE & INTERVIEWS

## 19. Real-World Architecture Patterns

### Pattern 1: Serverless Web Application
```
Architecture:
  Users → CloudFront (CDN + cache) → S3 (static files: React/Vue SPA)
                                   → API Gateway → Lambda → DynamoDB
                                                          → RDS (via RDS Proxy)
                                   → Cognito (authentication)

Lambda → S3 (file uploads, direct via pre-signed URL)
Lambda → SQS → Worker Lambda (async jobs: email, reports)
Lambda → SNS → Notifications

Deployment:
  GitHub Actions / CodePipeline:
    Frontend: npm build → S3 sync → CloudFront invalidation
    Backend:  SAM/CDK deploy → Lambda update

Benefits:
  ✅ No servers to manage
  ✅ Auto-scales to 0 (no idle cost)
  ✅ Pay per request
  ✅ Global via CloudFront

Limitations:
  ❌ Cold starts (mitigate with Provisioned Concurrency)
  ❌ 15-minute max execution
  ❌ Complex local development
```

### Pattern 2: Three-Tier Web Application (Traditional)
```
Tier 1 — Presentation (Web):
  CloudFront → ALB → EC2 Auto Scaling Group (web servers)
  Public subnets

Tier 2 — Application:
  Internal ALB → EC2 Auto Scaling Group (app servers)
  Private subnets

Tier 3 — Data:
  RDS Multi-AZ (writes)
  RDS Read Replicas (read-heavy queries)
  ElastiCache Redis (session + cache)
  Private subnets (DB subnet group)

Cross-cutting:
  Route 53 → CloudFront → ALB (public)
  Secrets Manager (DB credentials)
  KMS (EBS + RDS encryption)
  CloudWatch (metrics + alarms)
  VPC Flow Logs → S3 (security)

Cost optimization:
  Reserved Instances for baseline EC2 + RDS
  Spot for batch/background workers
  S3 + CloudFront for static assets (off EC2)
```

### Pattern 3: Microservices with EKS
```
Architecture:
  Route 53 → ALB (AWS Load Balancer Controller)
           → EKS Cluster (3 node groups across 3 AZs)
             ├── service-a (Deployment + Service + HPA)
             ├── service-b (Deployment + Service + HPA)
             ├── service-c (Deployment + Service + HPA)
             └── monitoring (Prometheus + Grafana)

Each service:
  ECR (private image registry)
  IRSA (IAM Role per pod — least privilege)
  ConfigMap / Secrets (from Secrets Manager via CSI driver)
  HPA (scale by CPU/custom metrics)
  PDB (Pod Disruption Budget — HA during node maintenance)

Data per service:
  service-a: RDS Aurora (transactions)
  service-b: DynamoDB (high-speed lookups)
  service-c: ElastiCache (leaderboard, sessions)

Communication:
  Sync:  REST via internal ALB or service mesh (AWS App Mesh / Istio)
  Async: SNS + SQS, EventBridge, MSK (Managed Kafka)

Observability:
  CloudWatch Container Insights + CloudWatch Logs
  X-Ray (distributed tracing)
  Prometheus + Grafana (custom dashboards)
```

### Pattern 4: Data Lake Architecture
```
Ingestion Layer:
  Real-time: Kinesis Data Streams → Lambda → S3 (raw)
  Batch:     DMS (Database Migration Service) → S3 (raw)
             Direct S3 upload from on-prem (DataSync)
             API Gateway → Kinesis Firehose → S3 (raw)

Storage Layer (S3):
  s3://my-data-lake/
    raw/                   (original, immutable)
    processed/             (cleaned, standardized, Parquet format)
    curated/               (business-ready, partitioned by date)
    sandbox/               (data science experiments)

Processing Layer:
  AWS Glue (ETL): raw → processed → curated
  EMR (complex ML/Spark): big data processing jobs
  Lambda (lightweight transforms)

Catalog: AWS Glue Data Catalog
Query: Athena (pay-per-query SQL on S3)
BI: Amazon QuickSight → Athena or Redshift
Warehouse: Redshift (for complex analytical queries)

Governance:
  Lake Formation (fine-grained access control on data lake)
  Macie (detect PII/sensitive data in S3)
```

---

## 20. AWS Well-Architected Framework

```
6 Pillars:

1. OPERATIONAL EXCELLENCE
   - Infrastructure as Code (CloudFormation/CDK)
   - Deploy small, reversible changes
   - Automate responses to operational events
   - Refine operations through runbooks, postmortems

2. SECURITY
   - Implement strong identity (IAM, MFA, least privilege)
   - Enable traceability (CloudTrail, CloudWatch, GuardDuty)
   - Apply security at all layers (network, OS, app, data)
   - Automate security best practices
   - Protect data in transit and at rest (TLS, KMS)

3. RELIABILITY
   - Automatically recover from failure (ASG, Multi-AZ RDS, Route 53 failover)
   - Test recovery procedures (Game Days, chaos engineering)
   - Scale horizontally for aggregate resilience
   - Manage change through automation

4. PERFORMANCE EFFICIENCY
   - Use the right resource types and sizes (benchmarking)
   - Monitor performance (CloudWatch, X-Ray)
   - Stay current with AWS services
   - Trade-offs: serverless vs EC2 based on latency/cost

5. COST OPTIMIZATION
   - Implement cloud financial management
   - Pay only for what you use (delete unused resources)
   - Right-size resources (AWS Compute Optimizer)
   - Use pricing models (Reserved, Spot, Savings Plans)
   - Measure overall efficiency (cost per transaction)

6. SUSTAINABILITY
   - Understand your impact (Carbon footprint tool)
   - Maximize utilization (reduce idle resources)
   - Use managed services (AWS manages efficiency of shared infra)
   - Use efficient cloud storage (right storage class)
   - Reduce downstream impact (efficient code, caching)
```

---

## 21. Interview Questions — Core Concepts

### Compute
**Q: What's the difference between EC2 Reserved Instances and Savings Plans?**
A: Both offer discounts for commitment. Reserved Instances lock you to a specific instance type and region, offering up to 72% discount. Savings Plans are more flexible — you commit to a minimum $/hour spend but can change instance types, regions, or even use it for Lambda and Fargate (Compute Savings Plan). Savings Plans are generally preferred for new commitments due to flexibility.

**Q: When would you choose Lambda over EC2?**
A: Lambda for: event-driven, short-lived tasks, variable traffic, no idle servers needed, < 15-minute execution. EC2 for: long-running processes, stateful apps, GPU workloads, full OS control, predictable steady-state traffic where Reserved Instances save more money.

**Q: Explain EC2 cold start and how to mitigate it.**
A: Lambda cold start happens when a new container is initialized (first invocation or after scale-out). Mitigation: 1) Provisioned Concurrency (keep N warm instances), 2) SnapStart for Java 11+, 3) use lighter runtimes (Python/Node vs Java), 4) minimize package size, 5) lazy-load heavy libraries inside handler, 6) avoid VPC if possible (VPC Lambda adds ~100ms for ENI creation in older configurations).

### Storage & Databases
**Q: When would you choose DynamoDB over RDS?**
A: DynamoDB for: single-digit millisecond latency, automatic scaling, no schema migrations, key-value/document access patterns, massive scale (millions of RPS), serverless architectures, gaming, IoT, ad tech. RDS for: complex queries (JOINs), transactional integrity across many tables, relational data model, reporting with complex SQL, team familiar with SQL.

**Q: Explain S3 consistency model.**
A: Since December 2020, S3 provides strong consistency for all operations. PutObject followed immediately by GetObject returns the new object. ListObjects after PutObject returns the new object in the list. This means no need for eventual consistency workarounds anymore.

**Q: What is S3 Intelligent-Tiering and when should you use it?**
A: S3 Intelligent-Tiering auto-moves objects between access tiers based on usage patterns. Objects not accessed for 30 days go to Infrequent Access (lower storage cost), then Archive Instant Access (90 days), optionally Archive and Deep Archive. There's a small monitoring fee (~$0.0025 per 1,000 objects). Use when: access patterns are unpredictable or changing, objects are > 128 KB (below that the monitoring fee outweighs savings).

### Networking
**Q: What is VPC peering vs Transit Gateway?**
A: VPC Peering: direct 1-to-1 connection, non-transitive, cheapest option for few VPCs. Transit Gateway: hub-and-spoke model, transitive routing, centralized, supports up to 5,000 VPCs. Use peering for 2-5 VPCs; use Transit Gateway for 5+ VPCs or when you need centralized routing, VPN, or Direct Connect integration.

**Q: What is the difference between Security Groups and NACLs?**
A: Security Groups are stateful instance-level firewalls (return traffic automatically allowed, ALLOW only). NACLs are stateless subnet-level firewalls (must explicitly allow both inbound and outbound, ALLOW and DENY rules evaluated in order). Start with Security Groups; add NACLs for subnet-level DENY rules (e.g., block specific IP ranges at subnet level).

### Security
**Q: How do you securely store database credentials in AWS?**
A: Use AWS Secrets Manager. Store credentials as a secret. Enable auto-rotation (Lambda function rotates DB password + updates RDS). App retrieves secret at runtime via SDK — never hardcoded. Use IAM roles for the app (EC2/Lambda/ECS) to access Secrets Manager. KMS encrypts the secret at rest. Enable CloudTrail to audit all access to the secret.

**Q: What is IAM role assumption and when is it used?**
A: Role assumption is when a principal (user, service, or account) temporarily takes on the permissions of an IAM role by calling STS AssumeRole. Used for: EC2/Lambda accessing AWS services (service roles), cross-account access, identity federation (allow corporate AD users to access AWS), privilege escalation patterns, CI/CD pipelines assuming deployment roles.

---

## 22. Situation-Based Interview Q&A

### Situation 1: High Availability
**"Your application is running on a single EC2 instance. The business requires 99.99% uptime. How would you redesign it?"**

Answer:
```
Current state: Single EC2 = single point of failure, ~99.5% availability
Target:        99.99% = 52 minutes downtime/year max

Step 1 — Eliminate single points of failure:
  - Deploy EC2 across 2+ Availability Zones
  - Application Load Balancer distributes traffic across AZs
  - ALB health checks → auto-deregister unhealthy instances

Step 2 — Auto Scaling:
  - Auto Scaling Group: min 2, desired 2, max 10 (one per AZ minimum)
  - Target tracking: scale out if CPU > 70%, scale in if < 30%
  - Health checks: ALB health check (not just EC2 health check)

Step 3 — Database HA:
  - RDS Multi-AZ: synchronous standby, auto-failover in 60-120 seconds
  - RDS Read Replicas in other regions for DR

Step 4 — Session handling:
  - Move sessions to ElastiCache Redis (instances are stateless)
  - Any request can be served by any EC2 instance

Step 5 — DNS failover:
  - Route 53 with health checks → if ALB fails, fail over to DR region
  - TTL: 60 seconds for fast failover

Step 6 — DR strategy:
  - Multi-region: Aurora Global Database, S3 CRR
  - RTO: 15 minutes (Route 53 failover), RPO: < 1 minute (Aurora Global)

Result: Multi-AZ active-active → ~99.99%+ availability
        Multi-region active-passive → 99.999%+ with fast failover
```

### Situation 2: Cost Reduction
**"Your AWS bill is $50,000/month and the team wants to reduce it by 30%. How do you approach it?"**

Answer:
```
Step 1 — Audit and discover waste (AWS Cost Explorer + Trusted Advisor):
  - Find idle/underused EC2 instances (< 5% CPU utilization)
  - Find unused Elastic IPs, snapshots, AMIs, old EBS volumes
  - Find over-provisioned RDS instances
  - Find S3 buckets with no lifecycle policies
  - Find data transfer costs (egress charges, cross-AZ traffic)

Step 2 — Quick wins (immediate savings):
  - Delete unused resources (snapshots, old AMIs, idle instances) → save $2,000+/mo
  - Right-size over-provisioned EC2/RDS (use AWS Compute Optimizer) → save $3,000+/mo
  - Apply S3 lifecycle policies (move old data to Glacier) → save $1,000+/mo
  - Enable S3 Intelligent-Tiering on large buckets → save $500+/mo

Step 3 — Purchasing strategy:
  - Identify steady-state EC2 and RDS → purchase 1-year Reserved or Savings Plans
  - Reserved Instances = 40-72% off on-demand
  - Example: 10x m5.large → $0.096/hr on-demand vs $0.059/hr Reserved (1yr no upfront)
  - Save: (0.096-0.059) × 10 × 720 = ~$267/mo per 10 instances

Step 4 — Architecture optimization:
  - Move non-critical batch workloads to Spot Instances (80% saving)
  - Convert monolith features to Lambda (no idle EC2 cost)
  - Use CloudFront cache to reduce ALB + EC2 request load
  - Use S3 Gateway Endpoints for free S3 traffic from VPC

Step 5 — Monitoring and governance:
  - AWS Budgets: alerts at 80% and 100% of budget threshold
  - Tag everything → cost allocation by team/project
  - Regular cost reviews (Cost Explorer weekly)
  - Use AWS Cost Anomaly Detection for unexpected spikes

Expected savings: $15,000-20,000/month (30-40%)
```

### Situation 3: Slow Application
**"Users are complaining the application is slow (page load > 5 seconds). How do you troubleshoot and fix it?"**

Answer:
```
Step 1 — Establish baseline and locate bottleneck:
  Tools: CloudWatch dashboards, X-Ray Service Map, ALB Access Logs
  Questions:
    - Slow for all users or specific regions?
    - Slow always or only at peak times?
    - Which requests are slow (API endpoint, page, query)?
  
  Metrics to check:
    - ALB TargetResponseTime histogram
    - EC2 CPU, memory (CloudWatch Agent for memory)
    - RDS CPUUtilization, ReadLatency, WriteLatency, DatabaseConnections
    - ElastiCache CacheHitRate, CacheMisses

Step 2 — Common culprits and fixes:

  Database slow queries:
    - Enable RDS slow query log → find queries > 1 second
    - Explain plan → add missing indexes
    - N+1 query problem → use JOIN or eager loading
    - Too many connections → add RDS Proxy (connection pooling)
    - High CPU on RDS → add Read Replicas for reporting queries

  High EC2 CPU/Memory:
    - Short-term: scale out (add instances) or scale up (larger instance)
    - Long-term: profile code (cProfile, py-spy), find inefficient algorithms

  No caching:
    - Add ElastiCache (Redis) for frequent DB reads
    - CloudFront for static assets + API responses
    - In-process cache (functools.lru_cache) for computed values

  Network latency:
    - Users far from region → add CloudFront CDN
    - Cross-AZ calls → ensure app and DB in same AZ where possible
    - External API calls slow → add circuit breaker, async processing

  Memory pressure / GC pauses:
    - Increase EC2 instance memory
    - Profile memory usage, fix leaks

Step 3 — Verify fixes:
  - Deploy fix → monitor X-Ray traces, CloudWatch metrics
  - Compare P50/P99 latency before/after
  - Set CloudWatch alarm on TargetResponseTime > 2s

Result: Typical resolution: adding caching reduces latency 80-90%
         Adding indexes reduces DB query time 10x-100x
```

### Situation 4: Security Breach
**"CloudTrail shows unusual API calls — someone is deleting S3 objects in the middle of the night. What do you do?"**

Answer:
```
Immediate Response (first 15 minutes):
  1. Identify the principal: CloudTrail → filter by eventName=DeleteObject, 
     check userIdentity field → which IAM user/role/key?
  2. Disable the compromised credential immediately:
     - If access key: aws iam update-access-key --status Inactive
     - If IAM user: aws iam deactivate-mfa-device (temporarily) or add DenyAll policy
     - If EC2 instance: isolate instance (change SG to block all traffic)
  3. Enable S3 Versioning + Object Lock on affected buckets (if not already)
  4. Check for active sessions: aws iam list-keys, aws sts get-caller-identity

Short-term (next few hours):
  5. Restore deleted objects from S3 versioning (delete the delete markers)
  6. Audit what else the compromised credential accessed:
     CloudTrail → filter by the specific user ARN → last 7 days
  7. Check if IAM policies were modified (new users, privilege escalation)
  8. Review GuardDuty findings for additional threats
  9. Check if any data was exfiltrated (CloudTrail → GetObject events)
  10. Rotate ALL access keys, not just compromised one (assume breach)

Prevention (long-term):
  - Enable MFA delete on S3 buckets
  - Set up CloudWatch alarm on S3 DeleteObject events
  - GuardDuty → EventBridge → Lambda → auto-respond to threats
  - Use Macie to detect sensitive data in S3
  - Implement least privilege (IAM Access Analyzer)
  - AWS Organizations SCP: Deny DisableMFADelete, Deny PutBucketPolicy unless admin
```

### Situation 5: Traffic Spike (Black Friday)
**"Black Friday is in 2 weeks. You expect 100x normal traffic. How do you prepare your AWS infrastructure?"**

Answer:
```
Week 1 — Capacity Planning:
  1. Profile current capacity at 1x traffic: P99 latency, RPS, DB connections
  2. Estimate 100x requirements: instances, DB capacity, cache size
  3. Load test: Artillery/k6 on staging environment (simulate 100x traffic)
  4. Identify bottlenecks from load test results

Infrastructure Changes:
  Compute:
    - Increase ASG max capacity (from 10 to 200)
    - Add Capacity Reservations for guaranteed EC2 availability
    - Consider adding Spot Fleet for burst capacity
    - Pre-warm Application Load Balancers (contact AWS in advance)

  Database:
    - Scale up RDS instance class (db.m5.large → db.r5.2xlarge)
    - Add Read Replicas (offload reporting queries)
    - Enable RDS Proxy (prevent connection exhaustion from Lambda/spikes)
    - Increase max_connections parameter

  Caching:
    - Scale ElastiCache Redis cluster (add nodes)
    - Increase cache TTL for product catalog (rarely changes)
    - Cache product listings, home page (high read, rarely writes)

  CDN:
    - Pre-warm CloudFront (contact AWS or pre-fetch popular URLs)
    - Cache catalog pages in CloudFront (Vary: Accept-Language header)
    - Increase S3 request rate by adding random prefix to keys

  Architecture:
    - Enable DynamoDB On-Demand mode (or scale RCU/WCU high)
    - Pre-provision Lambda concurrency or use Provisioned Concurrency
    - Move checkout flow to async (SQS queue) if order creation peaks

Week 2 — Testing & Readiness:
  - Full load test at expected peak (100x)
  - Test auto-scaling triggers (do instances scale out fast enough?)
  - Test database failover (Multi-AZ)
  - Run AWS Trusted Advisor checks
  - Pre-buy Savings Plans / On-Demand for extra capacity
  - Set up CloudWatch dashboards for real-time monitoring
  - Brief on-call team, prepare runbooks

Day-of:
  - Scale ASG desired count pre-emptively (not reactive)
  - CloudWatch alarms: alert at 60% capacity (not 90%)
  - Be ready to manually scale if ASG is too slow
  - Circuit breakers on non-critical services (disable features if DB overloaded)
```

### Situation 6: Migrate On-Premises App to AWS
**"You have a Java Spring Boot app with PostgreSQL database on-premises. How do you migrate to AWS?"**

Answer:
```
Migration Strategies (6 R's):
  1. Rehost (Lift & Shift) — fastest, minimal changes
  2. Replatform — some optimization (RDS instead of self-managed DB)
  3. Refactor — redesign for cloud native (containers/serverless)
  4. Repurchase — switch to SaaS
  5. Retire — decommission
  6. Retain — keep on-premises (not ready or no benefit)

Recommended approach: Replatform first, then iteratively refactor

Phase 1 — Replatform (2-4 weeks):
  App:
    - Containerize: write Dockerfile for Spring Boot app
    - Build pipeline: GitHub Actions → build Docker image → push to ECR
    - Deploy: ECS Fargate (managed, no EC2 maintenance)
    - ALB: HTTP → HTTPS, health check /actuator/health

  Database:
    - Migrate PostgreSQL to Amazon RDS PostgreSQL
    - Use DMS (Database Migration Service) for live migration with minimal downtime
    - Source: on-prem PostgreSQL, Target: RDS PostgreSQL
    - Enable continuous replication → cut over during maintenance window

  Configuration:
    - Environment variables → ECS Task Definition or SSM Parameter Store
    - Secrets (DB password) → AWS Secrets Manager → injected via ECS secrets

  Networking:
    - VPN/Direct Connect: temporary bridge between on-prem and AWS VPC
    - After cutover: turn off on-prem VPN

Phase 2 — Optimize (1-2 months):
  - Auto Scaling for ECS service (scale tasks by ALB request count)
  - Add ElastiCache for session/frequently-read data
  - CloudFront for static assets
  - CloudWatch alarms + dashboards
  - Set up CI/CD with CodePipeline or GitHub Actions

Phase 3 — Refactor (ongoing):
  - Break monolith into microservices as boundaries become clear
  - Move batch jobs to Lambda (scheduled EventBridge → Lambda)
  - Consider Aurora PostgreSQL for better performance/availability

Validation at each phase:
  - Run both on-prem and AWS in parallel
  - Compare response times, error rates
  - Gradually shift traffic (Route 53 weighted routing: 10% → 50% → 100%)
  - Monitor closely for 1 week before decommissioning on-prem
```

---

## 23. AWS Cost Optimization Strategies

```
1. Right-Sizing:
   AWS Compute Optimizer analyzes EC2, Lambda, ECS usage → recommends right size
   Common finding: instances at < 30% CPU → downsize
   RDS: RDS recommendations in console

2. Purchasing Options:
   Production steady-state EC2/RDS → 1-year Savings Plans (36-40% savings)
   Batch/fault-tolerant → Spot Instances (80-90% savings)
   Dev/Test → turn off outside business hours (savings of 66% with auto-start/stop)

3. Storage:
   S3 Lifecycle → Glacier after 90 days (68% cheaper)
   Delete unused EBS volumes and snapshots
   EBS gp2 → gp3 (20% cheaper, independently tune IOPS)

4. Data Transfer:
   Keep data in same region
   Use CloudFront (reduce origin requests)
   Use VPC Endpoints for S3/DynamoDB (no NAT Gateway charges)
   Review cross-AZ traffic (can add up)

5. Architecture:
   Lambda vs EC2 for low-traffic: Lambda is free up to 1M requests
   CloudFront caching: reduce backend load and data transfer
   Smaller container images = faster starts, less ECR storage

6. Governance:
   AWS Budgets: set alerts at 80%, 100%, 120% of budget
   Cost Allocation Tags: tag by team/environment/project
   Cost Anomaly Detection: alert when spend spikes unexpectedly
   Trusted Advisor: free recommendations (savings, security, fault tolerance)
```

---

## 24. Quick Reference Cheat Sheet

```
EC2 Instance Types:    t3=burst, m5=general, c5=CPU, r5=memory, i3=storage, p3=GPU
EC2 Purchasing:        On-Demand > Reserved (72% off) > Spot (90% off)
S3 Storage Classes:    Standard > IA > One-Zone-IA > Glacier Instant > Flexible > Deep Archive
RDS vs Aurora:         Aurora = MySQL/PG compatible, 5x faster, shared storage, faster failover
Lambda limits:         15 min, 10 GB RAM, 10 GB /tmp, 1000 concurrent (default)
DynamoDB modes:        Provisioned (predictable) vs On-Demand (variable/unknown)
SQS vs SNS:            SQS = queue (one consumer, durable), SNS = pub/sub (fan-out)
SQS vs Kinesis:        SQS = job queue, Kinesis = real-time data stream (replay, ordering)
CloudFront origin:     S3, ALB, EC2, API Gateway, custom HTTP
Route 53 policies:     Simple, Weighted, Latency, Failover, Geolocation, Multi-value
VPC Endpoint types:    Gateway (S3/DynamoDB, free), Interface (PrivateLink, $)
ELB types:             ALB=Layer7/HTTP, NLB=Layer4/TCP, GWLB=Layer3/appliances
IAM policy eval:       Explicit Deny > Allow > Default Deny
KMS:                   CMK=your managed key, AWS managed=free/no control
CloudWatch:            Metrics, Alarms, Logs, Dashboards
CloudTrail:            API audit log (who, what, when, where)
GuardDuty:             Threat detection (CloudTrail + VPC + DNS analysis)
X-Ray:                 Distributed tracing (trace requests across services)
Secrets Manager:       Auto-rotate DB passwords, $0.40/secret/month
Parameter Store:       Config + some secrets, free tier available
WAF:                   Layer 7 firewall (SQL injection, XSS, rate limiting)
Shield Standard:       Free DDoS protection
Shield Advanced:       $3,000/mo, DDoS Response Team, cost protection
Cognito:               User Pools = auth, Identity Pools = AWS credentials

Availability Calculations:
  Single instance:     99.5%
  Multi-AZ (2 AZs):   99.99%
  Multi-Region DR:     99.999%+

S3 Durability:         11 nines (99.999999999%)
RDS Multi-AZ:          99.95% availability SLA
DynamoDB:              99.999% availability

Cost rules of thumb:
  Lambda free tier:    1M requests + 400K GB-seconds/month (forever)
  EC2 savings:         Reserved 1yr = 40%, 3yr = 60%, Spot = 80-90%
  S3 Standard:         ~$0.023/GB/month
  S3 Glacier:          ~$0.004/GB/month (6x cheaper than Standard)
  Data transfer out:   ~$0.09/GB (first 100GB/month free)
```

---

## 25. DEEP DIVE: AWS CDK (Infrastructure as Real Code)

**Theory.** The **AWS Cloud Development Kit (CDK)** lets you define your cloud infrastructure using a *real programming language* — Java, TypeScript, Python, C#, or Go — instead of writing thousands of lines of YAML/JSON. You write code; the CDK **synthesizes** it into a CloudFormation template, and CloudFormation provisions the actual resources. So CDK is not a separate provisioning engine — it's a **higher-level authoring layer on top of CloudFormation**. You get loops, conditionals, functions, classes, IDE autocomplete, type-checking, unit tests, and package reuse — all the things plain templates lack.

**Analogy.** Writing CloudFormation YAML by hand is like writing assembly: powerful but verbose and repetitive. CDK is the high-level language that compiles down to that assembly — you express intent ("a load-balanced Fargate service") and it generates the hundreds of lines of low-level resource definitions for you.

**Why teams adopt CDK:**
- **Less boilerplate** — one high-level construct can expand into 30+ CloudFormation resources with sensible, secure defaults.
- **Abstraction & reuse** — package a "standard microservice" pattern as a class and reuse it across teams (like a library).
- **Type safety & IDE help** — typos and wrong property types are caught at compile time, not at deploy time 10 minutes later.
- **Still CloudFormation underneath** — you keep drift detection, rollback, and change sets; you're not locked into a third-party state file.

---

### 25.1 The Mental Model — App → Stack → Construct

CDK apps are a tree of **constructs**. There are exactly three core concepts:

```
App                     (the root — your whole CDK program)
 └── Stack              (a deployable unit = one CloudFormation stack)
      └── Construct     (a building block: one resource OR a group of resources)
           └── Construct ... (constructs nest to any depth)
```

- **App** — the root of the tree; the entry point of your program. When you call `app.synth()`, the entire tree is converted to CloudFormation templates.
- **Stack** — the unit of deployment. One stack = one CloudFormation stack = created/updated/deleted together. You split infrastructure into multiple stacks (e.g., `NetworkStack`, `DatabaseStack`, `AppStack`) to deploy and manage them independently.
- **Construct** — the fundamental building block. A construct can represent a single resource (an S3 bucket) or a reusable assembly of many resources (a whole web service). Every construct takes `(scope, id, props)` — `scope` is its parent in the tree, `id` is a locally-unique name, `props` are its configuration.

**Why `(scope, id)` matters.** CDK builds resource names by walking the tree path, so the `id` you give must be unique *within its parent*. This path also produces stable **logical IDs** in the generated CloudFormation — renaming a construct's `id` can cause CloudFormation to delete and recreate the resource, so treat ids as semi-permanent.

---

### 25.2 Construct Levels — L1, L2, L3 (a key interview point)

Constructs come in three levels of abstraction. Knowing the difference is a classic CDK interview question.

| Level | Name | What it is | Example |
|-------|------|-----------|---------|
| **L1** | CFN Resources (`Cfn*`) | Raw 1:1 mapping to a CloudFormation resource. Verbose, no defaults. | `CfnBucket` |
| **L2** | Curated constructs | Higher-level, with sensible defaults, helper methods, and security best practices baked in. **The level you use most.** | `Bucket` (with `.grantRead()`, encryption defaults) |
| **L3** | Patterns | Opinionated assemblies of many resources for a complete use case. | `ApplicationLoadBalancedFargateService` (ALB + ECS + Fargate + security groups + IAM, in one object) |

**Example of the abstraction payoff.** An L3 `ApplicationLoadBalancedFargateService` is ~10 lines of code but synthesizes into a VPC wiring, an ECS cluster reference, a task definition, a service, an Application Load Balancer, target groups, listeners, security groups, and IAM roles — easily 300+ lines of CloudFormation. You'd hand-write and debug all of that with raw YAML.

**Pitfall.** Beginners reach for L1 (`Cfn*`) because it looks familiar, then re-implement everything L2 already gives you. Default to **L2**; drop to L1 only for a brand-new AWS feature CDK hasn't wrapped yet.

---

### 25.3 How `cdk synth` and `cdk deploy` Actually Work

**The lifecycle, step by step:**
1. You run `cdk deploy`. CDK executes your program (it's just a Java/TS app).
2. Constructs are instantiated, forming the App→Stack→Construct tree.
3. **Synthesis**: CDK walks the tree and emits a **CloudFormation template** (plus an assembly of assets) into the `cdk.out/` folder. This is what `cdk synth` does on its own — and it's the command to run to *see exactly what will be created*.
4. CDK uploads any **assets** (Docker images, Lambda zip bundles) to a bootstrap S3 bucket / ECR repo.
5. CloudFormation creates a **change set** (the diff between current and desired state) and applies it — creating, updating, or deleting resources, with automatic rollback on failure.

```bash
cdk bootstrap     # ONE-TIME per account/region: creates the S3/ECR/roles CDK needs
cdk init app --language java   # scaffold a new project
cdk synth         # generate the CloudFormation template (inspect before deploying!)
cdk diff          # show what will change vs the deployed stack
cdk deploy        # deploy (creates a change set, applies it)
cdk destroy       # tear the stack down
```

**Why `cdk bootstrap` exists (common gotcha).** Before your first deploy in an account/region, CDK needs a place to store assets and a deployment role. `cdk bootstrap` creates this "CDKToolkit" stack once. Forgetting it gives a confusing "this stack uses assets, so the toolkit stack is required" error.

---

### 25.4 Worked Example — CDK in Java (your stack)

Since you work in Java, here's a realistic stack: an S3 bucket, a DynamoDB table, and a Lambda that reads both — with permissions wired by **`grant`** methods (no hand-written IAM JSON).

```java
import software.amazon.awscdk.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.dynamodb.*;
import software.amazon.awscdk.services.lambda.*;
import software.constructs.Construct;
import java.util.Map;

public class AppStack extends Stack {
    public AppStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // L2 construct: encryption + blocked public access are sensible defaults
        Bucket uploads = Bucket.Builder.create(this, "Uploads")
                .versioned(true)
                .encryption(BucketEncryption.S3_MANAGED)
                .removalPolicy(RemovalPolicy.RETAIN)   // don't delete data on stack delete
                .build();

        Table orders = Table.Builder.create(this, "Orders")
                .partitionKey(Attribute.builder()
                        .name("orderId").type(AttributeType.STRING).build())
                .billingMode(BillingMode.PAY_PER_REQUEST)   // on-demand, no capacity planning
                .build();

        Function handler = Function.Builder.create(this, "OrderProcessor")
                .runtime(Runtime.JAVA_21)
                .handler("com.example.OrderHandler::handleRequest")
                .code(Code.fromAsset("target/order-handler.jar"))  // asset uploaded on deploy
                .memorySize(512)
                .timeout(Duration.seconds(30))
                .environment(Map.of("TABLE_NAME", orders.getTableName()))
                .build();

        // grant* = least-privilege IAM generated for you (no raw policy JSON)
        orders.grantReadWriteData(handler);
        uploads.grantRead(handler);

        // Output a value after deploy (e.g., for other stacks or humans)
        CfnOutput.Builder.create(this, "TableNameOut")
                .value(orders.getTableName()).build();
    }
}
```

```java
// App entry point
public class CdkApp {
    public static void main(final String[] args) {
        App app = new App();
        new AppStack(app, "OrderServiceStack", StackProps.builder()
                .env(Environment.builder().account("111122223333").region("us-east-1").build())
                .build());
        app.synth();
    }
}
```

**The standout feature here is `grant*`.** Instead of hand-writing an IAM policy (and almost always making it too broad), `orders.grantReadWriteData(handler)` generates the *exact* least-privilege policy and attaches it to the Lambda's role. This single feature prevents a huge class of security mistakes.

---

### 25.5 The Same Idea in TypeScript (most common in the CDK community)

```typescript
import { Stack, StackProps, Duration, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const uploads = new s3.Bucket(this, 'Uploads', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const orders = new dynamodb.Table(this, 'Orders', {
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const handler = new lambda.Function(this, 'OrderProcessor', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: { TABLE_NAME: orders.tableName },
    });

    orders.grantReadWriteData(handler);
    uploads.grantRead(handler);
    new CfnOutput(this, 'TableNameOut', { value: orders.tableName });
  }
}
```

Same structure, same `grant*` model — only the syntax differs. This is why CDK skills transfer across languages.

---

### 25.6 Reusable Constructs (the real power)

Beyond stacks, you create your **own** constructs to encode your org's standards once and reuse everywhere — the thing raw CloudFormation can't do well.

```java
// A reusable "standard queue" with a dead-letter queue baked in.
public class StandardQueue extends Construct {
    private final Queue queue;
    public StandardQueue(Construct scope, String id) {
        super(scope, id);
        Queue dlq = Queue.Builder.create(this, "Dlq").build();
        this.queue = Queue.Builder.create(this, "Main")
                .visibilityTimeout(Duration.seconds(30))
                .deadLetterQueue(DeadLetterQueue.builder()
                        .maxReceiveCount(3).queue(dlq).build())   // standard: retry 3x then DLQ
                .build();
    }
    public Queue getQueue() { return queue; }
}
```

Now any team writes `new StandardQueue(this, "Payments")` and automatically gets the DLQ + retry policy your platform team mandates. This is how CDK scales good practices across an organization.

---

### 25.7 Environments, Context & Configuration

- **Environment (`env`)** — the target account + region for a stack. Specify it explicitly for production code so synthesis is deterministic (region-specific resources like AMIs resolve correctly).
- **Context** — key/value configuration passed via `cdk.json` or `-c key=value`, used to vary behavior per environment (`dev` vs `prod`) without changing code.
- **Multi-environment pattern** — instantiate the same stack class multiple times with different props:

```java
new AppStack(app, "AppStack-Dev",  devProps);
new AppStack(app, "AppStack-Prod", prodProps);   // same code, different config
```

This "same code, different config" pattern is exactly what's painful in copy-pasted YAML and trivial in CDK.

---

### 25.8 Testing Infrastructure (a big differentiator)

Because CDK is real code, you can **unit-test your infrastructure** before deploying — assert the synthesized template contains what you expect.

```java
// Using the assertions module: synth the stack, then assert on the template
Template template = Template.fromStack(new AppStack(app, "Test"));
template.hasResourceProperties("AWS::DynamoDB::Table", Map.of(
    "BillingMode", "PAY_PER_REQUEST"));          // fail the build if someone changes it
template.resourceCountIs("AWS::S3::Bucket", 1);
```

**Interview angle.** "How do you test infrastructure?" — CDK supports **fine-grained assertions** (assert specific resources/properties exist in the synthesized template) and **snapshot tests** (fail if the template changes unexpectedly). This catches misconfigurations in CI before they ever reach AWS.

---

### 25.9 CDK in CI/CD

Two common approaches:
- **`cdk deploy` from a pipeline** — simplest; the CI job runs `cdk deploy` with deploy credentials.
- **CDK Pipelines** — a self-mutating pipeline construct: you define the pipeline *in CDK*, and it can update itself when you add stages. Powerful for multi-account/multi-stage rollouts.

A typical flow: PR → `cdk synth` + unit tests + `cdk diff` (posted to the PR for review) → on merge, `cdk deploy` to staging → manual approval → `cdk deploy` to prod. Store credentials in your CI secret store, never in code.

---

### 25.10 CDK vs CloudFormation vs Terraform

| | CloudFormation | CDK | Terraform |
|---|---|---|---|
| Authoring | YAML/JSON | Real code (Java/TS/Python…) | HCL (its own language) |
| Engine | CloudFormation | CloudFormation (synthesizes to it) | Terraform engine + state file |
| Cloud scope | AWS only | AWS only | Multi-cloud |
| Abstraction/reuse | Limited (nested stacks) | High (constructs, classes) | Modules |
| State management | Managed by AWS | Managed by AWS (via CFN) | You manage `tfstate` |

**One-liner:** "CDK gives you a real programming language and high-level constructs while keeping CloudFormation's managed state and rollback; Terraform is the choice when you need multi-cloud and are willing to manage your own state."

---

### 25.11 Best Practices & Common Pitfalls

**Best practices:**
- Default to **L2** constructs; build **L3/custom constructs** to encode standards.
- Use **`grant*` methods** for IAM — never hand-write broad policies.
- Split into **multiple stacks** by lifecycle (network/data/app) and pass references between them.
- Always run **`cdk diff`** before deploy and review it like a code change.
- **Unit-test** templates; pin the CDK library version.

**Common pitfalls:**
- **Forgetting `cdk bootstrap`** → asset deploys fail mysteriously.
- **Renaming construct `id`s** → changes logical IDs → CloudFormation replaces (and can delete) resources. Be deliberate.
- **Hardcoding account/region** instead of using `env`/context → breaks across environments.
- **Putting secrets in code/context** → use Secrets Manager / SSM Parameter Store and reference them.
- **One giant stack** for everything → slow deploys and a blast radius covering unrelated resources.

---

### 25.12 CDK Interview Q&A

**Q1. What is AWS CDK and how does it relate to CloudFormation?**
CDK is a framework to define infrastructure in a real programming language; it **synthesizes to CloudFormation**, which does the actual provisioning. You get code-level abstraction and tooling while keeping CloudFormation's managed state, change sets, and rollback.

**Q2. Explain L1, L2, L3 constructs.**
L1 (`Cfn*`) are raw 1:1 CloudFormation mappings; L2 are curated constructs with sensible defaults and helper methods (the everyday choice); L3 are opinionated patterns assembling many resources for a complete use case (e.g., a load-balanced Fargate service).

**Q3. What does `cdk synth` do vs `cdk deploy`?**
`synth` runs your program and emits the CloudFormation template + assets into `cdk.out/` (inspect-only). `deploy` synthesizes, uploads assets, creates a change set, and applies it via CloudFormation.

**Q4. Why is `cdk bootstrap` needed?**
It provisions the one-time "toolkit" resources (S3 bucket for assets, ECR repo, deploy roles) per account/region that CDK relies on for asset-based deploys.

**Q5. How does CDK handle IAM permissions?**
Through `grant*` methods (`grantRead`, `grantReadWriteData`) that generate **least-privilege** policies and attach them automatically — safer than hand-written JSON.

**Q6. How do you test CDK infrastructure?**
With the assertions module: synthesize the stack and assert specific resources/properties exist (fine-grained assertions) or use snapshot tests to detect unintended template changes — all in CI before deploy.

**Q7. How do you manage multiple environments (dev/prod)?**
Instantiate the same stack class with different props/context and explicit `env` (account+region) — "same code, different configuration" — rather than duplicating templates.

**Q8. What's a risk of renaming a construct's id?**
It changes the resource's CloudFormation logical ID, which can cause CloudFormation to delete and recreate the resource (data loss for stateful resources). Treat ids as stable.
