import pytest
import pandas as pd
import numpy as np
from backend.app.ml.data_generator import generate_synthetic_workload

def test_synthetic_data_schema_and_types():
    df = generate_synthetic_workload(days=7, seed=123)
    
    assert len(df) == 7 * 24
    expected_columns = [
        "timestamp",
        "request_count",
        "cpu_utilization",
        "memory_utilization",
        "response_time",
        "error_rate",
        "active_users",
        "network_throughput",
        "day_of_week",
        "hour_of_day",
        "replica_count",
        "data_source",
    ]
    for col in expected_columns:
        assert col in df.columns, f"Missing required column: {col}"

    assert (df["request_count"] > 0).all()
    assert (df["cpu_utilization"] >= 5.0).all() and (df["cpu_utilization"] <= 100.0).all()
    assert (df["memory_utilization"] >= 10.0).all() and (df["memory_utilization"] <= 100.0).all()
    assert (df["response_time"] >= 10.0).all()
    assert (df["replica_count"] >= 2).all()

def test_diurnal_and_spikes():
    df = generate_synthetic_workload(days=14, seed=42)
    # Afternoon hours (13:00 - 16:00) should on average have higher traffic than late night (02:00 - 05:00)
    afternoon = df[df["hour_of_day"].isin([13, 14, 15, 16])]["request_count"].mean()
    night = df[df["hour_of_day"].isin([2, 3, 4, 5])]["request_count"].mean()
    assert afternoon > night * 1.5, "Diurnal cycle is not exhibiting expected afternoon peak"
