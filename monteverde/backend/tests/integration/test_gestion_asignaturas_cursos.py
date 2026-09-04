import os
os.environ['JWT_SECRET_KEY'] = 'test-secret-key'
from config import Config
Config.SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
Config.SQLALCHEMY_ECHO = False

import unittest
import json
from datetime import datetime
from src.extensions import db
from src.models.usuario import Usuario
from src.models.curso import Curso
from src.models.materia import Materia
from src.models.curso_materia import CursoMateria
from src.models.docente_asignacion import DocenteAsignacion
from app import create_app

class GestionAsignaturasCursosTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            db.create_all()

    @classmethod
    def tearDownClass(cls):
        with cls.app.app_context():
            db.session.remove()
            db.drop_all()

    def setUp(self):
        with self.app.app_context():
            db.session.query(DocenteAsignacion).delete()
            db.session.query(CursoMateria).delete()
            db.session.query(Materia).delete()
            db.session.query(Curso).delete()
            db.session.query(Usuario).delete()
            db.session.commit()

            # 1. Admin
            self.admin = Usuario(
                nombre='Admin Académico',
                email='admin.catalogo@monteverde.edu.co',
                rol='admin',
                activo=True
            )
            self.admin.set_password('admin123')
            db.session.add(self.admin)

            # 2. Docente
            self.docente = Usuario(
                nombre='Profesor Carlos Ruiz',
                email='carlos.docente@monteverde.edu.co',
                rol='docente',
                activo=True
            )
            self.docente.set_password('docente123')
            db.session.add(self.docente)

            # 3. Curso 8A
            self.curso_8a = Curso(
                nombre='Octavo A',
                nivel='8',
                letra='A',
                descripcion='Curso de secundaria'
            )
            db.session.add(self.curso_8a)

            # 4. Curso 10A
            self.curso_10a = Curso(
                nombre='Décimo A',
                nivel='10',
                letra='A',
                descripcion='Media académica'
            )
            db.session.add(self.curso_10a)

            # 5. Materias iniciales
            self.mat_mate = Materia(
                nombre='Matemáticas',
                codigo='MAT',
                area='Matemáticas',
                intensidad_horaria=5,
                activo=True
            )
            self.mat_filo = Materia(
                nombre='Filosofía',
                codigo='FIL',
                area='Filosofía',
                intensidad_horaria=3,
                activo=True
            )
            db.session.add_all([self.mat_mate, self.mat_filo])
            db.session.commit()

            self.admin_id = self.admin.id
            self.docente_id = self.docente.id
            self.curso_8a_id = self.curso_8a.id
            self.curso_10a_id = self.curso_10a.id
            self.mat_mate_id = self.mat_mate.id
            self.mat_filo_id = self.mat_filo.id

    def get_jwt_headers(self, email, password):
        resp = self.client.post(
            '/api/auth/login',
            json={'email': email, 'password': password}
        )
        data = resp.get_json() or {}
        token = data.get('data', {}).get('token') or data.get('token')
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    # =========================================================================
    # CASO 1: Crear Asignatura en el catálogo
    # =========================================================================
    def test_caso_01_crear_asignatura(self):
        """Crear asignatura 'Música' con código MUS y área Artística."""
        headers = self.get_jwt_headers('admin.catalogo@monteverde.edu.co', 'admin123')
        payload = {
            'nombre': 'Música',
            'codigo': 'MUS',
            'area': 'Educación Artística',
            'descripcion': 'Expresión musical y teoría sonora',
            'intensidad_horaria': 2,
            'activo': True
        }
        resp = self.client.post('/api/materias', json=payload, headers=headers)
        self.assertEqual(resp.status_code, 201)
        data = resp.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['nombre'], 'Música')
        self.assertEqual(data['data']['codigo'], 'MUS')
        self.assertEqual(data['data']['area'], 'Educación Artística')

        # Verificar en base de datos
        with self.app.app_context():
            m = Materia.query.filter_by(codigo='MUS').first()
            self.assertIsNotNone(m)
            self.assertEqual(m.nombre, 'Música')

    # =========================================================================
    # CASO 2: Asociar Asignatura al Plan de Estudios de un Curso
    # =========================================================================
    def test_caso_02_asociar_asignatura_a_curso(self):
        """Asociar 'Matemáticas' y 'Música' al curso 8A."""
        headers = self.get_jwt_headers('admin.catalogo@monteverde.edu.co', 'admin123')

        # Crear Música
        self.client.post('/api/materias', json={'nombre': 'Música', 'codigo': 'MUS', 'area': 'Artística'}, headers=headers)
        with self.app.app_context():
            mus_id = Materia.query.filter_by(codigo='MUS').first().id

        # Asociar a 8A (Matemáticas + Música)
        resp_asoc = self.client.post(
            f'/api/cursos/{self.curso_8a_id}/materias',
            json={'materia_ids': [self.mat_mate_id, mus_id]},
            headers=headers
        )
        self.assertEqual(resp_asoc.status_code, 200)
        data = resp_asoc.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']['materias']), 2)

        # Consultar materias del curso
        resp_get = self.client.get(f'/api/cursos/{self.curso_8a_id}/materias', headers=headers)
        self.assertEqual(resp_get.status_code, 200)
        data_get = resp_get.get_json()
        nombres = [m['nombre'] for m in data_get['data']['materias']]
        self.assertIn('Matemáticas', nombres)
        self.assertIn('Música', nombres)
        self.assertNotIn('Filosofía', nombres)

    # =========================================================================
    # CASO 3: Asignar Carga Académica a Docente
    # =========================================================================
    def test_caso_03_asignar_docente_a_curso_y_materia(self):
        """Asignar al Profesor Carlos la materia Matemáticas en 8A."""
        headers = self.get_jwt_headers('admin.catalogo@monteverde.edu.co', 'admin123')

        # Configurar 8A con Matemáticas
        self.client.post(
            f'/api/cursos/{self.curso_8a_id}/materias',
            json={'materia_ids': [self.mat_mate_id]},
            headers=headers
        )

        resp_asig = self.client.post(
            '/api/admin/docentes/asignar',
            json={
                'docente_id': self.docente_id,
                'curso_id': self.curso_8a_id,
                'materia_id': self.mat_mate_id
            },
            headers=headers
        )
        self.assertEqual(resp_asig.status_code, 200)
        self.assertTrue(resp_asig.get_json()['success'])

        # Verificar asignación en DB
        with self.app.app_context():
            asig = DocenteAsignacion.query.filter_by(
                docente_id=self.docente_id,
                curso_id=self.curso_8a_id,
                materia_id=self.mat_mate_id
            ).first()
            self.assertIsNotNone(asig)

    # =========================================================================
    # CASO 4: Rechazar Asignatura No Disponible para el Curso
    # =========================================================================
    def test_caso_04_rechazar_asignatura_no_disponible_para_curso(self):
        """Intentar asignar Filosofía en 8A cuando 8A solo tiene Matemáticas debe ser rechazado (400)."""
        headers = self.get_jwt_headers('admin.catalogo@monteverde.edu.co', 'admin123')

        # 8A solo tiene Matemáticas
        self.client.post(
            f'/api/cursos/{self.curso_8a_id}/materias',
            json={'materia_ids': [self.mat_mate_id]},
            headers=headers
        )

        # Intentar asignar Filosofía (no configurada en 8A)
        resp_rechazo = self.client.post(
            '/api/admin/docentes/asignar',
            json={
                'docente_id': self.docente_id,
                'curso_id': self.curso_8a_id,
                'materia_id': self.mat_filo_id
            },
            headers=headers
        )
        self.assertEqual(resp_rechazo.status_code, 400)
        data = resp_rechazo.get_json()
        self.assertFalse(data['success'])
        self.assertIn('no está disponible', data['message'])

    # =========================================================================
    # CASO 5: Nueva Asignatura Dinámica Disponible sin Modificar Código
    # =========================================================================
    def test_caso_05_creacion_dinamica_de_multiples_asignaturas(self):
        """Crear Robótica, Programación, Teatro y verificar disponibilidad en el catálogo."""
        headers = self.get_jwt_headers('admin.catalogo@monteverde.edu.co', 'admin123')

        materias_nuevas = [
            {'nombre': 'Robótica', 'codigo': 'ROB', 'area': 'Tecnología e Informática', 'intensidad_horaria': 3},
            {'nombre': 'Programación', 'codigo': 'PROG', 'area': 'Tecnología e Informática', 'intensidad_horaria': 4},
            {'nombre': 'Teatro', 'codigo': 'TEA', 'area': 'Educación Artística', 'intensidad_horaria': 2}
        ]

        for m_payload in materias_nuevas:
            resp = self.client.post('/api/materias', json=m_payload, headers=headers)
            self.assertEqual(resp.status_code, 201)

        # Listar todas las materias
        resp_list = self.client.get('/api/materias', headers=headers)
        data = resp_list.get_json()['data']
        nombres = [m['nombre'] for m in data]
        self.assertIn('Robótica', nombres)
        self.assertIn('Programación', nombres)
        self.assertIn('Teatro', nombres)

    # =========================================================================
    # CASO 6: Desactivar Asignatura (Soft-Deactivation)
    # =========================================================================
    def test_caso_06_desactivar_asignatura_y_preservar_historial(self):
        """Desactivar una asignatura impide nuevas asignaciones pero preserva asignaciones históricas."""
        headers = self.get_jwt_headers('admin.catalogo@monteverde.edu.co', 'admin123')

        # Configurar 8A con Matemáticas y asignar docente
        self.client.post(f'/api/cursos/{self.curso_8a_id}/materias', json={'materia_ids': [self.mat_mate_id]}, headers=headers)
        self.client.post(
            '/api/admin/docentes/asignar',
            json={'docente_id': self.docente_id, 'curso_id': self.curso_8a_id, 'materia_id': self.mat_mate_id},
            headers=headers
        )

        # Intentar eliminar Matemáticas (debe hacer soft-deactivate)
        resp_del = self.client.delete(f'/api/materias/{self.mat_mate_id}', headers=headers)
        self.assertEqual(resp_del.status_code, 200)
        data_del = resp_del.get_json()
        self.assertTrue(data_del['soft_deleted'])

        # Comprobar que en DB la materia sigue existiendo con activo=False
        with self.app.app_context():
            m = Materia.query.get(self.mat_mate_id)
            self.assertIsNotNone(m)
            self.assertFalse(m.activo)

            # La asignación histórica del docente sigue existiendo intacta
            asig = DocenteAsignacion.query.filter_by(materia_id=self.mat_mate_id).first()
            self.assertIsNotNone(asig)

        # Intentar asignar la materia desactivada a otro curso debe ser rechazado
        resp_asig_inactiva = self.client.post(
            '/api/admin/docentes/asignar',
            json={'docente_id': self.docente_id, 'curso_id': self.curso_10a_id, 'materia_id': self.mat_mate_id},
            headers=headers
        )
        self.assertEqual(resp_asig_inactiva.status_code, 400)

    # =========================================================================
    # CASO 7: Prevención de Asignaciones Duplicadas y Códigos Duplicados
    # =========================================================================
    def test_caso_07_prevencion_duplicados(self):
        """Verifica rechazo al duplicar código de materia o duplicar asignación docente-curso-materia."""
        headers = self.get_jwt_headers('admin.catalogo@monteverde.edu.co', 'admin123')

        # 1. Duplicar código de materia
        resp_dup_cod = self.client.post(
            '/api/materias',
            json={'nombre': 'Matemáticas Avanzadas', 'codigo': 'MAT', 'area': 'Matemáticas'},
            headers=headers
        )
        self.assertEqual(resp_dup_cod.status_code, 409)

        # 2. Duplicar asignación docente
        self.client.post(f'/api/cursos/{self.curso_10a_id}/materias', json={'materia_ids': [self.mat_filo_id]}, headers=headers)
        resp1 = self.client.post(
            '/api/admin/docentes/asignar',
            json={'docente_id': self.docente_id, 'curso_id': self.curso_10a_id, 'materia_id': self.mat_filo_id},
            headers=headers
        )
        self.assertEqual(resp1.status_code, 200)

        # Intentar re-asignar
        resp2 = self.client.post(
            '/api/admin/docentes/asignar',
            json={'docente_id': self.docente_id, 'curso_id': self.curso_10a_id, 'materia_id': self.mat_filo_id},
            headers=headers
        )
        self.assertEqual(resp2.status_code, 400)

    # =========================================================================
    # CASO 8: Persistencia y Desasignación de Carga
    # =========================================================================
    def test_caso_08_persistencia_y_desasignacion(self):
        """Desasignar una carga académica y comprobar estado."""
        headers = self.get_jwt_headers('admin.catalogo@monteverde.edu.co', 'admin123')

        # Asignar
        self.client.post(f'/api/cursos/{self.curso_10a_id}/materias', json={'materia_ids': [self.mat_filo_id]}, headers=headers)
        self.client.post(
            '/api/admin/docentes/asignar',
            json={'docente_id': self.docente_id, 'curso_id': self.curso_10a_id, 'materia_id': self.mat_filo_id},
            headers=headers
        )

        with self.app.app_context():
            asig = DocenteAsignacion.query.filter_by(
                docente_id=self.docente_id,
                curso_id=self.curso_10a_id,
                materia_id=self.mat_filo_id
            ).first()
            self.assertIsNotNone(asig)
            asig_id = asig.id

        # Desasignar
        resp_desasig = self.client.post(
            '/api/admin/docentes/desasignar',
            json={'assignment_id': asig_id},
            headers=headers
        )
        self.assertEqual(resp_desasig.status_code, 200)

        with self.app.app_context():
            asig_deleted = DocenteAsignacion.query.get(asig_id)
            self.assertIsNone(asig_deleted)

if __name__ == '__main__':
    unittest.main()
