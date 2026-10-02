# HumanizePro Architecture Specification

## 1. Executive Summary
**HumanizePro** is an enterprise-grade, domain-aware prose refinement platform designed around multi-model expert routing, independent 10-property evaluation, strict preservation hard gates, iterative self-improvement, and human-in-the-loop page-by-page review.

---

## 2. Pipeline Sequence

```text
                  ┌─────────────────┐
                  │ Document Upload │ (DOCX, PDF, TXT, MD)
                  └────────┬────────┘
                           ↓
                  ┌─────────────────┐
                  │ Page Extraction │ (Page-Aware Units)
                  └────────┬────────┘
                           ↓
             ┌─────────────────────────────┐
             │ Protected Element Detection │ (Isolates [TABLE_001], [IMAGE_001],
             │ & Stable Placeholder Locks  │  [EQUATION_001], [CITATION_001])
             └─────────────┬───────────────┘
                           ↓
                  ┌─────────────────┐
                  │ Domain Router   │ (Medical, Scientific, Legal, Technical,
                  │ & Expert Assign │  Academic, Financial, General)
                  └────────┬────────┘
                           ↓
             ┌─────────────┴─────────────┐
             │ Multi-Candidate Generator │ (Independent varied generations)
             └─────────────┬─────────────┘
                           ↓
             ┌─────────────────────────────┐
             │ Independent 10-Property     │ (Naturalness, Clarity, Variety,
             │ Quality Evaluator           │  Repetition, Style, Meaning, Facts,
             └─────────────┬───────────────┘  Terminology, Citations, Placeholders)
                           ↓
             ┌─────────────────────────────┐
             │  Hard Preservation Gates    │ (Rejects candidates with modified
             │   (Pass / Fail Check)       │  facts, numbers, citations, or tags)
             └─────────────┬───────────────┘
                           ↓
             ┌─────────────────────────────┐
             │ Candidate Reranker Engine   │ (Sorts eligible valid candidates
             │                             │  by configured weighted score)
             └─────────────┬───────────────┘
                           ↓
             ┌─────────────────────────────┐
             │ Iterative Refinement Engine │ (Up to MAX_ITERATIONS = 5;
             │                             │  retains prior candidate on regression)
             └─────────────┬───────────────┘
                           ↓
             ┌─────────────────────────────┐
             │ Human-in-the-Loop Review    │ (Page state: READY_FOR_REVIEW)
             └─────────────┬───────────────┘
                           ↓
            ┌──────────────┴──────────────┐
            │                             │
    [Approve Page]                   [Edit / Retry]
            │                             │
            ↓                             ↓
    [Unlock Page N+1]               [Re-run Gates & History]
            │
            ↓ (Once all pages approved)
    ┌─────────────────────────────┐
    │  Document Reconstruction    │ (Re-inserts locked elements, runs
    │  & Integrity Verification   │  pre/post count checks & export)
    └─────────────────────────────┘
```

---

## 3. Database Schema (MySQL + Prisma)
The MySQL database enforces foreign key constraints and transactional consistency across:
- **`User`**: Accounts, authentication credentials, roles.
- **`Document`**: Metadata, original and reconstructed file paths, total/approved page counts.
- **`DocumentPage`**: Page number, state machine status, domain confidence matrix, active candidate pointer.
- **`DocumentElement`**: Raw structured content of tables, images, equations, and citations keyed by placeholder tags.
- **`Candidate`**: Multi-expert generations with temperature, prompt version, model provider.
- **`Evaluation`**: 10 independent score metrics, gate pass/fail booleans, structured auditor feedback.
- **`PageVersion`**: Immutable history of all AI generations, user edits, and approved states with diff patches.
- **`Approval`**: User approval records and timestamps.
- **`ProcessingJob`**: Asynchronous worker tracking for long-running document operations.
- **`AuditLog`**: System audit trail.
