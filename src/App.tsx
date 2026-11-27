import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import './App.css';
import toast, { Toaster } from 'react-hot-toast';
import { api, extraerMensajeError } from './services/api';
import { ROLES_USUARIO } from './constants/roles';
import { ESTADOS_MUELLE, MENSAJES_MUELLE } from './constants/muelle';
import { VISTAS_APP } from './constants/navegacion';
import { INTERVALOS_OPERACION_MS } from './constants/operacion';
import {
  fusionarOrdenesMuelle,
  mapearOrdenFacturaMuelle,
  obtenerRegresionesEstadoMuelle,
} from './services/muelleSync';
import { etiquetaRolUsuario, normalizarRolUsuario } from './types/cediva';
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
  Producto,
  UsuarioInfoApiDto,
  UsuarioInfoDto,
  VistaActual,
} from './types/cediva';

const STORAGE_TOKEN_KEY = 'cediva_token';
const STORAGE_USER_KEY = 'cediva_usuario';

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

  const infoAuditoria = `Auditó: ${fac.auditadoPor ?? MENSAJES_MUELLE.AUDITOR_PREDETERMINADO} (${fac.horaAuditoria ?? MENSAJES_MUELLE.HORA_NO_DISPONIBLE})`;
  const infoDespacho =
    fac.estado === ESTADOS_MUELLE.DESPACHADA && fac.datosTransporte
      ? ` | Despachó: ${fac.despachadoPor ?? MENSAJES_MUELLE.AUDITOR_PREDETERMINADO} (${fac.horaDespacho ?? MENSAJES_MUELLE.HORA_NO_DISPONIBLE}) · ${fac.datosTransporte.transportadora} (${fac.datosTransporte.placaVehiculo}) · Cond.: ${fac.datosTransporte.conductorNombre}`
      : ' | [AUDITADA — PENDIENTE DESPACHO]';
  const fechaRegistro = fac.fechaDespacho?.trim() || fac.fechaCreacion?.trim() || '';

  return {
    id: fac.id,
    cliente: `${fac.numeroFactura} — ${fac.clienteNombre} (${fac.muelle}) | ${infoAuditoria}${infoDespacho}`,
    fecha: fechaRegistro,
    items,
  };
}

function leerUsuarioGuardado(): UsuarioInfoDto | null {
  const token = localStorage.getItem(STORAGE_TOKEN_KEY);
  const rawUser = localStorage.getItem(STORAGE_USER_KEY);
  if (!token || !rawUser) return null;

  try {
    const usuarioGuardado = JSON.parse(rawUser) as UsuarioInfoApiDto;
    return {
      ...usuarioGuardado,
      rol: normalizarRolUsuario(usuarioGuardado.rol),
    };
  } catch {
    return null;
  }
}

function obtenerVistaInicial(usuario: UsuarioInfoDto | null): VistaActual {
  return usuario?.rol === ROLES_USUARIO.AUDITOR_BODEGA ||
    usuario?.rol === ROLES_USUARIO.AUXILIAR_LOGISTICO
    ? VISTAS_APP.MUELLE
    : VISTAS_APP.INVENTARIO;
}

