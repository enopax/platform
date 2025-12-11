/**
 * Mock for tinybase/indexes module
 */

import type { Store } from './tinybase-store';

export interface Indexes {
  setIndexDefinition: (indexId: string, tableId: string, cellId: string) => Indexes;
  getSliceRowIds: (indexId: string, sliceId: string | number) => string[];
}

export const createIndexes = (store: Store): Indexes => {
  const indexDefinitions: Record<string, { tableId: string; cellId: string }> = {};

  return {
    setIndexDefinition: (indexId: string, tableId: string, cellId: string) => {
      indexDefinitions[indexId] = { tableId, cellId };
      return this as any;
    },

    getSliceRowIds: (indexId: string, sliceId: string | number) => {
      const def = indexDefinitions[indexId];
      if (!def) return [];

      const rowIds: string[] = [];
      const tables = store.getTables();
      const table = tables[def.tableId] || {};

      for (const [rowId, row] of Object.entries(table)) {
        if (row[def.cellId] === sliceId) {
          rowIds.push(rowId);
        }
      }

      return rowIds;
    }
  };
};
