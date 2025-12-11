/**
 * Mock TinyBase Persisters for testing
 */

export interface Persister {
  load(): Promise<void>;
  save(): Promise<void>;
  startAutoSave(): Promise<void>;
  stopAutoSave(): Promise<void>;
}

export const createCustomPersister = (
  store: any,
  getPersisted: () => Promise<any>,
  setPersisted: (getContent: () => any, changes?: any) => Promise<void>,
  addPersisterListener?: (listener: () => void) => any,
  delPersisterListener?: (watcher: any) => void,
  onIgnoredError?: (error: any) => void
): Persister => {
  let autoSaveInterval: NodeJS.Timeout | null = null;
  let hasLoaded = false;

  return {
    async load() {
      const persisted = await getPersisted();
      if (persisted) {
        const [tables, values] = persisted;

        // Load tables
        for (const [tableId, rows] of Object.entries(tables as Record<string, Record<string, any>>)) {
          for (const [rowId, row] of Object.entries(rows)) {
            store.setRow(tableId, rowId, row);
          }
        }

        // Load values
        for (const [valueId, value] of Object.entries(values as Record<string, any>)) {
          store.setValue(valueId, value);
        }
      }
      hasLoaded = true;
    },
    async save() {
      const tables = store.getTables();
      const values = store.getValues();
      await setPersisted(() => [tables, values], hasLoaded ? undefined : null);
    },
    async startAutoSave() {
      if (autoSaveInterval) return;
      autoSaveInterval = setInterval(async () => {
        const tables = store.getTables();
        const values = store.getValues();
        await setPersisted(() => [tables, values]);
      }, 2000);
    },
    async stopAutoSave() {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
      }
    },
  };
};
