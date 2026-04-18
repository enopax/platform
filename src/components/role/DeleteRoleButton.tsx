'use client';

import { Button } from '@/components/common/Button';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Callout } from '@/components/common/Callout';
import { deleteProjectRole } from '@/actions/project-role';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { RiDeleteBin7Line, RiErrorWarningLine } from '@remixicon/react';

interface DeleteRoleButtonProps {
  roleId: string;
  roleName: string;
  organisationName: string;
}

export function DeleteRoleButton({ roleId, roleName, organisationName }: DeleteRoleButtonProps) {
  const { isLoading, error, executeAction } = useConfirmAction({
    redirectTo: `/${organisationName}/roles`,
  });

  const handleDelete = async () => {
    return executeAction(async () => {
      const result = await deleteProjectRole(roleId);
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
            Delete role
          </Button>
        }
        title="Delete role"
        description={`Are you sure you want to delete "${roleName}"?\n\nAny teams currently using this role will lose their access.\n\nThis action cannot be undone.`}
        confirmText="Delete role"
        requiredInput="DELETE"
        onConfirm={handleDelete}
        isLoading={isLoading}
        variant="danger"
      />
    </div>
  );
}
