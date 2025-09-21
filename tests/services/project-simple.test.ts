/**
 * Simple tests for ProjectService to verify basic functionality
 */

import { ProjectService, projectService } from '@/lib/services/project';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    ProjectStatus: {
      PLANNING: 'PLANNING',
      ACTIVE: 'ACTIVE',
      ON_HOLD: 'ON_HOLD',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
    },
    ProjectPriority: {
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH',
      URGENT: 'URGENT',
    },
  };
});

// Mock team service
jest.mock('@/lib/services/team', () => ({
  teamService: {
    isUserMember: jest.fn(),
    getTeamById: jest.fn(),
    getUserTeams: jest.fn(),
    getUserRole: jest.fn(),
  },
}));

describe('ProjectService - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be instantiated', () => {
    expect(projectService).toBeDefined();
    expect(projectService).toBeInstanceOf(ProjectService);
  });

  it('should have all required methods', () => {
    const expectedMethods = [
      'createProject',
      'getProjectById',
      'getTeamProjects',
      'getOrganisationProjects',
      'getUserProjects',
      'updateProject',
      'deleteProject',
      'validateProjectName',
      'canUserAccessProject',
      'searchProjects',
    ];

    expectedMethods.forEach(method => {
      expect(projectService).toHaveProperty(method);
      expect(typeof projectService[method as keyof ProjectService]).toBe('function');
    });
  });

  it('should be able to create a new ProjectService instance', () => {
    const newService = new ProjectService();
    expect(newService).toBeDefined();
    expect(newService).toBeInstanceOf(ProjectService);
  });
});