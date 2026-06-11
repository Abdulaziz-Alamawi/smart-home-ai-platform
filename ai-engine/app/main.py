"""FastAPI application entrypoint for the Smart Home AI Engine."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health, predictions
from app.services.registry import registry


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load persisted models, or train them on first boot.
    registry.load_or_train()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description=(
        "Real machine-learning microservice powering the Smart Home AI Platform: "
        "energy prediction, anomaly detection, usage analysis, smart scheduling, "
        "cost optimisation and a recommendation engine."
    ),
    contact={"name": "Abdulaziz AlAmawi"},
    license_info={"name": "MIT"},
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(predictions.router)


@app.get("/", tags=["health"])
def root() -> dict:
    return {"service": settings.app_name, "version": settings.version, "docs": "/docs"}
