from src.extensions import db
from datetime import datetime

class CalificacionBimestre(db.Model):
    """
    Nota parcial de un estudiante para un indicador de logro.
    La cantidad de notas parciales y la escala se determinan dinámicamente
    por la configuración académica vigente para el año correspondiente.
    Opcionalmente se asocia a la tarea_id que originó la calificación.
    """
    __tablename__ = 'calificaciones_bimestre'

    id           = db.Column(db.Integer, primary_key=True)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('estudiantes.id', ondelete='CASCADE'), nullable=False)
    docente_id   = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    indicador_id = db.Column(db.Integer, db.ForeignKey('indicadores_logro.id', ondelete='CASCADE'), nullable=False)
    # Posición de la nota dentro del indicador (1, 2, 3, ... N según configuración)
    numero_nota  = db.Column(db.Integer, nullable=False)
    # Escala configurable (permite valores decimales y hasta 100.00)
    nota         = db.Column(db.Numeric(5, 2), nullable=False)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tarea_id     = db.Column(db.Integer, db.ForeignKey('tareas.id', ondelete='SET NULL'), nullable=True)

    __table_args__ = (
        db.UniqueConstraint(
            'estudiante_id', 'indicador_id', 'numero_nota',
            name='uq_calif_bimestre_estudiante_indicador_nota'
        ),
        db.CheckConstraint('numero_nota > 0', name='ck_numero_nota_positivo'),
        db.CheckConstraint('nota >= 0.00', name='ck_nota_no_negativa'),
        db.Index('idx_calif_bimestre_tarea', 'tarea_id'),
    )

    # Relaciones
    estudiante = db.relationship('Estudiante', backref=db.backref('calificaciones_bimestre', lazy=True))
    docente    = db.relationship('Usuario',    backref=db.backref('calificaciones_bimestre', lazy=True))
    tarea      = db.relationship('Tarea',      backref=db.backref('calificaciones_bimestre_generadas', lazy=True))

    def __repr__(self):
        return f'<CalificacionBimestre est={self.estudiante_id} ind={self.indicador_id} n={self.numero_nota} nota={self.nota} tarea={self.tarea_id}>'


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
            'estudiante_id': self.estudiante_id,
            'docente_id': self.docente_id,
            'indicador_id': self.indicador_id,
            'numero_nota': self.numero_nota,
            'nota': float(self.nota),
            'fecha_registro': self._fmt(self.fecha_registro),
            'tarea_id': self.tarea_id,
        }
