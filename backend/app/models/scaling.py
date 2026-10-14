from datetime import datetime, timezone
from backend.app.extensions import db

class ScalingEvent(db.Model):
    __tablename__ = "scaling_events"

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    scaling_mode = db.Column(db.String(50), nullable=False) # 'predictive' or 'reactive'
    previous_replica_count = db.Column(db.Integer, nullable=False)
    recommended_replica_count = db.Column(db.Integer, nullable=False)
    action = db.Column(db.String(20), nullable=False) # 'SCALE_UP', 'SCALE_DOWN', 'MAINTAIN'
    reason = db.Column(db.Text, nullable=False)
    predicted_demand = db.Column(db.Float, nullable=True)
    estimated_utilization = db.Column(db.Float, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "scaling_mode": self.scaling_mode,
            "previous_replica_count": self.previous_replica_count,
            "recommended_replica_count": self.recommended_replica_count,
            "action": self.action,
            "reason": self.reason,
            "predicted_demand": round(self.predicted_demand, 2) if self.predicted_demand is not None else None,
            "estimated_utilization": round(self.estimated_utilization, 2) if self.estimated_utilization is not None else None,
        }
