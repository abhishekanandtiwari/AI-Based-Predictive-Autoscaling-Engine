import numpy as np
import pandas as pd
from typing import Tuple, List

FEATURE_COLUMNS = [
    "hour",
    "day_of_week",
    "is_weekend",
    "hour_sin",
    "hour_cos",
    "day_sin",
    "day_cos",
    "lag_1h",
    "lag_2h",
    "lag_3h",
    "lag_24h",
    "lag_168h",
    "rolling_mean_3h",
    "rolling_mean_6h",
    "rolling_mean_24h",
    "rolling_std_24h",
    "cpu_lag_1h",
    "mem_lag_1h",
]

TARGET_COLUMN = "request_count"

def create_features(df: pd.DataFrame, dropna: bool = True) -> pd.DataFrame:
    """
    Transforms raw workload timeseries into backward-looking supervised ML features.
    Strictly avoids data leakage: all temporal lag and rolling features are shifted.
    """
    data = df.copy()
    if not pd.api.types.is_datetime64_any_dtype(data["timestamp"]):
        data["timestamp"] = pd.to_datetime(data["timestamp"])

    data = data.sort_values("timestamp").reset_index(drop=True)

    # 1. Calendar / Cyclical features
    data["hour"] = data["timestamp"].dt.hour
    data["day_of_week"] = data["timestamp"].dt.dayofweek
    data["is_weekend"] = data["day_of_week"].isin([5, 6]).astype(int)

    # Cyclical trigonometric transforms for periodic continuity
    data["hour_sin"] = np.sin(2 * np.pi * data["hour"] / 24.0)
    data["hour_cos"] = np.cos(2 * np.pi * data["hour"] / 24.0)
    data["day_sin"] = np.sin(2 * np.pi * data["day_of_week"] / 7.0)
    data["day_cos"] = np.cos(2 * np.pi * data["day_of_week"] / 7.0)

    # 2. Lag features (Shifted backward)
    data["lag_1h"] = data[TARGET_COLUMN].shift(1)
    data["lag_2h"] = data[TARGET_COLUMN].shift(2)
    data["lag_3h"] = data[TARGET_COLUMN].shift(3)
    data["lag_24h"] = data[TARGET_COLUMN].shift(24)
    data["lag_168h"] = data[TARGET_COLUMN].shift(168) # 1 week ago

    # 3. Rolling statistics (Shifted by 1 so current target is never in rolling window)
    shifted = data[TARGET_COLUMN].shift(1)
    data["rolling_mean_3h"] = shifted.rolling(window=3, min_periods=1).mean()
    data["rolling_mean_6h"] = shifted.rolling(window=6, min_periods=1).mean()
    data["rolling_mean_24h"] = shifted.rolling(window=24, min_periods=1).mean()
    data["rolling_std_24h"] = shifted.rolling(window=24, min_periods=1).std().fillna(0.0)

    # 4. Resource utilization lags
    if "cpu_utilization" in data.columns:
        data["cpu_lag_1h"] = data["cpu_utilization"].shift(1)
    else:
        data["cpu_lag_1h"] = 50.0

    if "memory_utilization" in data.columns:
        data["mem_lag_1h"] = data["memory_utilization"].shift(1)
    else:
        data["mem_lag_1h"] = 50.0

    # Backfill earliest missing lags if not dropping NA (e.g. for short inference segments)
    for col in ["lag_168h", "lag_24h", "lag_3h", "lag_2h", "lag_1h"]:
        if col in data.columns:
            data[col] = data[col].bfill()

    data["cpu_lag_1h"] = data["cpu_lag_1h"].bfill().fillna(50.0)
    data["mem_lag_1h"] = data["mem_lag_1h"].bfill().fillna(50.0)

    if dropna:
        data = data.dropna().reset_index(drop=True)

    return data

def prepare_train_test_split(
    df: pd.DataFrame,
    test_ratio: float = 0.20
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.DataFrame, pd.DataFrame]:
    """
    Performs chronological train/test splitting (strictly avoiding shuffle).
    Returns X_train, X_test, y_train, y_test, train_df, test_df
    """
    feat_df = create_features(df, dropna=True)
    n = len(feat_df)
    split_idx = int(n * (1.0 - test_ratio))

    train_df = feat_df.iloc[:split_idx].copy()
    test_df = feat_df.iloc[split_idx:].copy()

    X_train = train_df[FEATURE_COLUMNS]
    y_train = train_df[TARGET_COLUMN]

    X_test = test_df[FEATURE_COLUMNS]
    y_test = test_df[TARGET_COLUMN]

    return X_train, X_test, y_train, y_test, train_df, test_df
