"""
Anomaly Detection.

An IsolationForest trained on normal household telemetry. It flags energy
readings that deviate from learned consumption patterns (stuck devices,
faults, sensor dropouts, or unusual spikes).
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import precision_score, recall_score

from app.data.synthetic import generate_energy_dataframe, inject_anomalies

ANOMALY_FEATURES = ["hour", "day_of_week", "temperature", "occupancy", "energy_kwh"]


@dataclass
class AnomalyReport:
    precision: float
    recall: float
    contamination: float
    n_samples: int


class AnomalyDetector:
    def __init__(self, contamination: float = 0.03) -> None:
        self.contamination = contamination
        self.model = IsolationForest(
            n_estimators=200,
            contamination=contamination,
            random_state=42,
            n_jobs=-1,
        )
        self.report: AnomalyReport | None = None

    def train(self, seed: int = 42) -> AnomalyReport:
        base = generate_energy_dataframe(days=120, seed=seed)
        labelled = inject_anomalies(base, fraction=self.contamination, seed=seed + 1)
        x = labelled[ANOMALY_FEATURES]
        self.model.fit(x)
        raw = self.model.predict(x)  # -1 anomaly, 1 normal
        pred = (raw == -1).astype(int)
        truth = labelled["is_anomaly"].to_numpy()
        self.report = AnomalyReport(
            precision=float(precision_score(truth, pred, zero_division=0)),
            recall=float(recall_score(truth, pred, zero_division=0)),
            contamination=self.contamination,
            n_samples=int(len(labelled)),
        )
        return self.report

    def score(self, readings: list[dict]) -> list[dict]:
        """Score a batch of readings; returns anomaly flag + score per row."""
        df = pd.DataFrame(readings)
        for col in ANOMALY_FEATURES:
            if col not in df.columns:
                df[col] = 0.0
        x = df[ANOMALY_FEATURES]
        raw = self.model.predict(x)
        scores = self.model.decision_function(x)
        out = []
        for i, (flag, sc) in enumerate(zip(raw, scores)):
            out.append(
                {
                    "index": i,
                    "is_anomaly": bool(flag == -1),
                    "anomaly_score": round(float(-sc), 4),  # higher = more anomalous
                }
            )
        return out
