import { CheckCircle2, ClipboardList, Lock, PackageCheck } from 'lucide-react';
import { ESTADOS_MUELLE } from '../../constants/muelle';
import type { OrdenFacturaMuelle, Producto } from '../../types/cediva';

interface ChecklistMuelleTableProps {
  readonly facturaActiva: OrdenFacturaMuelle;
  readonly productos: readonly Producto[];
  readonly todasCompletas: boolean;
  readonly cerrandoPacking: boolean;
  readonly onConfirmarPacking: () => void | Promise<void>;
}

export function ChecklistMuelleTable({
  facturaActiva,
  productos,
  todasCompletas,
  cerrandoPacking,
  onConfirmarPacking,
}: ChecklistMuelleTableProps) {
  const estaCerrada = facturaActiva.estado !== ESTADOS_MUELLE.ALISTADA;
  const puedeCerrar = !estaCerrada && todasCompletas && !cerrandoPacking;

  const obtenerTextoBoton = () => {
    if (estaCerrada) return 'Packing cerrado';
    if (cerrandoPacking) return 'Cerrando packing...';
    if (!todasCompletas) return 'Faltan unidades por pistolear';
    return 'Cerrar Packing y Descontar Stock';
  };

  return (
    <div className="table-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <ClipboardList size={18} color="#0284c7" />
          <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
            Checklist de Mercancía en Muelle ({facturaActiva.numeroFactura})
          </h3>

          {estaCerrada ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                borderRadius: '999px',
                background: '#dcfce7',
                color: '#15803d',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <Lock size={12} /> Auditoría cerrada
            </span>
          ) : (
            <span
              style={{
                padding: '3px 10px',
                borderRadius: '999px',
                background: '#e0f2fe',
                color: '#0369a1',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              En verificación RF
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={!puedeCerrar}
          onClick={() => void onConfirmarPacking()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            background: puedeCerrar ? '#0284c7' : '#cbd5e1',
            color: puedeCerrar ? '#ffffff' : '#475569',
            fontWeight: 600,
            fontSize: '13px',
            cursor: puedeCerrar ? 'pointer' : 'not-allowed',
          }}
        >
          <PackageCheck size={16} />
          {obtenerTextoBoton()}
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>CÓDIGO BARRAS</th>
            <th>PRODUCTO FACTURADO</th>
            <th>PEDIDO FACTURA</th>
            <th>PISTOLEADO MUELLE</th>
            <th>ESTADO CONTROL</th>
          </tr>
        </thead>
        <tbody>
          {facturaActiva.lineas.map((linea) => {
            const producto = productos.find(
              (p) => p.codigoBarras.trim() === linea.codigoBarras.trim()
            );
            const nombreProducto = producto?.nombre ?? 'Producto sin catálogo';
            const lineaCompleta = linea.cantidadPistoleada >= linea.cantidadPedida;
            const enProceso = linea.cantidadPistoleada > 0 && !lineaCompleta;

            let badgeBg = '#f1f5f9';
            let badgeColor = '#475569';
            let estadoTexto = 'Pendiente';

            if (lineaCompleta) {
              badgeBg = '#dcfce7';
              badgeColor = '#15803d';
              estadoTexto = 'Completo';
            } else if (enProceso) {
              badgeBg = '#fef3c7';
              badgeColor = '#b45309';
              estadoTexto = 'En proceso';
            }

            return (
              <tr key={linea.codigoBarras}>
                <td>
                  <strong>{linea.codigoBarras}</strong>
                </td>
                <td>{nombreProducto}</td>
                <td>
                  <strong>{linea.cantidadPedida} un.</strong>
                </td>
                <td>
                  <strong
                    style={{
                      color: lineaCompleta ? '#16a34a' : '#0284c7',
                    }}
                  >
                    {linea.cantidadPistoleada} un.
                  </strong>
                </td>
                <td>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: badgeBg,
                      color: badgeColor,
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {lineaCompleta && <CheckCircle2 size={13} />}
                    {estadoTexto}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}