import os
import pandas as pd
from flask import Blueprint, request, jsonify, current_app
from backend.app.extensions import db
from backend.app.models.evaluation import ModelEvaluationRecord
from backend.app.models.forecast import ForecastRecord
from backend.app.ml.forecasting import WorkloadForecaster
from backend.app.ml.data_generator import generate_synthetic_workload

forecast_bp = Blueprint("forecast", __name__, url_prefix="/api/forecast")

# In-memory cached forecaster instance
_cached_forecaster = None

def get_or_load_forecaster():
    global _cached_forecaster
    model_path = current_app.config["MODEL_PATH"]
    if _cached_forecaster is not None and _cached_forecaster.is_trained:
        return _cached_forecaster

    if os.path.exists(model_path):
        try:
            _cached_forecaster = WorkloadForecaster.load(str(model_path))
            return _cached_forecaster
        except Exception as e:
            current_app.logger.warning(f"Could not load saved model: {e}")

    # Initialize new
    _cached_forecaster = WorkloadForecaster()
    return _cached_forecaster

@forecast_bp.route("/train", methods=["POST"])
def train_model_endpoint():
    global _cached_forecaster
    data = request.get_json() or {}
    n_estimators = int(data.get("n_estimators", 100))
    max_depth = int(data.get("max_depth", 15))

    data_path = current_app.config["GENERATED_DATA_PATH"]
    if not os.path.exists(data_path):
        generate_synthetic_workload(days=60, output_path=str(data_path))

    df = pd.read_csv(data_path)
    forecaster = WorkloadForecaster(n_estimators=n_estimators, max_depth=max_depth)
    results = forecaster.train_and_evaluate(df)

    # Save model artifact
    model_path = current_app.config["MODEL_PATH"]
    forecaster.save(str(model_path))
    _cached_forecaster = forecaster

    # Record evaluation metrics in database
    try:
        primary_eval = results["primary_model"]
        rec = ModelEvaluationRecord(
            model_name="RandomForestRegressor",
            mae=primary_eval["mae"],
            rmse=primary_eval["rmse"],
            mape=primary_eval["mape"],
            r2_score=primary_eval.get("r2_score"),
            dataset_version="synthetic-v1.0"
        )
        db.session.add(rec)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.warning(f"Error persisting evaluation record: {e}")

    return jsonify({
        "message": "Forecasting model trained and evaluated successfully.",
        "results": results
    }), 200

@forecast_bp.route("/predict", methods=["GET", "POST"])
def predict_endpoint():
    horizon = int(request.args.get("horizon", 24))
    if request.is_json and request.get_json():
        horizon = int(request.get_json().get("horizon", horizon))

    # Supported horizons: 1, 6, 12, 24
    if horizon not in [1, 6, 12, 24, 48]:
        horizon = 24

    forecaster = get_or_load_forecaster()
    data_path = current_app.config["GENERATED_DATA_PATH"]
    if not os.path.exists(data_path):
        generate_synthetic_workload(days=60, output_path=str(data_path))

    df = pd.read_csv(data_path)

    # Ensure model is trained
    if not forecaster.is_trained:
        forecaster.train_and_evaluate(df)
        forecaster.save(str(current_app.config["MODEL_PATH"]))

    # Pass the last 300 observations to feed lags
    recent_df = df.tail(300)
    forecasts = forecaster.predict_next_horizons(recent_df, horizon_hours=horizon)

    # Compute key forecast highlights
    predicted_requests = [f["predicted_requests"] for f in forecasts]
    peak_demand = max(predicted_requests)
    peak_step = predicted_requests.index(peak_demand) + 1
    avg_demand = sum(predicted_requests) / len(predicted_requests)

    return jsonify({
        "horizon_hours": horizon,
        "peak_demand_requests": peak_demand,
        "peak_demand_hour": f"T+{peak_step}h",
        "average_forecasted_requests": round(avg_demand, 1),
        "overload_warnings_count": sum(1 for f in forecasts if f["overload_risk"]),
        "forecasts": forecasts,
        "historical_context": df.tail(24)[["timestamp", "request_count", "cpu_utilization"]].to_dict(orient="records"),
    }), 200

@forecast_bp.route("/metrics", methods=["GET"])
def get_metrics_endpoint():
    forecaster = get_or_load_forecaster()
    data_path = current_app.config["GENERATED_DATA_PATH"]
    if not os.path.exists(data_path):
        generate_synthetic_workload(days=60, output_path=str(data_path))

    df = pd.read_csv(data_path)
    if not forecaster.is_trained or not getattr(forecaster, "test_predictions_sample", None):
        results = forecaster.train_and_evaluate(df)
        forecaster.save(str(current_app.config["MODEL_PATH"]))
    else:
        results = {
            "primary_model": {"name": "Random Forest Regressor", **forecaster.evaluation_metrics},
            "baseline_model": {"name": "Baseline (24h Seasonal Lag)", **forecaster.baseline_metrics},
            "prediction_interval_bounds": {
                "p05_residual": round(forecaster.lower_error_quantile, 2),
                "p95_residual": round(forecaster.upper_error_quantile, 2),
                "explanation": "Calculated empirically from held-out validation residuals (90% coverage)"
            },
            "feature_importances": forecaster.feature_importances,
            "actual_vs_predicted": getattr(forecaster, "test_predictions_sample", [])
        }

    return jsonify(results), 200
