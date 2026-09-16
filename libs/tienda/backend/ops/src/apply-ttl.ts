/**
 * Aplica las políticas TTL de la Tienda CR sobre `expiresAt`.
 *
 * `firebase-tools` no tiene comando de TTL, así que esto habla directo con la
 * API Admin de Firestore. Se autentica con Application Default Credentials, así
 * que antes hay que tener credenciales activas para el proyecto.
 *
 *   npx nx run tienda-ops:apply-ttl -- --project=<id> --dry-run
 *   npx nx run tienda-ops:apply-ttl -- --project=<id>
 *
 * Es idempotente: consulta el estado de cada campo y solo pide el TTL de los que
 * aún no lo tienen, así que volver a correrlo no cuesta nada.
 */
import { GoogleAuth } from 'google-auth-library';

import {
  FIRESTORE_SCOPE,
  TTL_COLLECTIONS,
  TTL_FIELD,
  TTL_PATCH_BODY,
  type FieldResource,
  ttlFieldPatchUrl,
  ttlFieldUrl,
} from './ttl-policies';

interface Args {
  projectId: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  let projectId: string | null = null;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg.startsWith('--project=')) {
      projectId = arg.slice('--project='.length);
    } else if (arg === '--project') {
      projectId = argv[++i] ?? null;
    } else {
      throw new Error(`Argumento no reconocido: ${arg}`);
    }
  }

  if (!projectId) {
    throw new Error(
      'Falta --project=<id>. Ejemplo: nx run tienda-ops:apply-ttl -- --project=demo-tienda-cr --dry-run'
    );
  }

  return { projectId, dryRun };
}

/** Imprime lo que se enviaría, sin red ni credenciales. */
function printPlan(projectId: string): void {
  for (const collection of TTL_COLLECTIONS) {
    console.log(`PATCH ${ttlFieldPatchUrl(projectId, collection)}`);
    console.log(`      ${JSON.stringify(TTL_PATCH_BODY)}`);
  }
  console.log(
    `\n${TTL_COLLECTIONS.length} políticas por aplicar sobre \`${TTL_FIELD}\`. Nada se envió.`
  );
}

async function applyPolicies(projectId: string): Promise<void> {
  const auth = new GoogleAuth({ scopes: [FIRESTORE_SCOPE] });
  const client = await auth.getClient();

  for (const collection of TTL_COLLECTIONS) {
    const current = await client.request<FieldResource>({
      url: ttlFieldUrl(projectId, collection),
      method: 'GET',
    });
    const state = current.data.ttlConfig?.state;

    if (state === 'ACTIVE' || state === 'CREATING') {
      console.log(`= ${collection}.${TTL_FIELD}: ya tiene TTL (${state}).`);
      continue;
    }

    await client.request({
      url: ttlFieldPatchUrl(projectId, collection),
      method: 'PATCH',
      data: TTL_PATCH_BODY,
    });
    console.log(`+ ${collection}.${TTL_FIELD}: TTL solicitado.`);
  }

  console.log(
    '\nListo. Firestore tarda un rato en dejar cada política en ACTIVE.'
  );
}

async function main(): Promise<void> {
  const { projectId, dryRun } = parseArgs(process.argv.slice(2));
  console.log(`Proyecto: ${projectId}${dryRun ? ' (simulación)' : ''}\n`);

  if (dryRun) {
    printPlan(projectId);
    return;
  }

  await applyPolicies(projectId);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
