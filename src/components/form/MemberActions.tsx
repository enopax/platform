'use client';

import { useState } from 'react';
import { Button } from '@/components/common/Button';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {
  RiMoreLine,
  RiDeleteBinLine,
  RiUserStarLine,
  RiUserLine
} from '@remixicon/react';
import { updateMemberRole, removeMember } from '@/actions/teamMember';
import { TeamMember, User, TeamRole } from '@prisma/client';

interface MemberActionsProps {
  teamId: string;
  member: TeamMember & {
    user: User;
  };
  canPromoteToLead?: boolean;
}

export default function MemberActions({ teamId, member, canPromoteToLead = false }: MemberActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleRoleChange = async (newRole: TeamRole) => {
    setIsLoading(true);
    try {
      const result = await updateMemberRole(teamId, member.id, newRole);
      if (result.error) {
        alert(result.error); // In a real app, you'd want better error handling
      }
    } catch (error) {
      alert('Failed to update member role');
    } finally {
      setIsLoading(false);
      setShowActions(false);
    }
  };

  const handleRemoveMember = async () => {
    setIsLoading(true);
    try {
      const result = await removeMember(teamId, member.id);
      if (result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
      setShowActions(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="light"
        size="sm"
        onClick={() => setShowActions(!showActions)}
        disabled={isLoading}
      >
        <RiMoreLine className="w-4 h-4" />
      </Button>

      {showActions && (
        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[150px] z-10">
          {/* Role Change Actions */}
          {canPromoteToLead && (
            <>
              {member.role === 'MEMBER' && (
                <button
                  onClick={() => handleRoleChange('LEAD')}
                  disabled={isLoading}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <RiUserStarLine className="w-4 h-4 mr-2" />
                  Promote to Lead
                </button>
              )}
              {member.role === 'LEAD' && (
                <button
                  onClick={() => handleRoleChange('MEMBER')}
                  disabled={isLoading}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <RiUserLine className="w-4 h-4 mr-2" />
                  Demote to Member
                </button>
              )}
            </>
          )}

          {/* Remove Member */}
          <div className="w-full">
            <ConfirmDialog
              trigger={
                <button
                  disabled={isLoading}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <RiDeleteBinLine className="w-4 h-4 mr-2" />
                  Remove from Team
                </button>
              }
              title="Remove Team Member"
              description={`Are you sure you want to remove "${member.user.name || member.user.email}" from this team?

This will:
• Remove them from the team
• Revoke access to team resources
• Remove their team role and permissions

This action cannot be undone.`}
              confirmText="Remove Member"
              onConfirm={handleRemoveMember}
              isLoading={isLoading}
              variant="danger"
            />
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {showActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
}