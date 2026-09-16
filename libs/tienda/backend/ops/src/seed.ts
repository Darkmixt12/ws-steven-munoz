/**
 * Siembra un proyecto de la Tienda CR: el primer Administrador, el contador de Pedidos, la
 * Configuración de la tienda y la primera versión del Aviso de privacidad.
 *
 *   npx nx run tienda-ops:seed -- --project-id=<id> --email=<correo> --dry-run
 *   npx nx run tienda-ops:seed -- --project-id=<id> --email=<correo>
 *
 * El proyecto se nombra con `--project-id`, y no con `--project` como en `apply-ttl.ts`, porque
 * `tsconfig-paths/register` —que este script necesita para resolver `tienda/domain` en ejecución—
 * se queda con `--project` y `-P` de la línea de órdenes para buscar su propio tsconfig.
 *
 * Contra los emuladores hay que exportar antes `FIRESTORE_EMULATOR_HOST` y
 * `FIREBASE_AUTH_EMULATOR_HOST`; contra un proyecto real se autentica con Application Default
 * Credentials. Ver `docs/tienda-semillas.md`.
 *
 * Solo crea lo que falta: nunca sobrescribe ni borra. Por eso volver a correrlo no cuesta nada y,
 * sobre todo, no reinicia el contador de una tienda que ya despachó Pedidos. Los documentos van en
 * un único lote, así que un fallo a medias no deja la Configuración apuntando a un Aviso que no se
 * llegó a escribir.
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { privacyNoticeHash } from 'tienda/domain';

import {
  CONSENTS_COLLECTION,
  DEFAULT_FIRST_ORDER_NUMBER,
  PRIVACY_NOTICE_VERSION,
  parseStorefrontBase,
  seedDocuments,
  type SeedDocument,
  type StorefrontBaseValues,
} from './seed-data';

/** Los valores base viven en ficheros versionados, al lado del script. */
const SEED_DIR = join(__dirname, '..', 'seed');

/** `uid` de mentira para la simulación, que no consulta Auth. */
const DRY_RUN_UID = '<uid-del-primer-administrador>';

interface Args {
  projectId: string;
  email: string;
  name: string;
  firstOrderNumber: number;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  let projectId: string | null = null;
  let email: string | null = null;
  let name = 'Administrador';
  let firstOrderNumber = DEFAULT_FIRST_ORDER_NUMBER;
  let dryRun = false;

  const value = (arg: string, prefix: string, next: () => string | undefined) =>
    arg.startsWith(`${prefix}=`) ? arg.slice(prefix.length + 1) : next();

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--project-id' || arg.startsWith('--project-id=')) {
      projectId = value(arg, '--project-id', () => argv[++i]) ?? null;
    } else if (arg === '--email' || arg.startsWith('--email=')) {
      email = value(arg, '--email', () => argv[++i]) ?? null;
    } else if (arg === '--name' || arg.startsWith('--name=')) {
      name = value(arg, '--name', () => argv[++i]) ?? name;
    } else if (
      arg === '--first-order-number' ||
      arg.startsWith('--first-order-number=')
    ) {
      const raw = value(arg, '--first-order-number', () => argv[++i]);
      firstOrderNumber = Number(raw);
      if (!Number.isInteger(firstOrderNumber) || firstOrderNumber < 1) {
        throw new Error(`--first-order-number tiene que ser un entero positivo: ${raw}`);
      }
    } else {
      throw new Error(`Argumento no reconocido: ${arg}`);
    }
  }

  if (!projectId || !email) {
    throw new Error(
      'Faltan --project-id=<id> y --email=<correo>. Ejemplo: nx run tienda-ops:seed -- ' +
        '--project-id=demo-tienda-cr --email=admin@tienda.cr --dry-run',
    );
  }

  return { projectId, email, name, firstOrderNumber, dryRun };
}

function readStorefrontBase(): StorefrontBaseValues {
  const path = join(SEED_DIR, 'storefront.json');
  return parseStorefrontBase(JSON.parse(readFileSync(path, 'utf8')));
}

function readNoticeText(version: string): string {
  return readFileSync(join(SEED_DIR, `privacy-notice-${version}.md`), 'utf8');
}

/** Contraseña inicial: la del entorno si está, y si no una generada que se imprime una sola vez. */
function initialPassword(): { password: string; generated: boolean } {
  const fromEnv = process.env['SEED_ADMIN_PASSWORD'];
  if (fromEnv) {
    return { password: fromEnv, generated: false };
  }
  return { password: randomBytes(24).toString('base64url'), generated: true };
}

function isUserNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'auth/user-not-found'
  );
}

/** La Cuenta de Auth del primer Administrador. Si el correo ya existe, se reutiliza su `uid`. */
async function ensureAdminAccount(
  email: string,
  name: string,
): Promise<{ uid: string; created: boolean }> {
  const auth = getAuth();

  try {
    const existing = await auth.getUserByEmail(email);
    if (!existing.emailVerified) {
      console.warn(
        `! La Cuenta de ${email} ya existe pero tiene el correo sin verificar. Las reglas exigen\n` +
          '  `email_verified`, así que el Panel la rechazará hasta que se verifique. Este script no\n' +
          '  toca Cuentas existentes.',
      );
    }
    return { uid: existing.uid, created: false };
  } catch (error: unknown) {
    if (!isUserNotFound(error)) {
      throw error;
    }
  }

  const { password, generated } = initialPassword();
  const created = await auth.createUser({
    email,
    emailVerified: true,
    displayName: name,
    password,
  });

  if (generated) {
    console.log(`\n  Contraseña inicial de ${email}: ${password}`);
    console.log('  Se imprime una sola vez y no queda en ningún archivo. Cámbiala al ingresar.\n');
  }

  return { uid: created.uid, created: true };
}

