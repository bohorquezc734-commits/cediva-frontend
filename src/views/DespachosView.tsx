import { useState, type SubmitEvent } from 'react';
import axios from 'axios';
import { Truck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import type { ClienteDto, ItemCarrito, Producto } from '../types/cediva';

interface DespachosViewProps {
  readonly productos: readonly Producto[];
  readonly clientes: readonly ClienteDto[];
  readonly onRecargarDatos: () => Promise<void>;
}

const API_URL = 'https://localhost:5001/api';

export function DespachosView({ productos, clientes, onRecargarDatos }: DespachosViewProps) {
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState('');
  const [carritoDespacho, setCarritoDespacho] = useState<ItemCarrito[]>([]);
  const [productoParaAgregar, setProductoParaAgregar] = useState('');
  const [cantidadParaAgregar, setCantidadParaAgregar] = useState(1);

  const agregarAlCarrito = () => {
    if (!productoParaAgregar) return;
    const prod = productos.find((p) => p.id === productoParaAgregar);
    if (!prod) return;

    if (cantidadParaAgregar > prod.stock) {
      toast.error(`Solo hay ${prod.stock} unidades en stock.`);
      return;
    }

    const yaExiste = carritoDespacho.some((item) => item.producto.id === productoParaAgregar);
    if (yaExiste) {
      setCarritoDespacho(
        carritoDespacho.map((item) =>
          item.producto.id === productoParaAgregar
            ? { ...item, cantidad: item.cantidad + cantidadParaAgregar }
            : item
        )
      );
    } else {
      setCarritoDespacho([...carritoDespacho, { producto: prod, cantidad: cantidadParaAgregar }]);
    }

    setCantidadParaAgregar(1);
    setProductoParaAgregar('');
  };

  const eliminarDelCarrito = (id: string) => {
    setCarritoDespacho(carritoDespacho.filter((item) => item.producto.id !== id));
  };

  const procesarDespacho = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (carritoDespacho.length === 0 || !clienteSeleccionadoId) {
      toast.error('Selecciona un cliente y agrega productos');
      return;
    }

    const clienteObj = clientes.find((c) => c.id === clienteSeleccionadoId);

    const payload = {
      clienteNombre: clienteObj ? clienteObj.nombre : 'Cliente Desconocido',
      items: carritoDespacho.map((item) => ({
        productoId: item.producto.id,
        cantidad: item.cantidad,
      })),
    };

    const req = axios.post(`${API_URL}/DespachoControlador`, payload).then((res) => {
      setClienteSeleccionadoId('');
      setCarritoDespacho([]);
      void onRecargarDatos();
      return res;
    });

    void toast.promise(req, {
      loading: 'Procesando despacho...',
      success: '¡Despacho generado y stock descontado!',
      error: (err) => err.response?.data?.detail || 'Error al procesar el despacho',
    });
  };

  return (
    <>
      <div className="header-action">
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>Generar Despacho</h1>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>
            Prepara la salida de mercancía
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>1. Agregar Productos</h3>
          <div className="form-group">
            <label htmlFor="despacho-producto">Seleccionar Producto</label>
            <select
              id="despacho-producto"
              value={productoParaAgregar}
              onChange={(e) => setProductoParaAgregar(e.target.value)}
            >
              <option value="">-- Seleccione --</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (Stock: {p.stock})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="despacho-cantidad">Cantidad a despachar</label>
            <input
              id="despacho-cantidad"
              type="number"
              value={cantidadParaAgregar}
              onChange={(e) => setCantidadParaAgregar(Number(e.target.value))}
              min="1"
            />
          </div>
          <button
            type="button"
            onClick={agregarAlCarrito}
            className="btn-primary"
            style={{ justifyContent: 'center' }}
          >
            Agregar a la lista
          </button>
        </div>

        <div className="kpi-card">
          <h3 style={{ margin: 0, fontSize: '18px', marginBottom: '15px' }}>
            2. Resumen del Despacho
          </h3>
          {carritoDespacho.length === 0 ? (
            <p style={{ color: '#64748b' }}>No hay productos agregados.</p>
          ) : (
            <table style={{ fontSize: '14px' }}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {carritoDespacho.map((item) => (
                  <tr key={item.producto.id}>
                    <td>{item.producto.nombre}</td>
                    <td>{item.cantidad}</td>
                    <td>
                      <button
                        type="button"
                        aria-label={`Eliminar ${item.producto.nombre}`}
                        onClick={() => eliminarDelCarrito(item.producto.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} color="#dc2626" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <form
            onSubmit={procesarDespacho}
            style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '20px' }}
          >
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="despacho-cliente">Seleccionar Cliente (Buscar por Nombre o NIT)</label>
              <Select
                inputId="despacho-cliente"
                options={clientes.map((c) => ({
                  value: c.id,
                  label: `${c.nombre} - NIT: ${c.nit}`,
                }))}
                onChange={(opcion) => setClienteSeleccionadoId(opcion ? opcion.value : '')}
                placeholder="Escriba para buscar..."
                isClearable
                styles={{
                  control: (base) => ({
                    ...base,
                    padding: '4px',
                    borderRadius: '6px',
                    borderColor: '#e2e8f0',
                  }),
                  menu: (base) => ({ ...base, zIndex: 9999 }),
                }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', backgroundColor: '#16a34a' }}
            >
              <Truck size={20} /> Confirmar y Descontar Stock
            </button>
          </form>
        </div>
      </div>
    </>
  );
}