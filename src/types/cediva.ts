import {
  ETIQUETAS_ROL_USUARIO,
  IDS_ROL_USUARIO,
  ROLES_USUARIO,
  type RolUsuario,
} from '../constants/roles';
import type { EstadoFacturaMuelle } from '../constants/muelle';
import type { VistaApp } from '../constants/navegacion';

export type { RolUsuario } from '../constants/roles';
export type { EstadoFacturaMuelle } from '../constants/muelle';

export type RolUsuarioApi = RolUsuario | number | string;

export function normalizarRolUsuario(rol: unknown): RolUsuario {
  if (typeof rol === 'number') {
    switch (rol) {
      case IDS_ROL_USUARIO.ADMINISTRADOR: return ROLES_USUARIO.ADMINISTRADOR;
      case IDS_ROL_USUARIO.SUPERVISOR: return ROLES_USUARIO.SUPERVISOR;
      case IDS_ROL_USUARIO.AUDITOR_BODEGA: return ROLES_USUARIO.AUDITOR_BODEGA;
      case IDS_ROL_USUARIO.AUXILIAR_LOGISTICO: return ROLES_USUARIO.AUXILIAR_LOGISTICO;
    }
  }

  if (typeof rol === 'string') {
    const valor = rol
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s_-]/g, '');
    switch (valor) {
      case String(IDS_ROL_USUARIO.ADMINISTRADOR):
      case ROLES_USUARIO.ADMINISTRADOR.toLowerCase():
        return ROLES_USUARIO.ADMINISTRADOR;
      case String(IDS_ROL_USUARIO.SUPERVISOR):
      case ROLES_USUARIO.SUPERVISOR.toLowerCase():
        return ROLES_USUARIO.SUPERVISOR;
      case String(IDS_ROL_USUARIO.AUDITOR_BODEGA):
      case ROLES_USUARIO.AUDITOR_BODEGA.toLowerCase():
        return ROLES_USUARIO.AUDITOR_BODEGA;
      case String(IDS_ROL_USUARIO.AUXILIAR_LOGISTICO):
      case ROLES_USUARIO.AUXILIAR_LOGISTICO.toLowerCase():
        return ROLES_USUARIO.AUXILIAR_LOGISTICO;
    }
  }

  throw new Error(`Rol de usuario no soportado: ${String(rol)}.`);
}

export function etiquetaRolUsuario(rol: RolUsuario): string {
  return ETIQUETAS_ROL_USUARIO[rol];
}

export type VistaActual = VistaApp;

export interface UsuarioListadoDto {
  readonly id: string;
  readonly nombreCompleto: string;
  readonly email: string;
  readonly rol: RolUsuario;
  readonly estaActivo?: boolean;
  readonly fechaCreacion?: string;
}

export interface UsuarioListadoApiDto extends Omit<UsuarioListadoDto, 'rol'> {
  readonly rol: RolUsuarioApi;
}

export interface LineaFacturaVerificacion {
  codigoBarras: string;
  cantidadPedida: number;
  cantidadPistoleada: number;
  cantidadAlistada?: number;
}

export interface DatosTransporteDespacho {
  conductorNombre: string;
  transportadora: string;
  placaVehiculo: string;
}

export interface OrdenFacturaMuelle {
  id: string;
  numeroFactura: string;
  clienteNombre: string;
  clienteNit: string;
  muelle: string;
  estado: EstadoFacturaMuelle;
  fechaCreacion?: string;
  fechaDespacho?: string;
  alistadoPor?: string;
  horaAlistamiento?: string;
  auditadoPor?: string;
  horaAuditoria?: string;
  despachadoPor?: string;
  horaDespacho?: string;
  datosTransporte?: DatosTransporteDespacho;
  lineas: LineaFacturaVerificacion[];
}

export interface OrdenFacturaMuelleApiDto {
  id: string;
  numeroFactura: string;
  clienteNombre: string;
  clienteNit: string;
  muelle: string;
  estado: EstadoFacturaMuelle;
  fechaCreacion?: string | null;
  fechaDespacho?: string | null;
  alistadoPor?: string | null;
  horaAlistamiento?: string | null;
  auditadoPor?: string | null;
  horaAuditoria?: string | null;
  despachadoPor?: string | null;
  horaDespacho?: string | null;
  transportadora?: string | null;
  placaVehiculo?: string | null;
  conductor?: string | null;
  lineas: {
    id: string;
    codigoBarras: string;
    cantidadPedida: number;
    cantidadPistoleada: number;
    cantidadAlistada?: number;
  }[];
}

export interface UsuarioInfoDto {
  id: string;
  nombreCompleto: string;
  email: string;
  rol: RolUsuario;
}

export interface UsuarioInfoApiDto extends Omit<UsuarioInfoDto, 'rol'> {
  rol: RolUsuarioApi;
}

export interface LoginResponseDto {
  token: string;
  expiraEn: string;
  usuario: UsuarioInfoApiDto;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precioUnitario: number;
  codigoBarras: string;
  stock: number;
}

export interface InventarioDto {
  productoId: string;
  stock: number;
}

export interface ClienteDto {
  id: string;
  nombre: string;
  nit: string;
}

export interface CrearClientePayload {
  nombre: string;
  nit: string;
}

export interface DespachoItemDto {
  productoId: string;
  cantidad: number;
}

export interface DespachoHistorialDto {
  id: string;
  cliente: string;
  fecha?: string | null;
  items: DespachoItemDto[];
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}