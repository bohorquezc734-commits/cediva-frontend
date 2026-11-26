import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ModalEscanerCamaraProps {
  readonly abierto: boolean;
  readonly onCerrar: () => void;
  readonly onCodigoDetectado: (codigo: string) => void;
}

const SCANNER_ELEMENT_ID = 'cediva-rf-camera-reader';

export function ModalEscanerCamara({
  abierto,
  onCerrar,
  onCodigoDetectado,
}: ModalEscanerCamaraProps) {
  const ultimoEscaneoRef = useRef<{ codigo: string; tiempo: number }>({
    codigo: '',
    tiempo: 0,
  });
  const callbackRef = useRef(onCodigoDetectado);
  callbackRef.current = onCodigoDetectado;

  useEffect(() => {
    if (!abierto) return;

    const html5QrCode = new Html5Qrcode(SCANNER_ELEMENT_ID);
    let activo = true;

    const iniciarCamara = async () => {
      try {
        await html5QrCode.start(
          { facingMode: 'environment' }, // Cámara trasera del celular
          {
            fps: 10,
            qrbox: { width: 260, height: 140 }, // Rectángulo ideal para códigos de barras
          },
          (decodedText) => {
            const ahora = Date.now();
            const codigoLimpio = decodedText.trim();

            // Evita lecturas repetidas en menos de 1.8 segundos
            if (
              ultimoEscaneoRef.current.codigo === codigoLimpio &&
              ahora - ultimoEscaneoRef.current.tiempo < 1800
            ) {
              return;
            }

            ultimoEscaneoRef.current = { codigo: codigoLimpio, tiempo: ahora };

            // Vibración corta tipo pistola RF en Android
            if (navigator.vibrate) {
              navigator.vibrate(100);
            }

            callbackRef.current(codigoLimpio);
          },
          () => {
            // Ignora frames sin código
          }
        );
      } catch {
        if (activo) {
          toast.error('No se pudo abrir la cámara. Verifica los permisos del navegador.');
          onCerrar();
        }
      }
    };

    void iniciarCamara();

    return () => {
      activo = false;
      if (html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .then(() => html5QrCode.clear())
          .catch(() => {});
      }
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
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
            <h2 style={{ margin: 0, fontSize: '18px' }}>Lector RF — Cámara</h2>
          </div>
          <button
            type="button"
            aria-label="Cerrar cámara"
            onClick={onCerrar}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#475569' }}>
          Apunta al código de barras de la caja. Puedes escanear varios productos seguidos.
        </p>

        <div
          id={SCANNER_ELEMENT_ID}
          style={{
            width: '100%',
            borderRadius: '10px',
            overflow: 'hidden',
            backgroundColor: '#0f172a',
          }}
        />

        <button
          type="button"
          onClick={onCerrar}
          style={{
            marginTop: '14px',
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Listo / Cerrar Cámara
        </button>
      </div>
    </div>
  );
}