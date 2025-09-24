'use client';

import { Button } from '@/components/common/Button';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Callout } from '@/components/common/Callout';
import { deleteOrganisation } from '@/actions/organisation';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { RiDeleteBin7Line, RiErrorWarningLine } from '@remixicon/react';

interface DeleteOrganisationButtonProps {
  organisationId: string;
  organisationName: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'light';
  className?: string;
}

export default function DeleteOrganisationButton({
  organisationId,
  organisationName,
  size = 'md',
  variant = 'outline',
  className = ''
}: DeleteOrganisationButtonProps) {
  const { isLoading, error, executeAction } = useConfirmAction({
    redirectTo: '/main/organisations',
    refreshOnSuccess: true,
  });

  const handleDelete = async () => {
    return executeAction(async () => {
      console.log('Attempting to delete organisation:', organisationId);
      const result = await deleteOrganisation(organisationId);
      console.log('Delete result:', result);

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <Callout variant="destructive">
          <RiErrorWarningLine className="h-4 w-4" />
          {error}
        </Callout>
      )}

      <ConfirmDialog
        trigger={
          <Button
            variant={variant}
            size={size}
            className={`${className} text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-700`}
          >
            <RiDeleteBin7Line className="w-4 h-4 mr-1" />
            Delete Organisation
          </Button>
        }
        title="Delete Organisation"
        description={`Are you sure you want to delete "${organisationName}"?

This will permanently remove:
• The organisation
• All teams within the organisation
• All join requests
• All associated data

This action cannot be undone.`}
        confirmText="Delete Organisation"
        requiredInput="DELETE"
        onConfirm={handleDelete}
        isLoading={isLoading}
        variant="danger"
      />
    </div>
  );
}