import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  PackageCheck,
  ScanBarcode,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, extraerMensajeError } from '../../services/api';
import type { Producto } from '../../types/cediva';

interface EstacionPistoleoInventarioProps {
  readonly productos: readonly Producto[];
  readonly onRecargarDatos: () => Promise<void>;
}

interface ItemPicking {
  producto: Producto;
  cantidad: number;
}

export function EstacionPistoleoInventario({
  productos,
  onRecargarDatos,
}: EstacionPistoleoInventarioProps) {
  const [modo, setModo] = useState<'picking' | 'recepcion'>('picking');
  const [codigo, setCodigo] = useState('');
  const [lote, setLote] = useState<ItemPicking[]>([]);
  const [procesando, setProcesando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [modo]);

  const totalUnidades = useMemo(
    () => lote.reduce((acc, item) => acc + item.cantidad, 0),
    [lote]
  );

  const agregarProducto = (producto: Producto) => {
    setLote((prev) => {
      const existente = prev.find((item) => item.producto.id === producto.id);
      const actual = existente ? existente.cantidad : 0;

      if (modo === 'picking' && actual + 1 > producto.stock) {
        toast.error(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock} un.`);
        return prev;
      }

      if (existente) {
        toast.success(`+1 ${producto.nombre} (${actual + 1} un.)`);
        return prev.map((item) =>
          item.producto.id === producto.id
            ? { ...item, producto, cantidad: item.cantidad + 1 }
            : item
        );
      }

      toast.success(`Escaneado: ${producto.nombre}`);
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const limpio = codigo.trim();
    setCodigo('');
    if (!limpio) return;

    const encontrado = productos.find(
      (p) => p.codigoBarras.trim().toLowerCase() === limpio.toLowerCase()
    );

    if (!encontrado) {
      toast.error(`Código no reconocido: "${limpio}"`);
      return;
    }

    agregarProducto(encontrado);
  };

  const cambiarCantidad = (productoId: string, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      setLote((prev) => prev.filter((item) => item.producto.id !== productoId));
      return;
    }

    setLote((prev) =>
      prev.map((item) => {
        if (item.producto.id !== productoId) return item;
        if (modo === 'picking' && nuevaCantidad > item.producto.stock) {
          toast.error(`Máximo disponible en bodega: ${item.producto.stock} un.`);
          return item;
        }
        return { ...item, cantidad: nuevaCantidad };
      })
    );
  };

  const confirmarLote = async () => {
    if (lote.length === 0) return;

    const tipoOperacion = modo === 'recepcion' ? 1 : 2;
    const etiqueta = modo === 'recepcion' ? 'Recepción / Entrada' : 'Picking & Packing (Salida)';

    try {
      setProcesando(true);
      await Promise.all(
        lote.map((item) =>
          api.post('/InventarioControlador/movimiento', {
            productoId: item.producto.id,
            cantidadValor: item.cantidad,
            tipo: tipoOperacion,
          })
        )
      );

      toast.success(`¡${etiqueta} confirmado! (${totalUnidades} unidades procesadas)`);
      setLote([]);
      await onRecargarDatos();
      inputRef.current?.focus();
    } catch (err) {
      toast.error(extraerMensajeError(err, 'Error al confirmar el lote escaneado'));
    } finally {
      setProcesando(false);
    }
  };

  let textoBotonConfirmar = 'Confirmar Ingreso a Bodega';
  if (procesando) {
    textoBotonConfirmar = 'Procesando...';
  } else if (modo === 'picking') {
    textoBotonConfirmar = 'Confirmar Packing y Descontar Stock';
  }

  return (
    <div className="table-container" style={{ marginBottom: '22px', border: '1px solid var(--border-tech)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ScanBarcode size={22} color="#0284c7" />
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>
            Estación de Pistoleo RF
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              setModo('picking');
              setLote([]);
            }}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: modo === 'picking' ? '1.5px solid #0284c7' : '1px solid var(--border-subtle)',
              backgroundColor: modo === 'picking' ? '#e0f2fe' : '#ffffff',
              color: modo === 'picking' ? '#0369a1' : '#475569',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowUpFromLine size={16} /> Picking & Packing (Salida)
          </button>

          <button
            type="button"
            onClick={() => {
              setModo('recepcion');
              setLote([]);
            }}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: modo === 'recepcion' ? '1.5px solid #16a34a' : '1px solid var(--border-subtle)',
              backgroundColor: modo === 'recepcion' ? '#dcfce7' : '#ffffff',
              color: modo === 'recepcion' ? '#15803d' : '#475569',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowDownToLine size={16} /> Recepción (Entrada)
          </button>
        </div>
      </div>

      <div className="search-bar" style={{ marginBottom: lote.length > 0 ? '16px' : 0 }}>
        <ScanBarcode size={20} color="#0284c7" />
        <input
          ref={inputRef}
          id="pistoleo-codigo"
          type="text"
          placeholder={
            modo === 'picking'
              ? 'Pistolea el código de barras para agregar al Picking / Packing (Enter)...'
              : 'Pistolea el código de barras para dar ingreso a bodega (Enter)...'
          }
          className="search-input"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {lote.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
              <PackageCheck
                size={16}
                style={{ verticalAlign: 'text-bottom', marginRight: '6px', color: '#0284c7' }}
              />
              Lote escaneado: {lote.length} referencia(s) — {totalUnidades} unidad(es)
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setLote([])}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  color: '#64748b',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Limpiar lote
              </button>

              <button
                type="button"
                className="btn-primary"
                disabled={procesando}
                onClick={() => void confirmarLote()}
                style={{ backgroundColor: modo === 'picking' ? '#0284c7' : '#16a34a' }}
              >
                <CheckCircle2 size={18} />
                {textoBotonConfirmar}
              </button>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Stock Bodega</th>
                <th>Cant. Escaneada</th>
                <th>Quitar</th>
              </tr>
            </thead>
            <tbody>
              {lote.map((item) => (
                <tr key={item.producto.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {item.producto.codigoBarras}
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.producto.nombre}</td>
                  <td>{item.producto.stock.toLocaleString('es-CO')} un.</td>
                  <td>
                    <input
                      type="number"
                      aria-label={`Cantidad para ${item.producto.nombre}`}
                      min={1}
                      max={modo === 'picking' ? item.producto.stock : undefined}
                      value={item.cantidad}
                      onChange={(e) => cambiarCantidad(item.producto.id, Number(e.target.value))}
                      style={{
                        width: '74px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        fontWeight: 700,
                      }}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      aria-label={`Quitar ${item.producto.nombre}`}
                      onClick={() => cambiarCantidad(item.producto.id, 0)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}