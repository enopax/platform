import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  RiUserLine,
  RiUserAddLine,
  RiArrowLeftLine,
  RiTeamLine,
  RiBuildingLine,
  RiSettings3Line,
} from '@remixicon/react';
import Link from 'next/link';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';
import AddMemberForm from '@/components/form/AddMemberForm';
import MemberActions from '@/components/form/MemberActions';
import GenericTable from '@/components/GenericTable';
import { teamMemberColumns, type TeamMemberWithActions } from '@/components/table/TeamMembers';
import TeamStorageForm from '@/components/form/TeamStorageForm';
import { teamStorageService } from '@/lib/services/team-storage';

export default async function TeamMembersPage({
  params,
}: {
  params: Promise<{ orgName: string; teamId: string }>;
}) {
  const { orgName, teamId } = await params;

  // Validate that orgName is provided
  if (!orgName) {
    notFound();
  }

  const session = await auth();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      organisation: {
        select: {
          id: true,
          name: true,
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  firstname: true,
                  lastname: true,
                  email: true,
                }
              }
            }
          }
        }
      },
      owner: {
        select: {
          id: true,
          name: true,
          firstname: true,
          lastname: true,
          email: true,
        }
      },
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
          { role: 'desc' }, // LEAD first, then MEMBER
          { joinedAt: 'asc' }
        ]
      },
    },
  });

  if (!team) {
    notFound();
  }

  // Check if current user can manage this team
  const isOwner = team.ownerId === session.user.id;
  const userMembership = team.members.find(m => m.userId === session.user.id);
  const isTeamLead = userMembership?.role === 'LEAD';
  const canManageMembers = isOwner || isTeamLead;
  const canManagePermissions = isOwner || (userMembership?.canLead === true);

  if (!canManageMembers) {
    notFound();
  }

  // Get team storage resource
  const teamStorage = await teamStorageService.getTeamStorage(team.id);

  const getUserDisplayName = (user: { name?: string | null; firstname?: string | null; lastname?: string | null; email: string }) => {
    if (user.name) return user.name;
    if (user.firstname && user.lastname) return `${user.firstname} ${user.lastname}`;
    if (user.firstname) return user.firstname;
    return user.email;
  };

  // Get organisation members who aren't already team members
  const availableUsers = team.organisation?.members
    ? team.organisation.members
        .filter(orgMember =>
          // Not already a team member
          !team.members.some(teamMember => teamMember.userId === orgMember.userId) &&
          // Not the team owner
          orgMember.userId !== team.ownerId
        )
        .map(orgMember => orgMember.user)
    : [];

  // Debug logging for troubleshooting
  console.log('Team organisation members:', team.organisation?.members?.map(m => ({
    userId: m.userId,
    name: m.user.name,
    email: m.user.email
  })));
  console.log('Current team members:', team.members.map(m => ({
    userId: m.userId,
    name: m.user.name,
    email: m.user.email
  })));
  console.log('Available users for team:', availableUsers.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email
  })));


  // Create team owner as a member entry for the table
  const ownerAsMember = {
    id: 'owner',
    userId: team.owner.id,
    teamId: team.id,
    role: 'OWNER' as const,
    joinedAt: new Date(), // Teams don't track owner join date
    canRead: true,
    canWrite: true,
    canExecute: true,
    canLead: true,
    user: team.owner
  };

  // Combine owner and members for the table
  const allMembers = [
    ownerAsMember,
    ...team.members
  ].map(member => ({
    ...member,
    teamId: team.id,
    currentUserId: session.user.id,
    canManage: canManagePermissions && member.userId !== session.user.id,
    isOwner
  })) as TeamMemberWithActions[];

  return (
    <main className="mt-4">
      <Container>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {team.color && (
                <div
                  className="w-8 h-8 rounded-full border border-gray-300"
                  style={{ backgroundColor: team.color }}
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {team.name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <RiBuildingLine className="w-4 h-4" />
                  {team.organisation?.name || 'Personal Team'}
                </div>
              </div>
            </div>

            {canManageMembers && (
              <div className="flex items-center gap-3">
                <Link href={`/orga/${orgName}/teams/${team.id}/settings`}>
                  <Button variant="outline" size="sm">
                    <RiSettings3Line className="mr-2 h-4 w-4" />
                    Team Settings
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members Table */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Team Members ({allMembers.length})
            </h2>
            
            <GenericTable
              pageNumber={1}
              tableSize={allMembers.length}
              tableData={allMembers}
              tableColumns={teamMemberColumns}
            />
          </div>

          {/* Add New Member */}
          <div>
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Add Team Member
              </h2>

              {availableUsers.length > 0 ? (
                <AddMemberForm 
                  teamId={team.id} 
                  availableUsers={availableUsers}
                />
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <RiUserAddLine className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p className="mb-2">No available users to add</p>
                  <p className="text-sm">
                    {team.organisation
                      ? 'All organisation members are already part of this team, or you may need to add more members to the organisation first.'
                      : 'This is a personal team. To add members, first create or join an organisation.'
                    }
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}