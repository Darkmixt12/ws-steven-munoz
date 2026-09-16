/**
 * Las políticas TTL de la Tienda CR, tal como las fija la §12 de
 * `docs/modelo-de-datos-firestore.md`. Firestore borra el documento cuando el
 * campo pasa la fecha; el campo es el mismo en las cinco colecciones.
 */

/** Campo que Firestore vigila para borrar. */
export const TTL_FIELD = 'expiresAt';

/** Las cinco colecciones con política TTL. */
export const TTL_COLLECTIONS = [
  'auditEvents',
  'invitations',
  'consents',
  'dataRequests',
  'notifications',
] as const;

export type TtlCollection = (typeof TTL_COLLECTIONS)[number];

/** Cuerpo del PATCH que activa el TTL: el objeto vacío basta. */
export const TTL_PATCH_BODY = { ttlConfig: {} } as const;

/** Alcance OAuth de la API Admin de Firestore. */
export const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';

/** Estado que la API reporta para el TTL de un campo. */
export type TtlState =
  | 'STATE_UNSPECIFIED'
  | 'CREATING'
  | 'ACTIVE'
  | 'NEEDS_REPAIR';

/** Recurso `Field` de la API Admin, con lo único que nos interesa. */
export interface FieldResource {
  name?: string;
  ttlConfig?: { state?: TtlState };
}

/** El recurso `Field` de `expiresAt` en una colección. */
export function ttlFieldUrl(projectId: string, collection: string): string {
  return (
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/collectionGroups/${collection}/fields/${TTL_FIELD}`
  );
}

/** El mismo recurso, con la máscara que limita el PATCH a `ttlConfig`. */
export function ttlFieldPatchUrl(
  projectId: string,
  collection: string
): string {
  return `${ttlFieldUrl(projectId, collection)}?updateMask=ttlConfig`;
}
