import os
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-archivar-monteverde-32bytes!'

from config import Config
Config.SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
Config.SQLALCHEMY_ECHO = False

import unittest
from tests.integration.test_conversaciones_archivar import ConversacionesArchivarTestCase

if __name__ == '__main__':
    unittest.main()
