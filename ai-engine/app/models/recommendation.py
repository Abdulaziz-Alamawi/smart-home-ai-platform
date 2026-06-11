"""
Recommendation Engine.

Synthesises the outputs of the other AI modules (usage analysis, anomaly
detection, cost optimisation) into prioritised, human-readable, actionable
recommendations with estimated impact.
"""
from __future__ import annotations


class RecommendationEngine:
    def generate(
        self,
        *,
        usage: dict | None = None,
        anomalies: list[dict] | None = None,
        cost: dict | None = None,
    ) -> list[dict]:
        recs: list[dict] = []

        if cost and cost.get("estimated_savings", 0) > 0:
            pct = cost.get("savings_pct", 0)
            recs.append(
                {
                    "id": "cost-shift-load",
                    "category": "cost",
                    "priority": "high" if pct >= 15 else "medium",
                    "title": "Shift deferrable load to off-peak hours",
                    "message": (
                        f"Running flexible appliances overnight could cut your bill by "
                        f"~{pct}% (≈ {cost.get('estimated_savings')} per day)."
                    ),
                    "estimated_savings": cost.get("estimated_savings"),
                }
            )

        if usage:
            load_factor = usage.get("load_factor", 1.0)
            if load_factor < 0.4:
                recs.append(
                    {
                        "id": "usage-peaky-profile",
                        "category": "efficiency",
                        "priority": "medium",
                        "title": "Smooth out spiky consumption",
                        "message": (
                            f"Your load factor is {load_factor}. Spreading high-power "
                            "appliance use reduces demand peaks and stress on devices."
                        ),
                        "estimated_savings": None,
                    }
                )
            peaks = usage.get("peak_hours", [])
            if peaks:
                recs.append(
                    {
                        "id": "usage-peak-hours",
                        "category": "efficiency",
                        "priority": "low",
                        "title": "Automate around your peak hours",
                        "message": (
                            f"Most energy is consumed around hours {peaks}. Add automation "
                            "rules to pre-cool/heat before peaks and idle devices afterwards."
                        ),
                        "estimated_savings": None,
                    }
                )

        if anomalies:
            anomalous = [a for a in anomalies if a.get("is_anomaly")]
            if anomalous:
                recs.append(
                    {
                        "id": "anomaly-investigate",
                        "category": "safety",
                        "priority": "high",
                        "title": "Investigate abnormal energy readings",
                        "message": (
                            f"Detected {len(anomalous)} abnormal reading(s). A device may be "
                            "stuck on, faulty, or a sensor may be failing."
                        ),
                        "estimated_savings": None,
                    }
                )

        if not recs:
            recs.append(
                {
                    "id": "all-good",
                    "category": "info",
                    "priority": "low",
                    "title": "Your home is running efficiently",
                    "message": "No significant savings or anomalies detected in the current window.",
                    "estimated_savings": None,
                }
            )

        order = {"high": 0, "medium": 1, "low": 2}
        recs.sort(key=lambda r: order.get(r["priority"], 3))
        return recs
