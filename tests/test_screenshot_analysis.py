import unittest
from unittest.mock import patch
from app import create_app, db
from models import User, Screenshot
from calculator import analyze_screenshot
import os
from PIL import Image, ImageDraw, ImageFont


class ScreenshotAnalysisTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def create_test_image(self, text, filename, size=(800, 400), font_size=30):
        img = Image.new('RGB', size, color=(255, 255, 255))
        d = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype("DejaVuSans.ttf", font_size)
        except IOError:
            font = ImageFont.load_default()
        d.text((10, 10), text, fill=(0, 0, 0), font=font)
        filepath = os.path.join(self.app.config['UPLOAD_FOLDER'], filename)
        img.save(filepath)
        return filepath

    def test_analyze_screenshot(self):
        # Create a dummy user and screenshot
        with self.app.app_context():
            user = User(username='testuser')
            user.set_password('password')
            db.session.add(user)
            db.session.commit()

            # Create a test image with some text
            text = "Bruisers: 100\nHitmen: 50\nBikers: 75\nEnforcers: Enforcer1, Enforcer2"
            filepath = self.create_test_image(text, 'test_screenshot.png')

            # Analyze the screenshot
            extracted_data = analyze_screenshot(filepath)
            print("Extracted data:", extracted_data)

            self.assertEqual(extracted_data.get('bruisers'), 100)
            self.assertEqual(extracted_data.get('hitmen'), 50)
            self.assertEqual(extracted_data.get('bikers'), 75)
            self.assertEqual(extracted_data.get('enforcers'), ['Enforcer1', 'Enforcer2'])

    def test_confirm_update_integration(self):
        with self.app.test_client() as client:
            with self.app.app_context():
                # Create a user and log in
                user = User(username='testuser')
                user.set_password('password')
                db.session.add(user)
                db.session.commit()
                client.post('/auth/login', data={'username': 'testuser', 'password': 'password'})

                # Create a test image with some text
                text = "Bruisers: 200\nHitmen: 100"
                filepath = self.create_test_image(text, 'test_update.png')

                # Create a screenshot object
                user = User.query.filter_by(username='testuser').first()
                screenshot = Screenshot(filename='test_update.png', user_id=user.id)
                db.session.add(screenshot)
                db.session.commit()

                # Make a request to confirm_update
                response = client.post(f'/confirm_update/{screenshot.id}', follow_redirects=True)
                self.assertEqual(response.status_code, 200)

                # Check if the user's profile is updated
                user = User.query.filter_by(username='testuser').first()
                import json
                user_troops = json.loads(user.user_troops)
                self.assertEqual(user_troops.get('bruisers'), 200)
                self.assertEqual(user_troops.get('hitmen'), 100)

if __name__ == '__main__':
    unittest.main()
