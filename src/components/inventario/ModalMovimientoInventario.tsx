import { useState, type SubmitEvent } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, extraerMensajeError } from '../../services/api';
import type { Producto } from '../../types/cediva';

interface ModalMovimientoInventarioProps {
  readonly producto: Producto | null;
  readonly onCerrar: () => void;
  readonly onRegistrado: () => Promise<void>;
}

export function ModalMovimientoInventario({
  producto,
  onCerrar,
  onRegistrado,
}: ModalMovimientoInventarioProps) {
  const [tipoMovimiento, setTipoMovimiento] = useState(1);
  const [cantidad, setCantidad] = useState(1);

  if (!producto) return null;

  const registrar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const req = api
      .post('/InventarioControlador/movimiento', {
        productoId: producto.id,
        cantidadValor: cantidad,
        tipo: tipoMovimiento,
      })
      .then((res) => {
        setCantidad(1);
        onCerrar();
        void onRegistrado();
        return res;
      });

    void toast.promise(req, {
      loading: 'Procesando movimiento...',
      success: `¡${tipoMovimiento === 1 ? 'Entrada' : 'Salida'} registrada con éxito!`,
      error: (err) => extraerMensajeError(err, 'Error al procesar el movimiento'),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Movimiento de Inventario</h2>
          <button
            type="button"
            aria-label="Cerrar modal de movimiento"
            onClick={onCerrar}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        <p style={{ marginTop: 0, marginBottom: '20px', color: '#64748b' }}>
          Producto: <strong>{producto.nombre}</strong> <br />
          Stock Actual: <strong>{producto.stock.toLocaleString('es-CO')} unidades</strong>
        </p>

        <form onSubmit={registrar}>
          <div className="form-group">
            <span>Tipo de Movimiento</span>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <button
                type="button"
                onClick={() => setTipoMovimiento(1)}
                style={{
                  flex: 1,
                  padding: '10px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '6px',
                  border: tipoMovimiento === 1 ? '2px solid #16a34a' : '1px solid #ccc',
                  backgroundColor: tipoMovimiento === 1 ? '#dcfce7' : 'white',
                  color: tipoMovimiento === 1 ? '#16a34a' : '#64748b',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                <ArrowDownToLine size={18} /> Entrada
              </button>
              <button
                type="button"
                onClick={() => setTipoMovimiento(2)}
                style={{
                  flex: 1,
                  padding: '10px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '6px',
                  border: tipoMovimiento === 2 ? '2px solid #dc2626' : '1px solid #ccc',
                  backgroundColor: tipoMovimiento === 2 ? '#fee2e2' : 'white',
                  color: tipoMovimiento === 2 ? '#dc2626' : '#64748b',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                <ArrowUpFromLine size={18} /> Salida
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '15px' }}>
            <label htmlFor="mov-cantidad">Cantidad (Unidades)</label>
            <input
              id="mov-cantidad"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              required
              min="1"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '25px', justifyContent: 'flex-end' }}>
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
            <button
              type="submit"
              className="btn-primary"
              style={{ backgroundColor: tipoMovimiento === 1 ? '#16a34a' : '#dc2626' }}
            >
              Confirmar {tipoMovimiento === 1 ? 'Entrada' : 'Salida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}