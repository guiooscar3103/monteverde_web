from src.extensions import db
from datetime import datetime

class ConversacionArchivada(db.Model):
    __tablename__ = 'conversaciones_archivadas'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    contacto_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    fecha_archivado = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint('usuario_id', 'contacto_id', name='uq_usuario_contacto_archivado'),
    )

    # Relaciones
    usuario = db.relationship('Usuario', foreign_keys=[usuario_id], backref='conversaciones_archivadas')
    contacto = db.relationship('Usuario', foreign_keys=[contacto_id])

    def __repr__(self):
        return f'<ConversacionArchivada {self.id}: usuario={self.usuario_id} contacto={self.contacto_id}>'


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
            'usuario_id': self.usuario_id,
            'contacto_id': self.contacto_id,
            'fecha_archivado': self._fmt(self.fecha_archivado)
        }
