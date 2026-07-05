/**
 * The single hand-edited data file (Reference §9).
 * Everything else is derived from verified sources or hides.
 */
export const site = {
  name: "Hemanth A R",
  claim: "Software Engineer — AI × Security × Full Stack",
  availability: true, // drives the status dot + verdict line
  currentProject: "AI Personal OS · Milestone 2 ✓",
  learningNow: ["GraphRAG", "Kùzu"],
  github: "https://github.com/Hemanth19i",
  linkedin: "https://www.linkedin.com/in/hemanth-a-r-18i",
  email: "hemanthha18@gmail.com",
  releases: [
    { v: "1.1", name: "ASK", state: "planned" },
    { v: "1.2", name: "THE LAB", state: "planned" },
    { v: "2.0", name: "AI SANDBOX", state: "exploring" },
  ],
} as const;

export const projects = [
  {
    slug: "securerag",
    name: "SecureRAG",
    claim:
      "AI-powered cyber threat investigation platform. Hybrid retrieval (BM25 + RRF + cross-encoder reranking), MITRE ATT&CK mapping, immutable audit trail, RBAC. Built with a labeled eval corpus and CI on every PR.",
    stack: "Flask · React/TS · ChromaDB · SQLite",
    href: "https://github.com/Hemanth19i/SecureRAG",
    status: "v1.0 · shipped",
  },
  {
    slug: "ai-personal-os",
    name: "AI Personal OS",
    claim:
      "Offline-first local AI knowledge platform. Watched-folder ingestion, SHA-256 dedupe, OCR fallback, local embeddings via Ollama, LanceDB vectors. Contract-driven build: PRD, 14 ADRs, tests with fakes.",
    stack: "Python · Ollama · LanceDB · SQLite",
    href: "https://github.com/Hemanth19i/AI-Personal-OS",
    status: "in development · M2 ✓",
  },
  {
    slug: "ev-service",
    name: "EV Service Management",
    claim:
      "Full-stack service platform for electric vehicles. JWT auth with bcrypt, customer/admin roles enforced server-side, booking lifecycle from pending to completed.",
    stack: "React 19 · Express 5 · MongoDB",
    href: "https://github.com/Hemanth19i/EV-Service-Management-System",
    status: "shipped",
  },
] as const;
