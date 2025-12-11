/**
 * TinyBase Database Wrapper Tests
 *
 * Tests the singleton database instance with relationships and indexes.
 */

import { getDB, resetDB } from '../db';
import { rm, mkdir } from 'fs/promises';
import { join } from 'path';

const TEST_DATA_PATH = join(__dirname, 'test-db-data');

describe('TinyBase Database Wrapper', () => {
  beforeEach(async () => {
    // Clean up test data directory
    await rm(TEST_DATA_PATH, { recursive: true, force: true });
    await mkdir(TEST_DATA_PATH, { recursive: true });

    // Reset singleton
    await resetDB();
  });

  afterEach(async () => {
    // Clean up
    await resetDB();
    await rm(TEST_DATA_PATH, { recursive: true, force: true });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', async () => {
      const db1 = await getDB(TEST_DATA_PATH);
      const db2 = await getDB(TEST_DATA_PATH);

      expect(db1).toBe(db2);
      expect(db1.store).toBe(db2.store);
      expect(db1.indexes).toBe(db2.indexes);
      expect(db1.relationships).toBe(db2.relationships);
      expect(db1.persister).toBe(db2.persister);
    });

    it('should return database instance with all components', async () => {
      const db = await getDB(TEST_DATA_PATH);

      expect(db).toBeDefined();
      expect(db.store).toBeDefined();
      expect(db.indexes).toBeDefined();
      expect(db.relationships).toBeDefined();
      expect(db.persister).toBeDefined();
    });
  });

  describe('Store Operations', () => {
    it('should store and retrieve a user record', async () => {
      const db = await getDB(TEST_DATA_PATH);

      db.store.setRow('users', 'user1', {
        email: 'alice@example.com',
        name: 'Alice'
      });

      const user = db.store.getRow('users', 'user1');

      expect(user).toEqual({
        email: 'alice@example.com',
        name: 'Alice'
      });
    });

    it('should store and retrieve multiple records', async () => {
      const db = await getDB(TEST_DATA_PATH);

      db.store.setRow('users', 'user1', { email: 'alice@example.com', name: 'Alice' });
      db.store.setRow('users', 'user2', { email: 'bob@example.com', name: 'Bob' });
      db.store.setRow('organisations', 'org1', { name: 'Acme Corp', slug: 'acme', ownerId: 'user1' });

      expect(db.store.getRow('users', 'user1')).toEqual({ email: 'alice@example.com', name: 'Alice' });
      expect(db.store.getRow('users', 'user2')).toEqual({ email: 'bob@example.com', name: 'Bob' });
      expect(db.store.getRow('organisations', 'org1')).toEqual({ name: 'Acme Corp', slug: 'acme', ownerId: 'user1' });
    });
  });

  describe('Index Lookups', () => {
    it('should find user by email using index', async () => {
      const db = await getDB(TEST_DATA_PATH);

      db.store.setRow('users', 'user1', {
        email: 'alice@example.com',
        name: 'Alice'
      });

      const userIds = db.indexes.getSliceRowIds('usersByEmail', 'alice@example.com');

      expect(userIds).toContain('user1');
      expect(userIds.length).toBe(1);
    });

    it('should find organisation by slug using index', async () => {
      const db = await getDB(TEST_DATA_PATH);

      db.store.setRow('organisations', 'org1', {
        name: 'Acme Corp',
        slug: 'acme',
        ownerId: 'user1'
      });

      const orgIds = db.indexes.getSliceRowIds('organisationsBySlug', 'acme');

      expect(orgIds).toContain('org1');
      expect(orgIds.length).toBe(1);
    });

    it('should find teams by organisation using index', async () => {
      const db = await getDB(TEST_DATA_PATH);

      db.store.setRow('teams', 'team1', { name: 'Engineering', organisationId: 'org1' });
      db.store.setRow('teams', 'team2', { name: 'Design', organisationId: 'org1' });
      db.store.setRow('teams', 'team3', { name: 'Marketing', organisationId: 'org2' });

      const org1Teams = db.indexes.getSliceRowIds('teamsByOrganisation', 'org1');

      expect(org1Teams).toContain('team1');
      expect(org1Teams).toContain('team2');
      expect(org1Teams).not.toContain('team3');
      expect(org1Teams.length).toBe(2);
    });

    it('should find resources by project using index', async () => {
      const db = await getDB(TEST_DATA_PATH);

      db.store.setRow('resources', 'res1', { name: 'IPFS Cluster', projectId: 'proj1', status: 'ACTIVE' });
      db.store.setRow('resources', 'res2', { name: 'PostgreSQL DB', projectId: 'proj1', status: 'ACTIVE' });
      db.store.setRow('resources', 'res3', { name: 'Redis Cache', projectId: 'proj2', status: 'ACTIVE' });

      const proj1Resources = db.indexes.getSliceRowIds('resourcesByProject', 'proj1');

      expect(proj1Resources).toContain('res1');
      expect(proj1Resources).toContain('res2');
      expect(proj1Resources).not.toContain('res3');
      expect(proj1Resources.length).toBe(2);
    });

    it('should find resources by status using index', async () => {
      const db = await getDB(TEST_DATA_PATH);

      db.store.setRow('resources', 'res1', { name: 'IPFS Cluster', projectId: 'proj1', status: 'ACTIVE' });
      db.store.setRow('resources', 'res2', { name: 'PostgreSQL DB', projectId: 'proj1', status: 'PROVISIONING' });
      db.store.setRow('resources', 'res3', { name: 'Redis Cache', projectId: 'proj2', status: 'ACTIVE' });

      const activeResources = db.indexes.getSliceRowIds('resourcesByStatus', 'ACTIVE');

      expect(activeResources).toContain('res1');
      expect(activeResources).toContain('res3');
      expect(activeResources).not.toContain('res2');
      expect(activeResources.length).toBe(2);
    });
  });

  describe('Relationship Navigation', () => {
    it('should navigate organisation to owner (many-to-one)', async () => {
      const db = await getDB(TEST_DATA_PATH);

      db.store.setRow('users', 'user1', { email: 'alice@example.com', name: 'Alice' });
      db.store.setRow('organisations', 'org1', { name: 'Acme Corp', slug: 'acme', ownerId: 'user1' });

      const ownerId = db.relationships.getRemoteRowId('organisationOwner', 'org1');

      expect(ownerId).toBe('user1');
    });

    it('should navigate team to organisation (many-to-one)', async () => {
      const db = await getDB(TEST_DATA_PATH);

      db.store.setRow('organisations', 'org1', { name: 'Acme Corp', slug: 'acme', ownerId: 'user1' });
      db.store.setRow('teams', 'team1', { name: 'Engineering', organisationId: 'org1' });

      const orgId = db.relationships.getRemoteRowId('teamOrganisation', 'team1');

      expect(orgId).toBe('org1');
    });

    it('should navigate organisation to teams (one-to-many)', async () => {
      const db = await getDB(TEST_DATA_PATH);

      db.store.setRow('organisations', 'org1', { name: 'Acme Corp', slug: 'acme', ownerId: 'user1' });
      db.store.setRow('teams', 'team1', { name: 'Engineering', organisationId: 'org1' });
      db.store.setRow('teams', 'team2', { name: 'Design', organisationId: 'org1' });
      db.store.setRow('teams', 'team3', { name: 'Marketing', organisationId: 'org2' });

      const teamIds = db.relationships.getLocalRowIds('teamOrganisation', 'org1');

      expect(teamIds).toContain('team1');
      expect(teamIds).toContain('team2');
      expect(teamIds).not.toContain('team3');
      expect(teamIds.length).toBe(2);
    });

    it('should navigate project to organisation (many-to-one)', async () => {
      const db = await getDB(TEST_DATA_PATH);

      db.store.setRow('organisations', 'org1', { name: 'Acme Corp', slug: 'acme', ownerId: 'user1' });
      db.store.setRow('projects', 'proj1', { name: 'Website', slug: 'website', organisationId: 'org1' });

      const orgId = db.relationships.getRemoteRowId('projectOrganisation', 'proj1');

      expect(orgId).toBe('org1');
    });

    it('should navigate resource to project (many-to-one)', async () => {
      const db = await getDB(TEST_DATA_PATH);

      db.store.setRow('projects', 'proj1', { name: 'Website', slug: 'website', organisationId: 'org1' });
      db.store.setRow('resources', 'res1', { name: 'IPFS Cluster', projectId: 'proj1', status: 'ACTIVE' });

      const projectId = db.relationships.getRemoteRowId('resourceProject', 'res1');

      expect(projectId).toBe('proj1');
    });

    it('should navigate project to resources (one-to-many)', async () => {
      const db = await getDB(TEST_DATA_PATH);

      db.store.setRow('projects', 'proj1', { name: 'Website', slug: 'website', organisationId: 'org1' });
      db.store.setRow('resources', 'res1', { name: 'IPFS Cluster', projectId: 'proj1', status: 'ACTIVE' });
      db.store.setRow('resources', 'res2', { name: 'PostgreSQL DB', projectId: 'proj1', status: 'ACTIVE' });
      db.store.setRow('resources', 'res3', { name: 'Redis Cache', projectId: 'proj2', status: 'ACTIVE' });

      const resourceIds = db.relationships.getLocalRowIds('resourceProject', 'proj1');

      expect(resourceIds).toContain('res1');
      expect(resourceIds).toContain('res2');
      expect(resourceIds).not.toContain('res3');
      expect(resourceIds.length).toBe(2);
    });
  });

  describe('Data Persistence', () => {
    it('should persist data to files', async () => {
      const db = await getDB(TEST_DATA_PATH);

      db.store.setRow('users', 'user1', {
        email: 'alice@example.com',
        name: 'Alice'
      });

      // Wait for auto-save (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Stop persister
      await db.persister.stopAutoSave();

      // Reset singleton
      await resetDB();

      // Create new instance (should load persisted data)
      const db2 = await getDB(TEST_DATA_PATH);

      const user = db2.store.getRow('users', 'user1');

      expect(user).toEqual({
        email: 'alice@example.com',
        name: 'Alice'
      });
    });

    it('should persist relationships across restarts', async () => {
      const db = await getDB(TEST_DATA_PATH);

      db.store.setRow('organisations', 'org1', { name: 'Acme Corp', slug: 'acme', ownerId: 'user1' });
      db.store.setRow('teams', 'team1', { name: 'Engineering', organisationId: 'org1' });
      db.store.setRow('teams', 'team2', { name: 'Design', organisationId: 'org1' });

      // Wait for auto-save
      await new Promise(resolve => setTimeout(resolve, 2500));

      await db.persister.stopAutoSave();
      await resetDB();

      // Create new instance
      const db2 = await getDB(TEST_DATA_PATH);

      const teamIds = db2.relationships.getLocalRowIds('teamOrganisation', 'org1');

      expect(teamIds).toContain('team1');
      expect(teamIds).toContain('team2');
      expect(teamIds.length).toBe(2);
    });

    it('should persist indexes across restarts', async () => {
      const db = await getDB(TEST_DATA_PATH);

      db.store.setRow('users', 'user1', {
        email: 'alice@example.com',
        name: 'Alice'
      });

      // Wait for auto-save
      await new Promise(resolve => setTimeout(resolve, 2500));

      await db.persister.stopAutoSave();
      await resetDB();

      // Create new instance
      const db2 = await getDB(TEST_DATA_PATH);

      const userIds = db2.indexes.getSliceRowIds('usersByEmail', 'alice@example.com');

      expect(userIds).toContain('user1');
      expect(userIds.length).toBe(1);
    });
  });

  describe('Complex Queries', () => {
    it('should navigate multi-level relationships (org → teams → members)', async () => {
      const db = await getDB(TEST_DATA_PATH);

      // Create users
      db.store.setRow('users', 'user1', { email: 'alice@example.com', name: 'Alice' });
      db.store.setRow('users', 'user2', { email: 'bob@example.com', name: 'Bob' });

      // Create organisation
      db.store.setRow('organisations', 'org1', { name: 'Acme Corp', slug: 'acme', ownerId: 'user1' });

      // Create teams
      db.store.setRow('teams', 'team1', { name: 'Engineering', organisationId: 'org1' });
      db.store.setRow('teams', 'team2', { name: 'Design', organisationId: 'org1' });

      // Create memberships
      db.store.setRow('memberships', 'mem1', { userId: 'user1', organisationId: 'org1', teamId: 'team1', role: 'ADMIN' });
      db.store.setRow('memberships', 'mem2', { userId: 'user2', organisationId: 'org1', teamId: 'team1', role: 'MEMBER' });

      // Navigate: org1 → teams
      const teamIds = db.relationships.getLocalRowIds('teamOrganisation', 'org1');
      expect(teamIds.length).toBe(2);

      // Navigate: team1 → memberships
      const team1MembershipIds = db.indexes.getSliceRowIds('membershipsByTeam', 'team1');
      expect(team1MembershipIds.length).toBe(2);

      // Get member details
      const member1 = db.store.getRow('memberships', 'mem1');
      const user1 = db.store.getRow('users', member1?.userId);
      expect(user1?.email).toBe('alice@example.com');
    });

    it('should support filtering with indexes and relationships', async () => {
      const db = await getDB(TEST_DATA_PATH);

      // Create data
      db.store.setRow('projects', 'proj1', { name: 'Website', slug: 'website', organisationId: 'org1' });
      db.store.setRow('resources', 'res1', { name: 'IPFS Cluster', projectId: 'proj1', status: 'ACTIVE' });
      db.store.setRow('resources', 'res2', { name: 'PostgreSQL DB', projectId: 'proj1', status: 'PROVISIONING' });
      db.store.setRow('resources', 'res3', { name: 'Redis Cache', projectId: 'proj1', status: 'ACTIVE' });

      // Find all ACTIVE resources for proj1
      const allResourceIds = db.relationships.getLocalRowIds('resourceProject', 'proj1');
      const activeResourceIds = db.indexes.getSliceRowIds('resourcesByStatus', 'ACTIVE');

      // Intersection: resources that are both in proj1 AND active
      const activeProj1Resources = allResourceIds.filter(id => activeResourceIds.includes(id));

      expect(activeProj1Resources).toContain('res1');
      expect(activeProj1Resources).toContain('res3');
      expect(activeProj1Resources).not.toContain('res2');
      expect(activeProj1Resources.length).toBe(2);
    });
  });
});
