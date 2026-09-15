import type { Timestamp } from './shared';

/** Estado del Producto: Borrador, Publicado o Archivado. */
export type ProductStatus = 'draft' | 'published' | 'archived';

/** Imagen de Producto. La primera de la galería es la Imagen principal. */
export interface ProductImage {
  id: string;
  alt?: string;
}

/** Eje de Opción con sus valores (p. ej. Talla: S, M, L). */
export interface ProductOption {
  name: string;
  values: string[];
}

/** Resumen derivado de las Variantes. Solo lo escribe el backend. */
export interface ProductSummary {
  priceMin: number;
  priceMax: number;
  inStock: boolean;
  activeVariantCount: number;
}

/** `products/{productId}` */
export interface Product {
  name: string;
  description: string;
  /** Único vía `slugs/{slug}`. */
  slug: string;
  categoryId: string;
  tagIds: string[];
  status: ProductStatus;
  /** Fecha de publicación: se fija al publicar por primera vez; `null` mientras nunca se publicó. */
  publishedAt: Timestamp | null;
  /** Hasta 10, en orden. */
  images: ProductImage[];
  /** Hasta 3 ejes de Opción. */
  options: ProductOption[];
  cabysCode: string;
  vatRateCode: string;
  unitOfMeasure: string;
  /** Solo backend. */
  summary: ProductSummary;
  /** Solo backend. */
  hasHistory: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
}

/** `products/{productId}/variants/{variantId}` */
export interface Variant {
  /** Único vía `skus/{sku}`. */
  sku: string;
  /** CRC en enteros, con IVA incluido. */
  price: number;
  /** Eje → valor; vacío en la Variante por defecto. */
  optionValues: Record<string, string>;
  weightGrams: number;
  active: boolean;
  /** Señala una imagen de `images` del Producto. */
  imageId: string | null;
  /** Solo backend; nunca negativo. */
  stock: number;
  /** Solo backend. */
  hasHistory: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
}

/** `categories/{categoryId}`: árbol de hasta dos niveles. */
export interface Category {
  name: string;
  parentId: string | null;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
}

/** `tags/{tagId}` */
export interface Tag {
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
}

/** `slugs/{slug}`: índice de unicidad del slug; la tienda resuelve `/p/{slug}` con él. */
export interface SlugIndex {
  productId: string;
}

/** Entrada de un Producto Publicado en `catalogIndex/storefront`; sale solo del documento del Producto. */
export interface CatalogIndexEntry {
  slug: string;
  name: string;
  categoryId: string;
  tagIds: string[];
  publishedAt: Timestamp;
  /** Todos los valores de `options`. */
  optionValues: string[];
  priceMin: number;
  priceMax: number;
  inStock: boolean;
  /** `images[0].id` */
  mainImageId: string;
}

/** `catalogIndex/storefront`: índice del catálogo publicado, del que la tienda lista y busca. */
export interface CatalogIndex {
  /** `productId` → entrada, una por Producto Publicado. */
  entries: Record<string, CatalogIndexEntry>;
  updatedAt: Timestamp;
}
