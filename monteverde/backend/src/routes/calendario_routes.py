from flask import Blueprint, request, jsonify
from datetime import datetime
from src.utils.auth_helpers import role_required, get_current_user
from src.services.calendario_service import CalendarioService

calendario_bp = Blueprint('calendario', __name__)

@calendario_bp.route('/', methods=['GET'])
@role_required(['coordinador', 'admin', 'docente', 'familia'])
def get_calendario():
    """Retorna el calendario del año solicitado o del año en curso con sus periodos."""
    try:
        anio = request.args.get('anio', type=int) or datetime.now().year
        cal = CalendarioService.get_calendario(anio)
        return jsonify({'success': True, 'data': cal.to_dict()}), 200
    except Exception as e:
        print(f"❌ Error get_calendario: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@calendario_bp.route('/<int:calendario_id>', methods=['PUT'])
@role_required(['coordinador', 'admin'])
def actualizar_calendario(calendario_id):
    """Permite al Coordinador o Admin actualizar parámetros generales del calendario escolar."""
    try:
        data = request.get_json() or {}
        cal = CalendarioService.actualizar_calendario(calendario_id, data)
        return jsonify({
            'success': True,
            'message': 'Calendario académico actualizado correctamente',
            'data': cal.to_dict()
        }), 200
    except ValueError as ve:
        return jsonify({'success': False, 'message': str(ve)}), 400
    except Exception as e:
        print(f"❌ Error actualizar_calendario: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@calendario_bp.route('/periodos', methods=['GET'])
@role_required(['coordinador', 'admin', 'docente', 'familia'])
def get_periodos():
    """Retorna los periodos lectivos y su estado para el año."""
    try:
        anio = request.args.get('anio', type=int) or datetime.now().year
        periodos = CalendarioService.get_periodos(anio)
        return jsonify({
            'success': True,
            'data': [p.to_dict() for p in periodos]
        }), 200
    except Exception as e:
        print(f"❌ Error get_periodos: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@calendario_bp.route('/periodos/<int:periodo_id>/estado', methods=['PATCH'])
@role_required(['coordinador', 'admin'])
def cambiar_estado_periodo(periodo_id):
    """
    Permite al Coordinador aperturar o cerrar un periodo de evaluación lectivo.
    Payload: { "estado": "ABIERTO" | "CERRADO" }
    """
    try:
        data = request.get_json() or {}
        nuevo_estado = data.get('estado')
        if not nuevo_estado:
            return jsonify({'success': False, 'message': 'El campo estado es requerido'}), 400

        user = get_current_user()
        periodo = CalendarioService.cambiar_estado_periodo(periodo_id, nuevo_estado, user.id if user else None)
        accion_str = "aperturado" if nuevo_estado.upper() == 'ABIERTO' else "cerrado"
        return jsonify({
            'success': True,
            'message': f'El periodo "{periodo.nombre}" ha sido {accion_str} correctamente.',
            'data': periodo.to_dict()
        }), 200
    except ValueError as ve:
        return jsonify({'success': False, 'message': str(ve)}), 400
    except Exception as e:
        print(f"❌ Error cambiar_estado_periodo: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@calendario_bp.route('/periodos/<int:periodo_id>', methods=['PUT'])
@role_required(['coordinador', 'admin'])
def actualizar_periodo(periodo_id):
    """Permite al Coordinador ajustar fechas de vigencia y límite de calificaciones para el periodo."""
    try:
        data = request.get_json() or {}
        periodo = CalendarioService.actualizar_periodo(periodo_id, data)
        return jsonify({
            'success': True,
            'message': f'Periodo "{periodo.nombre}" actualizado correctamente',
            'data': periodo.to_dict()
        }), 200
    except ValueError as ve:
        return jsonify({'success': False, 'message': str(ve)}), 400
    except Exception as e:
        print(f"❌ Error actualizar_periodo: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
