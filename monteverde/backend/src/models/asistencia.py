from src.extensions import db
from datetime import date

# Modelo para registrar la asistencia de estudiantes en cursos
class Asistencia(db.Model):
    # Nombre de la tabla en la base de datos
    __tablename__ = 'asistencia'
    
    # Identificador único de la asistencia
    id = db.Column(db.Integer, primary_key=True)
    # ID del estudiante al que se le registra la asistencia
    estudiante_id = db.Column(db.Integer, db.ForeignKey('estudiantes.id'), nullable=False)
    # Fecha de la asistencia
    fecha = db.Column(db.Date, nullable=False)
    # Estado de la asistencia: PRESENTE, AUSENTE, TARDE o JUSTIFICADO
    estado = db.Column(db.Enum('PRESENTE', 'AUSENTE', 'TARDE', 'JUSTIFICADO'), nullable=False)
    
    # Convierte el modelo a diccionario para serialización JSON

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
            'fecha': self._fmt(self.fecha),
            'estado': self.estado
        }
