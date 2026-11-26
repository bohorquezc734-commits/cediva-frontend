export type RolUsuario = 'Administrador' | 'Supervisor' | 'AuditorBodega';

export type VistaActual =
  | 'inventario'
  | 'clientes'
  | 'despachos'
  | 'historial'
  | 'muelle'
  | 'trazabilidad'
  | 'usuarios';

  export interface UsuarioListadoDto {
  readonly id: string;
  readonly nombreCompleto: string;
  readonly email: string;
  readonly rol: RolUsuario | number;
  readonly estaActivo?: boolean;
  readonly fechaCreacion?: string;
}

export type EstadoFacturaMuelle =
  | 'pendiente'
  | 'auditada_lista_despacho'
  | 'despachada';

export interface LineaFacturaVerificacion {
  codigoBarras: string;
  cantidadPedida: number;
  cantidadPistoleada: number;
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
  fechaCreacion: string;
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
  }[];
}

export interface UsuarioInfoDto {
  id: string;
  nombreCompleto: string;
  email: string;
  rol: RolUsuario;
}

export interface LoginResponseDto {
  token: string;
  expiraEn: string;
  usuario: UsuarioInfoDto;
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
  fecha: string;
  items: DespachoItemDto[];
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}