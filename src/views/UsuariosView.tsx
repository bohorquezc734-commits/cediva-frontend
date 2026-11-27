import { useCallback, useEffect, useMemo, useState, type SubmitEvent } from 'react';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Search,
  Shield,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, extraerMensajeError } from '../services/api';
import {
  ETIQUETAS_ROL_USUARIO,
  type IdRolUsuario,
  IDS_ROL_USUARIO,
  ROLES_USUARIO,
} from '../constants/roles';
import { CONFIGURACION_PAGINACION } from '../constants/operacion';
import { PaginacionTabla } from '../components/PaginacionTabla';
import {
  etiquetaRolUsuario,
  normalizarRolUsuario,
  type RolUsuario,
  type UsuarioListadoApiDto,
  type UsuarioListadoDto,
} from '../types/cediva';

interface UsuariosViewProps {
  readonly usuarioActualEmail?: string;
}

const OPCIONES_ROL: readonly { readonly valor: IdRolUsuario; readonly etiqueta: string }[] = [
  {
    valor: IDS_ROL_USUARIO.AUXILIAR_LOGISTICO,
    etiqueta: `${ETIQUETAS_ROL_USUARIO[ROLES_USUARIO.AUXILIAR_LOGISTICO]} (Alistamiento y Envío a Muelle)`,
  },
  {
    valor: IDS_ROL_USUARIO.AUDITOR_BODEGA,
    etiqueta: `${ETIQUETAS_ROL_USUARIO[ROLES_USUARIO.AUDITOR_BODEGA]} (Pistoleo RF y Despacho)`,
  },
  {
    valor: IDS_ROL_USUARIO.SUPERVISOR,
    etiqueta: `${ETIQUETAS_ROL_USUARIO[ROLES_USUARIO.SUPERVISOR]} (Facturas, Trazabilidad y Clientes)`,
  },
  {
    valor: IDS_ROL_USUARIO.ADMINISTRADOR,
    etiqueta: `${ETIQUETAS_ROL_USUARIO[ROLES_USUARIO.ADMINISTRADOR]} (Control Total y Personal)`,
  },
];

function obtenerEstiloRol(rol: RolUsuario): { bg: string; color: string; etiqueta: string } {
  if (rol === ROLES_USUARIO.AUXILIAR_LOGISTICO) {
    return { bg: '#ffedd5', color: '#c2410c', etiqueta: etiquetaRolUsuario(rol) };
  }
  if (rol === ROLES_USUARIO.ADMINISTRADOR) {
    return { bg: '#ede9fe', color: '#6d28d9', etiqueta: etiquetaRolUsuario(rol) };
  }
  if (rol === ROLES_USUARIO.SUPERVISOR) {
    return { bg: '#e0f2fe', color: '#0369a1', etiqueta: etiquetaRolUsuario(rol) };
  }
  return { bg: '#dcfce7', color: '#15803d', etiqueta: etiquetaRolUsuario(rol) };
}

interface ModalRegistrarUsuarioProps {
  readonly abierto: boolean;
  readonly onCerrar: () => void;
  readonly onRegistrado: () => Promise<void>;
}

