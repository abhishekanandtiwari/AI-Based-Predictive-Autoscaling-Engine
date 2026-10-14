from datetime import datetime, timezone
from backend.app.extensions import db

class ForecastRecord(db.Model):
    __tablename__ = "forecast_records"

    id = db.Column(db.Integer, primary_key=True)
    model_name = db.Column(db.String(100), nullable=False) # e.g. 'RandomForestRegressor'
    forecast_timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    target_timestamp = db.Column(db.DateTime, nullable=False, index=True)
    predicted_workload = db.Column(db.Float, nullable=False)
    actual_workload = db.Column(db.Float, nullable=True)
    interval_lower = db.Column(db.Float, nullable=True)
    interval_upper = db.Column(db.Float, nullable=True)
    model_version = db.Column(db.String(50), default="v1.0")

    def to_dict(self):
        return {
            "id": self.id,
            "model_name": self.model_name,
            "forecast_timestamp": self.forecast_timestamp.isoformat() if self.forecast_timestamp else None,
            "target_timestamp": self.target_timestamp.isoformat() if self.target_timestamp else None,
            "predicted_workload": round(self.predicted_workload, 2),
            "actual_workload": round(self.actual_workload, 2) if self.actual_workload is not None else None,
            "interval_lower": round(self.interval_lower, 2) if self.interval_lower is not None else None,
            "interval_upper": round(self.interval_upper, 2) if self.interval_upper is not None else None,
            "model_version": self.model_version,
        }
