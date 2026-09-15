/** Roles del Empleado: fijos, uno por Empleado; gobiernan el Panel. */
export const ROLES = ['administrator', 'operator', 'catalogEditor'] as const;

export type Role = (typeof ROLES)[number];

/** Permisos del Panel, uno por fila de la tabla de roles (#39). Los chequeos preguntan por el Permiso, nunca por el Rol. */
export const PERMISSIONS = [
  /** Ver Borradores y Archivados. */
  'viewDraftsAndArchived',
  /** Crear y editar Productos y Variantes, incluido el precio. */
  'editProducts',
  /** Publicar y archivar. */
  'publishProducts',
  /** Administrar Categorías y Etiquetas. */
  'manageCategoriesAndTags',
  /** Registrar movimientos de stock. */
  'recordStockMovements',
  /** Ver Pedidos. */
  'viewOrders',
  /** Avanzar estado del Pedido. */
  'advanceOrderStatus',
  /** Anular o devolver Pedido. */
  'cancelOrReturnOrders',
  /** Ver Clientes. */
  'viewCustomers',
  /** Deshabilitar y rehabilitar Clientes. */
  'disableCustomers',
  /** Atender Solicitudes de derechos. */
  'handleDataRequests',
  /** Ver Empleados. */
  'viewEmployees',
  /** Gestionar Empleados: invitar, cambiar rol, deshabilitar, rehabilitar. */
  'manageEmployees',
  /** Ver reportes. */
  'viewReports',
  /** Exportar reportes a Excel. */
  'exportReports',
  /** Ver la bitácora. */
  'viewAuditLog',
  /** Configuración: tienda, emisor y Aviso de privacidad. */
  'manageSettings',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Tabla Rol → Permisos, en el orden de `PERMISSIONS`.
 * Espejos que deben mantenerse iguales: `firestore.rules` (lo exige una prueba) y `storage.rules`.
 */
export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  administrator: [
    'viewDraftsAndArchived',
    'editProducts',
    'publishProducts',
    'manageCategoriesAndTags',
    'recordStockMovements',
    'viewOrders',
    'advanceOrderStatus',
    'cancelOrReturnOrders',
    'viewCustomers',
    'disableCustomers',
    'handleDataRequests',
    'viewEmployees',
    'manageEmployees',
    'viewReports',
    'exportReports',
    'viewAuditLog',
    'manageSettings',
  ],
  operator: [
    'viewDraftsAndArchived',
    'recordStockMovements',
    'viewOrders',
    'advanceOrderStatus',
    'cancelOrReturnOrders',
    'viewCustomers',
    'disableCustomers',
    'viewReports',
    'exportReports',
  ],
  catalogEditor: [
    'viewDraftsAndArchived',
    'editProducts',
    'publishProducts',
    'manageCategoriesAndTags',
    'recordStockMovements',
    'viewReports',
    'exportReports',
  ],
};

/** ¿El Rol tiene el Permiso? */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
