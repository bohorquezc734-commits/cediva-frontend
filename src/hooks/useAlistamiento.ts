import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import toast from 'react-hot-toast';
import { api, extraerMensajeError } from '../services/api';
import {
  CANTIDADES_MUELLE,
  ESTADOS_MUELLE,
  MENSAJES_MUELLE,
} from '../constants/muelle';
import { INTERVALOS_OPERACION_MS } from '../constants/operacion';
import type { OrdenFacturaMuelle, Producto } from '../types/cediva';

interface UseAlistamientoParams {
  readonly productos: readonly Producto[];
  readonly facturas: readonly OrdenFacturaMuelle[];
  readonly onCambiarFacturas: (updater: (prev: OrdenFacturaMuelle[]) => OrdenFacturaMuelle[]) => void;
  readonly operadorNombre: string;
  readonly onSincronizarOrdenesMuelle: () => Promise<void>;
}

export function useAlistamiento({
  productos,
  facturas,
  onCambiarFacturas,
  operadorNombre,
  onSincronizarOrdenesMuelle,
}: UseAlistamientoParams) {
  const pendientes = useMemo(
    () => facturas.filter((f) => f.estado === ESTADOS_MUELLE.POR_ALISTAR),
    [facturas]
  );
  const [facturaId, setFacturaId] = useState(pendientes[0]?.id ?? '');
  const [codigo, setCodigo] = useState('');
  const [alistando, setAlistando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ultimoPistoleoRef = useRef<number>(
    INTERVALOS_OPERACION_MS.TIEMPO_INICIAL_PISTOLEO
  );

  const facturaIdSeleccionada = pendientes.some((factura) => factura.id === facturaId)
    ? facturaId
    : pendientes[0]?.id ?? '';

  useEffect(() => {
    inputRef.current?.focus();
  }, [facturaIdSeleccionada]);

  const activa = useMemo(
    () => pendientes.find((f) => f.id === facturaIdSeleccionada) ?? pendientes[0],
    [pendientes, facturaIdSeleccionada]
  );

  const resumen = useMemo(() => {
    const pedido = activa?.lineas.reduce((total, linea) => total + linea.cantidadPedida, 0) ?? 0;
    const alistado = activa?.lineas.reduce(
      (total, linea) => total + (linea.cantidadAlistada ?? linea.cantidadPistoleada),
      0
    ) ?? 0;
    return {
      pedido,
      alistado,
      faltantes: Math.max(0, pedido - alistado),
      completa: Boolean(activa?.lineas.length) && activa!.lineas.every((linea) =>
        (linea.cantidadAlistada ?? linea.cantidadPistoleada) >= linea.cantidadPedida
      ),
    };
  }, [activa]);

  const procesarCodigo = (codigoRaw: string) => {
    const ahora = Date.now();
    if (ahora - ultimoPistoleoRef.current < INTERVALOS_OPERACION_MS.ANTI_RAFAGA_PISTOLEO) return;
    ultimoPistoleoRef.current = ahora;

    const codigoLimpio = codigoRaw.trim();
    setCodigo('');
    if (!codigoLimpio || !activa) return;

    const linea = activa.lineas.find(
      (item) => item.codigoBarras.trim().toLowerCase() === codigoLimpio.toLowerCase()
    );
    if (!linea) {
      toast.error(`Codigo ${codigoLimpio} no pertenece a esta factura.`);
      return;
    }

    const alistada = linea.cantidadAlistada ?? linea.cantidadPistoleada;
    if (alistada >= linea.cantidadPedida) {
      toast.error(`La linea ${codigoLimpio} ya tiene todas las unidades.`);
      return;
    }

    const producto = productos.find(
      (item) => item.codigoBarras.trim().toLowerCase() === codigoLimpio.toLowerCase()
    );
    if (producto && alistada + 1 > producto.stock) {
      toast.error(`Stock insuficiente para ${producto.nombre}.`);
      return;
    }

    onCambiarFacturas((prev) => prev.map((factura) =>
      factura.id === activa.id
        ? {
            ...factura,
            lineas: factura.lineas.map((item) =>
              item.codigoBarras === linea.codigoBarras
               ? {
                   ...item,
                   cantidadAlistada: alistada + 1,
                   cantidadPistoleada: CANTIDADES_MUELLE.SIN_UNIDADES,
                 }
                : item
            ),
          }
        : factura
    ));
    toast.success(`${producto?.nombre ?? codigoLimpio}: ${alistada + 1}/${linea.cantidadPedida}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    procesarCodigo(codigo);
  };

  const enviarAlMuelle = async () => {
    if (!activa || !resumen.completa || alistando) return;

    const horaAlistamiento = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const lineasAlistadas = activa.lineas.map((linea) => ({
      codigoBarras: linea.codigoBarras,
      cantidadAlistada: linea.cantidadAlistada ?? linea.cantidadPistoleada,
    }));

    try {
      setAlistando(true);
      await api.put(`/MuelleControlador/${activa.id}/alistar`, {
        alistadoPor: operadorNombre,
        horaAlistamiento,
        lineasAlistadas,
      });
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No se pudo alistar la orden.'));
      setAlistando(false);
      return;
    }

    onCambiarFacturas((prev) => prev.map((factura) =>
      factura.id === activa.id
        ? {
            ...factura,
            estado: ESTADOS_MUELLE.ALISTADA,
            alistadoPor: operadorNombre,
            horaAlistamiento,
          }
        : factura
    ));
    toast.success(`Orden ${activa.numeroFactura} enviada al muelle.`);
    setCodigo('');

    try {
      await onSincronizarOrdenesMuelle();
    } catch (err) {
      toast.error(
        `La orden ${activa.numeroFactura} se registró, pero no se pudo refrescar la sincronización: ${extraerMensajeError(err, MENSAJES_MUELLE.ERROR_DESCONOCIDO)}`
      );
    } finally {
      setAlistando(false);
    }
  };

  return {
    pendientes,
    activa,
    facturaId: facturaIdSeleccionada,
    setFacturaId,
    codigo,
    setCodigo,
    resumen,
    inputRef,
    procesarCodigo,
    handleKeyDown,
    enviarAlMuelle,
    alistando,
  };
}
