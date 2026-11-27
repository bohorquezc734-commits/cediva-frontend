import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CONFIGURACION_PAGINACION } from '../constants/operacion';

interface PaginacionTablaProps {
  readonly paginaActual: number;
  readonly totalItems: number;
  readonly tamanoPagina: number;
  readonly opcionesTamano?: readonly number[];
  readonly onCambiarPagina: (pagina: number) => void;
  readonly onCambiarTamano: (nuevoTamano: number) => void;
}

const OPCIONES_DEFECTO = [
  5,
  CONFIGURACION_PAGINACION.TAMANO_PAGINA,
  25,
  50,
] as const;

export function PaginacionTabla({
  paginaActual,
  totalItems,
  tamanoPagina,
  opcionesTamano = OPCIONES_DEFECTO,
  onCambiarPagina,
  onCambiarTamano,
}: PaginacionTablaProps) {
  if (totalItems === 0) return null;

  const totalPaginas = Math.max(
    CONFIGURACION_PAGINACION.MINIMO_TOTAL_PAGINAS,
    Math.ceil(totalItems / tamanoPagina)
  );
  const paginaSegura = Math.min(
    Math.max(CONFIGURACION_PAGINACION.PAGINA_INICIAL, paginaActual),
    totalPaginas
  );
  const inicio =
    (paginaSegura - CONFIGURACION_PAGINACION.PAGINA_INICIAL) * tamanoPagina +
    CONFIGURACION_PAGINACION.PAGINA_INICIAL;
  const fin = Math.min(paginaSegura * tamanoPagina, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '14px 18px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: '#f8fafc',
        fontSize: '13px',
        color: '#475569',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span>
          Mostrando <strong>{inicio}</strong>–<strong>{fin}</strong> de{' '}
          <strong>{totalItems}</strong>
        </span>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span>Filas:</span>
          <select
            value={tamanoPagina}
            onChange={(e) => onCambiarTamano(Number(e.target.value))}
            style={{
              padding: '5px 8px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#1e293b',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {opcionesTamano.map((tam) => (
              <option key={tam} value={tam}>
                {tam}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          disabled={paginaSegura <= 1}
          onClick={() => onCambiarPagina(paginaSegura - 1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: paginaSegura <= 1 ? '#94a3b8' : '#1e293b',
            fontWeight: 600,
            cursor: paginaSegura <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronLeft size={16} />
          <span>Anterior</span>
        </button>

        <span style={{ fontWeight: 600, padding: '0 4px', color: '#1e293b' }}>
          {paginaSegura} / {totalPaginas}
        </span>

        <button
          type="button"
          disabled={paginaSegura >= totalPaginas}
          onClick={() => onCambiarPagina(paginaSegura + 1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: paginaSegura >= totalPaginas ? '#94a3b8' : '#1e293b',
            fontWeight: 600,
            cursor: paginaSegura >= totalPaginas ? 'not-allowed' : 'pointer',
          }}
        >
          <span>Siguiente</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}