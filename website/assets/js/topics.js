/**
 * Interview Prep Hub — Topic catalog
 * Maps markdown files to tracks, metadata, and UI labels
 */
const INTERVIEW_TRACKS = [
  {
    id: 'java-core',
    title: 'Java',
    subtitle: 'Core → Concurrency → Streams → CP',
    icon: '☕',
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)',
    topics: [
      {
        id: 'java',
        file: '01_Java_Core_to_Advanced.md',
        title: 'Java Core to Advanced',
        description: 'OOP, Collections, Java 8–21, Concurrency, JVM, Design Patterns, HashMap deep dive, tough Q&A',
        sections: 22,
        level: 'Beginner → Advanced',
        priority: 'critical',
        tags: ['Java', 'JVM', 'Multithreading', 'Collections']
      },
      {
        id: 'java-multithreading',
        file: '16_Java_Multithreading_Deep_Dive.md',
        title: 'Java Multithreading Deep Dive',
        description: 'Threads, thread pools, ExecutorService, CompletableFuture, locks/atomics, virtual threads, deadlocks, real-world production patterns',
        sections: 18,
        level: 'Beginner → Expert',
        priority: 'critical',
        tags: ['Multithreading', 'Concurrency', 'Thread Pool', 'Java']
      },
      {
        id: 'java-streams',
        file: '17_Java_Streams_Deep_Dive.md',
        title: 'Java Streams Deep Dive',
        description: 'Stream pipeline, intermediate/terminal ops, Collectors, flatMap, primitive streams, Optional, parallel streams, real-world examples',
        sections: 13,
        level: 'Beginner → Expert',
        priority: 'critical',
        tags: ['Streams', 'Functional', 'Collectors', 'Java']
      },
      {
        id: 'java-jvm-perf',
        file: '24_JVM_Performance_Advanced_Concurrency.md',
        title: 'JVM Performance & Advanced Concurrency',
        description: 'GC tuning (G1 vs ZGC), GC logs, heap/thread dumps, jstack/jmap/Arthas, leak hunting, ThreadPoolExecutor tuning, CompletableFuture, virtual threads, lock-free/CAS',
        sections: 15,
        level: 'Advanced → Expert',
        priority: 'critical',
        tags: ['JVM', 'GC', 'Performance', 'Concurrency']
      },
      {
        id: 'java-cp',
        file: '06_CP_Tricks.md',
        title: 'Java CP Tricks',
        description: 'Bit manipulation, math shortcuts, template code, competitive programming patterns',
        sections: 8,
        level: 'Intermediate',
        priority: 'high',
        tags: ['CP', 'Algorithms', 'Java']
      }
    ]
  },
  {
    id: 'cloud-native-distributed',
    title: 'Cloud-Native & Distributed Systems',
    subtitle: 'Kafka · Kubernetes · Resilience · Observability · Redis · SQL',
    icon: '🌐',
    color: '#0d9488',
    gradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #5eead4 100%)',
    topics: [
      {
        id: 'kafka',
        file: '20_Kafka_Deep_Dive.md',
        title: 'Apache Kafka Deep Dive',
        description: 'Partitions & consumer groups, rebalancing, retry topics + DLQ, exactly-once/idempotence, ordering, outbox pattern, backpressure, lag monitoring, 50k events/sec design',
        sections: 16,
        level: 'Intermediate → Expert',
        priority: 'critical',
        tags: ['Kafka', 'Event Streaming', 'Messaging', 'Distributed']
      },
      {
        id: 'kubernetes',
        file: '21_Kubernetes_Docker_CloudNative.md',
        title: 'Kubernetes, Docker & Cloud-Native',
        description: 'Dockerfiles, pods/deployments/services, ConfigMaps/Secrets, probes, resource limits, HPA, rolling deploy/rollback, AWS (EKS/ECS/S3/RDS/SQS), CI/CD, pod troubleshooting',
        sections: 16,
        level: 'Intermediate → Expert',
        priority: 'critical',
        tags: ['Kubernetes', 'Docker', 'AWS', 'DevOps']
      },
      {
        id: 'resilience',
        file: '22_Resilience_Distributed_Patterns.md',
        title: 'Resilience & Distributed Patterns',
        description: 'Timeouts, retries/backoff, circuit breaker, bulkhead, rate limiting, Resilience4j, idempotency keys, distributed locks, Saga, Snowflake IDs, CAP/consistency',
        sections: 14,
        level: 'Intermediate → Expert',
        priority: 'critical',
        tags: ['Resilience4j', 'Saga', 'Distributed', 'Patterns']
      },
      {
        id: 'observability',
        file: '23_Observability_Production_Debugging.md',
        title: 'Observability & Production Debugging',
        description: 'Metrics (Prometheus/Grafana), structured logs (ELK/Loki), distributed tracing (OpenTelemetry/Jaeger), correlation IDs, RED/USE, SLO/error budgets, "service is slow" debugging',
        sections: 14,
        level: 'Intermediate → Expert',
        priority: 'critical',
        tags: ['Observability', 'Prometheus', 'Tracing', 'Debugging']
      },
      {
        id: 'redis',
        file: '25_Redis_Caching_Strategy.md',
        title: 'Redis & Caching Strategy',
        description: 'Data structures, cache-aside vs write-through, eviction, TTL design, cache stampede/hot keys, penetration/avalanche, cache consistency, distributed lock & rate limiter, HA/cluster',
        sections: 15,
        level: 'Intermediate → Expert',
        priority: 'high',
        tags: ['Redis', 'Caching', 'Performance', 'Distributed']
      },
      {
        id: 'sql-scale',
        file: '26_SQL_at_Scale.md',
        title: 'SQL at Scale',
        description: 'Indexing, EXPLAIN plans, N+1 fixes, query optimization, isolation levels, optimistic/pessimistic locking, HikariCP, read replicas, partitioning, sharding, zero-downtime migrations',
        sections: 14,
        level: 'Intermediate → Expert',
        priority: 'critical',
        tags: ['SQL', 'Database', 'Indexing', 'Sharding']
      }
    ]
  },
  {
    id: 'spring-stack',
    title: 'Spring Boot',
    subtitle: 'IoC/DI → REST → JPA → Security → Microservices',
    icon: '🍃',
    color: '#16a34a',
    gradient: 'linear-gradient(135deg, #15803d 0%, #22c55e 50%, #4ade80 100%)',
    topics: [
      {
        id: 'spring',
        file: '02_SpringBoot.md',
        title: 'Spring Boot',
        description: 'IoC/DI, REST, JPA/Hibernate, Security, JWT, Microservices, Spring Cloud, deep Q&A',
        sections: 15,
        level: 'Intermediate → Advanced',
        priority: 'critical',
        tags: ['Spring', 'JPA', 'Security', 'Microservices']
      },
      {
        id: 'java-annotations',
        file: '18_Annotations_Deep_Dive.md',
        title: 'Java & Spring Annotations Deep Dive',
        description: 'Java annotations, meta-annotations, custom annotations, reflection, Spring/Spring Boot/JPA/validation/testing annotations',
        sections: 14,
        level: 'Beginner → Expert',
        priority: 'high',
        tags: ['Annotations', 'Spring Boot', 'JPA', 'Java']
      }
    ]
  },
  {
    id: 'system-design',
    title: 'System Design',
    subtitle: 'HLD + LLD + Real-world scenarios',
    icon: '🏗️',
    color: '#0891b2',
    gradient: 'linear-gradient(135deg, #0e7490 0%, #06b6d4 50%, #22d3ee 100%)',
    topics: [
      {
        id: 'hld',
        file: '03_System_Design_HLD.md',
        title: 'High Level Design',
        description: 'Scalability, caching, Kafka, CAP, rate limiting, URL shortener, auth, Redis KV store',
        sections: 14,
        level: 'Intermediate → Advanced',
        priority: 'critical',
        tags: ['HLD', 'Scalability', 'Kafka', 'Redis']
      },
      {
        id: 'lld',
        file: '04_System_Design_LLD.md',
        title: 'Low Level Design',
        description: 'SOLID, design patterns, parking lot, e-commerce, order management, Spring Events',
        sections: 8,
        level: 'Intermediate → Advanced',
        priority: 'critical',
        tags: ['LLD', 'OOP', 'Design Patterns']
      },
      {
        id: 'py-hld',
        file: '10_Python_System_Design_HLD.md',
        title: 'Python HLD',
        description: 'System design concepts with Python ecosystem perspective',
        sections: 10,
        level: 'Intermediate',
        priority: 'medium',
        tags: ['Python', 'HLD']
      },
      {
        id: 'py-lld',
        file: '11_Python_System_Design_LLD.md',
        title: 'Python LLD',
        description: 'Low-level design problems in Python style',
        sections: 8,
        level: 'Intermediate',
        priority: 'medium',
        tags: ['Python', 'LLD']
      },
      {
        id: 'sd-notes',
        file: 'System_Design_Notes.md',
        title: 'System Design Notes',
        description: 'Quick reference notes and interview tips',
        sections: 5,
        level: 'All levels',
        priority: 'medium',
        tags: ['Notes', 'Quick Ref']
      }
    ]
  },
  {
    id: 'dsa',
    title: 'DSA & Algorithms',
    subtitle: 'Data structures, patterns, problem solving',
    icon: '🧮',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #a78bfa 100%)',
    topics: [
      {
        id: 'dsa',
        file: '05_DSA.md',
        title: 'Data Structures & Algorithms',
        description: 'Arrays, trees, graphs, DP, greedy, sliding window, interview problems with solutions',
        sections: 12,
        level: 'Beginner → Advanced',
        priority: 'critical',
        tags: ['DSA', 'DP', 'Graphs', 'Trees']
      },
      {
        id: 'py-cp',
        file: '12_Python_CP_Tricks.md',
        title: 'Python CP Tricks',
        description: 'Python competitive programming shortcuts and idioms',
        sections: 6,
        level: 'Intermediate',
        priority: 'high',
        tags: ['Python', 'CP']
      }
    ]
  },
  {
    id: 'python-stack',
    title: 'Python Stack',
    subtitle: 'Core Python → FastAPI → Falcon',
    icon: '🐍',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #047857 0%, #10b981 50%, #34d399 100%)',
    topics: [
      {
        id: 'python',
        file: '07_Python_Core_to_Advanced.md',
        title: 'Python Core to Advanced',
        description: 'Python fundamentals, OOP, decorators, generators, async, advanced concepts',
        sections: 14,
        level: 'Beginner → Advanced',
        priority: 'high',
        tags: ['Python', 'OOP', 'Async']
      },
      {
        id: 'fastapi',
        file: '08_FastAPI_and_Falcon.md',
        title: 'FastAPI & Falcon',
        description: 'REST APIs, dependency injection, middleware, Falcon comparison',
        sections: 10,
        level: 'Intermediate',
        priority: 'high',
        tags: ['FastAPI', 'REST', 'API']
      }
    ]
  },
  {
    id: 'cloud-tools',
    title: 'Cloud & Languages',
    subtitle: 'AWS, Go, and platform knowledge',
    icon: '☁️',
    color: '#ea580c',
    gradient: 'linear-gradient(135deg, #c2410c 0%, #f97316 50%, #fb923c 100%)',
    topics: [
      {
        id: 'aws',
        file: '13_AWS_Complete_Guide.md',
        title: 'AWS Complete Guide',
        description: 'EC2, S3, Lambda, RDS, IAM, VPC, CloudWatch, architecture patterns',
        sections: 12,
        level: 'Beginner → Advanced',
        priority: 'high',
        tags: ['AWS', 'Cloud', 'DevOps']
      },
      {
        id: 'golang',
        file: '09_GoLang.md',
        title: 'Go Language',
        description: 'Go syntax, goroutines, channels, interfaces, concurrency patterns',
        sections: 10,
        level: 'Beginner → Intermediate',
        priority: 'medium',
        tags: ['Go', 'Concurrency']
      }
    ]
  },
  {
    id: 'frontend',
    title: 'Frontend — React',
    subtitle: 'React.js beginner → pro interview guide',
    icon: '⚛️',
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 50%, #38bdf8 100%)',
    topics: [
      {
        id: 'react',
        file: '15_React_JS_Complete_Guide.md',
        title: 'React.js Complete Guide',
        description: 'JSX, Hooks, Router v6, Redux/Zustand, performance, TypeScript, testing, React 18/19, coding problems, Q&A',
        sections: 22,
        level: 'Beginner → Pro',
        priority: 'critical',
        tags: ['React', 'Hooks', 'Redux', 'Frontend']
      }
    ]
  },
  {
    id: 'nodejs',
    title: 'Backend — Node.js',
    subtitle: 'Event loop → Express → APIs → production',
    icon: '🟢',
    color: '#65a30d',
    gradient: 'linear-gradient(135deg, #3f6212 0%, #65a30d 50%, #a3e635 100%)',
    topics: [
      {
        id: 'node',
        file: '19_Node_JS_Complete_Guide.md',
        title: 'Node.js Complete Guide',
        description: 'Event loop, modules, async/await, streams, Express, REST APIs, databases, auth/security, clustering, worker threads, testing, TypeScript, coding problems, Q&A',
        sections: 19,
        level: 'Beginner → Pro',
        priority: 'critical',
        tags: ['Node.js', 'Express', 'Backend', 'JavaScript']
      }
    ]
  },
  {
    id: 'ai-mcp',
    title: 'AI & MCP',
    subtitle: 'Agents, MCP servers, RAG, production AI',
    icon: '🤖',
    color: '#db2777',
    gradient: 'linear-gradient(135deg, #be185d 0%, #ec4899 50%, #f472b6 100%)',
    topics: [
      {
        id: 'ai-agents',
        file: '14_AI_Agents_and_MCP_For_Developers.md',
        title: 'AI Agents & MCP',
        description: 'Prompt engineering, context engineering, building agents & MCP servers, RAG, evals, roadmap',
        sections: 23,
        level: 'Beginner → Pro',
        priority: 'high',
        tags: ['AI', 'MCP', 'Agents', 'RAG', 'Agentic AI']
      }
    ]
  }
];

const UTILITY_DOCS = [
  {
    id: 'roadmap',
    file: '00_Topic_List.md',
    title: 'Complete Roadmap',
    description: 'Master checklist — all topics with progress tracking',
    icon: '🗺️',
    type: 'checklist'
  },
  {
    id: 'peer-review',
    file: 'Complete_PeerReview_Report.md',
    title: 'Peer Review Report',
    description: 'Code review patterns and best practices reference',
    icon: '📋',
    type: 'reference'
  }
];

/** Flat list of all topics for search */
function getAllTopics() {
  const items = [];
  INTERVIEW_TRACKS.forEach(track => {
    track.topics.forEach(topic => {
      items.push({ ...topic, trackId: track.id, trackTitle: track.title, trackColor: track.color });
    });
  });
  UTILITY_DOCS.forEach(doc => {
    items.push({
      id: doc.id,
      file: doc.file,
      title: doc.title,
      description: doc.description,
      trackId: 'utility',
      trackTitle: 'Planning',
      trackColor: '#1e40af',
      isUtility: true
    });
  });
  return items;
}

if (typeof module !== 'undefined') module.exports = { INTERVIEW_TRACKS, UTILITY_DOCS, getAllTopics };
