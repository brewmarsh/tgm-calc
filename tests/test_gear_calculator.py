import unittest
from app import create_app, db
from calculator import calculate_gear_and_investments

class GearCalculatorTestCase(unittest.TestCase):
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

    def test_calculate_gear_and_investments(self):
        user_gear = ['M4A1', 'Kevlar Vest']
        user_investments = {
            'Advanced Arms': 1,
            'Defensive Tactics': 1
        }
        result = calculate_gear_and_investments(user_gear, user_investments)
        self.assertAlmostEqual(result['attack_boost'], 10.01)
        self.assertAlmostEqual(result['defense_boost'], 25.025)

    def test_gear_calculator_route(self):
        with self.app.test_client() as client:
            response = client.get('/gear_calculator')
            self.assertEqual(response.status_code, 200)

            response = client.post('/gear_calculator', data={
                'gear': ['M4A1', 'Kevlar Vest'],
                'advanced_arms': 1,
                'defensive_tactics': 1
            })
            self.assertEqual(response.status_code, 200)
            self.assertIn(b'Total Attack Boost: 10.01', response.data)
            self.assertIn(b'Total Defense Boost: 25.025', response.data)

if __name__ == '__main__':
    unittest.main()