/** Los `Timestamp` se imprimen como fecha, no como su forma interna. */
function readable(_key: string, value: unknown): unknown {
  return value instanceof Timestamp ? value.toDate().toISOString() : value;
}

function printPlan(documents: readonly SeedDocument[]): void {
  for (const document of documents) {
    const path = document.autoId ? `${document.path}/<autoId>` : document.path;
    console.log(`\n${path}`);
    console.log(JSON.stringify(document.data, readable, 2));
  }
}

/** ¿Ya hay evidencia de que este Administrador aceptó el Aviso para entrar al Panel? */
async function panelAccessConsentExists(
  db: Firestore,
  adminUid: string,
): Promise<boolean> {
  const found = await db
    .collection(CONSENTS_COLLECTION)
    .where('subjectId', '==', adminUid)
    .where('purpose', '==', 'panelAccess')
    .limit(1)
    .get();
  return !found.empty;
}

interface PlannedWrite {
  document: SeedDocument;
  exists: boolean;
}

/**
 * Qué existe ya y qué falta. Todas las lecturas van antes del lote, incluida la consulta del
 * Consentimiento, que no se puede hacer dentro de un `WriteBatch`.
 */
async function planWrites(
  db: Firestore,
  documents: readonly SeedDocument[],
  adminUid: string,
): Promise<PlannedWrite[]> {
  const planned: PlannedWrite[] = [];
  for (const document of documents) {
    const exists = document.autoId
      ? await panelAccessConsentExists(db, adminUid)
      : (await db.doc(document.path).get()).exists;
    planned.push({ document, exists });
  }
  return planned;
}

async function writeSeed(db: Firestore, planned: PlannedWrite[]): Promise<void> {
  for (const { document } of planned.filter((entry) => entry.exists)) {
    // El Consentimiento no tiene ruta fija: su id lo pone Firestore, así que se nombra la
    // colección y lo que se encontró en ella.
    console.log(
      document.autoId
        ? `= ${document.path}: ya hay evidencia, se deja como está.`
        : `= ${document.path}: ya existe, se deja como está.`,
    );
  }

  const pending = planned.filter((entry) => !entry.exists);
  if (pending.length === 0) {
    console.log('\nNada que sembrar: el proyecto ya tiene todo lo de #67.');
    return;
  }

  const batch = db.batch();
  for (const { document } of pending) {
    const ref = document.autoId
      ? db.collection(document.path).doc()
      : db.doc(document.path);
    // `create` falla si el documento apareció entre la lectura y el lote: nunca sobrescribe.
    batch.create(ref, document.data);
    console.log(`+ ${ref.path}`);
  }

  await batch.commit();
  console.log(`\nListo: ${pending.length} documento(s) creados en un solo lote.`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const storefront = readStorefrontBase();
  const noticeText = readNoticeText(PRIVACY_NOTICE_VERSION);
  const noticeHash = await privacyNoticeHash(noticeText);

  console.log(`Proyecto: ${args.projectId}${args.dryRun ? ' (simulación)' : ''}`);
  console.log(`Aviso de privacidad ${PRIVACY_NOTICE_VERSION} · sha256 ${noticeHash}`);

  const common = {
    adminEmail: args.email,
    adminName: args.name,
    noticeVersion: PRIVACY_NOTICE_VERSION,
    noticeText,
    noticeHash,
    storefront,
    firstOrderNumber: args.firstOrderNumber,
  };

  if (args.dryRun) {
    printPlan(
      seedDocuments({ ...common, adminUid: DRY_RUN_UID, now: Timestamp.now() }),
    );
    console.log('\nSimulación: no se conectó a ningún proyecto ni se escribió nada.');
    return;
  }

  // Un proyecto `demo-` solo existe en los emuladores: sin la variable, el Admin SDK saldría a
  // Internet a buscar un proyecto que no está.
  if (args.projectId.startsWith('demo-') && !process.env['FIRESTORE_EMULATOR_HOST']) {
    throw new Error(
      `\`${args.projectId}\` es un proyecto de emulador: exporta FIRESTORE_EMULATOR_HOST y ` +
        'FIREBASE_AUTH_EMULATOR_HOST antes de correr esto.',
    );
  }

  initializeApp({ projectId: args.projectId });

  const { uid, created } = await ensureAdminAccount(args.email, args.name);
  console.log(
    `${created ? '+' : '='} Cuenta de ${args.email}: ${created ? 'creada' : 'ya existía'} (${uid})\n`,
  );

  const db = getFirestore();
  const documents = seedDocuments({
    ...common,
    adminUid: uid,
    now: Timestamp.now(),
  });

  await writeSeed(db, await planWrites(db, documents, uid));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
