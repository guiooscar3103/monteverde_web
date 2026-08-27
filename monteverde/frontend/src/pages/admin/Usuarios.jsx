import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Pencil,
  KeyRound,
  RotateCcw,
  Trash2,
  Plus,
  Search,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
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

const _validarFormularioUsuario = (nombre, email, password, editandoId) => {
  if (!nombre || !email) return false;
  if (editandoId === null && !password) return false;
  return true;
};

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

const _resetFormularioUsuario = (setNombre, setEmail, setPassword, setRolForm, setEstudianteId, setActivoForm) => {
  setNombre('');
  setEmail('');
  setPassword('');
  setRolForm('familia');
  setEstudianteId('');
  setActivoForm(true);
};

const _mostrarMensajeConTimeout = (setter, mensaje, timeout = 3000) => {
  setter(mensaje);
  setTimeout(() => setter(''), timeout);
};

const _mostrarIndicadorOrden = (col, orderBy, orderDirection) => {
  if (orderBy !== col) return null;
  return orderDirection === 'ASC' ? (
    <ChevronUp size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px' }} />
  ) : (
    <ChevronDown size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px' }} />
  );
};

// ── Componente: Fila individual de la tabla de usuarios ─────────────────────
function UsuarioRow({
  u,
  handleToggleEstado,
  abrirModalEditar,
  abrirModalPassword,
  handleRestore,
  handleSoftDelete
}) {
  const renderRolBadge = (rol) => {
    const badgeStyles = {
      padding: '0.25rem 0.65rem',
      borderRadius: '9999px',
      fontSize: '0.72rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      border: '1px solid transparent',
      display: 'inline-block'
    };
    if (rol === 'admin') {
      return <span style={{ ...badgeStyles, background: 'var(--bg-light)', color: 'var(--role-admin)', borderColor: 'var(--border)' }}>Administrador</span>;
    }
    if (rol === 'docente') {
      return <span style={{ ...badgeStyles, background: '#DCFCE7', color: 'var(--role-docente)', borderColor: '#BBF7D0' }}>Docente</span>;
    }
    return <span style={{ ...badgeStyles, background: '#FEF3C7', color: 'var(--role-familia)', borderColor: '#FDE68A' }}>Familia</span>;
  };

  const renderEstudianteInfo = () => {
    if (u.rol !== 'familia') {
      return <span style={{ color: 'var(--text-muted)' }}>-</span>;
    }
    if (u.estudiante_nombre || u.estudiante?.nombre) {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={14} style={{ color: 'var(--text-secondary)' }} />
          <strong style={{ color: 'var(--text)' }}>{u.estudiante_nombre || u.estudiante?.nombre}</strong>
        </span>
      );
    }
    return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin estudiante</span>;
  };

  return (
    <tr key={u.id} style={{ 
      background: u.eliminado ? '#FFF1F2' : '#ffffff',
      borderBottom: '1px solid var(--border)'
    }}>
      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
        #{u.id}
      </td>
      <td style={{ fontWeight: 700, color: 'var(--text)' }}>
        {u.nombre}
        {u.eliminado && (
          <span style={{
            background: '#FFE4E6',
            color: '#BE123C',
            fontSize: '0.65rem',
            padding: '2px 6px',
            borderRadius: '4px',
            marginLeft: '8px',
            fontWeight: 800,
            border: '1px solid #FECDD3'
          }}>
            ELIMINADO
          </span>
        )}
      </td>
      <td>
        {u.email}
      </td>
      <td>
        {renderRolBadge(u.rol)}
      </td>
      <td>
        {renderEstudianteInfo()}
      </td>
      <td>
        <button
          disabled={u.eliminado}
          onClick={() => handleToggleEstado(u.id, u.activo)}
          className="status-chip"
          style={{
            background: u.activo ? '#DCFCE7' : '#FFE4E6',
            color: u.activo ? '#166534' : '#9F1239',
            borderColor: u.activo ? '#BBF7D0' : '#FECDD3',
            cursor: u.eliminado ? 'not-allowed' : 'pointer',
            padding: '0.25rem 0.65rem',
            fontSize: '0.75rem',
            fontWeight: 700
          }}
        >
          {u.activo ? 'Activo' : 'Inactivo'}
        </button>
      </td>
      <td>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            disabled={u.eliminado}
            onClick={() => abrirModalEditar(u)}
            title="Editar usuario"
            className="btn btn--secondary"
            style={{
              padding: '6px',
              minWidth: 'auto',
              borderRadius: '8px',
              cursor: u.eliminado ? 'not-allowed' : 'pointer',
              color: 'var(--color-primary-light)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Pencil size={15} />
          </button>

          <button
            disabled={u.eliminado}
            onClick={() => abrirModalPassword(u.id)}
            title="Cambiar contraseña"
            className="btn btn--secondary"
            style={{
              padding: '6px',
              minWidth: 'auto',
              borderRadius: '8px',
              cursor: u.eliminado ? 'not-allowed' : 'pointer',
              color: 'var(--color-warning)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <KeyRound size={15} />
          </button>

          {u.eliminado ? (
            <button
              onClick={() => handleRestore(u.id)}
              title="Restaurar cuenta"
              className="btn"
              style={{
                padding: '6px',
                minWidth: 'auto',
                borderRadius: '8px',
                background: '#ECFDF5',
                borderColor: '#10B981',
                color: '#10B981',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RotateCcw size={15} />
            </button>
          ) : (
            <button
              onClick={() => handleSoftDelete(u.id)}
              title="Eliminar lógicamente"
              className="btn"
              style={{
                padding: '6px',
                minWidth: 'auto',
                borderRadius: '8px',
                background: '#FEF2F2',
                borderColor: '#FCA5A5',
                color: '#EF4444',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Componente: Modal de formulario para crear/editar usuario ──────────────
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
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: 0, maxWidth: '480px', overflow: 'hidden' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--brand-2) 100%)',
          color: '#ffffff',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Merriweather, serif' }}>
            {editandoId === null ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="usuarioNombre" className="form-label">
                Nombre Completo <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                id="usuarioNombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Ej. Juan Pérez"
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="usuarioEmail" className="form-label">
                Correo Electrónico <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                id="usuarioEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ejemplo@monteverde.edu.co"
                style={{ borderRadius: '8px' }}
              />
            </div>

            {editandoId === null && (
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="usuarioPassword" className="form-label">
                  Contraseña Temporal <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  id="usuarioPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  style={{ borderRadius: '8px' }}
                />
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="usuarioRol" className="form-label">
                Rol del Sistema <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <select
                id="usuarioRol"
                value={rolForm}
                onChange={(e) => setRolForm(e.target.value)}
                style={{ borderRadius: '8px' }}
              >
                <option value="admin">Administrador</option>
                <option value="docente">Docente</option>
                <option value="familia">Familia</option>
              </select>
            </div>

            {rolForm === 'familia' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="usuarioEstudiante" className="form-label">
                  Vincular Estudiante Asociado
                </label>
                <select
                  id="usuarioEstudiante"
                  value={estudianteId}
                  onChange={(e) => setEstudianteId(e.target.value)}
                  style={{ borderRadius: '8px' }}
                >
                  <option value="">-- Sin estudiante asignado --</option>
                  {estudiantes.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nombre} {est.curso ? `(${est.curso.nivel}${est.curso.letra})` : ''}
                    </option>
                  ))}
                </select>
                <small style={{ display: 'block', marginTop: '4px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  Las cuentas Familia ven reportes académicos del estudiante vinculado.
                </small>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                id="activoForm"
                checked={activoForm}
                onChange={(e) => setActivoForm(e.target.checked)}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <label htmlFor="activoForm" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Cuenta de usuario Activa (Permitir acceso inmediato)
              </label>
            </div>
          </div>

          <div style={{
            marginTop: '1.75rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: '1px solid var(--border)',
            paddingTop: '1.25rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn--secondary"
              style={{
                padding: '0.5rem 1.2rem',
                borderRadius: '8px',
                minWidth: 'auto'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '8px',
                minWidth: 'auto'
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
function PasswordModal({
  abierto,
  onClose,
  onSubmit,
  nuevoPassword,
  setNuevoPassword
}) {
  if (!abierto) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: 0, maxWidth: '400px', overflow: 'hidden' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--color-warning) 0%, #92400E 100%)',
          color: '#ffffff',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Merriweather, serif' }}>
            Restablecer Contraseña
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
              Ingresa una nueva contraseña para la cuenta seleccionada. El usuario usará esta clave en su próximo inicio de sesión.
            </p>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="nuevaPassword" className="form-label">
                Nueva Contraseña
              </label>
              <input
                id="nuevaPassword"
                type="password"
                value={nuevoPassword}
                onChange={(e) => setNuevoPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                style={{ borderRadius: '8px' }}
              />
            </div>
          </div>

          <div style={{
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: '1px solid var(--border)',
            paddingTop: '1.25rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn--secondary"
              style={{
                padding: '0.5rem 1.2rem',
                borderRadius: '8px',
                minWidth: 'auto'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '8px',
                minWidth: 'auto',
                background: 'var(--color-warning)',
                borderColor: 'var(--color-warning)'
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
function UsuarioHeader({ abrirModalCrear }) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '2rem',
      background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--brand-2) 100%)',
      padding: '1.5rem 2rem',
      borderRadius: '16px',
      color: '#ffffff',
      boxShadow: 'var(--shadow-lg)'
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#ffffff', fontWeight: 800, fontFamily: 'Merriweather, serif', letterSpacing: '-0.3px', border: 'none', padding: 0 }}>
          Administración de Usuarios
        </h1>
        <p style={{ margin: '5px 0 0', color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem', fontWeight: 500 }}>
          Crea, edita, cambia de estado o realiza restablecimiento de contraseñas de las cuentas.
        </p>
      </div>
      <button 
        onClick={abrirModalCrear}
        className="btn btn-primary btn-icon"
        style={{
          background: '#ffffff',
          color: 'var(--color-primary)',
          border: 'none',
          padding: '0.65rem 1.25rem',
          borderRadius: '10px',
          fontWeight: 700,
          fontSize: '0.85rem',
          cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.2s',
          minWidth: 'auto'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.background = 'var(--brand-light)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.background = '#ffffff';
        }}
      >
        <Plus size={16} strokeWidth={2.5} />
        <span>Nuevo Usuario</span>
      </button>
    </div>
  );
}

// ── Componente: Barra de filtros y búsqueda ──────────────────────────────────
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
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '1.25rem',
      marginBottom: '1.5rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="filtroBuscar" className="form-label">Buscar</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="filtroBuscar"
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagina(1); }}
              placeholder="Nombre o correo..."
              style={{
                paddingLeft: '2.5rem',
                borderRadius: '8px',
                width: '100%'
              }}
            />
            <Search size={15} style={{
              position: 'absolute',
              left: '0.85rem',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }} />
          </div>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="filtroRol" className="form-label">Filtrar por Rol</label>
          <select 
            id="filtroRol"
            value={rol} 
            onChange={(e) => { setRol(e.target.value); setPagina(1); }}
            style={{ borderRadius: '8px' }}
          >
            <option value="">Todos los Roles</option>
            <option value="admin">Administradores</option>
            <option value="docente">Docentes</option>
            <option value="familia">Familias</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="filtroEstado" className="form-label">Filtrar por Estado</label>
          <select 
            id="filtroEstado"
            value={activo} 
            onChange={(e) => { setActivo(e.target.value); setPagina(1); }}
            style={{ borderRadius: '8px' }}
          >
            <option value="">Todos los Estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="filtroLimite" className="form-label">Elementos por Página</label>
          <select 
            id="filtroLimite"
            value={limite} 
            onChange={(e) => { setLimite(Number.parseInt(e.target.value)); setPagina(1); }}
            style={{ borderRadius: '8px' }}
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
    <div className="table-container" style={{ margin: 0, borderRadius: 0, border: 'none', boxShadow: 'none' }}>
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              ID{_mostrarIndicadorOrden('id', orderBy, orderDirection)}
            </th>
            <th onClick={() => handleSort('nombre')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Nombre{_mostrarIndicadorOrden('nombre', orderBy, orderDirection)}
            </th>
            <th onClick={() => handleSort('email')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Email{_mostrarIndicadorOrden('email', orderBy, orderDirection)}
            </th>
            <th onClick={() => handleSort('rol')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Rol{_mostrarIndicadorOrden('rol', orderBy, orderDirection)}
            </th>
            <th>
              Vinculación
            </th>
            <th onClick={() => handleSort('activo')} style={{ cursor: 'pointer', userSelect: 'none' }}>
              Estado{_mostrarIndicadorOrden('activo', orderBy, orderDirection)}
            </th>
            <th>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
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
      borderTop: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'var(--table-header-bg)'
    }}>
      <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 550 }}>
        Mostrando <strong>{usuariosCount}</strong> de <strong>{total}</strong> usuarios registrados.
      </span>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          disabled={pagina === 1}
          onClick={() => setPagina(pagina - 1)}
          className="btn btn--secondary"
          style={{
            padding: '0.4rem 0.8rem',
            minWidth: 'auto',
            fontSize: '0.8rem',
            borderRadius: 'var(--radius-xs)'
          }}
        >
          Anterior
        </button>

        <span style={{ fontSize: '0.825rem', color: 'var(--text)', fontWeight: 700 }}>
          Página {pagina} de {paginasTotales}
        </span>

        <button
          disabled={pagina >= paginasTotales}
          onClick={() => setPagina(pagina + 1)}
          className="btn btn--secondary"
          style={{
            padding: '0.4rem 0.8rem',
            minWidth: 'auto',
            fontSize: '0.8rem',
            borderRadius: 'var(--radius-xs)'
          }}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

// ── Componente principal: Página de Administración de Usuarios ──────────────
export default function Usuarios() {
  const queryClient = useQueryClient();

  const [usuarios, setUsuarios] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [paginasTotales, setPaginasTotales] = useState(1);
  const [limite, setLimite] = useState(10);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [search, setSearch] = useState('');
  const [rol, setRol] = useState('');
  const [activo, setActivo] = useState('');
  const [orderBy, setOrderBy] = useState('nombre');
  const [orderDirection, setOrderDirection] = useState('ASC');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rolForm, setRolForm] = useState('familia');
  const [estudianteId, setEstudianteId] = useState('');
  const [activoForm, setActivoForm] = useState(true);

  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [passwordResetId, setPasswordResetId] = useState(null);
  const [nuevoPassword, setNuevoPassword] = useState('');

  const [estudiantes, setEstudiantes] = useState([]);

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

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const handleToggleEstado = async (id, activoActual) => {
    try {
      const nuevoEstado = !activoActual;
      const res = await cambiarEstadoUsuario(id, nuevoEstado);
      if (res.success) {
        _mostrarMensajeConTimeout(setSuccessMsg, res.message || 'Estado actualizado con éxito');
        queryClient.invalidateQueries({ queryKey: ['admin', 'docentes'] });
        setUsuarios(usuarios.map(u => u.id === id ? { ...u, activo: nuevoEstado } : u));
      }
    } catch (error) {
      console.error('Error al cambiar el estado del usuario:', error);
      _mostrarMensajeConTimeout(setErrorMsg, error?.message || 'Error al cambiar el estado del usuario.');
    }
  };

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
    setPassword('');
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
        <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{
            border: '4px solid var(--border)',
            borderTop: '4px solid var(--color-primary)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.25rem'
          }}></div>
          <span style={{ fontWeight: 600 }}>Cargando listado de usuarios...</span>
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
        <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <Users size={44} strokeWidth={1.5} />
          </div>
          <h3 style={{ margin: '1rem 0 0.5rem', color: 'var(--text)', fontFamily: 'Merriweather, serif' }}>No se encontraron usuarios</h3>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Intente cambiar los filtros o busque otro nombre.</p>
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
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <UsuarioHeader abrirModalCrear={abrirModalCrear} />

      {successMsg && (
        <div style={{
          background: '#DCFCE7',
          border: '1px solid #BBF7D0',
          color: '#166534',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          fontWeight: 600,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}
      
      {errorMsg && (
        <div style={{
          background: '#FFE4E6',
          border: '1px solid #FECDD3',
          color: '#9F1239',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          fontWeight: 600,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
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
      <div className="card" style={{ padding: 0, border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
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
