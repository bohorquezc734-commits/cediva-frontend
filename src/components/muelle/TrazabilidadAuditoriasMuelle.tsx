import { ClipboardCheck, Truck } from 'lucide-react';
import { ESTADOS_MUELLE, MENSAJES_MUELLE } from '../../constants/muelle';
import type { OrdenFacturaMuelle } from '../../types/cediva';

interface TrazabilidadAuditoriasMuelleProps {
  readonly facturasAuditadas: readonly OrdenFacturaMuelle[];
  readonly onSolicitarDespacho: (factura: OrdenFacturaMuelle) => void;
}

// === SUBCOMPONENTE: TRAZABILIDAD DE FACTURAS AUDITADAS Y DESPACHADAS ===
export function TrazabilidadAuditoriasMuelle({
  facturasAuditadas,
  onSolicitarDespacho,
}: TrazabilidadAuditoriasMuelleProps) {
  if (facturasAuditadas.length === 0) return null;

  return (
    <div className="table-container" style={{ marginBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          color: '#0f172a',
          fontWeight: 700,
          fontSize: '15px',
        }}
      >
        <ClipboardCheck size={19} color="#16a34a" />
        Trazabilidad de Picking & Packing Auditado ({facturasAuditadas.length})
      </div>

      <table>
        <thead>
          <tr>
            <th>Factura</th>
            <th>Cliente / NIT</th>
            <th>Muelle</th>
            <th>Auditado por</th>
            <th>Despacho y Transporte</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {facturasAuditadas.map((fac) => {
            const totalUnidades = fac.lineas.reduce((acc, l) => acc + l.cantidadPedida, 0);
            const despachada = fac.estado === ESTADOS_MUELLE.DESPACHADA;

            return (
              <tr key={fac.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  <div>{fac.numeroFactura}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'sans-serif' }}>
                    {totalUnidades} un.
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{fac.clienteNombre}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{fac.clienteNit}</div>
                </td>
                <td>{fac.muelle}</td>
                <td style={{ fontSize: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>
                    {fac.auditadoPor ?? MENSAJES_MUELLE.AUDITOR_BODEGA_PREDETERMINADO}
                  </div>
                  <div style={{ color: '#64748b' }}>
                    {fac.horaAuditoria ?? MENSAJES_MUELLE.HORA_NO_DISPONIBLE}
                  </div>
                </td>
                <td style={{ fontSize: '12px' }}>
                  {despachada && fac.datosTransporte ? (
                    <>
                      <div>
                        <strong>{fac.datosTransporte.transportadora}</strong> ·{' '}
                        <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          {fac.datosTransporte.placaVehiculo}
                        </span>
                      </div>
                      <div style={{ color: '#475569' }}>
                        Cond.: {fac.datosTransporte.conductorNombre}
                      </div>
                      <div style={{ color: '#0284c7', fontWeight: 600, marginTop: '2px' }}>
                        Despachó: {fac.despachadoPor ?? MENSAJES_MUELLE.AUDITOR_BODEGA_PREDETERMINADO} ({fac.horaDespacho})
                      </div>
                    </>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>Pendiente de asignar transporte</span>
                  )}
                </td>
                <td>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: despachada ? '#dcfce7' : '#fef3c7',
                      color: despachada ? '#16a34a' : '#b45309',
                    }}
                  >
                    {despachada ? '✔ DESPACHADA' : 'AUDITADA — PENDIENTE DESPACHO'}
                  </span>
                </td>
                <td>
                  {!despachada ? (
                    <button
                      type="button"
                      onClick={() => onSolicitarDespacho(fac)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      <Truck size={14} /> Despachar
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                      Completado
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}