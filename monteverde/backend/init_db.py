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
        # CREAR / MIGRAR TABLA materias
        # ====================================================
        try:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS materias (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(100) UNIQUE NOT NULL,
                    codigo VARCHAR(20) UNIQUE NULL,
                    descripcion VARCHAR(255) NULL,
                    area VARCHAR(100) NULL,
                    intensidad_horaria INT NOT NULL DEFAULT 0,
                    activo TINYINT(1) NOT NULL DEFAULT 1,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
                """
            )
            print("[OK] Tabla 'materias' verificada o creada.")

            # Migración de columnas en materias si no existen
            materia_cols = [
                ("codigo", "VARCHAR(20) UNIQUE NULL"),
                ("area", "VARCHAR(100) NULL"),
                ("intensidad_horaria", "INT NOT NULL DEFAULT 0"),
                ("activo", "TINYINT(1) NOT NULL DEFAULT 1"),
                ("created_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"),
                ("updated_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
            ]
            for col_name, col_def in materia_cols:
                try:
                    cursor.execute(f"ALTER TABLE materias ADD COLUMN {col_name} {col_def};")
                except Exception:
                    pass

            cursor.execute("SELECT COUNT(*) FROM materias;")
            materia_count = cursor.fetchone()[0]
            if materia_count == 0:
                default_materias = [
                    ('Matemáticas', 'MAT', 'Materia de cálculo, álgebra y geometría', 'Matemáticas', 5),
                    ('Lenguaje', 'LEN', 'Materia de comprensión lectora y expresión escrita', 'Humanidades y Lengua Castellana', 5),
                    ('Ciencias Naturales', 'CNAT', 'Materia de ciencias y biología', 'Ciencias Naturales', 4),
                    ('Ciencias Sociales', 'CSOC', 'Materia de historia y geografía', 'Ciencias Sociales', 4),
                    ('Inglés', 'ING', 'Materia de idioma extranjero', 'Idiomas Extranjeros', 3),
                    ('Educación Física', 'EDF', 'Materia de deporte y actividad física', 'Educación Física', 2)
                ]
                cursor.executemany(
                    "INSERT INTO materias (nombre, codigo, descripcion, area, intensidad_horaria) VALUES (%s, %s, %s, %s, %s);",
                    default_materias
                )
                print("[OK] Se insertaron materias por defecto en la tabla 'materias'.")
            else:
                # Asegurar que las materias existentes tengan códigos y áreas si están nulos
                updates = [
                    ('MAT', 'Matemáticas', 5, 'Matemáticas'),
                    ('LEN', 'Humanidades y Lengua Castellana', 5, 'Lenguaje'),
                    ('CNAT', 'Ciencias Naturales', 4, 'Ciencias Naturales'),
                    ('CSOC', 'Ciencias Sociales', 4, 'Ciencias Sociales'),
                    ('ING', 'Idiomas Extranjeros', 3, 'Inglés'),
                    ('EDF', 'Educación Física', 2, 'Educación Física'),
                ]
                for cod, area, horas, nom in updates:
                    cursor.execute(
                        "UPDATE materias SET codigo = COALESCE(codigo, %s), area = COALESCE(area, %s), intensidad_horaria = CASE WHEN intensidad_horaria = 0 THEN %s ELSE intensidad_horaria END WHERE nombre = %s;",
                        (cod, area, horas, nom)
                    )
        except Exception as e:
            print(f"[WARN] No se pudo procesar la tabla 'materias': {e}")

        # ====================================================
        # CREAR TABLA curso_materia SI NO EXISTE
        # ====================================================
        try:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS curso_materia (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    curso_id INT NOT NULL,
                    materia_id INT NOT NULL,
                    intensidad_horaria INT NULL,
                    activo TINYINT(1) NOT NULL DEFAULT 1,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_curso_materia_curso FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
                    CONSTRAINT fk_curso_materia_materia FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
                    UNIQUE KEY uq_curso_materia (curso_id, materia_id)
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
                """
            )
            print("[OK] Tabla 'curso_materia' verificada o creada.")

            # Si curso_materia está vacía, asociar materias activas a los cursos existentes
            cursor.execute("SELECT COUNT(*) FROM curso_materia;")
            cm_count = cursor.fetchone()[0]
            if cm_count == 0:
                cursor.execute("SELECT id FROM cursos;")
                curso_rows = cursor.fetchall()
                cursor.execute("SELECT id, intensidad_horaria FROM materias WHERE activo = 1;")
                materia_rows = cursor.fetchall()
                for (cid,) in curso_rows:
                    for mid, horas in materia_rows:
                        cursor.execute(
                            "INSERT IGNORE INTO curso_materia (curso_id, materia_id, intensidad_horaria, activo) VALUES (%s, %s, %s, 1);",
                            (cid, mid, horas)
                        )
                print("[OK] Se asociaron materias base a los cursos existentes en 'curso_materia'.")
        except Exception as e:
            print(f"[WARN] No se pudo crear la tabla 'curso_materia': {e}")

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
                
        # ====================================================
        # USUARIOS SEED BÁSICOS (Admin, Docente, Familia)
        # ====================================================
        try:
            from werkzeug.security import generate_password_hash
            
            # 1. Admin por defecto
            cursor.execute("SELECT id FROM usuarios WHERE email = 'admin@monteverde.com';")
            if not cursor.fetchone():
                cursor.execute(
                    """
                    INSERT INTO usuarios (nombre, email, password, rol, estudiante_id, activo, eliminado)
                    VALUES (%s, %s, %s, %s, NULL, 1, 0);
                    """,
                    ('Administrador Sistema', 'admin@monteverde.com', generate_password_hash('admin123'), 'admin')
                )
                print("[OK] Usuario 'admin@monteverde.com' creado.")

            # 2. Docente por defecto
            cursor.execute("SELECT id FROM usuarios WHERE email = 'docente@monteverde.com';")
            if not cursor.fetchone():
                cursor.execute(
                    """
                    INSERT INTO usuarios (nombre, email, password, rol, estudiante_id, activo, eliminado)
                    VALUES (%s, %s, %s, %s, NULL, 1, 0);
                    """,
                    ('María García López', 'docente@monteverde.com', generate_password_hash('docente123'), 'docente')
                )
                print("[OK] Usuario 'docente@monteverde.com' creado.")

            # 3. Familia por defecto (soportar ambos emails de acceso: familiagonzalez@monteverde.com y familia@monteverde.com)
            cursor.execute("SELECT id FROM estudiantes LIMIT 1;")
            primer_est = cursor.fetchone()
            est_id = primer_est[0] if primer_est else None

            familias_seed = [
                ('Familia González', 'familiagonzalez@monteverde.com', 'familia123'),
                ('Familia González', 'familia@monteverde.com', 'familia123')
            ]

            for fam_nombre, fam_email, fam_pass in familias_seed:
                cursor.execute("SELECT id FROM usuarios WHERE email = %s;", (fam_email,))
                fam_row = cursor.fetchone()
                if not fam_row:
                    hashed_pass = generate_password_hash(fam_pass)
                    cursor.execute(
                        """
                        INSERT INTO usuarios (nombre, email, password, rol, estudiante_id, activo, eliminado)
                        VALUES (%s, %s, %s, %s, %s, 1, 0);
                        """,
                        (fam_nombre, fam_email, hashed_pass, 'familia', est_id)
                    )
                    new_fam_id = cursor.lastrowid
                    print(f"[OK] Usuario '{fam_email}' creado con éxito.")
                else:
                    new_fam_id = fam_row[0]
                    # Asegurar que esté activo
                    cursor.execute("UPDATE usuarios SET activo = 1, eliminado = 0 WHERE id = %s;", (new_fam_id,))

                if est_id and new_fam_id:
                    cursor.execute(
                        "INSERT IGNORE INTO familia_estudiante (familia_id, estudiante_id) VALUES (%s, %s);",
                        (new_fam_id, est_id)
                    )
        except Exception as e:
            print(f"[WARN] No se pudo verificar o crear usuarios semilla: {e}")

        # ====================================================
        # TABLA configuracion_institucional (MIGRACIÓN 03)
        # ====================================================
        try:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS configuracion_institucional (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    institucion_id VARCHAR(50) NOT NULL DEFAULT 'MONTEVERDE_DEFAULT',
                    nombre_institucion VARCHAR(150) NOT NULL DEFAULT 'Colegio MonteVerde',
                    director VARCHAR(150) NOT NULL DEFAULT 'Fernando MonteVerde',
                    anio_escolar VARCHAR(20) NOT NULL DEFAULT '2026',
                    periodo_actual VARCHAR(50) NOT NULL DEFAULT 'Primer Trimestre',
                    direccion VARCHAR(255) NULL DEFAULT 'Calle de la Arboleda #45, Ciudad Jardín',
                    telefono VARCHAR(50) NULL DEFAULT '+57 (601) 456-7890',
                    email_contacto VARCHAR(150) NULL DEFAULT 'contacto@monteverde.edu.co',
                    activa TINYINT(1) NOT NULL DEFAULT 1,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    usuario_actualizo_id INT NULL,
                    CONSTRAINT uq_config_institucion_id UNIQUE (institucion_id),
                    CONSTRAINT fk_config_usuario_actualizo FOREIGN KEY (usuario_actualizo_id) 
                        REFERENCES usuarios (id) ON DELETE SET NULL ON UPDATE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
                """
            )
            cursor.execute(
                """
                INSERT INTO configuracion_institucional 
                  (institucion_id, nombre_institucion, director, anio_escolar, periodo_actual, direccion, telefono, email_contacto, activa)
                SELECT 
                  'MONTEVERDE_DEFAULT', 'Colegio MonteVerde', 'Fernando MonteVerde', '2026', 'Primer Trimestre', 
                  'Calle de la Arboleda #45, Ciudad Jardín', '+57 (601) 456-7890', 'contacto@monteverde.edu.co', 1
                WHERE NOT EXISTS (
                  SELECT 1 FROM configuracion_institucional WHERE institucion_id = 'MONTEVERDE_DEFAULT'
                );
                """
            )
            print("[OK] Tabla 'configuracion_institucional' verificada o creada con datos iniciales.")
        except Exception as e:
            print(f"[WARN] No se pudo verificar/crear la tabla 'configuracion_institucional': {e}")

        # ====================================================
        # TABLA conversaciones_archivadas
        # ====================================================
        try:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS conversaciones_archivadas (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    contacto_id INT NOT NULL,
                    fecha_archivado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_conv_arch_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    CONSTRAINT fk_conv_arch_contacto FOREIGN KEY (contacto_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    UNIQUE KEY uq_usuario_contacto_archivado (usuario_id, contacto_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
                """
            )
            print("[OK] Tabla 'conversaciones_archivadas' verificada o creada con éxito.")
        except Exception as e:
            print(f"[WARN] No se pudo verificar/crear la tabla 'conversaciones_archivadas': {e}")

        # ====================================================
        # TABLA configuracion_evaluacion
        # ====================================================
        try:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS configuracion_evaluacion (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    anio_academico INT NOT NULL,
                    nombre VARCHAR(150) NOT NULL DEFAULT 'Configuración Académica Estándar',
                    tipo_periodo VARCHAR(50) NOT NULL DEFAULT 'Bimestre',
                    numero_periodos INT NOT NULL DEFAULT 4,
                    indicadores_por_periodo INT NOT NULL DEFAULT 2,
                    notas_por_indicador INT NOT NULL DEFAULT 3,
                    tipo_escala VARCHAR(50) NOT NULL DEFAULT 'NUMERICA_CINCO',
                    escala_minima DECIMAL(5,2) NOT NULL DEFAULT 1.00,
                    escala_maxima DECIMAL(5,2) NOT NULL DEFAULT 5.00,
                    nota_aprobatoria DECIMAL(5,2) NOT NULL DEFAULT 3.00,
                    activa TINYINT(1) NOT NULL DEFAULT 1,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    usuario_actualizo_id INT NULL,
                    UNIQUE KEY uq_config_eval_anio (anio_academico),
                    CONSTRAINT fk_config_eval_usuario FOREIGN KEY (usuario_actualizo_id) 
                        REFERENCES usuarios (id) ON DELETE SET NULL ON UPDATE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
                """
            )
            cursor.execute(
                """
                INSERT INTO configuracion_evaluacion 
                  (anio_academico, nombre, tipo_periodo, numero_periodos, indicadores_por_periodo, notas_por_indicador, tipo_escala, escala_minima, escala_maxima, nota_aprobatoria, activa)
                SELECT 
                  2026, 'Configuración Académica 2026', 'Bimestre', 4, 2, 3, 'NUMERICA_CINCO', 1.00, 5.00, 3.00, 1
                WHERE NOT EXISTS (
                  SELECT 1 FROM configuracion_evaluacion WHERE anio_academico = 2026
                );
                """
            )
            print("[OK] Tabla 'configuracion_evaluacion' verificada o creada con datos iniciales.")
        except Exception as e:
            print(f"[WARN] No se pudo verificar/crear la tabla 'configuracion_evaluacion': {e}")

        conn.close()

    print("[SUCCESS] Database initialization and migration completed successfully!")

except Exception as e:
    print(f"[ERROR] Error initializing database: {e}")
