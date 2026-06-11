"""
Synthetic smart-home telemetry generator.

The generator produces an hourly energy-consumption time series for a
household whose load is driven by realistic factors:

* daily seasonality (morning + evening peaks),
* weekly seasonality (weekends differ from weekdays),
* annual seasonality (heating in winter, cooling in summer),
* outdoor temperature,
* household occupancy,
* number of active devices,
* random noise.

The same generator is reused by every model so that the engine trains on a
single coherent "physical" world rather than disconnected mock numbers.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

DEVICE_CATALOG = [
    # name, base power (kW), typical active hours
    ("hvac", 2.2, list(range(6, 9)) + list(range(17, 23))),
    ("water_heater", 1.8, [6, 7, 8, 19, 20, 21]),
    ("refrigerator", 0.15, list(range(0, 24))),
    ("washing_machine", 0.8, [10, 11, 18, 19]),
    ("dishwasher", 1.1, [13, 20, 21]),
    ("lighting", 0.4, list(range(17, 24)) + [6, 7]),
    ("ev_charger", 7.0, [0, 1, 2, 3, 22, 23]),
    ("entertainment", 0.3, list(range(18, 24))),
]


def _temperature_series(index: pd.DatetimeIndex, rng: np.random.Generator) -> np.ndarray:
    """Outdoor temperature in Celsius with annual + daily cycles."""
    day_of_year = index.dayofyear.to_numpy()
    hour = index.hour.to_numpy()
    annual = 12.0 * np.sin(2 * np.pi * (day_of_year - 110) / 365.0) + 14.0
    daily = 4.0 * np.sin(2 * np.pi * (hour - 9) / 24.0)
    noise = rng.normal(0, 1.2, size=len(index))
    return annual + daily + noise


def _occupancy_series(index: pd.DatetimeIndex, rng: np.random.Generator) -> np.ndarray:
    """Number of occupants at home (0-5)."""
    hour = index.hour.to_numpy()
    weekend = (index.dayofweek.to_numpy() >= 5).astype(float)
    base = np.where((hour < 7) | (hour >= 22), 3.0, 1.0)
    base = np.where((hour >= 17) & (hour < 22), 3.5, base)
    base = base + weekend * 1.2
    occ = np.clip(base + rng.normal(0, 0.4, len(index)), 0, 5)
    return np.round(occ)


def generate_energy_dataframe(
    days: int = 180,
    seed: int = 42,
    start: str = "2024-01-01",
) -> pd.DataFrame:
    """
    Generate an hourly energy dataframe.

    Returns columns:
        timestamp, hour, day_of_week, month, is_weekend,
        temperature, occupancy, active_devices, energy_kwh
    """
    rng = np.random.default_rng(seed)
    periods = days * 24
    index = pd.date_range(start=start, periods=periods, freq="h")

    temperature = _temperature_series(index, rng)
    occupancy = _occupancy_series(index, rng)

    hour = index.hour.to_numpy()
    dow = index.dayofweek.to_numpy()
    month = index.month.to_numpy()
    is_weekend = (dow >= 5).astype(int)

    energy = np.zeros(periods, dtype=float)
    active_devices = np.zeros(periods, dtype=float)

    for _, base_power, active_hours in DEVICE_CATALOG:
        active_mask = np.isin(hour, active_hours).astype(float)
        # Probability the device truly runs in an "active" hour.
        prob = 0.55 + 0.35 * (occupancy / 5.0)
        draws = rng.random(periods)
        running = (active_mask > 0) & (draws < prob)
        # Refrigerator runs continuously.
        if base_power == 0.15:
            running = np.ones(periods, dtype=bool)
        energy += running * base_power * (0.85 + 0.3 * rng.random(periods))
        active_devices += running.astype(float)

    # Thermal load: HVAC scales with deviation from a 21C comfort band.
    thermal = np.maximum(np.abs(temperature - 21.0) - 3.0, 0) * 0.12
    energy += thermal

    # Occupancy baseline load.
    energy += occupancy * 0.08

    # Random measurement noise, clipped to be non-negative.
    energy = np.maximum(energy + rng.normal(0, 0.15, periods), 0.05)

    return pd.DataFrame(
        {
            "timestamp": index,
            "hour": hour,
            "day_of_week": dow,
            "month": month,
            "is_weekend": is_weekend,
            "temperature": np.round(temperature, 2),
            "occupancy": occupancy,
            "active_devices": active_devices,
            "energy_kwh": np.round(energy, 4),
        }
    )


FEATURE_COLUMNS = [
    "hour",
    "day_of_week",
    "month",
    "is_weekend",
    "temperature",
    "occupancy",
    "active_devices",
]


def inject_anomalies(
    df: pd.DataFrame, fraction: float = 0.03, seed: int = 7
) -> pd.DataFrame:
    """Return a copy of df with a labelled `is_anomaly` column and spikes."""
    rng = np.random.default_rng(seed)
    out = df.copy()
    n = len(out)
    n_anom = max(1, int(n * fraction))
    idx = rng.choice(n, size=n_anom, replace=False)
    labels = np.zeros(n, dtype=int)
    energy = out["energy_kwh"].to_numpy(copy=True)
    # Spikes (stuck device / fault) and dropouts (sensor failure).
    for i in idx:
        if rng.random() < 0.7:
            energy[i] = energy[i] * rng.uniform(3.0, 6.0) + 5.0
        else:
            energy[i] = energy[i] * rng.uniform(0.0, 0.05)
        labels[i] = 1
    out["energy_kwh"] = np.round(energy, 4)
    out["is_anomaly"] = labels
    return out
