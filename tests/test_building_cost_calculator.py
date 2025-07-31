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
        self.assertEqual(result['liquor'], 15500)
        self.assertEqual(result['handcuffs'], 0)
        self.assertEqual(result['shackles'], 0)
        self.assertEqual(result['cash'], 0)
        self.assertEqual(result['arms'], 0)
        self.assertEqual(result['cargo'], 0)
        self.assertEqual(result['metal'], 0)

    def test_calculate_investment_cost_mansion(self):
        result = calculate_investment_cost('Mansion', 1, 25)
        self.assertEqual(result['cash'], 26662848)
        self.assertEqual(result['arms'], 36358433)
        self.assertEqual(result['cargo'], 36358433)
        self.assertEqual(result['metal'], 21815055)
        self.assertEqual(result['liquor'], 0)
        self.assertEqual(result['handcuffs'], 0)
        self.assertEqual(result['shackles'], 0)

    def test_calculate_investment_cost_mansion_from_level_10(self):
        result = calculate_investment_cost('Mansion', 10, 25)
        self.assertEqual(result['cash'], 26604331)
        self.assertEqual(result['arms'], 36278638)
        self.assertEqual(result['cargo'], 36278638)
        self.assertEqual(result['metal'], 21767179)
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
            self.assertIn(b'Total Liquor: 15,500', response.data)

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
            self.assertIn(b'Total Cash: 26,662,848', response.data)
            self.assertIn(b'Total Arms: 36,358,433', response.data)
            self.assertIn(b'Total Cargo: 36,358,433', response.data)
            self.assertIn(b'Total Metal: 21,815,055', response.data)

if __name__ == '__main__':
    unittest.main()
