"""
generate_data.py
-----------------
Generates realistic multi-seasonal cloud application workload data with coupled physical server metrics:
- Timestamp
- Incoming request count (request_count)
- CPU utilization percentage (cpu_utilization)
- Memory utilization percentage (memory_utilization)
- Average response time (response_time ms)
- Error rate (error_rate %)
- Active users (active_users)
- Network throughput (network_throughput MB/s)
- Day of the week (day_of_week)
- Hour of the day (hour_of_day)
- Current replica count (replica_count)
"""

import sys
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.ml.data_generator import generate_synthetic_workload

def main():
    out_dir = ROOT_DIR / "data" / "generated"
    out_file = out_dir / "workload_data.csv"
    root_file = ROOT_DIR / "workload_data.csv"

    print("[*] Generating 60 days of synthetic multi-seasonal cloud workload telemetry...")
    df = generate_synthetic_workload(days=60, output_path=str(out_file))
    # Also save copy in root for legacy script compatibility
    df.to_csv(root_file, index=False)

    print(f"[+] Successfully generated {len(df)} records.")
    print(f"    Saved to: {out_file}")
    print(f"    Saved copy: {root_file}")
    print("\nDataset Schema & Preview:")
    print(df.head(5))

if __name__ == "__main__":
    main()
