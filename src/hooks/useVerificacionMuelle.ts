import { useState, useMemo, useRef, useEffect, type KeyboardEvent } from 'react';
import toast from 'react-hot-toast';
import { api, extraerMensajeError } from '../services/api';
import type {
  DatosTransporteDespacho,
  OrdenFacturaMuelle,
  Producto,
} from '../types/cediva';

export interface IncidenciaMuelle {
  id: string;
  hora: string;
  codigo: string;
  motivo: string;
}

export interface NuevaFacturaInput {
  readonly numeroFactura: string;
  readonly clienteNombre: string;
  readonly clienteNit: string;
  readonly muelle: string;
  readonly lineas: readonly {
    readonly codigoBarras: string;
    readonly cantidadPedida: number;
  }[];
}

interface UseVerificacionMuelleParams {
  readonly productos: readonly Producto[];
  readonly facturas: readonly OrdenFacturaMuelle[];
  readonly onCambiarFacturas: (
    updater: (prev: OrdenFacturaMuelle[]) => OrdenFacturaMuelle[]
  ) => void;
  readonly auditorNombre?: string;
  readonly onRecargarDatos: () => Promise<void>;
  readonly onFacturaAuditada?: (facturaAuditada: OrdenFacturaMuelle) => Promise<void> | void;
}

