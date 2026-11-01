import threading
import time
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from backend.app.autoscaling.engine import AutoscalingPolicy, AutoscalingEngine

class LiveSimulationSession:
    """
    Manages an active real-time simulation session in memory.
    Enables play/pause/resume/step/reset, traffic spike injection, and deterministic seeds.
    """
    def __init__(self, session_id: str = "default"):
        self.session_id = session_id
        self.lock = threading.RLock()
        self.policy = AutoscalingPolicy()
        self.engine = AutoscalingEngine(self.policy)
        self.status = "idle" # 'idle', 'running', 'paused', 'stopped'
        self.current_step = 0
        self.speed = 1.0 # 1x, 2x, 5x, 10x
        self.traffic_multiplier = 1.0
        self.spike_active_steps = 0
        self.spike_factor = 1.0
        self.workload_series = []
        self.history = []
        self.provisioning_delay = 1
        
        # State tracking
        self.pred_replicas = 2
        self.react_replicas = 2
        self.pending_reactive = []
        self.pred_cooldown = 999
        self.react_cooldown = 999

    def load_workload(self, series: list, seed: Optional[int] = 42):
        with self.lock:
            self.workload_series = list(series)
            self.reset(seed)

    def reset(self, seed: Optional[int] = 42):
        with self.lock:
            if seed is not None:
                np.random.seed(seed)
            self.status = "idle"
            self.current_step = 0
            self.traffic_multiplier = 1.0
            self.spike_active_steps = 0
            self.spike_factor = 1.0
            self.history = []
            self.pending_reactive = []
            self.pred_cooldown = 999
            self.react_cooldown = 999
            
            init_req = self.workload_series[0] if len(self.workload_series) > 0 else 200.0
            init_rep = max(self.policy.min_replicas, int(np.ceil(init_req / (self.policy.capacity_per_replica * 0.70))))
            self.pred_replicas = init_rep
            self.react_replicas = init_rep

    def inject_spike(self, surge_multiplier: float = 2.5, duration_steps: int = 4):
        with self.lock:
            self.spike_factor = surge_multiplier
            self.spike_active_steps = duration_steps

    def step(self) -> Optional[Dict[str, Any]]:
        with self.lock:
            if not self.workload_series or self.current_step >= len(self.workload_series):
                self.status = "completed"
                return None

            t = self.current_step
            raw_req = self.workload_series[t]
            
            # Apply traffic multiplier and spike
            effective_mult = self.traffic_multiplier
            if self.spike_active_steps > 0:
                effective_mult *= self.spike_factor
                self.spike_active_steps -= 1

            actual_req = max(50.0, round(raw_req * effective_mult, 1))

            # Lookahead forecast for predictive
            if t + 1 < len(self.workload_series):
                next_req = self.workload_series[t + 1] * self.traffic_multiplier
                # If a spike is ongoing, predictive forecaster adapts rapidly
                if self.spike_active_steps > 0:
                    next_req *= self.spike_factor
                predicted_next = max(50.0, next_req + np.random.normal(0, 10.0))
            else:
                predicted_next = actual_req

            # 1. Predictive decision
            pred_dec = self.engine.calculate_predictive_replicas(
                predicted_demand=predicted_next,
                current_replicas=self.pred_replicas,
                periods_since_last_scale_down=self.pred_cooldown
            )
            target_pred = pred_dec["recommended_replicas"]
            if target_pred < self.pred_replicas:
                self.pred_cooldown = 0
            else:
                self.pred_cooldown += 1
            self.pred_replicas = target_pred

            pred_cap = self.pred_replicas * self.policy.capacity_per_replica
            p_cpu = min(99.0, max(12.0, (actual_req / pred_cap) * 100.0 + np.random.normal(0, 1.2)))
            u_p = p_cpu / 100.0
            p_lat = 25.0 + (u_p * 15.0) if u_p < 0.75 else (40.0 + (u_p - 0.75) * 200.0 if u_p < 0.90 else 70.0 + (u_p - 0.90) * 800.0)

            # 2. Reactive execution
            # Check newly booted instances
            booted = [rep for (ready_t, rep) in self.pending_reactive if ready_t <= t]
            if booted:
                self.react_replicas = booted[-1]
            self.pending_reactive = [(ready_t, rep) for (ready_t, rep) in self.pending_reactive if ready_t > t]

            react_cap = self.react_replicas * self.policy.capacity_per_replica
            r_cpu = min(99.9, max(12.0, (actual_req / react_cap) * 100.0 + np.random.normal(0, 1.5)))
            u_r = r_cpu / 100.0
            r_lat = 25.0 + (u_r * 15.0) if u_r < 0.75 else (40.0 + (u_r - 0.75) * 220.0 if u_r < 0.90 else 85.0 + (u_r - 0.90) * 1400.0)

            # Reactive decision
            react_dec = self.engine.calculate_reactive_replicas(
                current_demand=actual_req,
                current_cpu_utilization=r_cpu,
                current_replicas=self.react_replicas,
                periods_since_last_scale_down=self.react_cooldown
            )
            if react_dec["action"] == "SCALE_UP":
                target_r = react_dec["recommended_replicas"]
                if target_r > self.react_replicas:
                    self.pending_reactive.append((t + self.provisioning_delay, target_r))
            elif react_dec["action"] == "SCALE_DOWN":
                self.react_replicas = react_dec["recommended_replicas"]
                self.react_cooldown = 0
            else:
                self.react_cooldown += 1

            record = {
                "step": t,
                "request_count": actual_req,
                "predictive_replicas": self.pred_replicas,
                "reactive_replicas": self.react_replicas,
                "predictive_cpu": round(p_cpu, 1),
                "reactive_cpu": round(r_cpu, 1),
                "predictive_latency": round(p_lat, 1),
                "reactive_latency": round(r_lat, 1),
                "predictive_action": pred_dec["action"],
                "reactive_action": react_dec["action"],
                "predictive_reason": pred_dec["reason"],
                "reactive_reason": react_dec["reason"],
                "is_spike": self.spike_active_steps > 0 or self.spike_factor > 1.0,
            }
            self.history.append(record)
            self.current_step += 1
            return record

    def get_status(self) -> Dict[str, Any]:
        with self.lock:
            latest = self.history[-1] if self.history else None
            return {
                "session_id": self.session_id,
                "status": self.status,
                "current_step": self.current_step,
                "total_steps": len(self.workload_series),
                "speed": self.speed,
                "traffic_multiplier": self.traffic_multiplier,
                "spike_active": self.spike_active_steps > 0,
                "latest_step": latest,
                "history_length": len(self.history),
                "policy": self.policy.to_dict()
            }

simulation_session = LiveSimulationSession()
