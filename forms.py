from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, FileField, \
    IntegerField
from wtforms.validators import DataRequired, EqualTo, ValidationError, \
    NumberRange
from flask_wtf.file import FileAllowed
from models import User
from markupsafe import Markup


class RegistrationForm(FlaskForm):
    """Form for user registration."""
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    password2 = PasswordField(
        'Repeat Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Register')

    def validate_username(self, username):
        """Validate that the username is not already taken."""
        user = User.query.filter_by(username=username.data).first()
        if user is not None:
            raise ValidationError('Please use a different username.')
        if Markup.escape(username.data) != username.data:
            raise ValidationError('Invalid characters in username.')


class LoginForm(FlaskForm):
    """Form for user login."""
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')


class CalculatorForm(FlaskForm):
    """Form for the troop calculator."""
    bruisers = IntegerField(
        'Bruisers', validators=[DataRequired(), NumberRange(min=0)]
    )
    hitmen = IntegerField(
        'Hitmen', validators=[DataRequired(), NumberRange(min=0)]
    )
    bikers = IntegerField(
        'Bikers', validators=[DataRequired(), NumberRange(min=0)]
    )
    submit = SubmitField('Calculate')


class UploadForm(FlaskForm):
    """Form for uploading a photo."""
    photo = FileField('Photo', validators=[DataRequired()])
    submit = SubmitField('Upload')


class AvatarForm(FlaskForm):
    """Form for uploading an avatar."""
    avatar = FileField('Avatar', validators=[
        DataRequired(),
        FileAllowed(['jpg', 'png'], 'Images only!')
    ])
    submit = SubmitField('Update Avatar')


class ChangePasswordForm(FlaskForm):
    """Form for changing the user's password."""
    old_password = PasswordField('Old Password', validators=[DataRequired()])
    new_password = PasswordField('New Password', validators=[DataRequired()])
    new_password2 = PasswordField(
        'Confirm New Password',
        validators=[DataRequired(), EqualTo('new_password')]
    )
    submit = SubmitField('Change Password')


class EnforcerCalculatorForm(FlaskForm):
    """Form for the enforcer calculator."""
    user_enforcers = StringField('Your Enforcers', validators=[DataRequired()])
    opponent_enforcers = StringField("Opponent's Enforcers", validators=[DataRequired()])
    submit = SubmitField('Calculate')


class ResourceCalculatorForm(FlaskForm):
    """Form for the resource calculator."""
    cash = IntegerField('Cash', validators=[DataRequired(), NumberRange(min=0)])
    cargo = IntegerField('Cargo', validators=[DataRequired(), NumberRange(min=0)])
    arms = IntegerField('Arms', validators=[DataRequired(), NumberRange(min=0)])
    metal = IntegerField('Metal', validators=[DataRequired(), NumberRange(min=0)])
    diamonds = IntegerField('Diamonds', validators=[DataRequired(), NumberRange(min=0)])
    submit = SubmitField('Calculate')
