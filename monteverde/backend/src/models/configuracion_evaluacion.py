from datetime import datetime
from src.extensions import db

class ConfiguracionEvaluacion(db.Model):
    """
    Configuración académica persistente del sistema de evaluación por año escolar.
    Permite definir la estructura de periodos, cantidad de indicadores, notas parciales,
    escala de calificación y nota mínima aprobatoria de forma completamente configurable.
    """
    __tablename__ = 'configuracion_evaluacion'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    anio_academico = db.Column(db.Integer, nullable=False, unique=True, index=True)
    nombre = db.Column(db.String(150), nullable=False, default='Configuración Académica Estándar')
    tipo_periodo = db.Column(db.String(50), nullable=False, default='Bimestre')
    numero_periodos = db.Column(db.Integer, nullable=False, default=4)
    indicadores_por_periodo = db.Column(db.Integer, nullable=False, default=2)
    notas_por_indicador = db.Column(db.Integer, nullable=False, default=3)
    tipo_escala = db.Column(db.String(50), nullable=False, default='NUMERICA_CINCO')  # NUMERICA_CINCO, NUMERICA_CIEN, PERSONALIZADA, PORCENTAJE
    escala_minima = db.Column(db.Numeric(5, 2), nullable=False, default=1.00)
    escala_maxima = db.Column(db.Numeric(5, 2), nullable=False, default=5.00)
    nota_aprobatoria = db.Column(db.Numeric(5, 2), nullable=False, default=3.00)
    activa = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    usuario_actualizo_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='SET NULL'), nullable=True)

    # Relación de auditoría
    usuario_actualizo = db.relationship('Usuario', foreign_keys=[usuario_actualizo_id], lazy='joined')

    def __repr__(self):
        return f'<ConfiguracionEvaluacion anio={self.anio_academico} {self.numero_periodos}P x {self.indicadores_por_periodo}I x {self.notas_por_indicador}N ({self.escala_minima}-{self.escala_maxima})>'


    @staticmethod
    def _fmt(dt):
        """Safely serialize a datetime field that may arrive as str or datetime."""
        if not dt:
            return None
        if isinstance(dt, str):
            return dt
        if hasattr(dt, 'isoformat'):
            return dt.isoformat()
        return str(dt)

    def to_dict(self):
        return {
            'id': self.id,
            'anio_academico': self.anio_academico,
            'nombre': self.nombre,
            'tipo_periodo': self.tipo_periodo,
            'numero_periodos': self.numero_periodos,
            'indicadores_por_periodo': self.indicadores_por_periodo,
            'notas_por_indicador': self.notas_por_indicador,
            'tipo_escala': self.tipo_escala,
            'escala_minima': float(self.escala_minima),
            'escala_maxima': float(self.escala_maxima),
            'nota_aprobatoria': float(self.nota_aprobatoria),
            'activa': self.activa,
            'created_at': self._fmt(self.created_at),
            'updated_at': self._fmt(self.updated_at),
            'usuario_actualizo_id': self.usuario_actualizo_id,
            'estructura': self.estructura()
        }

    def estructura(self):
        """Retorna la definición de la estructura para construcción dinámica en backend y frontend."""
        return {
            'anio': self.anio_academico,
            'tipo_periodo': self.tipo_periodo,
            'numero_periodos': self.numero_periodos,
            'indicadores_por_periodo': self.indicadores_por_periodo,
            'notas_por_indicador': self.notas_por_indicador,
            'escala': {
                'tipo': self.tipo_escala,
                'min': float(self.escala_minima),
                'max': float(self.escala_maxima),
                'aprobacion': float(self.nota_aprobatoria),
            }
        }
