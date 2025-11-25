# Agentic NBA Platform - AI Prescription Intelligence Platform

## Overview

Agentic NBA Platform is an AI-powered prescription intelligence platform for pharmaceutical sales representatives, focused on detecting prescription switching patterns in oncology Healthcare Providers (HCPs) and delivering contextual Next Best Actions (NBAs). The platform uses Azure OpenAI to analyze HCP behavior, predict switching risks, and generate intelligent action recommendations through autonomous agent orchestration with Neo4j Aura knowledge graph support.

The core value proposition is helping field representatives identify when HCPs are switching from the company's products to competitors, understand why this is happening, and receive AI-generated strategic recommendations to prevent or reverse these switches. The platform uses a comprehensive Neo4j knowledge graph to enable multi-hop reasoning across clinical events, market access barriers, HCP networks, and competitive intelligence.

## Design Philosophy

Apple-inspired minimalism: greyscale palette with generous whitespace, clean typography (system-ui), uncluttered layouts focused on content over decoration. Single blue accent color for primary actions. No colorful gradients or excessive visual ornamentation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack TypeScript Architecture

**Frontend Framework**: React with Vite as the build tool and development server. The application uses TypeScript throughout with strict typing enabled. React Router is implemented via Wouter for client-side routing.

**Backend Framework**: Express.js server running in Node.js. The application follows a monorepo structure with separate `client/` and `server/` directories, sharing types through a `shared/` directory.

**Development vs Production**: Two separate entry points exist - `index-dev.ts` uses Vite's middleware mode for hot module replacement during development, while `index-prod.ts` serves pre-built static assets in production.

### UI Component Architecture

**Design System**: Uses shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling. The design system follows a "New York" style variant with customizable theming through CSS variables.

**State Management**: TanStack Query (React Query) handles all server state management, caching, and data fetching. No global client state management library is used - component state is managed locally with React hooks.

**Styling Approach**: Tailwind CSS with a custom configuration supporting CSS variables for theming. The application uses utility-first CSS with component-scoped styles when needed.

### AI Agent Orchestration System

**Multi-Agent Architecture**: The platform implements a sophisticated agent orchestration system (`agentOrchestrator.ts`) that uses multiple specialized AI agents working in concert:

- **Planner Agent**: Creates strategic investigation plans with defined goals and success criteria
- **Gatherer Agent**: Collects and analyzes evidence from prescription history and clinical events
- **Synthesizer Agent**: Generates actionable Next Best Actions based on gathered evidence
- **Reflector Agent**: Validates recommendations and assesses confidence levels

**Reasoning Pattern**: Uses a chain-of-thought approach where each agent produces structured outputs validated by Zod schemas. The system follows a Plan → Gather → Synthesize → Reflect workflow, with each step building on previous outputs.

**Event-Driven Communication**: Agent thoughts and actions are streamed in real-time using EventEmitter, allowing the frontend to display live reasoning processes to users.

### AI Service Integration

**Azure OpenAI**: Primary AI provider using the GPT-5-mini model (as specified in code). The service handles three main AI functions:

1. **Intelligent NBA Generation**: Analyzes HCP data and prescription patterns to generate contextual recommendations
2. **Territory Planning**: Optimizes field rep schedules across multiple HCPs
3. **Copilot Query Processing**: Natural language interface for querying HCP data

**Prompt Engineering**: System prompts emphasize being data-driven, specific, and actionable. The AI is positioned as an "elite pharmaceutical commercial AI agent" with expertise in oncology.

### Switching Detection Engine

**Pattern Recognition Algorithm**: Analyzes prescription history to detect switching behavior through multiple risk factors:

- Declining prescriptions of company products (0-40 points)
- Increasing competitor prescriptions (0-30 points)  
- Sudden pattern changes (0-20 points)
- Long periods without company product prescriptions (0-10 points)

**Risk Scoring**: Calculates a 0-100 risk score and categorizes HCPs into tiers (low, medium, high, critical). Uses AI-enhanced analysis to provide explanations for detected switches.

**Cohort Analysis**: Tracks patient cohorts to identify group-level switching patterns (e.g., "young RCC patients" switching post-clinical conference).

### Data Storage Architecture

**Database**: PostgreSQL accessed through Neon's serverless driver. The database uses Drizzle ORM for type-safe queries and schema management.

**Schema Design**: Core entities include:
- HCPs (healthcare providers) with risk scoring metadata
- Next Best Actions (AI-generated recommendations)
- Prescription History (monthly prescription data)
- Switching Events (detected switching incidents)
- Patients and Clinical Events (supporting cohort analysis)
- Agent Sessions, Thoughts, Actions, and Feedback (agent orchestration tracking)

**Data Flow**: The storage layer (`storage.ts`) implements a repository pattern with a well-defined interface (`IStorage`) abstracting database operations from business logic.

### Real-time Communication

**Server-Sent Events**: Used for streaming agent reasoning processes from backend to frontend during NBA generation and investigation workflows.

**Event Stream Format**: JSON-formatted events with types: 'thought', 'action', 'phase', and 'completed', allowing the frontend to render step-by-step AI reasoning.

## External Dependencies

### AI & Machine Learning
- **Azure OpenAI**: Primary LLM provider for NBA generation, territory planning, and natural language processing (via `@azure/openai` SDK)
- **OpenAI SDK**: JavaScript client library for Azure OpenAI integration

### Database & ORM
- **Neon PostgreSQL**: Serverless PostgreSQL database (via `@neondatabase/serverless`)
- **Drizzle ORM**: Type-safe ORM for database operations with PostgreSQL dialect
- **Drizzle Kit**: Migration and schema management tooling

### Frontend Framework & Libraries
- **React 18**: UI framework with hooks and modern patterns
- **Wouter**: Lightweight client-side routing
- **TanStack Query**: Server state management and data fetching
- **Vite**: Build tool and development server
- **TypeScript**: Static typing across the entire codebase

### UI Components & Styling
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library based on Radix + Tailwind
- **Recharts**: Charting library for prescription trend visualization
- **Lucide React**: Icon library

### Backend Framework
- **Express.js**: HTTP server framework
- **connect-pg-simple**: PostgreSQL session store (though sessions may not be actively used)

### Development & Build Tools
- **tsx**: TypeScript execution for development server
- **esbuild**: Fast bundler for production server build
- **PostCSS**: CSS processing with Tailwind

### Form Validation
- **Zod**: Schema validation for API inputs and LLM outputs
- **React Hook Form**: Form state management with Zod resolver

### Utilities
- **date-fns**: Date manipulation library
- **nanoid**: Unique ID generation
- **class-variance-authority**: Utility for managing component variants
- **clsx** & **tailwind-merge**: Class name merging utilities