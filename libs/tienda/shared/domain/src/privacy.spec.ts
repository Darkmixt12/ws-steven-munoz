import { createHash } from 'node:crypto';
import { privacyNoticeHash } from './privacy';

// El algoritmo lo fija la §5.7 del Modelo de datos: SHA-256 del texto en UTF-8, hexadecimal
// minúscula. Se contrasta contra `node:crypto`, que la librería no puede usar.

const sha256 = (text: string): string =>
  createHash('sha256').update(text, 'utf8').digest('hex');

describe('privacyNoticeHash', () => {
  it('is the sha-256 of the text in lowercase hexadecimal', async () => {
    expect(await privacyNoticeHash('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('is 64 hexadecimal characters', async () => {
    expect(await privacyNoticeHash('Aviso de privacidad')).toMatch(/^[0-9a-f]{64}$/u);
  });

  it.each([
    ['empty text', ''],
    ['text with accents and eñes', 'Protección de datos personales: la Tienda y su Cliente'],
    ['text with line breaks', '# Aviso\n\nPrimera línea.\n\nSegunda línea.\n'],
    ['long text', 'Aviso de privacidad. '.repeat(1_000)],
  ])('matches node:crypto for %s', async (_title, text) => {
    expect(await privacyNoticeHash(text)).toBe(sha256(text));
  });

  it('changes when a single character changes', async () => {
    const [one, other] = await Promise.all([
      privacyNoticeHash('Aviso de privacidad'),
      privacyNoticeHash('Aviso de privacidad.'),
    ]);
    expect(one).not.toBe(other);
  });

  it('is stable across calls', async () => {
    const text = 'La misma versión del Aviso siempre da la misma huella.';
    const [one, other] = await Promise.all([
      privacyNoticeHash(text),
      privacyNoticeHash(text),
    ]);
    expect(one).toBe(other);
  });
});
