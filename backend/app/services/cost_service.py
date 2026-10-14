import csv
import io
from typing import Dict, Any, List

class CostOptimizationService:
    """
    Computes fine-grained cloud expenditure analytics, comparing:
    1. Static Over-provisioning (always provisioned for peak load)
    2. Reactive Autoscaling (traditional CPU threshold scaling)
    3. Predictive Autoscaling (ML-forecasted demand matching)
    """

    @staticmethod
    def calculate_cost_projections(
        predictive_replica_hours: float,
        reactive_replica_hours: float,
        peak_replicas: int,
        duration_hours: int,
        cost_per_replica_hour: float = 0.05
    ) -> Dict[str, Any]:
        """
        Extrapolates costs over hourly, daily, and monthly (720h) intervals.
        """
        if duration_hours <= 0:
            duration_hours = 24

        # Average replicas per hour
        avg_pred_rep = predictive_replica_hours / duration_hours
        avg_react_rep = reactive_replica_hours / duration_hours

        # Hourly costs
        hourly_pred = avg_pred_rep * cost_per_replica_hour
        hourly_react = avg_react_rep * cost_per_replica_hour
        hourly_static = peak_replicas * cost_per_replica_hour

        # Daily costs (24 hours)
        daily_pred = hourly_pred * 24.0
        daily_react = hourly_react * 24.0
        daily_static = hourly_static * 24.0

        # Monthly costs (720 hours / 30 days)
        monthly_pred = hourly_pred * 720.0
        monthly_react = hourly_react * 720.0
        monthly_static = hourly_static * 720.0

        # Savings calculations with division-by-zero checks
        savings_vs_reactive = monthly_react - monthly_pred
        savings_vs_reactive_pct = (savings_vs_reactive / max(monthly_react, 0.01)) * 100.0 if monthly_react > 0 else 0.0

        savings_vs_static = monthly_static - monthly_pred
        savings_vs_static_pct = (savings_vs_static / max(monthly_static, 0.01)) * 100.0 if monthly_static > 0 else 0.0

        return {
            "parameters": {
                "cost_per_replica_hour": cost_per_replica_hour,
                "duration_hours": duration_hours,
                "peak_replicas": peak_replicas,
                "avg_predictive_replicas": round(avg_pred_rep, 2),
                "avg_reactive_replicas": round(avg_react_rep, 2),
            },
            "hourly": {
                "predictive": round(hourly_pred, 3),
                "reactive": round(hourly_react, 3),
                "static_peak": round(hourly_static, 3),
            },
            "daily": {
                "predictive": round(daily_pred, 2),
                "reactive": round(daily_react, 2),
                "static_peak": round(daily_static, 2),
            },
            "monthly_30d": {
                "predictive": round(monthly_pred, 2),
                "reactive": round(monthly_react, 2),
                "static_peak": round(monthly_static, 2),
                "savings_vs_reactive_usd": round(savings_vs_reactive, 2),
                "savings_vs_reactive_pct": round(savings_vs_reactive_pct, 1),
                "savings_vs_static_usd": round(savings_vs_static, 2),
                "savings_vs_static_pct": round(savings_vs_static_pct, 1),
            },
            "cost_breakdown_chart": [
                {"strategy": "Predictive Autoscaling (AI)", "monthly_cost": round(monthly_pred, 2)},
                {"strategy": "Reactive Autoscaling (HPA)", "monthly_cost": round(monthly_react, 2)},
                {"strategy": "Static Peak Provisioning", "monthly_cost": round(monthly_static, 2)},
            ]
        }

    @staticmethod
    def generate_cost_csv(projections: Dict[str, Any]) -> str:
        """
        Exports the cost projections as CSV string.
        """
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(["Metric", "Predictive (AI)", "Reactive (HPA)", "Static Peak Provisioning"])
        writer.writerow([
            "Hourly Cost ($)",
            projections["hourly"]["predictive"],
            projections["hourly"]["reactive"],
            projections["hourly"]["static_peak"]
        ])
        writer.writerow([
            "Daily Cost ($)",
            projections["daily"]["predictive"],
            projections["daily"]["reactive"],
            projections["daily"]["static_peak"]
        ])
        writer.writerow([
            "Monthly Cost ($ 30-day)",
            projections["monthly_30d"]["predictive"],
            projections["monthly_30d"]["reactive"],
            projections["monthly_30d"]["static_peak"]
        ])
        writer.writerow([])
        writer.writerow(["Key Performance Indicator", "Value"])
        writer.writerow(["Monthly Savings vs Reactive ($)", projections["monthly_30d"]["savings_vs_reactive_usd"]])
        writer.writerow(["Monthly Savings vs Reactive (%)", f"{projections['monthly_30d']['savings_vs_reactive_pct']}%"])
        writer.writerow(["Monthly Savings vs Static Peak ($)", projections["monthly_30d"]["savings_vs_static_usd"]])
        writer.writerow(["Monthly Savings vs Static Peak (%)", f"{projections['monthly_30d']['savings_vs_static_pct']}%"])
        writer.writerow(["Unit Cost per Replica Hour ($)", projections["parameters"]["cost_per_replica_hour"]])

        return output.getvalue()
