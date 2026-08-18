import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  getUsuariosPaginados,       // Obtiene usuarios con paginación, búsqueda y filtros
  crearUsuario,               // Crea una nueva cuenta de usuario
  actualizarUsuario,          // Modifica datos de un usuario existente
  eliminarUsuario,             // Borrado lógico (soft delete) de un usuario
  cambiarEstadoUsuario,        // Alterna activo/inactivo la cuenta de un usuario
  restablecerPasswordUsuario,           // Reinicia la contraseña de un usuario específico
  restaurarUsuario,            // Revierte el borrado lógico de un usuario
  getTodosLosEstudiantes       // Obtiene el listado completo de estudiantes para vinculación
} from '../../services/api';

// ── Funciones helper (utilidades internas) ──────────────────────────────────
// Interpreta la respuesta que devuelve la API y extrae `success` y `message`.
// Soporta dos formatos: objeto con campo `success` o respuesta con solo el `id` del recurso creado.
const _parseApiResponse = (res, defaultMessage) => {
  let success = false, message = '';
  if (res?.success !== undefined) {
    success = res.success;
    message = res.message || defaultMessage;
  } else if (res?.id) {
    success = true;
    message = defaultMessage;
  }
  return { success, message };
};

// Verifica que los campos obligatorios del formulario estén completos.
// En modo creación (editandoId === null) la contraseña es obligatoria.
const _validarFormularioUsuario = (nombre, email, password, editandoId) => {
  if (!nombre || !email) return false;
  if (editandoId === null && !password) return false;
  return true;
};

// Construye el objeto que se envía al backend con los datos del usuario.
// Solo incluye `password` si se ha rellenado (creación o cambio opcional en edición).
const _construirPayloadUsuario = (nombre, email, password, rolForm, estudianteId, activoForm) => {
  const payload = {
    nombre,
    email,
    rol: rolForm,
    estudiante_id: rolForm === 'familia' && estudianteId ? Number.parseInt(estudianteId) : null,
    activo: activoForm
  };
  if (password) payload.password = password;
  return payload;
};

// Reinicia todos los campos del formulario de creación/edición a sus valores por defecto.
const _resetFormularioUsuario = (setNombre, setEmail, setPassword, setRolForm, setEstudianteId, setActivoForm) => {
  setNombre('');
  setEmail('');
  setPassword('');
  setRolForm('familia');
  setEstudianteId('');
  setActivoForm(true);
};

// Muestra un mensaje (éxito o error) durante `timeout` milisegundos y luego lo limpia.
const _mostrarMensajeConTimeout = (setter, mensaje, timeout = 3000) => {
  setter(mensaje);
  setTimeout(() => setter(''), timeout);
};

// Retorna el carácter de orden (▲/▼) para la cabecera de columna activa en la tabla.
const _mostrarIndicadorOrden = (col, orderBy, orderDirection) => {
  if (orderBy !== col) return '';
  return orderDirection === 'ASC' ? '▲' : '▼';
};

