from src.extensions import db
from datetime import datetime

# Modelo para almacenar las calificaciones de los estudiantes
class Calificacion(db.Model):
    # Nombre de la tabla en la base de datos
    __tablename__ = 'calificaciones'
    
    # Identificador único de la calificación
    id = db.Column(db.Integer, primary_key=True)
    # ID del estudiante al que pertenece la calificación
    estudiante_id = db.Column(db.Integer, db.ForeignKey('estudiantes.id'), nullable=False)
    # Asignatura o materia evaluada
    asignatura = db.Column(db.String(50), nullable=False)
    # Período académico
    periodo = db.Column(db.String(20), nullable=False)
    # Nota obtenida por el estudiante
    nota = db.Column(db.Float, nullable=False)  
    # Fecha y hora en que se registró la calificación
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Representación legible del objeto para depuración
    def __repr__(self):
        return f'<Calificacion {self.estudiante_id} - {self.asignatura}: {self.nota}>'
    
    # Convierte el modelo a diccionario para serialización JSON
    def to_dict(self):
        return {
            'id': self.id,
            'estudiante_id': self.estudiante_id,
            'asignatura': self.asignatura,
            'periodo': self.periodo,
            'nota': self.nota,  
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None
        }
