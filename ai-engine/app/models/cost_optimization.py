"""
Cost Optimization.

Given an actual hourly consumption profile and a time-of-use tariff, this
module computes current cost, the theoretical minimum cost achievable by
shifting deferrable load to off-peak hours, and the realisable savings.
"""
from __future__ import annotations

from app.models.smart_scheduling import default_tariff_schedule


class CostOptimizer:
    def optimize(
        self,
        hourly_kwh: list[float],
        tariff: list[float] | None = None,
        deferrable_ratio: float = 0.35,
    ) -> dict:
        if len(hourly_kwh) != 24:
            raise ValueError("hourly_kwh must contain exactly 24 values")
        tariff = tariff or default_tariff_schedule()
        if len(tariff) != 24:
            raise ValueError("tariff must contain exactly 24 hourly prices")
        if not 0.0 <= deferrable_ratio <= 1.0:
            raise ValueError("deferrable_ratio must be between 0 and 1")

        current_cost = sum(k * t for k, t in zip(hourly_kwh, tariff))

        # Split each hour's load into fixed + deferrable parts.
        fixed = [k * (1 - deferrable_ratio) for k in hourly_kwh]
        deferrable_total = sum(k * deferrable_ratio for k in hourly_kwh)

        # Cost of the fixed (non-shiftable) load.
        fixed_cost = sum(f * t for f, t in zip(fixed, tariff))

        # Pour all deferrable energy into the cheapest hours first.
        cheapest_hours = sorted(range(24), key=lambda h: tariff[h])
        remaining = deferrable_total
        # Assume each hour can absorb at most 1.6x the average load.
        capacity = max(hourly_kwh) * 1.6 if hourly_kwh else 0.0
        shifted_cost = 0.0
        plan = [0.0] * 24
        for h in cheapest_hours:
            if remaining <= 0:
                break
            place = min(remaining, capacity)
            plan[h] = round(place, 4)
            shifted_cost += place * tariff[h]
            remaining -= place
        # Any leftover stays at average price.
        if remaining > 0:
            shifted_cost += remaining * (sum(tariff) / 24)

        optimized_cost = fixed_cost + shifted_cost
        savings = current_cost - optimized_cost

        peak_hour = max(range(24), key=lambda h: hourly_kwh[h] * tariff[h])
        return {
            "current_cost": round(current_cost, 4),
            "optimized_cost": round(optimized_cost, 4),
            "estimated_savings": round(max(savings, 0.0), 4),
            "savings_pct": round(100 * savings / current_cost, 2) if current_cost else 0.0,
            "most_expensive_hour": int(peak_hour),
            "recommended_shift_plan": plan,
        }
