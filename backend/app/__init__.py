import os
from pathlib import Path
from flask import Flask, jsonify
from backend.config import config_by_name
from backend.app.extensions import db, login_manager, cors
from backend.app.models.user import User

def create_app(config_name="development"):
    app = Flask(__name__)
    cfg = config_by_name.get(config_name, config_by_name["default"])
    app.config.from_object(cfg)

    # Ensure necessary folders exist
    for folder in [app.config["DATA_DIR"], app.config["MODELS_DIR"], app.config["REPORTS_DIR"], Path(app.instance_path)]:
        folder.mkdir(parents=True, exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    # Centralized API error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

    # Register blueprints
    from backend.app.routes.auth_routes import auth_bp
    from backend.app.routes.data_routes import data_bp
    from backend.app.routes.forecast_routes import forecast_bp
    from backend.app.routes.autoscaling_routes import autoscaling_bp
    from backend.app.routes.simulation_routes import simulation_bp
    from backend.app.routes.cost_routes import cost_bp
    from backend.app.routes.report_routes import report_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(data_bp)
    app.register_blueprint(forecast_bp)
    app.register_blueprint(autoscaling_bp)
    app.register_blueprint(simulation_bp)
    app.register_blueprint(cost_bp)
    app.register_blueprint(report_bp)

    # Health check endpoint
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "AI-Based Predictive Autoscaling Engine",
            "version": "2.0.0"
        }), 200

    # Initialize tables and seed demo accounts
    with app.app_context():
        db.create_all()
        # Seed demo user and admin if not exists
        if not User.query.filter_by(email="demo_admin@autoscaler.local").first():
            admin = User(name="Faculty Evaluator", email="demo_admin@autoscaler.local", role="admin")
            admin.set_password("admin1234")
            db.session.add(admin)

        if not User.query.filter_by(email="demo_user@autoscaler.local").first():
            student = User(name="B.Tech Student", email="demo_user@autoscaler.local", role="user")
            student.set_password("student1234")
            db.session.add(student)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

    return app
