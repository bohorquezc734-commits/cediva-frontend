import {
  Package,
  LayoutDashboard,
  LogOut,
  Truck,
  History,
  Users,
  ScanBarcode,
  ClipboardCheck,
  UserCog
} from 'lucide-react';
import { ROLES_USUARIO } from '../constants/roles';
import { VISTAS_APP } from '../constants/navegacion';
import { etiquetaRolUsuario, type UsuarioInfoDto, type VistaActual } from '../types/cediva';

interface SidebarProps {
  readonly vistaActual: VistaActual;
  readonly usuario: UsuarioInfoDto;
  readonly onCambiarVista: (vista: VistaActual) => void;
  readonly onCerrarSesion: () => void;
}

export function Sidebar({
  vistaActual,
  usuario,
  onCambiarVista,
  onCerrarSesion,
}: SidebarProps) {
  const puedeVerGestionComercial =
    usuario.rol === ROLES_USUARIO.ADMINISTRADOR ||
    usuario.rol === ROLES_USUARIO.SUPERVISOR;
  const esAdministrador = usuario.rol === ROLES_USUARIO.ADMINISTRADOR;
  const esAuxiliarLogistico = usuario.rol === ROLES_USUARIO.AUXILIAR_LOGISTICO;

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="logo-container">
          <Package size={26} />
          <div className="logo-text-group">
            <span>CEDIVA</span>
            <span className="logo-subtitle">Sistema de Control Logístico</span>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{usuario.nombreCompleto}</div>
            <div className="sidebar-user-role">{etiquetaRolUsuario(usuario.rol)}</div>
          </div>

          <button
            type="button"
            className="btn-logout-mobile"
            onClick={onCerrarSesion}
            title="Cerrar Sesión"
            aria-label="Cerrar Sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegación principal">
        <button
          type="button"
          className={`nav-item ${vistaActual === VISTAS_APP.MUELLE ? 'active' : ''}`}
          onClick={() => onCambiarVista(VISTAS_APP.MUELLE)}
        >
          <ScanBarcode size={18} />
          <span>{esAuxiliarLogistico ? 'Alistamiento' : 'Verificación Muelle'}</span>
        </button>
        {esAdministrador && (
          <button
            type="button"
            className={`nav-item ${vistaActual === VISTAS_APP.USUARIOS ? 'active' : ''}`}
            onClick={() => onCambiarVista(VISTAS_APP.USUARIOS)}
          >
            <UserCog size={18} />
            <span>Usuarios</span>
          </button>
        )}

        {!esAuxiliarLogistico && (
          <button
            type="button"
            className={`nav-item ${vistaActual === VISTAS_APP.TRAZABILIDAD ? 'active' : ''}`}
            onClick={() => onCambiarVista(VISTAS_APP.TRAZABILIDAD)}
          >
            <ClipboardCheck size={18} />
            <span>Trazabilidad Muelle</span>
          </button>
        )}

        {!esAuxiliarLogistico && (
          <button
            type="button"
            className={`nav-item ${vistaActual === VISTAS_APP.INVENTARIO ? 'active' : ''}`}
            onClick={() => onCambiarVista(VISTAS_APP.INVENTARIO)}
          >
            <LayoutDashboard size={18} />
            <span>Inventario</span>
          </button>
        )}

        {puedeVerGestionComercial && (
          <>
            <button
              type="button"
              className={`nav-item ${vistaActual === VISTAS_APP.CLIENTES ? 'active' : ''}`}
              onClick={() => onCambiarVista(VISTAS_APP.CLIENTES)}
            >
              <Users size={18} />
              <span>Clientes</span>
            </button>

            <button
              type="button"
              className={`nav-item ${vistaActual === VISTAS_APP.DESPACHOS ? 'active' : ''}`}
              onClick={() => onCambiarVista(VISTAS_APP.DESPACHOS)}
            >
              <Truck size={18} />
              <span>Despachos</span>
            </button>

            <button
              type="button"
              className={`nav-item ${vistaActual === VISTAS_APP.HISTORIAL ? 'active' : ''}`}
              onClick={() => onCambiarVista(VISTAS_APP.HISTORIAL)}
            >
              <History size={18} />
              <span>Historial Despachos</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="nav-item" onClick={onCerrarSesion}>
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}