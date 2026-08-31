from src.extensions import db
from datetime import datetime

class Observacion(db.Model):
    __tablename__ = 'observaciones'
    
    id = db.Column(db.Integer, primary_key=True)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('estudiantes.id'), nullable=False)
    docente_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    fecha = db.Column(db.Date, nullable=False)
    # ✅ VERIFICAR que estos valores coincidan con tu BD:
    tipo = db.Column(db.Enum('POSITIVA', 'NEGATIVA', 'NEUTRAL'), nullable=False)  # O los valores que tengas
    detalle = db.Column(db.Text, nullable=False)
    
    # Relaciones
    docente = db.relationship('Usuario', backref='observaciones_creadas')
    
    def __repr__(self):
        return f'<Observacion {self.estudiante_id} - {self.tipo}>'
    

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
            'docente_id': self.docente_id,
            'fecha': self._fmt(self.fecha),
            'tipo': self.tipo,
            'detalle': self.detalle
        }
