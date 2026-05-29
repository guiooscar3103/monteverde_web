from src.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime


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
    
    def __repr__(self):
        return f'<Usuario {self.email}>'
    
    def set_password(self, password):
        """Hashear la contraseña de forma segura"""
        self.password = generate_password_hash(password)
    
    def check_password(self, password):
        """Verificar contraseña (soporta hash y texto plano para compatibilidad)"""
        if str(self.password).startswith(('scrypt:', 'pbkdf2:sha256:')):
            return check_password_hash(self.password, password)
        return str(self.password) == str(password)
    
    def to_dict(self):
        data = {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'rol': self.rol,
            'estudiante_id': self.estudiante_id,
            'activo': self.activo,
            'eliminado': self.eliminado,
            'fecha_eliminacion': self.fecha_eliminacion.isoformat() if self.fecha_eliminacion else None,
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None
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

        return data
