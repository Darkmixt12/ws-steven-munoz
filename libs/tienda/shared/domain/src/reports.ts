import type { Actor, Reason, Timestamp } from './shared';

/** Ventas de una Variante en un día. Montos en CRC con IVA. */
export interface SalesDailyVariant {
  productId: string;
  soldUnits: number;
  cancelledUnits: number;
  returnedUnits: number;
  soldAmount: number;
  cancelledAmount: number;
  returnedAmount: number;
}

/** `salesDaily/{yyyy-mm-dd}`: agregado de Ventas por día. Solo lo escribe el backend. */
export interface SalesDaily {
  /** `variantId` → Ventas del día. */
  variants: Record<string, SalesDailyVariant>;
  updatedAt: Timestamp;
}

/** Cambio de un campo; los campos personales quedan sin valor. */
export type AuditChange = { before: unknown; after: unknown } | { changed: true };

/** `auditEvents/{eventId}`: Evento de la Bitácora. Solo lo escribe el backend; nadie lo edita ni lo borra. */
export interface AuditEvent {
  /** P. ej. `customer.disable`, `product.publish`. */
  actionKey: string;
  target: {
    collection: string;
    id: string;
  };
  actor: Actor;
  /** Solo lo que cambió. */
  changes: Record<string, AuditChange>;
  /** La nota se borra al anonimizar. */
  reason: Reason | null;
  occurredAt: Timestamp;
  /** +5 años, política TTL. */
  expiresAt: Timestamp;
}
