"""Integration tests for the FastAPI endpoints via TestClient."""
from __future__ import annotations


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["models_ready"] is True


def test_energy_predict(client):
    res = client.post(
        "/ai/energy/predict",
        json={
            "start_hour": 0,
            "day_of_week": 2,
            "month": 1,
            "temperature": 5.0,
            "occupancy": 3,
            "active_devices": 5,
            "horizon": 24,
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert len(body["forecast"]) == 24
    assert body["total_predicted_kwh"] > 0


def test_anomaly_detect(client):
    res = client.post(
        "/ai/anomaly/detect",
        json={
            "readings": [
                {"hour": 3, "day_of_week": 1, "temperature": 20, "occupancy": 2, "energy_kwh": 0.4},
                {"hour": 3, "day_of_week": 1, "temperature": 20, "occupancy": 2, "energy_kwh": 99.0},
            ]
        },
    )
    assert res.status_code == 200
    assert res.json()["anomalies_detected"] >= 1


def test_cost_optimize(client):
    hourly = [1.0] * 24
    hourly[18] = 6.0
    res = client.post("/ai/cost/optimize", json={"hourly_kwh": hourly})
    assert res.status_code == 200
    assert res.json()["optimized_cost"] <= res.json()["current_cost"]


def test_cost_optimize_validation(client):
    res = client.post("/ai/cost/optimize", json={"hourly_kwh": [1.0, 2.0]})
    assert res.status_code == 422


def test_schedule_optimize(client):
    res = client.post(
        "/ai/schedule/optimize",
        json={"duration_hours": 3, "device_load_kw": 7.0, "day_of_week": 2, "month": 6},
    )
    assert res.status_code == 200
    assert "recommended_start_hour" in res.json()


def test_recommendations(client):
    hourly = [1.0] * 24
    hourly[19] = 7.0
    res = client.post("/ai/recommendations", json={"hourly_kwh": hourly})
    assert res.status_code == 200
    body = res.json()
    assert len(body["recommendations"]) >= 1
