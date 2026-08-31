from src.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from sqlalchemy.orm import validates


# Tabla asociativa para relación de familias y múltiples estudiantes
familia_estudiante = db.Table(
    'familia_estudiante',
    db.Column('id', db.Integer, primary_key=True),
    db.Column('familia_id', db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False),
    db.Column('estudiante_id', db.Integer, db.ForeignKey('estudiantes.id', ondelete='CASCADE'), nullable=False),
    db.UniqueConstraint('familia_id', 'estudiante_id', name='uq_familia_estudiante')
)


class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.Enum('docente', 'familia', 'admin'), nullable=False)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('estudiantes.id'), nullable=True)
    activo = db.Column(db.Boolean, default=True, nullable=False)
    eliminado = db.Column(db.Boolean, default=False, nullable=False)
    fecha_eliminacion = db.Column(db.DateTime, nullable=True)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relación legacy con estudiante (para familias)
    estudiante = db.relationship('Estudiante', backref='familia', foreign_keys=[estudiante_id])
    
    # Relación Many-to-Many con múltiples estudiantes (para familias con múltiples hermanos)
    estudiantes = db.relationship(
        'Estudiante',
        secondary=familia_estudiante,
        backref=db.backref('familias', lazy='dynamic')
    )
    def __init__(self, **kwargs):
        super(Usuario, self).__init__(**kwargs)

    def __repr__(self):
        return f'<Usuario {self.email}>'
    
    @validates('password')
    def validate_password(self, key, password):
        """Asegurar que la contraseña guardada siempre esté correctamente hasheada"""
        if not password:
            raise ValueError("La contraseña no puede estar vacía.")
        if not str(password).startswith(('scrypt:', 'pbkdf2:sha256:')):
            return generate_password_hash(password)
        return password

    def set_password(self, password):
        """Hashear la contraseña de forma segura"""
        self.password = password  # Será interceptada por el validador
    
    def check_password(self, password):
        """Verificar contraseña de forma segura usando check_password_hash"""
        if not self.password:
            return False
        return check_password_hash(self.password, password)
    
    def to_dict(self):
        def _format_dt(dt):
            if not dt:
                return None
            if isinstance(dt, str):
                return dt
            if hasattr(dt, 'isoformat'):
                return dt.isoformat()
            return str(dt)

        data = {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'rol': self.rol,
            'estudiante_id': self.estudiante_id,
            'activo': self.activo,
            'eliminado': self.eliminado,
            'fecha_eliminacion': _format_dt(self.fecha_eliminacion),
            'fecha_registro': _format_dt(self.fecha_registro)
        }

        if self.estudiante:
            data['estudiante'] = self.estudiante.to_dict()
            data['estudiante_nombre'] = self.estudiante.nombre
            data['estudiante_curso'] = self.estudiante.curso.to_dict() if self.estudiante.curso else None
        else:
            data['estudiante'] = None
            data['estudiante_nombre'] = None
            data['estudiante_curso'] = None

        # Serializar la lista de múltiples estudiantes asociados
        data['estudiantes'] = []
        if self.estudiantes:
            for est in self.estudiantes:
                est_dict = est.to_dict()
                if est.curso:
                    est_dict['curso'] = est.curso.to_dict()
                else:
                    est_dict['curso'] = None
                data['estudiantes'].append(est_dict)

        # Serializar asignaciones académicas si es docente
        if self.rol == 'docente' and hasattr(self, 'asignaciones_academicas') and self.asignaciones_academicas:
            data['asignaciones'] = [a.to_dict() for a in self.asignaciones_academicas]
            materias = [a.materia_nombre for a in self.asignaciones_academicas if a.materia_nombre]
            materias_unicas = list(dict.fromkeys(materias))
            cursos_unicos = list(dict.fromkeys([
                f"{a.curso_nivel}{a.curso_letra}" if a.curso_nivel and a.curso_letra else (a.curso_nombre or '')
                for a in self.asignaciones_academicas if a.curso_nombre or a.curso_nivel
            ]))
            data['materias'] = materias_unicas
            data['cursos'] = [c for c in cursos_unicos if c]
            data['materia_principal'] = materias_unicas[0] if materias_unicas else None
            data['curso_principal'] = data['cursos'][0] if data['cursos'] else None

        return data
