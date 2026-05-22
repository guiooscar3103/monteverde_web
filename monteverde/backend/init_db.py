import os
import pymysql
from dotenv import load_dotenv

# Cargar las variables de entorno desde backend/.env
backend_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(backend_dir, '.env')
load_dotenv(env_path)

db_host = os.environ.get('DB_HOST', '127.0.0.1')
db_port = int(os.environ.get('DB_PORT', 3306))
db_user = os.environ.get('DB_USER', 'root')
db_password = os.environ.get('DB_PASSWORD', '')
db_name = os.environ.get('DB_NAME', 'monteverde_db')

print(f"Connecting to MySQL at {db_host}:{db_port} as {db_user}...")

try:
    # Primero, conectar sin una base de datos específica para crearla si no existe
    conn = pymysql.connect(
        host=db_host,
        port=db_port,
        user=db_user,
        password=db_password,
        autocommit=True
    )
    with conn.cursor() as cursor:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;")
        print(f"[OK] Database '{db_name}' verified or created.")
    conn.close()

    # Ahora, conectar a la base de datos y verificar si debemos ejecutar el script SQL
    conn = pymysql.connect(
        host=db_host,
        port=db_port,
        user=db_user,
        password=db_password,
        database=db_name,
        autocommit=True,
        client_flag=pymysql.constants.CLIENT.MULTI_STATEMENTS
    )
    
    with conn.cursor() as cursor:
        # Verificar si la base de datos ya contiene tablas
        cursor.execute("SHOW TABLES;")
        tables = cursor.fetchall()
        
        if len(tables) > 0:
            print(f"[INFO] Database '{db_name}' already has {len(tables)} tables. Skipping SQL import to prevent data overwrites.")
        else:
            print("[INFO] Importing database schema and seed data from monteverde_db.sql...")
            sql_path = os.path.abspath(os.path.join(backend_dir, '..', 'database', 'monteverde_db.sql'))
            
            if os.path.exists(sql_path):
                with open(sql_path, 'r', encoding='utf-8') as f:
                    sql_content = f.read()
                
                # Ejecutar las sentencias SQL
                cursor.execute(sql_content)
                print("[OK] Database schema and seed data imported successfully!")
            else:
                print(f"[ERROR] SQL file not found at: {sql_path}")
        
        # ====================================================
        # MIGRACIÓN DE TABLAS (Agregar columnas si no existen)
        # ====================================================
        print("[INFO] Verifying and applying database schema migrations...")
        
        columns_to_add = [
            ("activo", "BOOLEAN NOT NULL DEFAULT 1"),
            ("eliminado", "BOOLEAN NOT NULL DEFAULT 0"),
            ("fecha_eliminacion", "DATETIME DEFAULT NULL"),
            ("fecha_registro", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP")
        ]
        
        for col_name, col_def in columns_to_add:
            try:
                cursor.execute(f"ALTER TABLE usuarios ADD COLUMN {col_name} {col_def};")
                print(f"[OK] Added column '{col_name}' to 'usuarios' table.")
            except Exception as e:
                # Si falla, probablemente la columna ya existe
                pass

        # ====================================================
        # REPARAR/RECREAR TABLAS CORRUPTAS
        # ====================================================
        for table_name in ('actividad_admin', 'docente_curso', 'materias', 'docente_asignacion'):
            try:
                cursor.execute(f"SELECT 1 FROM {table_name} LIMIT 1;")
                cursor.fetchall()
            except Exception as e:
                print(f"[WARN] Tabla '{table_name}' está corrupta o inaccesible: {e}")
                try:
                    cursor.execute(f"DROP TABLE IF EXISTS {table_name};")
                    print(f"[OK] Tabla '{table_name}' eliminada para recreación.")
                except Exception as drop_err:
                    print(f"[ERROR] No se pudo eliminar la tabla '{table_name}': {drop_err}")

        # ====================================================
        # CREAR TABLA actividad_admin SI NO EXISTE
        # ====================================================
        try:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS actividad_admin (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NULL,
                    accion VARCHAR(100) NOT NULL,
                    detalles TEXT,
                    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_actividad_admin_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
                """
            )
            print("[OK] Tabla 'actividad_admin' verificada o creada.")
        except Exception as e:
            print(f"[WARN] No se pudo crear la tabla 'actividad_admin': {e}")

        # ====================================================
        # CREAR TABLA docente_curso SI NO EXISTE
        # ====================================================
        try:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS docente_curso (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    docente_id INT NOT NULL,
                    curso_id INT NOT NULL,
                    CONSTRAINT fk_docente_curso_docente FOREIGN KEY (docente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    CONSTRAINT fk_docente_curso_curso FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
                """
            )
            print("[OK] Tabla 'docente_curso' verificada o creada.")
        except Exception as e:
            print(f"[WARN] No se pudo crear la tabla 'docente_curso': {e}")

        # ====================================================
        # CREAR TABLA materias SI NO EXISTE
        # ====================================================
        try:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS materias (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(100) UNIQUE NOT NULL,
                    descripcion VARCHAR(255) NULL
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
                """
            )
            print("[OK] Tabla 'materias' verificada o creada.")

            cursor.execute("SELECT COUNT(*) FROM materias;")
            materia_count = cursor.fetchone()[0]
            if materia_count == 0:
                default_materias = [
                    ('Matemáticas', 'Materia de cálculo, álgebra y geometría'),
                    ('Lenguaje', 'Materia de comprensión lectora y expresión escrita'),
                    ('Ciencias Naturales', 'Materia de ciencias y biología'),
                    ('Ciencias Sociales', 'Materia de historia y geografía'),
                    ('Inglés', 'Materia de idioma extranjero'),
                    ('Educación Física', 'Materia de deporte y actividad física')
                ]
                cursor.executemany(
                    "INSERT INTO materias (nombre, descripcion) VALUES (%s, %s);",
                    default_materias
                )
                print("[OK] Se insertaron materias por defecto en la tabla 'materias'.")
        except Exception as e:
            print(f"[WARN] No se pudo crear la tabla 'materias': {e}")

        # ====================================================
        # CREAR TABLA docente_asignacion SI NO EXISTE
        # ====================================================
        try:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS docente_asignacion (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    docente_id INT NOT NULL,
                    curso_id INT NOT NULL,
                    materia_id INT NOT NULL,
                    CONSTRAINT fk_docente_asignacion_docente FOREIGN KEY (docente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    CONSTRAINT fk_docente_asignacion_curso FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
                    CONSTRAINT fk_docente_asignacion_materia FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
                    UNIQUE KEY uq_docente_curso_materia (docente_id, curso_id, materia_id)
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
                """
            )
            print("[OK] Tabla 'docente_asignacion' verificada o creada.")
        except Exception as e:
            print(f"[WARN] No se pudo crear la tabla 'docente_asignacion': {e}")
                
        # ====================================================
        # MIGRACIÓN DE SEGURIDAD (Hashear contraseñas semilla)
        # ====================================================
        print("[INFO] Checking for unhashed plain text passwords...")
        from werkzeug.security import generate_password_hash
        
        cursor.execute("SELECT id, email, password FROM usuarios;")
        users = cursor.fetchall()
        
        hashed_count = 0
        for user_id, email, password in users:
            if not password.startswith(('scrypt:', 'pbkdf2:sha256:')):
                hashed_pass = generate_password_hash(password)
                cursor.execute("UPDATE usuarios SET password = %s WHERE id = %s;", (hashed_pass, user_id))
                print(f"[OK] Password for user '{email}' was successfully hashed.")
                hashed_count += 1
                
        if hashed_count > 0:
            print(f"[SUCCESS] Hashed {hashed_count} plain text passwords in the database.")
        else:
            print("[INFO] All passwords are already securely hashed.")
                
    conn.close()
    print("[SUCCESS] Database initialization and migration completed successfully!")

except Exception as e:
    print(f"[ERROR] Error initializing database: {e}")
