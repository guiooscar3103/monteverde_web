import re
from datetime import datetime
from src.extensions import db
from src.models.configuracion_institucional import ConfiguracionInstitucional
from src.services.admin_service import AdminService

class ConfiguracionService:
    DEFAULT_CONFIG = {
        "institucion_id": "MONTEVERDE_DEFAULT",
        "nombre_institucion": "Colegio MonteVerde",
        "director": "Fernando MonteVerde",
        "anio_escolar": "2026",
        "periodo_actual": "Primer Trimestre",
        "direccion": "Calle de la Arboleda #45, Ciudad Jardín",
        "telefono": "+57 (601) 456-7890",
        "email_contacto": "contacto@monteverde.edu.co",
        "activa": True
    }

    EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

    @classmethod
    def get_or_create_default(cls, institucion_id="MONTEVERDE_DEFAULT"):
        """
        Obtiene la configuración institucional activa en la base de datos.
        Si no existe ningún registro, crea el registro por defecto de manera idempotente.
        """
        config = ConfiguracionInstitucional.query.filter_by(
            institucion_id=institucion_id,
            activa=True
        ).first()

        if not config:
            # Si no hay activa con ese ID, revisar si existe cualquier registro
            config = ConfiguracionInstitucional.query.first()
            if not config:
                config = ConfiguracionInstitucional(
                    institucion_id=cls.DEFAULT_CONFIG["institucion_id"],
                    nombre_institucion=cls.DEFAULT_CONFIG["nombre_institucion"],
                    director=cls.DEFAULT_CONFIG["director"],
                    anio_escolar=cls.DEFAULT_CONFIG["anio_escolar"],
                    periodo_actual=cls.DEFAULT_CONFIG["periodo_actual"],
                    direccion=cls.DEFAULT_CONFIG["direccion"],
                    telefono=cls.DEFAULT_CONFIG["telefono"],
                    email_contacto=cls.DEFAULT_CONFIG["email_contacto"],
                    activa=True
                )
                db.session.add(config)
                db.session.commit()

        return config

    @classmethod
    def get_configuracion(cls, institucion_id="MONTEVERDE_DEFAULT"):
        """Retorna el diccionario de configuración institucional actual"""
        config = cls.get_or_create_default(institucion_id)
        return config.to_dict()

    @classmethod
    def validate_configuracion_data(cls, data):
        """
        Valida y sanitiza los campos de configuración institucional.
        Retorna (True, sanitized_data) o (False, error_message).
        """
        if not isinstance(data, dict):
            return False, "El cuerpo de la solicitud debe ser un objeto JSON válido."

        required_fields = ["nombre_institucion", "director", "anio_escolar", "periodo_actual"]
        for field in required_fields:
            val = data.get(field)
            if not val or not str(val).strip():
                return False, f"El campo '{field}' es obligatorio y no puede estar vacío."

        # Sanitización y validación de tipos y longitudes
        nombre_institucion = str(data.get("nombre_institucion", "")).strip()
        if len(nombre_institucion) > 150:
            return False, "El nombre de la institución no puede exceder 150 caracteres."

        director = str(data.get("director", "")).strip()
        if len(director) > 150:
            return False, "El nombre del director no puede exceder 150 caracteres."

        anio_escolar = str(data.get("anio_escolar", "")).strip()
        if len(anio_escolar) > 20:
            return False, "El año escolar no puede exceder 20 caracteres."

        periodo_actual = str(data.get("periodo_actual", "")).strip()
        if len(periodo_actual) > 50:
            return False, "El período actual no puede exceder 50 caracteres."

        direccion = str(data.get("direccion", "")).strip() if data.get("direccion") is not None else ""
        if len(direccion) > 255:
            return False, "La dirección no puede exceder 255 caracteres."

        telefono = str(data.get("telefono", "")).strip() if data.get("telefono") is not None else ""
        if len(telefono) > 50:
            return False, "El teléfono no puede exceder 50 caracteres."

        email_contacto = str(data.get("email_contacto", "")).strip() if data.get("email_contacto") is not None else ""
        if email_contacto:
            if len(email_contacto) > 150:
                return False, "El correo de contacto no puede exceder 150 caracteres."
            if not cls.EMAIL_REGEX.match(email_contacto):
                return False, "El formato del correo electrónico de contacto es inválido."

        sanitized = {
            "nombre_institucion": nombre_institucion,
            "director": director,
            "anio_escolar": anio_escolar,
            "periodo_actual": periodo_actual,
            "direccion": direccion,
            "telefono": telefono,
            "email_contacto": email_contacto
        }

        return True, sanitized

    @classmethod
    def update_configuracion(cls, data, usuario_id=None, institucion_id="MONTEVERDE_DEFAULT"):
        """
        Actualiza la configuración institucional en la base de datos de forma transaccional.
        """
        is_valid, validation_result = cls.validate_configuracion_data(data)
        if not is_valid:
            return False, validation_result, 400

        sanitized_data = validation_result
        config = cls.get_or_create_default(institucion_id)

        try:
            config.nombre_institucion = sanitized_data["nombre_institucion"]
            config.director = sanitized_data["director"]
            config.anio_escolar = sanitized_data["anio_escolar"]
            config.periodo_actual = sanitized_data["periodo_actual"]
            config.direccion = sanitized_data["direccion"]
            config.telefono = sanitized_data["telefono"]
            config.email_contacto = sanitized_data["email_contacto"]
            config.updated_at = datetime.utcnow()
            config.usuario_actualizo_id = usuario_id

            db.session.commit()

            # Registrar auditoría de la acción
            detalles_audit = (
                f"Se actualizó la configuración de la institución en BD. "
                f"Nombre: {config.nombre_institucion}, Director: {config.director}, "
                f"Año: {config.anio_escolar}, Período: {config.periodo_actual}"
            )
            AdminService.log_actividad(
                usuario_id=usuario_id,
                accion='ACTUALIZAR_CONFIGURACION',
                detalles=detalles_audit
            )

            return True, config.to_dict(), 200
        except Exception as e:
            db.session.rollback()
            return False, f"Error al persistir la configuración en la base de datos: {str(e)}", 500
