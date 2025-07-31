import unittest
from app import create_app, db
from calculator import analyze_screenshot
import os
from PIL import Image, ImageDraw, ImageFont


class ScreenshotAnalyzerTestCase(unittest.TestCase):
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
        if not os.path.exists(self.app.config['UPLOAD_FOLDER']):
            os.makedirs(self.app.config['UPLOAD_FOLDER'])
        filepath = os.path.join(self.app.config['UPLOAD_FOLDER'], filename)
        img.save(filepath)
        return filepath

    def test_analyze_screenshot_success(self):
        # Create a test image with some text
        text = "Bruisers: 100\nHitmen: 50\nBikers: 75\nEnforcers: Enforcer1, Enforcer2"
        filepath = self.create_test_image(text, 'test_screenshot.png')

        # Analyze the screenshot
        extracted_data = analyze_screenshot(filepath)

        self.assertEqual(extracted_data.get('bruisers'), 100)
        self.assertEqual(extracted_data.get('hitmen'), 50)
        self.assertEqual(extracted_data.get('bikers'), 75)
        self.assertEqual(extracted_data.get('enforcers'), ['Bruisers', 'Hitmen', 'Bikers'])

    def test_analyze_screenshot_error(self):
        # Create a test image with no text
        filepath = self.create_test_image('', 'test_screenshot_error.png')

        # Analyze the screenshot
        extracted_data = analyze_screenshot(filepath)

        self.assertEqual(extracted_data.get('error'), 'Could not extract any data from the screenshot.')

if __name__ == '__main__':
    unittest.main()
