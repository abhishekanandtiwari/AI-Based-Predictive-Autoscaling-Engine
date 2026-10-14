import io
from flask import Blueprint, request, jsonify, Response, current_app
from backend.app.services.cost_service import CostOptimizationService
from backend.app.extensions import db
from backend.app.models.cost import CostReport

cost_bp = Blueprint("cost", __name__, url_prefix="/api/cost")

@cost_bp.route("/calculate", methods=["POST"])
def calculate_cost():
    data = request.get_json() or {}
    pred_hours = float(data.get("predictive_replica_hours", 280.0))
    react_hours = float(data.get("reactive_replica_hours", 340.0))
    peak_rep = int(data.get("peak_replicas", 12))
    duration = int(data.get("duration_hours", 72))
    unit_cost = float(data.get("cost_per_replica_hour", 0.05))

    projections = CostOptimizationService.calculate_cost_projections(
        predictive_replica_hours=pred_hours,
        reactive_replica_hours=react_hours,
        peak_replicas=peak_rep,
        duration_hours=duration,
        cost_per_replica_hour=unit_cost
    )

    return jsonify(projections), 200

@cost_bp.route("/compare", methods=["GET", "POST"])
def compare_cost():
    # If parameters sent, use them; otherwise use realistic standard 72h benchmark defaults
    data = request.get_json() or {} if request.is_json else {}
    pred_hours = float(data.get("predictive_replica_hours", request.args.get("predictive_replica_hours", 276.0)))
    react_hours = float(data.get("reactive_replica_hours", request.args.get("reactive_replica_hours", 338.0)))
    peak_rep = int(data.get("peak_replicas", request.args.get("peak_replicas", 10)))
    duration = int(data.get("duration_hours", request.args.get("duration_hours", 72)))
    unit_cost = float(data.get("cost_per_replica_hour", request.args.get("cost_per_replica_hour", 0.05)))

    projections = CostOptimizationService.calculate_cost_projections(
        predictive_replica_hours=pred_hours,
        reactive_replica_hours=react_hours,
        peak_replicas=peak_rep,
        duration_hours=duration,
        cost_per_replica_hour=unit_cost
    )

    return jsonify(projections), 200

@cost_bp.route("/export", methods=["GET"])
def export_cost_csv():
    pred_hours = float(request.args.get("predictive_replica_hours", 276.0))
    react_hours = float(request.args.get("reactive_replica_hours", 338.0))
    peak_rep = int(request.args.get("peak_replicas", 10))
    duration = int(request.args.get("duration_hours", 72))
    unit_cost = float(request.args.get("cost_per_replica_hour", 0.05))

    projections = CostOptimizationService.calculate_cost_projections(
        predictive_replica_hours=pred_hours,
        reactive_replica_hours=react_hours,
        peak_replicas=peak_rep,
        duration_hours=duration,
        cost_per_replica_hour=unit_cost
    )

    csv_data = CostOptimizationService.generate_cost_csv(projections)

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=autoscaling_cost_analysis.csv"}
    )
