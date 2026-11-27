import { useState, type SubmitEvent } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, extraerMensajeError } from '../../services/api';
import {
  LIMITES_OPERACION,
  TIPOS_MOVIMIENTO_INVENTARIO,
  type TipoMovimientoInventario,
} from '../../constants/operacion';
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
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimientoInventario>(
    TIPOS_MOVIMIENTO_INVENTARIO.ENTRADA
  );
  const [cantidad, setCantidad] = useState<number>(
    LIMITES_OPERACION.CANTIDAD_MINIMA
  );

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
        setCantidad(LIMITES_OPERACION.CANTIDAD_MINIMA);
        onCerrar();
        void onRegistrado();
        return res;
      });

    void toast.promise(req, {
      loading: 'Procesando movimiento...',
      success: `¡${tipoMovimiento === TIPOS_MOVIMIENTO_INVENTARIO.ENTRADA ? 'Entrada' : 'Salida'} registrada con éxito!`,
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
                onClick={() => setTipoMovimiento(TIPOS_MOVIMIENTO_INVENTARIO.ENTRADA)}
                style={{
                  flex: 1,
                  padding: '10px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '6px',
                  border: tipoMovimiento === TIPOS_MOVIMIENTO_INVENTARIO.ENTRADA ? '2px solid #16a34a' : '1px solid #ccc',
                  backgroundColor: tipoMovimiento === TIPOS_MOVIMIENTO_INVENTARIO.ENTRADA ? '#dcfce7' : 'white',
                  color: tipoMovimiento === TIPOS_MOVIMIENTO_INVENTARIO.ENTRADA ? '#16a34a' : '#64748b',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                <ArrowDownToLine size={18} /> Entrada
              </button>
              <button
                type="button"
                onClick={() => setTipoMovimiento(TIPOS_MOVIMIENTO_INVENTARIO.SALIDA)}
                style={{
                  flex: 1,
                  padding: '10px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '6px',
                  border: tipoMovimiento === TIPOS_MOVIMIENTO_INVENTARIO.SALIDA ? '2px solid #dc2626' : '1px solid #ccc',
                  backgroundColor: tipoMovimiento === TIPOS_MOVIMIENTO_INVENTARIO.SALIDA ? '#fee2e2' : 'white',
                  color: tipoMovimiento === TIPOS_MOVIMIENTO_INVENTARIO.SALIDA ? '#dc2626' : '#64748b',
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
              min={LIMITES_OPERACION.CANTIDAD_MINIMA}
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
              style={{
                backgroundColor:
                  tipoMovimiento === TIPOS_MOVIMIENTO_INVENTARIO.ENTRADA
                    ? '#16a34a'
                    : '#dc2626',
              }}
            >
              Confirmar {tipoMovimiento === TIPOS_MOVIMIENTO_INVENTARIO.ENTRADA ? 'Entrada' : 'Salida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}