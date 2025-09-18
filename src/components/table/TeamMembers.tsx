'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { RiUserLine, RiUserUnfollowLine, RiArrowUpLine } from '@remixicon/react';
import { useState } from 'react';
import { removeMember, promoteMember, demoteMember } from '@/actions/teamMember';

interface TeamMember {
  id: string;
  role: 'OWNER' | 'LEAD' | 'MEMBER';
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

type TeamMemberWithActions = TeamMember & {
  teamId: string;
  currentUserId: string;
  canManage: boolean;
  isOwner: boolean;
};

const MemberActions = ({ member }: { member: TeamMemberWithActions }) => {
  const [processing, setProcessing] = useState(false);
  const isCurrentUser = member.user.id === member.currentUserId;
  const isOwner = member.role === 'OWNER';
  const isLead = member.role === 'LEAD';

  // Don't show actions for owner or current user
  if (!member.canManage || isCurrentUser || isOwner) {
    return null;
  }

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove ${member.user.name || member.user.email} from this team?`)) {
      return;
    }

    setProcessing(true);
    try {
      const result = await removeMember(member.teamId, member.user.id);
      if (result.error) {
        console.error('Failed to remove member:', result.error);
        alert(`Failed to remove member: ${result.error}`);
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePromote = async () => {
    if (!confirm(`Are you sure you want to promote ${member.user.name || member.user.email} to Team Lead?`)) {
      return;
    }

    setProcessing(true);
    try {
      const result = await promoteMember(member.teamId, member.user.id);
      if (result.error) {
        console.error('Failed to promote member:', result.error);
        alert(`Failed to promote member: ${result.error}`);
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to promote member:', error);
      alert('Failed to promote member. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDemote = async () => {
    if (!confirm(`Are you sure you want to demote ${member.user.name || member.user.email} from Team Lead?`)) {
      return;
    }

    setProcessing(true);
    try {
      const result = await demoteMember(member.teamId, member.user.id);
      if (result.error) {
        console.error('Failed to demote member:', result.error);
        alert(`Failed to demote member: ${result.error}`);
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to demote member:', error);
      alert('Failed to demote member. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex gap-1 justify-end">
      {/* Only owners can promote/demote */}
      {member.isOwner && (
        <Button
          size="sm"
          variant="outline"
          onClick={isLead ? handleDemote : handlePromote}
          disabled={processing}
          className="text-blue-600 hover:bg-blue-50 border-blue-200"
          title={isLead ? `Demote ${member.user.name || member.user.email}` : `Promote ${member.user.name || member.user.email} to Team Lead`}
        >
          {isLead ? 'Demote': 'Promote'}
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={handleRemove}
        disabled={processing}
        className="text-red-600 hover:bg-red-50 border-red-200"
        title={`Remove ${member.user.name || member.user.email} from team`}
      >
        Kick
      </Button>
    </div>
  );
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'OWNER': return 'default';
    case 'LEAD': return 'secondary';
    case 'MEMBER': return 'outline';
    default: return 'outline';
  }
};

const teamMemberColumns: ColumnDef<TeamMemberWithActions>[] = [
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
        {row.original.role === 'OWNER' ? 'Owner' : 
         row.original.role === 'LEAD' ? 'Team Lead' : 'Member'}
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
        {row.original.role === 'OWNER' ? 'Owner' :
         new Date(row.original.joinedAt).toLocaleDateString('en-US', {
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

export { teamMemberColumns, type TeamMemberWithActions };