export function useVerificacionMuelle({
  productos,
  facturas,
  onCambiarFacturas,
  auditorNombre = 'Auditor Bodega',
  onRecargarDatos,
  onFacturaAuditada,
}: UseVerificacionMuelleParams) {
  const facturasPendientes = useMemo(
    () => facturas.filter((f) => f.estado === 'pendiente'),
    [facturas]
  );

  const facturasAuditadas = useMemo(
    () => facturas.filter((f) => f.estado !== 'pendiente'),
    [facturas]
  );

  const [facturaSeleccionadaId, setFacturaSeleccionadaId] = useState<string>(
    () => facturasPendientes[0]?.id ?? ''
  );
  const [codigoEscaneado, setCodigoEscaneado] = useState('');
  const [ultimaAlertaTrocado, setUltimaAlertaTrocado] = useState<string | null>(null);
  const [incidencias, setIncidencias] = useState<IncidenciaMuelle[]>([]);
  const [cerrandoPacking, setCerrandoPacking] = useState(false);

  const inputScannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const actualEsPendiente = facturasPendientes.some(
      (f) => f.id === facturaSeleccionadaId
    );
    if (!actualEsPendiente) {
      setFacturaSeleccionadaId(facturasPendientes[0]?.id ?? '');
    }
  }, [facturasPendientes, facturaSeleccionadaId]);

  const facturaActiva = useMemo(
    () =>
      facturasPendientes.find((f) => f.id === facturaSeleccionadaId) ??
      facturasPendientes[0],
    [facturasPendientes, facturaSeleccionadaId]
  );
 

  useEffect(() => {
    inputScannerRef.current?.focus();
  }, [facturaSeleccionadaId]);

  const resumenFactura = useMemo(() => {
    if (!facturaActiva) {
      return {
        totalPedido: 0,
        totalPistoleado: 0,
        faltantes: 0,
        todasCompletas: false,
      };
    }

    const totalPedido = facturaActiva.lineas.reduce((acc, l) => acc + l.cantidadPedida, 0);
    const totalPistoleado = facturaActiva.lineas.reduce(
      (acc, l) => acc + l.cantidadPistoleada,
      0
    );
    const todasCompletas =
      facturaActiva.lineas.length > 0 &&
      facturaActiva.lineas.every((l) => l.cantidadPistoleada === l.cantidadPedida);

    return {
      totalPedido,
      totalPistoleado,
      faltantes: Math.max(0, totalPedido - totalPistoleado),
      todasCompletas,
    };
  }, [facturaActiva]);

  const registrarIncidencia = (codigo: string, motivo: string) => {
    const horaActual = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setUltimaAlertaTrocado(`${codigo}: ${motivo}`);
    setIncidencias((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        hora: horaActual,
        codigo,
        motivo,
      },
      ...prev,
    ]);
  };

  const procesarPistoleo = (codigoRaw: string) => {
    const codigo = codigoRaw.trim();
    setCodigoEscaneado('');
    if (!codigo || !facturaActiva) return;

    if (facturaActiva.estado !== 'pendiente') {
      toast.error('Esta factura ya fue auditada en muelle.');
      return;
    }

    const productoCatalogo = productos.find(
      (p) => p.codigoBarras.trim().toLowerCase() === codigo.toLowerCase()
    );
    const lineaFactura = facturaActiva.lineas.find(
      (l) => l.codigoBarras.trim().toLowerCase() === codigo.toLowerCase()
    );

    if (!lineaFactura) {
      const nombreDetectado = productoCatalogo
        ? `(${productoCatalogo.nombre})`
        : '(Código desconocido en catálogo)';
      const motivo = `PRODUCTO TROCADO ${nombreDetectado} — No pertenece a la factura ${facturaActiva.numeroFactura}.`;
      registrarIncidencia(codigo, motivo);
      toast.error(`¡TROCADO DETECTADO! ${codigo} no está en esta factura.`, { duration: 4000 });
      inputScannerRef.current?.focus();
      return;
    }

    if (lineaFactura.cantidadPistoleada >= lineaFactura.cantidadPedida) {
      const nombreProd = productoCatalogo?.nombre ?? codigo;
      const motivo = `EXCESO DE MERCANCÍA (${nombreProd}) — Ya se completaron las ${lineaFactura.cantidadPedida} un. pedidas.`;
      registrarIncidencia(codigo, motivo);
      toast.error(
        `¡SOBRANTE! ${nombreProd} ya tiene sus ${lineaFactura.cantidadPedida} un. completas.`
      );
      inputScannerRef.current?.focus();
      return;
    }

    if (productoCatalogo && lineaFactura.cantidadPistoleada + 1 > productoCatalogo.stock) {
      const motivo = `STOCK INSUFICIENTE EN SISTEMA (${productoCatalogo.nombre}) — Stock actual: ${productoCatalogo.stock} un.`;
      registrarIncidencia(codigo, motivo);
      toast.error(motivo);
      inputScannerRef.current?.focus();
      return;
    }

    setUltimaAlertaTrocado(null);
    const nuevaCantidad = lineaFactura.cantidadPistoleada + 1;
    const nombreValido = productoCatalogo?.nombre ?? codigo;

    onCambiarFacturas((prev) =>
      prev.map((fac) => {
        if (fac.id !== facturaActiva.id) return fac;
        return {
          ...fac,
          lineas: fac.lineas.map((l) =>
            l.codigoBarras === lineaFactura.codigoBarras
              ? { ...l, cantidadPistoleada: nuevaCantidad }
              : l
          ),
        };
      })
    );

    toast.success(
      nuevaCantidad === lineaFactura.cantidadPedida
        ? `✔ Línea completa: ${nombreValido} (${nuevaCantidad}/${lineaFactura.cantidadPedida})`
        : `OK: ${nombreValido} (${nuevaCantidad}/${lineaFactura.cantidadPedida})`
    );
    inputScannerRef.current?.focus();
  };

  const handleScannerKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    procesarPistoleo(codigoEscaneado);
  };

  const reiniciarVerificacion = () => {
    if (!facturaActiva) return;

    onCambiarFacturas((prev) =>
      prev.map((fac) => {
        if (fac.id !== facturaActiva.id) return fac;
        return {
          ...fac,
          estado: 'pendiente',
          auditadoPor: undefined,
          horaAuditoria: undefined,
          lineas: fac.lineas.map((l) => ({ ...l, cantidadPistoleada: 0 })),
        };
      })
    );
    setUltimaAlertaTrocado(null);
    toast.success(`Conteo reiniciado para ${facturaActiva.numeroFactura}`);
    inputScannerRef.current?.focus();
  };

  const crearFacturaMuelle = async (datos: NuevaFacturaInput): Promise<boolean> => {
    const numeroLimpio = datos.numeroFactura.trim().toUpperCase();
    const clienteLimpio = datos.clienteNombre.trim();
    const nitLimpio = datos.clienteNit.trim();
    const muelleLimpio = datos.muelle.trim();

    if (!numeroLimpio || !clienteLimpio || !nitLimpio || !muelleLimpio) {
      toast.error('Completa número de factura, cliente, NIT y muelle.');
      return false;
    }

    if (datos.lineas.length === 0) {
      toast.error('Agrega al menos un producto a la factura.');
      return false;
    }

    try {
      const payload = {
        numeroFactura: numeroLimpio,
        clienteNombre: clienteLimpio,
        clienteNit: nitLimpio,
        muelle: muelleLimpio,
        lineas: datos.lineas.map((l) => ({
          codigoBarras: l.codigoBarras.trim(),
          cantidadPedida: Math.max(1, Math.floor(l.cantidadPedida)),
        })),
      };

      const res = await api.post<{ id?: string; Id?: string }>('/MuelleControlador', payload);
      const nuevoId = res.data?.id ?? res.data?.Id ?? `fac-${Date.now()}`;

      await onRecargarDatos();
      setFacturaSeleccionadaId(nuevoId);
      setUltimaAlertaTrocado(null);
      setCodigoEscaneado('');
      toast.success(`Factura ${numeroLimpio} creada y sincronizada en servidor.`);
      return true;
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No se pudo crear la factura en el servidor.'));
      return false;
    }
  };

  const confirmarPackingYSalida = async () => {
    if (!facturaActiva || !resumenFactura.todasCompletas || facturaActiva.estado !== 'pendiente') {
      return;
    }

    try {
      setCerrandoPacking(true);

      const movimientos = facturaActiva.lineas.map((linea) => {
        const prod = productos.find(
          (p) => p.codigoBarras.trim() === linea.codigoBarras.trim()
        );
        if (!prod) {
          throw new Error(
            `El producto con código ${linea.codigoBarras} no existe en el inventario activo.`
          );
        }
        return {
          productoId: prod.id,
          cantidadValor: linea.cantidadPedida,
          tipo: 2,
        };
      });

      const horaAuditoria = new Date().toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      await api.put(`/MuelleControlador/${facturaActiva.id}/auditar`, {
        id: facturaActiva.id,
        auditadoPor: auditorNombre,
        horaAuditoria,
        lineasPistoleadas: facturaActiva.lineas.map((l) => ({
          codigoBarras: l.codigoBarras,
          cantidadPistoleada: l.cantidadPistoleada,
        })),
      });

      await Promise.all(
        movimientos.map((mov) => api.post('/InventarioControlador/movimiento', mov))
      );

      const facturaMarcada: OrdenFacturaMuelle = {
        ...facturaActiva,
        estado: 'auditada_lista_despacho',
        auditadoPor: auditorNombre,
        horaAuditoria,
      };

      onCambiarFacturas((prev) =>
        prev.map((fac) => (fac.id === facturaActiva.id ? facturaMarcada : fac))
      );

      if (onFacturaAuditada) {
        await onFacturaAuditada(facturaMarcada);
      }

      toast.success(
        `Picking & Packing auditado (${facturaActiva.numeroFactura}). Sincronizado en todos los dispositivos.`
      );
      await onRecargarDatos();
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No se pudo cerrar el packing de la factura.'));
    } finally {
      setCerrandoPacking(false);
    }
  };

  const ejecutarDespachoFactura = async (
    facturaId: string,
    transporte: DatosTransporteDespacho
  ) => {
    const horaDespacho = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    await api.put(`/MuelleControlador/${facturaId}/despachar`, {
      id: facturaId,
      despachadoPor: auditorNombre,
      horaDespacho,
      transportadora: transporte.transportadora,
      placaVehiculo: transporte.placaVehiculo,
      conductor: transporte.conductorNombre,
    });

    onCambiarFacturas((prev) =>
      prev.map((fac) => {
        if (fac.id !== facturaId) return fac;
        return {
          ...fac,
          estado: 'despachada',
          despachadoPor: auditorNombre,
          horaDespacho,
          datosTransporte: transporte,
        };
      })
    );

    await onRecargarDatos();
    toast.success(
      `Despacho registrado (${transporte.transportadora} · Placa ${transporte.placaVehiculo}).`
    );
  };

  return {
    facturas,
    facturasPendientes,
    facturasAuditadas,
    facturaActiva,
    facturaSeleccionadaId,
    setFacturaSeleccionadaId,
    codigoEscaneado,
    setCodigoEscaneado,
    ultimaAlertaTrocado,
    setUltimaAlertaTrocado,
    incidencias,
    cerrandoPacking,
    resumenFactura,
    inputScannerRef,
    procesarPistoleo,
    handleScannerKeyDown,
    reiniciarVerificacion,
    crearFacturaMuelle,
    confirmarPackingYSalida,
    ejecutarDespachoFactura,
  };
}