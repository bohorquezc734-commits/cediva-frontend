import type { EstadoFacturaMuelle, OrdenFacturaMuelle } from '../types/cediva';
import {
  CANTIDADES_MUELLE,
  ESTADOS_LEGACY_MUELLE,
  ESTADOS_MUELLE,
  ORDEN_ESTADOS_MUELLE,
} from '../constants/muelle';

type Registro = Record<string, unknown>;

function esRegistro(valor: unknown): valor is Registro {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function leerTexto(
  registro: Registro,
  campo: string,
  permitirVacio = false
): string {
  const valor = registro[campo];
  if (permitirVacio && (valor === null || valor === undefined)) return '';
  if (
    typeof valor !== 'string' ||
    (!permitirVacio && !valor.trim())
  ) {
    throw new Error(`El campo ${campo} de la orden de muelle no es válido.`);
  }
  return valor;
}

function leerTextoOpcional(registro: Registro, campo: string): string | undefined {
  const valor = registro[campo];
  if (valor === null || valor === undefined) return undefined;
  if (typeof valor !== 'string') {
    throw new Error(`El campo ${campo} de la orden de muelle no es válido.`);
  }
  return valor;
}

function leerCantidad(registro: Registro, campo: string, requerida: boolean): number {
  const valor = registro[campo];
  if ((valor === null || valor === undefined) && !requerida) {
    return CANTIDADES_MUELLE.SIN_UNIDADES;
  }
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) {
    throw new Error(`La cantidad ${campo} de la orden de muelle no es válida.`);
  }
  return valor;
}

function normalizarEstado(valor: unknown): EstadoFacturaMuelle {
  if (typeof valor !== 'string') {
    throw new Error('El estado de la orden de muelle no es válido.');
  }

  const estado = valor.trim().toLowerCase();
  if (estado === ESTADOS_LEGACY_MUELLE.PENDIENTE) return ESTADOS_MUELLE.ALISTADA;
  if (estado === ESTADOS_LEGACY_MUELLE.AUDITADA) {
    return ESTADOS_MUELLE.AUDITADA_LISTA_DESPACHO;
  }
  const estadoValido = ORDEN_ESTADOS_MUELLE.find((etapa) => etapa === estado);
  if (estadoValido) return estadoValido;
  throw new Error(`Estado de orden de muelle no soportado: ${valor}.`);
}

export function mapearOrdenFacturaMuelle(dto: unknown): OrdenFacturaMuelle {
  if (!esRegistro(dto)) {
    throw new Error('La respuesta de una orden de muelle no tiene el formato esperado.');
  }

  const estado = normalizarEstado(dto.estado);
  if (!Array.isArray(dto.lineas)) {
    throw new Error('La lista de líneas de la orden de muelle no es válida.');
  }

  const lineas = dto.lineas.map((linea): OrdenFacturaMuelle['lineas'][number] => {
    if (!esRegistro(linea)) {
      throw new Error('Una línea de la orden de muelle no tiene el formato esperado.');
    }

    return {
      codigoBarras: leerTexto(linea, 'codigoBarras'),
      cantidadPedida: leerCantidad(linea, 'cantidadPedida', true),
      cantidadPistoleada: leerCantidad(linea, 'cantidadPistoleada', false),
      cantidadAlistada: linea.cantidadAlistada === null || linea.cantidadAlistada === undefined
        ? undefined
        : leerCantidad(linea, 'cantidadAlistada', true),
    };
  });

  const tieneTransporte =
    Boolean(dto.transportadora) || Boolean(dto.placaVehiculo) || Boolean(dto.conductor);

  return {
    id: leerTexto(dto, 'id'),
    numeroFactura: leerTexto(dto, 'numeroFactura'),
    clienteNombre: leerTexto(dto, 'clienteNombre'),
    clienteNit: leerTexto(dto, 'clienteNit', true),
    muelle: leerTexto(dto, 'muelle', true),
    estado,
    fechaCreacion: leerTextoOpcional(dto, 'fechaCreacion'),
    fechaDespacho: leerTextoOpcional(dto, 'fechaDespacho'),
    alistadoPor: leerTextoOpcional(dto, 'alistadoPor'),
    horaAlistamiento: leerTextoOpcional(dto, 'horaAlistamiento'),
    auditadoPor: leerTextoOpcional(dto, 'auditadoPor'),
    horaAuditoria: leerTextoOpcional(dto, 'horaAuditoria'),
    despachadoPor: leerTextoOpcional(dto, 'despachadoPor'),
    horaDespacho: leerTextoOpcional(dto, 'horaDespacho'),
    datosTransporte: tieneTransporte
      ? {
          transportadora: leerTextoOpcional(dto, 'transportadora') ?? '',
          placaVehiculo: leerTextoOpcional(dto, 'placaVehiculo') ?? '',
          conductorNombre: leerTextoOpcional(dto, 'conductor') ?? '',
        }
      : undefined,
    lineas,
  };
}

function rangoEstado(estado: EstadoFacturaMuelle): number {
  return ORDEN_ESTADOS_MUELLE.indexOf(estado);
}

function fusionarLineasPendientes(
  remotas: OrdenFacturaMuelle['lineas'],
  locales: OrdenFacturaMuelle['lineas']
): OrdenFacturaMuelle['lineas'] {
  return remotas.map((remota) => {
    const local = locales.find((linea) => linea.codigoBarras === remota.codigoBarras);
    if (!local) return remota;
    return {
      ...remota,
      cantidadAlistada: Math.max(
        remota.cantidadAlistada ?? CANTIDADES_MUELLE.SIN_UNIDADES,
        local.cantidadAlistada ?? CANTIDADES_MUELLE.SIN_UNIDADES
      ),
      cantidadPistoleada: Math.max(remota.cantidadPistoleada, local.cantidadPistoleada),
    };
  });
}

export function obtenerRegresionesEstadoMuelle(
  remotas: readonly OrdenFacturaMuelle[],
  locales: readonly OrdenFacturaMuelle[]
): { id: string; factura: string; estadoLocal: EstadoFacturaMuelle; estadoRemoto: EstadoFacturaMuelle }[] {
  return remotas.flatMap((remota) => {
    const local = locales.find((factura) => factura.id === remota.id);
    if (!local || rangoEstado(remota.estado) >= rangoEstado(local.estado)) return [];
    return [{
      id: remota.id,
      factura: local.numeroFactura,
      estadoLocal: local.estado,
      estadoRemoto: remota.estado,
    }];
  });
}

export function fusionarOrdenesMuelle(
  remotas: readonly OrdenFacturaMuelle[],
  locales: readonly OrdenFacturaMuelle[]
): OrdenFacturaMuelle[] {
  return remotas.map((remota) => {
    const local = locales.find((factura) => factura.id === remota.id);
    if (!local) return remota;

    const rangoRemoto = rangoEstado(remota.estado);
    const rangoLocal = rangoEstado(local.estado);
    if (rangoRemoto > rangoLocal) return remota;

    if (rangoLocal > rangoRemoto) {
      return {
        ...remota,
        ...local,
        lineas: fusionarLineasPendientes(remota.lineas, local.lineas),
      };
    }

    if (
      remota.estado === ESTADOS_MUELLE.POR_ALISTAR ||
      remota.estado === ESTADOS_MUELLE.ALISTADA
    ) {
      return {
        ...remota,
        alistadoPor: remota.alistadoPor ?? local.alistadoPor,
        horaAlistamiento: remota.horaAlistamiento ?? local.horaAlistamiento,
        lineas: fusionarLineasPendientes(remota.lineas, local.lineas),
      };
    }
    return remota;
  });
}
