from src.extensions import db
from datetime import datetime

class IndicadorLogro(db.Model):
    """
    Indicador de logro definido por un docente para una combinación
    específica de curso + materia + bimestre.
    Cada bimestre tiene exactamente 2 indicadores (numero = 1 o 2).
    """
    __tablename__ = 'indicadores_logro'

    id          = db.Column(db.Integer, primary_key=True)
    docente_id  = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    curso_id    = db.Column(db.Integer, db.ForeignKey('cursos.id', ondelete='CASCADE'), nullable=False)
    materia_id  = db.Column(db.Integer, db.ForeignKey('materias.id', ondelete='CASCADE'), nullable=False)
    bimestre_id = db.Column(db.Integer, db.ForeignKey('bimestres_config.id', ondelete='CASCADE'), nullable=False)
    # 1 = primer indicador, 2 = segundo indicador
    numero      = db.Column(db.Integer, nullable=False)
    descripcion = db.Column(db.String(500), nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint(
            'docente_id', 'curso_id', 'materia_id', 'bimestre_id', 'numero',
            name='uq_indicador_docente_curso_materia_bimestre_num'
        ),
        db.CheckConstraint('numero IN (1, 2)', name='ck_indicador_numero'),
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

    def to_dict(self):
        return {
            'id': self.id,
            'docente_id': self.docente_id,
            'curso_id': self.curso_id,
            'materia_id': self.materia_id,
            'bimestre_id': self.bimestre_id,
            'numero': self.numero,
            'descripcion': self.descripcion,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
        }
