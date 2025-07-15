from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
import os
import shutil

db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a_default_secret_key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///users.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = 'uploads'
    app.config['AVATAR_FOLDER'] = 'avatars'

    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    from models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    from main import main_bp
    app.register_blueprint(main_bp)

    return app

def create_db(app):
    with app.app_context():
        db.create_all()

def cleanup(app):
    if os.path.exists('instance'):
        shutil.rmtree('instance')
    if os.path.exists('__pycache__'):
        shutil.rmtree('__pycache__')
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    if not os.path.exists(app.config['AVATAR_FOLDER']):
        os.makedirs(app.config['AVATAR_FOLDER'])

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    # The following is for development only.
    # In production, use a WSGI server like Gunicorn.
    # For example: gunicorn --bind 0.0.0.0:8000 app:create_app()
    app.run(debug=True, host='0.0.0.0', port=22846)
