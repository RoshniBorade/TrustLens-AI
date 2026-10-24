# TrustLens AI: AI Reliability & Hallucination Evaluation Platform

An academic platform engineered to evaluate the factual reliability of AI-generated responses. Instead of relying on a black-box percentage or ungrounded language model judgments, TrustLens decomposes AI responses into atomic claims, retrieves verifiable evidence from curated and open-domain knowledge bases, performs Natural Language Inference (NLI) with transformer models, and produces an explainable reliability audit.

---

## 1. System Architecture & Monorepo Structure

```
TrustLens-AI/
├── client/                     # Frontend User Interface (React.js, Vite, Tailwind CSS)
│   ├── src/
│   │   ├── services/api.js     # Client API connector
│   │   ├── App.jsx             # Health dashboard & evaluation workbench
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
├── server/                     # Application Backend (Node.js, Express.js, MongoDB)
│   ├── src/
│   │   ├── config/             # DB & Environment configuration
│   │   ├── middleware/         # Logging and centralized error handling
│   │   ├── routes/             # Health and REST API routing
│   │   ├── services/           # Inter-service client for Python ML Engine
│   │   └── server.js           # Server bootstrap
│   ├── .env.example
│   └── package.json
│
└── ml_service/                 # AI & Machine Learning Microservice (Python, FastAPI)
    ├── app/
    │   ├── config.py           # Pydantic Settings
    │   ├── schemas/            # API contracts (Claim, Evidence, Verification)
    │   ├── routes/             # Health and verification routes
    │   └── main.py             # FastAPI entry point
    ├── requirements.txt
    └── .env.example
```

---

## 2. Formal API Contracts (Inter-Service)

### A. Health & Status Probe
* **ML Microservice (`GET http://localhost:8000/health`)**
  ```json
  {
    "status": "healthy",
    "service": "trustlens-ml-service",
    "version": "1.0.0",
    "environment": "development",
    "timestamp": "2026-10-23T10:15:00Z",
    "uptime_seconds": 12.4,
    "model_status": {
      "nli_model": "cross-encoder/nli-deberta-v3-small",
      "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
      "loaded": false,
      "ready_for_pipeline": true
    }
  }
  ```

* **Application Server (`GET http://localhost:5000/health`)**
  ```json
  {
    "status": "healthy",
    "service": "trustlens-server",
    "version": "1.0.0",
    "timestamp": "2026-10-23T10:15:00Z",
    "uptime_seconds": 35,
    "components": {
      "database": { "type": "MongoDB", "connected": true, "status": "connected" },
      "ml_service": { "type": "Python/FastAPI", "connected": true, "latency_ms": 12 }
    }
  }
  ```

### B. Claim Verification Payload Schema (`POST /api/v1/verify-claims`)
```json
{
  "query": "Who developed the transformer model and when?",
  "response_text": "The transformer architecture was introduced by researchers at Google in 2017 in the paper Attention Is All You Need.",
  "use_web_search": true
}
```
**Response Contract:**
```json
{
  "evaluation_id": "eval_65f412...",
  "claims": [
    {
      "claim_id": "c1",
      "claim_text": "The transformer architecture was introduced by researchers at Google.",
      "status": "supported",
      "confidence": 0.98,
      "evidence": {
        "id": "ev_1",
        "text": "Vaswani et al. from Google Brain and Google Research presented the Transformer...",
        "source_title": "Attention Is All You Need (Wikipedia)",
        "similarity_score": 0.91
      },
      "explanation": "Premise entails hypothesis with 98% confidence."
    }
  ],
  "metrics": {
    "total_claims": 2,
    "supported_claims": 2,
    "contradicted_claims": 0,
    "unverified_claims": 0,
    "supported_proportion": 1.0,
    "contradicted_proportion": 0.0,
    "unverified_proportion": 0.0,
    "reliability_index": 100.0,
    "hallucination_rate": 0.0,
    "unverified_rate": 0.0,
    "strict_accuracy": 100.0,
    "formula_definition": {
      "reliability_index": "N_supported / (N_supported + N_contradicted + 0.5 * N_unverified) * 100",
      "hallucination_rate": "N_contradicted / N_total"
    },
    "limitations_disclaimer": "The Reliability Index is an empirical grounding metric, not a calibrated Bayesian probability of absolute truth."
  }
}
```

