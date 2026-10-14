import pytest
import json
from backend.app import create_app
from backend.app.extensions import db

@pytest.fixture
def client():
    app = create_app("testing")
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client

def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"

def test_auth_demo_login(client):
    res = client.post("/api/auth/demo-login", json={"role": "admin"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["role"] == "admin"

def test_auth_register_and_login(client):
    # Register
    res = client.post("/api/auth/register", json={
        "name": "Alex Student",
        "email": "alex@example.com",
        "password": "Password123!",
        "role": "user"
    })
    assert res.status_code == 201

    # Login
    res2 = client.post("/api/auth/login", json={
        "email": "alex@example.com",
        "password": "Password123!"
    })
    assert res2.status_code == 200
    assert res2.get_json()["user"]["email"] == "alex@example.com"

def test_autoscaling_recommend_endpoint(client):
    res = client.post("/api/autoscaling/recommend", json={
        "mode": "predictive",
        "demand": 800.0,
        "current_replicas": 2,
        "target_cpu": 70.0
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["recommended_replicas"] > 2
    assert data["action"] == "SCALE_UP"

def test_cost_calculate_endpoint(client):
    res = client.post("/api/cost/calculate", json={
        "predictive_replica_hours": 250.0,
        "reactive_replica_hours": 320.0,
        "peak_replicas": 10,
        "duration_hours": 72,
        "cost_per_replica_hour": 0.05
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "monthly_30d" in data
    assert data["monthly_30d"]["predictive"] < data["monthly_30d"]["reactive"]
