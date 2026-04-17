'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acceptInvitation } from '@/actions/invitation';
import { Button } from '@/components/common/Button';

interface AcceptInvitationButtonProps {
  token: string;
  organisationName: string;
}

export default function AcceptInvitationButton({ token, organisationName }: AcceptInvitationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAccept = () => {
    setError(null);
    startTransition(async () => {
      const result = await acceptInvitation(token);
      if (!result.success) {
        setError(result.error || 'Failed to accept invitation.');
        return;
      }
      router.push(`/${result.organisationName || organisationName}`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      <Button className="w-full" onClick={handleAccept} disabled={isPending}>
        {isPending ? 'Joining…' : `Join ${organisationName}`}
      </Button>
    </div>
  );
}
