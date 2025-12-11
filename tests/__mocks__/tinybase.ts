/**
 * Mock TinyBase for testing
 */

export interface Store {
  setRow(tableId: string, rowId: string, row: any): void;
  getRow(tableId: string, rowId: string): any;
  delRow(tableId: string, rowId: string): void;
  setValue(valueId: string, value: any): void;
  getValue(valueId: string): any;
  getTables(): any;
  getValues(): any;
}

export const createStore = (): Store => {
  const tables: Record<string, Record<string, any>> = {};
  const values: Record<string, any> = {};

  return {
    setRow(tableId: string, rowId: string, row: any) {
      if (!tables[tableId]) {
        tables[tableId] = {};
      }
      tables[tableId][rowId] = row;
    },
    getRow(tableId: string, rowId: string) {
      return tables[tableId]?.[rowId];
    },
    delRow(tableId: string, rowId: string) {
      if (tables[tableId]) {
        delete tables[tableId][rowId];
      }
    },
    setValue(valueId: string, value: any) {
      values[valueId] = value;
    },
    getValue(valueId: string) {
      return values[valueId];
    },
    getTables() {
      return tables;
    },
    getValues() {
      return values;
    },
  };
};
