"""Application configuration loaded from environment variables."""
from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the AI engine."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Smart Home AI Engine"
    version: str = "1.0.0"
    ai_engine_port: int = 8010

    # Directory where trained model artifacts are persisted.
    model_dir: Path = Path(__file__).resolve().parent.parent / "models"

    # Default electricity tariff (currency unit per kWh) used when the
    # caller does not supply a custom tariff schedule.
    default_tariff: float = 0.18

    # Random seed for reproducible synthetic data + model training.
    random_seed: int = 42

    def ensure_model_dir(self) -> Path:
        self.model_dir.mkdir(parents=True, exist_ok=True)
        return self.model_dir


settings = Settings()
