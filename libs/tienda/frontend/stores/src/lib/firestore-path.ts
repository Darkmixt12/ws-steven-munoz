/**
 * Parte una ruta de Firestore (`products/p1/variants`) en los segmentos que
 * esperan `collection()` y `doc()`. Lanza si la ruta no tiene segmentos.
 */
export function toPathArgs(path: string): [string, ...string[]] {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) throw new Error(`Invalid Firestore path: "${path}"`);
  return parts as [string, ...string[]];
}
