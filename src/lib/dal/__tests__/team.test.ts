/**
 * Team Model Tests
 *
 * Comprehensive test suite for Team model CRUD operations and custom queries.
 */

import { teamModel, TeamType, TeamVisibility, TeamRole } from '../team';
import { resetDB } from '../../tinybase/db';
import { resetNanoid } from '../../../../tests/__mocks__/nanoid';

describe('TeamModel', () => {
  beforeEach(async () => {
    await resetDB();
    resetNanoid();
  });

  afterEach(async () => {
    await resetDB();
    resetNanoid();
  });

  describe('CRUD Operations', () => {
    it('should create a team with auto-generated ID and timestamps', async () => {
      const team = await teamModel.create({
        name: 'Engineering Team',
        organisationId: 'org1',
        ownerId: 'user1',
      });

      expect(team.id).toBe('test-id-000001');
      expect(team.name).toBe('Engineering Team');
      expect(team.organisationId).toBe('org1');
      expect(team.ownerId).toBe('user1');
      expect(team.createdAt).toBeInstanceOf(Date);
      expect(team.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a team with default values', async () => {
      const team = await teamModel.create({
        name: 'Design Team',
        organisationId: 'org1',
        ownerId: 'user1',
      });

      expect(team.teamType).toBe(TeamType.CUSTOM);
      expect(team.isActive).toBe(true);
      expect(team.isPersonal).toBe(false);
      expect(team.isDeletable).toBe(true);
      expect(team.isDefault).toBe(false);
      expect(team.visibility).toBe(TeamVisibility.PRIVATE);
      expect(team.allowJoinRequests).toBe(true);
      expect(team.tags).toEqual([]);
    });

    it('should create a team with all fields', async () => {
      const team = await teamModel.create({
        name: 'Admin Team',
        description: 'Organisation administrators',
        teamType: TeamType.ADMIN,
        color: '#FF5733',
        isActive: true,
        isPersonal: false,
        isDeletable: false,
        isDefault: true,
        visibility: TeamVisibility.PUBLIC,
        allowJoinRequests: false,
        maxMembers: 5,
        tags: ['admin', 'management'],
        organisationId: 'org1',
        ownerId: 'user1',
      });

      expect(team.name).toBe('Admin Team');
      expect(team.description).toBe('Organisation administrators');
      expect(team.teamType).toBe(TeamType.ADMIN);
      expect(team.color).toBe('#FF5733');
      expect(team.isActive).toBe(true);
      expect(team.isPersonal).toBe(false);
      expect(team.isDeletable).toBe(false);
      expect(team.isDefault).toBe(true);
      expect(team.visibility).toBe(TeamVisibility.PUBLIC);
      expect(team.allowJoinRequests).toBe(false);
      expect(team.maxMembers).toBe(5);
      expect(team.tags).toEqual(['admin', 'management']);
      expect(team.organisationId).toBe('org1');
      expect(team.ownerId).toBe('user1');
    });

    it('should find team by ID', async () => {
      const team = await teamModel.create({
        name: 'Support Team',
        organisationId: 'org1',
        ownerId: 'user1',
      });

      const found = await teamModel.findById(team.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(team.id);
      expect(found?.name).toBe('Support Team');
    });

    it('should return null for non-existent team ID', async () => {
      const found = await teamModel.findById('non-existent-id');
      expect(found).toBeNull();
    });

    it('should update team', async () => {
      const team = await teamModel.create({
        name: 'QA Team',
        organisationId: 'org1',
        ownerId: 'user1',
      });

      const updated = await teamModel.update(team.id, {
        name: 'Quality Assurance Team',
        description: 'Software quality testing',
      });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Quality Assurance Team');
      expect(updated?.description).toBe('Software quality testing');
      expect(updated?.updatedAt).toBeInstanceOf(Date);
      expect(updated?.updatedAt?.getTime()).toBeGreaterThanOrEqual(team.updatedAt!.getTime());
    });

    it('should delete team', async () => {
      const team = await teamModel.create({
        name: 'Temp Team',
        organisationId: 'org1',
        ownerId: 'user1',
      });

      const deleted = await teamModel.delete(team.id);
      expect(deleted).toBe(true);

      const found = await teamModel.findById(team.id);
      expect(found).toBeNull();
    });

    it('should return false when deleting non-existent team', async () => {
      const deleted = await teamModel.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('Custom Query Methods', () => {
    beforeEach(async () => {
      // Create test teams
      await teamModel.create({
        name: 'Engineering',
        teamType: TeamType.DEV,
        visibility: TeamVisibility.PUBLIC,
        organisationId: 'org1',
        ownerId: 'user1',
      });

      await teamModel.create({
        name: 'Design',
        teamType: TeamType.CUSTOM,
        visibility: TeamVisibility.PRIVATE,
        organisationId: 'org1',
        ownerId: 'user1',
      });

      await teamModel.create({
        name: 'Marketing',
        teamType: TeamType.CUSTOM,
        visibility: TeamVisibility.PUBLIC,
        organisationId: 'org2',
        ownerId: 'user2',
      });

      await teamModel.create({
        name: 'Admin',
        teamType: TeamType.ADMIN,
        visibility: TeamVisibility.PRIVATE,
        isActive: false,
        organisationId: 'org1',
        ownerId: 'user1',
      });
    });

    it('should find teams by organisation', async () => {
      const teams = await teamModel.findByOrganisation('org1');

      expect(teams).toHaveLength(3);
      expect(teams.every((t) => t.organisationId === 'org1')).toBe(true);
    });

    it('should find team by name in organisation', async () => {
      const team = await teamModel.findByNameInOrganisation('Engineering', 'org1');

      expect(team).not.toBeNull();
      expect(team?.name).toBe('Engineering');
      expect(team?.organisationId).toBe('org1');
    });

    it('should return null when team name not found in organisation', async () => {
      const team = await teamModel.findByNameInOrganisation('NonExistent', 'org1');

      expect(team).toBeNull();
    });

    it('should find teams by owner', async () => {
      const teams = await teamModel.findByOwner('user1');

      expect(teams).toHaveLength(3);
      expect(teams.every((t) => t.ownerId === 'user1')).toBe(true);
    });

    it('should find active teams', async () => {
      const teams = await teamModel.findActive();

      expect(teams).toHaveLength(3);
      expect(teams.every((t) => t.isActive === true)).toBe(true);
    });

    it('should find inactive teams', async () => {
      const teams = await teamModel.findInactive();

      expect(teams).toHaveLength(1);
      expect(teams.every((t) => t.isActive === false)).toBe(true);
    });

    it('should find teams by type', async () => {
      const devTeams = await teamModel.findByType(TeamType.DEV);
      expect(devTeams).toHaveLength(1);
      expect(devTeams[0].name).toBe('Engineering');

      const adminTeams = await teamModel.findByType(TeamType.ADMIN);
      expect(adminTeams).toHaveLength(1);
      expect(adminTeams[0].name).toBe('Admin');

      const customTeams = await teamModel.findByType(TeamType.CUSTOM);
      expect(customTeams).toHaveLength(2);
    });

    it('should find teams by visibility', async () => {
      const publicTeams = await teamModel.findByVisibility(TeamVisibility.PUBLIC);
      expect(publicTeams).toHaveLength(2);

      const privateTeams = await teamModel.findByVisibility(TeamVisibility.PRIVATE);
      expect(privateTeams).toHaveLength(2);
    });
  });

  describe('Special Team Types', () => {
    it('should find personal teams', async () => {
      await teamModel.create({
        name: 'Personal Team',
        isPersonal: true,
        organisationId: 'org1',
        ownerId: 'user1',
      });

      await teamModel.create({
        name: 'Regular Team',
        isPersonal: false,
        organisationId: 'org1',
        ownerId: 'user1',
      });

      const personalTeams = await teamModel.findPersonal();

      expect(personalTeams).toHaveLength(1);
      expect(personalTeams[0].name).toBe('Personal Team');
      expect(personalTeams[0].isPersonal).toBe(true);
    });

    it('should find default teams', async () => {
      await teamModel.create({
        name: 'Default Team',
        isDefault: true,
        organisationId: 'org1',
        ownerId: 'user1',
      });

      await teamModel.create({
        name: 'Non-Default Team',
        isDefault: false,
        organisationId: 'org1',
        ownerId: 'user1',
      });

      const defaultTeams = await teamModel.findDefault();

      expect(defaultTeams).toHaveLength(1);
      expect(defaultTeams[0].name).toBe('Default Team');
      expect(defaultTeams[0].isDefault).toBe(true);
    });

    it('should find deletable teams', async () => {
      await teamModel.create({
        name: 'Deletable Team',
        isDeletable: true,
        organisationId: 'org1',
        ownerId: 'user1',
      });

      await teamModel.create({
        name: 'Non-Deletable Team',
        isDeletable: false,
        organisationId: 'org1',
        ownerId: 'user1',
      });

      const deletableTeams = await teamModel.findDeletable();

      expect(deletableTeams).toHaveLength(1);
      expect(deletableTeams[0].name).toBe('Deletable Team');
      expect(deletableTeams[0].isDeletable).toBe(true);
    });
  });

  describe('Relationship Methods', () => {
    it('should return empty array for member IDs (placeholder)', async () => {
      const team = await teamModel.create({
        name: 'Test Team',
        organisationId: 'org1',
        ownerId: 'user1',
      });

      const memberIds = await teamModel.getMemberIds(team.id);

      expect(memberIds).toEqual([]);
    });

    it('should return empty array for project IDs (placeholder)', async () => {
      const team = await teamModel.create({
        name: 'Test Team',
        organisationId: 'org1',
        ownerId: 'user1',
      });

      const projectIds = await teamModel.getProjectIds(team.id);

      expect(projectIds).toEqual([]);
    });
  });

  describe('Name Availability', () => {
    it('should return true for available name', async () => {
      const available = await teamModel.isNameAvailable('New Team', 'org1');

      expect(available).toBe(true);
    });

    it('should return false for taken name in same organisation', async () => {
      await teamModel.create({
        name: 'Existing Team',
        organisationId: 'org1',
        ownerId: 'user1',
      });

      const available = await teamModel.isNameAvailable('Existing Team', 'org1');

      expect(available).toBe(false);
    });

    it('should return true for same name in different organisation', async () => {
      await teamModel.create({
        name: 'Team Name',
        organisationId: 'org1',
        ownerId: 'user1',
      });

      const available = await teamModel.isNameAvailable('Team Name', 'org2');

      expect(available).toBe(true);
    });

    it('should return true when checking name of same team (for updates)', async () => {
      const team = await teamModel.create({
        name: 'My Team',
        organisationId: 'org1',
        ownerId: 'user1',
      });

      const available = await teamModel.isNameAvailable('My Team', 'org1', team.id);

      expect(available).toBe(true);
    });
  });

  describe('Helper Methods', () => {
    it('should count teams', async () => {
      await teamModel.create({
        name: 'Team 1',
        organisationId: 'org1',
        ownerId: 'user1',
      });

      await teamModel.create({
        name: 'Team 2',
        organisationId: 'org1',
        ownerId: 'user1',
      });

      const count = await teamModel.count();

      expect(count).toBe(2);
    });

    it('should check if team exists', async () => {
      const team = await teamModel.create({
        name: 'Test Team',
        organisationId: 'org1',
        ownerId: 'user1',
      });

      const exists = await teamModel.exists(team.id);
      const notExists = await teamModel.exists('non-existent-id');

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
  });

  describe('Enums', () => {
    it('should export TeamType enum', () => {
      expect(TeamType.ADMIN).toBe('ADMIN');
      expect(TeamType.DEV).toBe('DEV');
      expect(TeamType.GUEST).toBe('GUEST');
      expect(TeamType.CUSTOM).toBe('CUSTOM');
    });

    it('should export TeamVisibility enum', () => {
      expect(TeamVisibility.PUBLIC).toBe('PUBLIC');
      expect(TeamVisibility.PRIVATE).toBe('PRIVATE');
      expect(TeamVisibility.INVITE_ONLY).toBe('INVITE_ONLY');
    });

    it('should export TeamRole enum', () => {
      expect(TeamRole.MEMBER).toBe('MEMBER');
      expect(TeamRole.LEAD).toBe('LEAD');
      expect(TeamRole.ADMIN).toBe('ADMIN');
    });
  });

  describe('Edge Cases', () => {
    it('should handle teams with minimal data', async () => {
      const team = await teamModel.create({
        name: 'Minimal Team',
        organisationId: 'org1',
        ownerId: 'user1',
      });

      expect(team.id).toBeDefined();
      expect(team.name).toBe('Minimal Team');
      expect(team.description).toBeUndefined();
    });

    it('should handle teams with null optional fields', async () => {
      const team = await teamModel.create({
        name: 'Null Fields Team',
        description: null,
        color: null,
        maxMembers: null,
        organisationId: 'org1',
        ownerId: 'user1',
      });

      expect(team.description).toBeNull();
      expect(team.color).toBeNull();
      expect(team.maxMembers).toBeNull();
    });

    it('should handle empty tags array', async () => {
      const team = await teamModel.create({
        name: 'No Tags Team',
        tags: [],
        organisationId: 'org1',
        ownerId: 'user1',
      });

      expect(team.tags).toEqual([]);
    });

    it('should handle multiple tags', async () => {
      const team = await teamModel.create({
        name: 'Tagged Team',
        tags: ['frontend', 'backend', 'fullstack'],
        organisationId: 'org1',
        ownerId: 'user1',
      });

      expect(team.tags).toEqual(['frontend', 'backend', 'fullstack']);
    });
  });
});
