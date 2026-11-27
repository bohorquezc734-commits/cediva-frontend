import { useMemo, useState, type SyntheticEvent } from 'react';
import { CheckCircle2, ClipboardCheck, Clock, Search, Truck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, extraerMensajeError } from '../services/api';
import {
  ESTADOS_MUELLE,
  FILTROS_TRAZABILIDAD_MUELLE,
  MENSAJES_MUELLE,
  type FiltroTrazabilidadMuelle,
} from '../constants/muelle';
import { CONFIGURACION_PAGINACION } from '../constants/operacion';
import { PaginacionTabla } from '../components/PaginacionTabla';
import type { OrdenFacturaMuelle } from '../types/cediva';

interface TrazabilidadMuelleViewProps {
  readonly facturas: readonly OrdenFacturaMuelle[];
  readonly onCambiarFacturas: (
    updater: (prev: OrdenFacturaMuelle[]) => OrdenFacturaMuelle[]
  ) => void;
  readonly usuarioNombre: string;
  readonly onSincronizarOrdenesMuelle: () => Promise<void>;
}

type FiltroEstado = FiltroTrazabilidadMuelle;

function esFacturaPendienteDespacho(fac: OrdenFacturaMuelle): boolean {
  return fac.estado === ESTADOS_MUELLE.AUDITADA_LISTA_DESPACHO;
}

