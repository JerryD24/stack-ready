/**
 * Interview Prep Hub — Topic catalog
 * Maps markdown files to tracks, metadata, and UI labels
 */
const INTERVIEW_TRACKS = [
  {
    id: 'java-stack',
    title: 'Java & Spring',
    subtitle: 'Core Java → Spring Boot → CP Tricks',
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
        sections: 22,
        level: 'Beginner → Pro',
        priority: 'high',
        tags: ['AI', 'MCP', 'Agents', 'RAG']
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
    id: 'study-plan',
    file: '00_Study_Plan_Day_by_Day.txt',
    title: '12-Week Study Plan',
    description: '84-day day-by-day schedule for Java, Spring, Python, DSA, AWS',
    icon: '📅',
    type: 'plan'
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
