import sys
import argparse
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.ml.data_generator import generate_synthetic_workload

def main():
    parser = argparse.ArgumentParser(description="Generate synthetic multi-seasonal workload data.")
    parser.add_argument("--days", type=int, default=60, help="Number of days to generate (default: 60)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for repeatability (default: 42)")
    parser.add_argument("--output", type=str, default=None, help="Output CSV path")

    args = parser.parse_args()
    out_path = args.output or (ROOT_DIR / "data" / "generated" / "workload_data.csv")

    print(f"[*] Generating {args.days} days of realistic cloud workload data (seed={args.seed})...")
    df = generate_synthetic_workload(days=args.days, seed=args.seed, output_path=str(out_path))
    print(f"[+] Successfully generated {len(df)} records saved to:\n    {out_path}")
    print("\nSummary Statistics:")
    print(df[["request_count", "cpu_utilization", "memory_utilization", "response_time"]].describe())

if __name__ == "__main__":
    main()
