import os
import pandas as pd
from flask import Blueprint, request, jsonify, current_app
from backend.app.services.simulation_manager import simulation_session
from backend.app.ml.data_generator import generate_synthetic_workload
from backend.app.autoscaling.engine import AutoscalingPolicy

simulation_bp = Blueprint("simulation", __name__, url_prefix="/api/simulation")

def ensure_workload_loaded():
    if not simulation_session.workload_series:
        data_path = current_app.config["GENERATED_DATA_PATH"]
        if not os.path.exists(data_path):
            generate_synthetic_workload(days=60, output_path=str(data_path))
        df = pd.read_csv(data_path)
        simulation_session.load_workload(df["request_count"].tolist())

@simulation_bp.route("/start", methods=["POST"])
def start_simulation():
    ensure_workload_loaded()
    data = request.get_json() or {}
    seed = data.get("seed", 42)
    speed = float(data.get("speed", 1.0))
    multiplier = float(data.get("traffic_multiplier", 1.0))

    simulation_session.reset(seed=seed)
    simulation_session.speed = speed
    simulation_session.traffic_multiplier = multiplier
    simulation_session.status = "running"

    # Execute first 5 steps to provide initial chart view
    for _ in range(5):
        simulation_session.step()

    return jsonify({
        "message": "Simulation started",
        "status": simulation_session.get_status()
    }), 200

@simulation_bp.route("/pause", methods=["POST"])
def pause_simulation():
    simulation_session.status = "paused"
    return jsonify({
        "message": "Simulation paused",
        "status": simulation_session.get_status()
    }), 200

@simulation_bp.route("/resume", methods=["POST"])
def resume_simulation():
    simulation_session.status = "running"
    return jsonify({
        "message": "Simulation resumed",
        "status": simulation_session.get_status()
    }), 200

@simulation_bp.route("/step", methods=["POST"])
def step_simulation():
    ensure_workload_loaded()
    data = request.get_json() or {}
    steps_count = int(data.get("steps", 1))

    results = []
    for _ in range(steps_count):
        rec = simulation_session.step()
        if rec:
            results.append(rec)
        else:
            break

    return jsonify({
        "steps_advanced": len(results),
        "latest_step": results[-1] if results else None,
        "status": simulation_session.get_status()
    }), 200

@simulation_bp.route("/reset", methods=["POST"])
def reset_simulation():
    ensure_workload_loaded()
    data = request.get_json() or {}
    seed = data.get("seed", 42)
    simulation_session.reset(seed=seed)
    return jsonify({
        "message": "Simulation reset to step 0",
        "status": simulation_session.get_status()
    }), 200

@simulation_bp.route("/inject-spike", methods=["POST"])
def inject_spike():
    data = request.get_json() or {}
    factor = float(data.get("factor", 2.5))
    duration = int(data.get("duration", 4))

    simulation_session.inject_spike(surge_multiplier=factor, duration_steps=duration)
    return jsonify({
        "message": f"Injected {factor}x traffic spike for {duration} time steps.",
        "spike_factor": factor,
        "duration": duration,
        "status": simulation_session.get_status()
    }), 200

@simulation_bp.route("/status", methods=["GET"])
def get_simulation_status():
    ensure_workload_loaded()
    return jsonify(simulation_session.get_status()), 200

@simulation_bp.route("/history", methods=["GET"])
def get_simulation_history():
    ensure_workload_loaded()
    limit = int(request.args.get("limit", 100))
    history_slice = simulation_session.history[-limit:] if simulation_session.history else []
    return jsonify({
        "total_steps": len(simulation_session.history),
        "history": history_slice
    }), 200
