import { createStore, type Store } from 'tinybase';
import { createFilePersister, type FilePersister } from 'tinybase/persisters/persister-file';
import path from 'path';
import fs from 'fs';

export interface TinyBaseConfig {
  dataDir: string;
}

export interface TinyBaseStoreInstance {
  store: Store;
  persister: FilePersister;
  save(): Promise<void>;
  destroy(): Promise<void>;
}

export async function createTinyBaseStore(
  tableName: string,
  config: TinyBaseConfig
): Promise<TinyBaseStoreInstance> {
  const filePath = path.join(config.dataDir, `${tableName}.json`);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const store = createStore();
  const persister = createFilePersister(store, filePath);

  await persister.load();
  await persister.startAutoSave();

  return {
    store,
    persister,
    async save() {
      await persister.save();
    },
    async destroy() {
      await persister.destroy();
    },
  };
}
