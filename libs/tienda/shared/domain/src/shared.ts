/**
 * Forma común del `Timestamp` de Firestore en el SDK web y en el Admin SDK.
 * La librería no depende de ninguno de los dos: cualquiera de sus `Timestamp` cumple esta interfaz.
 */
export interface Timestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}

/** Tipo de Autor: un Empleado, un Cliente o el Sistema. */
export type ActorType = 'employee' | 'customer' | 'system';

/**
 * Autor de una acción registrada. `id` es el `uid`, o la clave del proceso del Sistema
 * (`autoCancel`, `cardWebhook`, `anonymization`, `salesRebuild`). Nunca copia nombre ni correo.
 */
export interface Actor {
  type: ActorType;
  id: string;
}

/** Motivo de lista fija más una nota libre. */
export interface Reason {
  code: string;
  note: string | null;
}

/** Referencia a una Variante: siempre con su Producto, porque la Variante vive bajo él. */
export interface VariantRef {
  productId: string;
  variantId: string;
}

/**
 * SKU normalizado: mayúsculas y sin espacios. Es el id de `skus/{sku}` y el valor que se
 * guarda en la Variante, así que el Panel normaliza antes de escribir y la regla exige que
 * los dos coincidan; las reglas no normalizan.
 */
export function normalizeSku(value: string): string {
  return value.replace(/\s+/gu, '').toUpperCase();
}
