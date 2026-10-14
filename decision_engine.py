"""
decision_engine.py
--------------------
The "brain" that turns a predicted workload number into an actual scaling
recommendation: how many server replicas should be running.

This is deliberately simple and explainable -- in a real system this logic
would call the Kubernetes API or a cloud auto scaling group API instead of
just returning a number.
"""

import math
import pandas as pd

# --- Tunable parameters -------------------------------------------------
CAPACITY_PER_REPLICA = 25   # how many requests/sec one replica can comfortably handle
SAFETY_MARGIN = 1.2         # scale a bit above the raw forecast (20% headroom)
MIN_REPLICAS = 2            # never scale below this (availability floor)
MAX_REPLICAS = 20           # cost/safety ceiling
# -------------------------------------------------------------------------


def recommend_replicas(predicted_load: float) -> int:
    """Given a predicted requests/sec value, return the recommended replica count."""
    raw_needed = (predicted_load * SAFETY_MARGIN) / CAPACITY_PER_REPLICA
    replicas = math.ceil(raw_needed)
    replicas = max(MIN_REPLICAS, min(MAX_REPLICAS, replicas))
    return replicas


def apply_to_forecast(forecast_df: pd.DataFrame) -> pd.DataFrame:
    """Adds a recommended_replicas column to a forecast dataframe."""
    df = forecast_df.copy()
    df["recommended_replicas"] = df["predicted_load"].apply(recommend_replicas)
    return df


if __name__ == "__main__":
    forecast_df = pd.read_csv("forecast_output.csv")
    result = apply_to_forecast(forecast_df)
    print(result.to_string(index=False))
    result.to_csv("scaling_recommendations.csv", index=False)
    print("\nSaved -> scaling_recommendations.csv")
