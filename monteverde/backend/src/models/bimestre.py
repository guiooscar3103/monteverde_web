from datetime import datetime, date
from src.extensions import db

class Bimestre(db.Model):
    """
    Representa un periodo lectivo o bimestre académico del año escolar.
    Enriquece la configuración del periodo con fechas de vigencia y bloqueo de calificaciones.
    """
    __tablename__ = 'bimestres_config'

    id = db.Column(db.Integer, primary_key=True)
    calendario_id = db.Column(db.Integer, db.ForeignKey('calendarios_academicos.id', ondelete='SET NULL'), nullable=True)
    nombre = db.Column(db.String(50), nullable=False)
    anio = db.Column(db.Integer, nullable=False)
    orden = db.Column(db.Integer, nullable=False)
    fecha_inicio = db.Column(db.Date, nullable=True)
    fecha_fin = db.Column(db.Date, nullable=True)
    fecha_cierre_calificaciones = db.Column(db.Date, nullable=True)
    estado = db.Column(db.String(20), nullable=False, default='ABIERTO')  # ABIERTO, CERRADO

    __table_args__ = (
        db.UniqueConstraint('anio', 'orden', name='uq_bimestre_anio_orden'),
    )

    def __repr__(self):
        return f'<PeriodoLectivo/Bimestre {self.nombre} {self.anio} [{self.estado}]>'

    def permite_calificaciones(self):
        """
        Retorna True si el periodo está explícitamente ABIERTO y no ha superado
        la fecha de cierre definida por el Coordinador.
        """
        if (self.estado or 'ABIERTO').strip().upper() != 'ABIERTO':
            return False
        if self.fecha_cierre_calificaciones:
            limite = self.fecha_cierre_calificaciones
            if hasattr(limite, 'date'):
                limite = limite.date()
            if date.today() > limite:
                return False
        return True

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
            'calendario_id': self.calendario_id,
            'nombre': self.nombre,
            'anio': self.anio,
            'orden': self.orden,
            'fecha_inicio': self._fmt(self.fecha_inicio),
            'fecha_fin': self._fmt(self.fecha_fin),
            'fecha_cierre_calificaciones': self._fmt(self.fecha_cierre_calificaciones),
            'estado': (self.estado or 'ABIERTO').upper(),
            'permite_calificaciones': self.permite_calificaciones()
        }

# Alias para uso del nuevo dominio curricular
PeriodoLectivo = Bimestre
