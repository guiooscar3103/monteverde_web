import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Claves comprometidas o por defecto inseguras
COMPROMISED_KEYS = {
    'mi-clave-super-secreta-monteverde-2025',
    'dev-secret-key',
    'test-secret-key',
    'change-me-in-production',
    'secret',
    'password'
}

# Obtener clave
jwt_secret = os.environ.get('JWT_SECRET_KEY')

# Detectar si estamos en un entorno de pruebas/testing
is_testing = (
    os.environ.get('FLASK_ENV') == 'testing' or
    os.environ.get('TESTING') == 'true' or
    'unittest' in sys.modules or
    'pytest' in sys.modules
)

# Validaciones de Seguridad para la clave secreta
if not is_testing:
    if not jwt_secret:
        raise ValueError(
            "CRITICAL SECURITY ERROR: The environment variable 'JWT_SECRET_KEY' is missing or empty. "
            "The application cannot start securely. Please set a strong, unique secret key in your .env file."
        )
    
    if jwt_secret in COMPROMISED_KEYS:
        raise ValueError(
            f"CRITICAL SECURITY ERROR: The configured 'JWT_SECRET_KEY' is a known compromised or insecure default key. "
            "For security reasons, the application refuses to start."
        )
        
    if len(jwt_secret) < 16:
        raise ValueError(
            "CRITICAL SECURITY ERROR: The 'JWT_SECRET_KEY' is too weak. It must be at least 16 characters long."
        )

class Config:
    SECRET_KEY = jwt_secret or 'dev-secret-key'
    
    # MySQL Conexión
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{os.environ.get('DB_USER', 'root')}:"
        f"{os.environ.get('DB_PASSWORD', '')}@"
        f"{os.environ.get('DB_HOST', '127.0.0.1')}:{os.environ.get('DB_PORT', '3306')}/"
        f"{os.environ.get('DB_NAME', 'monteverde_db')}"
    )
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = True
    
    # JWT Config
    JWT_SECRET_KEY = jwt_secret
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hora
    JWT_REFRESH_TOKEN_EXPIRES = 2592000  # 30 días
