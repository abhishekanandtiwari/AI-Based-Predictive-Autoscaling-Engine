import sys
import argparse
import pandas as pd
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.ml.forecasting import WorkloadForecaster
from backend.app.ml.data_generator import generate_synthetic_workload

def main():
    parser = argparse.ArgumentParser(description="Train and evaluate workload forecasting model.")
    parser.add_argument("--data", type=str, default=None, help="Input CSV path")
    parser.add_argument("--output", type=str, default=None, help="Output model path")
    parser.add_argument("--trees", type=int, default=100, help="Number of trees in Random Forest")
    parser.add_argument("--depth", type=int, default=15, help="Max depth of trees")

    args = parser.parse_args()
    data_path = args.data or (ROOT_DIR / "data" / "generated" / "workload_data.csv")
    model_path = args.output or (ROOT_DIR / "models" / "forecast_model.joblib")

    if not Path(data_path).exists():
        print(f"[*] Dataset not found at {data_path}. Generating now...")
        generate_synthetic_workload(days=60, output_path=str(data_path))

    df = pd.read_csv(data_path)
    print(f"[*] Training WorkloadForecaster on {len(df)} records (trees={args.trees}, depth={args.depth})...")
    forecaster = WorkloadForecaster(n_estimators=args.trees, max_depth=args.depth)
    results = forecaster.train_and_evaluate(df)

    forecaster.save(str(model_path))
    print(f"[+] Model saved to {model_path}\n")

    print("================ MODEL EVALUATION SUMMARY ================")
    pm = results["primary_model"]
    bm = results["baseline_model"]
    print(f"Primary Model ({pm['name']}):")
    print(f"  - MAE:   {pm['mae']} req/s")
    print(f"  - RMSE:  {pm['rmse']} req/s")
    print(f"  - MAPE:  {pm['mape']}%")
    print(f"  - R^2:   {pm.get('r2_score')}")

    print(f"\nBaseline Model ({bm['name']}):")
    print(f"  - MAE:   {bm['mae']} req/s")
    print(f"  - RMSE:  {bm['rmse']} req/s")
    print(f"  - MAPE:  {bm['mape']}%")

    imp = results["improvement_pct"]
    print(f"\nRelative Improvement over Baseline:")
    print(f"  - MAE Reduction:  {imp['mae_reduction']}%")
    print(f"  - RMSE Reduction: {imp['rmse_reduction']}%")
    print(f"  - MAPE Reduction: {imp['mape_reduction']} percentage points")
    print("==========================================================")

if __name__ == "__main__":
    main()
