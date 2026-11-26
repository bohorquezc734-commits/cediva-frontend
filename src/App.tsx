import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import './App.css';
import toast, { Toaster } from 'react-hot-toast';
import { api, extraerMensajeError } from './services/api';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './views/LoginView';
import { InventarioView } from './views/InventarioView';
import { ClientesView } from './views/ClientesView';
import { DespachosView } from './views/DespachosView';
import { HistorialView } from './views/HistorialView';
import { VerificacionMuelleView } from './views/VerificacionMuelleView';
import { TrazabilidadMuelleView } from './views/TrazabilidadMuelleView';
import { UsuariosView } from './views/UsuariosView';
import type {
  ClienteDto,
  DespachoHistorialDto,
  InventarioDto,
  LoginResponseDto,
  OrdenFacturaMuelle,
  OrdenFacturaMuelleApiDto,
  Producto,
  UsuarioInfoDto,
  VistaActual,
} from './types/cediva';

const STORAGE_TOKEN_KEY = 'cediva_token';
const STORAGE_USER_KEY = 'cediva_usuario';

function mapearOrdenDtoAFrontend(dto: OrdenFacturaMuelleApiDto): OrdenFacturaMuelle {
  const tieneTransporte =
    Boolean(dto.transportadora) || Boolean(dto.placaVehiculo) || Boolean(dto.conductor);

  return {
    id: dto.id,
    numeroFactura: dto.numeroFactura,
    clienteNombre: dto.clienteNombre,
    clienteNit: dto.clienteNit,
    muelle: dto.muelle,
    estado: dto.estado,
    auditadoPor: dto.auditadoPor ?? undefined,
    horaAuditoria: dto.horaAuditoria ?? undefined,
    despachadoPor: dto.despachadoPor ?? undefined,
    horaDespacho: dto.horaDespacho ?? undefined,
    datosTransporte: tieneTransporte
      ? {
          transportadora: dto.transportadora ?? '',
          placaVehiculo: dto.placaVehiculo ?? '',
          conductorNombre: dto.conductor ?? '',
        }
      : undefined,
    lineas: dto.lineas.map((l) => ({
      codigoBarras: l.codigoBarras,
      cantidadPedida: l.cantidadPedida,
      cantidadPistoleada: l.cantidadPistoleada,
    })),
  };
}

function fusionarLineasPendientes(
  lineasRemotas: OrdenFacturaMuelle['lineas'],
  lineasLocales: OrdenFacturaMuelle['lineas']
): OrdenFacturaMuelle['lineas'] {
  return lineasRemotas.map((lineaRemota) => {
    const lineaLocal = lineasLocales.find(
      (l) => l.codigoBarras === lineaRemota.codigoBarras
    );
    if (!lineaLocal) return lineaRemota;

    return {
      ...lineaRemota,
      cantidadPistoleada: Math.max(
        lineaRemota.cantidadPistoleada,
        lineaLocal.cantidadPistoleada
      ),
    };
  });
}

function fusionarOrdenesMuelle(
  ordenesRemotas: OrdenFacturaMuelle[],
  ordenesPrevias: OrdenFacturaMuelle[]
): OrdenFacturaMuelle[] {
  return ordenesRemotas.map((remota) => {
    if (remota.estado !== 'pendiente') return remota;
    const local = ordenesPrevias.find(
      (p) => p.id === remota.id && p.estado === 'pendiente'
    );
    if (!local) return remota;

    return {
      ...remota,
      lineas: fusionarLineasPendientes(remota.lineas, local.lineas),
    };
  });
}

