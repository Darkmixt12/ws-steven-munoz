import type { AddressDetails, BillingProfileDetails } from './customers';
import type { Actor, Reason, Timestamp, VariantRef } from './shared';

/** Línea del Carrito: una Variante es una línea por construcción. */
export interface CartLine {
  productId: string;
  /** 1–99; la cantidad 0 no se guarda, se borra la línea. */
  quantity: number;
  addedAt: Timestamp;
}

/**
 * `carts/{uid}`: el Carrito del Cliente. Lo escribe el dueño directo, una línea por
 * escritura y hasta 50 líneas; solo el dueño lo lee y no se audita (§6.1).
 */
export interface Cart {
  /** `variantId` → línea. El orden de presentación sale de `addedAt`. */
  lines: Record<string, CartLine>;
  updatedAt: Timestamp;
}

/** Estado del Pedido a lo largo de su ciclo de vida. */
export type OrderStatus =
  | 'pendingPayment'
  | 'toFulfill'
  | 'shipped'
  | 'readyForPickup'
  | 'delivered'
  | 'cancelled'
  | 'returned';

/** Entrada del Historial del Pedido. */
export interface OrderStatusEntry {
  status: OrderStatus;
  at: Timestamp;
  actor: Actor;
}

/** Copia congelada del contacto del comprador. La anonimización lo reemplaza. */
export interface OrderContact {
  name: string;
  email: string;
  phone: string;
}

/** Entrega a domicilio o retiro en bodega. */
export type DeliveryMethod = 'homeDelivery' | 'pickup';

/** Guía del envío. */
export interface Tracking {
  carrier: string;
  number: string;
  url: string;
}

/** Entrega del Pedido, con la Dirección congelada al confirmarlo. */
export interface OrderDelivery {
  method: DeliveryMethod;
  /** CRC entero con IVA incluido. */
  shippingCost: number;
  shippingVatRateCode: string;
  /** Nula en el retiro en bodega. La anonimización la reemplaza. */
  address: AddressDetails | null;
  tracking: Tracking | null;
}

/** Línea del Pedido: copia congelada de la Variante con sus montos. */
export interface OrderLine extends VariantRef {
  sku: string;
  productName: string;
  optionValues: Record<string, string>;
  /** Opciones ya formateadas para mostrar, p. ej. `Talla S / Azul`. */
  optionLabel: string;
  /** Ruta de la miniatura de 400 px. */
  thumbPath: string;
  cabysCode: string;
  unitOfMeasure: string;
  vatRateCode: string;
  /** CRC enteros con IVA incluido. */
  unitPrice: number;
  quantity: number;
  lineDiscount: number;
  lineTotal: number;
}

/** Montos del Pedido: CRC enteros con IVA incluido. */
export interface OrderTotals {
  subtotal: number;
  discountTotal: number;
  shipping: number;
  total: number;
  /** IVA contenido en `total`; informativo, no se suma. */
  vatIncluded: number;
}

/** Facturación del Pedido, con el Perfil congelado al confirmarlo. */
export interface OrderBilling {
  documentType: 'ticket' | 'invoice';
  /** Nulo en un tiquete sin Perfil. La anonimización lo reemplaza. */
  profile: BillingProfileDetails | null;
}

export type PaymentMethod = 'sinpeMovil' | 'card';

export type PaymentStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'partiallyRefunded'
  | 'refunded';

/** Reembolso de un Pago, por anulación o por Devolución. */
export interface PaymentRefund {
  id: string;
  amount: number;
  reason: 'cancellation' | 'return';
  /** Devolución que lo originó; nulo si vino de una anulación. */
  returnId: string | null;
  reference: string;
  actor: Actor;
  at: Timestamp;
}

/** Pago del Pedido, con sus Reembolsos embebidos. */
export interface Payment {
  method: PaymentMethod;
  status: PaymentStatus;
  /** CRC entero con IVA incluido. */
  amount: number;
  /** Comprobante de SINPE Móvil o del procesador; nulo mientras está pendiente. */
  reference: string | null;
  confirmedBy: Actor | null;
  confirmedAt: Timestamp | null;
  refunds: PaymentRefund[];
}

/** Línea de una Devolución. */
export interface OrderReturnLine {
  variantId: string;
  quantity: number;
  /** Unidades que volvieron al Stock; puede ser menor que `quantity`. */
  restockedQuantity: number;
}

/** Devolución del Pedido. `Return` a secas sería ambiguo en una librería compartida. */
export interface OrderReturn {
  id: string;
  lines: OrderReturnLine[];
  /** La anonimización reemplaza la nota del motivo. */
  reason: Reason;
  refundAmount: number;
  /** Nota de crédito emitida por la Devolución; nula mientras no sale. */
  creditNoteId: string | null;
  actor: Actor;
  at: Timestamp;
}

/** Tipo de Comprobante electrónico. */
export type TaxDocumentType = 'ticket' | 'invoice' | 'creditNote';

/** Estado del Comprobante ante Hacienda. */
export type HaciendaStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Comprobante del Pedido. El acceso a sus archivos lo decide la feature de factura
 * electrónica junto con el proveedor.
 */
export interface TaxDocument {
  id: string;
  type: TaxDocumentType;
  /** Clave numérica de Hacienda. */
  key: string;
  consecutive: string;
  issuedAt: Timestamp;
  haciendaStatus: HaciendaStatus;
  /** Comprobante al que se refiere una nota de crédito. */
  reference: {
    key: string;
    code: string;
  } | null;
  xmlPath: string;
  /** Nulos hasta que Hacienda responde. */
  responsePath: string | null;
  pdfPath: string | null;
}

/**
 * `orders/{orderId}`: el Pedido. Solo lo escribe el backend (ADR 0004) y todos sus
 * sub-registros van embebidos. El Cliente lo lee si `customerId` es su `uid`, con la
 * consulta filtrada por ese campo (§6.2, nota 9 de §13).
 */
export interface Order {
  /** Número de Pedido, tomado de `counters/orderNumber`. */
  orderNumber: number;
  /** `uid` del Cliente; nulo tras eliminar la cuenta. Base de la regla de lectura del Cliente. */
  customerId: string | null;
  /** `uid` del comprador; sobrevive a la baja para el conflicto de interés y se anula al anonimizar. */
  buyerUid: string | null;
  status: OrderStatus;
  /** Historial del Pedido. */
  statusHistory: OrderStatusEntry[];
  contact: OrderContact;
  delivery: OrderDelivery;
  /** Hasta 50 líneas. */
  lines: OrderLine[];
  totals: OrderTotals;
  billing: OrderBilling;
  payment: Payment;
  returns: OrderReturn[];
  taxDocuments: TaxDocument[];
  /** Anulación automática: 1 h con tarjeta, 24 h con SINPE Móvil. */
  paymentDeadlineAt: Timestamp | null;
  paymentConfirmedAt: Timestamp | null;
  cancelledAt: Timestamp | null;
  /** `yyyy-mm-dd` de cada Devolución, para recalcular `salesDaily` con `array-contains`. */
  returnDays: string[];
  /** Retención: + 5 años. */
  retentionUntil: Timestamp;
  legalHold: boolean;
  anonymizedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** `counters/orderNumber`: siguiente Número de Pedido. Solo el backend lo lee y lo escribe. */
export interface OrderNumberCounter {
  next: number;
}
