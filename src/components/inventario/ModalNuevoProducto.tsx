import { useState, type SubmitEvent } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, extraerMensajeError } from '../../services/api';

interface ModalNuevoProductoProps {
  readonly abierta: boolean;
  readonly onCerrar: () => void;
  readonly onCreado: () => Promise<void>;
}

export function ModalNuevoProducto({ abierta, onCerrar, onCreado }: ModalNuevoProductoProps) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState(0);
  const [codigoBarras, setCodigoBarras] = useState('');

  if (!abierta) return null;

  const guardar = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      nombre,
      descripcion,
      codigoBarras,
      precioUnitario: precio,
      categoriaId: '11111111-1111-1111-1111-111111111111',
      marcaId: '22222222-2222-2222-2222-222222222222',
      unidadMedida: 1,
      imagenUrl: '',
      puntoReorden: 5,
    };

    const req = api.post('/ProductoControlador', payload).then((res) => {
      setNombre('');
      setDescripcion('');
      setPrecio(0);
      setCodigoBarras('');
      onCerrar();
      void onCreado();
      return res;
    });

    void toast.promise(req, {
      loading: 'Guardando producto...',
      success: '¡Producto registrado exitosamente!',
      error: (err) => extraerMensajeError(err, 'Error al guardar. Revisa los datos.'),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Registrar Nuevo Producto</h2>
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={onCerrar}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={guardar}>
          <div className="form-group">
            <label htmlFor="prod-nombre">Nombre del Producto</label>
            <input
              id="prod-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="prod-descripcion">Descripción</label>
            <input
              id="prod-descripcion"
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="prod-precio">Precio Unitario (COP)</label>
            <input
              id="prod-precio"
              type="number"
              value={precio}
              onChange={(e) => setPrecio(Number(e.target.value))}
              required
              min="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="prod-codigo">Código de Barras</label>
            <input
              id="prod-codigo"
              type="text"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              required
              pattern="\d{8,14}"
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
            <button type="submit" className="btn-primary">
              Guardar en Inventario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}