function ModalRegistrarUsuario({
  abierto,
  onCerrar,
  onRegistrado,
}: ModalRegistrarUsuarioProps) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<number>(3);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [guardando, setGuardando] = useState(false);

  if (!abierto) return null;

  const limpiarYCerrar = () => {
    setNombreCompleto('');
    setEmail('');
    setPassword('');
    setRol(3);
    setMostrarPassword(false);
    onCerrar();
  };

  const registrarUsuario = async () => {
    const nombreLimpio = nombreCompleto.trim();
    const emailLimpio = email.trim().toLowerCase();

    if (!nombreLimpio || !emailLimpio || password.length < 6) {
      toast.error('Completa todos los campos (contraseña mínimo 6 caracteres).');
      return;
    }

    try {
      setGuardando(true);
      await api.post('/AuthControlador/registrar', {
        nombreCompleto: nombreLimpio,
        email: emailLimpio,
        password,
        rol,
      });

      toast.success(`Usuario ${nombreLimpio} registrado exitosamente.`);
      await onRegistrado();
      limpiarYCerrar();
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No se pudo registrar el usuario.'));
    } finally {
      setGuardando(false);
    }
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    void registrarUsuario();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px' }}>Registrar Personal de Bodega</h2>
          <button
            type="button"
            onClick={limpiarYCerrar}
            aria-label="Cerrar modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="usr-nombre">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} />
                <span>Nombre completo</span>
              </span>
            </label>
            <input
              id="usr-nombre"
              type="text"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Ej: Laura Martínez"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="usr-email">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={15} />
                <span>Correo electrónico</span>
              </span>
            </label>
            <input
              id="usr-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="laura.martinez@cediva.com"
              autoComplete="off"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="usr-password">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={15} />
                <span>Contraseña inicial</span>
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="usr-password"
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres (ej: Bodega2026*)"
                autoComplete="new-password"
                minLength={6}
                style={{ paddingRight: '42px' }}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((prev) => !prev)}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  padding: '4px',
                }}
              >
                {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="usr-rol">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={15} />
                <span>Rol operativo</span>
              </span>
            </label>
            <select
              id="usr-rol"
              value={rol}
              onChange={(e) => setRol(Number(e.target.value))}
            >
              {OPCIONES_ROL.map((op) => (
                <option key={op.valor} value={op.valor}>
                  {op.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              onClick={limpiarYCerrar}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={guardando}>
              <UserPlus size={18} />
              <span>{guardando ? 'Registrando...' : 'Crear Cuenta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UsuariosView({ usuarioActualEmail }: UsuariosViewProps) {
  const [usuarios, setUsuarios] = useState<UsuarioListadoDto[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState<number>(
    CONFIGURACION_PAGINACION.PAGINA_INICIAL
  );
  const [tamanoPagina, setTamanoPagina] = useState<number>(
    CONFIGURACION_PAGINACION.TAMANO_PAGINA
  );
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargarUsuarios = useCallback(async () => {
    try {
      setCargando(true);
      const { data } = await api.get<UsuarioListadoApiDto[]>('/AuthControlador/usuarios');
      setUsuarios(data.map((usuario): UsuarioListadoDto => ({
        ...usuario,
        rol: normalizarRolUsuario(usuario.rol),
      })));
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No se pudo cargar el listado de usuarios.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarUsuarios();
  }, [cargarUsuarios]);

  const resumen = useMemo(() => {
    let administradores = 0;
    let supervisores = 0;
    let auditores = 0;
    let auxiliares = 0;

    for (const u of usuarios) {
      const rol = u.rol;
      if (rol === ROLES_USUARIO.ADMINISTRADOR) administradores += 1;
      else if (rol === ROLES_USUARIO.SUPERVISOR) supervisores += 1;
      else if (rol === ROLES_USUARIO.AUXILIAR_LOGISTICO) auxiliares += 1;
      else auditores += 1;
    }

    return { total: usuarios.length, administradores, supervisores, auditores, auxiliares };
  }, [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return usuarios;

    return usuarios.filter((u) => {
      const rol = `${u.rol} ${etiquetaRolUsuario(u.rol)}`.toLowerCase();
      return (
        u.nombreCompleto.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        rol.includes(q)
      );
    });
  }, [usuarios, busqueda]);

  const totalPaginas = Math.max(
    CONFIGURACION_PAGINACION.MINIMO_TOTAL_PAGINAS,
    Math.ceil(usuariosFiltrados.length / tamanoPagina)
  );
  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * tamanoPagina;
    return usuariosFiltrados.slice(inicio, inicio + tamanoPagina);
  }, [usuariosFiltrados, paginaSegura, tamanoPagina]);

  const handleCambioBusqueda = (valor: string) => {
    setBusqueda(valor);
    setPaginaActual(CONFIGURACION_PAGINACION.PAGINA_INICIAL);
  };

  const handleCambioTamano = (nuevoTamano: number) => {
    setTamanoPagina(nuevoTamano);
    setPaginaActual(CONFIGURACION_PAGINACION.PAGINA_INICIAL);
  };

  return (
    <>
      <div className="header-action">
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>
            Gestión de Personal y Roles
          </h1>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>
            Crea y administra cuentas para auxiliares logísticos, auditores, supervisores y administradores
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setModalAbierto(true)}
        >
          <UserPlus size={18} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Total Personal</div>
          <div className="kpi-value">{resumen.total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Auditores Bodega</div>
          <div className="kpi-value" style={{ color: '#16a34a' }}>
            {resumen.auditores}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Auxiliares Logísticos</div>
          <div className="kpi-value" style={{ color: '#c2410c' }}>
            {resumen.auxiliares}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Supervisores / Admins</div>
          <div className="kpi-value" style={{ color: '#0284c7' }}>
            {resumen.supervisores + resumen.administradores}
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="search-bar">
          <Search size={18} color="#64748b" />
          <input
            type="text"
            className="search-input"
            value={busqueda}
            onChange={(e) => handleCambioBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo o rol..."
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Correo Electrónico</th>
              <th>Rol</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {cargando && usuarios.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                  Cargando personal de bodega...
                </td>
              </tr>
            )}

            {!cargando && usuariosPaginados.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                  No se encontraron usuarios con ese criterio.
                </td>
              </tr>
            )}

            {usuariosPaginados.map((u) => {
              const badge = obtenerEstiloRol(u.rol);
              const esSesionActual =
                Boolean(usuarioActualEmail) &&
                u.email.toLowerCase() === usuarioActualEmail?.toLowerCase();
              const activo = u.estaActivo ?? true;

              return (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>
                    <span>{u.nombreCompleto}</span>
                    {esSesionActual && (
                      <span
                        style={{
                          marginLeft: '8px',
                          fontSize: '11px',
                          padding: '2px 7px',
                          borderRadius: '999px',
                          background: '#f1f5f9',
                          color: '#475569',
                          fontWeight: 600,
                        }}
                      >
                        Tú
                      </span>
                    )}
                  </td>
                  <td style={{ color: '#475569' }}>{u.email}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: badge.bg,
                        color: badge.color,
                      }}
                    >
                      {badge.etiqueta}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: activo ? '#dcfce7' : '#fee2e2',
                        color: activo ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <PaginacionTabla
          paginaActual={paginaSegura}
          totalItems={usuariosFiltrados.length}
          tamanoPagina={tamanoPagina}
          onCambiarPagina={setPaginaActual}
          onCambiarTamano={handleCambioTamano}
        />
      </div>

      <ModalRegistrarUsuario
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onRegistrado={cargarUsuarios}
      />
    </>
  );
}