export type ProjectStatus = "flagship" | "core" | "active" | "research" | "experimental" | "in_study";

export type Project = {
  slug: string;
  href: string;
  name: string;
  tag: string;
  status: ProjectStatus;
  statusLabel: string;
  summary: string;
  chips: string[];
  image?: string;
  github?: string;
};

export const flagshipProjects: Project[] = [
  {
    slug: "orchestrai",
    href: "/orchestrai",
    name: "OrchestrAI Nexus",
    tag: "Multi-Agent · Orchestration",
    status: "flagship",
    statusLabel: "Flagship",
    summary:
      "FastAPI WebSocket backbone, real-time STT→LLM→TTS voice loop, NVIDIA NIM coding agent (Planner→Coder→Executor→Debugger ReAct loop), LangGraph-style orchestration graphs, and Letta-inspired GraphRAG memory. Phase 7: AI economics + inter-AI marketplace.",
    chips: ["Python", "FastAPI", "LangGraph", "NVIDIA NIM", "GraphRAG", "ElevenLabs"],
    image: "/assets/orchestrai_hero.png",
    github: "https://github.com/Joker5514/orchestrai-nexus",
  },
  {
    slug: "aibridge",
    href: "/aibridge",
    name: "AI Bridge",
    tag: "Multi-Provider · Orchestration",
    status: "core",
    statusLabel: "Core build",
    summary:
      "Production-ready platform that chains Perplexity, Claude, OpenAI, Grok, Groq, and Abacus into sequential or parallel workflows. LangChain unified wrapper, AES-256 Fernet key encryption, async SQLAlchemy conversation persistence, and real-time per-model cost tracking.",
    chips: ["Python", "FastAPI", "React", "LangChain", "SQLAlchemy", "AES-256"],
    image: "/assets/ai_bridge_overview.png",
    github: "https://github.com/Joker5514/ai-bridge-v2",
  },
  {
    slug: "voiceisolate",
    href: "/voiceisolate",
    name: "VoiceIsolate Pro",
    tag: "Audio AI · Voice UX",
    status: "research",
    statusLabel: "Research",
    summary:
      "Best-in-class voice isolation and audio enhancement. Multi-threaded DSP, GPU-accelerated, ML-powered. Real-time processing for creators and engineers in noisy environments.",
    chips: ["JavaScript", "Audio DSP", "ML inference", "GPU"],
    image: "/assets/voiceisolate_hero.png",
    github: "https://github.com/Joker5514/VoiceIsolate-Pro",
  },
  {
    slug: "aicounselor",
    href: "/aicounselor",
    name: "AI Counselor",
    tag: "Multimodal · Voice UX",
    status: "active",
    statusLabel: "Active",
    summary:
      "Multimodal AI counselor dashboard with chat, visual avatar, and credit-monitoring. Emotion-aware, real-time advisory system with state-saving capabilities.",
    chips: ["TypeScript", "Multimodal", "Credit monitoring"],
    image: "/assets/ai_counselor_dashboard.png",
  },
];

export const inStudyProjects: Project[] = [
  {
    slug: "music-studio",
    href: "https://github.com/Joker5514/OrchestrAI-Music-Studio-",
    name: "OrchestrAI Music Studio",
    tag: "Creative AI · Audio",
    status: "in_study",
    statusLabel: "In study",
    summary:
      "Multi-agent AI DAW builder using OrchestrAI Nexus. Orchestrated development across Claude Opus, Gemini, DeepSeek, and GPT for autonomous composition, mixing, and production.",
    chips: ["Python", "Multi-LLM", "DAW automation"],
    github: "https://github.com/Joker5514/OrchestrAI-Music-Studio-",
  },
  {
    slug: "voice-surveys",
    href: "/projects",
    name: "Voice Micro-Surveys",
    tag: "Voice UX · Data",
    status: "experimental",
    statusLabel: "Experimental",
    summary:
      "High-signal feedback through short spoken interactions. Hypothesis: voice-first input removes enough friction to meaningfully increase completion rates over forms.",
    chips: ["Web Audio", "LLM transcription", "Serverless"],
  },
  {
    slug: "lovemenot",
    href: "/lovemenot",
    name: "Love-Me-Not",
    tag: "Forensic Psychology · Mobile",
    status: "experimental",
    statusLabel: "Experimental",
    summary:
      "Forensic psychology mobile app. AI-powered relationship analysis and manipulation detection across text, images, video, and audio for Dark Triad traits and gaslighting patterns.",
    chips: ["HTML", "Mobile", "Multimodal"],
  },
];

