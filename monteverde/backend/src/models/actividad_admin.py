from datetime import datetime
from src.extensions import db

class ActividadAdmin(db.Model):
    __tablename__ = 'actividad_admin'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='SET NULL'), nullable=True)
    accion = db.Column(db.String(100), nullable=False)
    detalles = db.Column(db.Text, nullable=True)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to user
    usuario = db.relationship('Usuario', backref=db.backref('actividades_admin', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'usuario_nombre': self.usuario.nombre if self.usuario else 'Sistema',
            'accion': self.accion,
            'detalles': self.detalles,
            'fecha': self.fecha.isoformat() if self.fecha else None
        }
