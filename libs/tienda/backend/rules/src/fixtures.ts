import { Timestamp } from 'firebase/firestore';
import type {
  CatalogIndex,
  Category,
  PrivacyNotice,
  Product,
  ProductStatus,
  SlugIndex,
  StorefrontSettings,
  Tag,
  Variant,
} from 'tienda/domain';

// Documentos de ejemplo con la forma del Modelo de datos, tipados con `tienda/domain`.

const at = Timestamp.fromDate(new Date('2026-01-15T12:00:00-06:00'));
const employeeUid = 'employee-1';

export function product(status: ProductStatus): Product {
  return {
    name: 'Camiseta',
    description: 'Camiseta de algodón',
    slug: 'camiseta',
    categoryId: 'ropa',
    tagIds: ['nuevo'],
    status,
    publishedAt: status === 'draft' ? null : at,
    images: [{ id: 'img-1', alt: 'Camiseta azul' }],
    options: [{ name: 'Talla', values: ['S', 'M'] }],
    cabysCode: '1234567890123',
    vatRateCode: '08',
    unitOfMeasure: 'Unid',
    summary: {
      priceMin: 9_500,
      priceMax: 9_500,
      inStock: true,
      activeVariantCount: 1,
    },
    hasHistory: false,
    createdAt: at,
    updatedAt: at,
    updatedBy: employeeUid,
  };
}

export function variant(): Variant {
  return {
    sku: 'CAM-S',
    price: 9_500,
    optionValues: { Talla: 'S' },
    weightGrams: 200,
    active: true,
    imageId: null,
    stock: 0,
    hasHistory: false,
    createdAt: at,
    updatedAt: at,
    updatedBy: employeeUid,
  };
}

export function category(): Category {
  return {
    name: 'Ropa',
    parentId: null,
    sortOrder: 1,
    createdAt: at,
    updatedAt: at,
    updatedBy: employeeUid,
  };
}

export function tag(): Tag {
  return { name: 'Nuevo', createdAt: at, updatedAt: at, updatedBy: employeeUid };
}

export function slug(productId: string): SlugIndex {
  return { productId };
}

export function catalogIndex(productId: string): CatalogIndex {
  return {
    entries: {
      [productId]: {
        slug: 'camiseta',
        name: 'Camiseta',
        categoryId: 'ropa',
        tagIds: ['nuevo'],
        publishedAt: at,
        optionValues: ['S', 'M'],
        priceMin: 9_500,
        priceMax: 9_500,
        inStock: true,
        mainImageId: 'img-1',
      },
    },
    updatedAt: at,
  };
}

export function storefrontSettings(): StorefrontSettings {
  return {
    shippingRates: { '1': 2_500, '2': 3_000 },
    shippingVatRateCode: '08',
    paymentTimeouts: { cardMinutes: 60, sinpeMovilMinutes: 1_440 },
    sinpeMovilNumber: '+50600000000',
    storeInfo: {
      name: 'Tienda CR',
      contactEmail: 'tienda@example.com',
      contactPhone: '+50600000000',
    },
    pickupInfo: { address: 'San José', hours: 'L–V 9:00–17:00' },
    currentPrivacyNoticeVersion: '2026-01',
    updatedAt: at,
    updatedBy: employeeUid,
  };
}

export function privacyNotice(): PrivacyNotice {
  return {
    text: 'Aviso de privacidad',
    purposes: ['accountAndOrders', 'marketing'],
    publishedAt: at,
    updatedBy: employeeUid,
  };
}

/** `customers/{uid}`; su tipo llega con el ticket del Cliente. */
export function customer() {
  return {
    name: 'Cliente',
    email: 'cliente@example.com',
    phone: '+50600000000',
    status: 'active',
    statusReason: null,
    defaultAddressId: null,
    createdAt: at,
    updatedAt: at,
  };
}
