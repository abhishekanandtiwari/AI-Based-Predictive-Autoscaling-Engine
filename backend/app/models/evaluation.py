from datetime import datetime, timezone
from backend.app.extensions import db

class ModelEvaluationRecord(db.Model):
    __tablename__ = "model_evaluation_records"

    id = db.Column(db.Integer, primary_key=True)
    model_name = db.Column(db.String(100), nullable=False) # 'RandomForestRegressor' or 'BaselineLagModel'
    evaluation_timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    mae = db.Column(db.Float, nullable=False)
    rmse = db.Column(db.Float, nullable=False)
    mape = db.Column(db.Float, nullable=False)
    r2_score = db.Column(db.Float, nullable=True)
    dataset_version = db.Column(db.String(50), default="synthetic-v1.0")

    def to_dict(self):
        return {
            "id": self.id,
            "model_name": self.model_name,
            "evaluation_timestamp": self.evaluation_timestamp.isoformat() if self.evaluation_timestamp else None,
            "mae": round(self.mae, 4),
            "rmse": round(self.rmse, 4),
            "mape": round(self.mape, 4),
            "r2_score": round(self.r2_score, 4) if self.r2_score is not None else None,
            "dataset_version": self.dataset_version,
        }
