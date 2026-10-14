"""
forecast.py
------------
Uses the trained model to forecast workload several hours into the future.
Since the model predicts one hour ahead at a time, we forecast recursively:
predict hour+1, feed that prediction back in as a lag feature, predict hour+2,
and so on.
"""

import pandas as pd
import joblib

from features import FEATURE_COLUMNS

MODEL_PATH = "forecast_model.joblib"
DATA_PATH = "workload_data.csv"


def load_model():
    return joblib.load(MODEL_PATH)


def forecast_next_hours(hours_ahead: int = 24, model=None, history: pd.DataFrame = None):
    """
    Returns a DataFrame with columns: timestamp, predicted_load
    for the next `hours_ahead` hours, using recursive forecasting.
    """
    if model is None:
        model = load_model()
    if history is None:
        history = pd.read_csv(DATA_PATH)
        history["timestamp"] = pd.to_datetime(history["timestamp"])

    history = history.sort_values("timestamp").reset_index(drop=True)
    series = history.set_index("timestamp")["requests_per_sec"].copy()

    last_timestamp = series.index[-1]
    predictions = []

    for step in range(1, hours_ahead + 1):
        next_ts = last_timestamp + pd.Timedelta(hours=step)

        lag_1h = series.iloc[-1]
        lag_24h = series.iloc[-24] if len(series) >= 24 else series.iloc[0]
        lag_168h = series.iloc[-168] if len(series) >= 168 else series.iloc[0]
        rolling_mean_6h = series.iloc[-6:].mean()

        feature_row = pd.DataFrame([{
            "hour": next_ts.hour,
            "day_of_week": next_ts.dayofweek,
            "is_weekend": int(next_ts.dayofweek >= 5),
            "lag_1h": lag_1h,
            "lag_24h": lag_24h,
            "lag_168h": lag_168h,
            "rolling_mean_6h": rolling_mean_6h,
        }])[FEATURE_COLUMNS]

        pred = model.predict(feature_row)[0]
        pred = max(pred, 0)  # load can't be negative

        predictions.append({"timestamp": next_ts, "predicted_load": round(pred, 1)})

        # Append this prediction to the series so it feeds the next step's lags
        series.loc[next_ts] = pred

    return pd.DataFrame(predictions)


if __name__ == "__main__":
    forecast_df = forecast_next_hours(hours_ahead=24)
    print(forecast_df.to_string(index=False))
    forecast_df.to_csv("forecast_output.csv", index=False)
    print("\nSaved -> forecast_output.csv")
