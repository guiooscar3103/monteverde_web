from src.extensions import db
from datetime import datetime

class Calificacion(db.Model):
    __tablename__ = 'calificaciones'
    
    id = db.Column(db.Integer, primary_key=True)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('estudiantes.id'), nullable=False)
    asignatura = db.Column(db.String(50), nullable=False)
    periodo = db.Column(db.String(20), nullable=False)
    nota = db.Column(db.Float, nullable=False)  # ← Cambié Decimal por Float
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Calificacion {self.estudiante_id} - {self.asignatura}: {self.nota}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'estudiante_id': self.estudiante_id,
            'asignatura': self.asignatura,
            'periodo': self.periodo,
            'nota': self.nota,  # Ya es float, no necesita conversión
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None
        }
