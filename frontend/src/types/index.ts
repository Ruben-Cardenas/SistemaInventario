export type EstadoProducto = "activo" | "descontinuado";

export type RolUsuario = "admin" | "encargado";

export type TipoMovimiento =
  | "entrada_proveedor"
  | "traslado_sucursal";

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  categoria: string;
  precio: number;
  estado: EstadoProducto;
}

export interface StockProducto {
  id: number;
  sku: string;
  producto: string;
  categoria: string;
  matriz: number;
  saucos: number;
  sucursal450: number;
  stockMinimo: number;
  estado: EstadoProducto;
}

export interface Movimiento {
  id: number;
  folio: string;
  tipo: TipoMovimiento;
  origen: string;
  destino: string;
  usuario: string;
  fecha: string;
  total: number;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  ubicacion: string;
  activo: boolean;
}