import { useMemo, useState, type SyntheticEvent } from 'react';
import { CheckCircle2, ClipboardCheck, Clock, Search, Truck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, extraerMensajeError } from '../services/api';
import type { OrdenFacturaMuelle } from '../types/cediva';

interface TrazabilidadMuelleViewProps {
  readonly facturas: readonly OrdenFacturaMuelle[];
  readonly onCambiarFacturas: (
    updater: (prev: OrdenFacturaMuelle[]) => OrdenFacturaMuelle[]
  ) => void;
  readonly usuarioNombre: string;
  readonly onRecargarDatos: () => Promise<void>;
}

type FiltroEstado = 'todas' | 'pendiente_despacho' | 'despachada';

function esFacturaPendienteDespacho(fac: OrdenFacturaMuelle): boolean {
  return fac.estado !== 'pendiente' && fac.estado !== 'despachada';
}

export function TrazabilidadMuelleView({
  facturas,
  onCambiarFacturas,
  usuarioNombre,
  onRecargarDatos,
}: TrazabilidadMuelleViewProps) {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [facturaADespachar, setFacturaADespachar] = useState<OrdenFacturaMuelle | null>(null);
  const [despachando, setDespachando] = useState(false);

  const [transportadora, setTransportadora] = useState('');
  const [placaVehiculo, setPlacaVehiculo] = useState('');
  const [conductorNombre, setConductorNombre] = useState('');

  const facturasAuditadas = useMemo(
    () => facturas.filter((f) => f.estado !== 'pendiente'),
    [facturas]
  );

  const totalPendientesDespacho = useMemo(
    () => facturasAuditadas.filter(esFacturaPendienteDespacho).length,
    [facturasAuditadas]
  );

  const totalDespachadas = useMemo(
    () => facturasAuditadas.filter((f) => f.estado === 'despachada').length,
    [facturasAuditadas]
  );

  const facturasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return facturasAuditadas.filter((fac) => {
      const cumpleEstado =
        filtroEstado === 'todas' ||
        (filtroEstado === 'despachada'
          ? fac.estado === 'despachada'
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
  }, [facturasAuditadas, filtroEstado, busqueda]);

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

      onCambiarFacturas((prev) =>
        prev.map((f) =>
          f.id === facturaADespachar.id
            ? {
                ...f,
                estado: 'despachada',
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

      await onRecargarDatos();
      toast.success(`Factura ${facturaADespachar.numeroFactura} despachada correctamente.`);
      setFacturaADespachar(null);
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No se pudo registrar el despacho en el servidor.'));
    } finally {
      setDespachando(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Encabezado */}
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

      {/* KPIs */}
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

      {/* Barra de filtros y búsqueda */}
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
              { id: 'todas', label: `Todas (${facturasAuditadas.length})` },
              {
                id: 'pendiente_despacho',
                label: `Pendientes Despacho (${totalPendientesDespacho})`,
              },
              { id: 'despachada', label: `Despachadas (${totalDespachadas})` },
            ] as const
          ).map((tab) => {
            const activo = filtroEstado === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroEstado(tab.id)}
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
            onChange={(e) => setBusqueda(e.target.value)}
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

      {/* Tabla principal de trazabilidad */}
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
          <table>
            <thead>
              <tr>
                <th>FACTURA</th>
                <th>CLIENTE / NIT</th>
                <th>MUELLE</th>
                <th>AUDITADO POR</th>
                <th>DESPACHO Y TRANSPORTE</th>
                <th>ESTADO</th>
                <th>ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {facturasFiltradas.map((fac) => {
                const totalUnidades = fac.lineas.reduce(
                  (acc, l) => acc + l.cantidadPedida,
                  0
                );
                const estaDespachada = fac.estado === 'despachada';

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
                      <strong>{fac.auditadoPor ?? 'Auditor'}</strong>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {fac.horaAuditoria ?? '--:--:--'}
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
        )}
      </div>

      {/* Modal de Despacho */}
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