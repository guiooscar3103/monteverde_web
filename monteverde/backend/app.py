import os
import sys
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.extensions import db, init_extensions
from config import Config
from sqlalchemy import extract, and_, func, inspect, text
from sqlalchemy.exc import OperationalError

# ✅ IMPORTS DIRECTOS (más seguro)
from src.models.mensaje import Mensaje
from src.models.usuario import Usuario
from src.models.estudiante import Estudiante
from src.models.curso import Curso
from src.models.calificacion import Calificacion
from src.models.asistencia import Asistencia
from src.models.observacion import Observacion
from src.models.actividad_admin import ActividadAdmin
from src.models.docente_curso import DocenteCurso
from src.models.materia import Materia
from src.models.docente_asignacion import DocenteAsignacion

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Resolver solicitudes preflight para rutas API protegidas
    @app.before_request
    def handle_preflight():
        if request.method == 'OPTIONS' and request.path.startswith('/api/'):
            return '', 200

    # Inicializar extensiones
    init_extensions(app)
    
    # Crear tablas faltantes automáticamente en desarrollo
    with app.app_context():
        try:
            db.create_all()
        except OperationalError as exc:
            print(f"[WARN] db.create_all() falló: {exc}")
            if "doesn't exist in engine" in str(exc) or '1932' in str(exc):
                with db.engine.begin() as conn:
                    conn.execute(text('DROP TABLE IF EXISTS actividad_admin;'))
                    conn.execute(text('DROP TABLE IF EXISTS docente_curso;'))
                print('[INFO] Tablas corruptas eliminadas, intentando crear de nuevo')
                db.create_all()
            else:
                raise

        try:
            inspector = inspect(db.engine)
            if inspector.has_table('cursos'):
                columnas = [col['name'] for col in inspector.get_columns('cursos')]
                if 'descripcion' not in columnas:
                    with db.engine.begin() as conn:
                        conn.execute(text('ALTER TABLE cursos ADD COLUMN descripcion VARCHAR(255) NULL'))
                    print('[INFO] Columna descripcion añadida a la tabla cursos')
        except Exception as exc:
            print(f"[WARN] No se pudo actualizar la tabla cursos: {exc}")

    from src.routes.auth_routes import auth_bp
    from src.routes.usuario_routes import usuario_bp
    from src.routes.admin_routes import admin_bp
    from src.routes.cursos import cursos_bp
    from src.routes.assignments import assignments_bp
    from src.routes.materias import materias_bp
    from src.routes.asistencia import asistencia_bp
    from src.routes.calificaciones import calificaciones_bp
    from src.routes.observaciones import observaciones_bp
    from src.routes.mensajes import mensajes_bp
    from src.routes.usuarios import usuarios_bp
    from src.routes.estudiantes import estudiantes_bp
    from src.routes.dashboard import dashboard_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(usuario_bp, url_prefix='/api/usuarios')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(cursos_bp, url_prefix='/api/cursos')
    app.register_blueprint(assignments_bp, url_prefix='/api')
    app.register_blueprint(materias_bp, url_prefix='/api')
    app.register_blueprint(asistencia_bp, url_prefix='/api')
    app.register_blueprint(calificaciones_bp, url_prefix='/api')
    app.register_blueprint(observaciones_bp, url_prefix='/api')
    app.register_blueprint(mensajes_bp, url_prefix='/api')
    app.register_blueprint(usuarios_bp, url_prefix='/api')
    app.register_blueprint(estudiantes_bp, url_prefix='/api')
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    return app

app = create_app()

# =====================================================
# RUTAS BÁSICAS / SALUD
# =====================================================
@app.route('/', methods=['GET'])
def index():
    """Ruta raíz del servicio."""
    return jsonify({
        'status': 'OK',
        'message': 'API Monteverde funcionando',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/health', methods=['GET'])
def health():
    """Salud del servicio."""
    return jsonify({
        'status': 'OK',
        'message': 'API funcionando',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/test-db', methods=['GET'])
def test_db():
    """Verificación rápida de conexión."""
    try:
        count = Usuario.query.count()
        users = Usuario.query.limit(3).all()
        return jsonify({
            'success': True,
            'usuarios_count': count,
            'sample_users': [{'email': u.email, 'rol': u.rol} for u in users]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# All modular routes (dashboard, messages, users, students, grades, attendance, observations) are now handled by Blueprints registered in create_app()

# =====================================================
# MAIN
# =====================================================
if __name__ == '__main__':
    with app.app_context():
        try:
            db.create_all()  # Crear tablas si no existen
            print("✅ Tablas creadas/verificadas")
        except Exception as e:
            print(f"⚠️ Error creando tablas: {e}")
    
    print("🚀 MonteVerde API iniciando...")
    print("🌐 http://localhost:5000")
    print("🔗 CORS permitido: http://localhost:5173")
    app.run(debug=True, port=5000, host='localhost')
