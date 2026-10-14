"""
train_model.py
--------------
Trains the primary Random Forest Regressor and evaluates against the Baseline Seasonal Lag model.
Reports MAE, RMSE, MAPE, R2, and empirical prediction interval quantiles without data leakage.
"""

import sys
import pandas as pd
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.ml.forecasting import WorkloadForecaster
from backend.app.ml.data_generator import generate_synthetic_workload

def main():
    data_path = ROOT_DIR / "data" / "generated" / "workload_data.csv"
    if not data_path.exists():
        print(f"[*] Dataset not found. Generating now...")
        generate_synthetic_workload(days=60, output_path=str(data_path))

    df = pd.read_csv(data_path)
    print(f"[*] Loaded {len(df)} records. Training Random Forest Forecaster...")
    forecaster = WorkloadForecaster(n_estimators=100, max_depth=15)
    results = forecaster.train_and_evaluate(df)

    # Save to both models/ and root for compatibility
    model_path = ROOT_DIR / "models" / "forecast_model.joblib"
    root_model_path = ROOT_DIR / "forecast_model.joblib"
    forecaster.save(str(model_path))
    forecaster.save(str(root_model_path))

    print(f"[+] Model saved to {model_path} and {root_model_path}\n")

    pm = results["primary_model"]
    bm = results["baseline_model"]
    print("================== MODEL EVALUATION SCORECARD ==================")
    print(f"Primary Model ({pm['name']}):")
    print(f"  - Mean Absolute Error (MAE):    {pm['mae']} req/s")
    print(f"  - Root Mean Squared Error (RMSE): {pm['rmse']} req/s")
    print(f"  - Mean Abs Percentage Error (MAPE): {pm['mape']}%")
    print(f"  - R^2 Goodness of Fit:           {pm.get('r2_score')}")

    print(f"\nBaseline Model ({bm['name']}):")
    print(f"  - MAE:   {bm['mae']} req/s")
    print(f"  - RMSE:  {bm['rmse']} req/s")
    print(f"  - MAPE:  {bm['mape']}%")

    imp = results["improvement_pct"]
    print(f"\nModel Performance Delta:")
    print(f"  - MAE Error Reduction:  {imp['mae_reduction']}%")
    print(f"  - RMSE Error Reduction: {imp['rmse_reduction']}%")
    print(f"  - MAPE Improvement:     {imp['mape_reduction']} percentage points")
    print("================================================================")

if __name__ == "__main__":
    main()
