from src.extensions import db

class Bimestre(db.Model):
    """Representa un bimestre académico del año escolar."""
    __tablename__ = 'bimestres_config'

    id    = db.Column(db.Integer, primary_key=True)
    # Etiqueta legible, ej. "Bimestre 1"
    nombre = db.Column(db.String(50), nullable=False)
    anio   = db.Column(db.Integer, nullable=False)
    # Orden para presentación (1–4)
    orden  = db.Column(db.Integer, nullable=False)

    __table_args__ = (
        db.UniqueConstraint('anio', 'orden', name='uq_bimestre_anio_orden'),
    )

    def __repr__(self):
        return f'<Bimestre {self.nombre} {self.anio}>'

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'anio': self.anio,
            'orden': self.orden,
        }
