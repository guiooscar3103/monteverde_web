from src.extensions import db

class DocenteCurso(db.Model):
    __tablename__ = 'docente_curso'
    
    id = db.Column(db.Integer, primary_key=True)
    docente_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    curso_id = db.Column(db.Integer, db.ForeignKey('cursos.id', ondelete='CASCADE'), nullable=False)
    
    # Relationships
    docente = db.relationship('Usuario', backref=db.backref('asignaciones_curso', lazy=True, cascade="all, delete-orphan"))
    curso = db.relationship('Curso', backref=db.backref('asignaciones_docente', lazy=True, cascade="all, delete-orphan"))
    
    def to_dict(self):
        return {
            'id': self.id,
            'docente_id': self.docente_id,
            'docente_nombre': self.docente.nombre if self.docente else 'Docente',
            'curso_id': self.curso_id,
            'curso_nombre': self.curso.nombre if self.curso else 'Curso',
            'nivel': self.curso.nivel if self.curso else '',
            'letra': self.curso.letra if self.curso else ''
        }
