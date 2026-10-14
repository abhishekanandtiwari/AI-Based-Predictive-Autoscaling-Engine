import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path

def generate_synthetic_workload(
    days: int = 60,
    interval_minutes: int = 60,
    start_date: str = "2026-01-01 00:00:00",
    seed: int = 42,
    output_path: str = None
) -> pd.DataFrame:
    """
    Generates realistic multi-week synthetic cloud workload telemetry.
    Features:
    - Diurnal (daily) cyclical demand peaks (mid-afternoon) and troughs (late night)
    - Weekly seasonality (higher load weekdays, lower load weekends)
    - Upward organic growth trend
    - Gaussian traffic variance/noise
    - Sporadic flash-sale / promotional spikes
    - Low-traffic holiday / maintenance dips
    - Physically coupled server metrics: CPU, Memory, Latency, Error Rate
    """
    np.random.seed(seed)
    
    start_dt = pd.to_datetime(start_date)
    total_hours = days * 24
    timestamps = [start_dt + timedelta(hours=i) for i in range(total_hours)]
    n = len(timestamps)

    hours = np.array([ts.hour for ts in timestamps])
    day_of_weeks = np.array([ts.dayofweek for ts in timestamps])
    days_elapsed = np.array([(ts - start_dt).total_seconds() / 86400.0 for ts in timestamps])

    # 1. Base diurnal curve (peaks around 14:00 - 15:00, trough around 04:00)
    # Scaled sine wave shifted so min is around hour 4 and max around hour 15
    diurnal = 350 + 260 * np.sin((hours - 8) * 2 * np.pi / 24)
    # Secondary evening peak (streaming/social around 20:00)
    evening_peak = 70 * np.exp(-((hours - 20) ** 2) / 8)
    daily_pattern = np.maximum(diurnal + evening_peak, 120)

    # 2. Weekly seasonality (Mon-Thu: 1.05 - 1.15, Fri: 1.10, Sat: 0.75, Sun: 0.80)
    weekly_multipliers = np.array([1.08, 1.12, 1.15, 1.10, 1.05, 0.78, 0.82])
    weekly_factors = weekly_multipliers[day_of_weeks]

    # 3. Organic growth trend (+0.4% per day)
    trend = 1.0 + (days_elapsed * 0.005)

    # 4. Stochastic Gaussian noise
    noise = np.random.normal(loc=0, scale=35, size=n)

    # Base requests
    requests = (daily_pattern * weekly_factors * trend) + noise
    requests = np.maximum(requests, 80) # minimum floor

    # 5. Inject realistic flash sale / promo spikes (3-4 occurrences over 60 days)
    spike_locations = [15 * 24 + 14, 28 * 24 + 19, 45 * 24 + 12] # hour index
    for sp in spike_locations:
        if sp < n:
            spike_duration = 6
            for d in range(spike_duration):
                idx = sp + d
                if idx < n:
                    surge_factor = 2.4 - (d * 0.2)
                    requests[idx] *= surge_factor

    # 6. Inject occasional maintenance / holiday dip (e.g. day 35)
    dip_start = 35 * 24 + 2
    for d in range(5):
        if dip_start + d < n:
            requests[dip_start + d] *= 0.45

    requests = np.round(requests, 1)

    # 7. Coupled Infrastructure Metrics
    # Baseline server capacity = 250 req/sec per replica at 70% CPU
    # Simulate a baseline reactive deployment replica count for historical logs
    base_capacity = 250.0
    replicas = np.clip(np.ceil(requests / (base_capacity * 0.70)), 2, 20).astype(int)

    # CPU utilization: proportional to requests / total_capacity with noise
    total_capacity = replicas * base_capacity
    raw_cpu = (requests / total_capacity) * 70.0 + np.random.normal(0, 3.5, size=n)
    cpu_util = np.clip(raw_cpu, 12.0, 99.5)

    # Memory utilization: baseline ~35% + workload factor
    raw_mem = 35.0 + (requests / total_capacity) * 40.0 + np.random.normal(0, 2.0, size=n)
    mem_util = np.clip(raw_mem, 20.0, 96.0)

    # Response time: Base 28ms + non-linear hockey stick queueing delay when CPU > 75%
    # M/M/c queueing approximation
    response_time = np.zeros(n)
    for i in range(n):
        u = cpu_util[i] / 100.0
        if u < 0.75:
            rt = 25.0 + (u * 15.0) + np.random.normal(0, 2.0)
        elif u < 0.90:
            rt = 40.0 + ((u - 0.75) * 250.0) + np.random.normal(0, 8.0)
        else:
            # Overload threshold - steep latency spike
            rt = 80.0 + ((u - 0.90) * 1200.0) + np.random.normal(0, 25.0)
        response_time[i] = max(18.0, rt)

    # Error rate: < 0.05% normally, rises sharply if CPU > 88%
    error_rate = np.zeros(n)
    for i in range(n):
        if cpu_util[i] < 88.0:
            error_rate[i] = max(0.0, np.random.normal(0.02, 0.01))
        else:
            # Overload packet drops & timeouts
            error_rate[i] = (cpu_util[i] - 88.0) * 0.8 + np.random.normal(0.5, 0.2)

    # Active users (concurrent sessions): ~ 10-15x requests
    active_users = np.round(requests * np.random.uniform(9.0, 13.0, size=n)).astype(int)

    # Network throughput in MB/s: ~ requests * average payload 45KB
    throughput = np.round((requests * 45.0) / 1024.0, 2)

    df = pd.DataFrame({
        "timestamp": timestamps,
        "request_count": requests,
        "cpu_utilization": np.round(cpu_util, 2),
        "memory_utilization": np.round(mem_util, 2),
        "response_time": np.round(response_time, 2),
        "error_rate": np.round(error_rate, 4),
        "active_users": active_users,
        "network_throughput": throughput,
        "day_of_week": day_of_weeks,
        "hour_of_day": hours,
        "replica_count": replicas,
        "data_source": "synthetic"
    })

    if output_path:
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(output_path, index=False)

    return df

if __name__ == "__main__":
    out_dir = Path(__file__).resolve().parent.parent.parent.parent / "data" / "generated"
    out_file = out_dir / "workload_data.csv"
    print(f"Generating synthetic workload dataset to {out_file}...")
    df = generate_synthetic_workload(days=60, output_path=str(out_file))
    print(f"Dataset generated successfully: {df.shape[0]} rows, {df.shape[1]} columns.")
