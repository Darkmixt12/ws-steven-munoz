import { Timestamp } from 'firebase/firestore';
import { productThumbnailPath } from 'tienda/domain';
import type {
  Address,
  AddressDetails,
  AuditEvent,
  BillingProfile,
  BillingProfileDetails,
  Cart,
  CartLine,
  CatalogIndex,
  Category,
  Consent,
  Customer,
  CustomerStatus,
  DataRequest,
  Employee,
  EmployeeStatus,
  Invitation,
  IssuerSettings,
  Notification,
  NotificationOrigin,
  NotificationType,
  Order,
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
const customerUid = 'customer-1';

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

export function consent(subjectId = customerUid): Consent {
  return {
    subjectType: 'customer',
    subjectId,
    purpose: 'accountAndOrders',
    granted: true,
    noticeVersion: '2026-01',
    noticeHash: 'hash',
    channel: 'storefront',
    createdAt: at,
    expiresAt: null,
  };
}

export function dataRequest(subjectId = customerUid): DataRequest {
  return {
    type: 'access',
    subject: { type: 'customer', id: subjectId },
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

export function customer(status: CustomerStatus = 'active'): Customer {
  return {
    name: 'Cliente',
    email: 'cliente@example.com',
    phone: '+50600000000',
    status,
    statusReason: status === 'disabled' ? { code: 'suspectedFraud', note: null } : null,
    defaultAddressId: null,
    createdAt: at,
    updatedAt: at,
  };
}

/** Forma de la Dirección sin sellos: también es la copia congelada del Pedido. */
export function addressDetails(): AddressDetails {
  return {
    recipientName: 'Cliente',
    phone: '+50688888888',
    districtCode: '10101',
    provinceName: 'San José',
    cantonName: 'San José',
    districtName: 'Carmen',
    neighborhood: null,
    otherSigns: 'Frente al parque',
    dtaVersion: 'DTA-2026',
  };
}

export function address(): Address {
  return { ...addressDetails(), createdAt: at, updatedAt: at };
}

/** Forma del Perfil de facturación sin sellos: también es la copia congelada del Pedido. */
export function billingProfileDetails(): BillingProfileDetails {
  return {
    idType: '01',
    idNumber: '100000000',
    legalName: 'Cliente Pérez',
    email: 'cliente@example.com',
    location: null,
  };
}

export function billingProfile(): BillingProfile {
  return { ...billingProfileDetails(), createdAt: at, updatedAt: at };
}

export function cartLine(productId = 'published'): CartLine {
  return { productId, quantity: 1, addedAt: at };
}

export function cart(lines: Record<string, CartLine> = { v1: cartLine() }): Cart {
  return { lines, updatedAt: at };
}

/**
 * `orders/{orderId}`. `buyerUid` se pasa aparte porque sobrevive a la baja de la cuenta:
 * un Pedido desasociado tiene `customerId` nulo y conserva el `uid` del comprador.
 */
export function order(
  customerId: string | null = customerUid,
  buyerUid: string | null = customerId,
): Order {
  return {
    orderNumber: 1_001,
    customerId,
    buyerUid,
    status: 'toFulfill',
    statusHistory: [
      { status: 'pendingPayment', at, actor: { type: 'customer', id: customerUid } },
      { status: 'toFulfill', at, actor: { type: 'system', id: 'cardWebhook' } },
    ],
    contact: { name: 'Cliente', email: 'cliente@example.com', phone: '+50600000000' },
    delivery: {
      method: 'homeDelivery',
      shippingCost: 2_500,
      shippingVatRateCode: '08',
      address: addressDetails(),
      tracking: null,
    },
    lines: [
      {
        productId: 'published',
        variantId: 'v1',
        sku: 'CAM-S',
        productName: 'Camiseta',
        optionValues: { Talla: 'S' },
        optionLabel: 'Talla S',
        thumbPath: productThumbnailPath('published', 'img-1', 400),
        cabysCode: '1234567890123',
        unitOfMeasure: 'Unid',
        vatRateCode: '08',
        unitPrice: 9_500,
        quantity: 1,
        lineDiscount: 0,
        lineTotal: 9_500,
      },
    ],
    totals: {
      subtotal: 9_500,
      discountTotal: 0,
      shipping: 2_500,
      total: 12_000,
      vatIncluded: 1_380,
    },
    billing: { documentType: 'invoice', profile: billingProfileDetails() },
    payment: {
      method: 'card',
      status: 'confirmed',
      amount: 12_000,
      reference: 'auth-123',
      confirmedBy: null,
      confirmedAt: at,
      refunds: [],
    },
    returns: [],
    taxDocuments: [],
    paymentDeadlineAt: at,
    paymentConfirmedAt: at,
    cancelledAt: null,
    returnDays: [],
    retentionUntil: at,
    legalHold: false,
    anonymizedAt: null,
    createdAt: at,
    updatedAt: at,
  };
}
