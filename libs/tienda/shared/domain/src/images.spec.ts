import {
  productImagePath,
  productImagePaths,
  productThumbnailPath,
  THUMBNAIL_SIZES,
} from './images';

describe('THUMBNAIL_SIZES', () => {
  it('is 400 and 800, in order', () => {
    expect(THUMBNAIL_SIZES).toEqual([400, 800]);
  });
});

describe('productImagePath', () => {
  it('derives the original from the product and the image', () => {
    expect(productImagePath('p-1', 'img-1')).toBe('products/p-1/img-1.webp');
  });
});

describe('productThumbnailPath', () => {
  it.each([...THUMBNAIL_SIZES])('derives the %s px thumbnail', (size) => {
    expect(productThumbnailPath('p-1', 'img-1', size)).toBe(
      `products/p-1/thumbs/img-1_${size}x${size}.webp`,
    );
  });

  it('keeps every size of the same image apart, so none overwrites another', () => {
    const paths = THUMBNAIL_SIZES.map((size) =>
      productThumbnailPath('p-1', 'img-1', size),
    );

    expect(new Set(paths).size).toBe(THUMBNAIL_SIZES.length);
  });
});

describe('productImagePaths', () => {
  it('lists the three files of an image, the original first', () => {
    expect(productImagePaths('p-1', 'img-1')).toEqual([
      'products/p-1/img-1.webp',
      'products/p-1/thumbs/img-1_400x400.webp',
      'products/p-1/thumbs/img-1_800x800.webp',
    ]);
  });

  it('has one path per thumbnail size, plus the original', () => {
    expect(productImagePaths('p-1', 'img-1')).toHaveLength(THUMBNAIL_SIZES.length + 1);
  });

  it('keeps the files of two images of the same product apart', () => {
    const first = productImagePaths('p-1', 'img-1');
    const second = productImagePaths('p-1', 'img-2');

    expect(new Set([...first, ...second]).size).toBe(first.length + second.length);
  });
});
