import unittest
import os
import tempfile

from app import app, db, User

class ChangePasswordCase(unittest.TestCase):
    def setUp(self):
        self.db_fd, app.config['DATABASE'] = tempfile.mkstemp()
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        self.app = app.test_client()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        os.close(self.db_fd)
        os.unlink(app.config['DATABASE'])

    def test_change_password(self):
        # Create a user and log in
        u = User(username='testuser')
        u.set_password('password')
        with app.app_context():
            db.session.add(u)
            db.session.commit()

        self.app.post('/login', data=dict(
            username='testuser',
            password='password'
        ), follow_redirects=True)

        # Change the password
        response = self.app.post('/change_password', data=dict(
            old_password='password',
            new_password='newpassword',
            new_password2='newpassword'
        ), follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Your password has been changed successfully.', response.data)

        # Log out and log back in with the new password
        self.app.get('/logout', follow_redirects=True)
        response = self.app.post('/login', data=dict(
            username='testuser',
            password='newpassword'
        ), follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Welcome, testuser!', response.data)

if __name__ == '__main__':
    unittest.main()
