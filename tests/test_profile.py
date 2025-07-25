import unittest
import tempfile
import re
import os
from datetime import datetime
from PIL import Image
from app import create_app, db
from models import User


class ProfilePictureCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['UPLOAD_FOLDER'] = tempfile.mkdtemp()
        self.app.config['AVATAR_FOLDER'] = tempfile.mkdtemp()
        self.app.config['THUMBNAIL_FOLDER'] = tempfile.mkdtemp()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        # Create a dummy image file
        from PIL import Image
        img = Image.new('RGB', (100, 100), color = 'black')
        img.save('test.jpg')

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_upload_and_display_profile_picture(self):
        # Create a user
        u = User(username='testuser')
        u.set_password('password')
        db.session.add(u)
        db.session.commit()

        with self.app.test_client() as client:
            # Log in
            client.post('/auth/login', data=dict(
                username='testuser',
                password='password'
            ), follow_redirects=True)

            # Upload a profile picture
            with open('test.jpg', 'rb') as f:
                response = client.post(
                    '/profile',
                    data=dict(avatar=f),
                    content_type='multipart/form-data',
                    follow_redirects=True
                )
            self.assertEqual(response.status_code, 200)
            self.assertIn(b'Your avatar has been updated.', response.data)

            # Check that the avatar was saved
            user = User.query.filter_by(username='testuser').first()
            self.assertIsNotNone(user.avatar)

            # Check that the avatar is displayed on the profile page
            response = client.get('/profile')
            self.assertEqual(response.status_code, 200)
            self.assertIn(bytes(user.avatar, 'utf-8'), response.data)


    def test_upload_and_display_screenshot(self):
        # Create a user
        u = User(username='testuser')
        u.set_password('password')
        db.session.add(u)
        db.session.commit()

        with self.app.test_client() as client:
            # Log in
            client.post('/auth/login', data=dict(
                username='testuser',
                password='password'
            ), follow_redirects=True)

            # Upload a screenshot
            with open('test.jpg', 'rb') as f:
                response = client.post(
                    '/profile',
                    data=dict(screenshot=f),
                    content_type='multipart/form-data',
                    follow_redirects=True
                )
            self.assertEqual(response.status_code, 200)
            self.assertIn(b'Your screenshot has been uploaded.', response.data)

            # Check that the screenshot was saved
            user = User.query.filter_by(username='testuser').first()
            self.assertEqual(user.screenshots.count(), 1)

            # Check that the screenshot is displayed on the profile page
            response = client.get('/profile')
            self.assertEqual(response.status_code, 200)
            self.assertIn(bytes(user.screenshots.first().filename, 'utf-8'), response.data)

            # Check that the filename has a timestamp
            self.assertTrue(re.match(r'\d{8}_\d{6}_test.jpg', user.screenshots.first().filename))


    def test_analyze_screenshot(self):
        # Create a user
        u = User(username='testuser')
        u.set_password('password')
        db.session.add(u)
        db.session.commit()

        with self.app.test_client() as client:
            # Log in
            client.post('/auth/login', data=dict(
                username='testuser',
                password='password'
            ), follow_redirects=True)

            # Upload a screenshot
            with open('test.jpg', 'rb') as f:
                client.post(
                    '/profile',
                    data=dict(screenshot=f),
                    content_type='multipart/form-data',
                    follow_redirects=True
                )

            # Analyze the screenshot
            user = User.query.filter_by(username='testuser').first()
            screenshot = user.screenshots.first()
            response = client.get(
                f'/analyze_screenshot/{screenshot.id}',
                follow_redirects=True
            )
            self.assertEqual(response.status_code, 200)
            self.assertIn(b'Confirm Update', response.data)
            self.assertIn(b'Type:</strong> troops', response.data)
            self.assertIn(b'training_center_level', response.data)
            self.assertIn(b'troop_levels', response.data)

            # Confirm the update
            response = client.post(
                f'/confirm_update/{screenshot.id}',
                follow_redirects=True
            )
            self.assertEqual(response.status_code, 200)
            self.assertIn(b'Your profile has been updated.', response.data)


if __name__ == '__main__':
    unittest.main()
