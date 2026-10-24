# TrustLens AI: AI Reliability & Hallucination Evaluation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v22.14.0-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.12.7-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-teal.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2.0-cyan.svg)](https://react.dev/)
[![DeBERTa-v3](https://img.shields.io/badge/Model-DeBERTa--v3--small-orange.svg)](https://huggingface.co/cross-encoder/nli-deberta-v3-small)

**TrustLens AI** is an academic platform engineered to evaluate the factual reliability of AI-generated responses through transparent, multi-stage natural language inference. Instead of evaluating text with opaque LLM self-evaluations or uncalibrated confidence percentages, TrustLens:
1. Decomposes unstructured AI text into **atomic verifiable claims**.
2. Retrieves relevant evidence passages from a **local ChromaDB semantic vector index** and live **Wikipedia API**.
3. Verifies each claim using a cross-encoder Natural Language Inference (NLI) model (`cross-encoder/nli-deberta-v3-small`).
4. Computes a transparent **Reliability Index** and **Hallucination Rate** with explicit mathematical formulas and limitations caveats.
5. Persists evaluation audits in **MongoDB** for historical review and tracking.

---

## 1. System Architecture

```mermaid
flowchart TD
    User([User / Browser]) <-->|HTTP / JSON :5173| Frontend[React.js Client + Vite]
    Frontend <-->|REST API :5000| Backend[Express.js Server]
    
    subgraph Express Backend Layer [:5000]
        Backend --> RateLimiter[In-Memory Rate Limiter]
        RateLimiter --> Validator[Input Validation & Bounds]
        Validator --> EvalCtrl[Evaluation Controller]
        EvalCtrl <-->|Mongoose / ODM| Mongo[(MongoDB :27017)]
        EvalCtrl <-->|Axios Client 60s Timeout| MLClient[Inter-Service ML Client]
    end

    subgraph Python AI / ML Service [:8000]
        MLClient <-->|POST /api/v1/verify| FastAPI[FastAPI Microservice]
        FastAPI --> Extractor[Atomic Claim Extractor<br/>(NLTK POS + Rule Decomposer)]
        Extractor --> Retriever[Evidence Retriever]
        Retriever <-->|Dense Semantic Cosine Search| Chroma[(ChromaDB Vector Store<br/>all-MiniLM-L6-v2)]
        Retriever <-->|REST Query| Wiki[Wikipedia API]
        Retriever --> Verifier[NLI Cross-Encoder Verifier<br/>(DeBERTa-v3-small)]
        Verifier --> ConflictRes[Conflict Resolution Engine]
        ConflictRes --> MetricsCalc[Academic Metrics Calculator]
    end

    MetricsCalc --> EvalCtrl
```

---

## 2. Monorepo Structure

```
TrustLens-AI/
├── client/                     # Frontend Client (React.js, Vite, Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Modular UI (Evaluate, Results, History, Cluster)
│   │   ├── services/           # Live API client with error interceptors
│   │   └── App.jsx             # Main workbench and dashboard controller
│   └── package.json
│
├── server/                     # Application Backend (Node.js, Express.js, MongoDB)
│   ├── src/
│   │   ├── config/             # DB & Environment variables with fallbacks
│   │   ├── controllers/        # Evaluation controller with DB outage resilience
│   │   ├── middleware/         # Rate limiting, validation, error handling
│   │   ├── models/             # Mongoose schemas (Evaluation, Claims, Metrics)
│   │   ├── routes/             # REST endpoints (/health, /api/v1/evaluations)
│   │   └── server.js           # Server bootstrap
│   ├── tests/                  # Integration tests (Node.js native test runner)
│   └── package.json
│
├── ml_service/                 # AI & NLP Microservice (Python, FastAPI, PyTorch)
│   ├── app/
│   │   ├── routes/             # Verification, claims, evidence, metrics, robustness
│   │   ├── schemas/            # Pydantic data contracts and validation limits
│   │   ├── services/           # Extractor, Retriever, VectorStore, NLIVerifier
│   │   └── main.py             # FastAPI entrypoint
│   ├── data/                   # ChromaDB storage & 40-sample benchmark dataset
│   ├── experiments/            # Saved reproducibility artifacts & failure logs
│   ├── tests/                  # Automated pytest suite (42 tests)
│   ├── run_robustness_experiments.py # Reproducibility benchmark runner CLI
│   └── requirements.txt
│
└── docs/                       # Academic specifications and benchmark reports
    ├── METRICS_METHODOLOGY.md  # Mathematical formulas and denominator rationale
    ├── ROBUSTNESS_FRAMEWORK.md # Annotation guidelines and stress-test categories
    └── EXPERIMENTAL_RESULTS.md # Live measured results, confusion matrix, charts
```

---

## 3. Hardware Requirements & Model Specifications

| Component | Model Checkpoint | License | Parameter Size | Memory / Footprint |
|---|---|---|---|---|
| **NLI Cross-Encoder** | `cross-encoder/nli-deberta-v3-small` | Apache 2.0 | 44 Million | ~180 MB RAM |
| **Dense Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` | Apache 2.0 | 22 Million | ~90 MB RAM (ONNX) |
| **Vector Storage** | ChromaDB (Cosine similarity space) | Apache 2.0 | Local embedded | Persistent on disk |

* **Hardware Recommendation**: Modern multi-core CPU (Intel i5/i7 or Apple Silicon M-series), minimum 8 GB RAM. Dedicated GPU/CUDA is supported but **not required**; inference runs at ~200ms per pair on CPU with 4-thread Torch optimization.
* **Model Download**: Models download automatically from Hugging Face on initial service startup and are cached locally in `~/.cache/huggingface/`.

---

## 4. Installation & Environment Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (tested on v22.14.0)
- **Python**: v3.10 or higher (tested on v3.12.7)
- **MongoDB**: Community Server v6.0+ (running locally on port 27017 or remote Atlas URI)

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/RoshniBorade/TrustLens-AI.git
cd TrustLens-AI

# Install root, server, and client dependencies
npm run install:all
```

### Environment Configuration

1. **Server Configuration (`server/.env`)**:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_ORIGIN=http://localhost:5173
   MONGODB_URI=mongodb://127.0.0.1:27017/trustlens_ai
   ML_SERVICE_URL=http://localhost:8000
   ML_SERVICE_TIMEOUT_MS=60000
   ```

2. **ML Service Configuration (`ml_service/.env`)**:
   ```env
   HOST=127.0.0.1
   PORT=8000
   ENVIRONMENT=development
   CORS_ORIGINS=["http://localhost:5173","http://localhost:5000","http://127.0.0.1:5000"]
   ```

3. **Client Configuration (`client/.env`)**:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   ```

---

## 5. Starting the Services

Run each service in a separate terminal:

### Terminal 1: Python ML Service (Port 8000)
```bash
cd ml_service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*Health Check*: `http://localhost:8000/health`  
*Interactive Swagger API Docs*: `http://localhost:8000/docs`

### Terminal 2: Express Application Server (Port 5000)
```bash
cd server
npm start
```
*Health Check*: `http://localhost:5000/health`  
*API Status*: `http://localhost:5000/api/v1/health`

### Terminal 3: React Frontend Client (Port 5173)
```bash
cd client
npm run dev
```
*Access UI*: Open `http://localhost:5173` in your browser.

---

## 6. Document Ingestion Guide

TrustLens allows ingesting custom reference documents into ChromaDB for local evidence grounding:

### Ingestion via API
```bash
curl -X POST http://localhost:8000/api/v1/evidence/ingest   -H "Content-Type: application/json"   -d '{
    "title": "Quantum Computing Fundamentals",
    "content": "Quantum computers utilize qubits capable of superposition...",
    "url": "https://example.org/quantum-paper"
  }'
```

### Ingestion via UI
Users can paste custom context directly into the **Reference Context** field in the web evaluation form. TrustLens chunks the text into overlapping sentence windows, embeds each window using `all-MiniLM-L6-v2`, and prioritizes it during claim verification.

---

## 7. Running Tests & Reproducibility Suite

TrustLens contains comprehensive automated test suites covering all architectural layers:

### 1. Python ML Service Tests (Pytest)
```bash
# Run all 42 unit, verification, and benchmark tests
npm run test:ml

# Or directly via pytest in ml_service directory
cd ml_service
pytest tests/ -v
```
*Coverage*: Claim decomposition, qualifier preservation, vector retrieval, NLI verdicts, metric zero-division safety, 8-category robustness suite.

### 2. Express Backend Integration Tests (Node.js Native Test Runner)
```bash
# Run backend integration tests
npm run test:server

# Or directly in server directory
cd server
npm test
```
*Coverage*: Health probes, 404 handler, input bounds validation, invalid ID format rejection, rate limiting headers.

### 3. Reproducibility Experiment Runner CLI
```bash
cd ml_service
python run_robustness_experiments.py
```
*Output*: Evaluates the 40-sample benchmark dataset live, outputs confusion matrices, per-category breakdown, baseline comparisons, and generates JSON artifacts in `ml_service/experiments/`.

---

## 8. Complete API Reference

### Express Application Server (`http://localhost:5000`)
| Method | Endpoint | Rate Limit | Description |
|---|---|---|---|
| `GET` | `/health` | None | Basic server liveness probe |
| `GET` | `/api/v1/health` | 60 req/min | Component status (MongoDB connection & ML service latency) |
| `POST`| `/api/v1/evaluations` | 20 req/min | Submits text response for full evaluation and saves to MongoDB |
| `GET` | `/api/v1/evaluations` | 60 req/min | Paginated history of past evaluation audits |
| `GET` | `/api/v1/evaluations/:id` | 60 req/min | Retrieves individual evaluation report by ID |

### Python ML Service (`http://localhost:8000`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | ML service liveness, uptime, and model load status |
| `POST`| `/api/v1/verify` | End-to-end claim extraction, evidence retrieval, and NLI verification |
| `POST`| `/api/v1/claims/extract` | Rule-based atomic claim decomposition |
| `POST`| `/api/v1/evidence/retrieve`| Per-claim evidence retrieval (ChromaDB + Wikipedia) |
| `POST`| `/api/v1/evidence/ingest` | Ingests reference text document into ChromaDB index |
| `GET` | `/api/v1/evidence/sources` | Lists all indexed reference sources in local vector store |
| `GET` | `/api/v1/metrics/dataset` | Returns reference 30-sample benchmark dataset |
| `POST`| `/api/v1/metrics/evaluate`| Evaluates reference benchmark or custom test set |
| `GET` | `/api/v1/robustness/dataset` | Returns 40-sample curated robustness test suite |
| `GET` | `/api/v1/robustness/results` | Returns latest persisted benchmark metrics and failure analysis |
| `POST`| `/api/v1/robustness/run` | Executes live evaluation across 8 robustness categories |

---

## 9. Reproducible Demo Scenario

Follow this walkthrough to demonstrate the system end-to-end:

### Scenario: Mixed Fact & Hallucination Evaluation
1. Open the UI at `http://localhost:5173`.
2. Enter the following test prompt into the **AI Evaluation Workbench**:
   - **User Query**: `Tell me about France, Italy, and Mars.`
   - **AI Response Text**:
     ```
     Paris is the capital of France. Rome is the capital of Italy. Meanwhile, Mars has vast oceans of liquid cheddar cheese covering its surface.
     ```
   - **External Knowledge**: Checked (Wikipedia enabled).
3. Click **Analyze & Verify Reliability**.
4. **Expected Output Verification**:
   - **Claim 1**: *"Paris is the capital of France."* $ightarrow$ **Supported** (Entailment: ~99.7% via Wikipedia: Paris).
   - **Claim 2**: *"Rome is the capital of Italy."* $ightarrow$ **Supported** (Entailment: ~99.6% via Wikipedia: Rome).
   - **Claim 3**: *"Mars has vast oceans of liquid cheddar cheese..."* $ightarrow$ **Contradicted** (Contradiction: ~99.8% via Wikipedia: Mars).
   - **Summary Scores**:
     - Supported: 2 (66.7%)
     - Contradicted: 1 (33.3%)
     - Unverified: 0 (0.0%)
     - **Reliability Index**: **66.67%**
     - **Hallucination Rate**: **33.33%**
5. Navigate to **Evaluation History** to confirm the record was persisted in MongoDB.

---

## 10. Implemented vs. Incomplete Features Checklist

| Feature Area | Capability | Status | Implementation Details |
|---|---|---|---|
| **Claim Extraction** | Compound sentence decomposition | **Implemented** | Rule-based NLTK POS tagger + clause boundary splitter |
| **Claim Extraction** | Conversational filler & disclaimer filtering | **Implemented** | Regex preambles & opinion filters (*"As an AI..."*) |
| **Claim Extraction** | LLM-based neural claim decomposition | *Planned* | Future work: multi-hop coreference resolution |
| **Evidence Retrieval** | Dense semantic vector retrieval | **Implemented** | ChromaDB with ONNX `all-MiniLM-L6-v2` |
| **Evidence Retrieval** | Live encyclopedic web retrieval | **Implemented** | Real Wikipedia REST API with source link preservation |
| **Evidence Retrieval** | Commercial Search API (Google/Bing) | *Planned* | Architecture supports pluggable providers via API keys |
| **Claim Verification** | Cross-encoder NLI model | **Implemented** | `cross-encoder/nli-deberta-v3-small` (44M params) |
| **Claim Verification** | Multi-source conflict detection | **Implemented** | Detects opposing entailment + contradiction across sources |
| **Scoring & Metrics** | Transparent formula definition | **Implemented** | Explicit denominators; unverified $\neq$ false |
| **Scoring & Metrics** | 3-class confusion matrix & binary detection | **Implemented** | Precision, Recall, F1, Balanced Accuracy |
| **System Resilience** | In-memory sliding window rate limiting | **Implemented** | 20 req/min (submissions), 60 req/min (general API) |
| **System Resilience** | Database outage graceful degradation | **Implemented** | Continues live evaluation with warning if MongoDB offline |
| **System Resilience** | Input size bounding & truncation | **Implemented** | Bounded at 8,000 chars (server) and 15,000 chars (FastAPI) |
| **User Authentication** | User accounts / OAuth2 / JWT login | *Planned* | Academic single-user workbench prototype |
| **Multi-Lingual** | Non-English language support | *Planned* | Currently English-only tokenization and evidence retrieval |

---

## 11. Security & Quality Audit Summary

- **Secrets Management**: No API keys or credentials are hardcoded. Environment variables use `.env` files with safe academic fallbacks.
- **Input Validation**: Handled at both Express (`express-validator`) and FastAPI (`pydantic`) levels with character bounds, type checks, and regex sanitization.
- **Database Outage Resilience**: If MongoDB is unavailable, Express catches connection errors gracefully and delivers live ML evaluation results with a `persisted: false` flag.
- **Rate Limiting**: Custom sliding-window in-memory rate limiter protects endpoints against DoS abuse without external Redis dependencies.
- **Error Leakage**: Stack traces are hidden from API responses in production mode (`process.env.NODE_ENV !== 'development'`).
- **Dependencies**: Server packages report **0 vulnerabilities** on `npm audit`. Frontend devDependencies note standard Vite/PostCSS bundler warnings suitable for development.

---

## 12. Academic Disclaimer & Limitations

> [!CAUTION]
> **Academic Prototype Notice**:
> TrustLens AI is an academic research platform designed for explainable AI evaluation experiments. It is **not** certified for production medical diagnosis, legal adjudication, or mission-critical factual verification.
> 
> The **Reliability Index** is an empirical measure of evidence corroboration relative to the queried reference corpus. It is **not** a calibrated Bayesian probability of absolute truth. An **Unverified** verdict indicates an absence of sufficient corroborating or refuting evidence within indexed sources, and must not be conflated with definitive factual falsehood.
