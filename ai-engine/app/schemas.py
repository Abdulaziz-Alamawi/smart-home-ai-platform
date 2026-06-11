"""Pydantic request/response schemas for the AI engine API."""
from __future__ import annotations

from pydantic import BaseModel, Field


# ---- Energy Prediction ----
class EnergyPredictRequest(BaseModel):
    start_hour: int = Field(0, ge=0, le=23)
    day_of_week: int = Field(0, ge=0, le=6, description="0=Monday .. 6=Sunday")
    month: int = Field(1, ge=1, le=12)
    temperature: float = Field(21.0, description="Outdoor temperature in Celsius")
    occupancy: float = Field(2.0, ge=0, le=10)
    active_devices: float = Field(4.0, ge=0, le=50)
    horizon: int = Field(24, ge=1, le=48)


class EnergyForecastPoint(BaseModel):
    hour_offset: int
    hour_of_day: int
    predicted_kwh: float


class EnergyPredictResponse(BaseModel):
    horizon: int
    total_predicted_kwh: float
    forecast: list[EnergyForecastPoint]


# ---- Anomaly Detection ----
class Reading(BaseModel):
    hour: int = Field(..., ge=0, le=23)
    day_of_week: int = Field(0, ge=0, le=6)
    temperature: float = 21.0
    occupancy: float = 2.0
    energy_kwh: float = Field(..., ge=0)


class AnomalyRequest(BaseModel):
    readings: list[Reading] = Field(..., min_length=1)


class AnomalyResult(BaseModel):
    index: int
    is_anomaly: bool
    anomaly_score: float


class AnomalyResponse(BaseModel):
    count: int
    anomalies_detected: int
    results: list[AnomalyResult]


# ---- Device Usage ----
class UsageReading(BaseModel):
    hour: int = Field(..., ge=0, le=23)
    active_devices: float = Field(..., ge=0)
    energy_kwh: float = Field(..., ge=0)


class UsageRequest(BaseModel):
    readings: list[UsageReading] = Field(..., min_length=3)


# ---- Smart Scheduling ----
class ScheduleRequest(BaseModel):
    duration_hours: int = Field(..., ge=1, le=24)
    device_load_kw: float = Field(..., gt=0)
    day_of_week: int = Field(0, ge=0, le=6)
    month: int = Field(1, ge=1, le=12)
    temperature: float = 21.0
    occupancy: float = 2.0
    active_devices: float = 4.0
    tariff: list[float] | None = Field(None, description="24 hourly prices")


# ---- Cost Optimization ----
class CostRequest(BaseModel):
    hourly_kwh: list[float] = Field(..., min_length=24, max_length=24)
    tariff: list[float] | None = Field(None, min_length=24, max_length=24)
    deferrable_ratio: float = Field(0.35, ge=0, le=1)


# ---- Recommendations ----
class RecommendationRequest(BaseModel):
    hourly_kwh: list[float] = Field(..., min_length=24, max_length=24)
    tariff: list[float] | None = Field(None, min_length=24, max_length=24)
    deferrable_ratio: float = Field(0.35, ge=0, le=1)
