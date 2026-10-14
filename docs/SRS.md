# Software Requirements Specification (SRS)
## AI-Based Predictive Autoscaling Engine: Machine Learning-Driven Workload Forecasting, Intelligent Resource Allocation, and Cloud Cost Optimization

**Document Version:** 1.0.0  
**Target Academic Degree:** B.Tech in Computer Science and Engineering  
**Standard:** IEEE 830-1998 Recommended Practice for Software Requirements Specifications  

---

### 1. Introduction

#### 1.1 Purpose
The purpose of this document is to specify the complete functional, non-functional, and interface requirements for the **AI-Based Predictive Autoscaling Engine**. This software system uses supervised machine learning (Random Forest Regressor) to forecast future application incoming requests and proactively allocates cloud infrastructure capacity (replicas) to eliminate queueing bottlenecks and optimize cloud expenditures.

#### 1.2 Scope
The scope of this project encompasses:
- Synthetic workload generation modeling diurnal seasonality, weekly cycles, growth trends, and coupled physical metrics (CPU, RAM, response latency, and error rates).
- Machine learning feature engineering without temporal data leakage.
- Multi-step autoregressive demand forecasting for 1h, 6h, 12h, and 24h horizons with 90% empirical prediction intervals.
- Intelligent scaling decision algorithm with proactive allocation, cooldown stabilization, and human-readable decision explanations.
- Head-to-head simulation engine comparing Predictive Autoscaling against traditional Kubernetes Horizontal Pod Autoscaler (HPA) logic.
- FinOps infrastructure cost optimization modeling hourly, daily, and monthly expenditures.
- Modern full-stack interactive dashboard with role-based access control.

#### 1.3 Definitions, Acronyms, and Abbreviations
- **HPA**: Horizontal Pod Autoscaler (traditional reactive Kubernetes controller).
- **MAE**: Mean Absolute Error ($\frac{1}{n}\sum |y_i - \hat{y}_i|$).
- **RMSE**: Root Mean Squared Error ($\sqrt{\frac{1}{n}\sum (y_i - \hat{y}_i)^2}$).
- **MAPE**: Mean Absolute Percentage Error ($\frac{100\%}{n}\sum \left|\frac{y_i - \hat{y}_i}{\max(|y_i|, \epsilon)}\right|$).
- **SLA**: Service Level Agreement (maximum permissible latency threshold, e.g., 100ms).
- **P99**: 99th Percentile Latency.
- **RBAC**: Role-Based Access Control.
- **FinOps**: Cloud Financial Operations and Cost Optimization.

---

### 2. Overall Description

#### 2.1 Product Perspective
Traditional cloud autoscaling mechanisms react only after server resources exceed predefined thresholds (e.g. CPU > 80%). However, container pods and virtual machines experience cold-start initialization and health-check registration latencies (typically 1 to 5 minutes). During this provisioning window, incoming traffic surges saturate active replicas, causing response times to spike exponentially and requests to drop. The AI-Based Predictive Autoscaling Engine acts as an intelligent supervisor that forecasts demand in advance and scales capacity ahead of the surge.

```
       +---------------------------------------------+
       |   Synthetic / Live Cloud Workload Stream    |
       +---------------------------------------------+
                              |
                              v
       +---------------------------------------------+
       | Backward-Looking Feature Pipeline (No Leak) |
       +---------------------------------------------+
                              |
                              v
       +---------------------------------------------+
       |   Random Forest Supervised Regressor        |
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
+-----------------------------+ +-----------------------------+
```

#### 2.2 User Classes and Characteristics
1. **Student Evaluator / Developer (User)**: Runs exploratory simulations, inspects demand curves, tests model inferences, and generates cost comparison tables.
2. **Faculty Examiner / Administrator (Admin)**: Modifies core hyperparameter policies (capacity, CPU targets, cooldown intervals), triggers model retraining, and views system-level audits.

#### 2.3 Operating Environment
- **Operating System**: Windows 10/11, Linux (Ubuntu 20.04+), macOS.
- **Backend Runtime**: Python 3.10 to 3.14.
- **Frontend Runtime**: Node.js 18+ / React 18+ (Vite).
- **Database**: SQLite 3 (zero-configuration local persistence).

---

### 3. Functional Requirements

