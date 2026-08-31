from datetime import datetime
from src.extensions import db

class ConfiguracionInstitucional(db.Model):
    __tablename__ = 'configuracion_institucional'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    institucion_id = db.Column(db.String(50), nullable=False, default='MONTEVERDE_DEFAULT', unique=True, index=True)
    nombre_institucion = db.Column(db.String(150), nullable=False, default='Colegio MonteVerde')
    director = db.Column(db.String(150), nullable=False, default='Fernando MonteVerde')
    anio_escolar = db.Column(db.String(20), nullable=False, default='2026')
    periodo_actual = db.Column(db.String(50), nullable=False, default='Primer Trimestre')
    direccion = db.Column(db.String(255), nullable=True, default='Calle de la Arboleda #45, Ciudad Jardín')
    telefono = db.Column(db.String(50), nullable=True, default='+57 (601) 456-7890')
    email_contacto = db.Column(db.String(150), nullable=True, default='contacto@monteverde.edu.co')
    activa = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    usuario_actualizo_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='SET NULL'), nullable=True)

    # Relación opcional con el usuario que realizó la última actualización
    usuario_actualizo = db.relationship('Usuario', foreign_keys=[usuario_actualizo_id], lazy='joined')

    def __init__(self, **kwargs):
        super(ConfiguracionInstitucional, self).__init__(**kwargs)

    def __repr__(self):
        return f'<ConfiguracionInstitucional {self.nombre_institucion} ({self.anio_escolar})>'


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
            'institucion_id': self.institucion_id,
            'nombre_institucion': self.nombre_institucion,
            'director': self.director,
            'anio_escolar': self.anio_escolar,
            'periodo_actual': self.periodo_actual,
            'direccion': self.direccion or '',
            'telefono': self.telefono or '',
            'email_contacto': self.email_contacto or '',
            'activa': self.activa,
            'created_at': self._fmt(self.created_at),
            'updated_at': self._fmt(self.updated_at),
            'usuario_actualizo_id': self.usuario_actualizo_id
        }
