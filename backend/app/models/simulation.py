import json
from datetime import datetime, timezone
from backend.app.extensions import db

class SimulationRun(db.Model):
    __tablename__ = "simulation_runs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    name = db.Column(db.String(100), default="Workload Autoscaling Simulation")
    configuration_json = db.Column(db.Text, nullable=False)
    start_time = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    end_time = db.Column(db.DateTime, nullable=True)
    simulation_status = db.Column(db.String(50), default="completed") # 'running', 'paused', 'completed', 'stopped'
    summary_metrics_json = db.Column(db.Text, nullable=True)

    cost_reports = db.relationship("CostReport", backref="simulation", lazy=True, cascade="all, delete-orphan")

    def get_configuration(self):
        return json.loads(self.configuration_json) if self.configuration_json else {}

    def set_configuration(self, config_dict):
        self.configuration_json = json.dumps(config_dict)

    def get_summary_metrics(self):
        return json.loads(self.summary_metrics_json) if self.summary_metrics_json else {}

    def set_summary_metrics(self, metrics_dict):
        self.summary_metrics_json = json.dumps(metrics_dict)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "configuration": self.get_configuration(),
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "simulation_status": self.simulation_status,
            "summary_metrics": self.get_summary_metrics(),
        }
