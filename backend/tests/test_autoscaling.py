import pytest
from backend.app.autoscaling.engine import AutoscalingEngine, AutoscalingPolicy

def test_predictive_scaling_bounds_and_cooldown():
    policy = AutoscalingPolicy(
        capacity_per_replica=250.0,
        target_cpu=70.0,
        min_replicas=2,
        max_replicas=10,
        safety_buffer=0.15,
        cooldown_periods=3
    )
    engine = AutoscalingEngine(policy)

    # 1. Very low demand should be clamped to min_replicas (2)
    dec_low = engine.calculate_predictive_replicas(predicted_demand=50.0, current_replicas=2)
    assert dec_low["recommended_replicas"] == 2
    assert dec_low["action"] == "MAINTAIN"

    # 2. High demand should trigger SCALE_UP
    dec_high = engine.calculate_predictive_replicas(predicted_demand=1200.0, current_replicas=2)
    assert dec_high["recommended_replicas"] > 2
    assert dec_high["action"] == "SCALE_UP"
    assert "Proactive scale-up" in dec_high["reason"]

    # 3. Super extreme demand should not exceed max_replicas (10)
    dec_extreme = engine.calculate_predictive_replicas(predicted_demand=10000.0, current_replicas=5)
    assert dec_extreme["recommended_replicas"] == 10

    # 4. Downscale during active cooldown should maintain current replicas
    dec_cool = engine.calculate_predictive_replicas(
        predicted_demand=200.0,
        current_replicas=6,
        periods_since_last_scale_down=1 # < cooldown_periods (3)
    )
    assert dec_cool["recommended_replicas"] == 6
    assert dec_cool["action"] == "MAINTAIN"
    assert "Cooldown lock active" in dec_cool["reason"]

def test_reactive_scaling_thresholds():
    policy = AutoscalingPolicy(
        capacity_per_replica=250.0,
        target_cpu=70.0,
        scale_up_threshold_cpu=80.0,
        scale_down_threshold_cpu=50.0,
        cooldown_periods=3
    )
    engine = AutoscalingEngine(policy)

    # High CPU (> 80%) triggers SCALE_UP
    dec_up = engine.calculate_reactive_replicas(
        current_demand=800.0,
        current_cpu_utilization=88.0,
        current_replicas=3
    )
    assert dec_up["action"] == "SCALE_UP"
    assert dec_up["recommended_replicas"] > 3

    # Normal CPU (65%) maintains
    dec_ok = engine.calculate_reactive_replicas(
        current_demand=500.0,
        current_cpu_utilization=65.0,
        current_replicas=3
    )
    assert dec_ok["action"] == "MAINTAIN"

    # Low CPU (< 50%) after cooldown triggers SCALE_DOWN
    dec_down = engine.calculate_reactive_replicas(
        current_demand=200.0,
        current_cpu_utilization=40.0,
        current_replicas=5,
        periods_since_last_scale_down=5
    )
    assert dec_down["action"] == "SCALE_DOWN"
    assert dec_down["recommended_replicas"] < 5
