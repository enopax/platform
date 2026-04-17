'use client';

import { Button } from '@/components/common/Button';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Callout } from '@/components/common/Callout';
import { deleteTeam } from '@/actions/team';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { RiDeleteBin7Line, RiErrorWarningLine } from '@remixicon/react';

interface DeleteTeamButtonProps {
  teamId: string;
  teamName: string;
  organisationName: string;
}

export default function DeleteTeamButton({ teamId, teamName, organisationName }: DeleteTeamButtonProps) {
  const { isLoading, error, executeAction } = useConfirmAction({
    redirectTo: `/${organisationName}/teams`,
  });

  const handleDelete = async () => {
    return executeAction(async () => {
      const result = await deleteTeam(teamId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <Callout variant="error" title="Error" icon={RiErrorWarningLine}>
          {error}
        </Callout>
      )}
      <ConfirmDialog
        trigger={
          <Button
            variant="secondary"
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-700"
          >
            <RiDeleteBin7Line className="w-4 h-4 mr-1" />
            Delete team
          </Button>
        }
        title="Delete team"
        description={`Are you sure you want to delete "${teamName}"?\n\nThis will permanently remove the team and all its member associations.\n\nThis action cannot be undone.`}
        confirmText="Delete team"
        requiredInput="DELETE"
        onConfirm={handleDelete}
        isLoading={isLoading}
        variant="danger"
      />
    </div>
  );
}
