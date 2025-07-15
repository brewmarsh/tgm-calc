from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename
import os
import pytesseract
from PIL import Image

from app import db
from models import User
from forms import UploadForm, AvatarForm, ChangePasswordForm, CalculatorForm
from calculator import calculate_optimal_troops

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    user_troops = ''
    user_enforcers = ''
    if current_user.is_authenticated:
        user_troops = current_user.user_troops
        user_enforcers = current_user.user_enforcers
    return render_template('index.html', user_troops=user_troops, user_enforcers=user_enforcers)

@main_bp.route('/calculate', methods=['POST'])
def calculate():
    form = CalculatorForm()
    if form.validate_on_submit():
        opponent_troops = {
            'bruisers': form.bruisers.data,
            'hitmen': form.hitmen.data,
            'bikers': form.bikers.data,
        }
        optimal_troops = calculate_optimal_troops(opponent_troops)
        return render_template('index.html', result=optimal_troops, form=form)
    return render_template('index.html', form=form)

@main_bp.route('/user/<username>')
@login_required
def user(username):
    user = User.query.filter_by(username=username).first_or_404()
    return render_template('user.html', user=user)

@main_bp.route('/follow/<username>')
@login_required
def follow(username):
    user = User.query.filter_by(username=username).first()
    if user is None:
        flash('User {} not found.'.format(username))
        return redirect(url_for('main.index'))
    if user == current_user:
        flash('You cannot follow yourself!')
        return redirect(url_for('main.user', username=username))
    current_user.follow(user)
    db.session.commit()
    flash('You are following {}!'.format(username))
    return redirect(url_for('main.user', username=username))

@main_bp.route('/unfollow/<username>')
@login_required
def unfollow(username):
    user = User.query.filter_by(username=username).first()
    if user is None:
        flash('User {} not found.'.format(username))
        return redirect(url_for('main.index'))
    if user == current_user:
        flash('You cannot unfollow yourself!')
        return redirect(url_for('main.user', username=username))
    current_user.unfollow(user)
    db.session.commit()
    flash('You are not following {}.'.format(username))
    return redirect(url_for('main.user', username=username))

@main_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    upload_form = UploadForm()
    avatar_form = AvatarForm()

    if avatar_form.validate_on_submit() and avatar_form.avatar.data:
        f = avatar_form.avatar.data
        filename = secure_filename(f.filename)
        filepath = os.path.join(app.config['AVATAR_FOLDER'], filename)
        f.save(filepath)
        current_user.avatar = filename
        db.session.commit()
        flash('Your avatar has been updated.')
        return redirect(url_for('main.profile'))

    if upload_form.validate_on_submit() and upload_form.photo.data:
        f = upload_form.photo.data
        filename = secure_filename(f.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        f.save(filepath)

        try:
            text = pytesseract.image_to_string(Image.open(filepath))
            flash(f'Extracted Text: {text}')
        except Exception as e:
            flash(f'Error processing image: {e}')

        return redirect(url_for('main.profile'))

    return render_template('profile.html', user=current_user, upload_form=upload_form, avatar_form=avatar_form)

@main_bp.route('/find_friends', methods=['GET', 'POST'])
@login_required
def find_friends():
    if request.method == 'POST':
        search_username = request.form.get('username')
        users = User.query.filter(User.username.contains(search_username)).all()
        return render_template('find_friends.html', users=users)
    return render_template('find_friends.html', users=None)

@main_bp.route('/change_password', methods=['GET', 'POST'])
@login_required
def change_password():
    form = ChangePasswordForm()
    if form.validate_on_submit():
        if current_user.check_password(form.old_password.data):
            current_user.set_password(form.new_password.data)
            db.session.commit()
            flash('Your password has been changed successfully.')
            return redirect(url_for('main.profile'))
        else:
            flash('Invalid old password.')
    return render_template('change_password.html', form=form)

@main_bp.route('/save_user_details', methods=['POST'])
@login_required
def save_user_details():
    user_troops = request.form.get('user_troops')
    user_enforcers = request.form.get('user_enforcers')
    current_user.user_troops = user_troops
    current_user.user_enforcers = user_enforcers
    db.session.commit()
    flash('Your details have been saved.')
    return '', 204
