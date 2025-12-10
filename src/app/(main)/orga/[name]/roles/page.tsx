import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Badge } from '@/components/common/Badge';
import { RiShieldLine, RiUserLine } from '@remixicon/react';

interface RolesPageProps {
  params: Promise<{ name: string }>;
}

export default async function RolesPage({ params }: RolesPageProps) {
  const { name } = await params;
  const session = await auth();

  // Validate that name is provided
  if (!name) {
    notFound();
  }

  // Get organisation by name first
  const orgLookup = await prisma.organisation.findUnique({
    where: { name },
    select: { id: true }
  });
  if (!orgLookup) notFound();
  const organisationId = orgLookup.id;

  // Check if user is a member of this organisation
  const membership = await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId
      }
    }
  });

  const isAdmin = session.user.role === 'ADMIN';
  const isOwner = membership?.role === 'OWNER';
  const isManager = membership?.role === 'MANAGER';

  if (!membership && !isAdmin) {
    notFound();
  }

  // Fetch the organisation with members grouped by role
  const organisation = await prisma.organisation.findUnique({
    where: { id: organisationId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstname: true,
              lastname: true,
              email: true,
              image: true,
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { joinedAt: 'asc' }
        ]
      }
    }
  });

  if (!organisation) {
    notFound();
  }

  // Group members by role
  const membersByRole = {
    OWNER: organisation.members.filter(m => m.role === 'OWNER'),
    MANAGER: organisation.members.filter(m => m.role === 'MANAGER'),
    MEMBER: organisation.members.filter(m => m.role === 'MEMBER'),
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

  const roleColors = {
    OWNER: 'red',
    MANAGER: 'amber',
    MEMBER: 'blue',
  };

  return (
    <main className="mt-4">
      <Container>
        <Headline>Roles & Permissions</Headline>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Manage user roles and permissions within your organisation
        </p>

        <div className="space-y-8">
          {['OWNER', 'MANAGER', 'MEMBER'].map((role: string) => {
            const members = membersByRole[role as keyof typeof membersByRole];
            const Icon = roleIcons[role as keyof typeof roleIcons];
            const color = roleColors[role as keyof typeof roleColors];
            const description = roleDescriptions[role as keyof typeof roleDescriptions];

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
                    <Badge variant={color === 'red' ? 'error' : color === 'amber' ? 'warning' : 'default'}>
                      {members.length}
                    </Badge>
                  </div>
                </div>

                {/* Members List */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {members.length > 0 ? (
                    members.map((member) => (
                      <div key={member.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {member.user.name || `${member.user.firstname} ${member.user.lastname}`}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {member.user.email}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
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
