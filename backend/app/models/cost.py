import json
from datetime import datetime, timezone
from backend.app.extensions import db

class CostReport(db.Model):
    __tablename__ = "cost_reports"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    simulation_id = db.Column(db.Integer, db.ForeignKey("simulation_runs.id"), nullable=True)
    cost_assumptions_json = db.Column(db.Text, nullable=False)
    predictive_cost = db.Column(db.Float, nullable=False)
    reactive_cost = db.Column(db.Float, nullable=False)
    difference = db.Column(db.Float, nullable=False)
    savings_percentage = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def get_assumptions(self):
        return json.loads(self.cost_assumptions_json) if self.cost_assumptions_json else {}

    def set_assumptions(self, data):
        self.cost_assumptions_json = json.dumps(data)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "simulation_id": self.simulation_id,
            "assumptions": self.get_assumptions(),
            "predictive_cost": round(self.predictive_cost, 2),
            "reactive_cost": round(self.reactive_cost, 2),
            "difference": round(self.difference, 2),
            "savings_percentage": round(self.savings_percentage, 2),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
