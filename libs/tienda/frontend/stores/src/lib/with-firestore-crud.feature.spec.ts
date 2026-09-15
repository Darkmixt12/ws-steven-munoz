import { TestBed } from '@angular/core/testing';
import { signalStore, withMethods } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

jest.mock('@angular/fire/firestore', () => {
  let nextGeneratedId = 0;

  return {
    Firestore: class Firestore {},
    collection: jest.fn((_fs: unknown, ...path: string[]) => ({
      id: path[path.length - 1] ?? '',
      kind: 'collection',
      path: path.join('/'),
    })),
    doc: jest.fn((first: unknown, ...path: string[]) => {
      if (
        !path.length &&
        first &&
        typeof first === 'object' &&
        'path' in first
      ) {
        nextGeneratedId += 1;
        return {
          id: `generated-${nextGeneratedId}`,
          kind: 'doc',
          path: `${
            (first as { path: string }).path
          }/generated-${nextGeneratedId}`,
        };
      }

      return {
        id: path[path.length - 1] ?? '',
        kind: 'doc',
        path: path.join('/'),
      };
    }),
    getDoc: jest.fn(),
    runTransaction: jest.fn(),
    serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
    setDoc: jest.fn(() => Promise.resolve()),
    updateDoc: jest.fn(() => Promise.resolve()),
    writeBatch: jest.fn(),
  };
});

jest.mock('@angular/fire/auth', () => ({
  Auth: class Auth {},
}));

import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { withFirestoreCrud } from './with-firestore-crud.feature';

const stamps = {
  updatedAt: 'SERVER_TIMESTAMP',
  updatedBy: 'uid-1',
};

describe('withFirestoreCrud', () => {
  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  // Los métodos `_` son privados en los tipos de @ngrx/signals: se prueban
  // desde un feature que los compone, como los usará cada store.
  function setup(currentUser: { uid: string } | null = { uid: 'uid-1' }) {
    const CrudStore = signalStore(
      { providedIn: 'root' },
      withFirestoreCrud(),
      withMethods((store) => ({
        create: store._create,
        set: store._set,
        update: store._update,
        get: store._get,
        hasRemove: () => '_remove' in store,
      }))
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: Firestore, useValue: {} },
        { provide: Auth, useValue: { currentUser } },
      ],
    });

    return TestBed.inject(CrudStore);
  }

  function expectNoAuditOrBatch(): void {
    expect(writeBatch).not.toHaveBeenCalled();
    expect(runTransaction).not.toHaveBeenCalled();
    const paths = [
      ...(collection as jest.Mock).mock.calls.map((call) => call.slice(1)),
      ...(doc as jest.Mock).mock.calls.map((call) => call.slice(1)),
    ].flat();
    expect(paths).not.toContain('auditEvents');
  }

  it('creates a document in a subcollection with an auto id and all three stamps', async () => {
    const store = setup();

    const ref = await firstValueFrom(
      store.create({
        collectionPath: 'products/p1/variants',
        data: { name: 'Plata', stock: 3 },
      })
    );

    expect(ref.id).toBe('generated-1');
    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'products/p1/variants/generated-1' }),
      {
        name: 'Plata',
        stock: 3,
        createdAt: 'SERVER_TIMESTAMP',
        ...stamps,
      }
    );
    expectNoAuditOrBatch();
  });

  it('sets a document stamping only updatedAt and updatedBy', async () => {
    const store = setup();

    await firstValueFrom(
      store.set({
        collectionPath: 'settings',
        id: 'storefront',
        data: { whatsapp: '88888888' },
        merge: true,
      })
    );

    expect(setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'settings/storefront' }),
      { whatsapp: '88888888', ...stamps },
      { merge: true }
    );
    expectNoAuditOrBatch();
  });

  it('sets without merge by default', async () => {
    const store = setup();

    await firstValueFrom(
      store.set({ collectionPath: 'tags', id: 't1', data: { name: 'Nuevo' } })
    );

    expect(setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'tags/t1' }),
      { name: 'Nuevo', ...stamps },
      { merge: false }
    );
  });

  it('updates a document stamping only updatedAt and updatedBy', async () => {
    const store = setup();

    await firstValueFrom(
      store.update({
        collectionPath: 'products/p1/variants',
        id: 'v1',
        data: { stock: 5 },
      })
    );

    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'products/p1/variants/v1' }),
      { stock: 5, ...stamps }
    );
    expectNoAuditOrBatch();
  });

  it('overwrites stamps forged by the caller', async () => {
    const store = setup();

    await firstValueFrom(
      store.update({
        collectionPath: 'products',
        id: 'p1',
        data: { name: 'Aretes', updatedBy: 'someone-else', updatedAt: 'ayer' },
      })
    );

    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
      name: 'Aretes',
      ...stamps,
    });
  });

  it('does not expose a remove method', () => {
    const store = setup();

    expect(store.hasRemove()).toBe(false);
  });

  it('errors without writing when there is no signed-in user', async () => {
    const store = setup(null);

    await expect(
      firstValueFrom(
        store.create({ collectionPath: 'products', data: { name: 'Aretes' } })
      )
    ).rejects.toThrow();
    await expect(
      firstValueFrom(
        store.set({ collectionPath: 'tags', id: 't1', data: { name: 'x' } })
      )
    ).rejects.toThrow();
    await expect(
      firstValueFrom(
        store.update({ collectionPath: 'tags', id: 't1', data: { name: 'x' } })
      )
    ).rejects.toThrow();

    expect(setDoc).not.toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('gets an existing document with its id', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      id: 'p1',
      data: () => ({ name: 'Aretes' }),
    });
    const store = setup();

    const result = await firstValueFrom(
      store.get<{ name: string }>({ collectionPath: 'products', id: 'p1' })
    );

    expect(getDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'products/p1' })
    );
    expect(result).toEqual({ id: 'p1', name: 'Aretes' });
  });

  it('gets undefined for a missing document', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => false,
      id: 'p9',
      data: () => undefined,
    });
    const store = setup();

    const result = await firstValueFrom(
      store.get({ collectionPath: 'products', id: 'p9' })
    );

    expect(result).toBeUndefined();
  });
});
