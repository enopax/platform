/**
 * Tests for GET/PUT/DELETE /api/organisation/[id] API routes
 */

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/organisation/[id]/route';
import { auth } from '@/lib/auth';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;

// Mock the organisation service
jest.mock('@/lib/services/organisation', () => ({
  organisationService: {
    isUserMember: jest.fn(),
    getOrganisationById: jest.fn(),
    validateOrganisationName: jest.fn(),
    updateOrganisation: jest.fn(),
    deleteOrganisation: jest.fn(),
  },
  CreateOrganisationData: {},
}));

// No longer using zod, validation is now done with simple JavaScript functions

describe('Organisation Details API Routes', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
  };

  const mockOrganisation = {
    id: 'org-123',
    name: 'Test Organisation',
    description: 'A test organisation',
    website: 'https://test.com',
    address: '123 Main St',
    phone: '+1234567890',
    email: 'test@test.com',
    logo: 'https://logo.com/logo.png',
    isActive: true,
    ownerId: 'user-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    memberCount: 5,
    teamCount: 3,
    projectCount: 10,
  };

  const mockParams = { params: { id: 'org-123' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/organisation/[id]', () => {
    // Get the mocked service
    const { organisationService: mockOrganisationService } = require('@/lib/services/organisation');
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockAuth.mockResolvedValue(null);

        const request = new NextRequest('http://localhost/api/organisation/org-123');
        const response = await GET(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Authorization', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSession);
      });

      it('should return 403 when user is not a member', async () => {
        mockOrganisationService.isUserMember.mockResolvedValue(false);

        const request = new NextRequest('http://localhost/api/organisation/org-123');
        const response = await GET(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('Forbidden');
        expect(mockOrganisationService.isUserMember).toHaveBeenCalledWith('user-123', 'org-123');
      });

      it('should proceed when user is a member', async () => {
        mockOrganisationService.isUserMember.mockResolvedValue(true);
        mockOrganisationService.getOrganisationById.mockResolvedValue(mockOrganisation);

        const request = new NextRequest('http://localhost/api/organisation/org-123');
        const response = await GET(request, mockParams);

        expect(response.status).toBe(200);
        expect(mockOrganisationService.isUserMember).toHaveBeenCalledWith('user-123', 'org-123');
      });
    });

    describe('Organisation Retrieval', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSession);
        mockOrganisationService.isUserMember.mockResolvedValue(true);
      });

      it('should return 404 when organisation does not exist', async () => {
        mockOrganisationService.getOrganisationById.mockResolvedValue(null);

        const request = new NextRequest('http://localhost/api/organisation/non-existent');
        const response = await GET(request, { params: { id: 'non-existent' } });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Organisation not found');
        expect(mockOrganisationService.getOrganisationById).toHaveBeenCalledWith('non-existent');
      });

      it('should return organisation details successfully', async () => {
        mockOrganisationService.getOrganisationById.mockResolvedValue(mockOrganisation);

        const request = new NextRequest('http://localhost/api/organisation/org-123');
        const response = await GET(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.organisation).toEqual({
          id: 'org-123',
          name: 'Test Organisation',
          description: 'A test organisation',
          website: 'https://test.com',
          address: '123 Main St',
          phone: '+1234567890',
          email: 'test@test.com',
          logo: 'https://logo.com/logo.png',
          isActive: true,
          ownerId: 'user-123',
          createdAt: mockOrganisation.createdAt,
          updatedAt: mockOrganisation.updatedAt,
          memberCount: 5,
          teamCount: 3,
          projectCount: 10,
        });
      });

      it('should handle database errors', async () => {
        mockOrganisationService.getOrganisationById.mockRejectedValue(
          new Error('Database connection failed')
        );

        const request = new NextRequest('http://localhost/api/organisation/org-123');
        const response = await GET(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Database connection failed');
      });
    });
  });

  describe('PUT /api/organisation/[id]', () => {
    const updateData = {
      name: 'Updated Organisation',
      description: 'Updated description',
      website: 'https://updated.com',
    };

    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockAuth.mockResolvedValue(null);

        const request = new NextRequest('http://localhost/api/organisation/org-123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Input Validation', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSession);
      });

      it('should return 400 when input validation fails', async () => {
        const mockSafeParse = jest.fn().mockReturnValue({
          success: false,
          error: {
            issues: [
              {
                path: ['name'],
                message: 'Organisation name is required',
              },
            ],
          },
        });

        const { z } = require('zod');
        z.object().safeParse = mockSafeParse;

        const request = new NextRequest('http://localhost/api/organisation/org-123', {
          method: 'PUT',
          body: JSON.stringify({ name: '' }),
        });
        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid input data');
        expect(data.details).toBeDefined();
      });
    });

    describe('Name Validation', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSession);

        const mockSafeParse = jest.fn().mockReturnValue({
          success: true,
          data: updateData,
        });

        const { z } = require('zod');
        z.object().safeParse = mockSafeParse;
      });

      it('should return 409 when organisation name is already taken', async () => {
        mockOrganisationService.validateOrganisationName.mockResolvedValue(false);

        const request = new NextRequest('http://localhost/api/organisation/org-123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toBe('Organisation name is already taken');
        expect(mockOrganisationService.validateOrganisationName).toHaveBeenCalledWith(
          'Updated Organisation',
          'org-123'
        );
      });
    });

    describe('Organisation Update', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSession);

        const mockSafeParse = jest.fn().mockReturnValue({
          success: true,
          data: updateData,
        });

        const { z } = require('zod');
        z.object().safeParse = mockSafeParse;

        mockOrganisationService.validateOrganisationName.mockResolvedValue(true);
      });

      it('should update organisation successfully', async () => {
        const updatedOrganisation = { ...mockOrganisation, ...updateData };
        mockOrganisationService.updateOrganisation.mockResolvedValue(updatedOrganisation);

        const request = new NextRequest('http://localhost/api/organisation/org-123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.organisation.name).toBe('Updated Organisation');
        expect(mockOrganisationService.updateOrganisation).toHaveBeenCalledWith(
          'org-123',
          'user-123',
          updateData
        );
      });

      it('should handle insufficient permissions', async () => {
        mockOrganisationService.updateOrganisation.mockRejectedValue(
          new Error('Insufficient permissions to update organisation')
        );

        const request = new NextRequest('http://localhost/api/organisation/org-123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        const response = await PUT(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Insufficient permissions to update organisation');
      });
    });
  });

  describe('DELETE /api/organisation/[id]', () => {
    describe('Authentication', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockAuth.mockResolvedValue(null);

        const request = new NextRequest('http://localhost/api/organisation/org-123', {
          method: 'DELETE',
        });
        const response = await DELETE(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Organisation Deletion', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSession);
      });

      it('should delete organisation successfully when user is owner', async () => {
        mockOrganisationService.deleteOrganisation.mockResolvedValue(undefined);

        const request = new NextRequest('http://localhost/api/organisation/org-123', {
          method: 'DELETE',
        });
        const response = await DELETE(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Organisation deactivated successfully');
        expect(mockOrganisationService.deleteOrganisation).toHaveBeenCalledWith(
          'org-123',
          'user-123'
        );
      });

      it('should handle insufficient permissions', async () => {
        mockOrganisationService.deleteOrganisation.mockRejectedValue(
          new Error('Only the organisation owner can delete the organisation')
        );

        const request = new NextRequest('http://localhost/api/organisation/org-123', {
          method: 'DELETE',
        });
        const response = await DELETE(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Only the organisation owner can delete the organisation');
      });

      it('should handle database errors', async () => {
        mockOrganisationService.deleteOrganisation.mockRejectedValue(
          new Error('Database connection failed')
        );

        const request = new NextRequest('http://localhost/api/organisation/org-123', {
          method: 'DELETE',
        });
        const response = await DELETE(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Database connection failed');
      });

      it('should handle unknown errors', async () => {
        mockOrganisationService.deleteOrganisation.mockRejectedValue('Unknown error');

        const request = new NextRequest('http://localhost/api/organisation/org-123', {
          method: 'DELETE',
        });
        const response = await DELETE(request, mockParams);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Internal server error');
      });
    });
  });
});