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

/**
 * Web Crypto, declarado a mano. El tsconfig de esta librería no incluye `dom` ni `@types/node` a
 * propósito, porque la usan el front y las Functions: se declara solo lo que se usa.
 */
declare const crypto: {
  subtle: { digest(algorithm: string, data: Uint8Array): Promise<ArrayBuffer> };
};
declare const TextEncoder: { new (): { encode(input: string): Uint8Array } };

/**
 * Huella del texto del Aviso de privacidad: SHA-256 del texto en UTF-8, en hexadecimal minúscula.
 * Es lo que guarda `Consent.noticeHash`, así que la evidencia queda atada al texto exacto que la
 * persona aceptó, aunque un día no se pudiera recuperar el documento del Aviso.
 *
 * Es asíncrona porque usa Web Crypto y no `node:crypto`: esta librería no depende de ninguna
 * plataforma. Node la trae desde la 18.
 */
export async function privacyNoticeHash(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
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
