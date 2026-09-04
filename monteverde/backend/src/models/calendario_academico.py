from datetime import datetime
from src.extensions import db

class CalendarioAcademico(db.Model):
    """
    Representa el calendario institucional de un año lectivo.
    Controla los periodos bimestrales, fechas institucionales y su vigencia.
    """
    __tablename__ = 'calendarios_academicos'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    anio = db.Column(db.Integer, nullable=False, unique=True, index=True)
    nombre = db.Column(db.String(100), nullable=False, default='Calendario Académico')
    fecha_inicio = db.Column(db.Date, nullable=True)
    fecha_fin = db.Column(db.Date, nullable=True)
    estado = db.Column(db.String(30), nullable=False, default='EN_CURSO')  # PLANIFICACION, EN_CURSO, CERRADO
    descripcion = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relación con los periodos lectivos / bimestres
    periodos = db.relationship(
        'Bimestre',
        backref=db.backref('calendario', lazy='joined'),
        lazy='joined',
        order_by='Bimestre.orden',
        cascade='all, delete-orphan'
    )

    def __repr__(self):
        return f'<CalendarioAcademico anio={self.anio} estado={self.estado}>'

    @staticmethod
    def _fmt(dt):
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
            'anio': self.anio,
            'nombre': self.nombre,
            'fecha_inicio': self._fmt(self.fecha_inicio),
            'fecha_fin': self._fmt(self.fecha_fin),
            'estado': self.estado,
            'descripcion': self.descripcion or '',
            'periodos': [p.to_dict() for p in (self.periodos or [])],
            'created_at': self._fmt(self.created_at),
            'updated_at': self._fmt(self.updated_at)
        }