function obtenerNombreVisibleUsuario(usuario: UsuarioInfoDto | null): string {
  if (!usuario) return 'Usuario CEDIVA';
  return usuario.nombreCompleto?.trim() || usuario.email || etiquetaRolUsuario(usuario.rol);
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
  const facturasMuelleRef = useRef(facturasMuelle);
  const avisosRegresionRef = useRef(new Set<string>());
  const errorSincronizacionNotificadoRef = useRef(false);

  useEffect(() => {
    facturasMuelleRef.current = facturasMuelle;
  }, [facturasMuelle]);

  const notificarErrorSincronizacion = useCallback((err: unknown) => {
    if (errorSincronizacionNotificadoRef.current) return;
    errorSincronizacionNotificadoRef.current = true;
    const mensaje = err instanceof Error
      ? err.message
      : 'No se pudieron sincronizar las órdenes de muelle.';
    toast.error(extraerMensajeError(err, mensaje));
  }, []);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setUsuario(null);
    setProductos([]);
    setClientes([]);
    setDespachosHistorial([]);
    setFacturasMuelle([]);
    setVistaActual(VISTAS_APP.INVENTARIO);
    toast.success('Sesión cerrada');
  }, []);

  const sincronizarOrdenesMuelle = useCallback(async () => {
    if (!usuario) return;
    const resMuelle = await api.get<unknown>('/MuelleControlador');
    if (!Array.isArray(resMuelle.data)) {
      throw new Error('La respuesta de órdenes de muelle no es una lista.');
    }
    const ordenesApi = resMuelle.data.map(mapearOrdenFacturaMuelle);
    const regresiones = obtenerRegresionesEstadoMuelle(ordenesApi, facturasMuelleRef.current);
    const regresionesActuales = new Set(
      regresiones.map((r) => `${r.id}:${r.estadoLocal}:${r.estadoRemoto}`)
    );

    for (const regresion of regresiones) {
      const clave = `${regresion.id}:${regresion.estadoLocal}:${regresion.estadoRemoto}`;
      if (avisosRegresionRef.current.has(clave)) continue;
      avisosRegresionRef.current.add(clave);
      toast.error(
        `El servidor aún reporta ${regresion.estadoRemoto} para ${regresion.factura}; se conserva ${regresion.estadoLocal} localmente mientras sincroniza.`
      );
    }

    for (const clave of avisosRegresionRef.current) {
      if (!regresionesActuales.has(clave)) avisosRegresionRef.current.delete(clave);
    }

    setFacturasMuelle((prev) => fusionarOrdenesMuelle(ordenesApi, prev));
    errorSincronizacionNotificadoRef.current = false;
  }, [usuario]);

  const sincronizarEnSegundoPlano = useCallback(() => {
    void sincronizarOrdenesMuelle().catch((err: unknown) => {
      notificarErrorSincronizacion(err);
    });
  }, [sincronizarOrdenesMuelle, notificarErrorSincronizacion]);

  const cargarDatos = useCallback(async () => {
    if (!usuario) return;

    let falloSincronizacionMuelle = false;
    try {
      setCargando(true);
      const puedeVerComercial =
        usuario.rol === ROLES_USUARIO.ADMINISTRADOR ||
        usuario.rol === ROLES_USUARIO.SUPERVISOR;

      const [resProductos, resInventarios] = await Promise.all([
        api.get<Omit<Producto, 'stock'>[]>('/ProductoControlador'),
        api.get<InventarioDto[]>('/InventarioControlador'),
      ]);

      const productosConStock: Producto[] = resProductos.data.map((prod) => {
        const inventario = resInventarios.data.find((inv) => inv.productoId === prod.id);
        return { ...prod, stock: inventario ? inventario.stock : 0 };
      });

      setProductos(productosConStock);
      try {
        await sincronizarOrdenesMuelle();
      } catch (err) {
        falloSincronizacionMuelle = true;
        throw err;
      }

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
      if (falloSincronizacionMuelle) {
        notificarErrorSincronizacion(err);
        return;
      }
      toast.error(extraerMensajeError(err, 'Error al cargar los datos'));
    } finally {
      setCargando(false);
    }
  }, [usuario, cerrarSesion, sincronizarOrdenesMuelle, notificarErrorSincronizacion]);

  useEffect(() => {
    if (usuario) {
      void cargarDatos();
    }
  }, [usuario, cargarDatos]);

  // === SINCRONIZACIÓN AUTOMÁTICA ENTRE PC Y CELULAR CADA 5 SEGUNDOS ===
  useEffect(() => {
    if (!usuario) return;

    const intervalo = window.setInterval(() => {
      sincronizarEnSegundoPlano();
    }, INTERVALOS_OPERACION_MS.SINCRONIZACION_MUELLE);

    return () => window.clearInterval(intervalo);
  }, [usuario, sincronizarEnSegundoPlano]);

  useEffect(() => {
    if (
      usuario &&
      (vistaActual === VISTAS_APP.MUELLE || vistaActual === VISTAS_APP.TRAZABILIDAD)
    ) {
      sincronizarEnSegundoPlano();
    }
  }, [usuario, vistaActual, sincronizarEnSegundoPlano]);

  const historialCombinado = useMemo(() => {
    const registrosMuelle = facturasMuelle
      .filter((fac) =>
        fac.estado === ESTADOS_MUELLE.AUDITADA_LISTA_DESPACHO ||
        fac.estado === ESTADOS_MUELLE.DESPACHADA
      )
      .map((fac) => construirRegistroHistorialMuelle(fac, productos));

    return [...registrosMuelle, ...despachosHistorial];
  }, [facturasMuelle, productos, despachosHistorial]);

  const handleLoginExitoso = (sesion: LoginResponseDto) => {
    const usuarioSesion: UsuarioInfoDto = {
      ...sesion.usuario,
      rol: normalizarRolUsuario(sesion.usuario.rol),
    };
    localStorage.setItem(STORAGE_TOKEN_KEY, sesion.token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(usuarioSesion));
    setUsuario(usuarioSesion);
    setVistaActual(obtenerVistaInicial(usuarioSesion));
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
  const esAuxiliarLogistico = usuario.rol === ROLES_USUARIO.AUXILIAR_LOGISTICO;
  const puedeVerGestionComercial =
    usuario.rol === ROLES_USUARIO.ADMINISTRADOR ||
    usuario.rol === ROLES_USUARIO.SUPERVISOR;
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
        {vistaActual === VISTAS_APP.MUELLE && (
          <VerificacionMuelleView
            productos={productos}
            facturas={facturasMuelle}
            onCambiarFacturas={setFacturasMuelle}
            auditorNombre={`${nombreVisible} · ${etiquetaRolUsuario(usuario.rol)}`}
            usuarioRol={usuario.rol}
            onRecargarDatos={cargarDatos}
            onSincronizarOrdenesMuelle={sincronizarOrdenesMuelle}
            onIrATrazabilidad={
              esAuxiliarLogistico
                ? undefined
                : () => setVistaActual(VISTAS_APP.TRAZABILIDAD)
            }
          />
        )}
        {vistaActual === VISTAS_APP.USUARIOS &&
          usuario.rol === ROLES_USUARIO.ADMINISTRADOR && (
          <UsuariosView usuarioActualEmail={usuario.email} />
        )}

        {vistaActual === VISTAS_APP.TRAZABILIDAD && !esAuxiliarLogistico && (
          <TrazabilidadMuelleView
            facturas={facturasMuelle}
            onCambiarFacturas={setFacturasMuelle}
            usuarioNombre={`${nombreVisible} · ${etiquetaRolUsuario(usuario.rol)}`}
            onSincronizarOrdenesMuelle={sincronizarOrdenesMuelle}
          />
        )}

        {vistaActual === VISTAS_APP.INVENTARIO && !esAuxiliarLogistico && (
          <InventarioView
            productos={productos}
            cargando={cargando}
            puedeCrearProducto={usuario.rol === ROLES_USUARIO.ADMINISTRADOR}
            usuarioRol={usuario.rol}
            onRecargarDatos={cargarDatos}
          />
        )}

        {vistaActual === VISTAS_APP.CLIENTES && puedeVerGestionComercial && (
          <ClientesView
            clientes={clientes}
            cargando={cargando}
            onRecargarDatos={cargarDatos}
          />
        )}

        {vistaActual === VISTAS_APP.DESPACHOS && puedeVerGestionComercial && (
          <DespachosView
            productos={productos}
            clientes={clientes}
            onRecargarDatos={cargarDatos}
          />
        )}

        {vistaActual === VISTAS_APP.HISTORIAL && puedeVerGestionComercial && (
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