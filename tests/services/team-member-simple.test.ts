/**
 * Simple tests for TeamMemberService to verify basic functionality
 */

import { TeamMemberService, teamMemberService } from '@/lib/services/team-member';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    teamMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    team: {
      findUnique: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    TeamRole: {
      LEAD: 'LEAD',
      MEMBER: 'MEMBER',
    },
  };
});

// Mock dependencies
jest.mock('@/lib/services/team', () => ({
  teamService: {
    getTeamById: jest.fn(),
    addTeamMember: jest.fn(),
    removeTeamMember: jest.fn(),
    getTeamMembers: jest.fn(),
    getUserRole: jest.fn(),
    isUserMember: jest.fn(),
  },
}));

jest.mock('@/lib/services/user', () => ({
  userService: {
    validateUserExists: jest.fn(),
  },
}));

describe('TeamMemberService - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be instantiated', () => {
    expect(teamMemberService).toBeDefined();
    expect(teamMemberService).toBeInstanceOf(TeamMemberService);
  });

  it('should have all required methods', () => {
    const expectedMethods = [
      'addTeamMember',
      'updateMemberRole',
      'removeMember',
      'promoteMember',
      'demoteMember',
      'getTeamMembers',
      'getUserRole',
      'isUserMember',
    ];

    expectedMethods.forEach(method => {
      expect(teamMemberService).toHaveProperty(method);
      expect(typeof teamMemberService[method as keyof TeamMemberService]).toBe('function');
    });
  });

  it('should be able to create a new TeamMemberService instance', () => {
    const newService = new TeamMemberService();
    expect(newService).toBeDefined();
    expect(newService).toBeInstanceOf(TeamMemberService);
  });
});