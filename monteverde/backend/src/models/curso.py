import re
from src.extensions import db

class Curso(db.Model):
    __tablename__ = 'cursos'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    nivel = db.Column(db.String(10), nullable=False)
    letra = db.Column(db.String(10), nullable=False)
    descripcion = db.Column(db.String(255), nullable=True)
    
    def __init__(self, nombre=None, nivel=None, letra=None, descripcion=None, id=None):
        if id is not None:
            self.id = id
        self.nombre = nombre
        self.nivel = nivel
        self.letra = letra
        self.descripcion = descripcion

    def __repr__(self):
        return f'<Curso {self.nombre}>'
    
    def to_dict(self, include_materias=True):
        grado = f"{self.nivel}{self.letra}" if self.letra else self.nivel
        data = {
            'id': self.id,
            'nombre': self.nombre,
            'nombre_curso': self.nombre,
            'nivel': self.nivel,
            'letra': self.letra,
            'grado': grado,
            'descripcion': self.descripcion
        }
        if include_materias:
            try:
                # Obtener materias activas asociadas al curso
                materias_asociadas = [
                    cm.materia.to_dict()
                    for cm in getattr(self, 'curso_materias', [])
                    if cm.activo and cm.materia and cm.materia.activo
                ]
                data['materias'] = materias_asociadas
                data['materias_count'] = len(materias_asociadas)
            except Exception:
                data['materias'] = []
                data['materias_count'] = 0
        return data

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