---

## 3. Quickstart & Installation

### Prerequisites
* **Node.js**: v18+ (tested on v22.14.0)
* **Python**: 3.10+ (tested on 3.12.7)
* **MongoDB**: v6.0+ (running locally or MongoDB Atlas)

---

### Step 1: Python ML Service Setup
```bash
# Navigate to ML service directory
cd ml_service

# Install dependencies
pip install -r requirements.txt

# Start the ML service (Port 8000)
uvicorn app.main:app --reload --port 8000
```
*Health Check:* Open `http://localhost:8000/health` or interactive Swagger docs at `http://localhost:8000/docs`.

---

### Step 2: Express Application Server Setup
```bash
# In a new terminal, navigate to server directory
cd server

# Install dependencies
npm install

# Start development server (Port 5000)
npm run dev
```
*Health Check:* Open `http://localhost:5000/health` or `http://localhost:5000/api/v1/status`.

---

### Step 3: React Frontend Client Setup
```bash
# In a third terminal, navigate to client directory
cd client

# Install dependencies
npm install

# Launch Vite development server (Port 5173)
npm run dev
```
*Access UI:* Open `http://localhost:5173` in your browser.

---

## 4. Environment Variables Reference

| Service | Variable | Default | Description |
| :--- | :--- | :--- | :--- |
| **server** | `PORT` | `5000` | Port for Express HTTP server |
| **server** | `MONGODB_URI` | `mongodb://127.0.0.1:27017/trustlens_ai` | MongoDB connection string |
| **server** | `ML_SERVICE_URL`| `http://localhost:8000` | URL of FastAPI microservice |
| **ml_service** | `PORT` | `8000` | Port for FastAPI service |
| **ml_service** | `NLI_MODEL_NAME`| `cross-encoder/nli-deberta-v3-small` | Hugging Face NLI model identifier |
| **client** | `VITE_API_BASE_URL` | `http://localhost:5000/api/v1` | Backend API entrypoint |

---

## 5. Reliability Scoring & System Evaluation Methodology

TrustLens AI defines two distinct evaluation scopes:
1. **Per-Response Reliability Summary**:
   - Decomposes responses into atomic claims and calculates category proportions:
     $$p_s = \frac{N_s}{N_{\text{total}}}, \quad p_c = \frac{N_c}{N_{\text{total}}}, \quad p_u = \frac{N_u}{N_{\text{total}}}$$
   - Computes the **Reliability Index**:
     $$\text{Reliability Index} = \frac{N_s}{N_s + N_c + 0.5 \times N_u} \times 100$$
   - Displays the unverified proportion ($p_u$) separately to prevent treating unverified statements as proven falsehoods.
   - Transparently caveats that the score measures empirical evidence corroboration rather than a calibrated Bayesian truth probability.

2. **System-Performance Benchmark Evaluation**:
   - Measures multi-class model accuracy on a 30-sample curated test dataset (`ml_service/data/benchmark_dataset.json`).
   - Reports $3 \times 3$ **Confusion Matrix**, per-class Precision/Recall/F1, and Macro/Weighted averages.
   - Formally defines the positive class for **Binary Hallucination Detection** as `contradicted`.
   - Comprehensive methodology details: see [docs/METRICS_METHODOLOGY.md](docs/METRICS_METHODOLOGY.md).

---

## 6. Academic Principles
* **Evidence Grounding:** Claims are classified based on retrieved source premises, never purely on an LLM's opinion.
* **Neutrality Principle:** Missing evidence maps strictly to **`Unverified`**, never to false **`Contradicted`**.
* **Formulaic Transparency:** Reliability metrics are mathematically defined and traceable per claim.
