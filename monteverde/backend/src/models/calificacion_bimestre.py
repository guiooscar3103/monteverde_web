from src.extensions import db
from datetime import datetime

class CalificacionBimestre(db.Model):
    """
    Nota parcial de un estudiante para un indicador de logro.
    Cada indicador tiene exactamente 3 notas parciales (numero_nota = 1, 2 o 3).
    Opcionalmente se asocia a la tarea_id que originó la calificación.
    """
    __tablename__ = 'calificaciones_bimestre'

    id           = db.Column(db.Integer, primary_key=True)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('estudiantes.id', ondelete='CASCADE'), nullable=False)
    docente_id   = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    indicador_id = db.Column(db.Integer, db.ForeignKey('indicadores_logro.id', ondelete='CASCADE'), nullable=False)
    # 1, 2 o 3 — posición de la nota dentro del indicador
    numero_nota  = db.Column(db.Integer, nullable=False)
    nota         = db.Column(db.Numeric(3, 2), nullable=False)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tarea_id     = db.Column(db.Integer, db.ForeignKey('tareas.id', ondelete='SET NULL'), nullable=True)

    __table_args__ = (
        db.UniqueConstraint(
            'estudiante_id', 'indicador_id', 'numero_nota',
            name='uq_calif_bimestre_estudiante_indicador_nota'
        ),
        db.CheckConstraint('numero_nota IN (1, 2, 3)', name='ck_numero_nota'),
        db.CheckConstraint('nota >= 0.00 AND nota <= 5.00', name='ck_nota_rango'),
        db.Index('idx_calif_bimestre_tarea', 'tarea_id'),
    )

    # Relaciones
    estudiante = db.relationship('Estudiante', backref=db.backref('calificaciones_bimestre', lazy=True))
    docente    = db.relationship('Usuario',    backref=db.backref('calificaciones_bimestre', lazy=True))
    tarea      = db.relationship('Tarea',      backref=db.backref('calificaciones_bimestre_generadas', lazy=True))

    def __repr__(self):
        return f'<CalificacionBimestre est={self.estudiante_id} ind={self.indicador_id} n={self.numero_nota} nota={self.nota} tarea={self.tarea_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'estudiante_id': self.estudiante_id,
            'docente_id': self.docente_id,
            'indicador_id': self.indicador_id,
            'numero_nota': self.numero_nota,
            'nota': float(self.nota),
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None,
            'tarea_id': self.tarea_id,
        }
