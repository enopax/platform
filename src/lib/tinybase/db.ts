/**
 * TinyBase Database Wrapper
 *
 * Provides a singleton database instance with pre-configured relationships and indexes.
 *
 * Features:
 * - Singleton pattern (single instance across the application)
 * - Auto-initialization on first access
 * - Pre-configured relationships (foreign keys)
 * - Pre-configured indexes (lookup fields)
 * - Auto-persister with file-per-record storage
 *
 * Usage:
 * ```typescript
 * const db = await getDB();
 * db.store.setRow('users', userId, {
 *   email: 'alice@example.com',
 *   name: 'Alice'
 * });
 * const user = db.store.getRow('users', userId);
 * ```
 */

import { createStore } from 'tinybase/store';
import { createIndexes } from 'tinybase/indexes';
import { createRelationships } from 'tinybase/relationships';
import type { Store } from 'tinybase/store';
import type { Indexes } from 'tinybase/indexes';
import type { Relationships } from 'tinybase/relationships';
import type { Persister } from 'tinybase/persisters';
import { createEnopaxPersister } from './persister';

/**
 * Database instance interface
 */
export interface Database {
  /** TinyBase store instance */
  store: Store;
  /** TinyBase indexes instance */
  indexes: Indexes;
  /** TinyBase relationships instance */
  relationships: Relationships;
  /** File persister instance */
  persister: Persister;
}

/**
 * Singleton database instance
 */
let dbInstance: Database | null = null;

/**
 * Get the singleton database instance
 *
 * @param dataPath - Base data directory path (defaults to /data)
 * @returns Database instance with store, indexes, relationships, and persister
 *
 * @example
 * ```typescript
 * const db = await getDB();
 *
 * // Use the store
 * db.store.setRow('users', 'user1', {
 *   email: 'alice@example.com',
 *   name: 'Alice'
 * });
 *
 * // Use indexes
 * const userId = db.indexes.getSliceRowIds('usersByEmail', 'alice@example.com')[0];
 *
 * // Use relationships
 * const teamIds = db.relationships.getRemoteRowIds('teamOrganisation', 'org1');
 * ```
 */
export const getDB = async (dataPath: string = '/data'): Promise<Database> => {
  // Return existing instance if already initialized
  if (dbInstance) {
    return dbInstance;
  }

  // Create store
  const store = createStore();

  // Create indexes
  const indexes = createIndexes(store);

  // Create relationships
  const relationships = createRelationships(store);

  // Configure indexes (field lookups)
  configureIndexes(indexes);

  // Configure relationships (foreign keys)
  configureRelationships(relationships);

  // Create and start persister
  const persister = createEnopaxPersister(store, dataPath);
  await persister.load();
  await persister.startAutoSave();

  // Store singleton instance
  dbInstance = {
    store,
    indexes,
    relationships,
    persister
  };

  return dbInstance;
};

/**
 * Reset the database instance (for testing)
 *
 * @internal
 */
export const resetDB = async (): Promise<void> => {
  if (dbInstance) {
    await dbInstance.persister.stopAutoSave();
    dbInstance = null;
  }
};

/**
 * Configure indexes for efficient field lookups
 *
 * Indexes enable fast lookups by field value:
 * - getSliceRowIds(indexId, sliceId) → rowId[]
 *
 * @param indexes - TinyBase indexes instance
 */
