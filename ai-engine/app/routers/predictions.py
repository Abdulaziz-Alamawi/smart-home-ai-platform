"""Prediction, anomaly, usage, scheduling, cost and recommendation routes."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas import (
    AnomalyRequest,
    AnomalyResponse,
    CostRequest,
    EnergyPredictRequest,
    EnergyPredictResponse,
    RecommendationRequest,
    ScheduleRequest,
    UsageRequest,
)
from app.services.registry import registry

router = APIRouter(prefix="/ai", tags=["ai"])


def _require_ready() -> None:
    if not registry.is_ready:
        raise HTTPException(status_code=503, detail="Models are not ready yet")


@router.post("/energy/predict", response_model=EnergyPredictResponse)
def predict_energy(req: EnergyPredictRequest) -> EnergyPredictResponse:
    _require_ready()
    forecast = registry.energy.predict_next_hours(
        start_hour=req.start_hour,
        day_of_week=req.day_of_week,
        month=req.month,
        temperature=req.temperature,
        occupancy=req.occupancy,
        active_devices=req.active_devices,
        horizon=req.horizon,
    )
    total = round(sum(p["predicted_kwh"] for p in forecast), 4)
    return EnergyPredictResponse(horizon=req.horizon, total_predicted_kwh=total, forecast=forecast)


@router.post("/anomaly/detect", response_model=AnomalyResponse)
def detect_anomaly(req: AnomalyRequest) -> AnomalyResponse:
    _require_ready()
    readings = [r.model_dump() for r in req.readings]
    results = registry.anomaly.score(readings)
    detected = sum(1 for r in results if r["is_anomaly"])
    return AnomalyResponse(count=len(results), anomalies_detected=detected, results=results)


@router.post("/usage/analyze")
def analyze_usage(req: UsageRequest) -> dict:
    _require_ready()
    try:
        return registry.usage.analyze([r.model_dump() for r in req.readings])
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/schedule/optimize")
def optimize_schedule(req: ScheduleRequest) -> dict:
    _require_ready()
    try:
        return registry.scheduler.best_window(
            duration_hours=req.duration_hours,
            device_load_kw=req.device_load_kw,
            day_of_week=req.day_of_week,
            month=req.month,
            temperature=req.temperature,
            occupancy=req.occupancy,
            active_devices=req.active_devices,
            tariff=req.tariff,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/cost/optimize")
def optimize_cost(req: CostRequest) -> dict:
    try:
        return registry.cost.optimize(
            hourly_kwh=req.hourly_kwh,
            tariff=req.tariff,
            deferrable_ratio=req.deferrable_ratio,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/recommendations")
def recommendations(req: RecommendationRequest) -> dict:
    _require_ready()
    try:
        cost = registry.cost.optimize(
            hourly_kwh=req.hourly_kwh, tariff=req.tariff, deferrable_ratio=req.deferrable_ratio
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    usage_readings = [
        {"hour": h, "active_devices": max(1.0, req.hourly_kwh[h] * 2), "energy_kwh": req.hourly_kwh[h]}
        for h in range(24)
    ]
    usage = registry.usage.analyze(usage_readings)

    anomaly_readings = [
        {"hour": h, "day_of_week": 0, "temperature": 21.0, "occupancy": 2.0, "energy_kwh": req.hourly_kwh[h]}
        for h in range(24)
    ]
    anomalies = registry.anomaly.score(anomaly_readings)

    recs = registry.recommender.generate(usage=usage, anomalies=anomalies, cost=cost)
    return {"recommendations": recs, "cost_analysis": cost, "usage_analysis": usage}
