import unittest
from app import create_app, db
from calculator import calculate_investment_cost

class InvestmentCostCalculatorTestCase(unittest.TestCase):
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

    def test_calculate_investment_cost_family_building(self):
        result = calculate_investment_cost('Faction Club', 1, 25)
        self.assertEqual(result['liquor'], 19999)
        self.assertEqual(result['handcuffs'], 0)
        self.assertEqual(result['shackles'], 0)
        self.assertEqual(result['cash'], 0)
        self.assertEqual(result['arms'], 0)
        self.assertEqual(result['cargo'], 0)
        self.assertEqual(result['metal'], 0)

    def test_calculate_investment_cost_mansion(self):
        result = calculate_investment_cost('Mansion', 1, 25)
        self.assertEqual(result['cash'], 44439670)
        self.assertEqual(result['arms'], 60599554)
        self.assertEqual(result['cargo'], 60599554)
        self.assertEqual(result['metal'], 36359727)
        self.assertEqual(result['liquor'], 0)
        self.assertEqual(result['handcuffs'], 0)
        self.assertEqual(result['shackles'], 0)

    def test_calculate_investment_cost_wall(self):
        result = calculate_investment_cost('Wall', 1, 25)
        self.assertEqual(result['cash'], 0)
        self.assertEqual(result['arms'], 0)
        self.assertEqual(result['cargo'], 0)
        self.assertEqual(result['metal'], 0)
        self.assertEqual(result['liquor'], 0)
        self.assertEqual(result['handcuffs'], 0)
        self.assertEqual(result['shackles'], 0)

    def test_building_cost_calculator_route_family_building(self):
        with self.app.test_client() as client:
            response = client.get('/building_cost_calculator')
            self.assertEqual(response.status_code, 200)

            response = client.post('/building_cost_calculator', data={
                'building_name': 'Faction Club',
                'current_level': 1,
                'target_level': 25
            })
            self.assertEqual(response.status_code, 200)
            self.assertIn(b'Total Liquor: 19,999', response.data)

    def test_building_cost_calculator_route_mansion(self):
        with self.app.test_client() as client:
            response = client.get('/building_cost_calculator')
            self.assertEqual(response.status_code, 200)

            response = client.post('/building_cost_calculator', data={
                'building_name': 'Mansion',
                'current_level': 1,
                'target_level': 25
            })
            self.assertEqual(response.status_code, 200)
            self.assertIn(b'Total Cash: 44,439,670', response.data)
            self.assertIn(b'Total Arms: 60,599,554', response.data)
            self.assertIn(b'Total Cargo: 60,599,554', response.data)
            self.assertIn(b'Total Metal: 36,359,727', response.data)

if __name__ == '__main__':
    unittest.main()
