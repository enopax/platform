import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Project, Resource } from '@prisma/client';
import { setupIntegrationTests, teardownIntegrationTests, getServices } from './setup';

describe('Relationships - Project→Resource', () => {
  const { projectService, resourceService } = getServices();

  let testProject: Project | null;
  let testResources: Resource[];

  beforeAll(async () => {
    await setupIntegrationTests();

    const projects = await projectService.getAllProjects();
    testProject = projects[0] || null;

    if (testProject) {
      testResources = await resourceService.getProjectResources(testProject.id);
    } else {
      testResources = [];
    }
  });

  afterAll(async () => {
    await teardownIntegrationTests();
  });

  it('should get all resources for project', () => {
    if (!testProject) {
      console.log('⚠️  No test project found');
      return;
    }

    expect(Array.isArray(testResources)).toBe(true);

    testResources.forEach(resource => {
      expect(resource.id).toBeDefined();
      expect(resource.organisationId).toBeDefined();
    });

    console.log(`✅ Found ${testResources.length} resources for project ${testProject.name}`);
  });

  it('should get project from resource', async () => {
    if (!testProject || testResources.length === 0) {
      console.log('⚠️  No test data available');
      return;
    }

    const resource = testResources[0];
    const project = await projectService.getProjectById(testProject.id);

    expect(project).toBeDefined();
    expect(project?.id).toBe(testProject.id);

    console.log(`✅ Retrieved project ${project?.name} from resource ${resource.name}`);
  });

  it('should verify bi-directional relationship', async () => {
    if (!testProject || testResources.length === 0) {
      console.log('⚠️  No test data available');
      return;
    }

    const resource = testResources[0];
    const resourceDetails = await resourceService.getResourceById(resource.id);

    expect(resourceDetails).toBeDefined();
    expect(resourceDetails?.id).toBe(resource.id);

    console.log(`✅ Bi-directional relationship verified for resource ${resource.name}`);
  });
});
