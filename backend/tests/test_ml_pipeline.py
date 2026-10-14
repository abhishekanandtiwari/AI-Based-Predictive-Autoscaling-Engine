import pytest
import pandas as pd
import numpy as np
from backend.app.ml.data_generator import generate_synthetic_workload
from backend.app.ml.feature_engineering import create_features, prepare_train_test_split, FEATURE_COLUMNS
from backend.app.ml.forecasting import WorkloadForecaster, calculate_metrics

@pytest.fixture(scope="module")
def workload_df():
    return generate_synthetic_workload(days=21, seed=99)

def test_feature_engineering_no_leakage(workload_df):
    feat_df = create_features(workload_df, dropna=True)
    for col in FEATURE_COLUMNS:
        assert col in feat_df.columns, f"Feature column {col} missing"

    # Verify lag_1h is equal to shifted target
    assert np.isclose(feat_df["lag_1h"].iloc[5], feat_df["request_count"].iloc[4])

def test_chronological_split(workload_df):
    X_train, X_test, y_train, y_test, train_df, test_df = prepare_train_test_split(workload_df, test_ratio=0.20)
    assert len(X_train) + len(X_test) == len(train_df) + len(test_df)
    # Ensure test timestamps are strictly after train timestamps
    assert train_df["timestamp"].max() < test_df["timestamp"].min()

def test_forecaster_training_and_horizons(workload_df):
    forecaster = WorkloadForecaster(n_estimators=20, max_depth=8, random_state=42)
    results = forecaster.train_and_evaluate(workload_df)

    assert "primary_model" in results
    assert "baseline_model" in results
    assert results["primary_model"]["mae"] > 0
    assert results["primary_model"]["mape"] > 0

    # Test multi-horizon prediction
    forecasts_24h = forecaster.predict_next_horizons(workload_df.tail(100), horizon_hours=24)
    assert len(forecasts_24h) == 24
    for f in forecasts_24h:
        assert f["predicted_requests"] > 0
        assert f["lower_bound"] <= f["upper_bound"]
        assert f["recommended_replicas"] >= 2