export type RepoEntry = {
  name: string;
  href?: string;
  lang: string;
  body: string;
};

export type RepoCategory = {
  title: string;
  dotClass: string;
  entries: RepoEntry[];
};

export const repoCategories: RepoCategory[] = [
  {
    title: "Agent Orchestration",
    dotClass: "bg-[#ff3355] shadow-[0_0_0_4px_rgba(255,51,85,0.15)]",
    entries: [
      { name: "orchestrai-nexus", href: "https://github.com/Joker5514/orchestrai-nexus", lang: "Python", body: "Advanced AI orchestration framework — multi-agent collaboration, quantum-inspired routing, ethical governance." },
      { name: "ai-bridge-v2", href: "https://github.com/Joker5514/ai-bridge-v2", lang: "Python / React", body: "Multi-provider orchestration platform — LangChain wrapper for Perplexity, Claude, OpenAI, Grok, Groq, Abacus. AES-256 key vault, async SQLAlchemy persistence, real-time cost tracking." },
      { name: "orchestrai-nexus-auto", lang: "Private", body: "OrchestrAI Nexus with automatic approval workflows for multi-AI orchestration pipelines." },
      { name: "orchestrai-github-pr-agent", lang: "Python", body: "Multi-agent swarm intelligence for automated GitHub PR review with creator authority integration." },
      { name: "unified-ai-orchestration-system", lang: "Python", body: "Multi-platform AI orchestration integrating Claude, Gemini, Grok with intelligent routing and threads." },
      { name: "orchestrai-personal-assistant", lang: "Python", body: "Personal AI assistant that learns from conversation patterns with autonomous daily development." },
    ],
  },
  {
    title: "Autonomous Systems & Workflows",
    dotClass: "bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.15)]",
    entries: [
      { name: "autonomous-ai-system", lang: "Python", body: "Autonomous AI development with automated research integration, MoE+MLA architecture, and daily CI/CD." },
      { name: "autonomous-ai-workflows", lang: "Private", body: "Central hub for autonomous AI-powered GitHub workflows scanning repos and creating improvement PRs." },
      { name: "autonomous-github-workflows", lang: "Python", body: "Autonomous system that identifies improvements and distributes updates across all AI projects." },
      { name: "autonomous-ai-genesis", lang: "Private", body: "State-of-the-art autonomous AI combining 200B parameter MoE model with LangGraph agents." },
      { name: "workflow-failure-copilot", href: "https://github.com/Joker5514/workflow-failure-copilot", lang: "Python", body: "Monitors all GitHub repos for workflow failures, analyzes errors, and automatically debugs and retries." },
      { name: "github-autofix-system", lang: "Private", body: "Universal GitHub repo autofix — retries failed CI/CD pipelines, fixes linting errors, and auto-merges PRs." },
      { name: "ai-innovation-hub", lang: "Python", body: "Central AI research distribution — discovers, implements, and distributes cutting-edge breakthroughs daily." },
      { name: "ai-assistant-dev", lang: "Python", body: "Automated AI assistant development pipeline — 95% automated with daily progress tracking." },
    ],
  },
  {
    title: "Personal AI & Memory Systems",
    dotClass: "bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]",
    entries: [
      { name: "randy-deep-ai-agent", lang: "Private", body: "Deep AI agent built from Randy's conversation patterns, spaces, and expertise — personalized multi-agent assistant." },
      { name: "vito-ai-assistant", lang: "Python", body: "VITO (Virtual Intelligent Task Orchestrator) — long-term memory, daily automation, and adaptive learning." },
      { name: "enhanced-randy-ai-assistant", lang: "Python", body: "Advanced AI assistant with memory systems, specialized modules, and multi-platform configuration." },
      { name: "RandyAI-PersonalAssistant", lang: "Python", body: "Complete personal AI assistant — autonomous, learning, multi-platform integration." },
      { name: "randy-ai-assistant", lang: "Dockerfile", body: "Containerized personalized AI with conversation memory, multi-agent coordination, and rideshare optimization." },
      { name: "orchestrai-personal", lang: "Python", body: "Personal AI orchestration learning from all conversation patterns across Perplexity, Claude, Gemini, and Grok." },
      { name: "nexus-ai-personal", href: "https://github.com/Joker5514/nexus-ai-personal", lang: "Public", body: "Public personal AI orchestration with multi-platform memory and adaptive learning across platforms." },
      { name: "randy-ai-genesis", lang: "Python", body: "Unified AI assistant learning from all of Randy's conversations, spaces, threads, and tones." },
      { name: "randy-beefed-ai-genesis", lang: "Python", body: "Comprehensive 30-Day Framework for ultimate AI assistant, scaffolding architecture from scratch." },
      { name: "Randy-Beefed-AI-Assistant", lang: "Private", body: "Advanced multi-agent AI assistant with persistent memory, voice processing, and cross-platform integration." },
      { name: "unified-ai-assistant-hub", lang: "Private", body: "Unified hub integrating Claude, Grok, Gemini, Jules, Comet, and Abacus AI with threads and GitHub automation." },
      { name: "ai-tech-innovations-2025", lang: "Python", body: "Research tracking and implementation of key AI technical innovations from 2025 and beyond." },
    ],
  },
  {
    title: "Voice, Audio & Interfaces",
    dotClass: "bg-sky-400 shadow-[0_0_0_4px_rgba(56,189,248,0.15)]",
    entries: [
      { name: "VoiceIsolate-Pro", href: "https://github.com/Joker5514/VoiceIsolate-Pro", lang: "JavaScript", body: "Best-in-class voice isolation & audio enhancement — Threads from Space Architecture, GPU-accelerated, ML-powered." },
      { name: "vito", lang: "TypeScript", body: "VITO voice interface — conversational AI with ambient UX and multi-turn state management." },
      { name: "Vito-website-terminal-", lang: "Private", body: "Ready-to-deploy terminal-style website for the VITO voice interface product." },
      { name: "perplexity-comet-automation", lang: "Python", body: "AI-powered browser automation extension for Perplexity and Comet with native host integration." },
    ],
  },
  {
    title: "Apps, Products & Platforms",
    dotClass: "bg-fuchsia-400 shadow-[0_0_0_4px_rgba(232,121,249,0.15)]",
    entries: [
      { name: "ai-counselor-dashboard", lang: "TypeScript", body: "Multimodal AI counselor — chat interface, visual avatar, credit monitoring, and state-saving system." },
      { name: "OrchestrAI-Music-Studio", href: "https://github.com/Joker5514/OrchestrAI-Music-Studio-", lang: "Python", body: "Multi-agent AI DAW builder — orchestrated development across Claude, Gemini, DeepSeek, GPT." },
      { name: "Love-Me-Not", href: "/lovemenot", lang: "HTML", body: "Forensic psychology mobile app — AI-powered relationship analysis & manipulation detection. Dark Triad traits and gaslighting." },
      { name: "detective-app / detective", lang: "Python", body: "DetectiveIQ — analyst training platform covering microexpressions, body language, OSINT, and reasoning lab." },
      { name: "forensic-detective-web", lang: "TypeScript", body: "Web frontend for the forensic detective platform — OSINT training, audio whisper analysis, and case reasoning." },
      { name: "stake-affiliate-vito", lang: "TypeScript", body: "Stake.us affiliate marketing site with AI-powered Uncle Vito character assistant, voice synthesis, and game previews." },
      { name: "choices", lang: "Private", body: "Choice Weigher — local browser decision tool for structured personal and professional decision-making." },
      { name: "vibe", lang: "TypeScript", body: "Vibe — experimental social/gaming platform with AI-driven content and engagement mechanics." },
    ],
  },
  {
    title: "Infrastructure, DevOps & Tools",
    dotClass: "bg-white/60 shadow-[0_0_0_4px_rgba(255,255,255,0.06)]",
    entries: [
      { name: "conqueror-studios-web", href: "https://github.com/Joker5514/conqueror-studios-web", lang: "TypeScript", body: "This site — official Conqueror Studios control plane. Git-native, multi-tenant, built in the open." },
      { name: "desk-commander", lang: "TypeScript", body: "Device automation system — cross-platform command and control for desktop environments." },
      { name: "api-keys-backend", lang: "JavaScript", body: "Secure API keys backend for Play Store app deployment and runtime credential management." },
      { name: "red-nexus-forge", lang: "Private", body: "Red Nexus Forge — internal tooling and scaffolding infrastructure for Conqueror Studios projects." },
      { name: "pr-agent-settings", lang: "Private", body: "Centralized configuration for the PR review agent across all repositories in the lab." },
    ],
  },
];
