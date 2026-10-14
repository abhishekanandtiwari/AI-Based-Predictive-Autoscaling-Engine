"""
features.py
------------
Turns raw timestamp + load data into features a machine learning model
can actually learn from: time-of-day, day-of-week, and lag features
(what was the load 1 hour ago / 24 hours ago / a week ago).
"""

import pandas as pd


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    df must have columns: timestamp, requests_per_sec
    Returns a new dataframe with engineered feature columns + the target.
    Rows without enough history for lag features are dropped.
    """
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)

    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    # Lag features: load N hours ago
    df["lag_1h"] = df["requests_per_sec"].shift(1)
    df["lag_24h"] = df["requests_per_sec"].shift(24)
    df["lag_168h"] = df["requests_per_sec"].shift(168)  # 1 week ago

    # Rolling average (short-term trend)
    df["rolling_mean_6h"] = df["requests_per_sec"].shift(1).rolling(window=6).mean()

    df = df.dropna().reset_index(drop=True)
    return df


FEATURE_COLUMNS = [
    "hour", "day_of_week", "is_weekend",
    "lag_1h", "lag_24h", "lag_168h", "rolling_mean_6h"
]
TARGET_COLUMN = "requests_per_sec"
