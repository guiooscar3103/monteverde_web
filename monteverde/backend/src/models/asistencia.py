from src.extensions import db
from datetime import date

class Asistencia(db.Model):
    __tablename__ = 'asistencia'
    
    id = db.Column(db.Integer, primary_key=True)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('estudiantes.id'), nullable=False)
    fecha = db.Column(db.Date, nullable=False)
    estado = db.Column(db.Enum('PRESENTE', 'AUSENTE', 'TARDE', 'JUSTIFICADO'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'estudiante_id': self.estudiante_id,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'estado': self.estado
        }
