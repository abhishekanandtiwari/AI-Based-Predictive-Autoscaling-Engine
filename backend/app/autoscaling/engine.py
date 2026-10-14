import math
from typing import Dict, Any, Optional

class AutoscalingPolicy:
    """
    Encapsulates tunable autoscaling parameters.
    """
    def __init__(
        self,
        capacity_per_replica: float = 250.0,
        target_cpu: float = 70.0,
        min_replicas: int = 2,
        max_replicas: int = 25,
        safety_buffer: float = 0.15,
        cooldown_periods: int = 3,
        scale_up_threshold_cpu: float = 80.0,
        scale_down_threshold_cpu: float = 50.0,
        cost_per_replica_hour: float = 0.05
    ):
        self.capacity_per_replica = capacity_per_replica
        self.target_cpu = target_cpu
        self.min_replicas = min_replicas
        self.max_replicas = max_replicas
        self.safety_buffer = safety_buffer
        self.cooldown_periods = cooldown_periods
        self.scale_up_threshold_cpu = scale_up_threshold_cpu
        self.scale_down_threshold_cpu = scale_down_threshold_cpu
        self.cost_per_replica_hour = cost_per_replica_hour

    def to_dict(self) -> Dict[str, Any]:
        return {
            "capacity_per_replica": self.capacity_per_replica,
            "target_cpu": self.target_cpu,
            "min_replicas": self.min_replicas,
            "max_replicas": self.max_replicas,
            "safety_buffer": self.safety_buffer,
            "cooldown_periods": self.cooldown_periods,
            "scale_up_threshold_cpu": self.scale_up_threshold_cpu,
            "scale_down_threshold_cpu": self.scale_down_threshold_cpu,
            "cost_per_replica_hour": self.cost_per_replica_hour,
        }

