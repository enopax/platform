'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Callout } from '@/components/common/Callout';
import { deleteTeam } from '@/actions/team';
import { RiDeleteBin7Line, RiErrorWarningLine } from '@remixicon/react';

interface DeleteTeamButtonProps {
  teamId: string;
  teamName: string;
  organisationId?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'light';
  className?: string;
}

export default function DeleteTeamButton({
  teamId,
  teamName,
  organisationId,
  size = 'sm',
  variant = 'outline',
  className = ''
}: DeleteTeamButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteTeam(teamId);

      if (result.error) {
        setError(result.error);
        throw new Error(result.error);
      } else {
        // Navigate to teams list or organisation page
        if (organisationId) {
          router.push(`/main/organisations/${organisationId}`);
        } else {
          router.push('/main/teams');
        }
        router.refresh();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete team';
      setError(errorMessage);
      throw error;
    } finally {
      setIsDeleting(false);
    }
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
            Delete Team
          </Button>
        }
        title="Delete Team"
        description={`Are you sure you want to delete "${teamName}"?

This will permanently remove:
• The team
• All team members
• All team files and data
• All associated resources

This action cannot be undone.`}
        confirmText="Delete Team"
        requiredInput="DELETE"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}