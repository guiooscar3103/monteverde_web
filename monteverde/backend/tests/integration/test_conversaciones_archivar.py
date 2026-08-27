import os
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-archivar-monteverde-32bytes!'

from config import Config
Config.SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
Config.SQLALCHEMY_ECHO = False

import unittest
import json
from datetime import datetime, timedelta
from app import create_app
from src.extensions import db
from src.models.usuario import Usuario, familia_estudiante
from src.models.mensaje import Mensaje
from src.models.curso import Curso
from src.models.estudiante import Estudiante
from src.models.docente_asignacion import DocenteAsignacion
from src.models.conversacion_archivada import ConversacionArchivada


class ConversacionesArchivarTestCase(unittest.TestCase):
    """
    Suite de pruebas automatizadas para la funcionalidad 'Archivar Conversación' en MonteVerde:
    - Test 1: Archivar conversación (Usuario A archiva a B -> 200 OK, registro en BD).
    - Test 2: Desarchivar conversación (Usuario A desarchiva a B -> 200 OK, registro eliminado).
    - Test 3: Independencia entre usuarios (A archiva a B -> A tiene archivado, B NO).
    - Test 4: Desarchivado automático al recibir mensaje (A archiva a B -> B envía mensaje a A -> registro eliminado).
    - Test 5: Desarchivado automático en difusión masiva a curso (enviar-curso individual por receptor).
    - Test 6: Autenticación JWT obligatoria (sin token -> 401 en archivar, desarchivar y listar).
    - Test 7: Idempotencia (archivar 2 veces no crea duplicado ni error 500; desarchivar 2 veces devuelve 200 OK).
    - Test 8: Contacto inexistente (devuelve 404 controlado, no 500).
    - Test 9: Autoarchivado (usuario_id == contacto_id -> 400 Bad Request).
    - Test 10: Integración con filtro de conversaciones (GET /conversaciones?estado=activas|archivadas|todas).
    - Test 11: Preservación de mensajes históricos (no se elimina ningún mensaje en BD).
    """

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key-archivar-monteverde-32bytes!'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # 1. Crear usuarios de prueba
            self.docente = Usuario(
                nombre='Docente María López',
                email='docente_arch@monteverde.com',
                rol='docente',
                activo=True
            )
            self.docente.set_password('docente123')

            self.familia_a = Usuario(
                nombre='Familia Andrade',
                email='familia_a_arch@monteverde.com',
                rol='familia',
                activo=True
            )
            self.familia_a.set_password('familia123')

            self.familia_b = Usuario(
                nombre='Familia Benítez',
                email='familia_b_arch@monteverde.com',
                rol='familia',
                activo=True
            )
            self.familia_b.set_password('familia123')

            db.session.add_all([self.docente, self.familia_a, self.familia_b])
            db.session.flush()

            # 2. Crear curso y estudiantes para pruebas de difusión
            self.curso = Curso(
                nombre='Grado 5A',
                nivel='5',
                letra='A',
                descripcion='Curso de quinto grado'
            )
            db.session.add(self.curso)
            db.session.flush()


            # Asignación de docente al curso
            self.asignacion = DocenteAsignacion(
                docente_id=self.docente.id,
                curso_id=self.curso.id,
                materia_id=1
            )
            db.session.add(self.asignacion)

            # Estudiante 1 -> Familia A
            self.estudiante_1 = Estudiante(
                nombre='Lucas Andrade',
                curso_id=self.curso.id
            )
            # Estudiante 2 -> Familia B
            self.estudiante_2 = Estudiante(
                nombre='Sofía Benítez',
                curso_id=self.curso.id
            )
            db.session.add_all([self.estudiante_1, self.estudiante_2])
            db.session.flush()


            # Asociar familias a estudiantes
            db.session.execute(familia_estudiante.insert().values([
                {'familia_id': self.familia_a.id, 'estudiante_id': self.estudiante_1.id},
                {'familia_id': self.familia_b.id, 'estudiante_id': self.estudiante_2.id}
            ]))

            # 3. Mensajes iniciales de prueba
            self.msg1 = Mensaje(
                emisor_id=self.docente.id,
                receptor_id=self.familia_a.id,
                asunto='Bienvenida al curso',
                cuerpo='Estimada familia Andrade, bienvenidos al nuevo año escolar.',
                fecha=datetime.utcnow() - timedelta(hours=2),
                leido=True
            )
            self.msg2 = Mensaje(
                emisor_id=self.docente.id,
                receptor_id=self.familia_b.id,
                asunto='Bienvenida al curso',
                cuerpo='Estimada familia Benítez, bienvenidos al nuevo año escolar.',
                fecha=datetime.utcnow() - timedelta(hours=1),
                leido=False
            )
            db.session.add_all([self.msg1, self.msg2])
            db.session.commit()

            self.docente_id = self.docente.id
            self.familia_a_id = self.familia_a.id
            self.familia_b_id = self.familia_b.id
            self.curso_id = self.curso.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _login(self, email, password):
        res = self.client.post('/api/auth/login', json={'email': email, 'password': password})
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        return data['token']

    def test_01_archivar_conversacion_exitosamente(self):
        """Test 1: Usuario A (Familia) archiva conversación con B (Docente) -> 200 OK y registro creado."""
        token_a = self._login('familia_a_arch@monteverde.com', 'familia123')
        res = self.client.post(
            f'/api/mensajes/conversaciones/{self.docente_id}/archivar',
            headers={'Authorization': f'Bearer {token_a}'}
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['message'], 'Conversación archivada exitosamente')

        # Verificar en base de datos
        with self.app.app_context():
            archivada = ConversacionArchivada.query.filter_by(
                usuario_id=self.familia_a_id,
                contacto_id=self.docente_id
            ).first()
            self.assertIsNotNone(archivada)
            self.assertIsNotNone(archivada.fecha_archivado)

    def test_02_desarchivar_conversacion_exitosamente(self):
        """Test 2: Usuario A desarchiva conversación con B -> 200 OK y registro eliminado."""
        token_a = self._login('familia_a_arch@monteverde.com', 'familia123')
        
        # Primero archivar
        self.client.post(
            f'/api/mensajes/conversaciones/{self.docente_id}/archivar',
            headers={'Authorization': f'Bearer {token_a}'}
        )

        # Luego desarchivar
        res = self.client.post(
            f'/api/mensajes/conversaciones/{self.docente_id}/desarchivar',
            headers={'Authorization': f'Bearer {token_a}'}
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['message'], 'Conversación desarchivada exitosamente')

        # Verificar en base de datos
        with self.app.app_context():
            archivada = ConversacionArchivada.query.filter_by(
                usuario_id=self.familia_a_id,
                contacto_id=self.docente_id
            ).first()
            self.assertIsNone(archivada)

    def test_03_independencia_entre_usuarios(self):
        """Test 3: El archivado es unidireccional. A archiva a B -> A tiene archivada, B NO."""
        token_a = self._login('familia_a_arch@monteverde.com', 'familia123')
        token_docente = self._login('docente_arch@monteverde.com', 'docente123')

        # Familia A archiva a Docente
        res = self.client.post(
            f'/api/mensajes/conversaciones/{self.docente_id}/archivar',
            headers={'Authorization': f'Bearer {token_a}'}
        )
        self.assertEqual(res.status_code, 200)

        # Consultar archivadas de Familia A -> Debe tener 1
        res_a = self.client.get(
            '/api/mensajes/conversaciones/archivadas',
            headers={'Authorization': f'Bearer {token_a}'}
        )
        data_a = json.loads(res_a.data)
        self.assertEqual(len(data_a['conversaciones']), 1)
        self.assertEqual(data_a['conversaciones'][0]['contacto_id'], self.docente_id)

        # Consultar archivadas de Docente -> Debe tener 0
        res_doc = self.client.get(
            '/api/mensajes/conversaciones/archivadas',
            headers={'Authorization': f'Bearer {token_docente}'}
        )
        data_doc = json.loads(res_doc.data)
        self.assertEqual(len(data_doc['conversaciones']), 0)

    def test_04_desarchivado_automatico_al_recibir_mensaje_individual(self):
        """Test 4: Si A archiva a B y luego B le envía un mensaje a A, la conversación de A se desarchiva."""
        token_a = self._login('familia_a_arch@monteverde.com', 'familia123')
        token_b = self._login('docente_arch@monteverde.com', 'docente123')

        # 1. Familia A archiva a Docente
        self.client.post(
            f'/api/mensajes/conversaciones/{self.docente_id}/archivar',
            headers={'Authorization': f'Bearer {token_a}'}
        )

        with self.app.app_context():
            self.assertIsNotNone(
                ConversacionArchivada.query.filter_by(usuario_id=self.familia_a_id, contacto_id=self.docente_id).first()
            )

        # 2. Docente envía un nuevo mensaje a Familia A
        res_envio = self.client.post(
            '/api/mensajes/enviar',
            headers={'Authorization': f'Bearer {token_b}'},
            json={
                'receptorId': self.familia_a_id,
                'asunto': 'Nuevo comunicado',
                'cuerpo': 'Hola familia Andrade, les escribo con novedades.'
            }
        )
        self.assertEqual(res_envio.status_code, 200)

        # 3. Verificar que el archivado de Familia A fue eliminado automáticamente
        with self.app.app_context():
            archivada = ConversacionArchivada.query.filter_by(
                usuario_id=self.familia_a_id,
                contacto_id=self.docente_id
            ).first()
            self.assertIsNone(archivada)

    def test_05_desarchivado_automatico_en_difusion_masiva_a_curso(self):
        """Test 5: Difusión a curso desarchiva individualmente a los acudientes destinatarios."""
        token_a = self._login('familia_a_arch@monteverde.com', 'familia123')
        token_docente = self._login('docente_arch@monteverde.com', 'docente123')

        # Familia A archiva la conversación con el docente
        self.client.post(
            f'/api/mensajes/conversaciones/{self.docente_id}/archivar',
            headers={'Authorization': f'Bearer {token_a}'}
        )

        with self.app.app_context():
            self.assertIsNotNone(
                ConversacionArchivada.query.filter_by(usuario_id=self.familia_a_id, contacto_id=self.docente_id).first()
            )

        # Docente emite difusión masiva a todo el curso Grado 5A
        res = self.client.post(
            '/api/mensajes/enviar-curso',
            headers={'Authorization': f'Bearer {token_docente}'},
            json={
                'curso_id': self.curso_id,
                'asunto': 'Circular general del curso',
                'cuerpo': 'Recordatorio sobre la salida pedagógica.'
            }
        )
        self.assertEqual(res.status_code, 201)

        # Verificar que se desarchivó automáticamente para Familia A
        with self.app.app_context():
            archivada = ConversacionArchivada.query.filter_by(
                usuario_id=self.familia_a_id,
                contacto_id=self.docente_id
            ).first()
            self.assertIsNone(archivada)

    def test_06_jwt_obligatorio_en_endpoints(self):
        """Test 6: Endpoints de archivado y desarchivado rechazan peticiones sin token con 401."""
        res_arch = self.client.post(f'/api/mensajes/conversaciones/{self.docente_id}/archivar')
        self.assertIn(res_arch.status_code, [401, 422])

        res_desarch = self.client.post(f'/api/mensajes/conversaciones/{self.docente_id}/desarchivar')
        self.assertIn(res_desarch.status_code, [401, 422])

        res_list = self.client.get('/api/mensajes/conversaciones/archivadas')
        self.assertIn(res_list.status_code, [401, 422])

        res_conv = self.client.get('/api/mensajes/conversaciones')
        self.assertIn(res_conv.status_code, [401, 422])

    def test_07_idempotencia_archivar_y_desarchivar(self):
        """Test 7: Archivar dos veces no duplica ni lanza error 500; desarchivar dos veces devuelve 200 OK."""
        token_a = self._login('familia_a_arch@monteverde.com', 'familia123')

        # Archivar vez 1
        res1 = self.client.post(
            f'/api/mensajes/conversaciones/{self.docente_id}/archivar',
            headers={'Authorization': f'Bearer {token_a}'}
        )
        self.assertEqual(res1.status_code, 200)

        # Archivar vez 2 (Idempotencia)
        res2 = self.client.post(
            f'/api/mensajes/conversaciones/{self.docente_id}/archivar',
            headers={'Authorization': f'Bearer {token_a}'}
        )
        self.assertEqual(res2.status_code, 200)
        self.assertTrue(json.loads(res2.data)['success'])

        with self.app.app_context():
            count = ConversacionArchivada.query.filter_by(
                usuario_id=self.familia_a_id,
                contacto_id=self.docente_id
            ).count()
            self.assertEqual(count, 1)

        # Desarchivar vez 1
        res_d1 = self.client.post(
            f'/api/mensajes/conversaciones/{self.docente_id}/desarchivar',
            headers={'Authorization': f'Bearer {token_a}'}
        )
        self.assertEqual(res_d1.status_code, 200)

        # Desarchivar vez 2 (Idempotencia)
        res_d2 = self.client.post(
            f'/api/mensajes/conversaciones/{self.docente_id}/desarchivar',
            headers={'Authorization': f'Bearer {token_a}'}
        )
        self.assertEqual(res_d2.status_code, 200)
        self.assertTrue(json.loads(res_d2.data)['success'])

    def test_08_contacto_inexistente_retorna_404(self):
        """Test 8: Intentar archivar con un contacto_id inexistente devuelve 404 controlado."""
        token_a = self._login('familia_a_arch@monteverde.com', 'familia123')
        res = self.client.post(
            '/api/mensajes/conversaciones/999999/archivar',
            headers={'Authorization': f'Bearer {token_a}'}
        )
        self.assertEqual(res.status_code, 404)
        data = json.loads(res.data)
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'Contacto no encontrado')

    def test_09_autoarchivado_rechazado_400(self):
        """Test 9: Intentar archivar una conversación consigo mismo es rechazado con 400 Bad Request."""
        token_a = self._login('familia_a_arch@monteverde.com', 'familia123')
        res = self.client.post(
            f'/api/mensajes/conversaciones/{self.familia_a_id}/archivar',
            headers={'Authorization': f'Bearer {token_a}'}
        )
        self.assertEqual(res.status_code, 400)
        data = json.loads(res.data)
        self.assertFalse(data['success'])
        self.assertIn('contigo mismo', data['message'])

    def test_10_filtro_conversaciones_activas_vs_archivadas(self):
        """Test 10: GET /api/mensajes/conversaciones soporta filtros de activas, archivadas y todas."""
        token_docente = self._login('docente_arch@monteverde.com', 'docente123')

        # Docente archiva la conversación con Familia A
        self.client.post(
            f'/api/mensajes/conversaciones/{self.familia_a_id}/archivar',
            headers={'Authorization': f'Bearer {token_docente}'}
        )

        # 1. Filtro 'activas' -> Solo debe incluir Familia B
        res_activas = self.client.get(
            '/api/mensajes/conversaciones?estado=activas',
            headers={'Authorization': f'Bearer {token_docente}'}
        )
        self.assertEqual(res_activas.status_code, 200)
        data_activas = json.loads(res_activas.data)['conversaciones']
        contactos_activas = [c['contacto_id'] for c in data_activas]
        self.assertIn(self.familia_b_id, contactos_activas)
        self.assertNotIn(self.familia_a_id, contactos_activas)

        # 2. Filtro 'archivadas' -> Solo debe incluir Familia A
        res_arch = self.client.get(
            '/api/mensajes/conversaciones?estado=archivadas',
            headers={'Authorization': f'Bearer {token_docente}'}
        )
        self.assertEqual(res_arch.status_code, 200)
        data_arch = json.loads(res_arch.data)['conversaciones']
        contactos_arch = [c['contacto_id'] for c in data_arch]
        self.assertIn(self.familia_a_id, contactos_arch)
        self.assertNotIn(self.familia_b_id, contactos_arch)

        # 3. Filtro 'todas' -> Debe incluir ambas
        res_todas = self.client.get(
            '/api/mensajes/conversaciones?estado=todas',
            headers={'Authorization': f'Bearer {token_docente}'}
        )
        self.assertEqual(res_todas.status_code, 200)
        data_todas = json.loads(res_todas.data)['conversaciones']
        contactos_todas = [c['contacto_id'] for c in data_todas]
        self.assertIn(self.familia_a_id, contactos_todas)
        self.assertIn(self.familia_b_id, contactos_todas)

    def test_11_preservacion_mensajes_historicos(self):
        """Test 11: Archivar y desarchivar nunca elimina físicamente los mensajes históricos."""
        token_a = self._login('familia_a_arch@monteverde.com', 'familia123')

        with self.app.app_context():
            mensajes_iniciales = Mensaje.query.count()

        # Archivar y luego desarchivar
        self.client.post(
            f'/api/mensajes/conversaciones/{self.docente_id}/archivar',
            headers={'Authorization': f'Bearer {token_a}'}
        )
        self.client.post(
            f'/api/mensajes/conversaciones/{self.docente_id}/desarchivar',
            headers={'Authorization': f'Bearer {token_a}'}
        )

        with self.app.app_context():
            mensajes_finales = Mensaje.query.count()
            self.assertEqual(mensajes_iniciales, mensajes_finales)


if __name__ == '__main__':
    unittest.main()
