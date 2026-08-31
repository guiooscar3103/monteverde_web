from datetime import datetime
from src.extensions import db

class Materia(db.Model):
    __tablename__ = 'materias'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), unique=True, nullable=False)
    codigo = db.Column(db.String(20), unique=True, nullable=True)
    descripcion = db.Column(db.String(255), nullable=True)
    area = db.Column(db.String(100), nullable=True)
    intensidad_horaria = db.Column(db.Integer, default=0, nullable=False)
    activo = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f'<Materia {self.codigo or self.id}: {self.nombre}>'

    @staticmethod
    def _fmt(dt):
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
            'nombre': self.nombre,
            'codigo': self.codigo or '',
            'descripcion': self.descripcion or '',
            'area': self.area or 'General',
            'intensidad_horaria': self.intensidad_horaria,
            'activo': bool(self.activo),
            'created_at': self._fmt(self.created_at),
            'updated_at': self._fmt(self.updated_at)
        }

