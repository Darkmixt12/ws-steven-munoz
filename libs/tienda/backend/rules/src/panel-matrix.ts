import type { DocumentData } from 'firebase/firestore';
import type { NotificationOrigin, Permission } from 'tienda/domain';
import * as fixtures from './fixtures';

// La matriz §13 del Modelo de datos como datos: qué abre cada lectura del Panel
// y qué escribe solo el backend. Las expectativas por Rol salen de `hasPermission`.

/** Empleado cuyo documento nadie más que el Administrador debería leer. */
export const OTHER_EMPLOYEE_UID = 'other-employee-1';

/** Documentos sembrados en las pruebas del Panel. */
export function panelDocs(): Record<string, DocumentData> {
  return {
    'products/published': fixtures.product('published'),
    'products/draft': fixtures.product('draft'),
    'products/archived': fixtures.product('archived'),
    'products/published/variants/v1': fixtures.variant(),
    'products/draft/variants/v1': fixtures.variant(),
    'products/archived/variants/v1': fixtures.variant(),
    'skus/CAM-S': fixtures.sku(),
    'catalogIndex/storefront': fixtures.catalogIndex('published'),
    'stockMovements/m1': fixtures.stockMovement(),
    'stockImports/i1': fixtures.stockImport(),
    [`employees/${OTHER_EMPLOYEE_UID}`]: fixtures.employee('operator', 'active'),
    'invitations/persona@example.com': fixtures.invitation(),
    [`staffDirectory/${OTHER_EMPLOYEE_UID}`]: fixtures.staffDirectoryEntry(),
    'consents/c1': fixtures.consent(),
    'dataRequests/r1': fixtures.dataRequest(),
    'customers/customer-1': fixtures.customer(),
    // El tipo del Pedido llega con su ticket.
    'orders/o1': { customerId: 'customer-1' },
    'counters/orderNumber': fixtures.orderNumberCounter(),
    'settings/storefront': fixtures.storefrontSettings(),
    'settings/issuer': fixtures.issuerSettings(),
    'salesDaily/2026-01-15': fixtures.salesDaily(),
    'auditEvents/e1': fixtures.auditEvent(),
    'notifications/n-orders': fixtures.notification('orders'),
    'notifications/n-invitations': fixtures.notification('invitations'),
    'notifications/n-dataRequests': fixtures.notification('dataRequests'),
  };
}

export interface PanelRead {
  path: string;
  /** Permiso que abre la lectura; `null` = cualquier Empleado Activo. */
  permission: Permission | null;
  /** Si también se prueba listar la colección del documento. */
  list: boolean;
}

/** Lecturas del Panel. Las Notificaciones van aparte: dependen de su origen. */
export const PANEL_READS: readonly PanelRead[] = [
  { path: 'products/draft', permission: 'viewDraftsAndArchived', list: true },
  { path: 'products/archived', permission: 'viewDraftsAndArchived', list: true },
  { path: 'products/draft/variants/v1', permission: 'viewDraftsAndArchived', list: true },
  { path: 'products/archived/variants/v1', permission: 'viewDraftsAndArchived', list: true },
  { path: 'skus/CAM-S', permission: null, list: true },
  { path: 'stockMovements/m1', permission: 'recordStockMovements', list: true },
  { path: 'stockImports/i1', permission: 'recordStockMovements', list: true },
  { path: `employees/${OTHER_EMPLOYEE_UID}`, permission: 'viewEmployees', list: true },
  { path: 'invitations/persona@example.com', permission: 'viewEmployees', list: true },
  { path: `staffDirectory/${OTHER_EMPLOYEE_UID}`, permission: null, list: true },
  { path: 'consents/c1', permission: 'handleDataRequests', list: true },
  { path: 'dataRequests/r1', permission: 'handleDataRequests', list: true },
  // `settings` no se lista: sus documentos tienen reglas propias, sin comodín.
  { path: 'settings/issuer', permission: 'manageSettings', list: false },
  { path: 'salesDaily/2026-01-15', permission: 'viewReports', list: true },
  { path: 'auditEvents/e1', permission: 'viewAuditLog', list: true },
];

/** Permiso que abre las Notificaciones de cada origen. */
export const NOTIFICATION_PERMISSIONS: Readonly<Record<NotificationOrigin, Permission>> = {
  orders: 'viewOrders',
  invitations: 'viewEmployees',
  dataRequests: 'handleDataRequests',
};

export const NOTIFICATION_ORIGINS = Object.keys(
  NOTIFICATION_PERMISSIONS,
) as NotificationOrigin[];

/** Un documento por colección que solo escribe el backend. */
export const BACKEND_ONLY_DOCS = [
  'catalogIndex/storefront',
  'stockMovements/m1',
  'stockImports/i1',
  `employees/${OTHER_EMPLOYEE_UID}`,
  'invitations/persona@example.com',
  `staffDirectory/${OTHER_EMPLOYEE_UID}`,
  'consents/c1',
  'dataRequests/r1',
  'orders/o1',
  'counters/orderNumber',
  'salesDaily/2026-01-15',
  'auditEvents/e1',
  'notifications/n-orders',
];

/** Ruta de la colección de un documento. */
export function collectionOf(path: string): string {
  return path.split(/\/(?=[^/]+$)/)[0];
}
