"""
Device Usage Analysis.

Uses KMeans clustering to group hourly load into distinct usage "regimes"
(e.g. idle, baseline, peak) and derives interpretable statistics such as
peak hours, load factor and per-cluster averages.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from app.data.synthetic import generate_energy_dataframe


@dataclass
class UsageReport:
    n_clusters: int
    inertia: float
    n_samples: int


class DeviceUsageAnalyzer:
    def __init__(self, n_clusters: int = 3) -> None:
        self.n_clusters = n_clusters
        self.scaler = StandardScaler()
        self.model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        self.report: UsageReport | None = None

    def train(self, seed: int = 42) -> UsageReport:
        df = generate_energy_dataframe(days=120, seed=seed)
        features = df[["hour", "active_devices", "energy_kwh"]]
        scaled = self.scaler.fit_transform(features)
        self.model.fit(scaled)
        self.report = UsageReport(
            n_clusters=self.n_clusters,
            inertia=float(self.model.inertia_),
            n_samples=int(len(df)),
        )
        return self.report

    def analyze(self, readings: list[dict]) -> dict:
        """Return usage profile statistics for a batch of hourly readings."""
        df = pd.DataFrame(readings)
        required = {"hour", "active_devices", "energy_kwh"}
        missing = required - set(df.columns)
        if missing:
            raise ValueError(f"Missing fields: {sorted(missing)}")

        scaled = self.scaler.transform(df[["hour", "active_devices", "energy_kwh"]])
        clusters = self.model.predict(scaled)
        df = df.assign(cluster=clusters)

        # Order clusters by mean energy so labels are stable + meaningful.
        means = df.groupby("cluster")["energy_kwh"].mean().sort_values()
        label_map = {c: name for c, name in zip(means.index, ["idle", "baseline", "peak"][: self.n_clusters])}

        hourly = df.groupby("hour")["energy_kwh"].mean()
        peak_hours = hourly.sort_values(ascending=False).head(3).index.tolist()
        total = float(df["energy_kwh"].sum())
        peak = float(df["energy_kwh"].max())
        avg = float(df["energy_kwh"].mean())
        load_factor = round(avg / peak, 4) if peak > 0 else 0.0

        return {
            "total_kwh": round(total, 4),
            "average_kwh": round(avg, 4),
            "peak_kwh": round(peak, 4),
            "load_factor": load_factor,
            "peak_hours": [int(h) for h in peak_hours],
            "clusters": [
                {
                    "label": label_map[int(c)],
                    "share": round(float((clusters == c).mean()), 4),
                    "avg_kwh": round(float(df.loc[df.cluster == c, "energy_kwh"].mean()), 4),
                }
                for c in sorted(df["cluster"].unique())
            ],
        }
