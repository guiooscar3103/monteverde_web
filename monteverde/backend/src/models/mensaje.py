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
    
    # Relaciones
    emisor = db.relationship('Usuario', foreign_keys=[emisor_id], backref='mensajes_enviados')
    receptor = db.relationship('Usuario', foreign_keys=[receptor_id], backref='mensajes_recibidos')
    
    def __repr__(self):
        return f'<Mensaje {self.id}: {self.asunto}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'emisor_id': self.emisor_id,
            'receptor_id': self.receptor_id,
            'asunto': self.asunto,
            'cuerpo': self.cuerpo,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'leido': self.leido
        }
