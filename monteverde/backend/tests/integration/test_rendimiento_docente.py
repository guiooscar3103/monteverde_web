import os
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-rendimiento-monteverde-32b!'

from config import Config
Config.SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
Config.SQLALCHEMY_ECHO = False

import unittest
import json
from app import create_app
from src.extensions import db
from src.models.usuario import Usuario, familia_estudiante
from src.models.curso import Curso
from src.models.estudiante import Estudiante
from src.models.materia import Materia
from src.models.docente_asignacion import DocenteAsignacion
from src.models.bimestre import Bimestre
from src.models.indicador_logro import IndicadorLogro
from src.models.calificacion_bimestre import CalificacionBimestre


class RendimientoDocenteTestCase(unittest.TestCase):
    """
    Suite de pruebas de integración para el módulo de Rendimiento Académico y Estadísticas Docente.
    Endpoint: GET /api/docente/rendimiento-academico
    """

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key-rendimiento-monteverde-32b!'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # 1. Bimestres (1 y 2)
            self.bimestre1 = Bimestre.query.filter_by(orden=1).first()
            if not self.bimestre1:
                self.bimestre1 = Bimestre(nombre='Bimestre 1', anio=2026, orden=1)
                db.session.add(self.bimestre1)

            self.bimestre2 = Bimestre.query.filter_by(orden=2).first()
            if not self.bimestre2:
                self.bimestre2 = Bimestre(nombre='Bimestre 2', anio=2026, orden=2)
                db.session.add(self.bimestre2)

            db.session.flush()

            # 2. Cursos
            self.curso_5a = Curso(nombre='Quinto A', nivel='5', letra='A')
            self.curso_7b = Curso(nombre='Séptimo B', nivel='7', letra='B')
            db.session.add_all([self.curso_5a, self.curso_7b])
            db.session.flush()

            # 3. Materias
            self.mat_mate = Materia(nombre='Matemáticas')
            self.mat_ciencias = Materia(nombre='Ciencias')
            db.session.add_all([self.mat_mate, self.mat_ciencias])
            db.session.flush()

            # 4. Docentes
            self.docente_a = Usuario(
                nombre='Docente A',
                email='docente_a@monteverde.com',
                rol='docente',
                activo=True,
                eliminado=False
            )
            self.docente_a.set_password('password123')

            self.docente_b = Usuario(
                nombre='Docente B',
                email='docente_b@monteverde.com',
                rol='docente',
                activo=True,
                eliminado=False
            )
            self.docente_b.set_password('password123')

            # 5. Usuario Familia (para pruebas de rol)
            self.familia_user = Usuario(
                nombre='Familia Test',
                email='familiagonzalez@monteverde.com',
                rol='familia',
                activo=True,
                eliminado=False
            )
            self.familia_user.set_password('password123')

            db.session.add_all([self.docente_a, self.docente_b, self.familia_user])
            db.session.flush()

            # 6. Asignaciones
            # Docente A -> 5°A + Matemáticas
            self.asig_a = DocenteAsignacion(
                docente_id=self.docente_a.id,
                curso_id=self.curso_5a.id,
                materia_id=self.mat_mate.id
            )
            # Docente B -> 7°B + Ciencias
            self.asig_b = DocenteAsignacion(
                docente_id=self.docente_b.id,
                curso_id=self.curso_7b.id,
                materia_id=self.mat_ciencias.id
            )
            db.session.add_all([self.asig_a, self.asig_b])
            db.session.flush()

            # 7. Estudiantes para Curso 5°A (Docente A)
            # Estudiante 1: Sobresaliente completo (Ind 1: [4.5, 4.5, 4.5]=4.5, Ind 2: [4.0, 4.0, 4.0]=4.0 -> Def: 4.25)
            self.est1 = Estudiante(nombre='Ana Sobresaliente', curso_id=self.curso_5a.id)
            # Estudiante 2: En Riesgo completo (Ind 1: [2.0, 2.5, 2.5]=2.33, Ind 2: [2.0, 2.0, 2.0]=2.0 -> Def: 2.17)
            self.est2 = Estudiante(nombre='Carlos EnRiesgo', curso_id=self.curso_5a.id)
            # Estudiante 3: Parcialmente calificado (Ind 1: [4.0, None, 3.0]=3.5, Ind 2 sin notas -> Def: 3.5 -> Aceptable)
            self.est3 = Estudiante(nombre='Diana Parcial', curso_id=self.curso_5a.id)
            # Estudiante 4: Sin calificaciones en absoluto -> SIN_DATOS
            self.est4 = Estudiante(nombre='Elena SinNotas', curso_id=self.curso_5a.id)

            # Estudiante para Curso 7°B (Docente B)
            self.est_b = Estudiante(nombre='Estudiante Docente B', curso_id=self.curso_7b.id)

            db.session.add_all([self.est1, self.est2, self.est3, self.est4, self.est_b])
            db.session.flush()

            # Vincular familia a Estudiante 2 (Carlos) para probar datos de acudiente
            self.familia_user.estudiantes.append(self.est2)

            # 8. Indicadores para Docente A en Bimestre 1
            self.ind1_b1 = IndicadorLogro(
                docente_id=self.docente_a.id,
                curso_id=self.curso_5a.id,
                materia_id=self.mat_mate.id,
                bimestre_id=self.bimestre1.id,
                numero=1,
                descripcion='Comprende operaciones algebraicas'
            )
            self.ind2_b1 = IndicadorLogro(
                docente_id=self.docente_a.id,
                curso_id=self.curso_5a.id,
                materia_id=self.mat_mate.id,
                bimestre_id=self.bimestre1.id,
                numero=2,
                descripcion='Resuelve problemas aplicados'
            )

            # Indicadores para Docente A en Bimestre 2 (para probar filtrado)
            self.ind1_b2 = IndicadorLogro(
                docente_id=self.docente_a.id,
                curso_id=self.curso_5a.id,
                materia_id=self.mat_mate.id,
                bimestre_id=self.bimestre2.id,
                numero=1,
                descripcion='Geometría analítica'
            )

            # Indicador para Docente B
            self.ind_doc_b = IndicadorLogro(
                docente_id=self.docente_b.id,
                curso_id=self.curso_7b.id,
                materia_id=self.mat_ciencias.id,
                bimestre_id=self.bimestre1.id,
                numero=1,
                descripcion='Método científico'
            )

            db.session.add_all([self.ind1_b1, self.ind2_b1, self.ind1_b2, self.ind_doc_b])
            db.session.flush()

            # 9. Calificaciones Bimestre 1 (Docente A)
            # Estudiante 1 (Ana): Ind 1 -> 4.5, 4.5, 4.5 (prom 4.5); Ind 2 -> 4.0, 4.0, 4.0 (prom 4.0) -> Def: 4.25
            califs_est1 = [
                CalificacionBimestre(estudiante_id=self.est1.id, docente_id=self.docente_a.id, indicador_id=self.ind1_b1.id, numero_nota=1, nota=4.5),
                CalificacionBimestre(estudiante_id=self.est1.id, docente_id=self.docente_a.id, indicador_id=self.ind1_b1.id, numero_nota=2, nota=4.5),
                CalificacionBimestre(estudiante_id=self.est1.id, docente_id=self.docente_a.id, indicador_id=self.ind1_b1.id, numero_nota=3, nota=4.5),
                CalificacionBimestre(estudiante_id=self.est1.id, docente_id=self.docente_a.id, indicador_id=self.ind2_b1.id, numero_nota=1, nota=4.0),
                CalificacionBimestre(estudiante_id=self.est1.id, docente_id=self.docente_a.id, indicador_id=self.ind2_b1.id, numero_nota=2, nota=4.0),
                CalificacionBimestre(estudiante_id=self.est1.id, docente_id=self.docente_a.id, indicador_id=self.ind2_b1.id, numero_nota=3, nota=4.0),
            ]

            # Estudiante 2 (Carlos): Ind 1 -> 2.0, 2.5, 2.5 (prom 2.33); Ind 2 -> 2.0, 2.0, 2.0 (prom 2.0) -> Def: 2.17
            califs_est2 = [
                CalificacionBimestre(estudiante_id=self.est2.id, docente_id=self.docente_a.id, indicador_id=self.ind1_b1.id, numero_nota=1, nota=2.0),
                CalificacionBimestre(estudiante_id=self.est2.id, docente_id=self.docente_a.id, indicador_id=self.ind1_b1.id, numero_nota=2, nota=2.5),
                CalificacionBimestre(estudiante_id=self.est2.id, docente_id=self.docente_a.id, indicador_id=self.ind1_b1.id, numero_nota=3, nota=2.5),
                CalificacionBimestre(estudiante_id=self.est2.id, docente_id=self.docente_a.id, indicador_id=self.ind2_b1.id, numero_nota=1, nota=2.0),
                CalificacionBimestre(estudiante_id=self.est2.id, docente_id=self.docente_a.id, indicador_id=self.ind2_b1.id, numero_nota=2, nota=2.0),
                CalificacionBimestre(estudiante_id=self.est2.id, docente_id=self.docente_a.id, indicador_id=self.ind2_b1.id, numero_nota=3, nota=2.0),
            ]

            # Estudiante 3 (Diana): Ind 1 -> 4.0, [nota 2 vacía], 3.0 (prom 3.5); Ind 2 sin notas -> Def: 3.5
            califs_est3 = [
                CalificacionBimestre(estudiante_id=self.est3.id, docente_id=self.docente_a.id, indicador_id=self.ind1_b1.id, numero_nota=1, nota=4.0),
                CalificacionBimestre(estudiante_id=self.est3.id, docente_id=self.docente_a.id, indicador_id=self.ind1_b1.id, numero_nota=3, nota=3.0),
            ]

            # Estudiante 4 (Elena): Sin calificaciones

            # Calificación para Bimestre 2 (Diana con 5.0)
            califs_b2 = [
                CalificacionBimestre(estudiante_id=self.est3.id, docente_id=self.docente_a.id, indicador_id=self.ind1_b2.id, numero_nota=1, nota=5.0),
            ]

            db.session.add_all(califs_est1 + califs_est2 + califs_est3 + califs_b2)
            db.session.commit()

            # Guardar IDs para uso en tests
            self.docente_a_id = self.docente_a.id
            self.docente_b_id = self.docente_b.id
            self.bimestre1_id = self.bimestre1.id
            self.bimestre2_id = self.bimestre2.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _get_jwt_headers(self, email, password='password123'):
        """Helper para autenticarse y retornar Authorization header Bearer token."""
        res = self.client.post('/api/auth/login', json={'email': email, 'password': password})
        data = json.loads(res.data.decode('utf-8'))
        token = data.get('token')
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    # =========================================================================
    # 1. Consulta exitosa (200 OK y estructura de datos)
    # =========================================================================
    def test_01_consulta_exitosa(self):
        """Verifica que la consulta retorne 200 OK y la estructura esperada."""
        headers = self._get_jwt_headers('docente_a@monteverde.com')
        response = self.client.get(f'/api/docente/rendimiento-academico?bimestre_id={self.bimestre1_id}', headers=headers)
        data = json.loads(response.data.decode('utf-8'))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        self.assertIn('kpis', data['data'])
        self.assertIn('asignaciones', data['data'])
        self.assertIn('bimestre', data['data'])
        self.assertIn('bimestres_disponibles', data['data'])

    # =========================================================================
    # 2. Cálculo correcto de promedios (multi-indicador y notas parciales)
    # =========================================================================
    def test_02_calculo_correcto_promedios(self):
        """
        Verifica el cálculo de promedios de estudiantes:
        - Ana (Sobresaliente): Ind 1 = 4.5, Ind 2 = 4.0 -> Definitiva = 4.25
        - Carlos (En Riesgo): Ind 1 = 2.33, Ind 2 = 2.0 -> Definitiva = 2.17
        - Diana (Aceptable): Ind 1 = 3.5, Ind 2 = None -> Definitiva = 3.5
        - Elena: SIN_DATOS
        """
        headers = self._get_jwt_headers('docente_a@monteverde.com')
        response = self.client.get(f'/api/docente/rendimiento-academico?bimestre_id={self.bimestre1_id}', headers=headers)
        data = json.loads(response.data.decode('utf-8'))['data']

        asig = data['asignaciones'][0]
        estudiantes = {e['nombre']: e for e in asig['estudiantes']}

        # Ana
        self.assertEqual(estudiantes['Ana Sobresaliente']['promedio'], 4.25)
        self.assertEqual(estudiantes['Ana Sobresaliente']['estado'], 'SOBRESALIENTE')

        # Carlos
        self.assertEqual(estudiantes['Carlos EnRiesgo']['promedio'], 2.17)
        self.assertEqual(estudiantes['Carlos EnRiesgo']['estado'], 'EN_RIESGO')

        # Diana
        self.assertEqual(estudiantes['Diana Parcial']['promedio'], 3.5)
        self.assertEqual(estudiantes['Diana Parcial']['estado'], 'ACEPTABLE')

        # Elena
        self.assertIsNone(estudiantes['Elena SinNotas']['promedio'])
        self.assertEqual(estudiantes['Elena SinNotas']['estado'], 'SIN_DATOS')

    # =========================================================================
    # 3. Filtrado por bimestre
    # =========================================================================
    def test_03_filtrado_por_bimestre(self):
        """Verifica que al filtrar por bimestre_id=2 devuelva solo información del segundo bimestre."""
        headers = self._get_jwt_headers('docente_a@monteverde.com')
        response = self.client.get(f'/api/docente/rendimiento-academico?bimestre_id={self.bimestre2_id}', headers=headers)
        data = json.loads(response.data.decode('utf-8'))['data']

        self.assertEqual(data['bimestre']['id'], self.bimestre2_id)
        asig = data['asignaciones'][0]
        estudiantes = {e['nombre']: e for e in asig['estudiantes']}

        # En Bimestre 2, solo Diana tiene nota (5.0), los otros 3 están SIN_DATOS
        self.assertEqual(estudiantes['Diana Parcial']['promedio'], 5.0)
        self.assertEqual(estudiantes['Diana Parcial']['estado'], 'SOBRESALIENTE')
        self.assertEqual(estudiantes['Ana Sobresaliente']['estado'], 'SIN_DATOS')
        self.assertEqual(asig['sin_datos'], 3)
        self.assertEqual(asig['aprobados'], 1)

    # =========================================================================
    # 4. Aislamiento por docente
    # =========================================================================
    def test_04_aislamiento_por_docente(self):
        """Docente A solo ve sus cursos/materias; Docente B no ve asignaciones de Docente A."""
        headers_a = self._get_jwt_headers('docente_a@monteverde.com')
        res_a = self.client.get('/api/docente/rendimiento-academico', headers=headers_a)
        data_a = json.loads(res_a.data.decode('utf-8'))['data']

        # Docente A tiene 5°A - Matemáticas
        cursos_a = [a['curso'] for a in data_a['asignaciones']]
        self.assertIn('5A', cursos_a)
        self.assertNotIn('7B', cursos_a)

        headers_b = self._get_jwt_headers('docente_b@monteverde.com')
        res_b = self.client.get('/api/docente/rendimiento-academico', headers=headers_b)
        data_b = json.loads(res_b.data.decode('utf-8'))['data']

        # Docente B tiene 7°B - Ciencias
        cursos_b = [a['curso'] for a in data_b['asignaciones']]
        self.assertIn('7B', cursos_b)
        self.assertNotIn('5A', cursos_b)

    # =========================================================================
    # 5. JWT ausente (401 Unauthorized)
    # =========================================================================
    def test_05_jwt_ausente_401(self):
        """Petición sin header Authorization debe responder 401."""
        response = self.client.get('/api/docente/rendimiento-academico')
        self.assertEqual(response.status_code, 401)

    # =========================================================================
    # 6. Rol incorrecto (403 Forbidden)
    # =========================================================================
    def test_06_rol_incorrecto_familia_403(self):
        """Usuario con rol 'familia' debe recibir 403 Forbidden."""
        headers = self._get_jwt_headers('familiagonzalez@monteverde.com')
        response = self.client.get('/api/docente/rendimiento-academico', headers=headers)
        self.assertEqual(response.status_code, 403)

    # =========================================================================
    # 7. Estudiante SIN_DATOS
    # =========================================================================
    def test_07_estudiante_sin_datos(self):
        """Un estudiante sin calificaciones debe tener estado SIN_DATOS y promedio None."""
        headers = self._get_jwt_headers('docente_a@monteverde.com')
        response = self.client.get(f'/api/docente/rendimiento-academico?bimestre_id={self.bimestre1_id}', headers=headers)
        data = json.loads(response.data.decode('utf-8'))['data']

        asig = data['asignaciones'][0]
        est_sin_datos = next(e for e in asig['estudiantes'] if e['nombre'] == 'Elena SinNotas')

        self.assertEqual(est_sin_datos['estado'], 'SIN_DATOS')
        self.assertIsNone(est_sin_datos['promedio'])
        self.assertEqual(asig['sin_datos'], 1)

    # =========================================================================
    # 8. Estudiante parcialmente calificado
    # =========================================================================
    def test_08_estudiante_parcialmente_calificado(self):
        """Estudiante con notas en un solo indicador promedia las notas válidas sin ser descartado."""
        headers = self._get_jwt_headers('docente_a@monteverde.com')
        response = self.client.get(f'/api/docente/rendimiento-academico?bimestre_id={self.bimestre1_id}', headers=headers)
        data = json.loads(response.data.decode('utf-8'))['data']

        asig = data['asignaciones'][0]
        est_parcial = next(e for e in asig['estudiantes'] if e['nombre'] == 'Diana Parcial')

        # Diana tiene notas [4.0, None, 3.0] en Ind 1 -> (4.0+3.0)/2 = 3.5. Ind 2 = None.
        self.assertEqual(est_parcial['promedio'], 3.5)
        self.assertEqual(est_parcial['estado'], 'ACEPTABLE')

    # =========================================================================
    # 9. Tasa de aprobación excluye SIN_DATOS del denominador
    # =========================================================================
    def test_09_tasa_aprobacion_excluye_sin_datos(self):
        """
        Total estudiantes = 4
        Aprobados = 2 (Ana: 4.25, Diana: 3.5)
        En Riesgo = 1 (Carlos: 2.17)
        Sin Datos = 1 (Elena)
        Estudiantes con datos válidos = 2 + 1 = 3
        Tasa de aprobación esperada = (2 / 3) * 100 = 66.67% (NO 2/4 = 50%)
        Promedio grupo esperado = (4.25 + 2.17 + 3.5) / 3 = 3.31
        """
        headers = self._get_jwt_headers('docente_a@monteverde.com')
        response = self.client.get(f'/api/docente/rendimiento-academico?bimestre_id={self.bimestre1_id}', headers=headers)
        data = json.loads(response.data.decode('utf-8'))['data']

        asig = data['asignaciones'][0]
        self.assertEqual(asig['total_estudiantes'], 4)
        self.assertEqual(asig['aprobados'], 2)
        self.assertEqual(asig['en_riesgo'], 1)
        self.assertEqual(asig['sin_datos'], 1)
        self.assertEqual(asig['estudiantes_con_datos'], 3)
        self.assertEqual(asig['tasa_aprobacion'], 66.67)
        self.assertEqual(asig['promedio_grupo'], 3.31)

        # KPIs globales deben coincidir
        kpis = data['kpis']
        self.assertEqual(kpis['total_estudiantes'], 4)
        self.assertEqual(kpis['estudiantes_en_riesgo'], 1)
        self.assertEqual(kpis['estudiantes_sin_datos'], 1)
        self.assertEqual(kpis['tasa_aprobacion'], 66.67)
        self.assertEqual(kpis['promedio_general'], 3.31)


if __name__ == '__main__':
    unittest.main()
