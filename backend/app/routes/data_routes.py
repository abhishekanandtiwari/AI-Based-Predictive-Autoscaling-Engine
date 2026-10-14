import os
import io
import pandas as pd
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file, current_app
from backend.app.extensions import db
from backend.app.models.metrics import WorkloadMetrics
from backend.app.ml.data_generator import generate_synthetic_workload
from backend.app.services.simulation_manager import simulation_session

data_bp = Blueprint("data", __name__, url_prefix="/api/data")

@data_bp.route("/generate", methods=["POST"])
def generate_data_endpoint():
    data = request.get_json() or {}
    days = int(data.get("days", 60))
    seed = int(data.get("seed", 42))

    out_path = current_app.config["GENERATED_DATA_PATH"]
    df = generate_synthetic_workload(days=days, seed=seed, output_path=str(out_path))

    # Also prime the live simulation session with the generated workload
    simulation_session.load_workload(df["request_count"].tolist(), seed=seed)

    # Populate database metrics in batch
    try:
        WorkloadMetrics.query.delete()
        records = []
        for _, row in df.head(1000).iterrows(): # Store first 1000 in DB for rapid queries
            records.append(WorkloadMetrics(
                timestamp=pd.to_datetime(row["timestamp"]),
                request_count=float(row["request_count"]),
                cpu_utilization=float(row["cpu_utilization"]),
                memory_utilization=float(row["memory_utilization"]),
                response_time=float(row["response_time"]),
                error_rate=float(row.get("error_rate", 0.0)),
                active_users=int(row.get("active_users", 0)),
                throughput=float(row.get("network_throughput", 0.0)),
                replica_count=int(row.get("replica_count", 2)),
                data_source="synthetic"
            ))
        db.session.bulk_save_objects(records)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.warning(f"DB population note: {e}")

    return jsonify({
        "message": f"Successfully generated {len(df)} synthetic hourly workload observations ({days} days).",
        "rows": len(df),
        "days": days,
        "features": list(df.columns),
        "preview": df.head(10).to_dict(orient="records"),
        "is_synthetic": True
    }), 201

@data_bp.route("/history", methods=["GET"])
def get_historical_data():
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 50))
    source = request.args.get("source", None)

    out_path = current_app.config["GENERATED_DATA_PATH"]
    if not os.path.exists(out_path):
        # Generate on the fly if file does not exist yet
        df = generate_synthetic_workload(days=60, output_path=str(out_path))
        simulation_session.load_workload(df["request_count"].tolist())
    else:
        df = pd.read_csv(out_path)

    total_records = len(df)
    start_idx = (page - 1) * per_page
    end_idx = min(start_idx + per_page, total_records)

    slice_df = df.iloc[start_idx:end_idx]
    records = slice_df.to_dict(orient="records")

    return jsonify({
        "page": page,
        "per_page": per_page,
        "total_records": total_records,
        "total_pages": int((total_records + per_page - 1) / per_page),
        "data": records
    }), 200

@data_bp.route("/summary", methods=["GET"])
def get_data_summary():
    out_path = current_app.config["GENERATED_DATA_PATH"]
    if not os.path.exists(out_path):
        df = generate_synthetic_workload(days=60, output_path=str(out_path))
        simulation_session.load_workload(df["request_count"].tolist())
    else:
        df = pd.read_csv(out_path)

    summary = {
        "total_observations": int(len(df)),
        "time_range": {
            "start": str(df["timestamp"].iloc[0]),
            "end": str(df["timestamp"].iloc[-1]),
        },
        "request_count": {
            "min": round(float(df["request_count"].min()), 1),
            "max": round(float(df["request_count"].max()), 1),
            "mean": round(float(df["request_count"].mean()), 1),
            "std": round(float(df["request_count"].std()), 1),
        },
        "cpu_utilization": {
            "min": round(float(df["cpu_utilization"].min()), 1),
            "max": round(float(df["cpu_utilization"].max()), 1),
            "mean": round(float(df["cpu_utilization"].mean()), 1),
        },
        "memory_utilization": {
            "min": round(float(df["memory_utilization"].min()), 1),
            "max": round(float(df["memory_utilization"].max()), 1),
            "mean": round(float(df["memory_utilization"].mean()), 1),
        },
        "response_time_ms": {
            "min": round(float(df["response_time"].min()), 1),
            "max": round(float(df["response_time"].max()), 1),
            "mean": round(float(df["response_time"].mean()), 1),
        },
        "data_source_label": "Synthetic Multi-Seasonal Simulation (No paid cloud dependency)"
    }
    return jsonify(summary), 200

@data_bp.route("/upload", methods=["POST"])
def upload_csv():
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    try:
        df = pd.read_csv(file)
        # Validate essential columns
        if "timestamp" not in df.columns or "request_count" not in df.columns:
            return jsonify({
                "error": "CSV must contain at least 'timestamp' and 'request_count' columns."
            }), 400

        # Backfill standard columns if missing
        if "cpu_utilization" not in df.columns:
            df["cpu_utilization"] = 55.0
        if "memory_utilization" not in df.columns:
            df["memory_utilization"] = 45.0
        if "response_time" not in df.columns:
            df["response_time"] = 32.0

        out_path = current_app.config["GENERATED_DATA_PATH"]
        df.to_csv(out_path, index=False)
        simulation_session.load_workload(df["request_count"].tolist())

        return jsonify({
            "message": f"Successfully uploaded and validated {len(df)} records.",
            "columns": list(df.columns),
            "preview": df.head(5).to_dict(orient="records")
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to parse CSV: {str(e)}"}), 500

@data_bp.route("/export", methods=["GET"])
def export_dataset_csv():
    out_path = current_app.config["GENERATED_DATA_PATH"]
    if not os.path.exists(out_path):
        generate_synthetic_workload(days=60, output_path=str(out_path))

    return send_file(
        out_path,
        mimetype="text/csv",
        as_attachment=True,
        download_name="workload_telemetry_dataset.csv"
    )
