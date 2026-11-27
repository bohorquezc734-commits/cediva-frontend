import { VISTAS_APP } from './navegacion';

export const ESTADOS_MUELLE = {
  POR_ALISTAR: 'por_alistar',
  ALISTADA: 'alistada',
  AUDITADA_LISTA_DESPACHO: 'auditada_lista_despacho',
  DESPACHADA: 'despachada',
} as const;

export type EstadoFacturaMuelle =
  typeof ESTADOS_MUELLE[keyof typeof ESTADOS_MUELLE];

export const ORDEN_ESTADOS_MUELLE = [
  ESTADOS_MUELLE.POR_ALISTAR,
  ESTADOS_MUELLE.ALISTADA,
  ESTADOS_MUELLE.AUDITADA_LISTA_DESPACHO,
  ESTADOS_MUELLE.DESPACHADA,
] as const satisfies readonly EstadoFacturaMuelle[];

export const CANTIDADES_MUELLE = {
  SIN_UNIDADES: 0,
} as const;

export const ESTADOS_LEGACY_MUELLE = {
  PENDIENTE: 'pendiente',
  AUDITADA: 'auditada',
} as const;

export const SECCIONES_MUELLE = {
  ALISTAMIENTO: 'alistamiento',
  VERIFICACION: VISTAS_APP.MUELLE,
} as const;

export type SeccionMuelle =
  typeof SECCIONES_MUELLE[keyof typeof SECCIONES_MUELLE];

export const FILTROS_TRAZABILIDAD_MUELLE = {
  TODAS: 'todas',
  ALISTADA: ESTADOS_MUELLE.ALISTADA,
  PENDIENTE_DESPACHO: 'pendiente_despacho',
  DESPACHADA: ESTADOS_MUELLE.DESPACHADA,
} as const;

export type FiltroTrazabilidadMuelle =
  typeof FILTROS_TRAZABILIDAD_MUELLE[keyof typeof FILTROS_TRAZABILIDAD_MUELLE];

export const MENSAJES_MUELLE = {
  ERROR_DESCONOCIDO: 'error desconocido',
  AUDITOR_PREDETERMINADO: 'Auditor',
  AUDITOR_BODEGA_PREDETERMINADO: 'Auditor Bodega',
  HORA_NO_DISPONIBLE: '--:--:--',
} as const;