class AutoscalingEngine:
    """
    Implements mathematical decision logic for both Predictive and Reactive autoscaling.
    Provides transparent mathematical formulas and human-readable decision explanations.
    """
    def __init__(self, policy: Optional[AutoscalingPolicy] = None):
        self.policy = policy or AutoscalingPolicy()

    def calculate_predictive_replicas(
        self,
        predicted_demand: float,
        current_replicas: int,
        periods_since_last_scale_down: int = 999
    ) -> Dict[str, Any]:
        """
        Predictive Autoscaling Formula:
        Replicas_raw = ceil( (Predicted_Demand / (Safe_Capacity * (Target_CPU / 100))) * (1 + Safety_Buffer) )
        Bounded by [Min_Replicas, Max_Replicas].
        Applies cooldown to prevent rapid downscale oscillation.
        """
        safe_capacity = self.policy.capacity_per_replica * (self.policy.target_cpu / 100.0)
        unbuffered_replicas = predicted_demand / safe_capacity
        buffered_replicas = unbuffered_replicas * (1.0 + self.policy.safety_buffer)
        raw_target = int(math.ceil(buffered_replicas))

        # Clamp within configured floor and ceiling
        recommended = max(self.policy.min_replicas, min(self.policy.max_replicas, raw_target))

        # Expected CPU utilization at this recommended replica count
        expected_utilization = min(100.0, (predicted_demand / (recommended * self.policy.capacity_per_replica)) * 100.0)

        # Decision & Explanation Logic
        if recommended > current_replicas:
            action = "SCALE_UP"
            reason = (
                f"Proactive scale-up: Forecasted demand of {predicted_demand:.1f} req/s requires {recommended} replicas "
                f"to maintain CPU around {self.policy.target_cpu}% with a {int(self.policy.safety_buffer*100)}% safety buffer "
                f"(Current capacity: {current_replicas * self.policy.capacity_per_replica:.0f} req/s)."
            )
        elif recommended < current_replicas:
            if periods_since_last_scale_down < self.policy.cooldown_periods:
                action = "MAINTAIN"
                recommended = current_replicas
                reason = (
                    f"Cooldown lock active ({periods_since_last_scale_down}/{self.policy.cooldown_periods} periods elapsed). "
                    f"Deferring scale-down to {raw_target} replicas to prevent thrashing."
                )
            else:
                action = "SCALE_DOWN"
                reason = (
                    f"Proactive scale-down: Forecasted demand decreased to {predicted_demand:.1f} req/s. "
                    f"Reducing from {current_replicas} to {recommended} replicas saves cost while keeping CPU at ~{expected_utilization:.1f}%."
                )
        else:
            action = "MAINTAIN"
            reason = (
                f"Capacity optimal: {current_replicas} replicas comfortably satisfy predicted {predicted_demand:.1f} req/s "
                f"at {expected_utilization:.1f}% expected CPU utilization."
            )

        return {
            "mode": "predictive",
            "current_replicas": current_replicas,
            "recommended_replicas": recommended,
            "action": action,
            "reason": reason,
            "predicted_demand": round(predicted_demand, 2),
            "expected_utilization": round(expected_utilization, 2),
            "safe_capacity_total": round(recommended * safe_capacity, 1),
        }

    def calculate_reactive_replicas(
        self,
        current_demand: float,
        current_cpu_utilization: float,
        current_replicas: int,
        consecutive_high_cpu: int = 0,
        periods_since_last_scale_down: int = 999
    ) -> Dict[str, Any]:
        """
        Reactive Autoscaling Formula (Standard Horizontal Pod Autoscaler style):
        Replicas_target = ceil( Current_Replicas * (Current_CPU / Target_CPU) )
        Reacts only when CPU breaches threshold (> scale_up_threshold_cpu or < scale_down_threshold_cpu).
        """
        ratio = current_cpu_utilization / self.policy.target_cpu
        raw_target = int(math.ceil(current_replicas * ratio))
        clamped_target = max(self.policy.min_replicas, min(self.policy.max_replicas, raw_target))

        if current_cpu_utilization >= self.policy.scale_up_threshold_cpu:
            recommended = max(current_replicas + 1, clamped_target)
            recommended = min(self.policy.max_replicas, recommended)
            action = "SCALE_UP"
            reason = (
                f"Reactive alert: Observed CPU utilization is high ({current_cpu_utilization:.1f}% >= {self.policy.scale_up_threshold_cpu}%). "
                f"Scaling up immediately from {current_replicas} to {recommended} instances."
            )
        elif current_cpu_utilization <= self.policy.scale_down_threshold_cpu and current_replicas > self.policy.min_replicas:
            if periods_since_last_scale_down < self.policy.cooldown_periods:
                recommended = current_replicas
                action = "MAINTAIN"
                reason = (
                    f"Low utilization detected ({current_cpu_utilization:.1f}%), but scale-down delayed by cooldown "
                    f"({periods_since_last_scale_down}/{self.policy.cooldown_periods} periods)."
                )
            else:
                recommended = max(self.policy.min_replicas, clamped_target)
                action = "SCALE_DOWN"
                reason = (
                    f"Reactive downscale: Observed CPU is low ({current_cpu_utilization:.1f}% <= {self.policy.scale_down_threshold_cpu}%). "
                    f"Downscaling from {current_replicas} to {recommended} replicas."
                )
        else:
            recommended = current_replicas
            action = "MAINTAIN"
            reason = (
                f"Utilization stable: Current CPU ({current_cpu_utilization:.1f}%) is within bounds "
                f"[{self.policy.scale_down_threshold_cpu}%, {self.policy.scale_up_threshold_cpu}%]. Maintaining {current_replicas} replicas."
            )

        expected_utilization = min(100.0, (current_demand / (recommended * self.policy.capacity_per_replica)) * 100.0)

        return {
            "mode": "reactive",
            "current_replicas": current_replicas,
            "recommended_replicas": recommended,
            "action": action,
            "reason": reason,
            "observed_demand": round(current_demand, 2),
            "observed_cpu": round(current_cpu_utilization, 2),
            "expected_utilization": round(expected_utilization, 2),
        }
