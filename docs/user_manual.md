# Comprehensive User Manual
## AI-Based Predictive Autoscaling Engine: Machine Learning-Driven Workload Forecasting, Intelligent Resource Allocation, and Cloud Cost Optimization

**Document Version:** 1.0.0  
**Target Audience:** Students, Faculty Evaluators, and Examiners  
**Platform:** Windows 10/11 (PowerShell) / Linux / macOS  

---

### 1. Prerequisites & Environment Setup

#### 1.1 Required Software
1. **Python 3.10+** (Python 3.14 recommended). Download from [python.org](https://www.python.org/) and ensure you check **"Add Python to PATH"** during installation.
2. **Node.js 18+** (Node.js 22+ recommended). Download from [nodejs.org](https://nodejs.org/).
3. **VS Code** (Visual Studio Code).

#### 1.2 Verifying Installation in Windows PowerShell
Open PowerShell and verify:
```powershell
python --version
node --version
npm --version
```

---

### 2. Quickstart Execution Guide (Windows PowerShell)

Running the application requires two terminal windows: one for the Flask backend and one for the React frontend.

#### Terminal 1: Backend Setup & Launch
1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd E:\Autoscaling_Engine
   ```
2. (Optional) Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install backend dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Generate the initial synthetic multi-seasonal dataset:
   ```powershell
   python generate_data.py
   ```
5. Train the Random Forest Regressor & evaluate benchmark metrics:
   ```powershell
   python train_model.py
   ```
6. Start the Flask REST API server:
   ```powershell
   python backend\run.py
   ```
   *The backend will boot on `http://127.0.0.1:5000` with automated database seeding.*

---

#### Terminal 2: Frontend Setup & Launch
1. Open a second PowerShell window and navigate to the `frontend/` folder:
   ```powershell
   cd E:\Autoscaling_Engine\frontend
   ```
2. Install frontend dependencies (if not already installed):
   ```powershell
   npm install --legacy-peer-deps
   ```
3. Launch the Vite development server:
   ```powershell
   npm run dev
   ```
   *The frontend dashboard will open on `http://localhost:3000` or `http://localhost:5173`.*
4. Open your web browser and navigate to `http://localhost:3000`.

---

### 3. Step-by-Step Feature Walkthrough

#### Step 1: Authentication & 1-Click Faculty Demo Login
- On the navigation bar or Authentication page, click **"Demo Admin"** or **"Demo Student"** to instantly sign in without typing passwords.
- Alternatively, register a new user account with your university email.

#### Step 2: Overview Dashboard
- Inspect real-time KPI cards: **Current Workload**, **Active Replicas**, **Predicted Next-Hour Demand**, and **Overload Risk Status**.
- View the unified tracking chart showing incoming requests and proactive vs. reactive instance provisioning.
- Review the explainable scaling decision feed.

#### Step 3: Workload Analytics & Telemetry Generation
- Navigate to **"Workload Analytics"** in the sidebar.
- Adjust the **Time Horizon (Days)** (e.g. 60 days) and **Random Seed** (e.g. 42).
- Click **"Regenerate Telemetry"** to observe diurnal cycles, evening traffic humps, and weekly seasonality.
- Use the **"Upload Custom Metrics CSV"** dropzone to test with custom workload datasets.
- Click **"Download CSV"** to save the generated dataset.

#### Step 4: AI Demand Forecasting
- Navigate to **"AI Forecasting"**.
- Select your forecasting horizon: **Next 1h**, **6h**, **12h**, or **24h**.
- Observe the predicted request trajectory flanked by the **90% Empirical Prediction Interval** (shaded blue band).
- Review anticipated peak demand hours and overload warnings.
- Tune the Random Forest hyperparameters (**Estimators**, **Max Depth**) and click **"Retrain Random Forest"** to re-evaluate error metrics.

#### Step 5: Live Interactive Simulator
- Navigate to **"Autoscaling Simulator"**.
- Click **"Start Simulation"** to initiate tick-by-tick time progression.
- Adjust the **Playback Speed** (1x, 2x, 5x, 10x) or drag the **Traffic Load** slider (0.5x to 2.5x).
- Click the red **"⚡ Inject 2.5x Traffic Spike"** button to simulate a sudden flash-sale event!
- Watch how the reactive scaler saturates with severe latency during its boot delay, while the predictive scaler remains stable.

#### Step 6: Predictive vs. Reactive Head-to-Head Comparison
- Navigate to **"Predictive vs Reactive"**.
- Select the experiment duration: **24h**, **48h**, **72h**, or **7 Days (168h)**.
- Review the **Executive Comparison Scorecard**:
  - Reduction in server overload events (typically $> 85\%$).
  - Reduction in P99 tail latency (typically $> 75\%$).
  - Reduction in SLA violations ($> 80\%$).
  - Total dollar savings ($> 20\%$).
- Analyze the CPU utilization and replica allocation dual charts.

#### Step 7: FinOps Cloud Cost Optimization
- Navigate to **"Cost Optimization"**.
- Adjust the **Cost Per Replica Hour** (e.g. $0.05/hr) and **Peak Replica Ceiling**.
- Compare the 3-way financial invoice: Predictive vs. Reactive vs. Static Peak Allocation.
- Click **"Export Cost CSV"** to download the spreadsheet report.

#### Step 8: Academic Reports & Documentation
- Navigate to **"Reports & Exports"**.
- Review the formal B.Tech Project Report summary complete with problem statement, mathematical formulas, and empirical findings.
- Click **"Print / Save PDF"** to create a formatted PDF report for submission.
- Click **"Download Results CSV"** to obtain full experimental traces.

---

### 4. Running Automated Tests

To verify that all mathematical algorithms, ML pipelines, and API endpoints are functioning properly:
```powershell
cd E:\Autoscaling_Engine
python -m pytest backend/tests -v
```
All 14 tests should report `PASSED`.

---

### 5. Troubleshooting & FAQ

- **Q: Port 5000 is already in use by another application.**
  - *Fix*: Start backend on a custom port:
    ```powershell
    $env:PORT="5001"; python backend\run.py
    ```
- **Q: Script execution is disabled on PowerShell (`Activate.ps1 cannot be loaded`).**
  - *Fix*: Enable script execution for the current user:
    ```powershell
    Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
    ```
- **Q: Does this project require paid AWS, Azure, or GCP accounts?**
  - *Answer*: No! The system executes locally using high-fidelity physics-coupled cloud simulation, allowing full demonstration, report writing, and viva defense with zero cloud bills.
