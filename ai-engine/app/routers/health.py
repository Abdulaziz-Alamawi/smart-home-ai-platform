"""Health and model-metadata endpoints."""
from __future__ import annotations

from fastapi import APIRouter

from app.config import settings
from app.services.registry import registry

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.version,
        "models_ready": registry.is_ready,
    }


@router.get("/metrics")
def metrics() -> dict:
    return {"models_ready": registry.is_ready, "metrics": registry.metrics}
