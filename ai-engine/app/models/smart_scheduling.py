"""
Smart Scheduling.

Combines the trained energy predictor with a time-of-use tariff to find the
cheapest window in which to run a deferrable load (e.g. EV charger, washing
machine, dishwasher). This is a real optimisation over predicted demand and
price, not a heuristic guess.
"""
from __future__ import annotations

from app.models.energy_prediction import EnergyPredictor


def default_tariff_schedule(base: float = 0.18) -> list[float]:
    """A realistic 24-hour time-of-use tariff (price per kWh)."""
    schedule = []
    for hour in range(24):
        if 0 <= hour < 6:
            schedule.append(round(base * 0.55, 4))  # off-peak night
        elif 6 <= hour < 9 or 17 <= hour < 22:
            schedule.append(round(base * 1.6, 4))  # peak
        else:
            schedule.append(round(base * 1.0, 4))  # shoulder
    return schedule


class SmartScheduler:
    def __init__(self, predictor: EnergyPredictor) -> None:
        self.predictor = predictor

    def best_window(
        self,
        *,
        duration_hours: int,
        device_load_kw: float,
        day_of_week: int,
        month: int,
        temperature: float,
        occupancy: float,
        active_devices: float,
        tariff: list[float] | None = None,
        start_hour: int = 0,
    ) -> dict:
        if duration_hours < 1 or duration_hours > 24:
            raise ValueError("duration_hours must be between 1 and 24")
        tariff = tariff or default_tariff_schedule()
        if len(tariff) != 24:
            raise ValueError("tariff must contain exactly 24 hourly prices")

        forecast = self.predictor.predict_next_hours(
            start_hour=start_hour,
            day_of_week=day_of_week,
            month=month,
            temperature=temperature,
            occupancy=occupancy,
            active_devices=active_devices,
            horizon=24,
        )

        windows = []
        for begin in range(0, 24 - duration_hours + 1):
            hours = range(begin, begin + duration_hours)
            # Cost of running the deferrable device in this window.
            device_cost = sum(tariff[h % 24] * device_load_kw for h in hours)
            # Avoid stacking the new load on already-busy hours.
            grid_load = sum(forecast[h]["predicted_kwh"] for h in hours)
            windows.append(
                {
                    "start_hour": begin,
                    "end_hour": begin + duration_hours,
                    "device_cost": round(device_cost, 4),
                    "expected_grid_load_kwh": round(grid_load, 4),
                }
            )

        best = min(windows, key=lambda w: (w["device_cost"], w["expected_grid_load_kwh"]))
        worst = max(windows, key=lambda w: w["device_cost"])
        savings = round(worst["device_cost"] - best["device_cost"], 4)
        return {
            "recommended_start_hour": best["start_hour"],
            "recommended_end_hour": best["end_hour"],
            "estimated_cost": best["device_cost"],
            "max_possible_cost": worst["device_cost"],
            "estimated_savings": savings,
            "savings_pct": round(100 * savings / worst["device_cost"], 2) if worst["device_cost"] else 0.0,
            "all_windows": windows,
        }
