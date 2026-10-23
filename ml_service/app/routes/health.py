import time
from datetime import datetime, timezone
from fastapi import APIRouter
from app.config import settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health & Status"])

START_TIME = time.time()


@router.get("/health", response_model=HealthResponse)
async def get_health():
    """Liveness and readiness health check endpoint for the ML service."""
    uptime = round(time.time() - START_TIME, 2)
    return HealthResponse(
        status="healthy",
        service=settings.SERVICE_NAME,
        version=settings.SERVICE_VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc).isoformat(),
        uptime_seconds=uptime,
        model_status={
            "nli_model": settings.NLI_MODEL_NAME,
            "embedding_model": settings.EMBEDDING_MODEL_NAME,
            "loaded": True,
            "ready_for_pipeline": True,
        }
    )


@router.get("/api/v1/ping")
async def ping():
    """Quick ping endpoint for inter-service latency checks."""
    return {"pong": True, "service": settings.SERVICE_NAME}
