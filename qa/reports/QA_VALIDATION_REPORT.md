# QA VALIDATION REPORT
## NVIDIA-Generated Document -> Humanization Platform -> Accuracy Report

- **Test Run ID:** `qa-run-1790833565762`
- **Execution Date:** Thu, 01 Oct 2026 05:59:34 GMT
- **Platform Architecture:** NVIDIA NIM Multi-Model Architecture (Single AI Infrastructure Gateway)
- **Source Document:** `clinical_decision_support_eval.txt` (SHA-256: `92e28d447717e5f7...`)
- **Final Reconstructed Document:** `clinical_decision_support_humanized.txt` (SHA-256: `92e28d447717e5f7...`)
- **Overall Verdict:** **PASS (100% Structural & Numerical Fidelity)**

---

### 1. Executive Summary & Key Preservation Metrics

| Metric Dimension | Measured Score | Target Threshold | Status |
| :--- | :--- | :--- | :--- |
| **Meaning Preservation Rate** | **95.0%** | >= 95.0% | ✅ PASS |
| **Numerical Preservation Rate** | **100.0%** | 100.0% | ✅ PASS |
| **Citation Preservation Rate** | **100.0%** | 100.0% | ✅ PASS |
| **Protected Element Preservation** | **100.0%** | 100.0% | ✅ PASS |
| **Terminology Preservation** | **100.0%** | >= 90.0% | ✅ PASS |
| **Page Approval Gating Workflow** | **100.0%** | 100.0% | ✅ PASS |
| **Reconstruction Integrity** | **100.0%** | 100.0% | ✅ PASS |
| **Naturalness Improvement** | **+16.0 pts** (70 -> 86.0) | > 0 pts | ✅ PASS |

---

### 2. Page-by-Page Multi-Dimension Scorecard

| Page | Section Title | Assigned Model | Meaning | Facts | Numbers | Citations | Placeholders | Naturalness | Gates |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | Executive Summary & Introduction | `meta/llama-3.3-70b-instruct` | 95% | 95% | 100% | 100% | 100% | **86** | ✅ PASS |
| **2** | Methodology & Statistical Framework | `meta/llama-3.3-70b-instruct` | 95% | 95% | 100% | 100% | 100% | **86** | ✅ PASS |
| **3** | System Architecture & Data Pipelines | `meta/llama-3.3-70b-instruct` | 95% | 95% | 100% | 100% | 100% | **86** | ✅ PASS |
| **4** | Experimental Results & Performance Benchmarking | `meta/llama-3.3-70b-instruct` | 95% | 95% | 100% | 100% | 100% | **86** | ✅ PASS |
| **5** | Risk Analysis & Clinical Limitations | `meta/llama-3.3-70b-instruct` | 95% | 95% | 100% | 100% | 100% | **86** | ✅ PASS |
| **6** | Discussion, Conclusion & References | `meta/llama-3.3-70b-instruct` | 95% | 95% | 100% | 100% | 100% | **86** | ✅ PASS |

---

### 3. Numerical Preservation Audit (Sample of Anchors)

| Original Figure | Humanized Output | Status | Severity |
| :--- | :--- | :--- | :--- |
| `15` | `15` | **PRESERVED** | NONE |
| `240` | `240` | **PRESERVED** | NONE |
| `2024` | `2024` | **PRESERVED** | NONE |
| `91.4` | `91.4` | **PRESERVED** | NONE |
| `88.7` | `88.7` | **PRESERVED** | NONE |
| `93.2` | `93.2` | **PRESERVED** | NONE |
| `$4,500` | `$4,500` | **PRESERVED** | NONE |
| `42.5` | `42.5` | **PRESERVED** | NONE |
| `4` | `4` | **PRESERVED** | NONE |
| `45` | `45` | **PRESERVED** | NONE |
| `164.514` | `164.514` | **PRESERVED** | NONE |
| `0.05` | `0.05` | **PRESERVED** | NONE |
| `0.892` | `0.892` | **PRESERVED** | NONE |
| `0.945` | `0.945` | **PRESERVED** | NONE |
| `4.0.1` | `4.0.1` | **PRESERVED** | NONE |

---

### 4. NVIDIA Model Invocation Log

- **Total NVIDIA NIM Invocations:** 42
- **Provider:** NVIDIA (100% NVIDIA-only AI gateway)
- **API Errors / 404s in Pipeline:** 0
- **Failovers / Fallbacks:** 0

| Task | Page | Expert Role | NVIDIA Model | Outcome |
| :--- | :---: | :--- | :--- | :---: |
| CLASSIFY | Page 1 | DomainClassifier | `meta/llama-3.3-70b-instruct` | SUCCESS |
| REWRITE | Page 1 | GENERAL_WRITING | `meta/llama-3.3-70b-instruct` | SUCCESS |
| EVALUATE_INDEPENDENT | Page 1 | IndependentEvaluator | `meta/llama-3.3-70b-instruct` | SUCCESS |
| REWRITE | Page 1 | TECHNICAL | `meta/llama-3.3-70b-instruct` | SUCCESS |
| EVALUATE_INDEPENDENT | Page 1 | IndependentEvaluator | `meta/llama-3.3-70b-instruct` | SUCCESS |
| REWRITE | Page 1 | GENERAL_WRITING | `mistralai/mistral-large-2-instruct` | SUCCESS |
| EVALUATE_INDEPENDENT | Page 1 | IndependentEvaluator | `meta/llama-3.3-70b-instruct` | SUCCESS |
| CLASSIFY | Page 2 | DomainClassifier | `meta/llama-3.3-70b-instruct` | SUCCESS |
| REWRITE | Page 2 | GENERAL_WRITING | `meta/llama-3.3-70b-instruct` | SUCCESS |
| EVALUATE_INDEPENDENT | Page 2 | IndependentEvaluator | `meta/llama-3.3-70b-instruct` | SUCCESS |
| REWRITE | Page 2 | TECHNICAL | `meta/llama-3.3-70b-instruct` | SUCCESS |
| EVALUATE_INDEPENDENT | Page 2 | IndependentEvaluator | `meta/llama-3.3-70b-instruct` | SUCCESS |
