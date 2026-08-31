from src.extensions import db
from datetime import datetime

class IndicadorLogro(db.Model):
    """
    Indicador de logro definido por un docente para una combinación
    específica de curso + materia + bimestre/periodo.
    La cantidad máxima de indicadores permitidos por periodo se determina
    dinámicamente por la configuración académica del año correspondiente.
    """
    __tablename__ = 'indicadores_logro'

    id          = db.Column(db.Integer, primary_key=True)
    docente_id  = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    curso_id    = db.Column(db.Integer, db.ForeignKey('cursos.id', ondelete='CASCADE'), nullable=False)
    materia_id  = db.Column(db.Integer, db.ForeignKey('materias.id', ondelete='CASCADE'), nullable=False)
    bimestre_id = db.Column(db.Integer, db.ForeignKey('bimestres_config.id', ondelete='CASCADE'), nullable=False)
    # Posición del indicador (1, 2, ... N según configuración académica)
    numero      = db.Column(db.Integer, nullable=False)
    descripcion = db.Column(db.String(500), nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint(
            'docente_id', 'curso_id', 'materia_id', 'bimestre_id', 'numero',
            name='uq_indicador_docente_curso_materia_bimestre_num'
        ),
        db.CheckConstraint('numero > 0', name='ck_indicador_numero_positivo'),
    )

    # Relaciones para acceder a nombres con propiedades
    docente  = db.relationship('Usuario', backref=db.backref('indicadores_logro', lazy=True))
    curso    = db.relationship('Curso',   backref=db.backref('indicadores_logro', lazy=True))
    materia  = db.relationship('Materia', backref=db.backref('indicadores_logro', lazy=True))
    bimestre = db.relationship('Bimestre', backref=db.backref('indicadores_logro', lazy=True))

    # Relación con notas parciales (cascade para eliminar al cambiar indicador)
    notas_parciales = db.relationship(
        'CalificacionBimestre',
        backref='indicador',
        lazy=True,
        cascade='all, delete-orphan'
    )

    def __repr__(self):
        return f'<IndicadorLogro #{self.numero} curso={self.curso_id} materia={self.materia_id}>'


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
            'docente_id': self.docente_id,
            'curso_id': self.curso_id,
            'materia_id': self.materia_id,
            'bimestre_id': self.bimestre_id,
            'numero': self.numero,
            'descripcion': self.descripcion,
            'fecha_creacion': self._fmt(self.fecha_creacion),
        }
