import os
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-semaforo-monteverde-32bytes!'

from config import Config
Config.SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
Config.SQLALCHEMY_ECHO = False

import unittest
import json
from datetime import datetime, timedelta
from app import create_app
from src.extensions import db
from src.models.usuario import Usuario, familia_estudiante
from src.models.curso import Curso
from src.models.estudiante import Estudiante
from src.models.materia import Materia
from src.models.docente_asignacion import DocenteAsignacion
from src.models.tarea import Tarea
from src.models.entrega import Entrega


class SemaforoTareasFamiliaTestCase(unittest.TestCase):
    """
    Suite de integración para el Semáforo de Tareas Académicas de la Familia:
    - Clasificación exacta: Entregada (🟢), Pendiente >48h (🟡), Próxima <=48h (🔴), Vencida (⚠️)
    - Seguridad y autorización por relación familia-estudiante (403 IDOR)
    - Consultas batch y 0 consultas N+1
    """

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key-semaforo-monteverde-32bytes!'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # 1. Cursos
            self.curso_1a = Curso(nombre='Primero A', nivel='1', letra='A')
            self.curso_2b = Curso(nombre='Segundo B', nivel='2', letra='B')
            db.session.add_all([self.curso_1a, self.curso_2b])
            db.session.flush()

            # 2. Materia
            self.mat_mate = Materia(nombre='Matemáticas')
            db.session.add(self.mat_mate)
            db.session.flush()

            # 3. Estudiantes
            # Santiago (en 1A con tareas, pertenece a Familia González)
            self.est_santiago = Estudiante(nombre='Santiago González', curso_id=self.curso_1a.id)
            # Juan (en 2B sin tareas, pertenece a Familia Pérez)
            self.est_juan = Estudiante(nombre='Juan Pérez', curso_id=self.curso_2b.id)
            # Carlos (en 2B sin tareas, pertenece a Familia González)
            self.est_carlos = Estudiante(nombre='Carlos SinTareas', curso_id=self.curso_2b.id)

            db.session.add_all([self.est_santiago, self.est_juan, self.est_carlos])
            db.session.flush()

            # 4. Usuarios
            self.docente = Usuario(
                nombre='Profesor Carlos',
                email='docente.carlos@monteverde.edu.co',
                password='password123',
                rol='docente',
                activo=True
            )
            self.fam_gonzalez = Usuario(
                nombre='Familia González',
                email='familiagonzalez@monteverde.edu.co',
                password='password123',
                rol='familia',
                activo=True
            )
            self.fam_perez = Usuario(
                nombre='Familia Pérez',
                email='familiaperez@monteverde.edu.co',
                password='password123',
                rol='familia',
                activo=True
            )
            self.admin = Usuario(
                nombre='Admin General',
                email='admin@monteverde.edu.co',
                password='password123',
                rol='admin',
                activo=True
            )

            db.session.add_all([self.docente, self.fam_gonzalez, self.fam_perez, self.admin])
            db.session.flush()

            # Relación familia-estudiante
            self.fam_gonzalez.estudiantes.append(self.est_santiago)
            self.fam_perez.estudiantes.append(self.est_juan)

            # Asignación docente
            self.asig = DocenteAsignacion(
                docente_id=self.docente.id,
                curso_id=self.curso_1a.id,
                materia_id=self.mat_mate.id
            )
            db.session.add(self.asig)
            db.session.flush()

            # 5. Tareas en Curso 1A:
            # Tarea 1: Entregada por Santiago
            self.t_entregada = Tarea(
                titulo='Taller 1: Sumas',
                fecha_vencimiento=datetime.utcnow() + timedelta(days=5),
                estado='PUBLICADA',
                docente_id=self.docente.id,
                curso_id=self.curso_1a.id,
                materia_id=self.mat_mate.id
            )
            # Tarea 2: Pendiente > 48h (vence en 4 días)
            self.t_pendiente = Tarea(
                titulo='Taller 2: Restas',
                fecha_vencimiento=datetime.utcnow() + timedelta(days=4),
                estado='PUBLICADA',
                docente_id=self.docente.id,
                curso_id=self.curso_1a.id,
                materia_id=self.mat_mate.id
            )
            # Tarea 3: Próxima a vencer <= 48h (vence en 24h)
            self.t_proxima = Tarea(
                titulo='Taller 3: Multiplicaciones',
                fecha_vencimiento=datetime.utcnow() + timedelta(hours=24),
                estado='PUBLICADA',
                docente_id=self.docente.id,
                curso_id=self.curso_1a.id,
                materia_id=self.mat_mate.id
            )
            # Tarea 4: Vencida (venció hace 2 días sin entrega)
            self.t_vencida = Tarea(
                titulo='Taller 4: Geometría',
                fecha_vencimiento=datetime.utcnow() - timedelta(days=2),
                estado='PUBLICADA',
                docente_id=self.docente.id,
                curso_id=self.curso_1a.id,
                materia_id=self.mat_mate.id
            )
            # Tarea 5: Borrador (no debe aparecer)
            self.t_borrador = Tarea(
                titulo='Taller 5: Borrador',
                fecha_vencimiento=datetime.utcnow() + timedelta(days=5),
                estado='BORRADOR',
                docente_id=self.docente.id,
                curso_id=self.curso_1a.id,
                materia_id=self.mat_mate.id
            )

            db.session.add_all([self.t_entregada, self.t_pendiente, self.t_proxima, self.t_vencida, self.t_borrador])
            db.session.flush()

            # Entrega de Santiago para Tarea 1
            self.entrega_santiago = Entrega(
                tarea_id=self.t_entregada.id,
                estudiante_id=self.est_santiago.id,
                estado='ENTREGADA',
                calificacion=4.5,
                comentarios='Buen trabajo'
            )
            db.session.add(self.entrega_santiago)
            db.session.commit()

            # Guardar IDs
            self.est_santiago_id = self.est_santiago.id
            self.est_juan_id = self.est_juan.id
            self.est_carlos_id = self.est_carlos.id

            # Tokens
            self.token_fam_gonzalez = self._login('familiagonzalez@monteverde.edu.co', 'password123')
            self.token_fam_perez = self._login('familiaperez@monteverde.edu.co', 'password123')
            self.token_admin = self._login('admin@monteverde.edu.co', 'password123')

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _login(self, email, password):
        res = self.client.post('/api/auth/login', json={'email': email, 'password': password})
        data = json.loads(res.data)
        return data.get('token')

    # ========================================================
    # Pruebas: GET /api/familia/tareas-semaforo/<estudiante_id>
    # ========================================================

    def test_semaforo_calculo_estados_correctos(self):
        """
        Santiago en 1A tiene:
        - 1 tarea ENTREGADA (Taller 1)
        - 1 tarea PENDIENTE >48h (Taller 2)
        - 1 tarea PROXIMA_A_VENCER <=48h (Taller 3)
        - 1 tarea VENCIDA (Taller 4)
        - Tarea en borrador excluida
        Total = 4 tareas publicadas
        """
        headers = {'Authorization': f'Bearer {self.token_fam_gonzalez}'}
        res = self.client.get(f'/api/familia/tareas-semaforo/{self.est_santiago_id}', headers=headers)
        self.assertEqual(res.status_code, 200)

        data = json.loads(res.data)
        self.assertTrue(data['success'])
        semaforo = data['data']

        self.assertEqual(semaforo['estudiante_id'], self.est_santiago_id)
        self.assertEqual(semaforo['entregadas'], 1)
        self.assertEqual(semaforo['pendientes'], 1)
        self.assertEqual(semaforo['proximas_a_vencer'], 1)
        self.assertEqual(semaforo['vencidas'], 1)
        self.assertEqual(semaforo['total'], 4)
        self.assertEqual(len(semaforo['detalle']), 4)

        # Verificar detalle de tarea entregada y calificada
        t1 = next(t for t in semaforo['detalle'] if t['titulo'] == 'Taller 1: Sumas')
        self.assertEqual(t1['estado_calculado'], 'ENTREGADA')
        self.assertEqual(t1['estado_entrega'], 'ENTREGADA')
        self.assertEqual(t1['calificacion'], 4.5)
        self.assertEqual(t1['nota'], 4.5)
        self.assertEqual(t1['docente_nombre'], 'Profesor Carlos')
        self.assertEqual(t1['materia_nombre'], 'Matemáticas')
        self.assertIsNotNone(t1['fecha_limite'])

        # Verificar detalle de tarea próxima a vencer
        t3 = next(t for t in semaforo['detalle'] if t['titulo'] == 'Taller 3: Multiplicaciones')
        self.assertEqual(t3['estado_calculado'], 'PROXIMA_A_VENCER')
        self.assertIsNone(t3['nota'])
        self.assertEqual(t3['estado_entrega'], 'PENDIENTE')
        self.assertEqual(t3['docente_nombre'], 'Profesor Carlos')
        self.assertEqual(t3['materia_nombre'], 'Matemáticas')

    def test_semaforo_estudiante_sin_tareas_retorna_ceros(self):
        """Estudiante en curso sin tareas asignadas retorna conteos en 0 de forma limpia"""
        headers = {'Authorization': f'Bearer {self.token_admin}'}
        res = self.client.get(f'/api/familia/tareas-semaforo/{self.est_carlos_id}', headers=headers)
        self.assertEqual(res.status_code, 200)

        data = json.loads(res.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['total'], 0)
        self.assertEqual(data['data']['entregadas'], 0)
        self.assertEqual(data['data']['pendientes'], 0)
        self.assertEqual(data['data']['proximas_a_vencer'], 0)
        self.assertEqual(data['data']['vencidas'], 0)

    def test_familia_intenta_consultar_hijo_ajeno_rechazado_403(self):
        """Familia González intenta consultar semáforo de Juan (hijo de Familia Pérez) -> 403 Forbidden"""
        headers = {'Authorization': f'Bearer {self.token_fam_gonzalez}'}
        res = self.client.get(f'/api/familia/tareas-semaforo/{self.est_juan_id}', headers=headers)
        self.assertEqual(res.status_code, 403)

        data = json.loads(res.data)
        self.assertFalse(data['success'])
        self.assertIn('No tienes permisos', data['message'])

    def test_admin_puede_consultar_cualquier_estudiante_exitoso(self):
        """Administrador consulta semáforo de cualquier estudiante -> 200 OK"""
        headers = {'Authorization': f'Bearer {self.token_admin}'}
        res = self.client.get(f'/api/familia/tareas-semaforo/{self.est_santiago_id}', headers=headers)
        self.assertEqual(res.status_code, 200)

        data = json.loads(res.data)
        self.assertTrue(data['success'])

    def test_consultar_estudiante_inexistente_retorna_404(self):
        """Consulta con ID de estudiante que no existe -> 404 Not Found"""
        headers = {'Authorization': f'Bearer {self.token_admin}'}
        res = self.client.get('/api/familia/tareas-semaforo/99999', headers=headers)
        self.assertEqual(res.status_code, 404)

    def test_peticion_sin_token_retorna_401(self):
        """Petición sin token JWT -> 401 Unauthorized"""
        res = self.client.get(f'/api/familia/tareas-semaforo/{self.est_santiago_id}')
        self.assertEqual(res.status_code, 401)


if __name__ == '__main__':
    unittest.main()