const configureIndexes = (indexes: Indexes): void => {
  // Users: lookup by email, name
  indexes.setIndexDefinition(
    'usersByEmail',
    'users',
    'email'
  );

  indexes.setIndexDefinition(
    'usersByName',
    'users',
    'name'
  );

  // Organisations: lookup by name, slug, owner
  indexes.setIndexDefinition(
    'organisationsByName',
    'organisations',
    'name'
  );

  indexes.setIndexDefinition(
    'organisationsBySlug',
    'organisations',
    'slug'
  );

  indexes.setIndexDefinition(
    'organisationsByOwner',
    'organisations',
    'ownerId'
  );

  // Teams: lookup by name, organisation
  indexes.setIndexDefinition(
    'teamsByName',
    'teams',
    'name'
  );

  indexes.setIndexDefinition(
    'teamsByOrganisation',
    'teams',
    'organisationId'
  );

  // Projects: lookup by name, slug, organisation
  indexes.setIndexDefinition(
    'projectsByName',
    'projects',
    'name'
  );

  indexes.setIndexDefinition(
    'projectsBySlug',
    'projects',
    'slug'
  );

  indexes.setIndexDefinition(
    'projectsByOrganisation',
    'projects',
    'organisationId'
  );

  // Resources: lookup by name, project, status
  indexes.setIndexDefinition(
    'resourcesByName',
    'resources',
    'name'
  );

  indexes.setIndexDefinition(
    'resourcesByProject',
    'resources',
    'projectId'
  );

  indexes.setIndexDefinition(
    'resourcesByStatus',
    'resources',
    'status'
  );

  // Memberships: lookup by user, organisation, team
  indexes.setIndexDefinition(
    'membershipsByUser',
    'memberships',
    'userId'
  );

  indexes.setIndexDefinition(
    'membershipsByOrganisation',
    'memberships',
    'organisationId'
  );

  indexes.setIndexDefinition(
    'membershipsByTeam',
    'memberships',
    'teamId'
  );

  // Files: lookup by name, organisation, project, uploader
  indexes.setIndexDefinition(
    'filesByName',
    'files',
    'name'
  );

  indexes.setIndexDefinition(
    'filesByOrganisation',
    'files',
    'organisationId'
  );

  indexes.setIndexDefinition(
    'filesByProject',
    'files',
    'projectId'
  );

  indexes.setIndexDefinition(
    'filesByUploader',
    'files',
    'uploadedById'
  );

  // Accounts (OAuth): lookup by user, provider
  indexes.setIndexDefinition(
    'accountsByUser',
    'accounts',
    'userId'
  );

  indexes.setIndexDefinition(
    'accountsByProvider',
    'accounts',
    'provider'
  );

  indexes.setIndexDefinition(
    'accountsByProviderAccountId',
    'accounts',
    'providerAccountId'
  );

  // Sessions: lookup by user, session token
  indexes.setIndexDefinition(
    'sessionsByUser',
    'sessions',
    'userId'
  );

  indexes.setIndexDefinition(
    'sessionsByToken',
    'sessions',
    'sessionToken'
  );

  // Verification tokens: lookup by identifier, token
  indexes.setIndexDefinition(
    'verificationTokensByIdentifier',
    'verificationTokens',
    'identifier'
  );

  indexes.setIndexDefinition(
    'verificationTokensByToken',
    'verificationTokens',
    'token'
  );
};

/**
 * Configure relationships for foreign key navigation
 *
 * Relationships enable navigation between related records:
 * - getLocalRowIds(relationshipId, remoteRowId) → localRowId[]
 * - getRemoteRowId(relationshipId, localRowId) → remoteRowId
 *
 * @param relationships - TinyBase relationships instance
 */
const configureRelationships = (relationships: Relationships): void => {
  // Organisation relationships
  relationships.setRelationshipDefinition(
    'organisationOwner',      // Relationship ID
    'organisations',          // Local table
    'users',                  // Remote table
    'ownerId'                 // Local field (foreign key)
  );

  // Team relationships
  relationships.setRelationshipDefinition(
    'teamOrganisation',
    'teams',
    'organisations',
    'organisationId'
  );

  // Project relationships
  relationships.setRelationshipDefinition(
    'projectOrganisation',
    'projects',
    'organisations',
    'organisationId'
  );

  // Resource relationships
  relationships.setRelationshipDefinition(
    'resourceProject',
    'resources',
    'projects',
    'projectId'
  );

  // Membership relationships
  relationships.setRelationshipDefinition(
    'membershipUser',
    'memberships',
    'users',
    'userId'
  );

  relationships.setRelationshipDefinition(
    'membershipOrganisation',
    'memberships',
    'organisations',
    'organisationId'
  );

  relationships.setRelationshipDefinition(
    'membershipTeam',
    'memberships',
    'teams',
    'teamId'
  );

  // File relationships
  relationships.setRelationshipDefinition(
    'fileOrganisation',
    'files',
    'organisations',
    'organisationId'
  );

  relationships.setRelationshipDefinition(
    'fileProject',
    'files',
    'projects',
    'projectId'
  );

  relationships.setRelationshipDefinition(
    'fileUploader',
    'files',
    'users',
    'uploadedById'
  );

  // Account relationships (OAuth)
  relationships.setRelationshipDefinition(
    'accountUser',
    'accounts',
    'users',
    'userId'
  );

  // Session relationships
  relationships.setRelationshipDefinition(
    'sessionUser',
    'sessions',
    'users',
    'userId'
  );
};
