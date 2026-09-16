import {
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, type DocumentData, type Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROLES, type EmployeeStatus, type Role } from 'tienda/domain';
import { customer, employee } from './fixtures';

/** Proyecto solo de emuladores: con el prefijo `demo-`, nunca toca un proyecto real. */
export const PROJECT_ID = 'demo-tienda-cr';

/** `uid` del Cliente de las pruebas. */
export const CUSTOMER_UID = 'customer-1';

/** `uid` del segundo Cliente, para probar el aislamiento entre Clientes. */
export const SECOND_CUSTOMER_UID = 'customer-2';

/** `uid` de la Cuenta que tiene sesión pero todavía no completó su registro. */
export const NO_CUSTOMER_UID = 'no-customer-1';

const rulesDir = resolve(__dirname, '..');

/**
 * Entorno de pruebas contra los emuladores que levanta `firebase emulators:exec`,
 * cargado con las reglas de este proyecto.
 */
export function createTestEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(rulesDir, 'firestore.rules'), 'utf8'),
    },
    storage: {
      rules: readFileSync(resolve(rulesDir, 'storage.rules'), 'utf8'),
    },
  });
}

/**
 * El contexto expone los SDK compat; las funciones modulares los aceptan porque
 * desenvuelven la instancia, así que las pruebas usan la API modular.
 */
export function firestoreOf(context: RulesTestContext): Firestore {
  return context.firestore() as unknown as Firestore;
}

export function storageOf(context: RulesTestContext): FirebaseStorage {
  return context.storage() as unknown as FirebaseStorage;
}

/** Siembra documentos (ruta → datos) con las reglas desactivadas. */
export function seed(
  env: RulesTestEnvironment,
  docs: Record<string, DocumentData>,
): Promise<void> {
  return env.withSecurityRulesDisabled(async (context) => {
    const db = firestoreOf(context);
    await Promise.all(
      Object.entries(docs).map(([path, data]) => setDoc(doc(db, path), data)),
    );
  });
}

/** Visitante sin sesión. */
export async function asAnonymous(
  env: RulesTestEnvironment,
): Promise<RulesTestContext> {
  return env.unauthenticatedContext();
}

/** Cliente con sesión y correo verificado; siembra su `customers/{uid}`. */
export async function asCustomer(
  env: RulesTestEnvironment,
): Promise<RulesTestContext> {
  await seed(env, { [`customers/${CUSTOMER_UID}`]: customer() });
  return env.authenticatedContext(CUSTOMER_UID, {
    email: 'cliente@example.com',
    email_verified: true,
  });
}

/** Segundo Cliente con sesión y correo verificado; siembra su `customers/{uid}`. */
export async function asSecondCustomer(
  env: RulesTestEnvironment,
): Promise<RulesTestContext> {
  await seed(env, { [`customers/${SECOND_CUSTOMER_UID}`]: customer() });
  return env.authenticatedContext(SECOND_CUSTOMER_UID, {
    email: 'segundo-cliente@example.com',
    email_verified: true,
  });
}

/**
 * Cuenta con sesión y correo verificado, pero sin `customers/{uid}`: no completó el registro,
 * así que no puede crear ningún dato personal en Firestore (Ley 8968).
 */
export async function asAccountWithoutCustomer(
  env: RulesTestEnvironment,
): Promise<RulesTestContext> {
  return env.authenticatedContext(NO_CUSTOMER_UID, {
    email: 'sin-cliente@example.com',
    email_verified: true,
  });
}

/** Personas del catálogo público, para `describe.each`. */
export const publicPersonas = [
  ['anonymous', asAnonymous],
  ['customer', asCustomer],
] as const;

/** `uid` de cada persona Empleado. */
export const EMPLOYEE_UIDS = {
  administrator: 'administrator-1',
  operator: 'operator-1',
  catalogEditor: 'catalog-editor-1',
  invited: 'invited-1',
  disabled: 'disabled-1',
  unverified: 'unverified-1',
  customerEmployee: 'customer-employee-1',
} as const;

/**
 * Cuenta con sesión cuyo `employees/{uid}` se siembra con `data`: acepta cualquier forma,
 * para probar documentos inesperados.
 */
export async function asEmployee(
  env: RulesTestEnvironment,
  uid: string,
  data: DocumentData,
  { emailVerified = true } = {},
): Promise<RulesTestContext> {
  await seed(env, { [`employees/${uid}`]: data });
  return env.authenticatedContext(uid, {
    email: `${uid}@example.com`,
    email_verified: emailVerified,
  });
}

/** Empleado Activo con correo verificado y el Rol dado. */
export function asActiveEmployee(role: Role) {
  return (env: RulesTestEnvironment) =>
    asEmployee(env, EMPLOYEE_UIDS[role], employee(role, 'active'));
}

/** Cada Rol Activo, para `describe.each`. */
export const activeEmployeePersonas = ROLES.map(
  (role) => [role, asActiveEmployee(role)] as const,
);

/** Empleado Invitado. Con Rol Administrador: el estado corta aunque el Rol tenga todos los Permisos. */
export function asInvitedEmployee(env: RulesTestEnvironment) {
  return asEmployee(env, EMPLOYEE_UIDS.invited, employee('administrator', 'invited'));
}

/** Empleado Deshabilitado, con Rol Administrador. */
export function asDisabledEmployee(env: RulesTestEnvironment) {
  return asEmployee(env, EMPLOYEE_UIDS.disabled, employee('administrator', 'disabled'));
}

/** Empleado Activo con el correo sin verificar, con Rol Administrador. */
export function asUnverifiedEmployee(env: RulesTestEnvironment) {
  return asEmployee(env, EMPLOYEE_UIDS.unverified, employee('administrator', 'active'), {
    emailVerified: false,
  });
}

/** Empleados a los que se les niega el Panel, para `describe.each`. */
export const blockedEmployeePersonas = [
  ['invited', asInvitedEmployee],
  ['disabled', asDisabledEmployee],
  ['unverified', asUnverifiedEmployee],
] as const;

/** Cuenta que es Cliente y Empleado Operador a la vez; siembra `customers/{uid}` y `employees/{uid}`. */
export async function asCustomerEmployee(
  env: RulesTestEnvironment,
  status: EmployeeStatus = 'active',
): Promise<RulesTestContext> {
  const uid = EMPLOYEE_UIDS.customerEmployee;
  await seed(env, { [`customers/${uid}`]: customer() });
  return asEmployee(env, uid, employee('operator', status));
}
