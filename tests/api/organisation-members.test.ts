/**
 * Tests for GET /api/organisation/[id]/members API route
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/organisation/[id]/members/route';
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
    getOrganisationMembers: jest.fn(),
  },
}));

describe('GET /api/organisation/[id]/members', () => {
  // Get the mocked service
  const { organisationService: mockOrganisationService } = require('@/lib/services/organisation');

  const mockSession = {
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
  };

  const mockMembers = [
    {
      id: 'member-1',
      role: 'OWNER',
      joinedAt: new Date('2024-01-01'),
      user: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        image: 'https://avatar.com/john.jpg',
      },
    },
    {
      id: 'member-2',
      role: 'MANAGER',
      joinedAt: new Date('2024-01-02'),
      user: {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        image: 'https://avatar.com/jane.jpg',
      },
    },
    {
      id: 'member-3',
      role: 'MEMBER',
      joinedAt: new Date('2024-01-03'),
      user: {
        id: 'user-3',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        image: null,
      },
    },
  ];

  const mockParams = { params: { id: 'org-123' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockOrganisationService.isUserMember).not.toHaveBeenCalled();
      expect(mockOrganisationService.getOrganisationMembers).not.toHaveBeenCalled();
    });

    it('should proceed when user is authenticated', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockOrganisationService.isUserMember.mockResolvedValue(true);
      mockOrganisationService.getOrganisationMembers.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);

      expect(response.status).toBe(200);
      expect(mockAuth).toHaveBeenCalledTimes(1);
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);
    });

    it('should return 403 when user is not a member of the organisation', async () => {
      mockOrganisationService.isUserMember.mockResolvedValue(false);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
      expect(mockOrganisationService.isUserMember).toHaveBeenCalledWith('user-123', 'org-123');
      expect(mockOrganisationService.getOrganisationMembers).not.toHaveBeenCalled();
    });

    it('should proceed when user is a member of the organisation', async () => {
      mockOrganisationService.isUserMember.mockResolvedValue(true);
      mockOrganisationService.getOrganisationMembers.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);

      expect(response.status).toBe(200);
      expect(mockOrganisationService.isUserMember).toHaveBeenCalledWith('user-123', 'org-123');
      expect(mockOrganisationService.getOrganisationMembers).toHaveBeenCalledWith('org-123');
    });
  });

  describe('Members Retrieval', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);
      mockOrganisationService.isUserMember.mockResolvedValue(true);
    });

    it('should return empty list when organisation has no members', async () => {
      mockOrganisationService.getOrganisationMembers.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.members).toEqual([]);
      expect(mockOrganisationService.getOrganisationMembers).toHaveBeenCalledWith('org-123');
    });

    it('should return list of organisation members with user details', async () => {
      mockOrganisationService.getOrganisationMembers.mockResolvedValue(mockMembers);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.members).toHaveLength(3);

      // Check first member (Owner)
      expect(data.members[0]).toEqual({
        id: 'member-1',
        role: 'OWNER',
        joinedAt: mockMembers[0].joinedAt,
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          image: 'https://avatar.com/john.jpg',
        },
      });

      // Check second member (Manager)
      expect(data.members[1]).toEqual({
        id: 'member-2',
        role: 'MANAGER',
        joinedAt: mockMembers[1].joinedAt,
        user: {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          image: 'https://avatar.com/jane.jpg',
        },
      });

      // Check third member (Member with null image)
      expect(data.members[2]).toEqual({
        id: 'member-3',
        role: 'MEMBER',
        joinedAt: mockMembers[2].joinedAt,
        user: {
          id: 'user-3',
          name: 'Bob Wilson',
          email: 'bob@example.com',
          image: null,
        },
      });

      expect(mockOrganisationService.getOrganisationMembers).toHaveBeenCalledWith('org-123');
    });

    it('should return single member in list', async () => {
      const singleMember = [mockMembers[0]];
      mockOrganisationService.getOrganisationMembers.mockResolvedValue(singleMember);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.members).toHaveLength(1);
      expect(data.members[0].id).toBe('member-1');
      expect(data.members[0].role).toBe('OWNER');
    });

    it('should handle members with different roles correctly', async () => {
      mockOrganisationService.getOrganisationMembers.mockResolvedValue(mockMembers);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      const roles = data.members.map(member => member.role);
      expect(roles).toContain('OWNER');
      expect(roles).toContain('MANAGER');
      expect(roles).toContain('MEMBER');
    });

    it('should handle members with null user name gracefully', async () => {
      const membersWithNullName = [
        {
          ...mockMembers[0],
          user: {
            ...mockMembers[0].user,
            name: null,
          },
        },
      ];

      mockOrganisationService.getOrganisationMembers.mockResolvedValue(membersWithNullName);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.members[0].user.name).toBeNull();
      expect(data.members[0].user.email).toBe('john@example.com');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);
      mockOrganisationService.isUserMember.mockResolvedValue(true);
    });

    it('should handle database connection errors', async () => {
      const error = new Error('Database connection failed');
      mockOrganisationService.getOrganisationMembers.mockRejectedValue(error);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection failed');
      expect(mockOrganisationService.getOrganisationMembers).toHaveBeenCalledWith('org-123');
    });

    it('should handle service unavailable errors', async () => {
      const error = new Error('Service temporarily unavailable');
      mockOrganisationService.getOrganisationMembers.mockRejectedValue(error);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Service temporarily unavailable');
    });

    it('should handle unknown errors gracefully', async () => {
      mockOrganisationService.getOrganisationMembers.mockRejectedValue('Unknown error');

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle membership check errors', async () => {
      const membershipError = new Error('Membership check failed');
      mockOrganisationService.isUserMember.mockRejectedValue(membershipError);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Membership check failed');
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);
      mockOrganisationService.isUserMember.mockResolvedValue(true);
    });

    it('should return consistent response format', async () => {
      mockOrganisationService.getOrganisationMembers.mockResolvedValue(mockMembers);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('members');
      expect(data.success).toBe(true);
      expect(Array.isArray(data.members)).toBe(true);
    });

    it('should include all required member fields', async () => {
      mockOrganisationService.getOrganisationMembers.mockResolvedValue([mockMembers[0]]);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);
      const data = await response.json();

      const member = data.members[0];
      const requiredMemberFields = ['id', 'role', 'joinedAt', 'user'];
      const requiredUserFields = ['id', 'name', 'email', 'image'];

      requiredMemberFields.forEach(field => {
        expect(member).toHaveProperty(field);
      });

      requiredUserFields.forEach(field => {
        expect(member.user).toHaveProperty(field);
      });
    });

    it('should maintain correct data types in response', async () => {
      mockOrganisationService.getOrganisationMembers.mockResolvedValue([mockMembers[0]]);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);
      const data = await response.json();

      const member = data.members[0];

      expect(typeof member.id).toBe('string');
      expect(typeof member.role).toBe('string');
      expect(member.joinedAt).toBeInstanceOf(Date);
      expect(typeof member.user).toBe('object');
      expect(typeof member.user.id).toBe('string');
      expect(typeof member.user.email).toBe('string');
    });
  });

  describe('Different Organisation IDs', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);
      mockOrganisationService.isUserMember.mockResolvedValue(true);
      mockOrganisationService.getOrganisationMembers.mockResolvedValue([]);
    });

    it('should handle different organisation IDs correctly', async () => {
      const orgParams = { params: { id: 'org-different' } };

      const request = new NextRequest('http://localhost/api/organisation/org-different/members');
      await GET(request, orgParams);

      expect(mockOrganisationService.isUserMember).toHaveBeenCalledWith('user-123', 'org-different');
      expect(mockOrganisationService.getOrganisationMembers).toHaveBeenCalledWith('org-different');
    });

    it('should handle UUID-style organisation IDs', async () => {
      const uuidOrgId = '550e8400-e29b-41d4-a716-446655440000';
      const orgParams = { params: { id: uuidOrgId } };

      const request = new NextRequest(`http://localhost/api/organisation/${uuidOrgId}/members`);
      await GET(request, orgParams);

      expect(mockOrganisationService.isUserMember).toHaveBeenCalledWith('user-123', uuidOrgId);
      expect(mockOrganisationService.getOrganisationMembers).toHaveBeenCalledWith(uuidOrgId);
    });

    it('should handle short organisation IDs', async () => {
      const shortOrgId = '123';
      const orgParams = { params: { id: shortOrgId } };

      const request = new NextRequest(`http://localhost/api/organisation/${shortOrgId}/members`);
      await GET(request, orgParams);

      expect(mockOrganisationService.isUserMember).toHaveBeenCalledWith('user-123', shortOrgId);
      expect(mockOrganisationService.getOrganisationMembers).toHaveBeenCalledWith(shortOrgId);
    });
  });

  describe('Performance Considerations', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);
      mockOrganisationService.isUserMember.mockResolvedValue(true);
    });

    it('should handle large member lists efficiently', async () => {
      // Create a large list of mock members
      const largeMemberList = Array.from({ length: 200 }, (_, index) => ({
        id: `member-${index}`,
        role: index === 0 ? 'OWNER' : index < 10 ? 'MANAGER' : 'MEMBER',
        joinedAt: new Date(`2024-01-${String(Math.min(index + 1, 28)).padStart(2, '0')}`),
        user: {
          id: `user-${index}`,
          name: `User ${index}`,
          email: `user${index}@example.com`,
          image: index % 2 === 0 ? `https://avatar.com/user${index}.jpg` : null,
        },
      }));

      mockOrganisationService.getOrganisationMembers.mockResolvedValue(largeMemberList);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      const response = await GET(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.members).toHaveLength(200);
      expect(mockOrganisationService.getOrganisationMembers).toHaveBeenCalledTimes(1);
    });

    it('should call services only once per request', async () => {
      mockOrganisationService.getOrganisationMembers.mockResolvedValue(mockMembers);

      const request = new NextRequest('http://localhost/api/organisation/org-123/members');
      await GET(request, mockParams);

      expect(mockOrganisationService.isUserMember).toHaveBeenCalledTimes(1);
      expect(mockOrganisationService.getOrganisationMembers).toHaveBeenCalledTimes(1);
    });
  });
});