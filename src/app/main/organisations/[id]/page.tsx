import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Callout } from '@/components/common/Callout';
import Link from 'next/link';
import { RiArrowLeftLine, RiUserAddLine, RiAlertLine, RiSettings3Line } from '@remixicon/react';
import Table from '@/components/GenericTable';
import { membershipRequestColumns, type MembershipRequestWithActions } from '@/components/table/MembershipRequests';
import { organisationMemberColumns, type OrganisationMemberWithActions } from '@/components/table/OrganisationMembers';
import Modal from '@/components/common/Modal';
import OrganisationSettingsForm from '@/components/form/OrganisationSettingsForm';

interface MembersManagementPageProps {
  params: Promise<{ id: string }>;
}

export default async function MembersManagementPage({ params }: MembersManagementPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  // Check if user is the owner or admin
  const isAdmin = session.user.role === 'ADMIN';
  
  // Check if user is a member of this organisation
  const membership = await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId: id
      }
    }
  });

  const isOwner = membership?.role === 'OWNER';
  const isManager = membership?.role === 'MANAGER';
  const isMember = !!membership;
  
  // Anyone can view the page, but need to be a member or admin to see details
  if (!isMember && !isAdmin) {
    notFound();
  }

  // Only owners, managers, and admins can access member management actions
  const canManageMembers = isOwner || isManager || isAdmin;

  // Fetch the organisation with members and join requests
  const organisation = await prisma.organisation.findUnique({
    where: {
      id,
      isActive: true
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          firstname: true,
          lastname: true,
          email: true,
          image: true,
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
          { role: 'asc' }, // OWNER first, then MANAGER, then MEMBER
          { joinedAt: 'asc' }
        ]
      },
      joinRequests: {
        where: { status: 'PENDING' },
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
        orderBy: { requestedAt: 'desc' }
      },
      _count: {
        select: {
          members: true,
          teams: true,
          joinRequests: true
        }
      }
    }
  });

  if (!organisation) {
    notFound();
  }

  const hasNewRequests = organisation.joinRequests.length > 0;

  return (
    <main className="mt-4">
      <Container>
        {/* Back Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Headline>{organisation.name}</Headline>
            {organisation.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {organisation.description}
              </p>
            )}
            {!canManageMembers && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Organisation member view
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {canManageMembers && (
              <Modal
                trigger={
                  <Button variant="outline">
                    <RiSettings3Line className="mr-2 h-4 w-4" />
                    Organisation Settings
                  </Button>
                }
                title="Organisation Settings"
                description="Update your organisation information and settings"
              >
                <OrganisationSettingsForm organisation={organisation} />
              </Modal>
            )}
            {canManageMembers && (
              <Button>
                <RiUserAddLine className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            )}
          </div>
        </div>

        {/* New Requests Notification */}
        {hasNewRequests && canManageMembers && (
          <Callout 
            icon={RiAlertLine}
            variant="warning"
            title="New membership requests!"
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              {organisation.joinRequests.length} user{organisation.joinRequests.length !== 1 ? 's' : ''} waiting for approval.
            </div>
          </Callout>
        )}

        {/* Join Requests Section */}
        {hasNewRequests && canManageMembers && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Pending Requests ({organisation.joinRequests.length})
            </h2>
            
            <Table
              pageNumber={1}
              tableSize={organisation.joinRequests.length}
              tableData={organisation.joinRequests.map(request => ({ 
                ...request, 
                organisationId: organisation.id 
              }) as MembershipRequestWithActions)}
              tableColumns={membershipRequestColumns}
            />
          </div>
        )}

        {/* Members Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Organisation Members ({organisation.members.length})
          </h2>
          
          {organisation.members.length > 0 ? (
            <Table
              pageNumber={1}
              tableSize={organisation.members.length}
              tableData={organisation.members.map(member => ({ 
                ...member, 
                organisationId: organisation.id,
                currentUserId: session.user.id,
                isAdmin,
                canManageMembers
              }) as OrganisationMemberWithActions)}
              tableColumns={organisationMemberColumns}
            />
          ) : (
            <p className="my-20">
              No members available
            </p>
          )}
        </div>
      </Container>
    </main>
  );
}