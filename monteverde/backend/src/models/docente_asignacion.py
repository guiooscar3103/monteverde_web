from src.extensions import db

class DocenteAsignacion(db.Model):
    __tablename__ = 'docente_asignacion'

    id = db.Column(db.Integer, primary_key=True)
    docente_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    curso_id = db.Column(db.Integer, db.ForeignKey('cursos.id', ondelete='CASCADE'), nullable=False)
    materia_id = db.Column(db.Integer, db.ForeignKey('materias.id', ondelete='CASCADE'), nullable=False)

    __table_args__ = (
        db.UniqueConstraint('docente_id', 'curso_id', 'materia_id', name='uq_docente_curso_materia'),
    )

    docente = db.relationship(
        'Usuario',
        backref=db.backref('asignaciones_academicas', lazy=True, cascade='all, delete-orphan')
    )
    curso = db.relationship(
        'Curso',
        backref=db.backref('docente_asignaciones', lazy=True, cascade='all, delete-orphan')
    )
    materia = db.relationship(
        'Materia',
        backref=db.backref('docente_asignaciones', lazy=True, cascade='all, delete-orphan')
    )

    @property
    def curso_nombre(self):
        return self.curso.nombre if self.curso else None

    @property
    def curso_nivel(self):
        return self.curso.nivel if self.curso else None

    @property
    def curso_letra(self):
        return self.curso.letra if self.curso else None

    @property
    def materia_nombre(self):
        return self.materia.nombre if self.materia else None

    @property
    def materia_descripcion(self):
        return self.materia.descripcion if self.materia else None

    def to_dict(self):
        return {
            'id': self.id,
            'docente_id': self.docente_id,
            'curso_id': self.curso_id,
            'curso_nombre': self.curso_nombre,
            'curso_nivel': self.curso_nivel,
            'curso_letra': self.curso_letra,
            'materia_id': self.materia_id,
            'materia_nombre': self.materia_nombre,
            'materia_descripcion': self.materia_descripcion
        }
