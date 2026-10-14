from datetime import datetime, timezone
from backend.app.extensions import db

class WorkloadMetrics(db.Model):
    __tablename__ = "workload_metrics"

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False, index=True)
    request_count = db.Column(db.Float, nullable=False)
    cpu_utilization = db.Column(db.Float, nullable=False)
    memory_utilization = db.Column(db.Float, nullable=False)
    response_time = db.Column(db.Float, nullable=False)  # in milliseconds
    error_rate = db.Column(db.Float, default=0.0)        # percentage e.g. 0.05%
    active_users = db.Column(db.Integer, default=0)
    throughput = db.Column(db.Float, default=0.0)        # MB/s
    replica_count = db.Column(db.Integer, default=2)
    data_source = db.Column(db.String(50), default="synthetic") # 'synthetic', 'uploaded', 'live'

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "request_count": round(self.request_count, 2),
            "cpu_utilization": round(self.cpu_utilization, 2),
            "memory_utilization": round(self.memory_utilization, 2),
            "response_time": round(self.response_time, 2),
            "error_rate": round(self.error_rate, 4),
            "active_users": self.active_users,
            "throughput": round(self.throughput, 2),
            "replica_count": self.replica_count,
            "data_source": self.data_source,
        }
