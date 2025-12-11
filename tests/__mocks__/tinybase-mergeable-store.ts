/**
 * Mock for tinybase/mergeable-store module
 */

export interface MergeableStore {
  // Same as Store for now
  getTables: () => Record<string, Record<string, any>>;
  getRow: (tableId: string, rowId: string) => any;
  setRow: (tableId: string, rowId: string, row: any) => MergeableStore;
  delRow: (tableId: string, rowId: string) => MergeableStore;
}

export const createMergeableStore = (): MergeableStore => {
  const tables: Record<string, Record<string, any>> = {};

  return {
    getTables: () => tables,

    getRow: (tableId: string, rowId: string) => {
      return tables[tableId]?.[rowId];
    },

    setRow: (tableId: string, rowId: string, row: any) => {
      if (!tables[tableId]) {
        tables[tableId] = {};
      }
      tables[tableId][rowId] = row;
      return this as any;
    },

    delRow: (tableId: string, rowId: string) => {
      if (tables[tableId]) {
        delete tables[tableId][rowId];
      }
      return this as any;
    }
  };
};
