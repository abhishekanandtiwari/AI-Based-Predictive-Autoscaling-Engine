import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "predictive-autoscaling-dev-secret-key-2026")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{BASE_DIR / 'instance' / 'autoscaling.db'}"
    )
    DATA_DIR = BASE_DIR / "data"
    GENERATED_DATA_PATH = DATA_DIR / "generated" / "workload_data.csv"
    MODELS_DIR = BASE_DIR / "models"
    MODEL_PATH = MODELS_DIR / "forecast_model.joblib"
    REPORTS_DIR = BASE_DIR / "reports"
    UPLOAD_FOLDER = BASE_DIR / "data" / "uploads"
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload

    # Default Autoscaling Engine Hyperparameters
    DEFAULT_CAPACITY_PER_REPLICA = 250   # max requests per replica safely
    DEFAULT_TARGET_CPU = 70.0           # 70% target utilization
    DEFAULT_MIN_REPLICAS = 2
    DEFAULT_MAX_REPLICAS = 25
    DEFAULT_SAFETY_BUFFER = 0.15        # 15% headroom buffer
    DEFAULT_COST_PER_REPLICA_HOUR = 0.05 # $0.05 / hour (standard cloud micro/small instance)
    DEFAULT_COOLDOWN_PERIOD = 3         # 3 periods minimum before scale-down
    DEFAULT_PROVISIONING_DELAY = 1      # 1 period instance startup latency

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False

class ProductionConfig(Config):
    DEBUG = False

config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
