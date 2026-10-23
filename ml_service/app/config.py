import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Centralized configuration for TrustLens ML Service loaded from environment variables."""
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    SERVICE_NAME: str = "trustlens-ml-service"
    SERVICE_VERSION: str = "1.0.0"
    
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5000,http://localhost:5173"
    
    # Model Configurations
    NLI_MODEL_NAME: str = "cross-encoder/nli-deberta-v3-small"
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    SIMILARITY_THRESHOLD: float = 0.65
    MAX_EVIDENCE_SNIPPETS: int = 3

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
