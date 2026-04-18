'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { declineShare } from '@/actions/project-share';
import { Button } from '@/components/common/Button';
import { RiCloseLine } from '@remixicon/react';

interface DeclineShareButtonProps {
  shareId: string;
  organisationName: string;
  projectName: string;
}

export default function DeclineShareButton({ shareId, organisationName, projectName }: DeclineShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDecline = async () => {
    if (!confirm(`Decline invitation to collaborate on "${projectName}"?`)) return;
    setLoading(true);
    const result = await declineShare(shareId);
    setLoading(false);
    if (result.success) {
      router.refresh();
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-700"
      onClick={handleDecline}
      disabled={loading}
    >
      <RiCloseLine className="w-4 h-4 mr-1" />
      {loading ? 'Declining…' : 'Decline'}
    </Button>
  );
}