// ── Componente: Fila individual de la tabla de usuarios ─────────────────────
// Representa una fila con los datos del usuario, acciones de edición,
// cambio de contraseña, eliminación/restauración y toggle de estado.
function UsuarioRow({
  u,
  handleToggleEstado,
  abrirModalEditar,
  abrirModalPassword,
  handleRestore,
  handleSoftDelete
}) {
  // Renderiza un badge de color según el rol del usuario
  const renderRolBadge = (rol) => {
    const badgeStyles = {
      padding: '0.25rem 0.6rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      border: '1px solid currentColor'
    };
    // Rojo para administradores
    if (rol === 'admin') {
      return <span style={{ ...badgeStyles, background: '#fee2e2', color: '#991b1b' }}>Administrador</span>;
    }
    // Azul para docentes
    if (rol === 'docente') {
      return <span style={{ ...badgeStyles, background: '#dbeafe', color: '#1e40af' }}>Docente</span>;
    }
    // Verde para familia (rol por defecto)
    return <span style={{ ...badgeStyles, background: '#d1fae5', color: '#065f46' }}>Familia</span>;
  };

  // Muestra el nombre del estudiante vinculado si el rol es 'familia',
  // o un guion para roles que no requieren vinculación.
  const renderEstudianteInfo = () => {
    if (u.rol !== 'familia') {
      return <span style={{ color: '#94a3b8' }}>-</span>;
    }
    if (u.estudiante_nombre || u.estudiante?.nombre) {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b' }}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <strong>{u.estudiante_nombre || u.estudiante?.nombre}</strong>
        </span>
      );
    }
    return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin estudiante</span>;
  };

  return (
    <tr key={u.id} style={{ 
      borderBottom: '1px solid #f1f5f9',
      background: u.eliminado ? '#fff5f5' : '#ffffff',
      transition: 'background 0.2s'
    }}>
      <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
        #{u.id}
      </td>
      <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#1e293b', fontWeight: 500 }}>
        {u.nombre}
        {u.eliminado && (
          <span style={{
            background: '#fee2e2',
            color: '#b91c1c',
            fontSize: '0.7rem',
            padding: '2px 6px',
            borderRadius: '4px',
            marginLeft: '8px',
            fontWeight: 600
          }}>
            ELIMINADO
          </span>
        )}
      </td>
      <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
        {u.email}
      </td>
      <td style={{ padding: '1rem' }}>
        {renderRolBadge(u.rol)}
      </td>
      <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#475569' }}>
        {renderEstudianteInfo()}
      </td>
      <td style={{ padding: '1rem' }}>
        <button
          disabled={u.eliminado}
          onClick={() => handleToggleEstado(u.id, u.activo)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.35rem 0.75rem',
            borderRadius: '8px',
            border: 'none',
            cursor: u.eliminado ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: u.activo ? '#d1fae5' : '#fee2e2',
            color: u.activo ? '#065f46' : '#991b1b',
            transition: 'all 0.15s'
          }}
        >
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: u.activo ? '#10b981' : '#ef4444'
          }}></span>
          {u.activo ? 'Activo' : 'Inactivo'}
        </button>
      </td>
      <td style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            disabled={u.eliminado}
            onClick={() => abrirModalEditar(u)}
            title="Editar usuario"
            style={{
              padding: '6px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              color: '#475569',
              cursor: u.eliminado ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>

          <button
            disabled={u.eliminado}
            onClick={() => abrirModalPassword(u.id)}
            title="Cambiar contraseña"
            style={{
              padding: '6px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              color: '#d97706',
              cursor: u.eliminado ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </button>

          {u.eliminado ? (
            <button
              onClick={() => handleRestore(u.id)}
              title="Restaurar cuenta"
              style={{
                padding: '6px',
                background: '#ecfdf5',
                border: '1px solid #10b981',
                borderRadius: '6px',
                color: '#10b981',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => handleSoftDelete(u.id)}
              title="Eliminar lógicamente"
              style={{
                padding: '6px',
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '6px',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Componente: Modal de formulario para crear/editar usuario ──────────────
// Se muestra como overlay con campos: nombre, email, contraseña (solo en creación),
// selector de rol, vinculación de estudiante (solo rol familia) y checkbox de activo.
function UsuarioFormModal({
  abierto,
  onClose,
  onSubmit,
  editandoId,
  nombre,
  setNombre,
  email,
  setEmail,
  password,
  setPassword,
  rolForm,
  setRolForm,
  estudianteId,
  setEstudianteId,
  activoForm,
  setActivoForm,
  estudiantes
}) {
  if (!abierto) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          color: '#ffffff',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem', fontWeight: 700 }}>
            {editandoId === null ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: '1'
            }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div>
              <label htmlFor="usuarioNombre" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Nombre Completo <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="usuarioNombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Ej. Juan Pérez"
                style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label htmlFor="usuarioEmail" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Correo Electrónico <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="usuarioEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ejemplo@monteverde.edu.co"
                style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            {editandoId === null && (
              <div>
                <label htmlFor="usuarioPassword" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Contraseña Temporal <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="usuarioPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            )}

            <div>
              <label htmlFor="usuarioRol" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Rol del Sistema <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="usuarioRol"
                value={rolForm}
                onChange={(e) => setRolForm(e.target.value)}
                style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="admin">Administrador</option>
                <option value="docente">Docente</option>
                <option value="familia">Familia</option>
              </select>
            </div>

            {rolForm === 'familia' && (
              <div>
                <label htmlFor="usuarioEstudiante" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Vincular Estudiante Asociado
                </label>
                <select
                  id="usuarioEstudiante"
                  value={estudianteId}
                  onChange={(e) => setEstudianteId(e.target.value)}
                  style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">-- Sin estudiante asignado --</option>
                  {estudiantes.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nombre} {est.curso ? `(${est.curso.nivel}${est.curso.letra})` : ''}
                    </option>
                  ))}
                </select>
                <small style={{ display: 'block', marginTop: '4px', color: '#64748b' }}>
                  Las cuentas Familia ven reportes académicos del estudiante vinculado.
                </small>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="activoForm"
                checked={activoForm}
                onChange={(e) => setActivoForm(e.target.checked)}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <label htmlFor="activoForm" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                Cuenta de usuario Activa (Permitir acceso inmediato)
              </label>
            </div>
          </div>

          <div style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '1.25rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#475569',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
              }}
            >
              {editandoId === null ? 'Registrar' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Componente: Modal de restablecimiento de contraseña ──────────────────────
// Permite ingresar una nueva contraseña para un usuario específico.
function PasswordModal({
  abierto,
  onClose,
  onSubmit,
  nuevoPassword,
  setNuevoPassword
}) {
  if (!abierto) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 11,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
          color: '#ffffff',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem', fontWeight: 700 }}>
            Restablecer Contraseña
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: '1'
            }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Ingresa una nueva contraseña para la cuenta seleccionada. El usuario usará esta clave en su próximo inicio de sesión.
            </p>

            <div>
              <label htmlFor="nuevaPassword" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Nueva Contraseña
              </label>
              <input
                id="nuevaPassword"
                type="password"
                value={nuevoPassword}
                onChange={(e) => setNuevoPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div style={{
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '1.25rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#475569',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)'
              }}
            >
              Restablecer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Componente: Cabecera de la página de usuarios ────────────────────────────
// Muestra el título de la sección y un botón para crear un nuevo usuario.
function UsuarioHeader({ abrirModalCrear }) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '2rem',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      padding: '1.5rem 2rem',
      borderRadius: '16px',
      color: '#ffffff',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#ffffff', fontWeight: 700 }}>
          Administración de Usuarios
        </h1>
        <p style={{ margin: '5px 0 0', color: '#c7d2fe', fontSize: '0.9rem' }}>
          Crea, edita, cambia de estado o realiza restablecimiento de contraseñas de las cuentas.
        </p>
      </div>
      <button 
        onClick={abrirModalCrear}
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          border: 'none',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          fontWeight: 600,
          fontSize: '0.9rem',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Nuevo Usuario
      </button>
    </div>
  );
}

// ── Componente: Barra de filtros y búsqueda ──────────────────────────────────
// Incluye campo de texto para búsqueda, selectores para filtrar por rol,
// estado (activo/inactivo) y número de elementos por página.
function UsuarioFiltros({
  search,
  setSearch,
  rol,
  setRol,
  activo,
  setActivo,
  limite,
  setLimite,
  setPagina
}) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '1.25rem',
      marginBottom: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem' }}>
        <div>
          <label htmlFor="filtroBuscar" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Buscar</label>
          <div style={{ position: 'relative' }}>
            <input
              id="filtroBuscar"
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagina(1); }}
              placeholder="Nombre o correo electrónico..."
              style={{
                paddingLeft: '2rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc'
              }}
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)'
            }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        <div>
          <label htmlFor="filtroRol" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Filtrar por Rol</label>
          <select 
            id="filtroRol"
            value={rol} 
            onChange={(e) => { setRol(e.target.value); setPagina(1); }}
            style={{ borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
          >
            <option value="">Todos los Roles</option>
            <option value="admin">Administradores</option>
            <option value="docente">Docentes</option>
            <option value="familia">Familias</option>
          </select>
        </div>

        <div>
          <label htmlFor="filtroEstado" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Filtrar por Estado</label>
          <select 
            id="filtroEstado"
            value={activo} 
            onChange={(e) => { setActivo(e.target.value); setPagina(1); }}
            style={{ borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
          >
            <option value="">Todos los Estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        <div>
          <label htmlFor="filtroLimite" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Elementos por Página</label>
          <select 
            id="filtroLimite"
            value={limite} 
            onChange={(e) => { setLimite(Number.parseInt(e.target.value)); setPagina(1); }}
            style={{ borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
          >
            <option value={5}>5 por página</option>
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ── Componente: Tabla de usuarios ────────────────────────────────────────────
// Renderiza la tabla con cabeceras ordenables y delega cada fila al componente UsuarioRow.
function UsuarioTable({
  usuarios,
  orderBy,
  orderDirection,
  handleSort,
  handleToggleEstado,
  abrirModalEditar,
  abrirModalPassword,
  handleRestore,
  handleSoftDelete
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <th onClick={() => handleSort('id')} style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}>
              ID {_mostrarIndicadorOrden('id', orderBy, orderDirection)}
            </th>
            <th onClick={() => handleSort('nombre')} style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}>
              Nombre {_mostrarIndicadorOrden('nombre', orderBy, orderDirection)}
            </th>
            <th onClick={() => handleSort('email')} style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}>
              Email {_mostrarIndicadorOrden('email', orderBy, orderDirection)}
            </th>
            <th onClick={() => handleSort('rol')} style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}>
              Rol {_mostrarIndicadorOrden('rol', orderBy, orderDirection)}
            </th>
            <th style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', fontWeight: 700 }}>
              Vinculación
            </th>
            <th onClick={() => handleSort('activo')} style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}>
              Estado {_mostrarIndicadorOrden('activo', orderBy, orderDirection)}
            </th>
            <th style={{ padding: '1rem', color: '#475569', fontSize: '0.85rem', fontWeight: 700 }}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody style={{ divideY: '1px solid #e2e8f0' }}>
          {usuarios.map((u) => (
            <UsuarioRow
              key={u.id}
              u={u}
              handleToggleEstado={handleToggleEstado}
              abrirModalEditar={abrirModalEditar}
              abrirModalPassword={abrirModalPassword}
              handleRestore={handleRestore}
              handleSoftDelete={handleSoftDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Componente: Barra de paginación inferior ─────────────────────────────────
// Muestra el conteo de usuarios y botones para navegar entre páginas.
function UsuarioPaginacion({
  pagina,
  setPagina,
  paginasTotales,
  usuariosCount,
  total
}) {
  return (
    <div style={{
      padding: '1rem 1.5rem',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#f8fafc'
    }}>
      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
        Mostrando <strong>{usuariosCount}</strong> de <strong>{total}</strong> usuarios registrados.
      </span>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          disabled={pagina === 1}
          onClick={() => setPagina(pagina - 1)}
          style={{
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#475569',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: pagina === 1 ? 'not-allowed' : 'pointer',
            opacity: pagina === 1 ? 0.5 : 1
          }}
        >
          Anterior
        </button>

        <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
          Página {pagina} de {paginasTotales}
        </span>

        <button
          disabled={pagina >= paginasTotales}
          onClick={() => setPagina(pagina + 1)}
          style={{
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#475569',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: pagina >= paginasTotales ? 'not-allowed' : 'pointer',
            opacity: pagina >= paginasTotales ? 0.5 : 1
          }}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

// ── Componente principal: Página de Administración de Usuarios ──────────────
// Orquesta toda la lógica de CRUD de usuarios: listado paginado, creación,
// edición, eliminación lógica, restauración, cambio de estado y restablecimiento
// de contraseña. Compone los subcomponentes definidos arriba.
export default function Usuarios() {
  // Cliente de React Query para invalidar cachés remotas después de mutaciones
  const queryClient = useQueryClient();

  // ── Estados del listado de usuarios ──
  const [usuarios, setUsuarios] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [paginasTotales, setPaginasTotales] = useState(1);
  const [limite, setLimite] = useState(10);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Estados de los filtros y ordenación ──
  const [search, setSearch] = useState('');
  const [rol, setRol] = useState('');
  const [activo, setActivo] = useState('');
  const [orderBy, setOrderBy] = useState('nombre');
  const [orderDirection, setOrderDirection] = useState('ASC');

  // ── Estados del modal de creación/edición ──
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);   // null = creación, número = edición
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rolForm, setRolForm] = useState('familia');
  const [estudianteId, setEstudianteId] = useState('');
  const [activoForm, setActivoForm] = useState(true);

  // ── Estados del modal de restablecimiento de contraseña ──
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [passwordResetId, setPasswordResetId] = useState(null);
  const [nuevoPassword, setNuevoPassword] = useState('');

  // ── Lista completa de estudiantes para la vinculación de cuentas 'familia' ──
  const [estudiantes, setEstudiantes] = useState([]);

  // Obtiene el listado de usuarios desde la API aplicando filtros, paginación y orden.
  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const data = await getUsuariosPaginados({
        page: pagina,
        limit: limite,
        search: search || undefined,
        rol: rol || undefined,
        activo: activo !== '' ? activo : undefined,
        orderBy,
        orderDirection
      });
      if (data) {
        setUsuarios(data.usuarios || []);
        setTotal(data.total || 0);
        setPaginasTotales(data.total_paginas || 1);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Error al cargar la lista de usuarios.');
    } finally {
      setCargando(false);
    }
  }, [pagina, limite, search, rol, activo, orderBy, orderDirection]);

  // Carga la lista completa de estudiantes (sin paginación) para el selector de vinculación.
  const cargarEstudiantes = async () => {
    try {
      const data = await getTodosLosEstudiantes();
      if (data) {
        setEstudiantes(data);
      }
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
    }
  };

  // Efecto que recarga la tabla cada vez que cambian los filtros, paginación u orden.
  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // Efecto de montaje: obtiene la lista de estudiantes una sola vez.
  useEffect(() => {
    cargarEstudiantes();
  }, []);

  // Alterna el estado activo/inactivo de un usuario.
  const handleToggleEstado = async (id, activoActual) => {
    try {
      const nuevoEstado = !activoActual;
      const res = await cambiarEstadoUsuario(id, nuevoEstado);
      if (res.success) {
        _mostrarMensajeConTimeout(setSuccessMsg, res.message || 'Estado actualizado con éxito');
        // Invalida la caché de docentes en React Query
        queryClient.invalidateQueries({ queryKey: ['admin', 'docentes'] });
        // Actualización optimista del estado local
        setUsuarios(usuarios.map(u => u.id === id ? { ...u, activo: nuevoEstado } : u));
      }
    } catch (error) {
      console.error('Error al cambiar el estado del usuario:', error);
      _mostrarMensajeConTimeout(setErrorMsg, error?.message || 'Error al cambiar el estado del usuario.');
    }
  };

  // Soft delete: marca un usuario como eliminado (no se borra físicamente de la BD).
  const handleSoftDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar lógicamente este usuario? El usuario no podrá iniciar sesión.')) {
      return;
    }
    try {
      const res = await eliminarUsuario(id);
      if (res.success) {
        _mostrarMensajeConTimeout(setSuccessMsg, res.message || 'Usuario eliminado lógicamente');
        queryClient.invalidateQueries({ queryKey: ['admin', 'docentes'] });
        cargarUsuarios();
      }
    } catch (error) {
      _mostrarMensajeConTimeout(setErrorMsg, error.message || 'Error al eliminar usuario.');
    }
  };

  const handleRestore = async (id) => {
    try {
      const res = await restaurarUsuario(id);
      if (res.success) {
        _mostrarMensajeConTimeout(setSuccessMsg, res.message || 'Usuario restaurado exitosamente');
        queryClient.invalidateQueries({ queryKey: ['admin', 'docentes'] });
        cargarUsuarios();
      }
    } catch (error) {
      _mostrarMensajeConTimeout(setErrorMsg, error.message || 'Error al restaurar usuario.');
    }
  };

  const abrirModalCrear = () => {
    setEditandoId(null);
    _resetFormularioUsuario(setNombre, setEmail, setPassword, setRolForm, setEstudianteId, setActivoForm);
    setModalAbierto(true);
  };

  const abrirModalEditar = (u) => {
    setEditandoId(u.id);
    setNombre(u.nombre || '');
    setEmail(u.email || '');
    setPassword(''); // Mantener en blanco para no modificar la contraseña actual
    setRolForm(u.rol || 'familia');
    setEstudianteId(u.estudiante_id || '');
    setActivoForm(u.activo !== false);
    setModalAbierto(true);
  };

  const abrirModalPassword = (id) => {
    setPasswordResetId(id);
    setNuevoPassword('');
    setModalPasswordAbierto(true);
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!_validarFormularioUsuario(nombre, email, password, editandoId)) {
      setErrorMsg('Por favor completa todos los campos obligatorios.');
      return;
    }

    const payload = _construirPayloadUsuario(nombre, email, password, rolForm, estudianteId, activoForm);

    try {
      const res = editandoId === null 
        ? await crearUsuario(payload)
        : await actualizarUsuario(editandoId, payload);

      const { success, message } = _parseApiResponse(res, 'Operación realizada con éxito');

      if (success) {
        _mostrarMensajeConTimeout(setSuccessMsg, message || 'Operación realizada con éxito');
        setModalAbierto(false);
        queryClient.invalidateQueries({ queryKey: ['admin', 'docentes'] });
        cargarUsuarios();
      } else {
        setErrorMsg(message || 'Hubo un problema al guardar el usuario.');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Error de conexión con el servidor.');
    }
  };

  const guardarPassword = async (e) => {
    e.preventDefault();
    if (!nuevoPassword) {
      setErrorMsg('Por favor ingresa una nueva contraseña.');
      return;
    }

    try {
      const res = await restablecerPasswordUsuario(passwordResetId, nuevoPassword);
      const { success, message } = _parseApiResponse(res, 'Contraseña restablecida exitosamente');

      if (success) {
        _mostrarMensajeConTimeout(setSuccessMsg, message);
        setModalPasswordAbierto(false);
      } else {
        setErrorMsg(message || 'No se pudo restablecer la contraseña.');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Error de conexión.');
    }
  };

  // Alternar el campo y sentido de ordenación
  const handleSort = (col) => {
    if (orderBy === col) {
      setOrderDirection(orderDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setOrderBy(col);
      setOrderDirection('ASC');
    }
    setPagina(1);
  };

  const renderTabla = () => {
    if (cargando) {
      return (
        <div style={{ padding: '4rem 0', textAlign: 'center', color: '#64748b' }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #4f46e5',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <span>Cargando listado de usuarios...</span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }
    if (usuarios.length === 0) {
      return (
        <div style={{ padding: '4rem 0', textAlign: 'center', color: '#64748b' }}>
          <div style={{ color: '#94a3b8', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 style={{ margin: '1rem 0 0.5rem', color: '#334155' }}>No se encontraron usuarios</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Intente cambiar los filtros o busque otro nombre.</p>
        </div>
      );
    }
    return (
      <UsuarioTable
        usuarios={usuarios}
        orderBy={orderBy}
        orderDirection={orderDirection}
        handleSort={handleSort}
        handleToggleEstado={handleToggleEstado}
        abrirModalEditar={abrirModalEditar}
        abrirModalPassword={abrirModalPassword}
        handleRestore={handleRestore}
        handleSoftDelete={handleSoftDelete}
      />
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <UsuarioHeader abrirModalCrear={abrirModalCrear} />

      {/* Notificaciones flotantes del sistema */}
      {successMsg && (
        <div style={{
          background: '#d1fae5',
          border: '1px solid #10b981',
          color: '#065f46',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#991b1b',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          {errorMsg}
        </div>
      )}

      <UsuarioFiltros
        search={search}
        setSearch={setSearch}
        rol={rol}
        setRol={setRol}
        activo={activo}
        setActivo={setActivo}
        limite={limite}
        setLimite={setLimite}
        setPagina={setPagina}
      />

      {/* Tarjeta que contiene la tabla principal de datos */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
      }}>
        {renderTabla()}

        <UsuarioPaginacion
          pagina={pagina}
          setPagina={setPagina}
          paginasTotales={paginasTotales}
          usuariosCount={usuarios.length}
          total={total}
        />
      </div>

      <UsuarioFormModal
        abierto={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSubmit={guardarUsuario}
        editandoId={editandoId}
        nombre={nombre}
        setNombre={setNombre}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        rolForm={rolForm}
        setRolForm={setRolForm}
        estudianteId={estudianteId}
        setEstudianteId={setEstudianteId}
        activoForm={activoForm}
        setActivoForm={setActivoForm}
        estudiantes={estudiantes}
      />

      <PasswordModal
        abierto={modalPasswordAbierto}
        onClose={() => setModalPasswordAbierto(false)}
        onSubmit={guardarPassword}
        nuevoPassword={nuevoPassword}
        setNuevoPassword={setNuevoPassword}
      />
    </div>
  );
}
