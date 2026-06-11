"""
Energy Consumption Prediction.

A gradient-boosted regression model that predicts hourly energy
consumption (kWh) from temporal + contextual features. Trained on the
synthetic physical world defined in ``app.data.synthetic``.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

from app.data.synthetic import FEATURE_COLUMNS, generate_energy_dataframe


@dataclass
class TrainingReport:
    mae: float
    r2: float
    n_samples: int


class EnergyPredictor:
    """Wraps a regression model with train / predict helpers."""

    def __init__(self) -> None:
        self.model = HistGradientBoostingRegressor(
            max_iter=300,
            learning_rate=0.06,
            max_depth=8,
            l2_regularization=0.1,
            random_state=42,
        )
        self.report: TrainingReport | None = None

    def train(self, df: pd.DataFrame | None = None, seed: int = 42) -> TrainingReport:
        if df is None:
            df = generate_energy_dataframe(days=180, seed=seed)
        x = df[FEATURE_COLUMNS]
        y = df["energy_kwh"]
        x_train, x_test, y_train, y_test = train_test_split(
            x, y, test_size=0.2, random_state=seed
        )
        self.model.fit(x_train, y_train)
        preds = self.model.predict(x_test)
        self.report = TrainingReport(
            mae=float(mean_absolute_error(y_test, preds)),
            r2=float(r2_score(y_test, preds)),
            n_samples=int(len(df)),
        )
        return self.report

    def predict_one(self, features: dict) -> float:
        row = pd.DataFrame([[features[c] for c in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)
        return float(max(self.model.predict(row)[0], 0.0))

    def predict_next_hours(
        self,
        start_hour: int,
        day_of_week: int,
        month: int,
        temperature: float,
        occupancy: float,
        active_devices: float,
        horizon: int = 24,
    ) -> list[dict]:
        """Forecast the next ``horizon`` hours starting at ``start_hour``."""
        results: list[dict] = []
        for offset in range(horizon):
            hour = (start_hour + offset) % 24
            dow = (day_of_week + (start_hour + offset) // 24) % 7
            features = {
                "hour": hour,
                "day_of_week": dow,
                "month": month,
                "is_weekend": 1 if dow >= 5 else 0,
                "temperature": temperature,
                "occupancy": occupancy,
                "active_devices": active_devices,
            }
            results.append(
                {"hour_offset": offset, "hour_of_day": hour, "predicted_kwh": round(self.predict_one(features), 4)}
            )
        return results
