from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

followers = db.Table(
    'followers',
    db.Column('follower_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('followed_id', db.Integer, db.ForeignKey('user.id'))
)


class User(UserMixin, db.Model):
    """User model for the application."""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(150), nullable=False)
    avatar = db.Column(db.String(150), nullable=True)
    user_troops = db.Column(db.Text, nullable=True)
    user_enforcers = db.Column(db.Text, nullable=True)
    followed = db.relationship(
        'User',
        secondary=followers,
        primaryjoin=(followers.c.follower_id == id),
        secondaryjoin=(followers.c.followed_id == id),
        backref=db.backref('followers', lazy='dynamic'),
        lazy='dynamic'
    )
    screenshots = db.relationship('Screenshot', backref='user', lazy='dynamic')

    def set_password(self, password):
        """Set the user's password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check if the provided password is correct."""
        return check_password_hash(self.password_hash, password)

    def follow(self, user):
        """Follow a user."""
        if not self.is_following(user):
            self.followed.append(user)

    def unfollow(self, user):
        """Unfollow a user."""
        if self.is_following(user):
            self.followed.remove(user)

    def is_following(self, user):
        """Check if the user is following another user."""
        return self.followed.filter(
            followers.c.followed_id == user.id).count() > 0


class Screenshot(db.Model):
    """Screenshot model for the application."""
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(150), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
