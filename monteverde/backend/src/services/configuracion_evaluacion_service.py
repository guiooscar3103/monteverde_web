from datetime import datetime
from src.extensions import db
from src.models.configuracion_evaluacion import ConfiguracionEvaluacion
from src.models.bimestre import Bimestre
from src.models.indicador_logro import IndicadorLogro
from src.models.calificacion_bimestre import CalificacionBimestre
from src.models.configuracion_institucional import ConfiguracionInstitucional

class ConfiguracionEvaluacionService:
    """
    Servicio de lógica de negocio para la gestión dinámica del sistema de evaluación.
    Centraliza la validación, persistencia, compatibilidad y consulta de reglas académicas.
    """

    @classmethod
    def get_or_create_default(cls, anio: int | None = None) -> ConfiguracionEvaluacion:
        """
        Obtiene la configuración académica del año indicado o crea una por defecto
        (4 periodos, 2 indicadores, 3 notas, escala 1.0 a 5.0) para garantizar 100% de compatibilidad hacia atrás.
        """
        if anio is None:
            config_inst = ConfiguracionInstitucional.query.filter_by(activa=True).first()
            if config_inst and config_inst.anio_escolar and config_inst.anio_escolar.isdigit():
                anio = int(config_inst.anio_escolar)
            else:
                anio = datetime.now().year

        config = ConfiguracionEvaluacion.query.filter_by(anio_academico=anio).first()
        if not config:
            config = ConfiguracionEvaluacion(
                anio_academico=anio,
                nombre=f'Configuración Académica {anio}',
                tipo_periodo='Bimestre',
                numero_periodos=4,
                indicadores_por_periodo=2,
                notas_por_indicador=3,
                tipo_escala='NUMERICA_CINCO',
                escala_minima=1.00,
                escala_maxima=5.00,
                nota_aprobatoria=3.00,
                activa=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.session.add(config)
            db.session.commit()

        # Sincronizar periodos en bimestres_config si no existen para este año
        cls._sincronizar_periodos_db(config)
        return config

    @classmethod
    def get_activa(cls) -> ConfiguracionEvaluacion:
        """Retorna la configuración activa correspondiente al año escolar actual de la institución."""
        config_inst = ConfiguracionInstitucional.query.filter_by(activa=True).first()
        anio = None
        if config_inst and config_inst.anio_escolar and config_inst.anio_escolar.isdigit():
            anio = int(config_inst.anio_escolar)
        
        if anio:
            config = ConfiguracionEvaluacion.query.filter_by(anio_academico=anio, activa=True).first()
            if config:
                return config
            return cls.get_or_create_default(anio)
        
        # Fallback a la más reciente activa
        config = ConfiguracionEvaluacion.query.filter_by(activa=True).order_by(ConfiguracionEvaluacion.anio_academico.desc()).first()
        if config:
            return config
        return cls.get_or_create_default(datetime.now().year)

    @classmethod
    def get_por_anio(cls, anio: int) -> ConfiguracionEvaluacion | None:
        """Obtiene la configuración por año específico."""
        return ConfiguracionEvaluacion.query.filter_by(anio_academico=anio).first()

    @classmethod
    def get_por_bimestre_id(cls, bimestre_id: int) -> ConfiguracionEvaluacion:
        """Resuelve la configuración de evaluación asociada al año de un bimestre/periodo específico."""
        bimestre = Bimestre.query.get(bimestre_id)
        if bimestre and bimestre.anio:
            config = cls.get_por_anio(bimestre.anio)
            if config:
                return config
            return cls.get_or_create_default(bimestre.anio)
        return cls.get_activa()

    @classmethod
    def listar_todas(cls) -> list[dict]:
        """Lista todas las configuraciones registradas ordenadas por año descendente."""
        configs = ConfiguracionEvaluacion.query.order_by(ConfiguracionEvaluacion.anio_academico.desc()).all()
        if not configs:
            cls.get_or_create_default()
            configs = ConfiguracionEvaluacion.query.order_by(ConfiguracionEvaluacion.anio_academico.desc()).all()
        return [c.to_dict() for c in configs]

    @classmethod
    def guardar_o_actualizar(cls, data: dict, usuario_id: int | None = None) -> tuple[ConfiguracionEvaluacion | None, str | None]:
        """
        Crea o actualiza una configuración de evaluación con validaciones estrictas y control de cambios.
        """
        try:
            anio = data.get('anio_academico')
            if not anio or not str(anio).isdigit():
                return None, 'El año académico es obligatorio y debe ser numérico.'
            anio = int(anio)

            numero_periodos = int(data.get('numero_periodos', 4))
            indicadores_por_periodo = int(data.get('indicadores_por_periodo', 2))
            notas_por_indicador = int(data.get('notas_por_indicador', 3))
            escala_minima = float(data.get('escala_minima', 1.0))
            escala_maxima = float(data.get('escala_maxima', 5.0))
            nota_aprobatoria = float(data.get('nota_aprobatoria', 3.0))
            tipo_escala = data.get('tipo_escala', 'NUMERICA_CINCO')
            tipo_periodo = data.get('tipo_periodo', 'Bimestre').strip() or 'Periodo'
            nombre = data.get('nombre', f'Configuración {tipo_periodo} {anio}').strip()
            activa = bool(data.get('activa', True))

            if numero_periodos < 1 or numero_periodos > 12:
                return None, 'El número de periodos debe estar entre 1 y 12.'
            if indicadores_por_periodo < 1 or indicadores_por_periodo > 20:
                return None, 'La cantidad de indicadores por periodo debe estar entre 1 y 20.'
            if notas_por_indicador < 1 or notas_por_indicador > 20:
                return None, 'La cantidad de notas por indicador debe estar entre 1 y 20.'
            if escala_minima >= escala_maxima:
                return None, 'La escala mínima debe ser estrictamente menor a la escala máxima.'
            if not (escala_minima <= nota_aprobatoria <= escala_maxima):
                return None, f'La nota aprobatoria ({nota_aprobatoria}) debe estar dentro de la escala ({escala_minima} - {escala_maxima}).'

            # Verificar compatibilidad con datos existentes
            compatibilidad = cls.verificar_compatibilidad_cambio(
                anio=anio,
                nuevo_indicadores=indicadores_por_periodo,
                nuevo_notas=notas_por_indicador,
                nueva_escala_min=escala_minima,
                nueva_escala_max=escala_maxima
            )

            # Si el usuario no forzó la omisión y hay conflictos estructurales destructivos
            forzar = data.get('forzar', False)
            if not compatibilidad['compatible'] and not forzar:
                detalles = "; ".join(compatibilidad['conflictos'])
                return None, f'Conflicto con datos existentes para el año {anio}: {detalles}. Se requiere confirmación explícita.'

            config = ConfiguracionEvaluacion.query.filter_by(anio_academico=anio).first()
            if config:
                config.nombre = nombre
                config.tipo_periodo = tipo_periodo
                config.numero_periodos = numero_periodos
                config.indicadores_por_periodo = indicadores_por_periodo
                config.notas_por_indicador = notas_por_indicador
                config.tipo_escala = tipo_escala
                config.escala_minima = escala_minima
                config.escala_maxima = escala_maxima
                config.nota_aprobatoria = nota_aprobatoria
                config.activa = activa
                config.usuario_actualizo_id = usuario_id
                config.updated_at = datetime.utcnow()
            else:
                config = ConfiguracionEvaluacion(
                    anio_academico=anio,
                    nombre=nombre,
                    tipo_periodo=tipo_periodo,
                    numero_periodos=numero_periodos,
                    indicadores_por_periodo=indicadores_por_periodo,
                    notas_por_indicador=notas_por_indicador,
                    tipo_escala=tipo_escala,
                    escala_minima=escala_minima,
                    escala_maxima=escala_maxima,
                    nota_aprobatoria=nota_aprobatoria,
                    activa=activa,
                    usuario_actualizo_id=usuario_id,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.session.add(config)

            db.session.flush()
            cls._sincronizar_periodos_db(config)
            db.session.commit()
            return config, None

        except Exception as exc:
            db.session.rollback()
            return None, str(exc)

    @classmethod
    def _sincronizar_periodos_db(cls, config: ConfiguracionEvaluacion):
        """Asegura que los registros en bimestres_config concuerden con los periodos configurados."""
        periodos_existentes = Bimestre.query.filter_by(anio=config.anio_academico).order_by(Bimestre.orden).all()
        existentes_por_orden = {p.orden: p for p in periodos_existentes}

        for orden in range(1, config.numero_periodos + 1):
            if orden in existentes_por_orden:
                periodo = existentes_por_orden[orden]
                # Actualizar nombre si el prefijo cambió
                nombre_esperado = f'{config.tipo_periodo} {orden}'
                if periodo.nombre.startswith('Bimestre') or periodo.nombre.startswith('Periodo') or periodo.nombre.startswith('Trimestre'):
                    periodo.nombre = nombre_esperado
            else:
                nuevo_periodo = Bimestre(
                    nombre=f'{config.tipo_periodo} {orden}',
                    anio=config.anio_academico,
                    orden=orden
                )
                db.session.add(nuevo_periodo)

    @classmethod
    def verificar_compatibilidad_cambio(
        cls,
        anio: int,
        nuevo_indicadores: int,
        nuevo_notas: int,
        nueva_escala_min: float,
        nueva_escala_max: float
    ) -> dict:
        """
        Analiza si un cambio en la configuración para un año compromete calificaciones existentes.
        """
        conflictos = []

        # Obtener bimestres del año
        bimestres_anio = Bimestre.query.filter_by(anio=anio).all()
        bimestre_ids = [b.id for b in bimestres_anio]

        if not bimestre_ids:
            return {'compatible': True, 'conflictos': []}

        # 1. Indicadores que exceden el nuevo límite
        indicadores_excedentes = IndicadorLogro.query.filter(
            IndicadorLogro.bimestre_id.in_(bimestre_ids),
            IndicadorLogro.numero > nuevo_indicadores
        ).count()
        if indicadores_excedentes > 0:
            conflictos.append(f'Existen {indicadores_excedentes} indicadores definidos con número superior a {nuevo_indicadores}')

        # 2. Notas parciales que exceden el nuevo número de notas
        indicadores_todos = IndicadorLogro.query.filter(IndicadorLogro.bimestre_id.in_(bimestre_ids)).all()
        ind_ids = [i.id for i in indicadores_todos]

        if ind_ids:
            notas_excedentes = CalificacionBimestre.query.filter(
                CalificacionBimestre.indicador_id.in_(ind_ids),
                CalificacionBimestre.numero_nota > nuevo_notas
            ).count()
            if notas_excedentes > 0:
                conflictos.append(f'Existen {notas_excedentes} calificaciones con número de nota superior a {nuevo_notas}')

            # 3. Notas fuera de la nueva escala
            notas_fuera_rango = CalificacionBimestre.query.filter(
                CalificacionBimestre.indicador_id.in_(ind_ids),
                db.or_(
                    CalificacionBimestre.nota < nueva_escala_min,
                    CalificacionBimestre.nota > nueva_escala_max
                )
            ).count()
            if notas_fuera_rango > 0:
                conflictos.append(f'Existen {notas_fuera_rango} calificaciones registradas fuera del nuevo rango ({nueva_escala_min} - {nueva_escala_max})')

        return {
            'compatible': len(conflictos) == 0,
            'conflictos': conflictos
        }

    @classmethod
    def validar_nota_parcial(cls, anio: int, numero_nota: int, valor_nota: float) -> tuple[bool, str | None]:
        """Valida que una nota parcial respete la configuración vigente del año correspondiente."""
        config = cls.get_por_anio(anio) or cls.get_or_create_default(anio)
        if numero_nota < 1 or numero_nota > config.notas_por_indicador:
            return False, f'numero_nota ({numero_nota}) inválido. La configuración permite de 1 a {config.notas_por_indicador}.'
        
        min_e = float(config.escala_minima)
        max_e = float(config.escala_maxima)
        if not (min_e <= valor_nota <= max_e):
            return False, f'Nota {valor_nota} fuera del rango configurado ({min_e} – {max_e}).'
        
        return True, None

    @classmethod
    def validar_numero_indicador(cls, anio: int, numero_indicador: int) -> tuple[bool, str | None]:
        """Valida que el número de indicador respete la configuración vigente del año correspondiente."""
        config = cls.get_por_anio(anio) or cls.get_or_create_default(anio)
        if numero_indicador < 1 or numero_indicador > config.indicadores_por_periodo:
            return False, f'Número de indicador ({numero_indicador}) excede el máximo permitido ({config.indicadores_por_periodo}) para el año {anio}.'
        return True, None
