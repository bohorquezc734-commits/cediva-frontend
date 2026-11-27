import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Camera, Check, RefreshCw, X } from 'lucide-react';

interface ModalEscanerCamaraProps {
  readonly abierto: boolean;
  readonly onCerrar: () => void;
  readonly onPistolearCodigo: (codigo: string) => void;
}

export function ModalEscanerCamara({
  abierto,
  onCerrar,
  onPistolearCodigo,
}: ModalEscanerCamaraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ultimoEnfoqueRef = useRef<string>('');
  const bloqueadoHastaRef = useRef<number>(0);

  const [codigoDetectado, setCodigoDetectado] = useState('');
  const [errorCamara, setErrorCamara] = useState<string | null>(null);

  const limpiarCodigo = useCallback(() => {
    setCodigoDetectado('');
    ultimoEnfoqueRef.current = '';
  }, []);

  useEffect(() => {
    if (!abierto) {
      limpiarCodigo();
      setErrorCamara(null);
      return;
    }

    let cancelado = false;
    let controles: { stop: () => void } | null = null;
    const reader = new BrowserMultiFormatReader();

    const iniciarLector = async () => {
      try {
        setErrorCamara(null);
        const videoEl = videoRef.current;
        if (!videoEl) return;

        controles = await reader.decodeFromConstraints(
          {
            video: { facingMode: { ideal: 'environment' } },
            audio: false,
          },
          videoEl,
          (resultado) => {
            if (cancelado || !resultado) return;
            if (Date.now() < bloqueadoHastaRef.current) return;

            const texto = resultado.getText().trim();
            if (texto && texto !== ultimoEnfoqueRef.current) {
              ultimoEnfoqueRef.current = texto;
              setCodigoDetectado(texto);
            }
          }
        );
      } catch {
        if (!cancelado) {
          setErrorCamara(
            'No se pudo abrir la cámara. Revisa los permisos o escribe el código abajo.'
          );
        }
      }
    };

    void iniciarLector();

    return () => {
      cancelado = true;
      controles?.stop();
    };
  }, [abierto, limpiarCodigo]);

  if (!abierto) return null;

  const codigoLimpio = codigoDetectado.trim();

  const pistolearUnaCaja = () => {
    if (!codigoLimpio) return;

    bloqueadoHastaRef.current = Date.now() + 700;
    onPistolearCodigo(codigoLimpio);
    limpiarCodigo();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={20} color="#0284c7" />
            <h2 style={{ margin: 0, fontSize: '18px' }}>Pistoleo por Cámara (1 a 1)</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar cámara"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {errorCamara ? (
          <p style={{ color: '#dc2626', fontSize: '13px', margin: '8px 0 12px' }}>
            {errorCamara}
          </p>
        ) : (
          <div
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#0f172a',
              marginBottom: '12px',
              aspectRatio: '4 / 3',
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <input
            type="text"
            value={codigoDetectado}
            onChange={(e) => {
              ultimoEnfoqueRef.current = e.target.value;
              setCodigoDetectado(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && codigoLimpio) {
                e.preventDefault();
                pistolearUnaCaja();
              }
            }}
            placeholder="Apunta al código o escríbelo..."
            style={{
              flex: 1,
              padding: '11px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '15px',
              fontFamily: 'monospace',
            }}
          />

          <button
            type="button"
            onClick={limpiarCodigo}
            title="Limpiar código"
            style={{
              padding: '11px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={18} />
          </button>
        </div>

        <button
          type="button"
          disabled={!codigoLimpio}
          onClick={pistolearUnaCaja}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: '12px',
            border: 'none',
            background: codigoLimpio ? '#0284c7' : '#94a3b8',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '15px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: codigoLimpio ? 'pointer' : 'not-allowed',
          }}
        >
          <Check size={20} />
          <span>Pistolear 1 Caja</span>
        </button>
      </div>
    </div>
  );
}