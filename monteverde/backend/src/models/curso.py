import re
from src.extensions import db

class Curso(db.Model):
    __tablename__ = 'cursos'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    nivel = db.Column(db.String(10), nullable=False)
    letra = db.Column(db.String(10), nullable=False)
    descripcion = db.Column(db.String(255), nullable=True)
    
    def __repr__(self):
        return f'<Curso {self.nombre}>'
    
    def to_dict(self):
        grado = f"{self.nivel}{self.letra}" if self.letra else self.nivel
        return {
            'id': self.id,
            'nombre': self.nombre,
            'nombre_curso': self.nombre,
            'nivel': self.nivel,
            'letra': self.letra,
            'grado': grado,
            'descripcion': self.descripcion
        }

    @classmethod
    def parse_grado(cls, grado_value):
        if grado_value is None:
            return None, None
        grado_str = re.sub(r'[^A-Za-z0-9]', '', str(grado_value).strip())
        if not grado_str:
            return None, None

        nivel_part = ''
        letra_part = ''
        for char in grado_str:
            if char.isdigit():
                nivel_part += char
            else:
                letra_part += char

        if nivel_part:
            return nivel_part, letra_part.upper()
        return grado_str, ''
