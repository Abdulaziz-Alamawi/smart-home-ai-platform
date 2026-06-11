"""Unit tests for the individual ML models (real training, real metrics)."""
from __future__ import annotations

from app.models.anomaly_detection import AnomalyDetector
from app.models.cost_optimization import CostOptimizer
from app.models.device_usage import DeviceUsageAnalyzer
from app.models.energy_prediction import EnergyPredictor
from app.models.recommendation import RecommendationEngine
from app.models.smart_scheduling import SmartScheduler, default_tariff_schedule


def test_energy_predictor_learns_signal():
    model = EnergyPredictor()
    report = model.train(seed=1)
    # A real model on structured data should explain most variance.
    assert report.r2 > 0.7
    assert report.mae < 1.0
    pred = model.predict_one(
        {
            "hour": 19,
            "day_of_week": 2,
            "month": 1,
            "is_weekend": 0,
            "temperature": -2.0,
            "occupancy": 4,
            "active_devices": 6,
        }
    )
    assert pred >= 0


def test_anomaly_detector_catches_spikes():
    det = AnomalyDetector()
    report = det.train(seed=2)
    assert report.recall > 0.4  # catches a meaningful share of injected faults
    results = det.score(
        [
            {"hour": 3, "day_of_week": 1, "temperature": 20, "occupancy": 2, "energy_kwh": 0.4},
            {"hour": 3, "day_of_week": 1, "temperature": 20, "occupancy": 2, "energy_kwh": 95.0},
        ]
    )
    assert results[1]["anomaly_score"] > results[0]["anomaly_score"]


def test_device_usage_analyzer():
    an = DeviceUsageAnalyzer()
    an.train(seed=3)
    readings = [
        {"hour": h, "active_devices": 1 + (h % 5), "energy_kwh": 0.3 + (h % 5)} for h in range(24)
    ]
    out = an.analyze(readings)
    assert 0 <= out["load_factor"] <= 1
    assert len(out["peak_hours"]) == 3
    assert out["total_kwh"] > 0


def test_cost_optimizer_finds_savings():
    opt = CostOptimizer()
    # Heavy consumption during expensive peak hours -> shiftable savings.
    hourly = [1.0] * 24
    hourly[18] = 6.0
    hourly[19] = 6.0
    out = opt.optimize(hourly)
    assert out["optimized_cost"] <= out["current_cost"]
    assert out["estimated_savings"] >= 0
    assert len(out["recommended_shift_plan"]) == 24


def test_smart_scheduler_prefers_offpeak():
    pred = EnergyPredictor()
    pred.train(seed=4)
    sched = SmartScheduler(pred)
    out = sched.best_window(
        duration_hours=3,
        device_load_kw=7.0,
        day_of_week=2,
        month=6,
        temperature=22.0,
        occupancy=2.0,
        active_devices=4.0,
    )
    # Cheapest window should start in the off-peak night band (0-6).
    assert 0 <= out["recommended_start_hour"] <= 5
    assert out["estimated_savings"] >= 0


def test_recommendation_engine_prioritises():
    eng = RecommendationEngine()
    recs = eng.generate(
        cost={"estimated_savings": 2.5, "savings_pct": 22},
        usage={"load_factor": 0.3, "peak_hours": [18, 19, 20]},
        anomalies=[{"is_anomaly": True}],
    )
    assert recs[0]["priority"] == "high"
    assert any(r["category"] == "safety" for r in recs)


def test_default_tariff_schedule_shape():
    t = default_tariff_schedule()
    assert len(t) == 24
    assert min(t) < max(t)
