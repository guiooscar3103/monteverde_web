from datetime import datetime
from src.extensions import db

class CursoMateria(db.Model):
    __tablename__ = 'curso_materia'

    id = db.Column(db.Integer, primary_key=True)
    curso_id = db.Column(db.Integer, db.ForeignKey('cursos.id', ondelete='CASCADE'), nullable=False)
    materia_id = db.Column(db.Integer, db.ForeignKey('materias.id', ondelete='CASCADE'), nullable=False)
    intensidad_horaria = db.Column(db.Integer, nullable=True)
    activo = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint('curso_id', 'materia_id', name='uq_curso_materia'),
    )

    curso = db.relationship('Curso', backref=db.backref('curso_materias', lazy=True, cascade='all, delete-orphan'))
    materia = db.relationship('Materia', backref=db.backref('curso_materias', lazy=True, cascade='all, delete-orphan'))

    def __repr__(self):
        return f'<CursoMateria Curso:{self.curso_id} Materia:{self.materia_id}>'


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
            'curso_id': self.curso_id,
            'materia_id': self.materia_id,
            'materia_nombre': self.materia.nombre if self.materia else '',
            'materia_codigo': self.materia.codigo if self.materia else '',
            'materia_area': self.materia.area if self.materia else '',
            'intensidad_horaria': self.intensidad_horaria if self.intensidad_horaria is not None else (self.materia.intensidad_horaria if self.materia else 0),
            'activo': bool(self.activo),
            'created_at': self._fmt(self.created_at)
        }
