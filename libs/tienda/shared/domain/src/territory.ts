/**
 * Catálogo territorial de Costa Rica (§5.2 y §15 del Modelo de datos). Es un dato versionado de
 * la librería, no una colección de Firestore: el front y las Functions lo leen del mismo JSON.
 *
 * El JSON lo genera `scripts/build-dta.ts` a partir de `data/dta-2026.tsv`, que es la fuente que
 * se revisa en el repo. No se edita a mano: se edita el TSV y se vuelve a correr el generador
 * (`nx run tienda-domain:build-dta`), que además comprueba los conteos y falla si no cuadran.
 */
import * as catalog from '../data/dta-2026.json';

/**
 * Versión del catálogo con la que se capturó una Dirección. Se congela en la Dirección y en el
 * Pedido (`dtaVersion`), así que un cambio de división territorial no reescribe lo ya guardado.
 */
export const DTA_VERSION = 'DTA-2026';

/**
 * Distrito del catálogo. Es `CodedLocation` sin `otherSigns`: lo que el catálogo sabe, no lo que
 * escribe la persona. El `code` de 5 dígitos es `P CC DD` y es también el código postal.
 */
export interface District {
  code: string;
  provinceName: string;
  cantonName: string;
  districtName: string;
}

/** Los 494 distritos, ordenados por código. */
export const DISTRICTS: readonly District[] = catalog.districts;

const BY_CODE = new Map<string, District>(DISTRICTS.map((district) => [district.code, district]));

/**
 * Busca por código de distrito. Devuelve `null` si no existe, para que quien valide una Dirección
 * distinga «no está en el catálogo» de un distrito real.
 */
export function findDistrict(code: string): District | null {
  return BY_CODE.get(code) ?? null;
}
