import { FileText } from 'lucide-react';
import type { OrdenFacturaMuelle } from '../../types/cediva';

interface SelectorFacturaMuelleProps {
  readonly facturasPendientes: readonly OrdenFacturaMuelle[];
  readonly facturaActiva: OrdenFacturaMuelle | undefined;
  readonly onSeleccionarFactura: (id: string) => void;
}

// === SUBCOMPONENTE: SELECTOR DE FACTURAS PENDIENTES EN MUELLE ===
export function SelectorFacturaMuelle({
  facturasPendientes,
  facturaActiva,
  onSeleccionarFactura,
}: SelectorFacturaMuelleProps) {
  let badgeBg = '#fef3c7';
  let badgeColor = '#b45309';
  let badgeTexto = 'AUDITADA — PENDIENTE DESPACHO';

  if (facturaActiva?.estado === 'pendiente') {
    badgeBg = '#e0f2fe';
    badgeColor = '#0284c7';
    badgeTexto = 'EN VERIFICACIÓN RF';
  } else if (facturaActiva?.estado === 'despachada') {
    badgeBg = '#dcfce7';
    badgeColor = '#15803d';
    badgeTexto = 'DESPACHADA';
  }

  return (
    <div className="table-container" style={{ marginBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <FileText size={20} color="#0284c7" />
          <label htmlFor="selector-factura" style={{ fontWeight: 700, fontSize: '14px' }}>
            Factura pendiente por auditar:
          </label>

          {facturasPendientes.length > 0 && facturaActiva ? (
            <select
              id="selector-factura"
              value={facturaActiva.id}
              onChange={(e) => onSeleccionarFactura(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-tech)',
                fontWeight: 600,
                fontSize: '14px',
                background: '#ffffff',
                color: '#0f172a',
              }}
            >
              {facturasPendientes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.numeroFactura} — {f.clienteNombre} (PENDIENTE)
                </option>
              ))}
            </select>
          ) : (
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a' }}>
              ✔ No hay facturas pendientes por pistolear. Crea una nueva o revisa Trazabilidad Muelle.
            </span>
          )}
        </div>

        {facturaActiva && (
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '13px' }}>
            <span>
              <strong>NIT:</strong> {facturaActiva.clienteNit}
            </span>
            <span>
              <strong>Ubicación:</strong> {facturaActiva.muelle}
            </span>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: '20px',
                fontWeight: 700,
                backgroundColor: badgeBg,
                color: badgeColor,
              }}
            >
              {badgeTexto}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}