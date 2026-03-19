import type { IApiKeyRepository } from './repositories/api-key.repository';
import { createStore } from 'tinybase';
import { createFilePersister } from 'tinybase/persisters/persister-file';
import { TinyBaseApiKeyRepository } from './tinybase/api-key.tinybase';
import path from 'path';
import fs from 'fs';

export interface DataStore {
  apiKeys: IApiKeyRepository;
  destroy(): Promise<void>;
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

let _store: DataStore | null = null;
let _initPromise: Promise<DataStore> | null = null;

async function createDataStore(): Promise<DataStore> {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const filePath = path.join(DATA_DIR, 'api-keys.json');
  const tinyStore = createStore();
  const persister = createFilePersister(tinyStore, filePath);

  await persister.load();
  await persister.startAutoSave();

  return {
    apiKeys: new TinyBaseApiKeyRepository(tinyStore),
    async destroy() {
      await persister.destroy();
    },
  };
}

export async function getStoreAsync(): Promise<DataStore> {
  if (_store) return _store;
  if (!_initPromise) {
    _initPromise = createDataStore().then((store) => {
      _store = store;
      _initPromise = null;
      return store;
    });
  }
  return _initPromise;
}

export function getStore(): DataStore {
  if (!_store) {
    throw new Error(
      'DataStore not initialised. Call await getStoreAsync() first, or use getStoreAsync() directly.'
    );
  }
  return _store;
}

export function setStore(store: DataStore): void {
  _store = store;
}

export function resetStore(): void {
  _store = null;
  _initPromise = null;
}
