import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteObject,
  getBytes,
  ref,
  uploadBytes,
  type FirebaseStorage,
} from 'firebase/storage';
import {
  hasPermission,
  productImagePath,
  productImagePaths,
  productThumbnailPath,
  THUMBNAIL_SIZES,
} from 'tienda/domain';
import * as fixtures from './fixtures';
import {
  activeEmployeePersonas,
  asActiveEmployee,
  asAnonymous,
  asCustomer,
  asCustomerEmployee,
  blockedEmployeePersonas,
  createTestEnv,
  EMPLOYEE_UIDS,
  publicPersonas,
  seed,
  storageOf,
} from './harness';

// Imágenes de Producto en Storage (#62). Las expectativas por Rol salen de `hasPermission`;
// los criterios del ticket van fijados a mano más abajo.

const PRODUCT_ID = 'published';

/** Imagen con sus tres archivos ya subidos: sirve para leer y para intentar sobrescribir. */
const EXISTING_IMAGE_ID = 'img-1';

/** Archivo fuera de la galería, para comprobar que el resto del bucket sigue cerrado. */
const OUTSIDE_PATH = 'invoices/inv-1.pdf';

const WEBP = 'image/webp';
const FIVE_MB = 5 * 1024 * 1024;

const expectation = (allowed: boolean) => (allowed ? assertSucceeds : assertFails);

/**
 * `imageId` que no existe todavía. Cada intento estrena ruta porque `clearStorage()` del
 * arnés solo borra los archivos de la raíz del bucket: hace `listAll()` sobre `ref()` y no
 * baja por los `prefixes`, así que lo que está bajo `products/` sobrevive a la prueba. Si
 * dos pruebas compartieran ruta, la segunda fallaría por `resource != null` y no por el
 * Permiso, y una negación quedaría pasando por la razón equivocada.
 */
let uploads = 0;
function freshImageId(): string {
  uploads += 1;
  return `new-${uploads}`;
}

/** Relleno: las reglas miran el tipo y el tamaño, nunca el contenido. */
function upload(
  storage: FirebaseStorage,
  path: string,
  { contentType = WEBP, size = 8 } = {},
): Promise<unknown> {
  return uploadBytes(ref(storage, path), new Uint8Array(size), { contentType });
}

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const storage = storageOf(context);
    for (const path of productImagePaths(PRODUCT_ID, EXISTING_IMAGE_ID)) {
      await upload(storage, path);
    }
    await upload(storage, OUTSIDE_PATH, { contentType: 'application/pdf' });
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe.each(publicPersonas)('the product gallery as %s', (_name, persona) => {
  it('reads the original and every thumbnail, without a token', async () => {
    const storage = storageOf(await persona(env));

    for (const path of productImagePaths(PRODUCT_ID, EXISTING_IMAGE_ID)) {
      await assertSucceeds(getBytes(ref(storage, path)));
    }
  });
});

describe.each(activeEmployeePersonas)('uploads as an active %s', (role, persona) => {
  const allowed = hasPermission(role, 'editProducts');
  const verb = allowed ? 'uploads' : 'cannot upload';
  let storage: FirebaseStorage;

  beforeEach(async () => {
    storage = storageOf(await persona(env));
  });

  const files = [
    ['the original', (imageId: string) => productImagePath(PRODUCT_ID, imageId)],
    ...THUMBNAIL_SIZES.map(
      (size) =>
        [
          `the ${size} px thumbnail`,
          (imageId: string) => productThumbnailPath(PRODUCT_ID, imageId, size),
        ] as const,
    ),
  ] as const;

  it.each(files)(`${verb} %s (editProducts)`, async (_title, pathOf) => {
    await expectation(allowed)(upload(storage, pathOf(freshImageId())));
  });
});

describe('accounts that never upload', () => {
  const personas = [
    ...blockedEmployeePersonas,
    ['anonymous', asAnonymous],
    ['customer', asCustomer],
    ['an account that is both customer and operator', asCustomerEmployee],
  ] as const;

  it.each(personas)('denies the upload to %s', async (_name, persona) => {
    const storage = storageOf(await persona(env));

    await assertFails(upload(storage, productImagePath(PRODUCT_ID, freshImageId())));
  });
});

// Criterios de #62 fijados a mano: los casos de arriba salen de la tabla de Permisos,
// así que un cambio en la tabla los movería sin fallar; estos no.
describe('the file that arrives, as an employee who can edit products', () => {
  let storage: FirebaseStorage;

  beforeEach(async () => {
    storage = storageOf(await asActiveEmployee('catalogEditor')(env));
  });

  it.each(['image/jpeg', 'image/png', WEBP])('accepts %s', async (contentType) => {
    await assertSucceeds(
      upload(storage, productImagePath(PRODUCT_ID, freshImageId()), { contentType }),
    );
  });

  it.each(['image/gif', 'image/svg+xml', 'application/pdf', 'text/html'])(
    'rejects %s',
    async (contentType) => {
      await assertFails(
        upload(storage, productImagePath(PRODUCT_ID, freshImageId()), { contentType }),
      );
    },
  );

  it('accepts a file of exactly 5 MB and rejects one over that', async () => {
    await assertSucceeds(
      upload(storage, productImagePath(PRODUCT_ID, freshImageId()), { size: FIVE_MB }),
    );
    await assertFails(
      upload(storage, productImagePath(PRODUCT_ID, freshImageId()), { size: FIVE_MB + 1 }),
    );
  });

  it.each(productImagePaths(PRODUCT_ID, EXISTING_IMAGE_ID))(
    'never overwrites %s',
    async (path) => {
      await assertFails(upload(storage, path));
    },
  );

  it.each(productImagePaths(PRODUCT_ID, EXISTING_IMAGE_ID))(
    'never deletes %s',
    async (path) => {
      await assertFails(deleteObject(ref(storage, path)));
    },
  );

  it('keeps the rest of the bucket closed', async () => {
    await assertFails(upload(storage, 'invoices/inv-2.pdf', { contentType: 'application/pdf' }));
    await assertFails(getBytes(ref(storage, OUTSIDE_PATH)));
  });
});

describe('immediate cut', () => {
  it('rejects the next upload with the same token once the employee is disabled', async () => {
    const uid = EMPLOYEE_UIDS.catalogEditor;
    const storage = storageOf(await asActiveEmployee('catalogEditor')(env));
    await assertSucceeds(upload(storage, productImagePath(PRODUCT_ID, freshImageId())));

    await seed(env, {
      [`employees/${uid}`]: fixtures.employee('catalogEditor', 'disabled'),
    });

    await assertFails(upload(storage, productImagePath(PRODUCT_ID, freshImageId())));
  });
});
