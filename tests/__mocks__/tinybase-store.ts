/**
 * Mock for tinybase/store module
 */

export interface Store {
  getTables: () => Record<string, Record<string, any>>;
  getValues: () => Record<string, any>;
  getRow: (tableId: string, rowId: string) => any;
  setRow: (tableId: string, rowId: string, row: any) => Store;
  delRow: (tableId: string, rowId: string) => Store;
  getTableIds: () => string[];
  getRowIds: (tableId: string) => string[];
}

export const createStore = (): Store => {
  const tables: Record<string, Record<string, any>> = {};
  const values: Record<string, any> = {};

  return {
    getTables: () => tables,

    getValues: () => values,

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
    },

    getTableIds: () => {
      return Object.keys(tables);
    },

    getRowIds: (tableId: string) => {
      return Object.keys(tables[tableId] || {});
    }
  };
};
