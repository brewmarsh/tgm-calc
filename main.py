from flask import Blueprint, render_template, redirect, url_for, flash, \
    request, current_app
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from PIL import Image

from app import db
from models import User, Screenshot
from forms import ChangePasswordForm, CalculatorForm, EnforcerCalculatorForm, ResourceCalculatorForm
from calculator import calculate_optimal_troops, calculate_optimal_enforcers, calculate_resources, analyze_screenshot

main_bp = Blueprint('main', __name__)


@main_bp.route('/')
def index():
    """Render the index page."""
    user_troops = ''
    user_enforcers = ''
    if current_user.is_authenticated:
        user_troops = current_user.user_troops
        user_enforcers = current_user.user_enforcers
    return render_template(
        'index.html', user_troops=user_troops, user_enforcers=user_enforcers
    )


@main_bp.route('/calculate', methods=['POST'])
def calculate():
    """Handle the troop calculation."""
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
    """Render a user's profile page."""
    user = User.query.filter_by(username=username).first_or_404()
    return render_template('user.html', user=user)


@main_bp.route('/follow/<username>')
@login_required
def follow(username):
    """Follow a user."""
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
    """Unfollow a user."""
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
    """Render the user's profile page and handle avatar and screenshot uploads."""
    if request.method == 'POST':
        if 'avatar' in request.files:
            file = request.files['avatar']
            if file.filename != '':
                filename = secure_filename(file.filename)
                file.save(
                    os.path.join(current_app.config['AVATAR_FOLDER'], filename)
                )
                current_user.avatar = filename
                db.session.commit()
                flash('Your avatar has been updated.')
                return redirect(url_for('main.profile'))

        if 'screenshot' in request.files:
            file = request.files['screenshot']
            if file.filename != '':
                now = datetime.now()
                timestamp = now.strftime("%Y%m%d_%H%M%S")
                filename = f"{timestamp}_{secure_filename(file.filename)}"

                # Create uploads folder if it doesn't exist
                uploads_folder = current_app.config['UPLOAD_FOLDER']
                if not os.path.exists(uploads_folder):
                    os.makedirs(uploads_folder)

                # Save original screenshot
                filepath = os.path.join(uploads_folder, filename)
                file.save(filepath)

                # Create thumbnail
                thumb_folder = os.path.join(current_app.static_folder, 'thumbnails')
                if not os.path.exists(thumb_folder):
                    os.makedirs(thumb_folder)

                thumb_path = os.path.join(thumb_folder, filename)
                with Image.open(filepath) as img:
                    img.thumbnail((128, 128))
                    img.save(thumb_path)

                screenshot = Screenshot(filename=filename, user=current_user)
                db.session.add(screenshot)
                db.session.commit()
                flash('Your screenshot has been uploaded.')
                return redirect(url_for('main.profile'))

    return render_template('profile.html', user=current_user)


@main_bp.route('/find_friends', methods=['GET', 'POST'])
@login_required
def find_friends():
    """Render the find friends page and handle searches."""
    if request.method == 'POST':
        search_username = request.form.get('username')
        users = User.query.filter(
            User.username.contains(search_username)
        ).filter(User.id != current_user.id).all()
        return render_template('find_friends.html', users=users)
    return render_template('find_friends.html', users=None)


@main_bp.route('/change_password', methods=['GET', 'POST'])
@login_required
def change_password():
    """Render the change password page and handle password changes."""
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
    """Save the user's troop and enforcer details."""
    user_troops = request.form.get('user_troops')
    user_enforcers = request.form.get('user_enforcers')
    current_user.user_troops = user_troops
    current_user.user_enforcers = user_enforcers
    db.session.commit()
    flash('Your details have been saved.')
    return '', 204


@main_bp.route('/enforcer_calculator', methods=['GET', 'POST'])
def enforcer_calculator():
    """Render the enforcer calculator page and handle calculations."""
    form = EnforcerCalculatorForm()
    if form.validate_on_submit():
        user_enforcers = form.user_enforcers.data
        opponent_enforcers = form.opponent_enforcers.data
        optimal_enforcers = calculate_optimal_enforcers(
            user_enforcers, opponent_enforcers
        )
        return render_template(
            'enforcer_calculator.html',
            result=optimal_enforcers,
            form=form
        )
    return render_template('enforcer_calculator.html', form=form)


@main_bp.route('/resource_calculator', methods=['GET', 'POST'])
def resource_calculator():
    """Render the resource calculator page and handle calculations."""
    form = ResourceCalculatorForm()
    if form.validate_on_submit():
        resources = {
            'cash': form.cash.data,
            'cargo': form.cargo.data,
            'arms': form.arms.data,
            'metal': form.metal.data,
            'diamonds': form.diamonds.data,
        }
        result = calculate_resources(resources)
        return render_template(
            'resource_calculator.html',
            result=result,
            form=form
        )
    return render_template('resource_calculator.html', form=form)


@main_bp.route('/analyze_screenshot/<int:screenshot_id>')
@login_required
def analyze_screenshot_route(screenshot_id):
    """Analyze a screenshot and display the extracted data."""
    screenshot = Screenshot.query.get_or_404(screenshot_id)
    if screenshot.user_id != current_user.id:
        flash('You do not have permission to analyze this screenshot.')
        return redirect(url_for('main.profile'))

    filepath = os.path.join(
        current_app.config['UPLOAD_FOLDER'], screenshot.filename
    )
    extracted_data = analyze_screenshot(filepath)

    return render_template(
        'confirm_update.html',
        screenshot=screenshot,
        extracted_data=extracted_data
    )


@main_bp.route('/confirm_update/<int:screenshot_id>', methods=['POST'])
@login_required
def confirm_update(screenshot_id):
    """Confirm and apply the extracted data to the user's profile."""
    screenshot = Screenshot.query.get_or_404(screenshot_id)
    if screenshot.user_id != current_user.id:
        flash('You do not have permission to update this profile.')
        return redirect(url_for('main.profile'))

    # Update user's profile with extracted data
    filepath = os.path.join(
        current_app.config['UPLOAD_FOLDER'], screenshot.filename
    )
    print(f"Analyzing screenshot: {filepath}")
    extracted_data = analyze_screenshot(filepath)
    print(f"Extracted data: {extracted_data}")
    if 'bruisers' in extracted_data:
        current_user.user_troops = current_user.user_troops or '{}'
        import json
        troops = json.loads(current_user.user_troops)
        troops['bruisers'] = extracted_data['bruisers']
        current_user.user_troops = json.dumps(troops)

    if 'hitmen' in extracted_data:
        current_user.user_troops = current_user.user_troops or '{}'
        import json
        troops = json.loads(current_user.user_troops)
        troops['hitmen'] = extracted_data['hitmen']
        current_user.user_troops = json.dumps(troops)

    if 'bikers' in extracted_data:
        current_user.user_troops = current_user.user_troops or '{}'
        import json
        troops = json.loads(current_user.user_troops)
        troops['bikers'] = extracted_data['bikers']
        current_user.user_troops = json.dumps(troops)

    if 'enforcers' in extracted_data:
        current_user.user_enforcers = json.dumps(extracted_data['enforcers'])

    db.session.commit()
    flash('Your profile has been updated.')
    return redirect(url_for('main.profile'))
