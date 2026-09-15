import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';
import { Subject } from 'rxjs';

jest.mock('@angular/fire/firestore', () => ({
  Firestore: class Firestore {},
  doc: jest.fn((_fs: unknown, ...path: string[]) => ({
    id: path[path.length - 1],
    path: path.join('/'),
  })),
  docData: jest.fn(),
}));

import { Firestore, docData } from '@angular/fire/firestore';
import { withWatchDocument } from './with-watch-document.feature';

type Product = { name: string };

const docDataMock = docData as jest.Mock;
const streams = new Map<string, Subject<unknown>>();

async function flush(): Promise<void> {
  TestBed.tick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  TestBed.tick();
}

describe('withWatchDocument', () => {
  beforeEach(() => {
    docDataMock.mockImplementation((ref: { path: string }) => {
      const stream = new Subject<unknown>();
      streams.set(ref.path, stream);
      return stream.asObservable();
    });
  });

  afterEach(() => {
    streams.clear();
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  function setup(
    params: Partial<
      Omit<
        Parameters<ReturnType<typeof withWatchDocument<Product>>>[0],
        'resourceName'
      >
    > = {}
  ) {
    const Store = signalStore(
      { providedIn: 'root' },
      withWatchDocument<Product>()({
        resourceName: 'product',
        documentPath: 'products/p1',
        ...params,
      })
    );

    TestBed.configureTestingModule({
      providers: [{ provide: Firestore, useValue: {} }],
    });

    return TestBed.inject(Store);
  }

  it('is loading with no value before the first emission', async () => {
    const store = setup();
    await flush();

    expect(store.product.isLoading()).toBe(true);
    expect(store.product.value()).toBeUndefined();
    expect(docDataMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'products/p1' }),
      { idField: 'id' }
    );
  });

  it('exposes the document with its id', async () => {
    const store = setup();
    await flush();

    streams.get('products/p1')?.next({ id: 'p1', name: 'Aretes' });
    await flush();

    expect(store.product.isLoading()).toBe(false);
    expect(store.product.value()).toEqual({ id: 'p1', name: 'Aretes' });
  });

  it('exposes null when the document does not exist', async () => {
    const store = setup();
    await flush();

    streams.get('products/p1')?.next(undefined);
    await flush();

    expect(store.product.value()).toBeNull();
  });

  it('exposes the stream error', async () => {
    const store = setup();
    await flush();

    const failure = new Error('permission-denied');
    streams.get('products/p1')?.error(failure);
    await flush();

    expect(store.product.error()).toBe(failure);
    expect(store.product.isLoading()).toBe(false);
  });

  it('resubscribes when the path changes and ignores the old document', async () => {
    const documentPath = signal<string | null>('products/p1');
    const store = setup({ documentPath });
    await flush();

    streams.get('products/p1')?.next({ id: 'p1', name: 'Aretes' });
    await flush();

    documentPath.set('products/p2');
    await flush();

    const oldStream = streams.get('products/p1');
    expect(oldStream?.observed).toBe(false);
    oldStream?.next({ id: 'p1', name: 'Viejo' });

    streams.get('products/p2')?.next({ id: 'p2', name: 'Collar' });
    await flush();

    expect(docDataMock).toHaveBeenCalledTimes(2);
    expect(store.product.value()).toEqual({ id: 'p2', name: 'Collar' });
  });

  it('does not subscribe while the path is null', async () => {
    const store = setup({ documentPath: signal<string | null>(null) });
    await flush();

    expect(docDataMock).not.toHaveBeenCalled();
    expect(store.product.value()).toBeUndefined();
    expect(store.product.isLoading()).toBe(false);
  });

  it('does not subscribe while disabled', async () => {
    const enabled = signal(false);
    const store = setup({ enabled });
    await flush();

    expect(docDataMock).not.toHaveBeenCalled();
    expect(store.product.value()).toBeUndefined();

    enabled.set(true);
    await flush();

    expect(docDataMock).toHaveBeenCalledTimes(1);
  });
});
