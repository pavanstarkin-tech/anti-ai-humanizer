# NVIDIA Multi-Model AI Architecture

## 1. Overview
The **Domain-Aware Multi-Expert Humanization Platform** uses **NVIDIA's AI API / NVIDIA NIM** as its **exclusive AI infrastructure provider**.

Rather than calling disparate third-party providers, the platform operates a **Multi-Model NVIDIA Architecture**:
- **NVIDIA NIM** acts as the single enterprise-grade AI gateway.
- Different NVIDIA-hosted models function as specialized expert engines for classification, domain-specific humanization, multi-candidate generation, independent property evaluation, and iterative refinement.

```text
                               ┌─────────────────────────┐
                               │   React User Interface  │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │   Express Backend API   │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │    Page Orchestrator    │
                               └────────────┬────────────┘
                                            │
                         ┌──────────────────┴──────────────────┐
                         │                                     │
                         ▼                                     ▼
              ┌─────────────────────┐               ┌─────────────────────┐
              │    Domain Router    │               │    Model Registry   │
              │   & Expert Pools    │               │  & Discovery Service│
              └──────────┬──────────┘               └──────────┬──────────┘
                         │                                     │
                         └──────────────────┬──────────────────┘
                                            │
                                            ▼
                        ┌───────────────────────────────────────┐
                        │   NVIDIA Multi-Model Orchestrator     │
                        └───────────────────┬───────────────────┘
                                            │
                                            ▼
                        ┌───────────────────────────────────────┐
                        │          NvidiaAIClient               │
                        │ (OpenAI-compatible /v1/chat/completions)
                        └───────────────────┬───────────────────┘
                                            │
                                            ▼
                        ┌───────────────────────────────────────┐
                        │        NVIDIA AI Foundation / NIM     │
                        └───────┬───────────────┬───────┬───────┘
                                │               │       │
                 ┌──────────────┘               │       └──────────────┐
                 ▼                              ▼                      ▼
    ┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
    │  Medical Humanization   │    │  Scientific Humanizer   │    │  Independent Evaluator  │
    │  (meta/llama-3.3-70b)   │    │(mistral-large-2-instruct│    │ (deepseek-ai/deepseek-r1│
    └─────────────────────────┘    └─────────────────────────┘    └─────────────────────────┘
```

---

## 2. NVIDIA Role-to-Model Mapping

Model assignments are **strictly configuration-driven** and dynamically discoverable through `GET /v1/models`. No model names are hard-coded in business logic.

| Role | Default Model ID | Fallback Model IDs | Purpose |
|---|---|---|---|
| **Classifier** | `meta/llama-3.3-70b-instruct` | `mistralai/mistral-large-2-instruct` | Multi-domain confidence scoring |
| **General Writer** | `meta/llama-3.3-70b-instruct` | `mistralai/mistral-large-2-instruct`, `nvidia/nemotron-4-340b-instruct` | Natural prose, cadence, transitions |
| **Medical Expert** | `meta/llama-3.3-70b-instruct` | `mistralai/mistral-large-2-instruct` | Clinical terminology & therapeutic claims protection |
| **Scientific Expert** | `mistralai/mistral-large-2-instruct` | `meta/llama-3.3-70b-instruct`, `deepseek-ai/deepseek-r1` | Research nomenclature & methodological precision |
| **Legal Expert** | `meta/llama-3.3-70b-instruct` | `mistralai/mistral-large-2-instruct` | Statutory references & qualification clauses |
| **Technical Expert** | `deepseek-ai/deepseek-r1` | `meta/llama-3.3-70b-instruct`, `mistralai/mistral-large-2-instruct` | Technical specs, architecture & measurements |
| **Naturalness Evaluator** | `meta/llama-3.3-70b-instruct` | `mistralai/mistral-large-2-instruct` | Flow, cadence & style consistency |
| **Meaning Evaluator** | `meta/llama-3.3-70b-instruct` | `deepseek-ai/deepseek-r1` | Semantic fidelity & author intent |
| **Fact Evaluator** | `deepseek-ai/deepseek-r1` | `meta/llama-3.3-70b-instruct` | Strict numerical, date & factual checks |
| **Refinement** | `mistralai/mistral-large-2-instruct` | `meta/llama-3.3-70b-instruct`, `nvidia/nemotron-4-340b-instruct` | Targeted polish on evaluator critique points |

---

## 3. Endpoints & Management

- `GET /api/models`: Lists discovered NVIDIA NIM models and current role assignments.
- `POST /api/models/refresh`: Forces live discovery refresh from `/v1/models`.
- `GET /api/models/health`: Liveness and readiness check against NVIDIA NIM endpoint.
- `GET /api/models/metrics`: Returns total requests, failure counts, latency, model usage breakdown, and fallback events.
- `POST /api/models/assignments`: Updates role-to-model assignments and fallback hierarchies in runtime.

---

## 4. MySQL Audit & Traceability
Every single NVIDIA request generates a persistent record in `ai_request_logs`:
- `requestId`, `documentId`, `pageId`, `candidateId`, `iteration`
- `task` (`CLASSIFY`, `REWRITE`, `EVALUATE_MEANING`, `REFINE`)
- `modelId` (e.g. `meta/llama-3.3-70b-instruct`)
- `provider`: `"NVIDIA"`
- `durationMs` (latency in milliseconds)
- `fallbackUsed` (boolean flag if primary model timed out or failed over)
- `inputTokens`, `outputTokens`, `totalTokens` (captured directly from NVIDIA usage)