#### 3.1 Data Ingestion & Synthetic Generation (FR-1)
- **FR-1.1**: The system shall generate at least 60 days of hourly telemetry containing: timestamp, request count, CPU utilization, memory utilization, response latency, error rate, active users, throughput, day of week, hour of day, replica count, and data source.
- **FR-1.2**: Workload patterns must exhibit diurnal cycles (afternoon peak, night trough), weekly seasonality (weekend dampening), organic growth trend, stochastic Gaussian noise, and occasional 2.5x traffic surges.
- **FR-1.3**: Physical metrics must be coupled through queuing models: CPU utilization $\propto \frac{\text{requests}}{\text{replicas} \times \text{capacity}}$, latency follows non-linear queuing escalation when CPU > 75%, and error rate rises when CPU > 88%.
- **FR-1.4**: The system shall support user CSV upload and validate schema headers.

#### 3.2 Machine Learning Forecasting Pipeline (FR-2)
- **FR-2.1**: The feature engineering pipeline shall strictly use backward-looking variables (lags: t-1, t-2, t-3, t-24, t-168; rolling means: 3h, 6h, 24h; rolling std: 24h; cyclical sine/cosine of hour and day).
- **FR-2.2**: Train/test splitting must be chronological (80% train, 20% test) to prevent future data leakage.
- **FR-2.3**: The system shall implement a Baseline Seasonal Lag model to benchmark the Random Forest Regressor.
- **FR-2.4**: The system shall calculate MAE, RMSE, safe MAPE ($\epsilon=1.0$), and $R^2$ goodness of fit.
- **FR-2.5**: The system shall support multi-step autoregressive rollout for 1h, 6h, 12h, and 24h horizons.
- **FR-2.6**: The system shall compute 90% empirical prediction intervals based on validation residuals.

#### 3.3 Autoscaling Decision Engine (FR-3)
- **FR-3.1**: The engine shall implement the formula:
  $$\text{Replicas} = \operatorname{clamp}\left(\left\lceil \frac{\text{Predicted Demand}}{\text{Safe Capacity} \times (\text{Target CPU}/100)} \times (1 + \text{Buffer}) \right\rceil, \text{Min Replicas}, \text{Max Replicas}\right)$$
- **FR-3.2**: The engine shall enforce scale-down cooldown timers (minimum 3 periods) to eliminate pod flapping / thrashing.
- **FR-3.3**: The engine shall output a human-readable mathematical justification for every scaling event.

#### 3.4 Head-to-Head Comparative Simulator (FR-4)
- **FR-4.1**: The simulator shall execute Predictive and Reactive autoscaling on the exact same workload trace.
- **FR-4.2**: The reactive scaler shall suffer configurable startup provisioning delays during which existing instances absorb surging demand.
- **FR-4.3**: The simulator shall record and compare: total replica-hours, cost ($), overload events count, P99 latency, and SLA violations count.

#### 3.5 FinOps Cost Optimization (FR-5)
- **FR-5.1**: The system shall calculate hourly, daily, and monthly (720h) expenditures based on configurable unit instance pricing ($0.05/hr default).
- **FR-5.2**: The system shall compare Predictive vs. Reactive vs. Static Peak Allocation.
- **FR-5.3**: All cost reports shall be exportable as standard CSV files.

---

### 4. Non-Functional Requirements

- **NFR-1 (Performance)**: Forecast inference for 24-hour horizons shall complete within 350 milliseconds.
- **NFR-2 (Reliability)**: The system shall run locally without paid cloud accounts, GPUs, or external third-party API dependencies.
- **NFR-3 (Usability)**: The UI shall provide a clean light theme with responsive charts, KPI counters, and 1-click demo logins.
- **NFR-4 (Security)**: Passwords shall be hashed using salted PBKDF2/Werkzeug hashing; unauthenticated users shall not access private mutation routes.
- **NFR-5 (Maintainability)**: Complete code modularity adhering to Flask Application Factory blueprints and React component trees.

---

### 5. Verification and Acceptance Criteria
The system is accepted when:
1. All 14 automated pytest cases pass with 100% success.
2. Synthetic workload generation produces 1,440 hourly records without NaN values.
3. Random Forest Regressor achieves $< 12\%$ MAPE on held-out test data.
4. Comparative simulation demonstrates $> 75\%$ reduction in overload events compared to reactive HPA.
5. All 12 frontend dashboard views render without console errors.
