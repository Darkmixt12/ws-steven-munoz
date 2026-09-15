import { Timestamp } from 'firebase/firestore';
import type {
  AuditEvent,
  CatalogIndex,
  Category,
  Consent,
  DataRequest,
  Employee,
  EmployeeStatus,
  Invitation,
  IssuerSettings,
  Notification,
  NotificationOrigin,
  NotificationType,
  OrderNumberCounter,
  PrivacyNotice,
  Product,
  ProductStatus,
  Role,
  SalesDaily,
  SkuIndex,
  SlugIndex,
  StaffDirectoryEntry,
  StockImport,
  StockMovement,
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

export function sku(): SkuIndex {
  return { productId: 'published', variantId: 'v1' };
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

export function issuerSettings(): IssuerSettings {
  return {
    idType: '02',
    idNumber: '3101000000',
    name: 'Tienda CR S.A.',
    economicActivityCode: '523901',
    branch: '001',
    terminal: '00001',
    location: {
      districtCode: '10101',
      provinceName: 'San José',
      cantonName: 'San José',
      districtName: 'Carmen',
      otherSigns: 'Frente al parque',
    },
    email: 'facturas@example.com',
    updatedAt: at,
    updatedBy: employeeUid,
  };
}

export function stockMovement(): StockMovement {
  return {
    productId: 'published',
    variantId: 'v1',
    type: 'receipt',
    quantity: 5,
    resultingStock: 5,
    reason: null,
    note: null,
    origin: { type: 'stockImport', id: 'i1' },
    actor: { type: 'employee', id: employeeUid },
    createdAt: at,
  };
}

export function stockImport(): StockImport {
  return {
    fileName: 'entradas.xlsx',
    entryCount: 1,
    totalUnits: 5,
    actor: { type: 'employee', id: employeeUid },
    createdAt: at,
  };
}

export function employee(role: Role, status: EmployeeStatus): Employee {
  return {
    email: 'empleado@example.com',
    name: status === 'invited' ? null : 'Empleado',
    phone: null,
    role,
    status,
    statusReason: status === 'disabled' ? { code: 'leftCompany', note: null } : null,
    invitedBy: employeeUid,
    invitedAt: at,
    statusChangedAt: at,
    lastPanelEntryAt: status === 'invited' ? null : at,
    anonymizedAt: null,
    createdAt: at,
    updatedAt: at,
  };
}

export function invitation(): Invitation {
  return {
    email: 'persona@example.com',
    role: 'operator',
    invitedBy: employeeUid,
    invitedAt: at,
    expiresAt: at,
  };
}

export function staffDirectoryEntry(): StaffDirectoryEntry {
  return { name: 'Empleado' };
}

export function consent(): Consent {
  return {
    subjectType: 'customer',
    subjectId: 'customer-1',
    purpose: 'accountAndOrders',
    granted: true,
    noticeVersion: '2026-01',
    noticeHash: 'hash',
    channel: 'storefront',
    createdAt: at,
    expiresAt: null,
  };
}

export function dataRequest(): DataRequest {
  return {
    type: 'access',
    subject: { type: 'customer', id: 'customer-1' },
    contactEmail: 'cliente@example.com',
    channel: 'email',
    status: 'open',
    dueAt: at,
    response: null,
    resolvedBy: null,
    resolvedAt: null,
    createdAt: at,
    expiresAt: null,
  };
}

export function orderNumberCounter(): OrderNumberCounter {
  return { next: 1001 };
}

export function salesDaily(): SalesDaily {
  return {
    variants: {
      v1: {
        productId: 'published',
        soldUnits: 1,
        cancelledUnits: 0,
        returnedUnits: 0,
        soldAmount: 9_500,
        cancelledAmount: 0,
        returnedAmount: 0,
      },
    },
    updatedAt: at,
  };
}

export function auditEvent(): AuditEvent {
  return {
    actionKey: 'product.publish',
    target: { collection: 'products', id: 'published' },
    actor: { type: 'employee', id: employeeUid },
    changes: { status: { before: 'draft', after: 'published' } },
    reason: null,
    occurredAt: at,
    expiresAt: at,
  };
}

const notificationTypes: Record<NotificationOrigin, NotificationType> = {
  orders: 'order.paymentConfirmed',
  invitations: 'invitation.sent',
  dataRequests: 'dataRequest.answered',
};

export function notification(origin: NotificationOrigin): Notification {
  return {
    type: notificationTypes[origin],
    ref: { collection: origin, id: 'x1' },
    params: null,
    to: ['destino@example.com'],
    channel: 'email',
    status: 'sent',
    attempts: 1,
    lastError: null,
    providerMessageId: null,
    sentAt: at,
    actor: { type: 'system', id: 'cardWebhook' },
    resendOf: null,
    createdAt: at,
    updatedAt: at,
    expiresAt: at,
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
