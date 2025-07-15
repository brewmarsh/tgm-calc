import unittest
import os
import tempfile

from app import app, db, User

class UserModelCase(unittest.TestCase):
    def setUp(self):
        self.db_fd, app.config['DATABASE'] = tempfile.mkstemp()
        app.config['TESTING'] = True
        self.app = app.test_client()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        os.close(self.db_fd)
        os.unlink(app.config['DATABASE'])

    def test_password_hashing(self):
        u = User(username='susan')
        u.set_password('cat')
        self.assertFalse(u.check_password('dog'))
        self.assertTrue(u.check_password('cat'))

    def test_follow(self):
        u1 = User(username='john', password_hash='a')
        u2 = User(username='susan', password_hash='b')
        with app.app_context():
            db.session.add(u1)
            db.session.add(u2)
            db.session.commit()
            self.assertEqual(u1.followed.all(), [])
            self.assertEqual(u1.followers.all(), [])

            u1.follow(u2)
            db.session.commit()
            self.assertTrue(u1.is_following(u2))
            self.assertEqual(u1.followed.count(), 1)
            self.assertEqual(u1.followed.first().username, 'susan')
            self.assertEqual(u2.followers.count(), 1)
            self.assertEqual(u2.followers.first().username, 'john')

            u1.unfollow(u2)
            db.session.commit()
            self.assertFalse(u1.is_following(u2))
            self.assertEqual(u1.followed.count(), 0)
            self.assertEqual(u2.followers.count(), 0)

if __name__ == '__main__':
    unittest.main()
