from src.extensions import db
from datetime import datetime

class Entrega(db.Model):
    """
    Modelo persistente de Entregas de Tareas por parte de los estudiantes.
    Representa el estado, fecha y calificación de la entrega de un estudiante.
    """
    __tablename__ = 'entregas'

    id = db.Column(db.Integer, primary_key=True)
    tarea_id = db.Column(db.Integer, db.ForeignKey('tareas.id', ondelete='CASCADE'), nullable=False)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('estudiantes.id', ondelete='CASCADE'), nullable=False)
    fecha_entrega = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    archivo_url = db.Column(db.String(255), nullable=True)
    contenido = db.Column(db.Text, nullable=True)
    estado = db.Column(db.String(20), default='PENDIENTE', nullable=False)
    calificacion = db.Column(db.Numeric(5, 2), nullable=True)
    comentarios = db.Column(db.Text, nullable=True)

    __table_args__ = (
        db.UniqueConstraint('tarea_id', 'estudiante_id', name='uq_tarea_estudiante'),
        db.CheckConstraint("estado IN ('PENDIENTE', 'ENTREGADA', 'CALIFICADA')", name='ck_entrega_estado'),
        db.CheckConstraint("calificacion IS NULL OR calificacion >= 0.00", name='ck_entrega_calificacion_no_negativa'),
        db.Index('idx_entrega_tarea_estudiante', 'tarea_id', 'estudiante_id'),
        db.Index('idx_entrega_estado', 'estado'),
    )

    # Relaciones
    estudiante = db.relationship('Estudiante', backref=db.backref('entregas', lazy=True))

    def __repr__(self):
        return f'<Entrega #{self.id} tarea={self.tarea_id} est={self.estudiante_id} estado={self.estado}>'


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
            'tarea_id': self.tarea_id,
            'estudiante_id': self.estudiante_id,
            'estudiante_nombre': self.estudiante.nombre if self.estudiante else None,
            'fecha_entrega': self._fmt(self.fecha_entrega),
            'archivo_url': self.archivo_url,
            'contenido': self.contenido,
            'estado': self.estado,
            'calificacion': float(self.calificacion) if self.calificacion is not None else None,
            'comentarios': self.comentarios
        }
