from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
import os
import shutil

db = SQLAlchemy()
login_manager = LoginManager()


def create_app():
    """Create and configure an instance of the Flask application."""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get(
        'SECRET_KEY', 'a_default_secret_key'
    )
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL', 'sqlite:///users.db'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = 'uploads'
    app.config['AVATAR_FOLDER'] = 'avatars'

    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    from models import User

    @login_manager.user_loader
    def load_user(user_id):
        """Load user from the database."""
        return User.query.get(int(user_id))

    # Import and register blueprints
    from auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    from main import main_bp
    app.register_blueprint(main_bp)

    return app


def create_db(app):
    """Create the database tables."""
    with app.app_context():
        db.create_all()


def cleanup(app):
    """Clean up the instance and pycache folders."""
    if os.path.exists('instance'):
        shutil.rmtree('instance')
    if os.path.exists('__pycache__'):
        shutil.rmtree('__pycache__')
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    if not os.path.exists(app.config['AVATAR_FOLDER']):
        os.makedirs(app.config['AVATAR_FOLDER'])


app = create_app()
