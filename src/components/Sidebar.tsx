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
import type { UsuarioInfoDto, VistaActual } from '../types/cediva';

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
    usuario.rol === 'Administrador' || usuario.rol === 'Supervisor';


    const esAdministrador = usuario.rol === 'Administrador';

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
            <div className="sidebar-user-role">{usuario.rol}</div>
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
          className={`nav-item ${vistaActual === 'muelle' ? 'active' : ''}`}
          onClick={() => onCambiarVista('muelle')}
        >
          <ScanBarcode size={18} />
          <span>Verificación Muelle</span>
        </button>
        {esAdministrador && (
          <button
            type="button"
            className={`nav-item ${vistaActual === 'usuarios' ? 'active' : ''}`}
            onClick={() => onCambiarVista('usuarios')}
          >
            <UserCog size={18} />
            <span>Usuarios</span>
          </button>
        )}

        <button
          type="button"
          className={`nav-item ${vistaActual === 'trazabilidad' ? 'active' : ''}`}
          onClick={() => onCambiarVista('trazabilidad')}
        >
          <ClipboardCheck size={18} />
          <span>Trazabilidad Muelle</span>
        </button>

        <button
          type="button"
          className={`nav-item ${vistaActual === 'inventario' ? 'active' : ''}`}
          onClick={() => onCambiarVista('inventario')}
        >
          <LayoutDashboard size={18} />
          <span>Inventario</span>
        </button>

        {puedeVerGestionComercial && (
          <>
            <button
              type="button"
              className={`nav-item ${vistaActual === 'clientes' ? 'active' : ''}`}
              onClick={() => onCambiarVista('clientes')}
            >
              <Users size={18} />
              <span>Clientes</span>
            </button>

            <button
              type="button"
              className={`nav-item ${vistaActual === 'despachos' ? 'active' : ''}`}
              onClick={() => onCambiarVista('despachos')}
            >
              <Truck size={18} />
              <span>Despachos</span>
            </button>

            <button
              type="button"
              className={`nav-item ${vistaActual === 'historial' ? 'active' : ''}`}
              onClick={() => onCambiarVista('historial')}
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