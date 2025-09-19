/**
 * Simple tests for TeamService to verify basic functionality
 */

import { TeamService, teamService } from '@/lib/services/team';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    team: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    teamMember: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    organisationMember: {
      findUnique: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    TeamRole: {
      LEAD: 'LEAD',
      MEMBER: 'MEMBER',
    },
    TeamVisibility: {
      PRIVATE: 'PRIVATE',
      PUBLIC: 'PUBLIC',
      INTERNAL: 'INTERNAL',
    },
  };
});

describe('TeamService - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be instantiated', () => {
    expect(teamService).toBeDefined();
    expect(teamService).toBeInstanceOf(TeamService);
  });

  it('should have all required methods', () => {
    const expectedMethods = [
      'createTeam',
      'getTeamById',
      'getUserTeams',
      'getOrganisationTeams',
      'updateTeam',
      'deleteTeam',
      'getUserRole',
      'isUserMember',
      'validateTeamName',
      'getTeamMembers',
      'addTeamMember',
      'removeTeamMember',
    ];

    expectedMethods.forEach(method => {
      expect(teamService).toHaveProperty(method);
      expect(typeof teamService[method as keyof TeamService]).toBe('function');
    });
  });

  it('should be able to create a new TeamService instance', () => {
    const newService = new TeamService();
    expect(newService).toBeDefined();
    expect(newService).toBeInstanceOf(TeamService);
  });
});