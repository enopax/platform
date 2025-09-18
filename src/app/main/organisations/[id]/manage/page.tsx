import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Callout } from '@/components/common/Callout';
import Link from 'next/link';
import { RiArrowLeftLine, RiUserLine, RiMailLine, RiTeamLine, RiAlertLine } from '@remixicon/react';
import EditOrganisationForm from '@/components/form/EditOrganisationForm';
import GenericTable from '@/components/GenericTable';
import MemberList from '@/components/MemberList';
import { membershipRequestColumns, type MembershipRequestWithActions } from '@/components/table/MembershipRequests';
import { organisationMemberColumns, type OrganisationMemberWithActions } from '@/components/table/OrganisationMembers';

interface ManageOrganisationPageProps {
  params: Promise<{ id: string }>;
}


export default async function ManageOrganisationPage({ params }: ManageOrganisationPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  // Fetch the organisation with owner info, members, and join requests
  const organisation = await prisma.organisation.findUnique({
    where: { id },
    include: {
      owner: true,
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
          projects: true,
          joinRequests: true
        }
      }
    }
  });

  if (!organisation) {
    notFound();
  }

  // Check if user is the owner or admin
  const isAdmin = session.user.role === 'ADMIN';
  const isOwner = organisation.ownerId === session.user.id;
  
  if (!isOwner && !isAdmin) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <Link 
          href="/main/organisations" 
          className="inline-flex items-center text-brand-600 dark:text-brand-400 hover:text-brand-700 mb-4"
        >
          <RiArrowLeftLine className="mr-2 h-4 w-4" />
          Back to Organisations
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manage {organisation.name}
          </h1>
          {isAdmin && !isOwner && (
            <Badge variant="secondary" className="text-xs">
              Admin Access
            </Badge>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          {isAdmin && !isOwner 
            ? 'Managing organisation with admin privileges.' 
            : "Update your organisation's details and manage membership requests."}
        </p>
      </div>

      {/* New Requests Notification */}
      {organisation.joinRequests.length > 0 && (
        <Callout 
          icon={RiAlertLine}
          variant="warning"
          title="New membership requests!"
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            {organisation.joinRequests.length} user{organisation.joinRequests.length !== 1 ? 's' : ''} waiting for approval.
            <Link href={`/main/organisations/${organisation.id}/members`}>
              <Button size="sm" variant="outline">
                Review Requests
              </Button>
            </Link>
          </div>
        </Callout>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main Content - Left side */}
        <div className="lg:col-span-3">
          <EditOrganisationForm 
            organisation={organisation}
            userId={session.user.id}
            isAdmin={isAdmin}
          />
        </div>

        {/* Right Sidebar - Small User List */}
        <div className="lg:col-span-2">
          <MemberList 
            members={organisation.members || []}
            title="Members"
            compact={true}
            maxHeight="max-h-80"
            showJoinDate={false}
          />

           {/* View All Members Button */}
          <div className="mt-4">
            <Link href={`/main/organisations/${organisation.id}/members`}>
              <Button variant="outline" className="w-full text-sm relative">
                <RiTeamLine className="mr-2 h-4 w-4" />
                Manage Members
                {organisation.joinRequests.length > 0 && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {organisation.joinRequests.length}
                  </span>
                )}
              </Button>
            </Link>
          </div>
          
         
        </div>
      </div>
    </div>
  );
}