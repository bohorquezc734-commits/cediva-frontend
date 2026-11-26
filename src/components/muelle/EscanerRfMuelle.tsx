import type { RefObject, KeyboardEvent } from 'react';
import { ScanBarcode, ShieldAlert, CornerDownLeft, X } from 'lucide-react';

interface EscanerRfMuelleProps {
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly codigoEscaneado: string;
  readonly deshabilitado: boolean;
  readonly alertaTrocado: string | null;
  readonly onChangeCodigo: (valor: string) => void;
  readonly onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  readonly onLimpiarAlerta?: () => void;
}

// === SUBCOMPONENTE: CAMPO DE PISTOLEO RF Y ALERTA ANTI-TROCADO ===
export function EscanerRfMuelle({
  inputRef,
  codigoEscaneado,
  deshabilitado,
  alertaTrocado,
  onChangeCodigo,
  onKeyDown,
  onLimpiarAlerta,
}: EscanerRfMuelleProps) {
  const dispararEnter = () => {
    if (deshabilitado || !codigoEscaneado.trim()) return;
    const eventoSimulado = {
      key: 'Enter',
      preventDefault: () => {},
    } as KeyboardEvent<HTMLInputElement>;
    onKeyDown(eventoSimulado);
  };

  return (
    <div
      className="table-container"
      style={{
        marginBottom: 0,
        height: '100%',
        border: alertaTrocado ? '2px solid #dc2626' : '1px solid var(--border-tech)',
      }}
    >
      <div
        className="search-bar"
        style={{
          marginBottom: alertaTrocado ? '14px' : 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <ScanBarcode size={22} color="#0284c7" style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          id="scanner-muelle-input"
          type="text"
          disabled={deshabilitado}
          placeholder={
            deshabilitado
              ? 'Factura verificada y cerrada.'
              : 'Pistolea el código de barras o escríbelo y presiona Enter...'
          }
          className="search-input"
          value={codigoEscaneado}
          onChange={(e) => onChangeCodigo(e.target.value)}
          onKeyDown={onKeyDown}
        />

        {!deshabilitado && codigoEscaneado.trim().length > 0 && (
          <button
            type="button"
            onClick={dispararEnter}
            title="Validar código escaneado"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <CornerDownLeft size={14} /> Validar
          </button>
        )}
      </div>

      {alertaTrocado && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            fontWeight: 700,
            fontSize: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={22} color="#dc2626" style={{ flexShrink: 0 }} />
            <span>{alertaTrocado}</span>
          </div>

          {onLimpiarAlerta && (
            <button
              type="button"
              onClick={onLimpiarAlerta}
              aria-label="Cerrar alerta de trocado"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#991b1b',
                cursor: 'pointer',
                padding: '2px',
                display: 'inline-flex',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}