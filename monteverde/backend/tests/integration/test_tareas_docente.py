import os
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-tareas-monteverde-32bytes!'

from config import Config
Config.SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
Config.SQLALCHEMY_ECHO = False

import unittest
import json
from datetime import datetime, timedelta
from app import create_app
from src.extensions import db
from src.models.usuario import Usuario
from src.models.curso import Curso
from src.models.estudiante import Estudiante
from src.models.materia import Materia
from src.models.docente_asignacion import DocenteAsignacion
from src.models.tarea import Tarea
from src.models.entrega import Entrega


class TareasDocenteTestCase(unittest.TestCase):
    """
    Suite de pruebas integrales para el módulo de Tareas y Entregas.
    Valida:
    - Creación, edición, eliminación y listado de tareas.
    - Seguridad IDOR y validación de asignaciones docentes.
    - Registro de entregas y calificaciones con validación de rangos.
    - Integración con el dashboard docente.
    - Control de acceso por autenticación y roles.
    """

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key-tareas-monteverde-32bytes!'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # Cursos
            self.curso_5a = Curso(nombre='Quinto A', nivel='5', letra='A')
            self.curso_7b = Curso(nombre='Séptimo B', nivel='7', letra='B')
            db.session.add_all([self.curso_5a, self.curso_7b])
            db.session.flush()

            # Materias
            self.mat_mate = Materia(nombre='Matemáticas')
            self.mat_cien = Materia(nombre='Ciencias')
            db.session.add_all([self.mat_mate, self.mat_cien])
            db.session.flush()

            # Estudiantes
            self.est1_5a = Estudiante(nombre='Estudiante Uno (5A)', curso_id=self.curso_5a.id)
            self.est2_5a = Estudiante(nombre='Estudiante Dos (5A)', curso_id=self.curso_5a.id)
            self.est3_7b = Estudiante(nombre='Estudiante Tres (7B)', curso_id=self.curso_7b.id)
            db.session.add_all([self.est1_5a, self.est2_5a, self.est3_7b])
            db.session.flush()

            # Docente 1
            self.docente1 = Usuario(
                nombre='Profesor Uno',
                email='profe1@monteverde.com',
                rol='docente',
                activo=True,
                eliminado=False
            )
            self.docente1.set_password('password123')

            # Docente 2
            self.docente2 = Usuario(
                nombre='Profesor Dos',
                email='profe2@monteverde.com',
                rol='docente',
                activo=True,
                eliminado=False
            )
            self.docente2.set_password('password123')

            # Usuario Familia
            self.familia = Usuario(
                nombre='Familia Test',
                email='familia.test@monteverde.com',
                rol='familia',
                activo=True,
                eliminado=False
            )
            self.familia.set_password('password123')

            db.session.add_all([self.docente1, self.docente2, self.familia])
            db.session.flush()

            # Asignaciones académicas
            # Docente 1 asignado a Quinto A + Matemáticas
            self.asig1 = DocenteAsignacion(
                docente_id=self.docente1.id,
                curso_id=self.curso_5a.id,
                materia_id=self.mat_mate.id
            )
            # Docente 2 asignado a Séptimo B + Ciencias
            self.asig2 = DocenteAsignacion(
                docente_id=self.docente2.id,
                curso_id=self.curso_7b.id,
                materia_id=self.mat_cien.id
            )
            db.session.add_all([self.asig1, self.asig2])
            db.session.commit()

            # IDs
            self.docente1_id = self.docente1.id
            self.docente2_id = self.docente2.id
            self.curso_5a_id = self.curso_5a.id
            self.curso_7b_id = self.curso_7b.id
            self.mat_mate_id = self.mat_mate.id
            self.mat_cien_id = self.mat_cien.id
            self.est1_5a_id = self.est1_5a.id
            self.est2_5a_id = self.est2_5a.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _get_headers(self, email, password='password123'):
        response = self.client.post('/api/auth/login', json={
            'email': email,
            'password': password
        })
        data = json.loads(response.data.decode('utf-8'))
        token = data.get('token')
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    # =========================================================================
    # 1. Creación de Tareas y Validación de Asignaciones (Permisos)
    # =========================================================================

    def test_crear_tarea_exitosa(self):
        """Docente 1 crea una tarea en su curso y materia asignados."""
        headers = self._get_headers('profe1@monteverde.com')
        vencimiento = (datetime.utcnow() + timedelta(days=5)).strftime('%Y-%m-%d')
        
        response = self.client.post('/api/docente/tareas', headers=headers, json={
            'titulo': 'Taller de Álgebra',
            'descripcion': 'Resolver ejercicios de la página 45',
            'fecha_vencimiento': vencimiento,
            'curso_id': self.curso_5a_id,
            'materia_id': self.mat_mate_id,
            'estado': 'PUBLICADA'
        })
        data = json.loads(response.data.decode('utf-8'))

        self.assertEqual(response.status_code, 201)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['titulo'], 'Taller de Álgebra')
        self.assertEqual(data['data']['docente_id'], self.docente1_id)
        self.assertEqual(data['data']['total_estudiantes'], 2)

    def test_crear_tarea_curso_no_asignado_rechazado(self):
        """Docente 1 intenta crear tarea en curso 7B (no asignado) -> 403 Forbidden."""
        headers = self._get_headers('profe1@monteverde.com')
        vencimiento = (datetime.utcnow() + timedelta(days=3)).strftime('%Y-%m-%d')

        response = self.client.post('/api/docente/tareas', headers=headers, json={
            'titulo': 'Tarea No Autorizada',
            'descripcion': 'Intento de creación ilegal',
            'fecha_vencimiento': vencimiento,
            'curso_id': self.curso_7b_id,
            'materia_id': self.mat_mate_id
        })
        data = json.loads(response.data.decode('utf-8'))

        self.assertEqual(response.status_code, 403)
        self.assertFalse(data['success'])
        self.assertIn('No tienes asignado este curso', data['message'])

    def test_crear_tarea_campos_incompletos(self):
        """Petición con campos obligatorios faltantes -> 400 Bad Request."""
        headers = self._get_headers('profe1@monteverde.com')
        response = self.client.post('/api/docente/tareas', headers=headers, json={
            'titulo': 'Incompleta'
        })
        self.assertEqual(response.status_code, 400)

    # =========================================================================
    # 2. Seguridad IDOR (Aislamiento entre docentes)
    # =========================================================================

    def test_aislamiento_listado_tareas(self):
        """Docente 1 solo ve sus tareas y Docente 2 solo ve las suyas."""
        with self.app.app_context():
            t1 = Tarea(
                titulo='Tarea Profe 1',
                fecha_vencimiento=datetime.utcnow() + timedelta(days=2),
                docente_id=self.docente1_id,
                curso_id=self.curso_5a_id,
                materia_id=self.mat_mate_id
            )
            t2 = Tarea(
                titulo='Tarea Profe 2',
                fecha_vencimiento=datetime.utcnow() + timedelta(days=4),
                docente_id=self.docente2_id,
                curso_id=self.curso_7b_id,
                materia_id=self.mat_cien_id
            )
            db.session.add_all([t1, t2])
            db.session.commit()
            t1_id, t2_id = t1.id, t2.id

        # Consulta Docente 1
        h1 = self._get_headers('profe1@monteverde.com')
        r1 = self.client.get('/api/docente/tareas', headers=h1)
        d1 = json.loads(r1.data.decode('utf-8'))
        self.assertEqual(len(d1['data']), 1)
        self.assertEqual(d1['data'][0]['id'], t1_id)

        # Consulta Docente 2
        h2 = self._get_headers('profe2@monteverde.com')
        r2 = self.client.get('/api/docente/tareas', headers=h2)
        d2 = json.loads(r2.data.decode('utf-8'))
        self.assertEqual(len(d2['data']), 1)
        self.assertEqual(d2['data'][0]['id'], t2_id)

    def test_idor_get_tarea_ajena_rechazado(self):
        """Docente 2 intenta consultar la tarea del Docente 1 -> 404."""
        with self.app.app_context():
            t1 = Tarea(
                titulo='Tarea Privada Profe 1',
                fecha_vencimiento=datetime.utcnow() + timedelta(days=2),
                docente_id=self.docente1_id,
                curso_id=self.curso_5a_id,
                materia_id=self.mat_mate_id
            )
            db.session.add(t1)
            db.session.commit()
            t1_id = t1.id

        h2 = self._get_headers('profe2@monteverde.com')
        res = self.client.get(f'/api/docente/tareas/{t1_id}', headers=h2)
        self.assertEqual(res.status_code, 404)

    def test_idor_put_tarea_ajena_rechazado(self):
        """Docente 2 intenta modificar la tarea del Docente 1 -> 404."""
        with self.app.app_context():
            t1 = Tarea(
                titulo='Tarea Original Profe 1',
                fecha_vencimiento=datetime.utcnow() + timedelta(days=2),
                docente_id=self.docente1_id,
                curso_id=self.curso_5a_id,
                materia_id=self.mat_mate_id
            )
            db.session.add(t1)
            db.session.commit()
            t1_id = t1.id

        h2 = self._get_headers('profe2@monteverde.com')
        res = self.client.put(f'/api/docente/tareas/{t1_id}', headers=h2, json={
            'titulo': 'Modificación Maliciosa'
        })
        self.assertEqual(res.status_code, 404)

    def test_idor_delete_tarea_ajena_rechazado(self):
        """Docente 2 intenta eliminar la tarea del Docente 1 -> 404."""
        with self.app.app_context():
            t1 = Tarea(
                titulo='Tarea Profe 1',
                fecha_vencimiento=datetime.utcnow() + timedelta(days=2),
                docente_id=self.docente1_id,
                curso_id=self.curso_5a_id,
                materia_id=self.mat_mate_id
            )
            db.session.add(t1)
            db.session.commit()
            t1_id = t1.id

        h2 = self._get_headers('profe2@monteverde.com')
        res = self.client.delete(f'/api/docente/tareas/{t1_id}', headers=h2)
        self.assertEqual(res.status_code, 404)

    # =========================================================================
    # 3. Entregas y Calificaciones
    # =========================================================================

    def test_listar_entregas_estudiantes_del_curso(self):
        """Al listar entregas, se devuelven todos los estudiantes del curso."""
        with self.app.app_context():
            t = Tarea(
                titulo='Taller 5A',
                fecha_vencimiento=datetime.utcnow() + timedelta(days=2),
                docente_id=self.docente1_id,
                curso_id=self.curso_5a_id,
                materia_id=self.mat_mate_id
            )
            db.session.add(t)
            db.session.commit()
            t_id = t.id

        h1 = self._get_headers('profe1@monteverde.com')
        res = self.client.get(f'/api/docente/tareas/{t_id}/entregas', headers=h1)
        data = json.loads(res.data.decode('utf-8'))

        self.assertEqual(res.status_code, 200)
        self.assertEqual(data['data']['total_estudiantes'], 2)
        est_ids = [e['estudiante_id'] for e in data['data']['entregas']]
        self.assertIn(self.est1_5a_id, est_ids)
        self.assertIn(self.est2_5a_id, est_ids)

    def test_calificar_entrega_exitoso(self):
        """Docente califica la entrega de un estudiante con nota válida."""
        with self.app.app_context():
            t = Tarea(
                titulo='Evaluación 1',
                fecha_vencimiento=datetime.utcnow() + timedelta(days=1),
                docente_id=self.docente1_id,
                curso_id=self.curso_5a_id,
                materia_id=self.mat_mate_id
            )
            db.session.add(t)
            db.session.commit()
            t_id = t.id

        h1 = self._get_headers('profe1@monteverde.com')
        res = self.client.post(f'/api/docente/tareas/{t_id}/calificar', headers=h1, json={
            'estudiante_id': self.est1_5a_id,
            'calificacion': 4.75,
            'comentarios': 'Excelente desempeño',
            'estado': 'CALIFICADA'
        })
        data = json.loads(res.data.decode('utf-8'))

        self.assertEqual(res.status_code, 200)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['calificacion'], 4.75)
        self.assertEqual(data['data']['estado'], 'CALIFICADA')

    def test_calificar_entrega_nota_fuera_de_rango_rechazada(self):
        """Calificación superior a 5.0 o inferior a 0.0 debe ser rechazada -> 400."""
        with self.app.app_context():
            t = Tarea(
                titulo='Evaluación Rango',
                fecha_vencimiento=datetime.utcnow() + timedelta(days=1),
                docente_id=self.docente1_id,
                curso_id=self.curso_5a_id,
                materia_id=self.mat_mate_id
            )
            db.session.add(t)
            db.session.commit()
            t_id = t.id

        h1 = self._get_headers('profe1@monteverde.com')
        res = self.client.post(f'/api/docente/tareas/{t_id}/calificar', headers=h1, json={
            'estudiante_id': self.est1_5a_id,
            'calificacion': 6.5
        })
        self.assertEqual(res.status_code, 400)

    # =========================================================================
    # 4. Integración con Dashboard Docente
    # =========================================================================

    def test_dashboard_muestra_tareas_reales(self):
        """El dashboard debe devolver las tareas reales creadas por el docente."""
        with self.app.app_context():
            t1 = Tarea(
                titulo='Tarea Hoy',
                fecha_vencimiento=datetime.utcnow(),
                estado='PUBLICADA',
                docente_id=self.docente1_id,
                curso_id=self.curso_5a_id,
                materia_id=self.mat_mate_id
            )
            t2 = Tarea(
                titulo='Tarea Mañana',
                fecha_vencimiento=datetime.utcnow() + timedelta(days=1),
                estado='PUBLICADA',
                docente_id=self.docente1_id,
                curso_id=self.curso_5a_id,
                materia_id=self.mat_mate_id
            )
            t3_cerrada = Tarea(
                titulo='Tarea Cerrada',
                fecha_vencimiento=datetime.utcnow() - timedelta(days=5),
                estado='CERRADA',
                docente_id=self.docente1_id,
                curso_id=self.curso_5a_id,
                materia_id=self.mat_mate_id
            )
            db.session.add_all([t1, t2, t3_cerrada])
            db.session.commit()

        h1 = self._get_headers('profe1@monteverde.com')
        res = self.client.get('/api/docente/dashboard', headers=h1)
        data = json.loads(res.data.decode('utf-8'))

        self.assertEqual(res.status_code, 200)
        self.assertEqual(data['data']['total_tareas_pendientes'], 2)
        titulos = [t['titulo'] for t in data['data']['tareas_pendientes']]
        self.assertIn('Tarea Hoy', titulos)
        self.assertIn('Tarea Mañana', titulos)
        self.assertNotIn('Tarea Cerrada', titulos)

    # =========================================================================
    # 5. Autenticación y Autorización
    # =========================================================================

    def test_sin_token_401(self):
        """Acceso sin JWT a /api/docente/tareas -> 401."""
        res = self.client.get('/api/docente/tareas')
        self.assertEqual(res.status_code, 401)

    def test_rol_familia_403(self):
        """Usuario con rol 'familia' no puede acceder a /api/docente/tareas -> 403."""
        h_fam = self._get_headers('familia.test@monteverde.com')
        res = self.client.get('/api/docente/tareas', headers=h_fam)
        self.assertEqual(res.status_code, 403)


if __name__ == '__main__':
    unittest.main()
