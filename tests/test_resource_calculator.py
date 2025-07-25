import unittest
from app import create_app, db

class ResourceCalculatorCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_resource_calculator(self):
        with self.app.test_client() as client:
            response = client.post('/resource_calculator', data=dict(
                cash=100,
                cargo=100,
                arms=100,
                metal=100,
                diamonds=100
            ), follow_redirects=True)
            self.assertEqual(response.status_code, 200)
            self.assertIn(b'Placeholder', response.data)
