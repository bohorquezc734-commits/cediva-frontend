import { useState, type SubmitEvent } from 'react';
import { Truck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { DatosTransporteDespacho, OrdenFacturaMuelle } from '../../types/cediva';

interface ModalEjecutarDespachoMuelleProps {
  readonly factura: OrdenFacturaMuelle | null;
  readonly onCerrar: () => void;
  readonly onConfirmarDespacho: (
    facturaId: string,
    transporte: DatosTransporteDespacho
  ) => void;
}

// === SUBCOMPONENTE: MODAL PARA EJECUTAR DESPACHO CON DATOS DE TRANSPORTE ===
export function ModalEjecutarDespachoMuelle({
  factura,
  onCerrar,
  onConfirmarDespacho,
}: ModalEjecutarDespachoMuelleProps) {
  const [conductorNombre, setConductorNombre] = useState('');
  const [transportadora, setTransportadora] = useState('');
  const [placaVehiculo, setPlacaVehiculo] = useState('');

  if (!factura) return null;

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const conductor = conductorNombre.trim();
    const empresa = transportadora.trim();
    const placa = placaVehiculo.trim().toUpperCase();

    if (!conductor || !empresa || !placa) {
      toast.error('Completa conductor, transportadora y placa del vehículo.');
      return;
    }

    onConfirmarDespacho(factura.id, {
      conductorNombre: conductor,
      transportadora: empresa,
      placaVehiculo: placa,
    });

    setConductorNombre('');
    setTransportadora('');
    setPlacaVehiculo('');
    onCerrar();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={22} color="#0284c7" />
            <h2 style={{ margin: 0, fontSize: '19px' }}>
              Despachar Factura {factura.numeroFactura}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal de despacho"
            onClick={onCerrar}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#475569' }}>
          Cliente: <strong>{factura.clienteNombre}</strong> — Muelle: <strong>{factura.muelle}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="desp-conductor">Nombre del Conductor</label>
            <input
              id="desp-conductor"
              type="text"
              placeholder="Ej. Carlos Mendoza"
              value={conductorNombre}
              onChange={(e) => setConductorNombre(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="desp-transportadora">Transportadora</label>
            <input
              id="desp-transportadora"
              type="text"
              placeholder="Ej. Coordinadora / TCC / Envía / Flota Propia"
              value={transportadora}
              onChange={(e) => setTransportadora(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="desp-placa">Placa del Vehículo</label>
            <input
              id="desp-placa"
              type="text"
              placeholder="Ej. WEN-482"
              value={placaVehiculo}
              onChange={(e) => setPlacaVehiculo(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCerrar}
              style={{
                padding: '10px 15px',
                border: '1px solid #ccc',
                background: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Confirmar Despacho
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}