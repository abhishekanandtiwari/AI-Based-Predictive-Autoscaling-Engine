import os
import sys
from pathlib import Path

# Add project root to sys.path for clean module imports
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app import create_app

app = create_app(os.environ.get("FLASK_ENV", "development"))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"===========================================================")
    print(f" AI-Based Predictive Autoscaling Engine REST API")
    print(f" Server running at: http://127.0.0.1:{port}")
    print(f" Health check:      http://127.0.0.1:{port}/api/health")
    print(f" Default Admin:     demo_admin@autoscaler.local / admin1234")
    print(f" Default Student:   demo_user@autoscaler.local / student1234")
    print(f"===========================================================")
    app.run(host="0.0.0.0", port=port, debug=True)
