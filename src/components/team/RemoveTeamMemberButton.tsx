'use client';

import { Button } from '@/components/common/Button';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Callout } from '@/components/common/Callout';
import { removeTeamMember } from '@/actions/team';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { RiUserUnfollowLine, RiErrorWarningLine } from '@remixicon/react';

interface RemoveTeamMemberButtonProps {
  teamId: string;
  userId: string;
  displayName: string;
}

export default function RemoveTeamMemberButton({ teamId, userId, displayName }: RemoveTeamMemberButtonProps) {
  const { isLoading, error, executeAction } = useConfirmAction({
    refreshOnSuccess: true,
  });

  const handleRemove = async () => {
    return executeAction(async () => {
      const result = await removeTeamMember(teamId, userId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    });
  };

  return (
    <div>
      {error && (
        <Callout variant="error" title="Error" icon={RiErrorWarningLine} className="mb-2">
          {error}
        </Callout>
      )}
      <ConfirmDialog
        trigger={
          <Button variant="light">
            <RiUserUnfollowLine className="w-4 h-4 mr-1" />
            Remove
          </Button>
        }
        title="Remove member"
        description={`Remove ${displayName} from this team? They will lose access to projects granted through this team.`}
        confirmText="Remove"
        onConfirm={handleRemove}
        isLoading={isLoading}
        variant="warning"
      />
    </div>
  );
}
