/**
 * Fija el catálogo territorial contra el §5.2 del Modelo de datos y el #66: los conteos de la
 * DTA-2026 y los distritos que ninguna fuente publicada trae junta (ver el ADR 0009).
 *
 * La comprobación que manda es la de `scripts/build-dta.ts`, que corre al generar el JSON. Esta
 * prueba cubre lo que el script no puede ver: que el JSON generado sea el que la librería expone.
 */
import * as catalog from '../data/dta-2026.json';
import { DISTRICTS, DTA_VERSION, findDistrict } from './territory';

describe('DTA_VERSION', () => {
  it('is DTA-2026, the same version the generated json declares', () => {
    expect(DTA_VERSION).toBe('DTA-2026');
    expect(catalog.version).toBe(DTA_VERSION);
  });
});

describe('DISTRICTS', () => {
  it('has 7 provinces, 84 cantons and 494 districts', () => {
    const provinces = new Set(DISTRICTS.map((district) => district.code.slice(0, 1)));
    const cantons = new Set(DISTRICTS.map((district) => district.code.slice(0, 3)));

    expect(provinces.size).toBe(7);
    expect(cantons.size).toBe(84);
    expect(DISTRICTS).toHaveLength(494);
  });

  it('uses five digit codes, unique and sorted', () => {
    const codes = DISTRICTS.map((district) => district.code);

    expect(codes.every((code) => /^[0-9]{5}$/u.test(code))).toBe(true);
    expect(new Set(codes).size).toBe(codes.length);
    expect([...codes].sort()).toEqual(codes);
  });

  it('names the province and the canton the same way in every district of a code', () => {
    const cantons = new Map(
      DISTRICTS.map((district) => [
        district.code.slice(0, 3),
        `${district.provinceName}/${district.cantonName}`,
      ]),
    );

    for (const district of DISTRICTS) {
      expect(cantons.get(district.code.slice(0, 3))).toBe(
        `${district.provinceName}/${district.cantonName}`,
      );
    }
  });
});

describe('findDistrict', () => {
  it('finds Pijije and Cabagra, which the Hacienda spreadsheet does not have', () => {
    expect(findDistrict('50405')).toEqual({
      code: '50405',
      provinceName: 'Guanacaste',
      cantonName: 'Bagaces',
      districtName: 'Pijije',
    });
    expect(findDistrict('60310')).toEqual({
      code: '60310',
      provinceName: 'Puntarenas',
      cantonName: 'Buenos Aires',
      districtName: 'Cabagra',
    });
  });

  it('finds Duacarí, which only the Hacienda spreadsheet has', () => {
    expect(findDistrict('70605')).toEqual({
      code: '70605',
      provinceName: 'Limón',
      cantonName: 'Guácimo',
      districtName: 'Duacarí',
    });
  });

  it('numbers Grecia like the IGN, which left 20306 empty', () => {
    expect(findDistrict('20306')).toBeNull();
    expect(findDistrict('20307')?.districtName).toBe('Puente de Piedra');
    expect(findDistrict('20308')?.districtName).toBe('Bolívar');
  });

  it('returns null for a code outside the catalogue', () => {
    expect(findDistrict('99999')).toBeNull();
    expect(findDistrict('')).toBeNull();
  });
});
