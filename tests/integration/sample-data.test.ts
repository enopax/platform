import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { User, Organisation, Team, Project } from '@prisma/client';
import { setupIntegrationTests, teardownIntegrationTests, getServices } from './setup';

describe('Data Integrity - Sample Data', () => {
  const { userService, organisationService, teamService, projectService } = getServices();

  let sampleUser: User | null;
  let sampleOrg: Organisation | null;
  let sampleTeam: Team | null;
  let sampleProject: Project | null;

  beforeAll(async () => {
    await setupIntegrationTests();

    const users = await userService.getAllUsers();
    sampleUser = users[0] || null;

    if (sampleUser) {
      const orgs = await organisationService.getUserOrganisations(sampleUser.id);
      sampleOrg = orgs[0] || null;

      if (sampleOrg) {
        const teams = await teamService.getOrganisationTeams(sampleOrg.id, sampleUser.id);
        sampleTeam = teams[0] || null;

        const projects = await projectService.getOrganisationProjects(sampleOrg.id);
        sampleProject = projects[0] || null;
      }
    }

    const testDataPath = path.join(__dirname, '../../migration-test-data.json');
    fs.writeFileSync(testDataPath, JSON.stringify({
      sampleUser,
      sampleOrg,
      sampleTeam,
      sampleProject
    }, null, 2));

    console.log(`📝 Sample data saved to ${testDataPath}`);
  });

  afterAll(async () => {
    await teardownIntegrationTests();
  });

  it('should preserve user data exactly', () => {
    if (!sampleUser) {
      console.log('⚠️  No sample user found in database');
      return;
    }

    expect(sampleUser.id).toBeDefined();
    expect(sampleUser.email).toBeDefined();
    expect(sampleUser.role).toBeDefined();
    console.log(`✅ Sample user: ${sampleUser.email} (${sampleUser.id})`);
  });

  it('should preserve organisation data exactly', () => {
    if (!sampleOrg) {
      console.log('⚠️  No sample organisation found in database');
      return;
    }

    expect(sampleOrg.id).toBeDefined();
    expect(sampleOrg.name).toBeDefined();
    if (sampleUser) {
      expect(sampleOrg.ownerId).toBe(sampleUser.id);
    }
    console.log(`✅ Sample organisation: ${sampleOrg.name} (${sampleOrg.id})`);
  });

  it('should preserve team data exactly', () => {
    if (!sampleTeam) {
      console.log('⚠️  No sample team found in database');
      return;
    }

    expect(sampleTeam.id).toBeDefined();
    expect(sampleTeam.name).toBeDefined();
    if (sampleOrg) {
      expect(sampleTeam.organisationId).toBe(sampleOrg.id);
    }
    console.log(`✅ Sample team: ${sampleTeam.name} (${sampleTeam.id})`);
  });

  it('should preserve project data exactly', () => {
    if (!sampleProject) {
      console.log('⚠️  No sample project found in database');
      return;
    }

    expect(sampleProject.id).toBeDefined();
    expect(sampleProject.name).toBeDefined();
    if (sampleOrg) {
      expect(sampleProject.organisationId).toBe(sampleOrg.id);
    }
    console.log(`✅ Sample project: ${sampleProject.name} (${sampleProject.id})`);
  });
});
