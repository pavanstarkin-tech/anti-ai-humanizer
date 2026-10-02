# HumanizePro REST API Specification

OpenAPI 3.0 documentation is served interactively via Swagger UI at `/docs`.

## Base URL
- Development: `http://localhost:4000/api`
- OpenAPI Specification: `http://localhost:4000/docs`

---

## Endpoints Overview

### Health & System
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Service health status and active AI provider | No |
| `GET` | `/docs` | Interactive Swagger API Explorer | No |
| `GET` | `/api/experts` | List configured domain and writing expert definitions | No |

---

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account | `{ email, password, name }` |
| `POST` | `/api/auth/login` | Authenticate and receive JWT token | `{ email, password }` |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Header: `Bearer <token>` |

---

### Documents (`/api/documents`)
| Method | Endpoint | Description | Notes |
|---|---|---|---|
| `GET` | `/api/documents` | List user's documents with status | Authenticated |
| `POST` | `/api/documents` | Upload document file (`multipart/form-data`) | Parses pages & elements |
| `GET` | `/api/documents/:documentId` | Fetch document details & pages summary | Authenticated |
| `POST` | `/api/documents/:documentId/reconstruct` | Trigger document reconstruction | Requires all pages approved |
| `GET` | `/api/documents/:documentId/download` | Download original or reconstructed file | Supports `?type=reconstructed` |
| `DELETE` | `/api/documents/:documentId` | Delete document and stored files | Authenticated |

---

### Pages & Humanization (`/api/pages` and `/api/documents/:documentId/pages`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/documents/:documentId/pages` | Get all pages, approval counts, and progress |
| `GET` | `/api/pages/:pageId` | Get single page details |
| `POST` | `/api/pages/:pageId/humanize` | Start asynchronous multi-expert humanization |
| `POST` | `/api/pages/:pageId/retry` | Re-run generation with new parameters |
| `GET` | `/api/pages/:pageId/candidates` | List all generated candidates and their evaluation audits |
| `GET` | `/api/pages/:pageId/review` | Fetch review state, diff, scores, and active candidate |
| `POST` | `/api/pages/:pageId/approve` | **Approve page**, lock version, unlock page $N+1$ |
| `POST` | `/api/pages/:pageId/edit` | Save user manual edits (runs live gate audits) |
| `GET` | `/api/pages/:pageId/versions` | Fetch full immutable version history |

---

### Jobs (`/api/jobs`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/jobs/:jobId` | Poll asynchronous processing job status and progress step |
