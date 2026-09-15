import type { Purpose } from './settings';
import type { Actor, Timestamp } from './shared';

/** Titular de los datos personales: un Cliente o un Empleado. */
export type DataSubjectType = 'customer' | 'employee';

/** `consents/{consentId}`: evidencia append-only de un Consentimiento. Solo la escribe el backend. */
export interface Consent {
  subjectType: DataSubjectType;
  /** `uid` del titular. */
  subjectId: string;
  purpose: Purpose;
  /** Una aceptación o una revocación es un documento nuevo. */
  granted: boolean;
  /** Versión del Aviso de privacidad. */
  noticeVersion: string;
  /** Lo calcula el backend desde el texto del Aviso. */
  noticeHash: string;
  channel: 'storefront' | 'panel';
  createdAt: Timestamp;
  /** TTL: eliminación del titular + 5 años; única mutación permitida. */
  expiresAt: Timestamp | null;
}

/** Tipo de Solicitud de derechos: acceso, rectificación o supresión. */
export type DataRequestType = 'access' | 'rectification' | 'erasure';

export type DataRequestStatus = 'open' | 'resolved' | 'rejected';

/** `dataRequests/{requestId}`: Solicitud de derechos. Solo la escribe el backend. */
export interface DataRequest {
  type: DataRequestType;
  subject: {
    type: DataSubjectType;
    id: string;
  };
  contactEmail: string;
  channel: 'selfService' | 'email';
  status: DataRequestStatus;
  /** 5 días hábiles. */
  dueAt: Timestamp;
  response: string | null;
  resolvedBy: Actor | null;
  resolvedAt: Timestamp | null;
  createdAt: Timestamp;
  /** TTL: resolución + 5 años. */
  expiresAt: Timestamp | null;
}
