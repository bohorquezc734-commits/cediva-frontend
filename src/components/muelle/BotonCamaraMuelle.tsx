import { Camera } from 'lucide-react';

interface BotonCamaraMuelleProps {
  readonly deshabilitado: boolean;
  readonly onAbrir: () => void;
}

export function BotonCamaraMuelle({
  deshabilitado,
  onAbrir,
}: BotonCamaraMuelleProps) {
  return (
    <button
      type="button"
      disabled={deshabilitado}
      onClick={onAbrir}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '0 18px',
        height: '100%',
        minHeight: '48px',
        borderRadius: '12px',
        border: 'none',
        background: deshabilitado ? '#94a3b8' : '#0f172a',
        color: '#ffffff',
        fontWeight: 600,
        fontSize: '13px',
        cursor: deshabilitado ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <Camera size={18} />
      <span>Escanear RF</span>
    </button>
  );
}
