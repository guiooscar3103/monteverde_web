from src.extensions import db
from datetime import datetime

class Circular(db.Model):
    __tablename__ = 'circulares'
    
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(150), nullable=False)
    contenido = db.Column(db.Text, nullable=False)
    fecha_publicacion = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    autor_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    
    # Relación
    autor = db.relationship('Usuario', backref='circulares_autoras')
    
    def __repr__(self):
        return f'<Circular {self.id}: {self.titulo}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'titulo': self.titulo,
            'contenido': self.contenido,
            'fecha_publicacion': self.fecha_publicacion.isoformat() if self.fecha_publicacion else None,
            'autor_id': self.autor_id,
            'autor_nombre': self.autor.nombre if self.autor else 'Administrador'
        }
