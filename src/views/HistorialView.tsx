import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { DespachoHistorialDto, Producto } from '../types/cediva';

interface HistorialViewProps {
  readonly despachosHistorial: readonly DespachoHistorialDto[];
  readonly productos: readonly Producto[];
}

export function HistorialView({ despachosHistorial, productos }: HistorialViewProps) {
  const [filtroClienteHistorial, setFiltroClienteHistorial] = useState('');
  const [filtroFechaHistorial, setFiltroFechaHistorial] = useState('');

  const historialFiltrado = useMemo(() => {
    return despachosHistorial.filter((despacho) => {
      const coincideCliente = despacho.cliente
        .toLowerCase()
        .includes(filtroClienteHistorial.toLowerCase());
      const fechaDespacho = despacho.fecha.split('T')[0];
      const coincideFecha = filtroFechaHistorial ? fechaDespacho === filtroFechaHistorial : true;
      return coincideCliente && coincideFecha;
    });
  }, [despachosHistorial, filtroClienteHistorial, filtroFechaHistorial]);

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
            backgroundColor: '#f8fafc',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
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
              onChange={(e) => setFiltroClienteHistorial(e.target.value)}
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
              onChange={(e) => setFiltroFechaHistorial(e.target.value)}
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
              onClick={() => {
                setFiltroClienteHistorial('');
                setFiltroFechaHistorial('');
              }}
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
            {historialFiltrado.map((despacho) => (
              <tr key={despacho.id}>
                <td>{new Date(despacho.fecha).toLocaleString('es-CO')}</td>
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

            {historialFiltrado.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No se encontraron despachos con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}