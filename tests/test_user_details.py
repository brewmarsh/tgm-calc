import unittest
from app import create_app, db
from models import User


class UserDetailsCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_save_and_load_user_details(self):
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

            # Save user details
            response = client.post('/save_user_details', data=dict(
                user_troops='Bruiser,T1,1000',
                user_enforcers='Bubba,Grand,true'
            ), follow_redirects=True)
            self.assertEqual(response.status_code, 204)

            # Check that the details were saved
            user = User.query.filter_by(username='testuser').first()
            self.assertEqual(user.user_troops, 'Bruiser,T1,1000')
            self.assertEqual(user.user_enforcers, 'Bubba,Grand,true')

            # Check that the details are loaded on the index page
            response = client.get('/')
            self.assertEqual(response.status_code, 200)
            self.assertIn(b'Bruiser,T1,1000', response.data)
            self.assertIn(b'Bubba,Grand,true', response.data)


if __name__ == '__main__':
    unittest.main()