export function TrazabilidadMuelleView({
  facturas,
  onCambiarFacturas,
  usuarioNombre,
  onSincronizarOrdenesMuelle,
}: TrazabilidadMuelleViewProps) {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>(
    FILTROS_TRAZABILIDAD_MUELLE.TODAS
  );
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState<number>(
    CONFIGURACION_PAGINACION.PAGINA_INICIAL
  );
  const [tamanoPagina, setTamanoPagina] = useState<number>(
    CONFIGURACION_PAGINACION.TAMANO_PAGINA
  );
  const [facturaADespachar, setFacturaADespachar] = useState<OrdenFacturaMuelle | null>(null);
  const [despachando, setDespachando] = useState(false);

  const [transportadora, setTransportadora] = useState('');
  const [placaVehiculo, setPlacaVehiculo] = useState('');
  const [conductorNombre, setConductorNombre] = useState('');

  const facturasAuditadas = useMemo(
    () => facturas.filter((f) =>
      f.estado === ESTADOS_MUELLE.AUDITADA_LISTA_DESPACHO ||
      f.estado === ESTADOS_MUELLE.DESPACHADA
    ),
    [facturas]
  );

  const facturasAlistadas = useMemo(
    () => facturas.filter((factura) => factura.estado === ESTADOS_MUELLE.ALISTADA),
    [facturas]
  );

  const totalPendientesDespacho = useMemo(
    () => facturasAuditadas.filter(esFacturaPendienteDespacho).length,
    [facturasAuditadas]
  );

  const totalDespachadas = useMemo(
    () => facturasAuditadas.filter(
      (f) => f.estado === ESTADOS_MUELLE.DESPACHADA
    ).length,
    [facturasAuditadas]
  );

  const facturasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const candidatas =
      filtroEstado === FILTROS_TRAZABILIDAD_MUELLE.ALISTADA
        ? facturasAlistadas
        : facturasAuditadas;
    return candidatas.filter((fac) => {
      const cumpleEstado =
        filtroEstado === FILTROS_TRAZABILIDAD_MUELLE.TODAS ||
        filtroEstado === FILTROS_TRAZABILIDAD_MUELLE.ALISTADA ||
        (filtroEstado === FILTROS_TRAZABILIDAD_MUELLE.DESPACHADA
          ? fac.estado === ESTADOS_MUELLE.DESPACHADA
          : esFacturaPendienteDespacho(fac));

      const cumpleBusqueda =
        !q ||
        fac.numeroFactura.toLowerCase().includes(q) ||
        fac.clienteNombre.toLowerCase().includes(q) ||
        fac.clienteNit.toLowerCase().includes(q) ||
        (fac.datosTransporte?.placaVehiculo ?? '').toLowerCase().includes(q) ||
        (fac.datosTransporte?.conductorNombre ?? '').toLowerCase().includes(q);

      return cumpleEstado && cumpleBusqueda;
    });
  }, [facturasAlistadas, facturasAuditadas, filtroEstado, busqueda]);

  const totalPaginas = Math.max(
    CONFIGURACION_PAGINACION.MINIMO_TOTAL_PAGINAS,
    Math.ceil(facturasFiltradas.length / tamanoPagina)
  );
  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const facturasPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * tamanoPagina;
    return facturasFiltradas.slice(inicio, inicio + tamanoPagina);
  }, [facturasFiltradas, paginaSegura, tamanoPagina]);

  const handleCambioFiltroEstado = (nuevoFiltro: FiltroEstado) => {
    setFiltroEstado(nuevoFiltro);
    setPaginaActual(CONFIGURACION_PAGINACION.PAGINA_INICIAL);
  };

  const handleCambioBusqueda = (valor: string) => {
    setBusqueda(valor);
    setPaginaActual(CONFIGURACION_PAGINACION.PAGINA_INICIAL);
  };

  const handleCambioTamano = (nuevoTamano: number) => {
    setTamanoPagina(nuevoTamano);
    setPaginaActual(CONFIGURACION_PAGINACION.PAGINA_INICIAL);
  };

  const abrirModalDespacho = (factura: OrdenFacturaMuelle) => {
    setFacturaADespachar(factura);
    setTransportadora('');
    setPlacaVehiculo('');
    setConductorNombre('');
  };

  const confirmarDespacho = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!facturaADespachar || despachando) return;

    if (!transportadora.trim() || !placaVehiculo.trim() || !conductorNombre.trim()) {
      toast.error('Completa transportadora, placa y nombre del conductor.');
      return;
    }

    const horaDespacho = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const transpLimpia = transportadora.trim();
    const placaLimpia = placaVehiculo.trim().toUpperCase();
    const condLimpio = conductorNombre.trim();

    try {
      setDespachando(true);

      await api.put(`/MuelleControlador/${facturaADespachar.id}/despachar`, {
        id: facturaADespachar.id,
        despachadoPor: usuarioNombre,
        horaDespacho,
        transportadora: transpLimpia,
        placaVehiculo: placaLimpia,
        conductor: condLimpio,
      });
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No se pudo registrar el despacho en el servidor.'));
      setDespachando(false);
      return;
    }

    onCambiarFacturas((prev) =>
      prev.map((f) =>
        f.id === facturaADespachar.id
          ? {
              ...f,
              estado: ESTADOS_MUELLE.DESPACHADA,
              despachadoPor: usuarioNombre,
              horaDespacho,
              datosTransporte: {
                transportadora: transpLimpia,
                placaVehiculo: placaLimpia,
                conductorNombre: condLimpio,
              },
            }
          : f
      )
    );
    toast.success(`Factura ${facturaADespachar.numeroFactura} despachada correctamente.`);
    setFacturaADespachar(null);

    try {
      await onSincronizarOrdenesMuelle();
    } catch (err) {
      toast.error(
        `El despacho quedó registrado, pero no se pudo refrescar la sincronización: ${extraerMensajeError(err, MENSAJES_MUELLE.ERROR_DESCONOCIDO)}`
      );
    } finally {
      setDespachando(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="header-action">
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>
            Trazabilidad de Muelle y Despachos
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
            Seguimiento de auditorías cerradas, asignación de transporte y despachos completados
          </p>
        </div>
      </div>

      <div className="kpi-grid">
        <div
          className="kpi-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '6px',
          }}
        >
          <span className="kpi-label">TOTAL AUDITADAS</span>
          <strong
            className="kpi-value"
            style={{ color: '#0284c7', fontSize: '28px', lineHeight: 1.1 }}
          >
            {facturasAuditadas.length}
          </strong>
        </div>

        <div
          className="kpi-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '6px',
          }}
        >
          <span className="kpi-label">PENDIENTES DE DESPACHO</span>
          <strong
            className="kpi-value"
            style={{ color: '#d97706', fontSize: '28px', lineHeight: 1.1 }}
          >
            {totalPendientesDespacho}
          </strong>
        </div>

        <div
          className="kpi-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '6px',
          }}
        >
          <span className="kpi-label">DESPACHADAS</span>
          <strong
            className="kpi-value"
            style={{ color: '#16a34a', fontSize: '28px', lineHeight: 1.1 }}
          >
            {totalDespachadas}
          </strong>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          background: '#ffffff',
          padding: '14px 16px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(
            [
              {
                id: FILTROS_TRAZABILIDAD_MUELLE.TODAS,
                label: `Todas (${facturasAuditadas.length})`,
              },
              {
                id: FILTROS_TRAZABILIDAD_MUELLE.ALISTADA,
                label: `En muelle sin auditar (${facturasAlistadas.length})`,
              },
              {
                id: FILTROS_TRAZABILIDAD_MUELLE.PENDIENTE_DESPACHO,
                label: `Pendientes Despacho (${totalPendientesDespacho})`,
              },
              {
                id: FILTROS_TRAZABILIDAD_MUELLE.DESPACHADA,
                label: `Despachadas (${totalDespachadas})`,
              },
            ] as const
          ).map((tab) => {
            const activo = filtroEstado === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleCambioFiltroEstado(tab.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: activo ? '1px solid #0284c7' : '1px solid #cbd5e1',
                  background: activo ? '#e0f2fe' : '#ffffff',
                  color: activo ? '#0369a1' : '#334155',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', minWidth: '260px', flex: '0 1 320px' }}>
          <Search
            size={16}
            color="#64748b"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => handleCambioBusqueda(e.target.value)}
            placeholder="Buscar factura, cliente, placa o conductor..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      <div className="table-container">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <ClipboardCheck size={18} color="#16a34a" />
          <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
            Registros de Trazabilidad ({facturasFiltradas.length})
          </h3>
        </div>

        {facturasFiltradas.length === 0 ? (
          <p
            style={{
              margin: '18px 0',
              color: '#64748b',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            No hay facturas en esta categoría todavía.
          </p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>FACTURA</th>
                  <th>CLIENTE / NIT</th>
                  <th>MUELLE</th>
                  <th>AUDITORÍA / ALISTAMIENTO</th>
                  <th>DESPACHO Y TRANSPORTE</th>
                  <th>ESTADO</th>
                  <th>ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {facturasPaginadas.map((fac) => {
                  const totalUnidades = fac.lineas.reduce(
                    (acc, l) => acc + l.cantidadPedida,
                    0
                  );
                  const estaDespachada = fac.estado === ESTADOS_MUELLE.DESPACHADA;
                  const estaAlistada = fac.estado === ESTADOS_MUELLE.ALISTADA;

                  return (
                    <tr key={fac.id}>
                      <td>
                        <strong>{fac.numeroFactura}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {totalUnidades} un.
                        </div>
                      </td>
                      <td>
                        <strong>{fac.clienteNombre}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {fac.clienteNit}
                        </div>
                      </td>
                      <td>{fac.muelle}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                            Auditó: {fac.auditadoPor ?? MENSAJES_MUELLE.AUDITOR_PREDETERMINADO} (
                            {fac.horaAuditoria ?? MENSAJES_MUELLE.HORA_NO_DISPONIBLE})
                          </div>
                          {fac.alistadoPor && (
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#0284c7',
                                fontWeight: 600,
                              }}
                            >
                              Alistó: {fac.alistadoPor} (
                              {fac.horaAlistamiento ?? MENSAJES_MUELLE.HORA_NO_DISPONIBLE})
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {estaDespachada && fac.datosTransporte ? (
                          <div>
                            <strong>
                              {fac.datosTransporte.transportadora} ·{' '}
                              {fac.datosTransporte.placaVehiculo}
                            </strong>
                            <div style={{ fontSize: '12px', color: '#475569' }}>
                              Cond.: {fac.datosTransporte.conductorNombre}
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#0284c7',
                                fontWeight: 600,
                              }}
                            >
                              Despachó: {fac.despachadoPor ?? 'Usuario'} (
                              {fac.horaDespacho ?? '--:--'})
                            </div>
                          </div>
                        ) : estaAlistada ? (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Pendiente de auditoría en muelle
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '12px',
                              color: '#d97706',
                              fontWeight: 600,
                            }}
                          >
                            Esperando asignación de vehículo
                          </span>
                        )}
                      </td>
                      <td>
                        {estaDespachada ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              background: '#dcfce7',
                              color: '#15803d',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            <CheckCircle2 size={13} /> DESPACHADA
                          </span>
                        ) : estaAlistada ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              background: '#e0f2fe',
                              color: '#0369a1',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            <Clock size={13} /> PENDIENTE DE AUDITORÍA
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              background: '#fef3c7',
                              color: '#b45309',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            <Clock size={13} /> AUDITADA
                          </span>
                        )}
                      </td>
                      <td>
                        {estaDespachada ? (
                          <span
                            style={{
                              color: '#16a34a',
                              fontWeight: 600,
                              fontSize: '13px',
                            }}
                          >
                            Completado
                          </span>
                        ) : estaAlistada ? (
                          <span style={{ color: '#64748b', fontSize: '12px' }}>
                            En espera de auditoría
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => abrirModalDespacho(fac)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#0284c7',
                              color: '#ffffff',
                              fontWeight: 600,
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            <Truck size={14} /> Despachar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <PaginacionTabla
              paginaActual={paginaSegura}
              totalItems={facturasFiltradas.length}
              tamanoPagina={tamanoPagina}
              onCambiarPagina={setPaginaActual}
              onCambiarTamano={handleCambioTamano}
            />
          </>
        )}
      </div>

      {facturaADespachar && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '18px' }}>
                Despachar {facturaADespachar.numeroFactura}
              </h2>
              <button
                type="button"
                onClick={() => setFacturaADespachar(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => void confirmarDespacho(e)}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label
                  htmlFor="despacho-transportadora"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                >
                  Transportadora
                </label>
                <input
                  id="despacho-transportadora"
                  type="text"
                  required
                  value={transportadora}
                  onChange={(e) => setTransportadora(e.target.value)}
                  placeholder="Ej: Coordinadora, TCC, Envia, Conaltra..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="despacho-placa"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                >
                  Placa del vehículo
                </label>
                <input
                  id="despacho-placa"
                  type="text"
                  required
                  value={placaVehiculo}
                  onChange={(e) => setPlacaVehiculo(e.target.value)}
                  placeholder="Ej: WEN422"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    textTransform: 'uppercase',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="despacho-conductor"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                >
                  Nombre del conductor
                </label>
                <input
                  id="despacho-conductor"
                  type="text"
                  required
                  value={conductorNombre}
                  onChange={(e) => setConductorNombre(e.target.value)}
                  placeholder="Ej: Carlos Mendoza"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end',
                  marginTop: '8px',
                }}
              >
                <button
                  type="button"
                  disabled={despachando}
                  onClick={() => setFacturaADespachar(null)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={despachando}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: despachando ? 'not-allowed' : 'pointer',
                    opacity: despachando ? 0.7 : 1,
                  }}
                >
                  {despachando ? 'Registrando...' : 'Confirmar Despacho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}