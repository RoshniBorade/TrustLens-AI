"""Metrics and Benchmark Schemas for TrustLens AI."""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


ClaimStatusType = Literal["supported", "contradicted", "unverified"]


class ClaimSummaryInput(BaseModel):
    claim_id: Optional[str] = None
    text: Optional[str] = None
    status: ClaimStatusType = Field(..., description="Classification: supported, contradicted, or unverified")
    confidence: Optional[float] = Field(1.0, ge=0.0, le=1.0)


class ResponseReliabilitySummary(BaseModel):
    """Transparent metrics for an individual evaluated response."""
    total_claims: int = Field(..., description="Total verifiable factual claims extracted")
    supported_count: int = Field(..., description="Number of claims entailed by evidence")
    contradicted_count: int = Field(..., description="Number of claims refuted by evidence (hallucinations)")
    unverified_count: int = Field(..., description="Number of claims lacking sufficient evidence")
    supported_proportion: float = Field(..., ge=0.0, le=1.0, description="Proportion of claims supported (N_s / N)")
    contradicted_proportion: float = Field(..., ge=0.0, le=1.0, description="Proportion of claims contradicted (N_c / N)")
    unverified_proportion: float = Field(..., ge=0.0, le=1.0, description="Proportion of claims unverified (N_u / N)")
    reliability_index: float = Field(..., ge=0.0, le=100.0, description="Empirical grounding index out of 100")
    hallucination_rate: float = Field(..., ge=0.0, le=1.0, description="Proportion of contradicted claims over total")
    unverified_rate: float = Field(..., ge=0.0, le=1.0, description="Proportion of unverified claims over total")
    strict_accuracy: float = Field(..., ge=0.0, le=100.0, description="Strict proportion of supported claims out of 100")
    formula_definition: Dict[str, str] = Field(..., description="Explicit mathematical formulas and denominators")
    limitations_disclaimer: str = Field(..., description="Academic caveats regarding calibrated truth probabilities")


class CalculateSummaryRequest(BaseModel):
    claims: List[ClaimSummaryInput] = Field(..., description="List of claim classifications to summarize")


class ClassPerformanceMetrics(BaseModel):
    precision: float = Field(..., ge=0.0, le=1.0)
    recall: float = Field(..., ge=0.0, le=1.0)
    f1_score: float = Field(..., ge=0.0, le=1.0)
    support: int = Field(..., ge=0)


class ConfusionMatrixData(BaseModel):
    labels: List[str] = Field(..., description="Class labels in order of rows/columns")
    matrix: List[List[int]] = Field(..., description="Rows = Ground Truth, Columns = Predicted")
    row_labels: List[str]
    col_labels: List[str]


class BinaryDetectionMetrics(BaseModel):
    positive_class: str = Field("contradicted", description="Designated positive target class")
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int
    precision: float = Field(..., ge=0.0, le=1.0)
    recall: float = Field(..., ge=0.0, le=1.0, description="Sensitivity or Detection Rate")
    specificity: float = Field(..., ge=0.0, le=1.0, description="True Negative Rate")
    f1_score: float = Field(..., ge=0.0, le=1.0)
    balanced_accuracy: float = Field(..., ge=0.0, le=1.0)


class BenchmarkSample(BaseModel):
    id: str
    query: Optional[str] = None
    claim_text: str
    ground_truth: ClaimStatusType
    evidence_text: Optional[str] = None
    source_title: Optional[str] = None
    domain: Optional[str] = None


class BenchmarkEvaluationRequest(BaseModel):
    samples: Optional[List[BenchmarkSample]] = Field(None, description="Custom test samples. If empty, built-in reference dataset is evaluated.")
    run_live_nli: bool = Field(False, description="Whether to execute live NLI model inference against evidence passages")


class BenchmarkReport(BaseModel):
    total_samples: int
    accuracy: float = Field(..., ge=0.0, le=1.0)
    per_class: Dict[str, ClassPerformanceMetrics]
    macro_avg: ClassPerformanceMetrics
    weighted_avg: ClassPerformanceMetrics
    confusion_matrix: ConfusionMatrixData
    binary_hallucination_detection: BinaryDetectionMetrics
    evaluation_protocol: str
    disclaimer: str
    timestamp: str
