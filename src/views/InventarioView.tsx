import { useMemo, useState } from 'react';
import { ArrowRightLeft, Plus, Search } from 'lucide-react';
import { EstacionPistoleoInventario } from '../components/inventario/EstacionPistoleoInventario';
import { ModalMovimientoInventario } from '../components/inventario/ModalMovimientoInventario';
import { ModalNuevoProducto } from '../components/inventario/ModalNuevoProducto';
import { PaginacionTabla } from '../components/PaginacionTabla';
import { ROLES_USUARIO } from '../constants/roles';
import {
  CONFIGURACION_PAGINACION,
  UMBRALES_INVENTARIO,
} from '../constants/operacion';
import type { Producto, RolUsuario } from '../types/cediva';

interface InventarioViewProps {
  readonly productos: readonly Producto[];
  readonly cargando: boolean;
  readonly puedeCrearProducto: boolean;
  readonly usuarioRol: RolUsuario;
  readonly onRecargarDatos: () => Promise<void>;
}

function getStockBadgeStyle(stock: number): { backgroundColor: string; color: string } {
  if (stock > UMBRALES_INVENTARIO.STOCK_ALTO) {
    return { backgroundColor: '#dcfce7', color: '#16a34a' };
  }
  if (stock > 0) return { backgroundColor: '#fef08a', color: '#854d0e' };
  return { backgroundColor: '#fee2e2', color: '#dc2626' };
}

export function InventarioView({
  productos,
  cargando,
  puedeCrearProducto,
  usuarioRol,
  onRecargarDatos,
}: InventarioViewProps) {
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState<number>(
    CONFIGURACION_PAGINACION.PAGINA_INICIAL
  );
  const [tamanoPagina, setTamanoPagina] = useState<number>(
    CONFIGURACION_PAGINACION.TAMANO_PAGINA
  );
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [productoMovimiento, setProductoMovimiento] = useState<Producto | null>(null);

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(
      (p) => p.nombre.toLowerCase().includes(q) || p.codigoBarras.includes(q)
    );
  }, [productos, busqueda]);

  const totalPaginas = Math.max(
    CONFIGURACION_PAGINACION.MINIMO_TOTAL_PAGINAS,
    Math.ceil(productosFiltrados.length / tamanoPagina)
  );
  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const productosPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * tamanoPagina;
    return productosFiltrados.slice(inicio, inicio + tamanoPagina);
  }, [productosFiltrados, paginaSegura, tamanoPagina]);

  const valorTotalInventario = useMemo(
    () => productos.reduce((acc, p) => acc + p.precioUnitario * p.stock, 0),
    [productos]
  );

  const handleCambioBusqueda = (valor: string) => {
    setBusqueda(valor);
    setPaginaActual(CONFIGURACION_PAGINACION.PAGINA_INICIAL);
  };

  const handleCambioTamano = (nuevoTamano: number) => {
    setTamanoPagina(nuevoTamano);
    setPaginaActual(CONFIGURACION_PAGINACION.PAGINA_INICIAL);
  };

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
        {usuarioRol === ROLES_USUARIO.ADMINISTRADOR && (
          <div className="kpi-card">
            <div className="kpi-title">Valor del Inventario</div>
            <div className="kpi-value">${valorTotalInventario.toLocaleString('es-CO')}</div>
          </div>
        )}
      </div>

      <div className="table-container">
        <div className="search-bar">
          <Search size={20} color="#64748b" />
          <input
            type="text"
            placeholder="Filtrar inventario por nombre o código de barras..."
            className="search-input"
            value={busqueda}
            onChange={(e) => handleCambioBusqueda(e.target.value)}
          />
        </div>

        {cargando ? (
          <p style={{ padding: '20px' }}>Cargando datos de la bodega...</p>
        ) : (
          <>
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
                {productosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No hay productos que coincidan con el filtro.
                    </td>
                  </tr>
                ) : (
                  productosPaginados.map((prod) => {
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
                  })
                )}
              </tbody>
            </table>

            <PaginacionTabla
              paginaActual={paginaSegura}
              totalItems={productosFiltrados.length}
              tamanoPagina={tamanoPagina}
              onCambiarPagina={setPaginaActual}
              onCambiarTamano={handleCambioTamano}
            />
          </>
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