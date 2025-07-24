import unittest
from app import create_app, db
from models import User

class FindFriendsCase(unittest.TestCase):
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

    def test_find_friends(self):
        # Create a user to log in
        u1 = User(username='testuser')
        u1.set_password('password')
        # Create a user to be found
        u2 = User(username='friend')
        u2.set_password('password')
        db.session.add_all([u1, u2])
        db.session.commit()

        with self.app.test_client() as client:
            # Log in
            client.post('/auth/login', data=dict(
                username='testuser',
                password='password'
            ), follow_redirects=True)

            # Search for the friend
            response = client.post('/find_friends', data=dict(
                username='friend'
            ), follow_redirects=True)
            self.assertEqual(response.status_code, 200)
            self.assertIn(b'friend', response.data)
            self.assertIn(b'/user/friend', response.data)

            # Search for self
            response = client.post('/find_friends', data=dict(
                username='testuser'
            ), follow_redirects=True)
            self.assertEqual(response.status_code, 200)
            self.assertNotIn(b'<li><a href="/user/testuser">testuser</a></li>', response.data)
