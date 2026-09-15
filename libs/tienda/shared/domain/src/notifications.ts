import type { Actor, Timestamp } from './shared';

/** Tipo de Notificación: una por operación que la origina. */
export type NotificationType =
  | 'order.awaitingSinpePayment'
  | 'order.paymentConfirmed'
  | 'order.shipped'
  | 'order.readyForPickup'
  | 'order.cancelled'
  | 'order.refunded'
  | 'order.returnRegistered'
  | 'order.addressCorrected'
  | 'taxDocument.accepted'
  | 'invitation.sent'
  | 'dataRequest.answered';

/** Colección del documento que origina la Notificación. */
export type NotificationOrigin = 'orders' | 'invitations' | 'dataRequests';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'bounced' | 'cancelled';

/** `notifications/{notificationId}`: bandeja de salida de correos. Solo la escribe el backend. */
export interface Notification {
  type: NotificationType;
  /** Origen; el correo se arma al enviarlo, leyéndolo. */
  ref: {
    collection: NotificationOrigin;
    id: string;
  };
  /** Solo lo que el origen no identifica. */
  params: {
    refundId?: string;
    returnId?: string;
    taxDocumentId?: string;
  } | null;
  /** Uno o dos correos. */
  to: string[];
  channel: 'email';
  status: NotificationStatus;
  /** Hasta 3; luego `failed`. */
  attempts: number;
  lastError: string | null;
  providerMessageId: string | null;
  sentAt: Timestamp | null;
  /** El de la operación que la originó; en un reenvío, el Empleado. */
  actor: Actor;
  /** Id de la Notificación reenviada. */
  resendOf: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** `createdAt` + 90 días, política TTL. */
  expiresAt: Timestamp;
}
