import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROLE_PERMISSIONS } from 'tienda/domain';

const BEGIN = '// BEGIN ROLE_PERMISSIONS';
const END = '// END ROLE_PERMISSIONS';

/** Los espejos de la tabla fuera del código (§14 del Modelo de datos). */
const MIRRORS = ['firestore.rules', 'storage.rules'] as const;

/** Extrae del archivo de reglas la tabla Rol → Permisos que está entre los marcadores. */
function rulesRolePermissions(file: string): Record<string, string[]> {
  const rules = readFileSync(resolve(__dirname, '..', file), 'utf8');
  const start = rules.indexOf(BEGIN);
  const end = rules.indexOf(END);
  if (start === -1 || end < start || rules.indexOf(BEGIN, start + 1) !== -1) {
    throw new Error(`${file} debe tener un solo bloque entre "${BEGIN}" y "${END}"`);
  }

  const block = rules.slice(start + BEGIN.length, end);
  const table: Record<string, string[]> = {};
  for (const [, role, list] of block.matchAll(/'(\w+)'\s*:\s*\[([^\]]*)\]/g)) {
    table[role] = [...list.matchAll(/'(\w+)'/g)].map(([, permission]) => permission);
  }
  return table;
}

describe('Role → Permissions mirror', () => {
  it.each(MIRRORS)('%s holds the same table as tienda/domain, in the same order', (file) => {
    expect(rulesRolePermissions(file)).toEqual(ROLE_PERMISSIONS);
  });
});
