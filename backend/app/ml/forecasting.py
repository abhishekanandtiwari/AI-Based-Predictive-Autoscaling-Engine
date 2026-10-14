import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from backend.app.ml.feature_engineering import (
    create_features,
    prepare_train_test_split,
    FEATURE_COLUMNS,
    TARGET_COLUMN,
)

def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """
    Computes standard regression metrics with division-by-zero safeguards.
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)

    mae = float(mean_absolute_error(y_t, y_p))
    rmse = float(np.sqrt(mean_squared_error(y_t, y_p)))
    
    # Safe MAPE with epsilon = 1.0 to prevent inflation when y_true is very small
    epsilon = 1.0
    mape = float(np.mean(np.abs((y_t - y_p) / np.maximum(np.abs(y_t), epsilon))) * 100.0)
    r2 = float(r2_score(y_t, y_p))

    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "mape": round(mape, 2),
        "r2_score": round(r2, 4),
    }

class BaselineSeasonalModel:
    """
    Simple Baseline Model: Predicts the workload observed 24 hours ago (same hour yesterday).
    Used as an academic benchmark to evaluate the value added by Random Forest.
    """
    def __init__(self):
        self.name = "BaselineSeasonalLag"

    def fit(self, X: pd.DataFrame, y: pd.Series):
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        # If lag_24h is available, use it; otherwise fallback to rolling_mean_3h or mean
        if "lag_24h" in X.columns:
            return X["lag_24h"].values
        elif "rolling_mean_3h" in X.columns:
            return X["rolling_mean_3h"].values
        return np.full(len(X), 300.0)

class WorkloadForecaster:
    """
    Production-grade Machine Learning Forecaster utilizing Random Forest Regressor.
    Includes empirical prediction intervals, multi-step autoregressive rollout,
    and feature importance tracking.
    """
    def __init__(
        self,
        n_estimators: int = 100,
        max_depth: int = 15,
        random_state: int = 42
    ):
        self.model_name = "RandomForestRegressor"
        self.version = "v1.2"
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.random_state = random_state
        self.model = RandomForestRegressor(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            random_state=self.random_state,
            n_jobs=-1
        )
        self.is_trained = False
        self.lower_error_quantile = -25.0
        self.upper_error_quantile = 25.0
        self.evaluation_metrics = {}
        self.baseline_metrics = {}
        self.feature_importances = {}
        self.test_predictions_sample = []

    def train_and_evaluate(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Trains model on chronological split, evaluates against baseline,
        calculates empirical error quantiles for prediction intervals.
        """
        X_train, X_test, y_train, y_test, train_df, test_df = prepare_train_test_split(df)

        # 1. Fit primary Random Forest
        self.model.fit(X_train, y_train)
        self.is_trained = True

        y_pred = self.model.predict(X_test)
        self.evaluation_metrics = calculate_metrics(y_test.values, y_pred)

        # 2. Evaluate Baseline model on the exact same test split
        baseline = BaselineSeasonalModel()
        y_base_pred = baseline.predict(X_test)
        self.baseline_metrics = calculate_metrics(y_test.values, y_base_pred)

        # 3. Calculate empirical residual percentiles (90% prediction interval)
        residuals = y_test.values - y_pred
        self.lower_error_quantile = float(np.percentile(residuals, 5))
        self.upper_error_quantile = float(np.percentile(residuals, 95))

        # 4. Extract feature importances
        importances = self.model.feature_importances_
        self.feature_importances = {
            col: round(float(imp), 4) for col, imp in zip(FEATURE_COLUMNS, importances)
        }

        # 5. Extract chronological test evaluation sequence for visualization
        sample_size = min(72, len(y_test))
        test_ts = test_df["timestamp"].astype(str).tolist() if "timestamp" in test_df.columns else [f"T+{i}" for i in range(len(y_test))]
        start_idx = max(0, len(y_test) - sample_size)
        self.test_predictions_sample = [
            {
                "timestamp": test_ts[i],
                "step": idx + 1,
                "actual_requests": round(float(y_test.values[i]), 1),
                "predicted_requests": round(float(y_pred[i]), 1),
                "baseline_requests": round(float(y_base_pred[i]), 1),
                "residual_error": round(float(y_test.values[i] - y_pred[i]), 1),
            }
            for idx, i in enumerate(range(start_idx, len(y_test)))
        ]

        # Format comparison table
        comparison = {
            "primary_model": {
                "name": "Random Forest Regressor",
                **self.evaluation_metrics
            },
            "baseline_model": {
                "name": "Baseline (24h Seasonal Lag)",
                **self.baseline_metrics
            },
            "improvement_pct": {
                "mae_reduction": round(((self.baseline_metrics["mae"] - self.evaluation_metrics["mae"]) / max(self.baseline_metrics["mae"], 0.01)) * 100.0, 2),
                "rmse_reduction": round(((self.baseline_metrics["rmse"] - self.evaluation_metrics["rmse"]) / max(self.baseline_metrics["rmse"], 0.01)) * 100.0, 2),
                "mape_reduction": round(self.baseline_metrics["mape"] - self.evaluation_metrics["mape"], 2),
            },
            "prediction_interval_bounds": {
                "p05_residual": round(self.lower_error_quantile, 2),
                "p95_residual": round(self.upper_error_quantile, 2),
                "explanation": "Calculated empirically from held-out validation residuals (90% coverage)"
            },
            "feature_importances": self.feature_importances,
            "actual_vs_predicted": self.test_predictions_sample
        }

        return comparison

    def predict_next_horizons(
        self,
        historical_df: pd.DataFrame,
        horizon_hours: int = 24
    ) -> List[Dict[str, Any]]:
        """
        Generates autoregressive multi-step forecasts for the specified horizon (1, 6, 12, 24 hours).
        Feeds each prediction forward into lag features iteratively.
        """
        if not self.is_trained:
            raise ValueError("Model is not trained yet. Call train_and_evaluate() first.")

        data = historical_df.copy()
        if not pd.api.types.is_datetime64_any_dtype(data["timestamp"]):
            data["timestamp"] = pd.to_datetime(data["timestamp"])
        data = data.sort_values("timestamp").reset_index(drop=True)

        last_timestamp = data["timestamp"].iloc[-1]
        forecasts = []

        # Maintain working rolling buffer
        working_df = data.copy()

        for step in range(1, horizon_hours + 1):
            next_ts = last_timestamp + pd.Timedelta(hours=step)
            
            # Append placeholder row to compute shifted features correctly
            placeholder_row = {
                "timestamp": next_ts,
                TARGET_COLUMN: np.nan,
                "cpu_utilization": working_df["cpu_utilization"].iloc[-1],
                "memory_utilization": working_df["memory_utilization"].iloc[-1],
            }
            temp_df = pd.concat([working_df, pd.DataFrame([placeholder_row])], ignore_index=True)
            feat_df = create_features(temp_df, dropna=False)
            
            latest_feature_vector = feat_df.iloc[-1:][FEATURE_COLUMNS]

            pred_val = float(self.model.predict(latest_feature_vector)[0])
            pred_val = max(50.0, round(pred_val, 1))

            # Empirical prediction interval
            lower_bound = max(20.0, round(pred_val + self.lower_error_quantile, 1))
            upper_bound = round(pred_val + self.upper_error_quantile, 1)

            # Estimate expected CPU utilization if scaled with typical 2-replica floor and 250 cap
            est_replicas = max(2, int(np.ceil(pred_val / (250.0 * 0.70))))
            est_cpu = round(min(99.0, (pred_val / (est_replicas * 250.0)) * 70.0), 1)

            trend_indicator = "STABLE"
            if step > 1 and len(forecasts) > 0:
                prev_val = forecasts[-1]["predicted_requests"]
                pct_change = ((pred_val - prev_val) / prev_val) * 100.0
                if pct_change > 8.0:
                    trend_indicator = "SURGING"
                elif pct_change < -8.0:
                    trend_indicator = "DECLINING"

            entry = {
                "step": step,
                "target_timestamp": next_ts.isoformat(),
                "predicted_requests": pred_val,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
                "estimated_cpu_percent": est_cpu,
                "recommended_replicas": est_replicas,
                "trend": trend_indicator,
                "overload_risk": est_cpu > 80.0
            }
            forecasts.append(entry)

            # Fill in target column and update working_df for next recursive step
            temp_df.loc[temp_df.index[-1], TARGET_COLUMN] = pred_val
            working_df = temp_df

        return forecasts

    def save(self, filepath: str):
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, filepath)

    @classmethod
    def load(cls, filepath: str) -> "WorkloadForecaster":
        return joblib.load(filepath)
