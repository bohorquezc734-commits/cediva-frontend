import { useState, type SubmitEvent } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { NuevaFacturaInput } from '../../hooks/useVerificacionMuelle';
import type { Producto } from '../../types/cediva';

interface ModalNuevaFacturaMuelleProps {
  readonly abierta: boolean;
  readonly productos: readonly Producto[];
  readonly onCerrar: () => void;
 readonly onCrearFactura: (datos: NuevaFacturaInput) => Promise<boolean> | boolean;
}

interface BorradorLinea {
  codigoBarras: string;
  cantidadPedida: number;
}

// === SUBCOMPONENTE: MODAL PARA CREAR FACTURA DE ALISTAMIENTO ===
export function ModalNuevaFacturaMuelle({
  abierta,
  productos,
  onCerrar,
  onCrearFactura,
}: ModalNuevaFacturaMuelleProps) {
  const [numeroFactura, setNumeroFactura] = useState('FAC-2026-0106');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteNit, setClienteNit] = useState('');
  const [muelle, setMuelle] = useState('Muelle 01 — Despachos Nacionales');

  const codigoInicial = productos[0]?.codigoBarras ?? '55667788';
  const [productoCodigoTemp, setProductoCodigoTemp] = useState(codigoInicial);
  const [cantidadTemp, setCantidadTemp] = useState(1);
  const [lineasBorrador, setLineasBorrador] = useState<BorradorLinea[]>([]);

  if (!abierta) return null;

  const handleAgregarLinea = () => {
    const codigo = productoCodigoTemp.trim();
    const cant = Math.max(1, Math.floor(cantidadTemp));

    if (!codigo) {
      toast.error('Selecciona o ingresa un código de barras.');
      return;
    }

    setLineasBorrador((prev) => {
      const yaExiste = prev.some((l) => l.codigoBarras === codigo);
      if (yaExiste) {
        return prev.map((l) =>
          l.codigoBarras === codigo
            ? { ...l, cantidadPedida: l.cantidadPedida + cant }
            : l
        );
      }
      return [...prev, { codigoBarras: codigo, cantidadPedida: cant }];
    });

    setCantidadTemp(1);
  };

  const handleEliminarLinea = (codigoBarras: string) => {
    setLineasBorrador((prev) => prev.filter((l) => l.codigoBarras !== codigoBarras));
  };

const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ok = await onCrearFactura({
      numeroFactura,
      clienteNombre,
      clienteNit,
      muelle,
      lineas: lineasBorrador,
    });

    if (ok) {
      setClienteNombre('');
      setClienteNit('');
      setLineasBorrador([]);
      onCerrar();
    }
  };
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '580px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Nueva Factura para Verificación en Muelle</h2>
          <button
            type="button"
            aria-label="Cerrar modal de nueva factura"
            onClick={onCerrar}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label htmlFor="fac-numero">Número de Factura</label>
              <input
                id="fac-numero"
                type="text"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fac-nit">NIT Cliente</label>
              <input
                id="fac-nit"
                type="text"
                placeholder="Ej. 900.123.456-7"
                value={clienteNit}
                onChange={(e) => setClienteNit(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="fac-cliente">Razón Social / Cliente</label>
            <input
              id="fac-cliente"
              type="text"
              placeholder="Ej. Distribuidora Central S.A.S."
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="fac-muelle">Muelle / Zona de Cargue</label>
            <input
              id="fac-muelle"
              type="text"
              value={muelle}
              onChange={(e) => setMuelle(e.target.value)}
              required
            />
          </div>

          <div
            style={{
              marginTop: '14px',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-subtle)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>
              Productos facturados a pistolear:
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                aria-label="Seleccionar producto"
                value={productoCodigoTemp}
                onChange={(e) => setProductoCodigoTemp(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                }}
              >
                {productos.map((p) => (
                  <option key={p.id} value={p.codigoBarras}>
                    {p.codigoBarras} — {p.nombre} (Stock: {p.stock})
                  </option>
                ))}
              </select>

              <input
                type="number"
                aria-label="Cantidad pedida"
                min={1}
                value={cantidadTemp}
                onChange={(e) => setCantidadTemp(Number(e.target.value))}
                style={{
                  width: '80px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                }}
              />

              <button
                type="button"
                onClick={handleAgregarLinea}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-tech)',
                  background: '#ffffff',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} /> Agregar
              </button>
            </div>

            {lineasBorrador.length > 0 && (
              <table style={{ marginTop: '12px' }}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Quitar</th>
                  </tr>
                </thead>
                <tbody>
                  {lineasBorrador.map((linea) => {
                    const prod = productos.find(
                      (p) => p.codigoBarras.trim() === linea.codigoBarras.trim()
                    );
                    return (
                      <tr key={linea.codigoBarras}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          {linea.codigoBarras}
                        </td>
                        <td>{prod ? prod.nombre : linea.codigoBarras}</td>
                        <td style={{ fontWeight: 700 }}>{linea.cantidadPedida} un.</td>
                        <td>
                          <button
                            type="button"
                            aria-label={`Quitar ${linea.codigoBarras}`}
                            onClick={() => handleEliminarLinea(linea.codigoBarras)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#dc2626',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
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
              Crear Factura en Muelle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}