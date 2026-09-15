import { toPathArgs } from './firestore-path';

describe('toPathArgs', () => {
  it('splits a subcollection path into its segments', () => {
    expect(toPathArgs('products/p1/variants')).toEqual([
      'products',
      'p1',
      'variants',
    ]);
  });

  it('ignores leading, trailing and repeated slashes', () => {
    expect(toPathArgs('/settings//storefront/')).toEqual([
      'settings',
      'storefront',
    ]);
  });

  it('throws on an empty path', () => {
    expect(() => toPathArgs('')).toThrow('Invalid Firestore path: ""');
    expect(() => toPathArgs('//')).toThrow('Invalid Firestore path: "//"');
  });
});
