/**
 * Simple tests for OrganisationService to verify basic functionality
 */

import { OrganisationService, organisationService } from '@/lib/services/organisation';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    organisation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    organisationMember: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    OrganisationRole: {
      OWNER: 'OWNER',
      MANAGER: 'MANAGER',
      MEMBER: 'MEMBER',
    },
  };
});

describe('OrganisationService - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be instantiated', () => {
    expect(organisationService).toBeDefined();
    expect(organisationService).toBeInstanceOf(OrganisationService);
  });

  it('should have all required methods', () => {
    const expectedMethods = [
      'createOrganisation',
      'getOrganisationById',
      'getUserOrganisations',
      'updateOrganisation',
      'deleteOrganisation',
      'getUserRole',
      'isUserMember',
      'validateOrganisationName',
      'getOrganisationMembers',
      'searchOrganisations',
    ];

    expectedMethods.forEach(method => {
      expect(typeof organisationService[method]).toBe('function');
    });
  });

  it('should have createOrganisation method', () => {
    expect(typeof organisationService.createOrganisation).toBe('function');
  });

  it('should have getOrganisationById method', () => {
    expect(typeof organisationService.getOrganisationById).toBe('function');
  });

  it('should have getUserOrganisations method', () => {
    expect(typeof organisationService.getUserOrganisations).toBe('function');
  });

  it('should have updateOrganisation method', () => {
    expect(typeof organisationService.updateOrganisation).toBe('function');
  });

  it('should have deleteOrganisation method', () => {
    expect(typeof organisationService.deleteOrganisation).toBe('function');
  });

  it('should have getUserRole method', () => {
    expect(typeof organisationService.getUserRole).toBe('function');
  });

  it('should have isUserMember method', () => {
    expect(typeof organisationService.isUserMember).toBe('function');
  });

  it('should have validateOrganisationName method', () => {
    expect(typeof organisationService.validateOrganisationName).toBe('function');
  });

  it('should have getOrganisationMembers method', () => {
    expect(typeof organisationService.getOrganisationMembers).toBe('function');
  });

  it('should have searchOrganisations method', () => {
    expect(typeof organisationService.searchOrganisations).toBe('function');
  });
});