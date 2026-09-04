import os
import sys
from datetime import datetime, timedelta, date
from werkzeug.security import generate_password_hash
import pymysql
from dotenv import load_dotenv

# Cargar variables de entorno
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, '.env'))

db_host = os.environ.get('DB_HOST', '127.0.0.1')
db_port = int(os.environ.get('DB_PORT', 3306))
db_user = os.environ.get('DB_USER', 'root')
db_password = os.environ.get('DB_PASSWORD', '')
db_name = os.environ.get('DB_NAME', 'monteverde_db')

print(f"=== Sembrando Datos Demo en MonteVerde DB ({db_host}:{db_port}/{db_name}) ===")

conn = pymysql.connect(
    host=db_host,
    port=db_port,
    user=db_user,
    password=db_password,
    database=db_name,
    autocommit=False,
    charset='utf8mb4'
)

try:
    with conn.cursor() as cur:
        # -------------------------------------------------------------
        # 1. CURSOS
        # -------------------------------------------------------------
        print("1. Sembrando Cursos...")
        cursos_data = [
            (1, 'Primero A', '1°', 'A', 'Curso de primer grado grupo A'),
            (2, 'Primero B', '1°', 'B', 'Curso de primer grado grupo B'),
            (3, 'Segundo A', '2°', 'A', 'Curso de segundo grado grupo A'),
            (4, 'Tercero A', '3°', 'A', 'Curso de tercer grado grupo A'),
            (5, 'Cuarto A', '4°', 'A', 'Curso de cuarto grado grupo A'),
            (6, 'Quinto A', '5°', 'A', 'Curso de quinto grado grupo A'),
        ]
        for cid, nom, niv, let, desc in cursos_data:
            cur.execute("""
                INSERT INTO cursos (id, nombre, nivel, letra, descripcion)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE nombre=%s, nivel=%s, letra=%s, descripcion=%s;
            """, (cid, nom, niv, let, desc, nom, niv, let, desc))

        # -------------------------------------------------------------
        # 2. MATERIAS
        # -------------------------------------------------------------
        print("2. Sembrando Materias...")
        materias_data = [
            (1, 'Matemáticas', 'MAT', 'Cálculo, álgebra, geometría y pensamiento lógico', 'Matemáticas', 5, 1),
            (2, 'Lenguaje', 'LEN', 'Comprensión lectora, gramática y expresión escrita', 'Humanidades y Lengua Castellana', 5, 1),
            (3, 'Ciencias Naturales', 'CNAT', 'Biología, ecosistemas, método científico y física básica', 'Ciencias Naturales', 4, 1),
            (4, 'Ciencias Sociales', 'CSOC', 'Historia, geografía, democracia y convivencia ciudadana', 'Ciencias Sociales', 4, 1),
            (5, 'Inglés', 'ING', 'Idioma extranjero, vocabulario, comprensión auditiva y conversación', 'Idiomas Extranjeros', 3, 1),
            (6, 'Educación Física', 'EDF', 'Deporte, actividad física, motricidad y hábitos saludables', 'Educación Física', 2, 1),
            (7, 'Educación Artística', 'ART', 'Artes plásticas, música, creatividad y expresión corporal', 'Educación Artística', 2, 1)
        ]
        for mid, nom, cod, desc, area, horas, act in materias_data:
            cur.execute("""
                INSERT INTO materias (id, nombre, codigo, descripcion, area, intensidad_horaria, activo)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE nombre=%s, codigo=%s, descripcion=%s, area=%s, intensidad_horaria=%s, activo=%s;
            """, (mid, nom, cod, desc, area, horas, act, nom, cod, desc, area, horas, act))

        # -------------------------------------------------------------
        # 3. CURSO_MATERIA
        # -------------------------------------------------------------
        print("3. Sembrando Curso - Materia...")
        for cid in [1, 2, 3, 4, 5, 6]:
            for mid, _, _, _, _, horas, _ in materias_data:
                cur.execute("""
                    INSERT IGNORE INTO curso_materia (curso_id, materia_id, intensidad_horaria, activo)
                    VALUES (%s, %s, %s, 1);
                """, (cid, mid, horas))

        # -------------------------------------------------------------
        # 4. ESTUDIANTES
        # -------------------------------------------------------------
        print("4. Sembrando Estudiantes...")
        estudiantes_data = [
            (1, 'Santiago González Pérez', 1),
            (2, 'Valentina López García', 1),
            (3, 'Matías Rodríguez Silva', 1),
            (4, 'Isabella Martínez Torres', 1),
            (5, 'Lucas Jiménez Castro', 1),
            (6, 'Sofía Hernández Ruiz', 2),
            (7, 'Diego Santos Díaz', 2),
            (8, 'Camila Torres Moreno', 2),
            (9, 'Alejandro Vargas Lima', 3),
            (10, 'Martina Castro Rojas', 3),
            (11, 'Daniel Morales Ortiz', 3),
            (12, 'Mariana Ruiz Navarro', 4),
            (13, 'Gabriel Mendoza Peña', 4),
            (14, 'Lucía Duarte Ramos', 5),
            (15, 'Felipe Cardona Vega', 5),
            (16, 'Elena Serrano Gómez', 6),
            (17, 'Samuel Pinzón Correa', 6),
        ]
        for eid, nom, cid in estudiantes_data:
            cur.execute("""
                INSERT INTO estudiantes (id, nombre, curso_id)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE nombre=%s, curso_id=%s;
            """, (eid, nom, cid, nom, cid))

        # -------------------------------------------------------------
        # 5. USUARIOS
        # -------------------------------------------------------------
        print("5. Sembrando Usuarios...")
        hash_admin = generate_password_hash('admin123')
        hash_docente = generate_password_hash('docente123')
        hash_familia = generate_password_hash('familia123')
        hash_coord = generate_password_hash('coordinador123')

        usuarios_data = [
            (1, 'Administrador Sistema', 'admin@monteverde.com', hash_admin, 'admin', None),
            (10, 'Coordinador Académico', 'coordinador@monteverde.com', hash_coord, 'coordinador', None),
            (2, 'María García López', 'docente@monteverde.com', hash_docente, 'docente', None),
            (3, 'Familia González', 'familiagonzalez@monteverde.com', hash_familia, 'familia', 1),
            (5, 'Familia López García', 'familia.lopez@monteverde.com', hash_familia, 'familia', 2),
            (6, 'Familia Rodríguez Silva', 'familia.rodriguez@monteverde.com', hash_familia, 'familia', 3),
            (7, 'Familia Martínez Torres', 'familia.martinez@monteverde.com', hash_familia, 'familia', 4),
            (52, 'Profesor Carlos Ruiz', 'carlos.docente@monteverde.edu.co', hash_docente, 'docente', None)
        ]
        for uid, nom, email, psw, rol, est_id in usuarios_data:
            cur.execute("""
                INSERT INTO usuarios (id, nombre, email, password, rol, estudiante_id, activo, eliminado)
                VALUES (%s, %s, %s, %s, %s, %s, 1, 0)
                ON DUPLICATE KEY UPDATE nombre=%s, password=%s, rol=%s, estudiante_id=%s, activo=1, eliminado=0;
            """, (uid, nom, email, psw, rol, est_id, nom, psw, rol, est_id))

        # Corregir roles no válidos o legacy
        cur.execute("UPDATE usuarios SET rol = 'admin' WHERE rol NOT IN ('admin', 'docente', 'familia', 'coordinador');")

        # Mapeo dinámico de emails a IDs reales en la base de datos
        cur.execute("SELECT email, id FROM usuarios;")
        user_ids = {row[0]: row[1] for row in cur.fetchall()}

        # -------------------------------------------------------------
        # 6. FAMILIA_ESTUDIANTE
        # -------------------------------------------------------------
        print("6. Sembrando Vinculación Familias...")
        fam_est_data = [
            (user_ids.get('familiagonzalez@monteverde.com'), 1), # Familia González -> Santiago (1)
            (user_ids.get('familiagonzalez@monteverde.com'), 6), # Familia González -> Sofía (6)
            (user_ids.get('familia.lopez@monteverde.com'), 2),    # Familia López -> Valentina (2)
            (user_ids.get('familia.rodriguez@monteverde.com'), 3),# Familia Rodríguez -> Matías (3)
            (user_ids.get('familia.martinez@monteverde.com'), 4), # Familia Martínez -> Isabella (4)
        ]
        for fid, eid in fam_est_data:
            if fid and eid:
                cur.execute("INSERT IGNORE INTO familia_estudiante (familia_id, estudiante_id) VALUES (%s, %s);", (fid, eid))

        # -------------------------------------------------------------
        # 7. DOCENTE ASIGNACIONES (docente_asignacion & docente_curso)
        # -------------------------------------------------------------
        print("7. Sembrando Asignaciones Docentes...")
        doc_maria_id = user_ids.get('docente@monteverde.com', 2)
        doc_carlos_id = user_ids.get('carlos.docente@monteverde.edu.co', 52)
        doc_asig = [
            # María García López
            (doc_maria_id, 1, 1), # Primero A -> Matemáticas
            (doc_maria_id, 1, 2), # Primero A -> Lenguaje
            (doc_maria_id, 1, 3), # Primero A -> Ciencias Naturales
            (doc_maria_id, 2, 1), # Primero B -> Matemáticas
            (doc_maria_id, 2, 2), # Primero B -> Lenguaje
            (doc_maria_id, 3, 1), # Segundo A -> Matemáticas
            # Carlos Ruiz
            (doc_carlos_id, 1, 4), # Primero A -> Ciencias Sociales
            (doc_carlos_id, 1, 5), # Primero A -> Inglés
            (doc_carlos_id, 1, 6), # Primero A -> Educación Física
            (doc_carlos_id, 2, 3), # Primero B -> Ciencias Naturales
            (doc_carlos_id, 2, 4), # Primero B -> Ciencias Sociales
            (doc_carlos_id, 3, 3), # Segundo A -> Ciencias Naturales
        ]
        for did, cid, mid in doc_asig:
            if did and cid and mid:
                cur.execute("""
                    INSERT IGNORE INTO docente_asignacion (docente_id, curso_id, materia_id)
                    VALUES (%s, %s, %s);
                """, (did, cid, mid))
                cur.execute("""
                    INSERT IGNORE INTO docente_curso (docente_id, curso_id)
                    VALUES (%s, %s);
                """, (did, cid))

        # -------------------------------------------------------------
        # 8. BIMESTRES & INDICADORES DE LOGRO
        # -------------------------------------------------------------
        print("8. Sembrando Bimestres e Indicadores...")
        # Bimestres
        cur.execute("SELECT id FROM bimestres_config WHERE orden = 1 LIMIT 1;")
        row_b1 = cur.fetchone()
        if row_b1:
            b1_id = row_b1[0]
        else:
            cur.execute("INSERT INTO bimestres_config (nombre, anio, orden) VALUES ('Bimestre 1', 2026, 1);")
            b1_id = cur.lastrowid

        # Indicadores para Primero A con María García (docente 2)
        indicadores = [
            # Materia 1: Matemáticas
            (2, 1, 1, b1_id, 1, 'Comprende y aplica operaciones básicas y resolución de problemas cotidianos'),
            (2, 1, 1, b1_id, 2, 'Demuestra razonamiento lógico y habilidad en ejercicios prácticos'),
            # Materia 2: Lenguaje
            (2, 1, 2, b1_id, 1, 'Lee comprensivamente textos narrativos e informativos acordes al nivel'),
            (2, 1, 2, b1_id, 2, 'Redacta composiciones sencillas con adecuada ortografía y coherencia'),
            # Materia 3: Ciencias Naturales
            (2, 1, 3, b1_id, 1, 'Identifica las características, clasificación y necesidades de los seres vivos'),
            (2, 1, 3, b1_id, 2, 'Reconoce la importancia del cuidado del medio ambiente y recursos naturales'),
        ]
        
        ind_ids = {}
        for did, cid, mid, bid, num, desc in indicadores:
            cur.execute("""
                SELECT id FROM indicadores_logro 
                WHERE docente_id=%s AND curso_id=%s AND materia_id=%s AND bimestre_id=%s AND numero=%s;
            """, (did, cid, mid, bid, num))
            exist_ind = cur.fetchone()
            if not exist_ind:
                cur.execute("""
                    INSERT INTO indicadores_logro (docente_id, curso_id, materia_id, bimestre_id, numero, descripcion, fecha_creacion)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW());
                """, (did, cid, mid, bid, num, desc))
                ind_ids[(mid, num)] = cur.lastrowid
            else:
                ind_ids[(mid, num)] = exist_ind[0]

        # -------------------------------------------------------------
        # 9. TAREAS ACADÉMICAS & ENTREGAS
        # -------------------------------------------------------------
        print("9. Sembrando Tareas y Entregas...")
        now = datetime.now()
        tareas_data = [
            (
                'Taller práctico: Fracciones y Resolución de Problemas',
                'Resolver los ejercicios de la página 45 a 47 del libro guía. Incluir procedimientos completos y justificación.',
                now - timedelta(days=5),
                now + timedelta(days=3),
                'PUBLICADA', 2, 1, 1, 1, b1_id, ind_ids.get((1, 1)), 1, 'TALLER'
            ),
            (
                'Lectura Comprensiva y Resumen: El Principito',
                'Lectura de los capítulos 1 al 4 y elaboración de un mapa mental ilustrado con las ideas clave.',
                now - timedelta(days=3),
                now + timedelta(days=5),
                'PUBLICADA', 2, 1, 2, 1, b1_id, ind_ids.get((2, 1)), 1, 'LECTURA'
            ),
            (
                'Mini-Proyecto: Clasificación de Seres Vivos y Ecosistemas',
                'Diseñar una infografía o maqueta digital sobre los factores bióticos y abióticos de un bosque.',
                now - timedelta(days=2),
                now + timedelta(days=7),
                'PUBLICADA', 2, 1, 3, 1, b1_id, ind_ids.get((3, 1)), 1, 'PROYECTO'
            ),
        ]
        
        created_tareas = []
        for tit, desc, f_crea, f_venc, est, did, cid, mid, cal_bim, bid, ind_id, num_nota, tip_eval in tareas_data:
            cur.execute("""
                SELECT id FROM tareas WHERE titulo=%s AND curso_id=%s AND materia_id=%s;
            """, (tit, cid, mid))
            t_row = cur.fetchone()
            if not t_row:
                cur.execute("""
                    INSERT INTO tareas (titulo, descripcion, fecha_creacion, fecha_vencimiento, estado, docente_id, curso_id, materia_id, califica_bimestre, bimestre_id, indicador_id, numero_nota, tipo_evaluacion)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (tit, desc, f_crea, f_venc, est, did, cid, mid, cal_bim, bid, ind_id, num_nota, tip_eval))
                tid = cur.lastrowid
            else:
                tid = t_row[0]
            created_tareas.append((tid, mid))

        # Entregas de tareas para estudiantes de Primero A (1..5)
        for tid, mid in created_tareas:
            # Estudiante 1 (Santiago) -> Calificada
            cur.execute("""
                INSERT INTO entregas (tarea_id, estudiante_id, fecha_entrega, archivo_url, contenido, estado, calificacion, comentarios)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE calificacion=%s, estado=%s;
            """, (tid, 1, now - timedelta(days=1), 'https://ejemplo.com/taller_santiago.pdf', 'Entrega completa con procedimientos y gráficos.', 'CALIFICADA', 4.7, 'Excelente trabajo y presentación impecable.', 4.7, 'CALIFICADA'))
            
            # Estudiante 2 (Valentina) -> Calificada
            cur.execute("""
                INSERT INTO entregas (tarea_id, estudiante_id, fecha_entrega, archivo_url, contenido, estado, calificacion, comentarios)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE calificacion=%s, estado=%s;
            """, (tid, 2, now - timedelta(days=2), 'https://ejemplo.com/taller_valentina.pdf', 'Adjunto archivo con desarrollo paso a paso.', 'CALIFICADA', 5.0, 'Puntaje perfecto, razonamiento brillante.', 5.0, 'CALIFICADA'))

            # Estudiante 3 (Matías) -> Calificada
            cur.execute("""
                INSERT INTO entregas (tarea_id, estudiante_id, fecha_entrega, archivo_url, contenido, estado, calificacion, comentarios)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE calificacion=%s, estado=%s;
            """, (tid, 3, now - timedelta(days=1), 'https://ejemplo.com/taller_matias.pdf', 'Solución de la guía propuesta.', 'CALIFICADA', 4.2, 'Muy buen trabajo, pulir redacción final.', 4.2, 'CALIFICADA'))

            # Estudiante 4 (Isabella) -> Entregada (pendiente revisión)
            cur.execute("""
                INSERT INTO entregas (tarea_id, estudiante_id, fecha_entrega, archivo_url, contenido, estado, calificacion, comentarios)
                VALUES (%s, %s, %s, %s, %s, %s, NULL, NULL)
                ON DUPLICATE KEY UPDATE estado='ENTREGADA';
            """, (tid, 4, now, 'https://ejemplo.com/taller_isabella.pdf', 'Envío de tarea finalizada.', 'ENTREGADA'))

            # Estudiante 5 (Lucas) -> Calificada (caso en riesgo)
            cur.execute("""
                INSERT INTO entregas (tarea_id, estudiante_id, fecha_entrega, archivo_url, contenido, estado, calificacion, comentarios)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE calificacion=%s, estado=%s;
            """, (tid, 5, now - timedelta(days=1), 'https://ejemplo.com/taller_lucas.pdf', 'Entrega parcial.', 'CALIFICADA', 2.8, 'Faltaron varios ejercicios prácticos, requiere refuerzo.', 2.8, 'CALIFICADA'))

        # -------------------------------------------------------------
        # 10. CALIFICACIONES BIMESTRALES & CALIFICACIONES LEGACY
        # -------------------------------------------------------------
        print("10. Sembrando Calificaciones...")
        # Matriz de notas por estudiante en Primero A (Matemáticas, Lenguaje, Ciencias Naturales)
        notas_estudiantes = {
            1: { 1: [4.5, 4.2, 4.8], 2: [4.0, 4.5, 4.6], 3: [4.2, 4.4, 4.5] }, # Santiago
            2: { 1: [5.0, 4.8, 5.0], 2: [4.8, 5.0, 4.7], 3: [4.9, 5.0, 4.8] }, # Valentina
            3: { 1: [3.8, 4.0, 4.2], 2: [4.2, 3.9, 4.1], 3: [4.5, 4.0, 4.3] }, # Matías
            4: { 1: [4.2, 4.5, 4.0], 2: [4.4, 4.6, 4.2], 3: [4.0, 4.3, 4.4] }, # Isabella
            5: { 1: [2.8, 3.0, 2.7], 2: [3.2, 2.9, 3.1], 3: [3.0, 3.2, 2.8] }, # Lucas (alerta)
        }

        for est_id, materias_dict in notas_estudiantes.items():
            for mid, notas_list in materias_dict.items():
                for ind_num in [1, 2]:
                    ind_id = ind_ids.get((mid, ind_num))
                    if ind_id:
                        for n_idx, nota_val in enumerate(notas_list, start=1):
                            cur.execute("""
                                INSERT INTO calificaciones_bimestre (estudiante_id, docente_id, indicador_id, numero_nota, nota, fecha_registro)
                                VALUES (%s, 2, %s, %s, %s, NOW())
                                ON DUPLICATE KEY UPDATE nota=%s, fecha_registro=NOW();
                            """, (est_id, ind_id, n_idx, nota_val, nota_val))
                
                # También sembrar en calificaciones legacy para compatibilidad
                nom_asig = 'Matematicas' if mid == 1 else ('Lenguaje' if mid == 2 else 'Ciencias')
                prom = sum(notas_list) / len(notas_list)
                cur.execute("""
                    INSERT INTO calificaciones (estudiante_id, asignatura, periodo, nota, fecha_registro)
                    VALUES (%s, %s, '2026-P1', %s, NOW())
                    ON DUPLICATE KEY UPDATE nota=%s, fecha_registro=NOW();
                """, (est_id, nom_asig, prom, prom))

        # -------------------------------------------------------------
        # 11. ASISTENCIA
        # -------------------------------------------------------------
        print("11. Sembrando Asistencia...")
        # Generar asistencia de los últimos 20 días escolares
        dias_cont = 0
        dia_cursor = date.today()
        while dias_cont < 20:
            if dia_cursor.weekday() < 5: # Lunes a Viernes
                for est_id in [1, 2, 3, 4, 5]:
                    # Estado según estudiante
                    if est_id == 5 and dias_cont in (2, 7):
                        estado = 'AUSENTE'
                    elif est_id == 3 and dias_cont == 4:
                        estado = 'TARDE'
                    elif est_id == 1 and dias_cont == 10:
                        estado = 'JUSTIFICADO'
                    else:
                        estado = 'PRESENTE'

                    cur.execute("""
                        INSERT INTO asistencia (estudiante_id, fecha, estado)
                        VALUES (%s, %s, %s)
                        ON DUPLICATE KEY UPDATE estado=%s;
                    """, (est_id, dia_cursor, estado, estado))
                dias_cont += 1
            dia_cursor -= timedelta(days=1)

        # -------------------------------------------------------------
        # 12. OBSERVACIONES
        # -------------------------------------------------------------
        print("12. Sembrando Observaciones...")
        observaciones_data = [
            (1, 2, date.today() - timedelta(days=2), 'POSITIVA', 'Santiago demostró un excelente liderazgo y colaboración durante el trabajo en equipo de matemáticas.'),
            (1, 2, date.today() - timedelta(days=6), 'POSITIVA', 'Gran participación y curiosidad en la clase de Ciencias Naturales.'),
            (2, 2, date.today() - timedelta(days=3), 'POSITIVA', 'Valentina obtuvo desempeño sobresaliente en la resolución de problemas lógicos.'),
            (3, 2, date.today() - timedelta(days=5), 'NEUTRAL', 'Matías mostró una actitud receptiva aunque debe asegurar entregar a tiempo sus materiales.'),
            (4, 2, date.today() - timedelta(days=4), 'POSITIVA', 'Isabella colaboró entusiastamente en la dinámica de lectura compartida.'),
            (5, 2, date.today() - timedelta(days=1), 'NEGATIVA', 'Lucas presentó dificultades de concentración y requiere apoyo en casa con el repaso de las guías de matemáticas.')
        ]
        for eid, did, fec, tip, det in observaciones_data:
            cur.execute("""
                INSERT INTO observaciones (estudiante_id, docente_id, fecha, tipo, detalle)
                VALUES (%s, %s, %s, %s, %s);
            """, (eid, did, fec, tip, det))

        # -------------------------------------------------------------
        # 13. CIRCULARES
        # -------------------------------------------------------------
        print("13. Sembrando Circulares...")
        circulares_data = [
            (
                'Bienvenida al Año Escolar 2026 - Colegio MonteVerde',
                'Estimada comunidad educativa: Les damos la más calurosa bienvenida a este nuevo ciclo escolar 2026. Renovamos nuestro compromiso pedagógico y humano para acompañar el crecimiento integral de cada estudiante con excelencia académica y calidez.',
                now - timedelta(days=15),
                1
            ),
            (
                'Cronograma de Evaluaciones del Primer Bimestre',
                'Informamos a las familias y docentes que del 15 al 20 de este mes se llevará a cabo el cierre y consolidación del Primer Bimestre. Los invitamos a consultar el portal web para el seguimiento de entregas y retroalimentaciones.',
                now - timedelta(days=5),
                1
            ),
            (
                'Jornada Cultural y Deportiva Intercolegiada',
                'Este próximo viernes celebraremos nuestra tradicional jornada deportiva y de talentos artísticos. Los estudiantes podrán asistir con su uniforme deportivo institucional y compartir en comunidad.',
                now - timedelta(days=2),
                1
            ),
        ]
        for tit, cont, fec, aut in circulares_data:
            cur.execute("""
                INSERT INTO circulares (titulo, contenido, fecha_publicacion, autor_id)
                VALUES (%s, %s, %s, %s);
            """, (tit, cont, fec, aut))

        # -------------------------------------------------------------
        # 14. MENSAJES
        # -------------------------------------------------------------
        print("14. Sembrando Mensajes...")
        mensajes_defs = [
            # Docente María -> Familia González (familiagonzalez@monteverde.com)
            ('docente@monteverde.com', 'familiagonzalez@monteverde.com', 'Felicitaciones por el desempeño de Santiago', 'Estimada Familia González: Queremos felicitar a Santiago por su destacada participación y compromiso en las clases de Matemáticas. ¡Continúen apoyándolo así!', now - timedelta(days=3), 1),
            # Familia González (familiagonzalez@monteverde.com) -> Docente María
            ('familiagonzalez@monteverde.com', 'docente@monteverde.com', 'Re: Felicitaciones por el desempeño de Santiago', 'Muchas gracias Profesora María. Nos alegra mucho saber de su progreso y estaremos muy atentos a los próximos proyectos escolares.', now - timedelta(days=2), 1),
            # Docente María -> Familia González (familiagonzalez@monteverde.com)
            ('docente@monteverde.com', 'familiagonzalez@monteverde.com', 'Circular informativa sobre proyectos del mes', 'Adjuntamos las pautas para la preparación del proyecto de Ciencias Naturales de la próxima semana.', now - timedelta(days=1), 0),
            # Docente María -> Familia López
            ('docente@monteverde.com', 'familia.lopez@monteverde.com', 'Excelente desempeño de Valentina', 'Buenas tardes, Valentina ha demostrado un rendimiento sobresaliente en todas las actividades de lectura y redacción.', now - timedelta(days=4), 1),
            # Docente María -> Familia Martínez
            ('docente@monteverde.com', 'familia.martinez@monteverde.com', 'Reunión de seguimiento pedagógico', 'Estimados padres de Isabella: Nos gustaría coordinar una breve reunión virtual para comentar los avances del bimestre.', now - timedelta(hours=5), 0),
        ]
        for em_email, rec_email, asu, cue, fec, lei in mensajes_defs:
            em_id = user_ids.get(em_email)
            rec_id = user_ids.get(rec_email)
            if em_id and rec_id:
                cur.execute("""
                    INSERT INTO mensajes (emisor_id, receptor_id, asunto, cuerpo, fecha, leido, eliminado)
                    VALUES (%s, %s, %s, %s, %s, %s, 0);
                """, (em_id, rec_id, asu, cue, fec, lei))

    conn.commit()
    print("\n[ÉXITO] ¡Todos los datos demo fueron sembrados satisfactoriamente!")

except Exception as e:
    conn.rollback()
    print(f"\n[ERROR] Falló la siembra de datos demo: {e}")
    sys.exit(1)
finally:
    conn.close()
