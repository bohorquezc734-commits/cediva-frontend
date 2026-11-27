import type { KeyboardEvent, RefObject } from 'react';
import { PackageCheck, ScanBarcode } from 'lucide-react';
import { BotonCamaraMuelle } from './BotonCamaraMuelle';
import type { OrdenFacturaMuelle, Producto } from '../../types/cediva';

interface PanelAlistamientoMuelleProps {
  readonly pendientes: readonly OrdenFacturaMuelle[];
  readonly activa: OrdenFacturaMuelle | undefined;
  readonly facturaId: string;
  readonly onSeleccionarFactura: (id: string) => void;
  readonly resumen: { pedido: number; alistado: number; faltantes: number; completa: boolean };
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly codigo: string;
  readonly onCambiarCodigo: (valor: string) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  readonly onAbrirCamara: () => void;
  readonly alistando: boolean;
  readonly onEnviarAlMuelle: () => Promise<void>;
  readonly productos: readonly Producto[];
}

export function PanelAlistamientoMuelle({
  pendientes,
  activa,
  facturaId,
  onSeleccionarFactura,
  resumen,
  inputRef,
  codigo,
  onCambiarCodigo,
  onKeyDown,
  onAbrirCamara,
  alistando,
  onEnviarAlMuelle,
  productos,
}: PanelAlistamientoMuelleProps) {
  if (!activa) {
    return (
      <div className="kpi-card" style={{ marginBottom: '20px' }}>
        <strong>No hay ordenes pendientes por alistar.</strong>
      </div>
    );
  }

  return (
    <>
      <div className="table-container" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <strong>Orden por alistar:</strong>
          <select
            value={facturaId}
            onChange={(event) => onSeleccionarFactura(event.target.value)}
            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          >
            {pendientes.map((factura) => (
              <option key={factura.id} value={factura.id}>
                {factura.numeroFactura} — {factura.clienteNombre}
              </option>
            ))}
          </select>
          <span>Cliente: <strong>{activa.clienteNombre}</strong></span>
          <span>Muelle: <strong>{activa.muelle}</strong></span>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="kpi-title" style={{ marginBottom: 0 }}>Pedido</span>
          <strong className="kpi-value">{resumen.pedido}</strong>
        </div>
        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="kpi-title" style={{ marginBottom: 0 }}>Alistado</span>
          <strong className="kpi-value" style={{ color: '#0284c7' }}>{resumen.alistado}</strong>
        </div>
        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span className="kpi-title" style={{ marginBottom: 0 }}>Faltantes</span>
          <strong className="kpi-value" style={{ color: '#d97706' }}>{resumen.faltantes}</strong>
        </div>
      </div>

      <div className="table-container" style={{ marginBottom: '20px' }}>
        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ScanBarcode size={22} color="#0284c7" />
          <input
            ref={inputRef}
            className="search-input"
            value={codigo}
            onChange={(event) => onCambiarCodigo(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Pistolea el producto y presiona Enter..."
          />
          <BotonCamaraMuelle
            deshabilitado={alistando}
            onAbrir={onAbrirCamara}
          />
        </div>
      </div>

      <div className="table-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
          <strong>Checklist de alistamiento</strong>
          <button
            type="button"
            className="btn-primary"
            disabled={!resumen.completa || alistando}
            onClick={() => void onEnviarAlMuelle()}
          >
            <PackageCheck size={16} />
            {alistando ? 'Enviando...' : 'Enviar al muelle'}
          </button>
        </div>
        <table>
          <thead><tr><th>Codigo</th><th>Producto</th><th>Pedido</th><th>Alistado</th></tr></thead>
          <tbody>
            {activa.lineas.map((linea) => {
              const producto = productos.find((item) => item.codigoBarras === linea.codigoBarras);
              const alistada = linea.cantidadAlistada ?? linea.cantidadPistoleada;
              return (
                <tr key={linea.codigoBarras}>
                  <td><strong>{linea.codigoBarras}</strong></td>
                  <td>{producto?.nombre ?? 'Producto sin catalogo'}</td>
                  <td>{linea.cantidadPedida}</td>
                  <td style={{ color: alistada >= linea.cantidadPedida ? '#16a34a' : '#0284c7' }}>
                    <strong>{alistada}</strong>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
