/**
 * Mock for tinybase/relationships module
 */

import type { Store } from './tinybase-store';

export interface Relationships {
  setRelationshipDefinition: (
    relationshipId: string,
    localTableId: string,
    remoteTableId: string,
    localCellId: string
  ) => Relationships;
  getRemoteRowId: (relationshipId: string, localRowId: string) => string | undefined;
  getLocalRowIds: (relationshipId: string, remoteRowId: string) => string[];
}

export const createRelationships = (store: Store): Relationships => {
  const relationshipDefinitions: Record<string, {
    localTableId: string;
    remoteTableId: string;
    localCellId: string;
  }> = {};

  return {
    setRelationshipDefinition: (
      relationshipId: string,
      localTableId: string,
      remoteTableId: string,
      localCellId: string
    ) => {
      relationshipDefinitions[relationshipId] = {
        localTableId,
        remoteTableId,
        localCellId
      };
      return this as any;
    },

    getRemoteRowId: (relationshipId: string, localRowId: string) => {
      const def = relationshipDefinitions[relationshipId];
      if (!def) return undefined;

      const localRow = store.getRow(def.localTableId, localRowId);
      return localRow?.[def.localCellId];
    },

    getLocalRowIds: (relationshipId: string, remoteRowId: string) => {
      const def = relationshipDefinitions[relationshipId];
      if (!def) return [];

      const localRowIds: string[] = [];
      const tables = store.getTables();
      const localTable = tables[def.localTableId] || {};

      for (const [rowId, row] of Object.entries(localTable)) {
        if (row[def.localCellId] === remoteRowId) {
          localRowIds.push(rowId);
        }
      }

      return localRowIds;
    }
  };
};
