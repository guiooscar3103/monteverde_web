from datetime import datetime, date
from src.extensions import db
from src.models.calendario_academico import CalendarioAcademico
from src.models.bimestre import Bimestre, PeriodoLectivo

class CalendarioService:
    @staticmethod
    def get_or_create_calendario(anio=None):
        """
        Garantiza la existencia del calendario académico institucional para el año solicitado
        y vincula sus periodos lectivos (bimestres).
        """
        if not anio:
            anio = datetime.now().year

        calendario = CalendarioAcademico.query.filter_by(anio=anio).first()

        if not calendario:
            calendario = CalendarioAcademico(
                anio=anio,
                nombre=f'Calendario Académico Institucional {anio}',
                fecha_inicio=date(anio, 2, 1),
                fecha_fin=date(anio, 11, 30),
                estado='EN_CURSO',
                descripcion=f'Calendario oficial y periodos evaluativos del año {anio}.'
            )
            db.session.add(calendario)
            db.session.flush()

        # Asegurar y sincronizar periodos lectivos (Bimestres 1 al 4)
        fechas_defecto = [
            (1, f'Bimestre 1', date(anio, 2, 1), date(anio, 4, 15), None, 'ABIERTO'),
            (2, f'Bimestre 2', date(anio, 4, 21), date(anio, 6, 20), None, 'ABIERTO'),
            (3, f'Bimestre 3', date(anio, 7, 15), date(anio, 9, 20), None, 'ABIERTO'),
            (4, f'Bimestre 4', date(anio, 10, 1), date(anio, 11, 25), None, 'ABIERTO'),
        ]

        for orden, nombre, f_inicio, f_fin, f_cierre, estado in fechas_defecto:
            bim = Bimestre.query.filter_by(anio=anio, orden=orden).first()
            if not bim:
                bim = Bimestre(
                    calendario_id=calendario.id,
                    nombre=nombre,
                    anio=anio,
                    orden=orden,
                    fecha_inicio=f_inicio,
                    fecha_fin=f_fin,
                    fecha_cierre_calificaciones=f_cierre,
                    estado=estado
                )
                db.session.add(bim)
            else:
                if not bim.calendario_id:
                    bim.calendario_id = calendario.id
                if not bim.fecha_inicio:
                    bim.fecha_inicio = f_inicio
                if not bim.fecha_fin:
                    bim.fecha_fin = f_fin
                if not bim.fecha_cierre_calificaciones:
                    bim.fecha_cierre_calificaciones = f_cierre
                if not bim.estado:
                    bim.estado = estado

        db.session.commit()
        return calendario

    @staticmethod
    def get_calendario(anio=None):
        return CalendarioService.get_or_create_calendario(anio)

    @staticmethod
    def actualizar_calendario(calendario_id, data):
        calendario = CalendarioAcademico.query.get(calendario_id)
        if not calendario:
            raise ValueError('Calendario académico no encontrado')

        if 'nombre' in data:
            calendario.nombre = data['nombre']
        if 'estado' in data:
            calendario.estado = data['estado']
        if 'descripcion' in data:
            calendario.descripcion = data['descripcion']
        if 'fecha_inicio' in data and data['fecha_inicio']:
            calendario.fecha_inicio = datetime.strptime(data['fecha_inicio'], '%Y-%m-%d').date() if isinstance(data['fecha_inicio'], str) else data['fecha_inicio']
        if 'fecha_fin' in data and data['fecha_fin']:
            calendario.fecha_fin = datetime.strptime(data['fecha_fin'], '%Y-%m-%d').date() if isinstance(data['fecha_fin'], str) else data['fecha_fin']

        calendario.updated_at = datetime.utcnow()
        db.session.commit()
        return calendario

    @staticmethod
    def get_periodos(anio=None):
        if not anio:
            anio = datetime.now().year
        CalendarioService.get_or_create_calendario(anio)
        return Bimestre.query.filter_by(anio=anio).order_by(Bimestre.orden).all()

    @staticmethod
    def cambiar_estado_periodo(periodo_id, nuevo_estado, usuario_id=None):
        periodo = Bimestre.query.get(periodo_id)
        if not periodo:
            raise ValueError(f'Periodo lectivo con ID {periodo_id} no encontrado')

        estado_normalizado = nuevo_estado.strip().upper()
        if estado_normalizado not in ('ABIERTO', 'CERRADO'):
            raise ValueError("El estado debe ser 'ABIERTO' o 'CERRADO'")

        periodo.estado = estado_normalizado
        db.session.commit()
        return periodo

    @staticmethod
    def actualizar_periodo(periodo_id, data):
        periodo = Bimestre.query.get(periodo_id)
        if not periodo:
            raise ValueError(f'Periodo lectivo con ID {periodo_id} no encontrado')

        if 'nombre' in data and data['nombre']:
            periodo.nombre = data['nombre']
        if 'estado' in data and data['estado']:
            periodo.estado = data['estado'].strip().upper()

        if 'fecha_inicio' in data:
            val = data['fecha_inicio']
            periodo.fecha_inicio = datetime.strptime(val, '%Y-%m-%d').date() if isinstance(val, str) and val else (val if isinstance(val, date) else None)

        if 'fecha_fin' in data:
            val = data['fecha_fin']
            periodo.fecha_fin = datetime.strptime(val, '%Y-%m-%d').date() if isinstance(val, str) and val else (val if isinstance(val, date) else None)

        if 'fecha_cierre_calificaciones' in data:
            val = data['fecha_cierre_calificaciones']
            periodo.fecha_cierre_calificaciones = datetime.strptime(val, '%Y-%m-%d').date() if isinstance(val, str) and val else (val if isinstance(val, date) else None)

        db.session.commit()
        return periodo

    @staticmethod
    def puede_calificar_periodo(periodo_id):
        """
        Verifica si un docente tiene autorización para asentar o modificar notas en el periodo.
        Retorna (puede_calificar: bool, motivo_rechazo: str).
        """
        periodo = Bimestre.query.get(periodo_id)
        if not periodo:
            return False, 'El periodo lectivo seleccionado no existe en el sistema.'

        if (periodo.estado or 'ABIERTO').strip().upper() == 'CERRADO':
            return False, f'El periodo académico "{periodo.nombre}" ha sido CERRADO por la Coordinación Académica.'

        if periodo.fecha_cierre_calificaciones:
            limite = periodo.fecha_cierre_calificaciones
            if hasattr(limite, 'date'):
                limite = limite.date()
            if date.today() > limite:
                f_str = limite.strftime('%d/%m/%Y')
                return False, f'La fecha límite para el ingreso de calificaciones en "{periodo.nombre}" venció el {f_str}.'

        return True, ''
