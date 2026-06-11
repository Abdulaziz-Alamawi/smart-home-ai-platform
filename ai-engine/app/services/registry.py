"""
Model registry.

Trains every model, persists artifacts to disk with joblib, and lazily loads
them at runtime. If artifacts are missing (e.g. first boot) the registry
trains on the fly so the API is always functional.
"""
from __future__ import annotations

import threading

import joblib

from app.config import settings
from app.models.anomaly_detection import AnomalyDetector
from app.models.cost_optimization import CostOptimizer
from app.models.device_usage import DeviceUsageAnalyzer
from app.models.energy_prediction import EnergyPredictor
from app.models.recommendation import RecommendationEngine
from app.models.smart_scheduling import SmartScheduler

_ENERGY_FILE = "energy_predictor.joblib"
_ANOMALY_FILE = "anomaly_detector.joblib"
_USAGE_FILE = "device_usage.joblib"


class ModelRegistry:
    """Singleton-style holder for all trained models."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.energy: EnergyPredictor | None = None
        self.anomaly: AnomalyDetector | None = None
        self.usage: DeviceUsageAnalyzer | None = None
        self.scheduler: SmartScheduler | None = None
        self.cost = CostOptimizer()
        self.recommender = RecommendationEngine()
        self.metrics: dict = {}

    # ---- training ----------------------------------------------------
    def train_all(self, persist: bool = True, seed: int | None = None) -> dict:
        seed = seed if seed is not None else settings.random_seed
        energy = EnergyPredictor()
        energy_report = energy.train(seed=seed)

        anomaly = AnomalyDetector()
        anomaly_report = anomaly.train(seed=seed)

        usage = DeviceUsageAnalyzer()
        usage_report = usage.train(seed=seed)

        with self._lock:
            self.energy = energy
            self.anomaly = anomaly
            self.usage = usage
            self.scheduler = SmartScheduler(energy)
            self.metrics = {
                "energy_prediction": energy_report.__dict__,
                "anomaly_detection": anomaly_report.__dict__,
                "device_usage": usage_report.__dict__,
            }

        if persist:
            model_dir = settings.ensure_model_dir()
            joblib.dump(energy, model_dir / _ENERGY_FILE)
            joblib.dump(anomaly, model_dir / _ANOMALY_FILE)
            joblib.dump(usage, model_dir / _USAGE_FILE)
            joblib.dump(self.metrics, model_dir / "metrics.joblib")

        return self.metrics

    # ---- loading -----------------------------------------------------
    def load_or_train(self) -> None:
        model_dir = settings.ensure_model_dir()
        energy_path = model_dir / _ENERGY_FILE
        anomaly_path = model_dir / _ANOMALY_FILE
        usage_path = model_dir / _USAGE_FILE
        if energy_path.exists() and anomaly_path.exists() and usage_path.exists():
            try:
                with self._lock:
                    self.energy = joblib.load(energy_path)
                    self.anomaly = joblib.load(anomaly_path)
                    self.usage = joblib.load(usage_path)
                    self.scheduler = SmartScheduler(self.energy)
                    metrics_path = model_dir / "metrics.joblib"
                    self.metrics = joblib.load(metrics_path) if metrics_path.exists() else {}
                return
            except Exception:  # corrupt artifacts -> retrain
                pass
        self.train_all(persist=True)

    @property
    def is_ready(self) -> bool:
        return all([self.energy, self.anomaly, self.usage, self.scheduler])


registry = ModelRegistry()
