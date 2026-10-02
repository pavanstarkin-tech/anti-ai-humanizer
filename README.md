# Domain-Aware Multi-Expert Humanization Platform

> A production-ready AI platform that improves naturalness, clarity, and readability of editable prose through **domain-aware routing**, **multi-expert candidate generation**, **independent 10-dimension evaluation**, **hard preservation safety gates**, **iterative self-improvement**, and **page-by-page human-in-the-loop review**.

---

## NVIDIA Multi-Model AI Infrastructure

The platform integrates **NVIDIA's AI Foundation / NVIDIA NIM** as its **single exclusive AI provider**.

- **OpenAI-Compatible Gateway**: Calls standard `/v1/chat/completions` and `/v1/models` on the configured NVIDIA endpoint (`https://integrate.api.nvidia.com/v1`).
- **Multi-Model Role Mapping**: Dynamically resolves and assigns distinct NVIDIA models for domain classification (`meta/llama-3.3-70b`), medical humanization, scientific writing (`mistralai/mistral-large-2`), technical writing (`deepseek-ai/deepseek-r1`), 10-property evaluation, and refinement.
- **Failover & Fallbacks**: If a primary NVIDIA model is unavailable or rate-limited, the system automatically fails over to configured fallback NVIDIA models and records the failover event.
- **Full Traceability**: Every NVIDIA model request logs latency, tokens, prompt versions, and model IDs into MySQL `ai_request_logs`.

3. **Multi-Candidate Generation & Independent Evaluation**:
   - Generates multiple independent rewrites concurrently.
   - Evaluates 10 distinct properties: Naturalness, Clarity, Sentence Variety, Repetition, Style, Meaning, Facts, Terminology, Citations, Protected Integrity.

4. **Iterative Self-Improvement**:
   - Identifies specific weaknesses and applies targeted refinement loops up to `MAX_ITERATIONS` (default: 5).
   - Reverts to the prior best candidate if refinement causes a score regression or gate violation.

5. **Human-in-the-Loop Page Approval**:
   - Document processing proceeds **strictly page-by-page**.
   - User reviews side-by-side diffs, can manually edit text (with live gate validation), retry with custom instructions, or approve.
   - Page $N+1$ remains locked until Page $N$ is approved.

6. **Document Reconstruction with Integrity Checks**:
   - Reassembles approved pages, re-inserting original protected objects in exact coordinates.
   - Validates pre- and post-reconstruction counts for pages, tables, images, diagrams, equations, citations, and numbers before export.

---

## Tech Stack
- **Frontend**: React 18, Vite, TypeScript, Lucide Icons, Vanilla CSS Design System with dark mode & glassmorphism.
- **Backend**: Node.js, Express.js, TypeScript, Layered Architecture (Routes → Controllers → Services → Repositories).
- **Database**: MySQL with Prisma ORM, Transactions, and Migrations.
- **Testing**: Jest, Supertest, Deterministic Mock AI Provider, Unit Tests, Integration Tests, End-to-End Tests.

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client & Migrate Database
```bash
npm run prisma:generate
```

### 3. Run Test Suite
```bash
# Run all unit tests, integration tests, and E2E pipeline tests
npm test
```

### 4. Start Development Servers
```bash
# Start backend API (http://localhost:4000) and frontend (http://localhost:5173)
npm run dev
```

- **Web App**: `http://localhost:5173`
- **REST API**: `http://localhost:4000`
- **Swagger OpenAPI Docs**: `http://localhost:4000/docs`
- **Health Check**: `http://localhost:4000/api/health`

---

## Docker Deployment
```bash
docker-compose up --build
```
This boots up MySQL 8.0, the Express REST API container, and the Web UI container.
