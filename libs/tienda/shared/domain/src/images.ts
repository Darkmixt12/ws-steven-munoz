/**
 * Rutas de Storage de las Imágenes de Producto (§10 del Modelo de datos). Ninguna URL se
 * guarda: el Panel, el front y el script de regeneración las derivan de `productId` e
 * `imageId` con estos helpers, que son el espejo en código de `storage.rules`.
 */

/**
 * Lados de las miniaturas en px, en orden. El Panel las genera al subir, desde el mismo
 * bitmap del original; el front las lee, incluido el `thumbPath` congelado en el Pedido.
 */
export const THUMBNAIL_SIZES = [400, 800] as const;

export type ThumbnailSize = (typeof THUMBNAIL_SIZES)[number];

/** Original de la imagen, de hasta 1600 px. */
export function productImagePath(productId: string, imageId: string): string {
  return `products/${productId}/${imageId}.webp`;
}

/** Miniatura cuadrada del tamaño dado, ajustada dentro del cuadro sin recortar. */
export function productThumbnailPath(
  productId: string,
  imageId: string,
  size: ThumbnailSize,
): string {
  return `products/${productId}/thumbs/${imageId}_${size}x${size}.webp`;
}

/**
 * Los tres archivos de una imagen, el original primero. El Panel los sube juntos con el
 * mismo `imageId` y la imagen entra a la galería solo cuando los tres existen.
 */
export function productImagePaths(productId: string, imageId: string): string[] {
  return [
    productImagePath(productId, imageId),
    ...THUMBNAIL_SIZES.map((size) => productThumbnailPath(productId, imageId, size)),
  ];
}
