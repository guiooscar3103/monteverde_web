import os
import sys
from pathlib import Path

# Configurar stdout y stderr en UTF-8 para evitar UnicodeEncodeError en consolas Windows (cp1252)
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

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

# IMPORTS DIRECTOS
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
from src.models.curso_materia import CursoMateria
from src.models.docente_asignacion import DocenteAsignacion
from src.models.circular import Circular
# Nuevos modelos — sistema de evaluación por indicadores de logro
from src.models.bimestre import Bimestre
from src.models.indicador_logro import IndicadorLogro
from src.models.calificacion_bimestre import CalificacionBimestre
from src.models.tarea import Tarea
from src.models.entrega import Entrega
from src.models.configuracion_institucional import ConfiguracionInstitucional
from src.models.conversacion_archivada import ConversacionArchivada
from src.models.configuracion_evaluacion import ConfiguracionEvaluacion
from src.services.configuracion_service import ConfiguracionService
from src.services.configuracion_evaluacion_service import ConfiguracionEvaluacionService


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Gestionar solicitudes pre-flight (OPTIONS) para permitir la comunicación entre frontend y API
    @app.before_request
    def handle_preflight():
        if request.method == 'OPTIONS' and request.path.startswith('/api/'):
            return '', 200

    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,PATCH,OPTIONS'
        return response

    @app.errorhandler(500)
    def handle_500_error(e):
        return jsonify({'success': False, 'message': 'Error interno del servidor', 'error': str(e)}), 500

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
            elif "2003" in str(exc) or "Can't connect" in str(exc) or "10061" in str(exc):
                print('[WARN] MySQL no conectado; omitiendo inicialización automática en inicio.')
            else:
                raise

        # ====================================================
        # MIGRACIONES Y VERIFICACIÓN DE COLUMNAS / TABLAS
        # ====================================================
        try:
            inspector = inspect(db.engine)
            if inspector.has_table('usuarios') and db.engine.name != 'sqlite':
                columnas_usuarios = [col['name'] for col in inspector.get_columns('usuarios')]
                with db.engine.begin() as conn:
                    if 'activo' not in columnas_usuarios:
                        conn.execute(text('ALTER TABLE usuarios ADD COLUMN activo BOOLEAN NOT NULL DEFAULT 1'))
                    if 'eliminado' not in columnas_usuarios:
                        conn.execute(text('ALTER TABLE usuarios ADD COLUMN eliminado BOOLEAN NOT NULL DEFAULT 0'))
                    if 'fecha_eliminacion' not in columnas_usuarios:
                        conn.execute(text('ALTER TABLE usuarios ADD COLUMN fecha_eliminacion DATETIME NULL'))
                    if 'fecha_registro' not in columnas_usuarios:
                        conn.execute(text('ALTER TABLE usuarios ADD COLUMN fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'))
                    try:
                        conn.execute(text('ALTER TABLE usuarios MODIFY COLUMN rol VARCHAR(50) NOT NULL'))
                    except Exception:
                        pass
                print('[INFO] Columnas de usuarios verificadas/migradas.')

            if inspector.has_table('cursos'):
                columnas = [col['name'] for col in inspector.get_columns('cursos')]
                if 'descripcion' not in columnas:
                    with db.engine.begin() as conn:
                        conn.execute(text('ALTER TABLE cursos ADD COLUMN descripcion VARCHAR(255) NULL'))
                    print('[INFO] Columna descripcion añadida a la tabla cursos')

            if inspector.has_table('tareas'):
                columnas_tareas = [col['name'] for col in inspector.get_columns('tareas')]
                with db.engine.begin() as conn:
                    if 'califica_bimestre' not in columnas_tareas:
                        conn.execute(text('ALTER TABLE tareas ADD COLUMN califica_bimestre BOOLEAN NOT NULL DEFAULT 0'))
                    if 'bimestre_id' not in columnas_tareas:
                        conn.execute(text('ALTER TABLE tareas ADD COLUMN bimestre_id INT NULL'))
                    if 'indicador_id' not in columnas_tareas:
                        conn.execute(text('ALTER TABLE tareas ADD COLUMN indicador_id INT NULL'))
                    if 'numero_nota' not in columnas_tareas:
                        conn.execute(text('ALTER TABLE tareas ADD COLUMN numero_nota INT NULL'))
                    if 'tipo_evaluacion' not in columnas_tareas:
                        conn.execute(text('ALTER TABLE tareas ADD COLUMN tipo_evaluacion VARCHAR(50) NULL'))
                print('[INFO] Columnas bimestrales verificadas en la tabla tareas')

            if inspector.has_table('calificaciones_bimestre'):
                columnas_calif = [col['name'] for col in inspector.get_columns('calificaciones_bimestre')]
                if 'tarea_id' not in columnas_calif:
                    with db.engine.begin() as conn:
                        conn.execute(text('ALTER TABLE calificaciones_bimestre ADD COLUMN tarea_id INT NULL'))
                    print('[INFO] Columna tarea_id añadida a la tabla calificaciones_bimestre')
                if db.engine.name != 'sqlite':
                    with db.engine.begin() as conn:
                        try:
                            conn.execute(text('ALTER TABLE calificaciones_bimestre MODIFY COLUMN nota DECIMAL(5,2) NOT NULL'))
                        except Exception:
                            pass

            if inspector.has_table('entregas') and db.engine.name != 'sqlite':
                with db.engine.begin() as conn:
                    try:
                        conn.execute(text('ALTER TABLE entregas MODIFY COLUMN calificacion DECIMAL(5,2) NULL'))
                    except Exception:
                        pass

            if inspector.has_table('materias'):
                columnas_materias = [col['name'] for col in inspector.get_columns('materias')]
                with db.engine.begin() as conn:
                    if 'codigo' not in columnas_materias:
                        conn.execute(text('ALTER TABLE materias ADD COLUMN codigo VARCHAR(20) UNIQUE NULL'))
                    if 'area' not in columnas_materias:
                        conn.execute(text('ALTER TABLE materias ADD COLUMN area VARCHAR(100) NULL'))
                    if 'intensidad_horaria' not in columnas_materias:
                        conn.execute(text('ALTER TABLE materias ADD COLUMN intensidad_horaria INT NOT NULL DEFAULT 0'))
                    if 'activo' not in columnas_materias:
                        conn.execute(text('ALTER TABLE materias ADD COLUMN activo BOOLEAN NOT NULL DEFAULT 1'))
                    if 'created_at' not in columnas_materias:
                        conn.execute(text('ALTER TABLE materias ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'))
                    if 'updated_at' not in columnas_materias:
                        conn.execute(text('ALTER TABLE materias ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
                print('[INFO] Columnas verificadas en la tabla materias')

            if inspector.has_table('mensajes'):
                columnas_mensajes = [col['name'] for col in inspector.get_columns('mensajes')]
                with db.engine.begin() as conn:
                    if 'eliminado' not in columnas_mensajes:
                        conn.execute(text('ALTER TABLE mensajes ADD COLUMN eliminado BOOLEAN NOT NULL DEFAULT 0'))
                    if 'fecha_eliminacion' not in columnas_mensajes:
                        conn.execute(text('ALTER TABLE mensajes ADD COLUMN fecha_eliminacion DATETIME NULL'))
                print('[INFO] Columnas de retractación verificadas en la tabla mensajes')
        except Exception as exc:
            print(f"[WARN] No se pudo actualizar columnas de la base de datos: {exc}")

        if db.engine.name != 'sqlite':
            try:
                # Crear y verificar la tabla familia_estudiante, migrando datos legacy de usuarios.estudiante_id
                with db.engine.begin() as conn:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS familia_estudiante (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            familia_id INT NOT NULL,
                            estudiante_id INT NOT NULL,
                            FOREIGN KEY (familia_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                            FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
                            UNIQUE KEY uq_familia_estudiante (familia_id, estudiante_id)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
                    """))
                    conn.execute(text("""
                        INSERT IGNORE INTO familia_estudiante (familia_id, estudiante_id)
                        SELECT id, estudiante_id FROM usuarios 
                        WHERE rol = 'familia' AND estudiante_id IS NOT NULL AND eliminado = 0;
                    """))
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS conversaciones_archivadas (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            usuario_id INT NOT NULL,
                            contacto_id INT NOT NULL,
                            fecha_archivado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                            FOREIGN KEY (contacto_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                            UNIQUE KEY uq_usuario_contacto_archivado (usuario_id, contacto_id)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
                    """))
                print('[INFO] Tablas familia_estudiante y conversaciones_archivadas verificadas/creadas con éxito')
            except Exception as exc:
                print(f"[WARN] No se pudo verificar/migrar tablas asociativas: {exc}")

        if inspector.has_table('bimestres_config') and db.engine.name != 'sqlite':
            try:
                columnas_bimestres = [col['name'] for col in inspector.get_columns('bimestres_config')]
                with db.engine.begin() as conn:
                    if 'calendario_id' not in columnas_bimestres:
                        conn.execute(text('ALTER TABLE bimestres_config ADD COLUMN calendario_id INT NULL'))
                    if 'fecha_inicio' not in columnas_bimestres:
                        conn.execute(text('ALTER TABLE bimestres_config ADD COLUMN fecha_inicio DATE NULL'))
                    if 'fecha_fin' not in columnas_bimestres:
                        conn.execute(text('ALTER TABLE bimestres_config ADD COLUMN fecha_fin DATE NULL'))
                    if 'fecha_cierre_calificaciones' not in columnas_bimestres:
                        conn.execute(text('ALTER TABLE bimestres_config ADD COLUMN fecha_cierre_calificaciones DATE NULL'))
                    if 'estado' not in columnas_bimestres:
                        conn.execute(text("ALTER TABLE bimestres_config ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTO'"))
                print('[INFO] Columnas de bimestres_config verificadas/migradas.')
            except Exception as exc:
                print(f"[WARN] No se pudo migrar bimestres_config: {exc}")

        # ----- Seed de calendario académico y bimestres por defecto -----
        try:
            from src.services.calendario_service import CalendarioService
            CalendarioService.get_or_create_calendario(datetime.now().year)
            print(f'[INFO] Calendario académico y bimestres {datetime.now().year} creados/verificados correctamente')
        except Exception as exc:
            db.session.rollback()
            print(f'[WARN] No se pudo crear seed de calendario académico: {exc}')

        # ----- Seed de configuración institucional por defecto -----
        try:
            ConfiguracionService.get_or_create_default()
        except Exception as exc:
            db.session.rollback()
            print(f'[WARN] No se pudo verificar seed de configuracion institucional: {exc}')

        # ----- Seed de configuración de evaluación por defecto -----
        try:
            ConfiguracionEvaluacionService.get_or_create_default()
        except Exception as exc:
            db.session.rollback()
            print(f'[WARN] No se pudo verificar seed de configuracion evaluacion: {exc}')

        # ----- Seed de cursos, estudiantes y usuarios demo en entorno de desarrollo/producción (MySQL) -----
        if not app.config.get('TESTING') and db.engine.name != 'sqlite':
            try:
                if Curso.query.count() == 0:
                    c1 = Curso(id=1, nombre='Primero A', nivel='1°', letra='A')
                    c2 = Curso(id=2, nombre='Primero B', nivel='1°', letra='B')
                    c3 = Curso(id=3, nombre='Segundo A', nivel='2°', letra='A')
                    c4 = Curso(id=4, nombre='Tercero A', nivel='3°', letra='A')
                    c5 = Curso(id=5, nombre='Cuarto A', nivel='4°', letra='A')
                    c6 = Curso(id=6, nombre='Quinto A', nivel='5°', letra='A')
                    db.session.add_all([c1, c2, c3, c4, c5, c6])
                    db.session.commit()
                    print('[INFO] Cursos iniciales creados.')

                if Estudiante.query.count() == 0:
                    e1 = Estudiante(id=1, nombre='Santiago González Pérez', curso_id=1)
                    e2 = Estudiante(id=2, nombre='Valentina López García', curso_id=1)
                    e3 = Estudiante(id=3, nombre='Matías Rodríguez Silva', curso_id=1)
                    db.session.add_all([e1, e2, e3])
                    db.session.commit()
                    print('[INFO] Estudiantes iniciales creados.')

                # 1. Admin
                if not Usuario.query.filter_by(email='admin@monteverde.com').first():
                    u_admin = Usuario(nombre='Administrador Sistema', email='admin@monteverde.com', rol='admin', activo=True, eliminado=False)
                    u_admin.set_password('admin123')
                    db.session.add(u_admin)

                # 1.1 Coordinador Académico
                if not Usuario.query.filter_by(email='coordinador@monteverde.com').first():
                    u_coord = Usuario(nombre='Coordinador Académico', email='coordinador@monteverde.com', rol='coordinador', activo=True, eliminado=False)
                    u_coord.set_password('coordinador123')
                    db.session.add(u_coord)

                # 2. Docente
                if not Usuario.query.filter_by(email='docente@monteverde.com').first():
                    u_doc = Usuario(nombre='María García López', email='docente@monteverde.com', rol='docente', activo=True, eliminado=False)
                    u_doc.set_password('docente123')
                    db.session.add(u_doc)

                # 3. Familias demo
                primer_est = Estudiante.query.first()
                est_id = primer_est.id if primer_est else 1
                u_fam = Usuario.query.filter_by(email='familiagonzalez@monteverde.com').first()
                if not u_fam:
                    u_fam = Usuario(nombre='Familia González', email='familiagonzalez@monteverde.com', rol='familia', estudiante_id=est_id, activo=True, eliminado=False)
                    u_fam.set_password('familia123')
                    db.session.add(u_fam)
                else:
                    u_fam.activo = True
                    u_fam.eliminado = False

                db.session.commit()
                print('[INFO] Usuarios demo verificados/creados.')
            except Exception as exc:
                db.session.rollback()
                print(f'[WARN] No se pudo verificar seed de usuarios demo: {exc}')


    from src.routes.auth_routes import auth_bp
    from src.routes.usuario_routes import usuario_bp
    from src.routes.admin_routes import admin_bp
    from src.routes.cursos import cursos_bp
    from src.routes.assignments import assignments_bp
    from src.routes.materias import materias_bp
    from src.routes.asistencia import asistencia_bp
    from src.routes.calificaciones import calificaciones_bp
    from src.routes.calificaciones_bimestre import calificaciones_bimestre_bp
    from src.routes.observaciones import observaciones_bp
    from src.routes.mensajes import mensajes_bp
    from src.routes.usuarios import usuarios_bp
    from src.routes.estudiantes import estudiantes_bp
    from src.routes.dashboard import dashboard_bp
    from src.routes.circulares import circulares_bp
    from src.routes.tareas import tareas_bp
    from src.routes.configuracion_evaluacion_routes import configuracion_evaluacion_bp
    from src.routes.calendario_routes import calendario_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(usuario_bp, url_prefix='/api/usuarios')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(cursos_bp, url_prefix='/api/cursos')
    app.register_blueprint(assignments_bp, url_prefix='/api')
    app.register_blueprint(materias_bp, url_prefix='/api')
    app.register_blueprint(asistencia_bp, url_prefix='/api')
    app.register_blueprint(calificaciones_bp, url_prefix='/api')
    app.register_blueprint(calificaciones_bimestre_bp, url_prefix='/api')
    app.register_blueprint(observaciones_bp, url_prefix='/api')
    app.register_blueprint(mensajes_bp, url_prefix='/api')
    app.register_blueprint(usuarios_bp, url_prefix='/api')
    app.register_blueprint(estudiantes_bp, url_prefix='/api')
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    app.register_blueprint(circulares_bp, url_prefix='/api')
    app.register_blueprint(tareas_bp, url_prefix='/api')
    app.register_blueprint(configuracion_evaluacion_bp, url_prefix='/api')
    app.register_blueprint(calendario_bp, url_prefix='/api/calendario')
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



# =====================================================
# MAIN
# =====================================================
if __name__ == '__main__':
    with app.app_context():
        try:
            db.create_all()  # Crear tablas si no existen
            print("[OK] Tablas creadas/verificadas")
        except Exception as e:
            print(f"[ERROR] Error creando tablas: {e}")
    
    print("[SERVER] MonteVerde API iniciando...")
    print("[INFO] http://localhost:5000 (127.0.0.1:5000)")
    print("[INFO] CORS permitido: http://localhost:5173")
    app.run(debug=True, port=5000, host='0.0.0.0')
