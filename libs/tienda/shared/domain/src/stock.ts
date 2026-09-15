import type { Actor, Timestamp, VariantRef } from './shared';

/** Tipo de Movimiento de stock: Entrada, Ajuste o los automáticos del Pedido. */
export type StockMovementType =
  | 'receipt'
  | 'adjustment'
  | 'orderPlaced'
  | 'orderCancelled'
  | 'orderReturned';

/** Motivo de un Ajuste. */
export type StockAdjustmentReason =
  | 'physicalCount'
  | 'damage'
  | 'lossOrTheft'
  | 'internalUse'
  | 'other';

/** Origen de un Movimiento: el Pedido o la Carga de stock que lo produjo. */
export interface StockMovementOrigin {
  type: 'order' | 'stockImport';
  id: string;
}

/** `stockMovements/{movementId}`: historia inmutable del Stock. Solo la escribe el backend. */
export interface StockMovement extends VariantRef {
  type: StockMovementType;
  /** Con signo. */
  quantity: number;
  /** Nunca negativo. */
  resultingStock: number;
  /** Solo en Ajustes. */
  reason: StockAdjustmentReason | null;
  note: string | null;
  origin: StockMovementOrigin | null;
  actor: Actor;
  createdAt: Timestamp;
}

/** `stockImports/{importId}`: Carga de stock; sus Entradas la señalan en `origin`. */
export interface StockImport {
  fileName: string;
  entryCount: number;
  totalUnits: number;
  actor: Actor;
  createdAt: Timestamp;
}
