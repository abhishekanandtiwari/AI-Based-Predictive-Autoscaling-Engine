# AI-Based Predictive Autoscaling Engine
### Machine Learning-Driven Workload Forecasting, Intelligent Resource Allocation, and Cloud Cost Optimization

[![Python](https://img.shields.io/badge/Python-3.14%2B-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1-black.svg)](https://palletsprojects.com/p/flask/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff.svg)](https://vitejs.dev/)
[![Scikit--Learn](https://img.shields.io/badge/Scikit--Learn-Random%20Forest-orange.svg)](https://scikit-learn.org/)
[![Pytest](https://img.shields.io/badge/Pytest-14%2F14%20Passing-brightgreen.svg)](https://pytest.org/)
[![Degree](https://img.shields.io/badge/Academic-B.Tech%20CSE%20Major%20Project-purple.svg)]()

A complete, production-grade B.Tech Computer Science and Engineering major project demonstrating how **Supervised Machine Learning (Random Forest Regressor)** anticipates cloud traffic surges in advance and proactively scales container/server replicas, eliminating the cold-start provisioning delays that cripple traditional reactive autoscalers (such as Kubernetes HPA).

Operates locally with **zero paid cloud infrastructure or GPU requirements** via high-fidelity physics-coupled cloud telemetry simulation.

---

## Architecture & System Overview

```text
       +---------------------------------------------+
       |   Multi-Seasonal Workload Telemetry Stream  |
       |  (Diurnal Cycles, Weekly Waves, Spikes)     |
       +---------------------------------------------+
                              |
                              v
       +---------------------------------------------+
       | Backward-Looking Feature Pipeline (No Leak) |
       | (t-1, t-2, t-24, t-168 lags, rolling means) |
       +---------------------------------------------+
                              |
                              v
       +---------------------------------------------+
       |   Random Forest Supervised Regressor        |
       |  (MAE: 38.45 req/s vs. 65.08 req/s Baseline) |
       +---------------------------------------------+
                              |
                              v
       +---------------------------------------------+
       |  Predictive Resource Allocation Engine      |
       |  Target = ceil(Demand / (Cap * CPU_target)) |
       +---------------------------------------------+
                              |
               +--------------+--------------+
               |                             |
               v                             v
+-----------------------------+ +-----------------------------+
| Proactive Container Ready   | | Reactive Lag & Overload Sim |
| - Zero Queuing Latency      | | - Boot Delay Latency Spikes |
| - Flat 30ms Response Time   | | - Latency Surges to 400ms+  |
| - 88% Fewer Overload Events | | - SLA Breaches & Dropouts   |
+-----------------------------+ +-----------------------------+
```

---

## Key Experimental Results

| Metric | Traditional Reactive (HPA) | AI Predictive (Random Forest) | Empirical Advantage |
|---|---|---|---|
| **Forecasting Accuracy (MAPE)** | 18.11% (Baseline) | **10.69% (AI)** | **41.0% Relative Error Reduction** |
| **Server Overload Events** | 18 events | **2 events** | **88.9% Reduction** |
| **P99 Response Tail Latency** | 382.4 ms | **41.8 ms** | **89.1% Reduction** |
| **Average Response Latency** | 46.2 ms | **31.5 ms** | **31.8% Lower Latency** |
| **SLA Violations (>100ms)** | 14 hours | **2 hours** | **85.7% Fewer Breaches** |
| **Monthly Cluster Cost** | \$174.00 / mo | **\$138.00 / mo** | **20.7% Cost Savings** |
| **Savings vs Static Peak** | \$360.00 / mo | **\$138.00 / mo** | **61.7% Cost Savings** |

---

## Technology Stack

- **Frontend**: React 18, Vite 8, Tailwind CSS 4, Recharts, Lucide React.
- **Backend**: Python 3.14, Flask 3.1 REST API, Flask-SQLAlchemy 3.1, Flask-Login, Flask-CORS.
- **Machine Learning**: Scikit-learn (RandomForestRegressor), Pandas, NumPy, Joblib.
- **Persistence**: SQLite 3 (relational tables: users, metrics, forecasts, scaling events, simulations, cost reports).
- **Testing**: Pytest (14 automated unit and integration tests passing).

---

## Project Structure

```text
Autoscaling_Engine/
├── backend/
│   ├── app/
│   │   ├── autoscaling/      # Proactive & reactive allocation decision engine
│   │   ├── ml/               # Data generator, feature engineering & Random Forest forecaster
│   │   ├── models/           # SQLAlchemy database models (User, Metrics, Events, Simulation)
│   │   ├── routes/           # REST API blueprints (auth, data, forecast, autoscaling, sim, cost)
│   │   ├── services/         # FinOps cost service & live simulation session manager
│   │   └── extensions.py     # SQLAlchemy, Flask-Login & CORS setup
│   ├── tests/                # Automated pytest suite (14 test cases)
│   ├── config.py             # App environment configuration
│   └── run.py                # Backend application runner
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, Sidebar, KpiCard
│   │   ├── pages/            # 12 interactive dashboard views
│   │   ├── services/         # API client layer (api.js)
│   │   └── App.jsx           # Root layout and route controller
│   ├── package.json
│   └── vite.config.js
├── data/
│   └── generated/            # Synthetic telemetry datasets (workload_data.csv)
├── models/                   # Serialized Random Forest model (forecast_model.joblib)
├── docs/                     # Full B.Tech academic documentation
│   ├── SRS.md                # IEEE 830 Software Requirements Specification
│   ├── system_design.md      # Architecture, Mermaid DFD & Sequence diagrams
│   ├── database_design.md    # ER diagram & table schemas
│   ├── test_plan.md          # Test matrix & automated execution log
│   ├── user_manual.md        # Beginner Windows PowerShell manual
│   ├── viva_questions.md     # 45 Viva Q&As, 2-min pitch & 5-min demo script
│   └── project_report.md     # 44-section complete major project report
├── generate_data.py          # Standalone synthetic dataset generator
├── train_model.py            # Standalone ML training & evaluation script
├── Dockerfile                # Container build file
├── docker-compose.yml        # Docker compose runner
├── .env.example              # Environment variables template
└── requirements.txt          # Python dependencies
```

---

## Installation & Windows Execution Guide

You will need **two terminal windows**: one for the Python backend and one for the React frontend.

### Terminal 1: Backend Setup
```powershell
# 1. Navigate to project root
cd E:\Autoscaling_Engine

# 2. (Optional) Create & activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Generate multi-seasonal synthetic workload
python generate_data.py

# 5. Train Random Forest model & compute benchmark metrics
python train_model.py

# 6. Start the Flask REST API server
python backend\run.py
```
*Backend runs on `http://127.0.0.1:5000`.*

---

### Terminal 2: Frontend Setup
```powershell
# 1. Open second PowerShell window & enter frontend/
cd E:\Autoscaling_Engine\frontend

# 2. Install Node dependencies
npm install --legacy-peer-deps

# 3. Launch Vite development server
npm run dev
```
*Frontend runs on `http://localhost:3000` (or `http://localhost:5173`).*

---

## 1-Click Evaluator Login Credentials

For demonstration and viva examination, you can click the quick demo buttons on the UI or use:

| Role | Email | Password | Privileges |
|---|---|---|---|
| **Faculty / Admin** | `demo_admin@autoscaler.local` | `admin1234` | Full access, retraining, and hyperparameter tuning |
| **Student / User** | `demo_user@autoscaler.local` | `student1234` | Simulation runner, forecasting, and reporting |

---

## Running the Automated Test Suite

Run pytest to execute all 14 unit and integration tests:
```powershell
python -m pytest backend/tests -v
```

Output:
```text
backend/tests/test_api_endpoints.py::test_health_check PASSED            [  7%]
backend/tests/test_api_endpoints.py::test_auth_demo_login PASSED         [ 14%]
backend/tests/test_api_endpoints.py::test_auth_register_and_login PASSED [ 21%]
backend/tests/test_api_endpoints.py::test_autoscaling_recommend_endpoint PASSED [ 28%]
backend/tests/test_api_endpoints.py::test_cost_calculate_endpoint PASSED [ 35%]
backend/tests/test_autoscaling.py::test_predictive_scaling_bounds_and_cooldown PASSED [ 42%]
backend/tests/test_autoscaling.py::test_reactive_scaling_thresholds PASSED [ 50%]
backend/tests/test_data_generator.py::test_synthetic_data_schema_and_types PASSED [ 57%]
backend/tests/test_data_generator.py::test_diurnal_and_spikes PASSED     [ 64%]
backend/tests/test_ml_pipeline.py::test_feature_engineering_no_leakage PASSED [ 71%]
backend/tests/test_ml_pipeline.py::test_chronological_split PASSED       [ 78%]
backend/tests/test_ml_pipeline.py::test_forecaster_training_and_horizons PASSED [ 85%]
backend/tests/test_simulator_and_cost.py::test_comparative_simulation_results PASSED [ 92%]
backend/tests/test_simulator_and_cost.py::test_cost_optimization_service PASSED [100%]

============================= 14 passed in 6.18s ==============================
```

---

## Dashboard Pages 

1. **Overview Dashboard**: High-level KPI cards, live dual timeline chart, and decision audit logs.
2. **Workload Analytics**: Diurnal pattern heatmap, coupled server physical metrics, and custom CSV upload.
3. **AI Forecasting**: Horizon selector (1h, 6h, 12h, 24h), empirical 90% prediction intervals, and peak warnings.
4. **Autoscaling Simulator**: Real-time playback controls (Play, Pause, Step, Speed slider) and 2.5x traffic spike injection.
5. **Predictive vs. Reactive Comparison**: The centerpiece head-to-head benchmark scorecard and dual charts.
6. **Cost Optimization**: Cloud FinOps calculator, 3-way cost comparison bar chart, and CSV export.
7. **Model Performance**: MAE/RMSE/MAPE comparison table, feature importance ranking, and residual distribution.
8. **Historical Metrics**: Searchable, paginated data table of workload telemetry logs.
9. **Reports and Exports**: Formal academic project report view, printable PDF preview, and CSV downloads.
10. **Engine Settings**: Tunable parameters (capacity per replica, target CPU %, min/max instances, buffer %, cooldown).
11. **User Profile**: Active user identity, role badge, and RBAC privileges matrix.
12. **Authentication**: User sign-in, registration, and 1-click evaluator login.

---

## 📚 Academic Documentation

- **[Software Requirements Specification (SRS)](docs/SRS.md)** — Requirements and IEEE 830 structure
- **[System Design Document](docs/system_design.md)** — Architecture, DFD and sequence diagrams
- **[Database Design Document](docs/database_design.md)** — Database schema and ER diagram
- **[Verification & Test Plan](docs/test_plan.md)** — Testing strategy and test cases
- **[Comprehensive User Manual](docs/user_manual.md)** — Setup and usage instructions
