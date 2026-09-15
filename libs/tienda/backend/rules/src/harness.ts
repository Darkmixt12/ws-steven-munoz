import {
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, type DocumentData, type Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { customer } from './fixtures';

/** Proyecto solo de emuladores: con el prefijo `demo-`, nunca toca un proyecto real. */
export const PROJECT_ID = 'demo-tienda-cr';

/** `uid` del Cliente de las pruebas. */
export const CUSTOMER_UID = 'customer-1';

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

/** Personas del catálogo público, para `describe.each`. */
export const publicPersonas = [
  ['anonymous', asAnonymous],
  ['customer', asCustomer],
] as const;
