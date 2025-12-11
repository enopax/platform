'use client';

import { useOrganisation } from '@/contexts/OrganisationContext';
import Container from '@/components/common/Container';
import { RiShieldLine, RiUserLine } from '@remixicon/react';
import { Badge } from '@/components/common/Badge';

interface Member {
  id: string;
  role: 'OWNER' | 'MANAGER' | 'MEMBER';
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    firstname: string | null;
    lastname: string | null;
    email: string;
    image: string | null;
  };
}

interface RolesManagementClientProps {
  members: Member[];
}

export function RolesManagementClient({
  members
}: RolesManagementClientProps) {
  const organisation = useOrganisation();

  // Group members by role
  const membersByRole = {
    OWNER: members.filter(m => m.role === 'OWNER'),
    MANAGER: members.filter(m => m.role === 'MANAGER'),
    MEMBER: members.filter(m => m.role === 'MEMBER'),
  };

  const roleDescriptions = {
    OWNER: 'Full access to all organisation features and member management',
    MANAGER: 'Can manage teams, projects, and members (with restrictions)',
    MEMBER: 'Can view and work with assigned projects and resources',
  };

  const roleIcons = {
    OWNER: RiShieldLine,
    MANAGER: RiUserLine,
    MEMBER: RiUserLine,
  };

  return (
    <main className="mt-4">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Roles & Permissions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage user roles and permissions within {organisation.name}
          </p>
        </div>

        <div className="space-y-8">
          {(['OWNER', 'MANAGER', 'MEMBER'] as const).map((role) => {
            const roleMembers = membersByRole[role];
            const Icon = roleIcons[role];
            const description = roleDescriptions[role];

            return (
              <div key={role} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Role Header */}
                <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{role}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
                      </div>
                    </div>
                    <Badge>
                      {roleMembers.length}
                    </Badge>
                  </div>
                </div>

                {/* Members List */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {roleMembers.length > 0 ? (
                    roleMembers.map((member) => (
                      <div key={member.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {member.user.image ? (
                              <img
                                src={member.user.image}
                                alt={member.user.name || member.user.email}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <RiUserLine className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {member.user.name || `${member.user.firstname} ${member.user.lastname}`.trim() || 'Unknown'}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {member.user.email}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Joined {new Date(member.joinedAt).toLocaleDateString('en-GB')}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No members with this role
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </main>
  );
}
