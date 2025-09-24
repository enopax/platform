'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { RiUserLine, RiUserUnfollowLine, RiUserForbidLine } from '@remixicon/react';
import { useState } from 'react';
import { kickMember } from '@/actions/organisationJoinRequest';

interface OrganisationMember {
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

type OrganisationMemberWithActions = OrganisationMember & {
  organisationId: string;
  currentUserId: string;
  isAdmin: boolean;
  canManageMembers: boolean;
};

const MemberActions = ({ member }: { member: OrganisationMemberWithActions }) => {
  const [processing, setProcessing] = useState(false);
  const canManage = member.canManageMembers && member.role !== 'OWNER';
  const isCurrentUser = member.user.id === member.currentUserId;
  const isOwner = member.role === 'OWNER';

  // Only show kick action for non-owners and non-current user
  if (!canManage || isCurrentUser || isOwner) {
    return null;
  }

  const handleKick = async () => {
    setProcessing(true);
    try {
      const result = await kickMember(member.organisationId, member.user.id);
      if (result.error) {
        console.error('Failed to remove member:', result.error);
        throw new Error(result.error);
      } else {
        // Success - refresh the page to show updated member list
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to kick member:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const memberDisplayName = member.user.name || member.user.email;

  return (
    <div className="flex gap-1 justify-end">
      <ConfirmDialog
        trigger={
          <Button
            size="sm"
            variant="outline"
            disabled={processing}
            className="text-red-600 hover:bg-red-50 border-red-200"
            title={`Remove ${memberDisplayName} from organisation`}
          >
            <RiUserForbidLine className="w-4 h-4 mr-1" />
            Kick
          </Button>
        }
        title="Remove Member from Organisation"
        description={`Are you sure you want to remove "${memberDisplayName}" from this organisation?

This will:
• Remove them from the organisation
• Remove them from all teams within the organisation
• Revoke access to all organisation resources

This action cannot be undone.`}
        confirmText="Remove Member"
        onConfirm={handleKick}
        isLoading={processing}
        variant="danger"
      />
    </div>
  );
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'OWNER': return 'default';
    case 'MANAGER': return 'secondary';
    case 'MEMBER': return 'outline';
    default: return 'outline';
  }
};

const organisationMemberColumns: ColumnDef<OrganisationMemberWithActions>[] = [
  {
    header: 'Member',
    accessorKey: 'user',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => {
      const { user } = row.original;
      const displayName = user.name || 
        (user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : user.firstname) || 
        user.email;
      
      return (
        <div className="flex items-center">
          {user.image ? (
            <img 
              src={user.image} 
              alt={displayName} 
              className="w-6 h-6 rounded-full mr-2 object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 mr-2 flex items-center justify-center">
              <RiUserLine className="w-3 h-3 text-gray-500" />
            </div>
          )}
          <div>
            <div className="font-medium text-sm">{displayName}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    header: 'Role',
    accessorKey: 'role',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <Badge variant={getRoleBadgeVariant(row.original.role)} className="text-xs">
        {row.original.role}
      </Badge>
    ),
  },
  {
    header: 'Joined',
    accessorKey: 'joinedAt',
    meta: {
      align: 'text-left',
    },
    cell: ({ row }) => (
      <span className="text-sm">
        {new Date(row.original.joinedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </span>
    ),
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    meta: {
      align: 'text-right',
    },
    cell: ({ row }) => (
      <MemberActions member={row.original} />
    ),
  },
];

export { organisationMemberColumns, type OrganisationMemberWithActions };