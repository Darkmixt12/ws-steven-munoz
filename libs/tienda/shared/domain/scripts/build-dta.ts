/**
 * Genera `data/dta-2026.json` a partir de `data/dta-2026.tsv` y comprueba que el catálogo cuadre.
 *
 * El TSV es la fuente que se revisa en el repo; el JSON es lo que importa la librería. Los dos se
 * commitean, así que después de tocar el TSV hay que correr esto y commitear el JSON regenerado.
 *
 *   nx run tienda-domain:build-dta
 *
 * Por decisión del #54 la librería no tiene costura de prueba para la DTA: la corrección del dato
 * se verifica aquí. Si falla cualquier comprobación el script sale con código 1 y no escribe nada.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const LIB_ROOT = join(__dirname, '..');
const TSV_PATH = join(LIB_ROOT, 'data', 'dta-2026.tsv');
const JSON_PATH = join(LIB_ROOT, 'data', 'dta-2026.json');

const DTA_VERSION = 'DTA-2026';

/** Conteos oficiales de la DTA-2026 del IGN. */
const EXPECTED_PROVINCES = 7;
const EXPECTED_CANTONS = 84;
const EXPECTED_DISTRICTS = 494;

/**
 * Los dos distritos nuevos de la DTA-2026 que el XLSX de Hacienda todavía no trae. Son la razón
 * de que el catálogo no se pueda tomar tal cual de Hacienda, así que se comprueban por nombre.
 */
const REQUIRED_DISTRICTS: ReadonlyArray<readonly [string, string]> = [
  ['50405', 'Pijije'],
  ['60310', 'Cabagra'],
];

interface District {
  code: string;
  provinceName: string;
  cantonName: string;
  districtName: string;
}

function parseTsv(text: string): District[] {
  const lines = text.split(/\r?\n/u).filter((line) => line.length > 0);
  const header = lines.shift();
  if (header !== 'codigo\tprovincia\tcanton\tdistrito') {
    throw new Error(`Cabecera inesperada en el TSV: ${String(header)}`);
  }

  return lines.map((line, index) => {
    const cells = line.split('\t');
    if (cells.length !== 4) {
      throw new Error(`La fila ${index + 2} tiene ${cells.length} columnas, no 4: ${line}`);
    }
    const [code, provinceName, cantonName, districtName] = cells as [string, string, string, string];
    if (code.trim() !== code || districtName.trim() !== districtName) {
      throw new Error(`La fila ${index + 2} tiene espacios de sobra: ${line}`);
    }
    return { code, provinceName, cantonName, districtName };
  });
}

function check(districts: readonly District[]): void {
  const problems: string[] = [];

  for (const district of districts) {
    if (!/^[0-9]{5}$/u.test(district.code)) {
      problems.push(`Código con formato inválido: ${district.code}`);
    }
    if (district.provinceName === '' || district.cantonName === '' || district.districtName === '') {
      problems.push(`Nombre vacío en ${district.code}`);
    }
  }

  const codes = new Set(districts.map((district) => district.code));
  if (codes.size !== districts.length) {
    problems.push(`Hay códigos repetidos: ${districts.length} filas, ${codes.size} códigos`);
  }

  if (districts.length !== EXPECTED_DISTRICTS) {
    problems.push(`Se esperaban ${EXPECTED_DISTRICTS} distritos y hay ${districts.length}`);
  }

  const provinces = new Map<string, string>();
  const cantons = new Map<string, string>();
  for (const district of districts) {
    const provinceCode = district.code.slice(0, 1);
    const cantonCode = district.code.slice(0, 3);

    const province = provinces.get(provinceCode);
    if (province === undefined) {
      provinces.set(provinceCode, district.provinceName);
    } else if (province !== district.provinceName) {
      problems.push(
        `La provincia ${provinceCode} se llama «${province}» y «${district.provinceName}»`,
      );
    }

    const canton = cantons.get(cantonCode);
    if (canton === undefined) {
      cantons.set(cantonCode, district.cantonName);
    } else if (canton !== district.cantonName) {
      problems.push(`El cantón ${cantonCode} se llama «${canton}» y «${district.cantonName}»`);
    }
  }

  if (provinces.size !== EXPECTED_PROVINCES) {
    problems.push(`Se esperaban ${EXPECTED_PROVINCES} provincias y hay ${provinces.size}`);
  }
  if (cantons.size !== EXPECTED_CANTONS) {
    problems.push(`Se esperaban ${EXPECTED_CANTONS} cantones y hay ${cantons.size}`);
  }

  for (const [code, name] of REQUIRED_DISTRICTS) {
    const district = districts.find((candidate) => candidate.code === code);
    if (district === undefined) {
      problems.push(`Falta el distrito ${code} (${name})`);
    } else if (district.districtName !== name) {
      problems.push(`El distrito ${code} debería ser «${name}» y es «${district.districtName}»`);
    }
  }

  const order = districts.map((district) => district.code);
  const sorted = [...order].sort();
  if (order.some((code, index) => code !== sorted[index])) {
    problems.push('El TSV no está ordenado por código');
  }

  if (problems.length > 0) {
    throw new Error(`El catálogo no cuadra:\n  - ${problems.join('\n  - ')}`);
  }
}

function main(): void {
  const districts = parseTsv(readFileSync(TSV_PATH, 'utf8'));
  check(districts);

  writeFileSync(JSON_PATH, `${JSON.stringify({ version: DTA_VERSION, districts }, null, 2)}\n`, 'utf8');

  const provinces = new Set(districts.map((district) => district.code.slice(0, 1)));
  const cantons = new Set(districts.map((district) => district.code.slice(0, 3)));
  console.log(
    `${DTA_VERSION}: ${provinces.size} provincias, ${cantons.size} cantones, ${districts.length} distritos`,
  );
  console.log(`Escrito ${JSON_PATH}`);
}

try {
  main();
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
