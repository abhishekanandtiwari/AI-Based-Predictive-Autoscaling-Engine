import os
import pandas as pd
from flask import Blueprint, request, jsonify, current_app
from backend.app.extensions import db
from backend.app.models.scaling import ScalingEvent
from backend.app.autoscaling.engine import AutoscalingEngine, AutoscalingPolicy
from backend.app.simulation.simulator import AutoscalingSimulator
from backend.app.ml.data_generator import generate_synthetic_workload

autoscaling_bp = Blueprint("autoscaling", __name__, url_prefix="/api/autoscaling")

@autoscaling_bp.route("/recommend", methods=["POST"])
def get_recommendation():
    data = request.get_json() or {}
    mode = data.get("mode", "predictive")
    demand = float(data.get("demand", 500.0))
    current_replicas = int(data.get("current_replicas", 2))
    current_cpu = float(data.get("current_cpu", 65.0))

    policy = AutoscalingPolicy(
        capacity_per_replica=float(data.get("capacity_per_replica", 250.0)),
        target_cpu=float(data.get("target_cpu", 70.0)),
        min_replicas=int(data.get("min_replicas", 2)),
        max_replicas=int(data.get("max_replicas", 25)),
        safety_buffer=float(data.get("safety_buffer", 0.15)),
        cooldown_periods=int(data.get("cooldown_periods", 3))
    )

    engine = AutoscalingEngine(policy)

    if mode == "predictive":
        result = engine.calculate_predictive_replicas(
            predicted_demand=demand,
            current_replicas=current_replicas
        )
    else:
        result = engine.calculate_reactive_replicas(
            current_demand=demand,
            current_cpu_utilization=current_cpu,
            current_replicas=current_replicas
        )

    # Log scaling event to DB
    try:
        ev = ScalingEvent(
            scaling_mode=result["mode"],
            previous_replica_count=result["current_replicas"],
            recommended_replica_count=result["recommended_replicas"],
            action=result["action"],
            reason=result["reason"],
            predicted_demand=result.get("predicted_demand") or result.get("observed_demand"),
            estimated_utilization=result.get("expected_utilization")
        )
        db.session.add(ev)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.warning(f"Error logging scaling event: {e}")

    return jsonify(result), 200

@autoscaling_bp.route("/compare", methods=["POST", "GET"])
def run_comparison():
    data = request.get_json() or {} if request.is_json else {}
    duration_hours = int(data.get("duration_hours", request.args.get("duration_hours", 72))) # default 72 hours (3 days)
    
    policy = AutoscalingPolicy(
        capacity_per_replica=float(data.get("capacity_per_replica", 250.0)),
        target_cpu=float(data.get("target_cpu", 70.0)),
        min_replicas=int(data.get("min_replicas", 2)),
        max_replicas=int(data.get("max_replicas", 25)),
        safety_buffer=float(data.get("safety_buffer", 0.15)),
        cooldown_periods=int(data.get("cooldown_periods", 3)),
        cost_per_replica_hour=float(data.get("cost_per_replica_hour", 0.05))
    )

    data_path = current_app.config["GENERATED_DATA_PATH"]
    if not os.path.exists(data_path):
        generate_synthetic_workload(days=60, output_path=str(data_path))

    df = pd.read_csv(data_path)
    sample_slice = df.tail(min(duration_hours, len(df)))

    simulator = AutoscalingSimulator(policy)
    results = simulator.run_comparative_simulation(sample_slice)

    return jsonify(results), 200

@autoscaling_bp.route("/events", methods=["GET"])
def get_scaling_events():
    events = ScalingEvent.query.order_by(ScalingEvent.timestamp.desc()).limit(100).all()
    return jsonify([e.to_dict() for e in events]), 200
