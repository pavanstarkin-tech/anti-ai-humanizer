# Testing Strategy and Test Suite Guide

## 1. Test Architecture Overview
HumanizePro features an end-to-end automated test suite combining **Unit Tests**, **Independent Evaluator Audits**, **Hard Preservation Gate Tests**, and a complete **End-to-End Multi-Page Pipeline Workflow**.

All tests execute with deterministic mocked AI providers, requiring **no live external API calls or credits**.

---

## 2. Test Execution Commands

```bash
# Run complete test suite (Unit + Integration + E2E)
npm test

# Run Unit Tests only
npm run test:unit

# Run Integration Tests only
npm run test:integration

# Run End-to-End Pipeline Tests only
npm run test:e2e
```

---

## 3. Test Suites Implemented

### 1. `domain.classifier.test.ts`
- Verifies classification of Medical, Legal, Scientific, and Technical texts.
- Validates confidence score thresholding and multi-domain secondary expert assignment.
- Verifies extraction of numerical values and protected token markers.

### 2. `hard.gates.test.ts`
- **Negative Test**: Rejects candidates altering numerical figures or dates (FR-06).
- **Negative Test**: Rejects candidates modifying or dropping protected placeholders `[TABLE_001]` (FR-06).
- **Negative Test**: Rejects candidates with meaning preservation below threshold.
- **Positive Test**: Confirms candidates passing all 6 hard gates are marked valid.

### 3. `candidate.reranker.test.ts`
- Verifies sorting valid candidates by 10-dimension weighted overall score.
- **Safety Gate Priority**: Proves high-naturalness candidates violating preservation gates are discarded in favor of valid alternatives.

### 4. `refinement.engine.test.ts`
- Tests immediate stopping when candidate exceeds `QUALITY_TARGET` (80/100).
- Verifies hard loop stopping at `MAX_ITERATIONS` (5).
- Verifies retention of prior stronger candidate if refinement causes a regression.

### 5. `element.detector.test.ts`
- Validates isolated extraction of Markdown tables, HTML/Markdown images, LaTeX equations, and citations.
- Verifies injection of stable placeholders (`[TABLE_001]`, `[IMAGE_002]`, `[EQUATION_003]`, `[CITATION_004]`).

### 6. `integrity.validator.test.ts`
- Validates pre- and post-reconstruction count parity for pages, tables, images, diagrams, equations, citations, and numbers.
- Fails reconstruction if any placeholder or figure was omitted.

### 7. `humanization.pipeline.test.ts` (Full E2E)
- **Step 1**: Parses sample 2-page document with tables, citations, and technical specs.
- **Step 2**: Runs Page 1 through classification, multi-candidate generation, evaluation, and refinement.
- **Step 3**: Simulates user page approval, unlocking Page 2.
- **Step 4**: Simulates user manual editing on Page 2 and re-evaluates gates.
- **Step 5**: Reconstructs final document and verifies 100% integrity report.
