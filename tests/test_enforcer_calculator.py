import unittest
from app import create_app, db

class EnforcerCalculatorCase(unittest.TestCase):
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

    def test_enforcer_calculator(self):
        with self.app.test_client() as client:
            response = client.post('/enforcer_calculator', data=dict(
                user_enforcers='Bubba,Grand,true',
                opponent_enforcers='Red Thorn,Elite,false'
            ), follow_redirects=True)
            self.assertEqual(response.status_code, 200)
            self.assertIn(b'Placeholder', response.data)
