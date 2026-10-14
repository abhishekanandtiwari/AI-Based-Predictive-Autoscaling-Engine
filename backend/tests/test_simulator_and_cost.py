import pytest
import pandas as pd
from backend.app.ml.data_generator import generate_synthetic_workload
from backend.app.simulation.simulator import AutoscalingSimulator
from backend.app.autoscaling.engine import AutoscalingPolicy
from backend.app.services.cost_service import CostOptimizationService

def test_comparative_simulation_results():
    df = generate_synthetic_workload(days=7, seed=42)
    policy = AutoscalingPolicy()
    simulator = AutoscalingSimulator(policy)

    results = simulator.run_comparative_simulation(df)
    scorecard = results["scorecard"]

    assert "predictive" in scorecard
    assert "reactive" in scorecard
    assert "comparison" in scorecard

    # Predictive autoscaling should have significantly fewer SLA breaches / overload events
    # than reactive scaling which experiences boot delays
    pred_overloads = scorecard["predictive"]["overload_events"]
    react_overloads = scorecard["reactive"]["overload_events"]
    assert pred_overloads <= react_overloads

    # P99 latency should be lower for predictive
    assert scorecard["predictive"]["p99_latency_ms"] <= scorecard["reactive"]["p99_latency_ms"]

def test_cost_optimization_service():
    projections = CostOptimizationService.calculate_cost_projections(
        predictive_replica_hours=280.0,
        reactive_replica_hours=350.0,
        peak_replicas=12,
        duration_hours=72,
        cost_per_replica_hour=0.05
    )

    monthly = projections["monthly_30d"]
    assert monthly["predictive"] < monthly["reactive"]
    assert monthly["predictive"] < monthly["static_peak"]
    assert monthly["savings_vs_reactive_usd"] > 0
    assert monthly["savings_vs_reactive_pct"] > 0

    csv_data = CostOptimizationService.generate_cost_csv(projections)
    assert "Hourly Cost ($)" in csv_data
    assert "Monthly Savings vs Reactive ($)" in csv_data
