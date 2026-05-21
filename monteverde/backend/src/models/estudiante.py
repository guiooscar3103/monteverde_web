from src.extensions import db

class Estudiante(db.Model):
    __tablename__ = 'estudiantes'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    curso_id = db.Column(db.Integer, db.ForeignKey('cursos.id'), nullable=False)
    
    # Relaciones
    curso = db.relationship('Curso', backref='estudiantes')
    asistencias = db.relationship('Asistencia', backref='estudiante')
    calificaciones = db.relationship('Calificacion', backref='estudiante')
    observaciones = db.relationship('Observacion', backref='estudiante')
    
    def __repr__(self):
        return f'<Estudiante {self.nombre}>'
    
    def to_dict(self):
        data = {
            'id': self.id,
            'nombre': self.nombre,
            'curso_id': self.curso_id
        }

        if self.curso:
            data['curso'] = self.curso.to_dict()
            data['curso_nombre'] = self.curso.nombre
            data['curso_nivel'] = self.curso.nivel
            data['curso_letra'] = self.curso.letra
        else:
            data['curso'] = None
            data['curso_nombre'] = None
            data['curso_nivel'] = None
            data['curso_letra'] = None

        return data
