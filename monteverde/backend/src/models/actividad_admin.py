from datetime import datetime
from src.extensions import db

class ActividadAdmin(db.Model):
    __tablename__ = 'actividad_admin'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='SET NULL'), nullable=True)
    accion = db.Column(db.String(100), nullable=False)
    detalles = db.Column(db.Text, nullable=True)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relación del log de actividad con el usuario
    usuario = db.relationship('Usuario', backref=db.backref('actividades_admin', lazy=True))
    

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
            'usuario_id': self.usuario_id,
            'usuario_nombre': self.usuario.nombre if self.usuario else 'Sistema',
            'accion': self.accion,
            'detalles': self.detalles,
            'fecha': self._fmt(self.fecha)
        }
