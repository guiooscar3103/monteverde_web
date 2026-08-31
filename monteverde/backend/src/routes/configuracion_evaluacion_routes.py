from flask import Blueprint, request, jsonify
from src.services.configuracion_evaluacion_service import ConfiguracionEvaluacionService
from src.utils.auth_helpers import role_required, get_current_user

configuracion_evaluacion_bp = Blueprint('configuracion_evaluacion', __name__)

@configuracion_evaluacion_bp.route('/configuracion/evaluacion', methods=['GET'])
@role_required('admin', 'docente', 'familia')
def listar_configuraciones():
    """Retorna la lista de todas las configuraciones de evaluación registradas."""
    try:
        configs = ConfiguracionEvaluacionService.listar_todas()
        return jsonify({'success': True, 'data': configs})
    except Exception as exc:
        return jsonify({'success': False, 'message': str(exc)}), 500

@configuracion_evaluacion_bp.route('/configuracion/evaluacion/activa', methods=['GET'])
@role_required('admin', 'docente', 'familia')
def get_configuracion_activa():
    """Retorna la configuración de evaluación activa para el año institucional vigente."""
    try:
        anio = request.args.get('anio', type=int)
        if anio:
            config = ConfiguracionEvaluacionService.get_por_anio(anio) or ConfiguracionEvaluacionService.get_or_create_default(anio)
        else:
            config = ConfiguracionEvaluacionService.get_activa()
        
        return jsonify({'success': True, 'data': config.to_dict()})
    except Exception as exc:
        return jsonify({'success': False, 'message': str(exc)}), 500

@configuracion_evaluacion_bp.route('/configuracion/evaluacion/<int:anio>', methods=['GET'])
@role_required('admin', 'docente', 'familia')
def get_configuracion_por_anio(anio):
    """Retorna la configuración de evaluación para un año específico."""
    try:
        config = ConfiguracionEvaluacionService.get_por_anio(anio)
        if not config:
            return jsonify({
                'success': False,
                'message': f'No existe configuración registrada para el año {anio}.',
                'data': None
            }), 404
        return jsonify({'success': True, 'data': config.to_dict()})
    except Exception as exc:
        return jsonify({'success': False, 'message': str(exc)}), 500

@configuracion_evaluacion_bp.route('/configuracion/evaluacion', methods=['POST'])
@role_required('admin')
def guardar_configuracion():
    """Crea o actualiza la configuración de evaluación de un año académico (Solo Admin)."""
    try:
        data = request.get_json() or {}
        usuario = get_current_user()
        usuario_id = usuario.id if usuario else None

        config, error = ConfiguracionEvaluacionService.guardar_o_actualizar(data, usuario_id=usuario_id)
        if error:
            return jsonify({'success': False, 'message': error}), 400

        return jsonify({
            'success': True,
            'message': f'Configuración de evaluación para el año {config.anio_academico} guardada exitosamente.',
            'data': config.to_dict()
        })
    except Exception as exc:
        return jsonify({'success': False, 'message': str(exc)}), 500

@configuracion_evaluacion_bp.route('/configuracion/evaluacion/<int:anio>', methods=['PUT'])
@role_required('admin')
def actualizar_configuracion(anio):
    """Actualiza la configuración de evaluación para un año específico (Solo Admin)."""
    try:
        data = request.get_json() or {}
        data['anio_academico'] = anio
        usuario = get_current_user()
        usuario_id = usuario.id if usuario else None

        config, error = ConfiguracionEvaluacionService.guardar_o_actualizar(data, usuario_id=usuario_id)
        if error:
            return jsonify({'success': False, 'message': error}), 400

        return jsonify({
            'success': True,
            'message': f'Configuración de evaluación para el año {anio} actualizada exitosamente.',
            'data': config.to_dict()
        })
    except Exception as exc:
        return jsonify({'success': False, 'message': str(exc)}), 500

@configuracion_evaluacion_bp.route('/configuracion/evaluacion/verificar-compatibilidad', methods=['POST'])
@role_required('admin')
def verificar_compatibilidad():
    """Verifica si un cambio de configuración propuesta generaría conflictos con notas existentes."""
    try:
        data = request.get_json() or {}
        anio = data.get('anio_academico')
        if not anio:
            return jsonify({'success': False, 'message': 'Se requiere anio_academico'}), 400

        resultado = ConfiguracionEvaluacionService.verificar_compatibilidad_cambio(
            anio=int(anio),
            nuevo_indicadores=int(data.get('indicadores_por_periodo', 2)),
            nuevo_notas=int(data.get('notas_por_indicador', 3)),
            nueva_escala_min=float(data.get('escala_minima', 1.0)),
            nueva_escala_max=float(data.get('escala_maxima', 5.0))
        )
        return jsonify({'success': True, 'data': resultado})
    except Exception as exc:
        return jsonify({'success': False, 'message': str(exc)}), 500
