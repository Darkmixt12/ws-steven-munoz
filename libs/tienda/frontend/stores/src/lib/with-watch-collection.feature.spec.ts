import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';
import { of } from 'rxjs';

jest.mock('@angular/fire/firestore', () => ({
  Firestore: class Firestore {},
  collection: jest.fn((_fs: unknown, ...path: string[]) => ({
    kind: 'collection',
    path: path.join('/'),
  })),
  query: jest.fn((col: { path: string }, ...constraints: unknown[]) => ({
    kind: 'query',
    path: col.path,
    constraints,
  })),
  collectionData: jest.fn(),
}));

import {
  Firestore,
  collection,
  collectionData,
  query,
  type QueryConstraint,
} from '@angular/fire/firestore';
import type { WithId } from './types';
import { withWatchCollection } from './with-watch-collection.feature';

type Category = { name: string };

const collectionDataMock = collectionData as jest.Mock;

async function flush(): Promise<void> {
  TestBed.tick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  TestBed.tick();
}

describe('withWatchCollection', () => {
  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  function setup(
    params: Partial<
      Omit<
        Parameters<ReturnType<typeof withWatchCollection<Category>>>[0],
        'resourceName'
      >
    > = {}
  ) {
    const Store = signalStore(
      { providedIn: 'root' },
      withWatchCollection<Category>()({
        resourceName: 'categories',
        collectionToWatchPath: 'categories',
        defaultValue: [],
        ...params,
      })
    );

    TestBed.configureTestingModule({
      providers: [{ provide: Firestore, useValue: {} }],
    });

    return TestBed.inject(Store);
  }

  it('exposes the documents with their id', async () => {
    const docs: WithId<Category>[] = [
      { id: 'c1', name: 'Aretes' },
      { id: 'c2', name: 'Collares' },
    ];
    collectionDataMock.mockReturnValue(of(docs));

    const store = setup();
    await flush();

    expect(store.categories.value()).toEqual(docs);
    expect(collectionDataMock).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'query', path: 'categories' }),
      { idField: 'id' }
    );
  });

  it('applies the constraints and accepts a subcollection path', async () => {
    collectionDataMock.mockReturnValue(of([]));
    const constraint = { type: 'where' } as unknown as QueryConstraint;

    setup({
      collectionToWatchPath: signal('products/p1/variants'),
      constraints: [constraint],
    });
    await flush();

    expect(collection).toHaveBeenCalledWith(
      expect.anything(),
      'products',
      'p1',
      'variants'
    );
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'products/p1/variants' }),
      constraint
    );
  });

  it('returns the default value without subscribing when disabled', async () => {
    const defaultValue: WithId<Category>[] = [{ id: 'x', name: 'Por defecto' }];

    const store = setup({ enabled: false, defaultValue });
    await flush();

    expect(store.categories.value()).toEqual(defaultValue);
    expect(collectionDataMock).not.toHaveBeenCalled();
  });
});
