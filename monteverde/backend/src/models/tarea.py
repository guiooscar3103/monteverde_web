from src.extensions import db
from datetime import datetime

class Tarea(db.Model):
    """
    Modelo persistente de Tareas Académicas asignadas por un docente
    a un curso y materia específicos, con soporte opcional para
    vincularse a una calificación bimestral (indicador + número de nota).
    """
    __tablename__ = 'tareas'

    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(150), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    fecha_vencimiento = db.Column(db.DateTime, nullable=False)
    estado = db.Column(db.String(20), default='PUBLICADA', nullable=False)
    
    docente_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    curso_id = db.Column(db.Integer, db.ForeignKey('cursos.id', ondelete='CASCADE'), nullable=False)
    materia_id = db.Column(db.Integer, db.ForeignKey('materias.id', ondelete='CASCADE'), nullable=False)

    # Campos opcionales para vinculación con Gestión Académica (Calificaciones Bimestrales)
    califica_bimestre = db.Column(db.Boolean, default=False, nullable=False)
    bimestre_id = db.Column(db.Integer, db.ForeignKey('bimestres_config.id', ondelete='SET NULL'), nullable=True)
    indicador_id = db.Column(db.Integer, db.ForeignKey('indicadores_logro.id', ondelete='SET NULL'), nullable=True)
    numero_nota = db.Column(db.Integer, nullable=True)
    tipo_evaluacion = db.Column(db.String(50), nullable=True)

    __table_args__ = (
        db.CheckConstraint("estado IN ('BORRADOR', 'PUBLICADA', 'CERRADA')", name='ck_tarea_estado'),
        db.CheckConstraint("numero_nota IS NULL OR numero_nota IN (1, 2, 3)", name='ck_tarea_numero_nota'),
        db.Index('idx_tarea_docente_curso_materia', 'docente_id', 'curso_id', 'materia_id'),
        db.Index('idx_tarea_vencimiento', 'fecha_vencimiento'),
        db.Index('idx_tarea_estado', 'estado'),
        db.Index('idx_tarea_bimestre_indicador_nota', 'bimestre_id', 'indicador_id', 'numero_nota'),
    )

    # Relaciones
    docente = db.relationship('Usuario', backref=db.backref('tareas', lazy=True))
    curso = db.relationship('Curso', backref=db.backref('tareas', lazy=True))
    materia = db.relationship('Materia', backref=db.backref('tareas', lazy=True))
    bimestre = db.relationship('Bimestre', backref=db.backref('tareas', lazy=True))
    indicador = db.relationship('IndicadorLogro', backref=db.backref('tareas', lazy=True))
    entregas = db.relationship('Entrega', backref='tarea', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Tarea #{self.id} "{self.titulo}" curso={self.curso_id} materia={self.materia_id} califica_bim={self.califica_bimestre}>'

    def to_dict(self, include_stats=False):
        data = {
            'id': self.id,
            'titulo': self.titulo,
            'descripcion': self.descripcion,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'fecha_vencimiento': self.fecha_vencimiento.isoformat() if self.fecha_vencimiento else None,
            'estado': self.estado,
            'docente_id': self.docente_id,
            'docente_nombre': self.docente.nombre if self.docente else None,
            'curso_id': self.curso_id,
            'curso_nombre': self.curso.nombre if self.curso else None,
            'curso_grado': f"{self.curso.nivel}{self.curso.letra}" if self.curso and self.curso.nivel and self.curso.letra else (self.curso.nombre if self.curso else None),
            'materia_id': self.materia_id,
            'materia_nombre': self.materia.nombre if self.materia else None,
            'califica_bimestre': bool(self.califica_bimestre),
            'bimestre_id': self.bimestre_id,
            'bimestre_nombre': self.bimestre.nombre if self.bimestre else None,
            'indicador_id': self.indicador_id,
            'indicador_descripcion': self.indicador.descripcion if self.indicador else None,
            'indicador_numero': self.indicador.numero if self.indicador else None,
            'numero_nota': self.numero_nota,
            'tipo_evaluacion': self.tipo_evaluacion
        }

        if include_stats:
            total_estudiantes = len(self.curso.estudiantes) if self.curso and self.curso.estudiantes else 0
            entregas_list = self.entregas if self.entregas else []
            total_entregadas = len([e for e in entregas_list if e.estado in ('ENTREGADA', 'CALIFICADA')])
            total_calificadas = len([e for e in entregas_list if e.estado == 'CALIFICADA'])
            entregas_pendientes = max(0, total_estudiantes - total_entregadas)

            data['total_estudiantes'] = total_estudiantes
            data['total_entregadas'] = total_entregadas
            data['total_calificadas'] = total_calificadas
            data['entregas_pendientes'] = entregas_pendientes

        return data
