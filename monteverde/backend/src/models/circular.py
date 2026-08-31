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
            'titulo': self.titulo,
            'contenido': self.contenido,
            'fecha_publicacion': self._fmt(self.fecha_publicacion),
            'autor_id': self.autor_id,
            'autor_nombre': self.autor.nombre if self.autor else 'Administrador'
        }
