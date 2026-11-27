import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { CONFIGURACION_PAGINACION } from '../constants/operacion';
import { PaginacionTabla } from '../components/PaginacionTabla';
import type { DespachoHistorialDto, Producto } from '../types/cediva';

interface HistorialViewProps {
  readonly despachosHistorial: readonly DespachoHistorialDto[];
  readonly productos: readonly Producto[];
}

function formatearFechaHoraDespacho(fecha: string | null | undefined): string {
  if (!fecha) return 'Fecha no disponible';

  const fechaHora = new Date(fecha);
  if (Number.isNaN(fechaHora.getTime())) return 'Fecha no disponible';
  return fechaHora.toLocaleString('es-CO');
}

export function HistorialView({ despachosHistorial, productos }: HistorialViewProps) {
  const [filtroClienteHistorial, setFiltroClienteHistorial] = useState('');
  const [filtroFechaHistorial, setFiltroFechaHistorial] = useState('');
  const [paginaActual, setPaginaActual] = useState<number>(
    CONFIGURACION_PAGINACION.PAGINA_INICIAL
  );
  const [tamanoPagina, setTamanoPagina] = useState<number>(
    CONFIGURACION_PAGINACION.TAMANO_PAGINA
  );

  const historialFiltrado = useMemo(() => {
    return despachosHistorial.filter((despacho) => {
      const coincideCliente = despacho.cliente
        .toLowerCase()
        .includes(filtroClienteHistorial.toLowerCase());
      const fechaDespacho = despacho.fecha?.split('T')[0] ?? '';
      const coincideFecha = filtroFechaHistorial ? fechaDespacho === filtroFechaHistorial : true;
      return coincideCliente && coincideFecha;
    });
  }, [despachosHistorial, filtroClienteHistorial, filtroFechaHistorial]);

  const totalPaginas = Math.max(
    CONFIGURACION_PAGINACION.MINIMO_TOTAL_PAGINAS,
    Math.ceil(historialFiltrado.length / tamanoPagina)
  );
  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const historialPaginado = useMemo(() => {
    const inicio = (paginaSegura - 1) * tamanoPagina;
    return historialFiltrado.slice(inicio, inicio + tamanoPagina);
  }, [historialFiltrado, paginaSegura, tamanoPagina]);

  const handleCambioCliente = (valor: string) => {
    setFiltroClienteHistorial(valor);
    setPaginaActual(CONFIGURACION_PAGINACION.PAGINA_INICIAL);
  };

  const handleCambioFecha = (valor: string) => {
    setFiltroFechaHistorial(valor);
    setPaginaActual(CONFIGURACION_PAGINACION.PAGINA_INICIAL);
  };

  const handleLimpiarFiltros = () => {
    setFiltroClienteHistorial('');
    setFiltroFechaHistorial('');
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
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>Historial de Despachos</h1>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>
            Registro de salidas de mercancía
          </p>
        </div>
      </div>

      <div className="table-container">
        <div
          style={{
            padding: '15px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            flexWrap: 'wrap',
            backgroundColor: '#f8fafc',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              minWidth: '220px',
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '6px',
              padding: '0 10px',
            }}
          >
            <Search size={18} color="#64748b" />
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={filtroClienteHistorial}
              onChange={(e) => handleCambioCliente(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 0',
                border: 'none',
                outline: 'none',
                background: 'transparent',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '6px',
              padding: '0 10px',
            }}
          >
            <input
              type="date"
              value={filtroFechaHistorial}
              onChange={(e) => handleCambioFecha(e.target.value)}
              style={{
                padding: '10px 0',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: '#64748b',
              }}
            />
          </div>

          {(filtroClienteHistorial || filtroFechaHistorial) && (
            <button
              type="button"
              onClick={handleLimpiarFiltros}
              style={{
                padding: '10px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Limpiar Filtros
            </button>
          )}
        </div>

        <table>
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Cliente / Destino</th>
              <th>Productos Despachados</th>
              <th>Total Ítems</th>
            </tr>
          </thead>
          <tbody>
            {historialPaginado.map((despacho) => (
              <tr key={despacho.id}>
                <td>{formatearFechaHoraDespacho(despacho.fecha)}</td>
                <td style={{ fontWeight: 500 }}>{despacho.cliente}</td>
                <td>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                    {despacho.items.map((item) => (
                      <li key={`${despacho.id}-${item.productoId}`}>
                        {productos.find((p) => p.id === item.productoId)?.nombre || 'Producto'} x{' '}
                        {item.cantidad}
                      </li>
                    ))}
                  </ul>
                </td>
                <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                  {despacho.items.reduce((acc, item) => acc + item.cantidad, 0)} un.
                </td>
              </tr>
            ))}

            {historialPaginado.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No se encontraron despachos con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <PaginacionTabla
          paginaActual={paginaSegura}
          totalItems={historialFiltrado.length}
          tamanoPagina={tamanoPagina}
          onCambiarPagina={setPaginaActual}
          onCambiarTamano={handleCambioTamano}
        />
      </div>
    </>
  );
}