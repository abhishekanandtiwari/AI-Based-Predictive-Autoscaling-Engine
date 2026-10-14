"""
dashboard.py
-------------
The demo-facing piece. Run with:

    streamlit run dashboard.py

Shows:
- Historical workload
- Forecasted workload for the next N hours
- The AI-recommended replica count over time
- A simple "current recommendation" callout
"""

import os
import pandas as pd
import streamlit as st

from generate_data import generate_workload_data
from features import build_features, FEATURE_COLUMNS, TARGET_COLUMN
from decision_engine import apply_to_forecast, CAPACITY_PER_REPLICA, SAFETY_MARGIN
from forecast import forecast_next_hours, load_model
from sklearn.ensemble import RandomForestRegressor

st.set_page_config(page_title="AI Predictive Autoscaling Engine", layout="wide")

st.title("AI-Based Predictive Autoscaling Engine")
st.caption("Predicts workload trends and recommends automatic scaling actions before demand hits.")


@st.cache_data
def get_data():
    if not os.path.exists("workload_data.csv"):
        df = generate_workload_data()
        df.to_csv("workload_data.csv", index=False)
    df = pd.read_csv("workload_data.csv")
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df


@st.cache_resource
def get_model(_history: pd.DataFrame):
    if os.path.exists("forecast_model.joblib"):
        return load_model()
    # Train on the fly if no saved model exists yet
    data = build_features(_history)
    model = RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(data[FEATURE_COLUMNS], data[TARGET_COLUMN])
    return model


history = get_data()
model = get_model(history)

hours_ahead = st.sidebar.slider("Forecast horizon (hours)", min_value=6, max_value=72, value=24, step=6)
st.sidebar.markdown("---")
st.sidebar.markdown(f"**Capacity per replica:** {CAPACITY_PER_REPLICA} req/sec")
st.sidebar.markdown(f"**Safety margin:** {int((SAFETY_MARGIN - 1) * 100)}% headroom")

forecast_df = forecast_next_hours(hours_ahead=hours_ahead, model=model, history=history)
result_df = apply_to_forecast(forecast_df)

# --- Top metrics ---------------------------------------------------------
col1, col2, col3 = st.columns(3)
current_load = history["requests_per_sec"].iloc[-1]
next_hour_load = result_df["predicted_load"].iloc[0]
next_hour_replicas = result_df["recommended_replicas"].iloc[0]
peak_row = result_df.loc[result_df["predicted_load"].idxmax()]

col1.metric("Current load (req/sec)", f"{current_load:.1f}")
col2.metric("Predicted load, next hour", f"{next_hour_load:.1f}",
            delta=f"{next_hour_load - current_load:+.1f}")
col3.metric("Recommended replicas, next hour", int(next_hour_replicas))

st.info(
    f"Peak predicted load in the next {hours_ahead}h is **{peak_row['predicted_load']:.1f} req/sec** "
    f"at **{peak_row['timestamp']}** \u2192 recommend scaling to **{int(peak_row['recommended_replicas'])} replicas** ahead of time."
)

# --- Chart: historical + forecast ----------------------------------------
st.subheader("Workload: historical vs predicted")
history_recent = history.tail(72)[["timestamp", "requests_per_sec"]].rename(
    columns={"requests_per_sec": "load"})
history_recent["type"] = "actual"

forecast_chart = result_df[["timestamp", "predicted_load"]].rename(
    columns={"predicted_load": "load"})
forecast_chart["type"] = "predicted"

chart_df = pd.concat([history_recent, forecast_chart])
chart_pivot = chart_df.pivot(index="timestamp", columns="type", values="load")
st.line_chart(chart_pivot)

# --- Chart: recommended replicas ------------------------------------------
st.subheader("AI-recommended replica count over time")
replica_chart = result_df.set_index("timestamp")[["recommended_replicas"]]
st.bar_chart(replica_chart)

# --- Table -----------------------------------------------------------------
with st.expander("See full forecast + scaling table"):
    st.dataframe(result_df, use_container_width=True)

st.caption(
    "Demo note: workload data is synthetically generated to simulate realistic daily/weekly traffic "
    "patterns. The same pipeline (feature engineering \u2192 ML forecast \u2192 decision engine) would run "
    "against real metrics from Prometheus/CloudWatch in a production deployment, and the decision "
    "engine's output would call the Kubernetes API or a cloud auto scaling group instead of just "
    "displaying a recommendation."
)
