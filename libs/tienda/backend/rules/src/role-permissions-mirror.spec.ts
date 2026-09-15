import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROLE_PERMISSIONS } from 'tienda/domain';

const BEGIN = '// BEGIN ROLE_PERMISSIONS';
const END = '// END ROLE_PERMISSIONS';

/** Extrae de `firestore.rules` la tabla Rol → Permisos que está entre los marcadores. */
function rulesRolePermissions(): Record<string, string[]> {
  const rules = readFileSync(resolve(__dirname, '..', 'firestore.rules'), 'utf8');
  const start = rules.indexOf(BEGIN);
  const end = rules.indexOf(END);
  if (start === -1 || end < start || rules.indexOf(BEGIN, start + 1) !== -1) {
    throw new Error(`firestore.rules debe tener un solo bloque entre "${BEGIN}" y "${END}"`);
  }

  const block = rules.slice(start + BEGIN.length, end);
  const table: Record<string, string[]> = {};
  for (const [, role, list] of block.matchAll(/'(\w+)'\s*:\s*\[([^\]]*)\]/g)) {
    table[role] = [...list.matchAll(/'(\w+)'/g)].map(([, permission]) => permission);
  }
  return table;
}

describe('Role → Permissions mirror', () => {
  it('firestore.rules holds the same table as tienda/domain, in the same order', () => {
    expect(rulesRolePermissions()).toEqual(ROLE_PERMISSIONS);
  });
});
