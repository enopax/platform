/**
 * Tests for POST /api/organisation/create API route
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/organisation/create/route';

// Mock the auth module
const mockAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  auth: mockAuth,
}));

// Mock the organisation service
const mockOrganisationService = {
  validateOrganisationName: jest.fn(),
  createOrganisation: jest.fn(),
};

jest.mock('@/lib/services/organisation', () => ({
  organisationService: mockOrganisationService,
  CreateOrganisationData: {},
}));

// Mock zod
jest.mock('zod', () => {
  const originalZod = jest.requireActual('zod');
  return {
    ...originalZod,
    z: {
      ...originalZod.z,
      object: jest.fn(() => ({
        safeParse: jest.fn(),
      })),
    },
  };
});

describe('POST /api/organisation/create', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
  };

  const validOrganisationData = {
    name: 'Test Organisation',
    description: 'A test organisation',
    website: 'https://test.com',
    email: 'test@test.com',
  };

  const mockCreatedOrganisation = {
    id: 'org-123',
    name: 'Test Organisation',
    description: 'A test organisation',
    website: 'https://test.com',
    address: null,
    phone: null,
    email: 'test@test.com',
    logo: null,
    isActive: true,
    createdAt: new Date(),
    memberCount: 1,
    teamCount: 0,
    projectCount: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/organisation/create', {
        method: 'POST',
        body: JSON.stringify(validOrganisationData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should proceed when user is authenticated', async () => {
      mockAuth.mockResolvedValue(mockSession);

      // Mock successful validation and creation
      const mockSafeParse = jest.fn().mockReturnValue({
        success: true,
        data: validOrganisationData,
      });

      const { z } = require('zod');
      z.object().safeParse = mockSafeParse;

      mockOrganisationService.validateOrganisationName.mockResolvedValue(true);
      mockOrganisationService.createOrganisation.mockResolvedValue(mockCreatedOrganisation);

      const request = new NextRequest('http://localhost/api/organisation/create', {
        method: 'POST',
        body: JSON.stringify(validOrganisationData),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
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

      const request = new NextRequest('http://localhost/api/organisation/create', {
        method: 'POST',
        body: JSON.stringify({ name: '' }), // Invalid data
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input data');
      expect(data.details).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost/api/organisation/create', {
        method: 'POST',
        body: 'invalid-json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('Name Validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);

      const mockSafeParse = jest.fn().mockReturnValue({
        success: true,
        data: validOrganisationData,
      });

      const { z } = require('zod');
      z.object().safeParse = mockSafeParse;
    });

    it('should return 409 when organisation name is already taken', async () => {
      mockOrganisationService.validateOrganisationName.mockResolvedValue(false);

      const request = new NextRequest('http://localhost/api/organisation/create', {
        method: 'POST',
        body: JSON.stringify(validOrganisationData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Organisation name is already taken');
      expect(mockOrganisationService.validateOrganisationName).toHaveBeenCalledWith('Test Organisation');
    });

    it('should proceed when organisation name is available', async () => {
      mockOrganisationService.validateOrganisationName.mockResolvedValue(true);
      mockOrganisationService.createOrganisation.mockResolvedValue(mockCreatedOrganisation);

      const request = new NextRequest('http://localhost/api/organisation/create', {
        method: 'POST',
        body: JSON.stringify(validOrganisationData),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockOrganisationService.validateOrganisationName).toHaveBeenCalledWith('Test Organisation');
    });
  });

  describe('Organisation Creation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);

      const mockSafeParse = jest.fn().mockReturnValue({
        success: true,
        data: validOrganisationData,
      });

      const { z } = require('zod');
      z.object().safeParse = mockSafeParse;

      mockOrganisationService.validateOrganisationName.mockResolvedValue(true);
    });

    it('should create organisation successfully', async () => {
      mockOrganisationService.createOrganisation.mockResolvedValue(mockCreatedOrganisation);

      const request = new NextRequest('http://localhost/api/organisation/create', {
        method: 'POST',
        body: JSON.stringify(validOrganisationData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.organisation).toEqual({
        id: 'org-123',
        name: 'Test Organisation',
        description: 'A test organisation',
        website: 'https://test.com',
        address: null,
        phone: null,
        email: 'test@test.com',
        logo: null,
        isActive: true,
        createdAt: mockCreatedOrganisation.createdAt,
        memberCount: 1,
        teamCount: 0,
        projectCount: 0,
      });

      expect(mockOrganisationService.createOrganisation).toHaveBeenCalledWith(
        'user-123',
        validOrganisationData
      );
    });

    it('should handle creation errors', async () => {
      const error = new Error('Database connection failed');
      mockOrganisationService.createOrganisation.mockRejectedValue(error);

      const request = new NextRequest('http://localhost/api/organisation/create', {
        method: 'POST',
        body: JSON.stringify(validOrganisationData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection failed');
    });

    it('should handle unknown errors', async () => {
      mockOrganisationService.createOrganisation.mockRejectedValue('Unknown error');

      const request = new NextRequest('http://localhost/api/organisation/create', {
        method: 'POST',
        body: JSON.stringify(validOrganisationData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Required Fields', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);
    });

    it('should accept minimal required data', async () => {
      const minimalData = { name: 'Minimal Org' };

      const mockSafeParse = jest.fn().mockReturnValue({
        success: true,
        data: minimalData,
      });

      const { z } = require('zod');
      z.object().safeParse = mockSafeParse;

      mockOrganisationService.validateOrganisationName.mockResolvedValue(true);
      mockOrganisationService.createOrganisation.mockResolvedValue({
        ...mockCreatedOrganisation,
        name: 'Minimal Org',
        description: null,
        website: null,
        email: null,
      });

      const request = new NextRequest('http://localhost/api/organisation/create', {
        method: 'POST',
        body: JSON.stringify(minimalData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockOrganisationService.createOrganisation).toHaveBeenCalledWith(
        'user-123',
        minimalData
      );
    });

    it('should accept all optional fields', async () => {
      const fullData = {
        name: 'Full Organisation',
        description: 'Full description',
        website: 'https://full.com',
        address: '123 Main St',
        phone: '+1234567890',
        email: 'full@full.com',
        logo: 'https://logo.com/logo.png',
      };

      const mockSafeParse = jest.fn().mockReturnValue({
        success: true,
        data: fullData,
      });

      const { z } = require('zod');
      z.object().safeParse = mockSafeParse;

      mockOrganisationService.validateOrganisationName.mockResolvedValue(true);
      mockOrganisationService.createOrganisation.mockResolvedValue({
        ...mockCreatedOrganisation,
        ...fullData,
      });

      const request = new NextRequest('http://localhost/api/organisation/create', {
        method: 'POST',
        body: JSON.stringify(fullData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockOrganisationService.createOrganisation).toHaveBeenCalledWith(
        'user-123',
        fullData
      );
    });
  });
});