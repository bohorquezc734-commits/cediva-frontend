import { useState, useMemo, type SubmitEvent } from 'react';
import { Plus, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, extraerMensajeError } from '../services/api';
import { PaginacionTabla } from '../components/PaginacionTabla';
import type { ClienteDto, CrearClientePayload } from '../types/cediva';

interface ClientesViewProps {
  readonly clientes: readonly ClienteDto[];
  readonly cargando: boolean;
  readonly onRecargarDatos: () => Promise<void>;
}

export function ClientesView({ clientes, cargando, onRecargarDatos }: ClientesViewProps) {
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [tamanoPagina, setTamanoPagina] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [nit, setNit] = useState('');

  const clientesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return clientes;

    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(termino) ||
        c.nit.toLowerCase().includes(termino)
    );
  }, [clientes, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / tamanoPagina));
  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const clientesPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * tamanoPagina;
    return clientesFiltrados.slice(inicio, inicio + tamanoPagina);
  }, [clientesFiltrados, paginaSegura, tamanoPagina]);

  const handleCambioBusqueda = (valor: string) => {
    setBusqueda(valor);
    setPaginaActual(1);
  };

  const handleCambioTamano = (nuevoTamano: number) => {
    setTamanoPagina(nuevoTamano);
    setPaginaActual(1);
  };

  const guardarCliente = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nuevoCliente: CrearClientePayload = {
      nombre: nombre.trim(),
      nit: nit.trim(),
    };

    const req = api.post('/ClienteControlador', nuevoCliente).then((res) => {
      setIsModalOpen(false);
      setNombre('');
      setNit('');
      void onRecargarDatos();
      return res;
    });

    void toast.promise(req, {
      loading: 'Guardando cliente...',
      success: '¡Cliente registrado exitosamente!',
      error: (err) => extraerMensajeError(err, 'Error al registrar el cliente. Revisa los datos.'),
    });
  };

  return (
    <>
      <div className="header-action">
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>Gestión de Clientes</h1>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>
            Administra los clientes registrados para despachos
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Nuevo Cliente
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Total Clientes</div>
          <div className="kpi-value">{clientes.length}</div>
        </div>
      </div>

      <div className="table-container">
        <div className="search-bar">
          <Search size={20} color="#64748b" />
          <input
            type="text"
            placeholder="Buscar por nombre o NIT..."
            className="search-input"
            value={busqueda}
            onChange={(e) => handleCambioBusqueda(e.target.value)}
          />
        </div>

        {cargando ? (
          <p style={{ padding: '20px' }}>Cargando clientes...</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>NIT</th>
                  <th>Nombre / Razón Social</th>
                </tr>
              </thead>
              <tbody>
                {clientesPaginados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{cliente.nit}</td>
                    <td style={{ fontWeight: 500 }}>{cliente.nombre}</td>
                  </tr>
                ))}

                {clientesPaginados.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No se encontraron clientes con ese criterio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <PaginacionTabla
              paginaActual={paginaSegura}
              totalItems={clientesFiltrados.length}
              tamanoPagina={tamanoPagina}
              onCambiarPagina={setPaginaActual}
              onCambiarTamano={handleCambioTamano}
            />
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Registrar Nuevo Cliente</h2>
              <button
                type="button"
                aria-label="Cerrar modal de cliente"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={guardarCliente}>
              <div className="form-group">
                <label htmlFor="cliente-nombre">Nombre o Razón Social</label>
                <input
                  id="cliente-nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cliente-nit">NIT</label>
                <input
                  id="cliente-nit"
                  type="text"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '25px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}