export const VISTAS_APP = {
  INVENTARIO: 'inventario',
  CLIENTES: 'clientes',
  DESPACHOS: 'despachos',
  HISTORIAL: 'historial',
  MUELLE: 'muelle',
  TRAZABILIDAD: 'trazabilidad',
  USUARIOS: 'usuarios',
} as const;

export type VistaApp = typeof VISTAS_APP[keyof typeof VISTAS_APP];
