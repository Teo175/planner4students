from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

# Create the db object that will be used in models
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    CORS(app)  # Enable CORS

    # Load configuration from a separate config file
    app.config.from_object('config.Config')

    # Initialize the db with the app
    db.init_app(app)

    # Import and register blueprints (routes)
    from routes.user_routes import user_bp  # Import routes here, after db is initialized
    app.register_blueprint(user_bp)

    return app
