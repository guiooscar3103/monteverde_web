from src.extensions import db
from datetime import datetime

class Mensaje(db.Model):
    __tablename__ = 'mensajes'
    
    id = db.Column(db.Integer, primary_key=True)
    emisor_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    receptor_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    asunto = db.Column(db.String(100), nullable=False)
    cuerpo = db.Column(db.Text, nullable=False)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    leido = db.Column(db.Boolean, default=False)
    
    # Retractación / Eliminación lógica
    eliminado = db.Column(db.Boolean, default=False, nullable=False)
    fecha_eliminacion = db.Column(db.DateTime, nullable=True)
    
    # Relaciones
    emisor = db.relationship('Usuario', foreign_keys=[emisor_id], backref='mensajes_enviados')
    receptor = db.relationship('Usuario', foreign_keys=[receptor_id], backref='mensajes_recibidos')
    
    def __repr__(self):
        return f'<Mensaje {self.id}: {self.asunto} (eliminado={self.eliminado})>'
    

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
        cuerpo_mostrar = '🚫 Este mensaje fue eliminado por su remitente.' if self.eliminado else self.cuerpo
        return {
            'id': self.id,
            'emisor_id': self.emisor_id,
            'emisorId': self.emisor_id,
            'receptor_id': self.receptor_id,
            'receptorId': self.receptor_id,
            'asunto': self.asunto,
            'cuerpo': cuerpo_mostrar,
            'fecha': self._fmt(self.fecha),
            'leido': self.leido,
            'eliminado': bool(self.eliminado),
            'fecha_eliminacion': self._fmt(self.fecha_eliminacion)
        }