function construirRegistroHistorialMuelle(
  fac: OrdenFacturaMuelle,
  productos: readonly Producto[]
): DespachoHistorialDto {
  const items = fac.lineas
    .map((linea) => {
      const prod = productos.find(
        (p) => p.codigoBarras.trim() === linea.codigoBarras.trim()
      );
      if (!prod) return null;
      return {
        productoId: prod.id,
        cantidad: linea.cantidadPedida,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const infoAuditoria = `Auditó: ${fac.auditadoPor ?? 'Auditor'} (${fac.horaAuditoria ?? '--:--:--'})`;
  const infoDespacho =
    fac.estado === 'despachada' && fac.datosTransporte
      ? ` | Despachó: ${fac.despachadoPor ?? 'Auditor'} (${fac.horaDespacho ?? '--:--:--'}) · ${fac.datosTransporte.transportadora} (${fac.datosTransporte.placaVehiculo}) · Cond.: ${fac.datosTransporte.conductorNombre}`
      : ' | [AUDITADA — PENDIENTE DESPACHO]';

  return {
    id: fac.id,
    cliente: `${fac.numeroFactura} — ${fac.clienteNombre} (${fac.muelle}) | ${infoAuditoria}${infoDespacho}`,
    fecha: new Date().toISOString(),
    items,
  };
}

function leerUsuarioGuardado(): UsuarioInfoDto | null {
  const token = localStorage.getItem(STORAGE_TOKEN_KEY);
  const rawUser = localStorage.getItem(STORAGE_USER_KEY);
  if (!token || !rawUser) return null;

  try {
    return JSON.parse(rawUser) as UsuarioInfoDto;
  } catch {
    return null;
  }
}

function obtenerVistaInicial(usuario: UsuarioInfoDto | null): VistaActual {
  return usuario?.rol === 'AuditorBodega' ? 'muelle' : 'inventario';
}

function obtenerNombreVisibleUsuario(usuario: UsuarioInfoDto | null): string {
  if (!usuario) return 'Usuario CEDIVA';
  return usuario.nombreCompleto?.trim() || usuario.email || usuario.rol || 'Usuario CEDIVA';
}

function App() {
  const [usuario, setUsuario] = useState<UsuarioInfoDto | null>(() => leerUsuarioGuardado());
  const [vistaActual, setVistaActual] = useState<VistaActual>(() =>
    obtenerVistaInicial(leerUsuarioGuardado())
  );
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [despachosHistorial, setDespachosHistorial] = useState<DespachoHistorialDto[]>([]);
  const [facturasMuelle, setFacturasMuelle] = useState<OrdenFacturaMuelle[]>([]);
  const [cargando, setCargando] = useState(false);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setUsuario(null);
    setProductos([]);
    setClientes([]);
    setDespachosHistorial([]);
    setFacturasMuelle([]);
    setVistaActual('inventario');
    toast.success('Sesión cerrada');
  }, []);

  const sincronizarOrdenesMuelle = useCallback(async () => {
    if (!usuario) return;
    const resMuelle = await api.get<OrdenFacturaMuelleApiDto[]>('/MuelleControlador');
    const ordenesApi = resMuelle.data.map(mapearOrdenDtoAFrontend);
    setFacturasMuelle((prev) => fusionarOrdenesMuelle(ordenesApi, prev));
  }, [usuario]);

  const cargarDatos = useCallback(async () => {
    if (!usuario) return;

    try {
      setCargando(true);
      const puedeVerComercial =
        usuario.rol === 'Administrador' || usuario.rol === 'Supervisor';

      const [resProductos, resInventarios] = await Promise.all([
        api.get<Omit<Producto, 'stock'>[]>('/ProductoControlador'),
        api.get<InventarioDto[]>('/InventarioControlador'),
      ]);

      const productosConStock: Producto[] = resProductos.data.map((prod) => {
        const inventario = resInventarios.data.find((inv) => inv.productoId === prod.id);
        return { ...prod, stock: inventario ? inventario.stock : 0 };
      });

      setProductos(productosConStock);
      await sincronizarOrdenesMuelle();

      if (puedeVerComercial) {
        const [resClientes, resDespachos] = await Promise.all([
          api.get<ClienteDto[]>('/ClienteControlador'),
          api.get<DespachoHistorialDto[]>('/DespachoControlador'),
        ]);
        setClientes(resClientes.data);
        setDespachosHistorial(resDespachos.data);
      } else {
        setClientes([]);
        setDespachosHistorial([]);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        cerrarSesion();
        toast.error('Tu sesión expiró. Inicia sesión nuevamente.');
        return;
      }
      toast.error(extraerMensajeError(err, 'Error al cargar los datos'));
    } finally {
      setCargando(false);
    }
  }, [usuario, cerrarSesion, sincronizarOrdenesMuelle]);

  useEffect(() => {
    if (usuario) {
      void cargarDatos();
    }
  }, [usuario, cargarDatos]);

  // === SINCRONIZACIÓN AUTOMÁTICA ENTRE PC Y CELULAR CADA 5 SEGUNDOS ===
  useEffect(() => {
    if (!usuario) return;

    const intervalo = window.setInterval(() => {
      void sincronizarOrdenesMuelle().catch(() => {});
    }, 5000);

    return () => window.clearInterval(intervalo);
  }, [usuario, sincronizarOrdenesMuelle]);

  useEffect(() => {
    if (usuario && (vistaActual === 'muelle' || vistaActual === 'trazabilidad')) {
      void sincronizarOrdenesMuelle().catch(() => {});
    }
  }, [usuario, vistaActual, sincronizarOrdenesMuelle]);

  const historialCombinado = useMemo(() => {
    const registrosMuelle = facturasMuelle
      .filter((fac) => fac.estado !== 'pendiente')
      .map((fac) => construirRegistroHistorialMuelle(fac, productos));

    return [...registrosMuelle, ...despachosHistorial];
  }, [facturasMuelle, productos, despachosHistorial]);

  const handleLoginExitoso = (sesion: LoginResponseDto) => {
    localStorage.setItem(STORAGE_TOKEN_KEY, sesion.token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(sesion.usuario));
    setUsuario(sesion.usuario);
    setVistaActual(obtenerVistaInicial(sesion.usuario));
  };

  if (!usuario) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginView onLoginExitoso={handleLoginExitoso} />
      </>
    );
  }

  const nombreVisible = obtenerNombreVisibleUsuario(usuario);
  return (
    <div className="app-container">
      <Toaster position="top-right" />

      <Sidebar
        vistaActual={vistaActual}
        usuario={{
          ...usuario,
          nombreCompleto: nombreVisible,
        }}
        onCambiarVista={setVistaActual}
        onCerrarSesion={cerrarSesion}
      />

      <main className="main-content">
        {vistaActual === 'muelle' && (
          <VerificacionMuelleView
            productos={productos}
            facturas={facturasMuelle}
            onCambiarFacturas={setFacturasMuelle}
            auditorNombre={`${nombreVisible} · ${usuario.rol}`}
            usuarioRol={usuario.rol}
            onRecargarDatos={cargarDatos}
            onIrATrazabilidad={() => setVistaActual('trazabilidad')}
          />
        )}
        {vistaActual === 'usuarios' && usuario.rol === 'Administrador' && (
          <UsuariosView usuarioActualEmail={usuario.email} />
        )}

        {vistaActual === 'trazabilidad' && (
          <TrazabilidadMuelleView
            facturas={facturasMuelle}
            onCambiarFacturas={setFacturasMuelle}
            usuarioNombre={`${nombreVisible} · ${usuario.rol}`}
            onRecargarDatos={cargarDatos}
          />
        )}

        {vistaActual === 'inventario' && (
          <InventarioView
            productos={productos}
            cargando={cargando}
            puedeCrearProducto={usuario.rol === 'Administrador'}
            onRecargarDatos={cargarDatos}
          />
        )}

        {vistaActual === 'clientes' && (
          <ClientesView
            clientes={clientes}
            cargando={cargando}
            onRecargarDatos={cargarDatos}
          />
        )}

        {vistaActual === 'despachos' && (
          <DespachosView
            productos={productos}
            clientes={clientes}
            onRecargarDatos={cargarDatos}
          />
        )}

        {vistaActual === 'historial' && (
          <HistorialView
            despachosHistorial={historialCombinado}
            productos={productos}
          />
        )}
      </main>
    </div>
  );
}

export default App;