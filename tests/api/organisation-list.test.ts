/**
 * Tests for GET /api/organisation/list API route
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/organisation/list/route';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

// Mock the organisation service
jest.mock('@/lib/services/organisation', () => ({
  organisationService: {
    getUserOrganisations: jest.fn(),
  },
}));

describe('GET /api/organisation/list', () => {
  // Get references to the mocked functions
  const mockAuth = require('@/lib/auth').auth as jest.MockedFunction<any>;
  const mockOrganisationService = require('@/lib/services/organisation').organisationService;

  const mockSession = {
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
  };

  const mockOrganisations = [
    {
      id: 'org-123',
      name: 'Organisation 1',
      description: 'First organisation',
      website: 'https://org1.com',
      address: '123 Main St',
      phone: '+1234567890',
      email: 'contact@org1.com',
      logo: 'https://logo1.com/logo.png',
      isActive: true,
      ownerId: 'user-123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      memberCount: 10,
      teamCount: 5,
      projectCount: 20,
    },
    {
      id: 'org-456',
      name: 'Organisation 2',
      description: 'Second organisation',
      website: 'https://org2.com',
      address: '456 Second St',
      phone: '+0987654321',
      email: 'info@org2.com',
      logo: 'https://logo2.com/logo.png',
      isActive: true,
      ownerId: 'user-456',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-04'),
      memberCount: 3,
      teamCount: 1,
      projectCount: 5,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/organisation/list');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockOrganisationService.getUserOrganisations).not.toHaveBeenCalled();
    });

    it('should proceed when user is authenticated', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockOrganisationService.getUserOrganisations.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/organisation/list');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockOrganisationService.getUserOrganisations).toHaveBeenCalledWith('user-123');
    });
  });

  describe('Organisation Listing', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);
    });

    it('should return empty list when user has no organisations', async () => {
      mockOrganisationService.getUserOrganisations.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/organisation/list');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.organisations).toEqual([]);
      expect(mockOrganisationService.getUserOrganisations).toHaveBeenCalledWith('user-123');
    });

    it('should return list of user organisations', async () => {
      mockOrganisationService.getUserOrganisations.mockResolvedValue(mockOrganisations);

      const request = new NextRequest('http://localhost/api/organisation/list');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.organisations).toHaveLength(2);

      expect(data.organisations[0]).toEqual({
        id: 'org-123',
        name: 'Organisation 1',
        description: 'First organisation',
        website: 'https://org1.com',
        address: '123 Main St',
        phone: '+1234567890',
        email: 'contact@org1.com',
        logo: 'https://logo1.com/logo.png',
        isActive: true,
        ownerId: 'user-123',
        createdAt: mockOrganisations[0].createdAt.toISOString(),
        updatedAt: mockOrganisations[0].updatedAt.toISOString(),
        memberCount: 10,
        teamCount: 5,
        projectCount: 20,
      });

      expect(data.organisations[1]).toEqual({
        id: 'org-456',
        name: 'Organisation 2',
        description: 'Second organisation',
        website: 'https://org2.com',
        address: '456 Second St',
        phone: '+0987654321',
        email: 'info@org2.com',
        logo: 'https://logo2.com/logo.png',
        isActive: true,
        ownerId: 'user-456',
        createdAt: mockOrganisations[1].createdAt.toISOString(),
        updatedAt: mockOrganisations[1].updatedAt.toISOString(),
        memberCount: 3,
        teamCount: 1,
        projectCount: 5,
      });

      expect(mockOrganisationService.getUserOrganisations).toHaveBeenCalledWith('user-123');
    });

    it('should return single organisation in list', async () => {
      const singleOrganisation = [mockOrganisations[0]];
      mockOrganisationService.getUserOrganisations.mockResolvedValue(singleOrganisation);

      const request = new NextRequest('http://localhost/api/organisation/list');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.organisations).toHaveLength(1);
      expect(data.organisations[0].id).toBe('org-123');
    });

    it('should handle organisations with null/missing optional fields', async () => {
      const organisationWithNulls = [
        {
          ...mockOrganisations[0],
          description: null,
          website: null,
          address: null,
          phone: null,
          email: null,
          logo: null,
        },
      ];

      mockOrganisationService.getUserOrganisations.mockResolvedValue(organisationWithNulls);

      const request = new NextRequest('http://localhost/api/organisation/list');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.organisations[0]).toEqual({
        id: 'org-123',
        name: 'Organisation 1',
        description: null,
        website: null,
        address: null,
        phone: null,
        email: null,
        logo: null,
        isActive: true,
        ownerId: 'user-123',
        createdAt: organisationWithNulls[0].createdAt.toISOString(),
        updatedAt: organisationWithNulls[0].updatedAt.toISOString(),
        memberCount: 10,
        teamCount: 5,
        projectCount: 20,
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);
    });

    it('should handle database connection errors', async () => {
      const error = new Error('Database connection failed');
      mockOrganisationService.getUserOrganisations.mockRejectedValue(error);

      const request = new NextRequest('http://localhost/api/organisation/list');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection failed');
      expect(mockOrganisationService.getUserOrganisations).toHaveBeenCalledWith('user-123');
    });

    it('should handle service errors', async () => {
      const error = new Error('Service unavailable');
      mockOrganisationService.getUserOrganisations.mockRejectedValue(error);

      const request = new NextRequest('http://localhost/api/organisation/list');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Service unavailable');
    });

    it('should handle unknown errors', async () => {
      mockOrganisationService.getUserOrganisations.mockRejectedValue('Unknown error');

      const request = new NextRequest('http://localhost/api/organisation/list');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockOrganisationService.getUserOrganisations.mockRejectedValue(timeoutError);

      const request = new NextRequest('http://localhost/api/organisation/list');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Request timeout');
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);
    });

    it('should return consistent response format', async () => {
      mockOrganisationService.getUserOrganisations.mockResolvedValue(mockOrganisations);

      const request = new NextRequest('http://localhost/api/organisation/list');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('organisations');
      expect(data.success).toBe(true);
      expect(Array.isArray(data.organisations)).toBe(true);
    });

    it('should include all required organisation fields', async () => {
      mockOrganisationService.getUserOrganisations.mockResolvedValue([mockOrganisations[0]]);

      const request = new NextRequest('http://localhost/api/organisation/list');
      const response = await GET(request);
      const data = await response.json();

      const organisation = data.organisations[0];
      const requiredFields = [
        'id', 'name', 'description', 'website', 'address', 'phone', 'email',
        'logo', 'isActive', 'ownerId', 'createdAt', 'updatedAt',
        'memberCount', 'teamCount', 'projectCount'
      ];

      requiredFields.forEach(field => {
        expect(organisation).toHaveProperty(field);
      });
    });

    it('should maintain data types in response', async () => {
      mockOrganisationService.getUserOrganisations.mockResolvedValue([mockOrganisations[0]]);

      const request = new NextRequest('http://localhost/api/organisation/list');
      const response = await GET(request);
      const data = await response.json();

      const organisation = data.organisations[0];

      expect(typeof organisation.id).toBe('string');
      expect(typeof organisation.name).toBe('string');
      expect(typeof organisation.isActive).toBe('boolean');
      expect(typeof organisation.memberCount).toBe('number');
      expect(typeof organisation.teamCount).toBe('number');
      expect(typeof organisation.projectCount).toBe('number');
      expect(typeof organisation.createdAt).toBe('string');
      expect(typeof organisation.updatedAt).toBe('string');
    });
  });

  describe('Performance Considerations', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);
    });

    it('should handle large lists of organisations', async () => {
      // Create a large list of mock organisations
      const largeOrganisationList = Array.from({ length: 100 }, (_, index) => ({
        ...mockOrganisations[0],
        id: `org-${index}`,
        name: `Organisation ${index}`,
      }));

      mockOrganisationService.getUserOrganisations.mockResolvedValue(largeOrganisationList);

      const request = new NextRequest('http://localhost/api/organisation/list');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.organisations).toHaveLength(100);
      expect(mockOrganisationService.getUserOrganisations).toHaveBeenCalledTimes(1);
    });

    it('should call service only once per request', async () => {
      mockOrganisationService.getUserOrganisations.mockResolvedValue(mockOrganisations);

      const request = new NextRequest('http://localhost/api/organisation/list');
      await GET(request);

      expect(mockOrganisationService.getUserOrganisations).toHaveBeenCalledTimes(1);
      expect(mockOrganisationService.getUserOrganisations).toHaveBeenCalledWith('user-123');
    });
  });
});