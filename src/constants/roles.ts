export const ROLES_USUARIO = {
  ADMINISTRADOR: 'Administrador',
  SUPERVISOR: 'Supervisor',
  AUDITOR_BODEGA: 'AuditorBodega',
  AUXILIAR_LOGISTICO: 'AuxiliarLogistico',
} as const;

export const IDS_ROL_USUARIO = {
  ADMINISTRADOR: 1,
  SUPERVISOR: 2,
  AUDITOR_BODEGA: 3,
  AUXILIAR_LOGISTICO: 4,
} as const;

export type RolUsuario = typeof ROLES_USUARIO[keyof typeof ROLES_USUARIO];
export type IdRolUsuario = typeof IDS_ROL_USUARIO[keyof typeof IDS_ROL_USUARIO];

export const ETIQUETAS_ROL_USUARIO = {
  [ROLES_USUARIO.ADMINISTRADOR]: ROLES_USUARIO.ADMINISTRADOR,
  [ROLES_USUARIO.SUPERVISOR]: ROLES_USUARIO.SUPERVISOR,
  [ROLES_USUARIO.AUDITOR_BODEGA]: 'Auditor de Bodega',
  [ROLES_USUARIO.AUXILIAR_LOGISTICO]: 'Auxiliar Logístico',
} as const satisfies Record<RolUsuario, string>;
