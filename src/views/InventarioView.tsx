import { useMemo, useState } from 'react';
import { ArrowRightLeft, Plus, Search } from 'lucide-react';
import { EstacionPistoleoInventario } from '../components/inventario/EstacionPistoleoInventario';
import { ModalMovimientoInventario } from '../components/inventario/ModalMovimientoInventario';
import { ModalNuevoProducto } from '../components/inventario/ModalNuevoProducto';
import type { Producto } from '../types/cediva';

interface InventarioViewProps {
  readonly productos: readonly Producto[];
  readonly cargando: boolean;
  readonly puedeCrearProducto: boolean;
  readonly onRecargarDatos: () => Promise<void>;
}

function getStockBadgeStyle(stock: number): { backgroundColor: string; color: string } {
  if (stock > 10) return { backgroundColor: '#dcfce7', color: '#16a34a' };
  if (stock > 0) return { backgroundColor: '#fef08a', color: '#854d0e' };
  return { backgroundColor: '#fee2e2', color: '#dc2626' };
}

export function InventarioView({
  productos,
  cargando,
  puedeCrearProducto,
  onRecargarDatos,
}: InventarioViewProps) {
  const [busqueda, setBusqueda] = useState('');
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [productoMovimiento, setProductoMovimiento] = useState<Producto | null>(null);

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(
      (p) => p.nombre.toLowerCase().includes(q) || p.codigoBarras.includes(q)
    );
  }, [productos, busqueda]);

  const valorTotalInventario = useMemo(
    () => productos.reduce((acc, p) => acc + p.precioUnitario * p.stock, 0),
    [productos]
  );

  return (
    <>
      <div className="header-action">
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>
            Operación de Bodega & Inventario
          </h1>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>
            Pistoleo RF para Picking, Packing y Recepción de mercancía
          </p>
        </div>
        {puedeCrearProducto && (
          <button type="button" className="btn-primary" onClick={() => setModalNuevoAbierto(true)}>
            <Plus size={20} /> Nuevo Producto
          </button>
        )}
      </div>

      <EstacionPistoleoInventario productos={productos} onRecargarDatos={onRecargarDatos} />

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Total Productos</div>
          <div className="kpi-value">{productos.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Valor del Inventario</div>
          <div className="kpi-value">${valorTotalInventario.toLocaleString('es-CO')}</div>
        </div>
      </div>

      <div className="table-container">
        <div className="search-bar">
          <Search size={20} color="#64748b" />
          <input
            type="text"
            placeholder="Filtrar inventario por nombre o código de barras..."
            className="search-input"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {cargando ? (
          <p style={{ padding: '20px' }}>Cargando datos de la bodega...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((prod) => {
                const badgeStyle = getStockBadgeStyle(prod.stock);
                return (
                  <tr key={prod.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{prod.codigoBarras}</td>
                    <td style={{ fontWeight: 500 }}>{prod.nombre}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      ${prod.precioUnitario.toLocaleString('es-CO')}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          ...badgeStyle,
                        }}
                      >
                        {prod.stock.toLocaleString('es-CO')} un.
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setProductoMovimiento(prod)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          whiteSpace: 'nowrap',
                          gap: '5px',
                          padding: '6px 12px',
                          backgroundColor: '#eff6ff',
                          color: 'var(--primary)',
                          border: '1px solid #bfdbfe',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                        }}
                      >
                        <ArrowRightLeft size={16} /> Movimiento
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ModalNuevoProducto
        abierta={modalNuevoAbierto}
        onCerrar={() => setModalNuevoAbierto(false)}
        onCreado={onRecargarDatos}
      />

      <ModalMovimientoInventario
        producto={productoMovimiento}
        onCerrar={() => setProductoMovimiento(null)}
        onRegistrado={onRecargarDatos}
      />
    </>
  );
}