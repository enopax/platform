'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { revokeShare } from '@/actions/project-share';
import { Button } from '@/components/common/Button';
import { RiDeleteBin7Line } from '@remixicon/react';

interface RevokeShareButtonProps {
  shareId: string;
  entityName: string;
}

export default function RevokeShareButton({ shareId, entityName }: RevokeShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRevoke = async () => {
    if (!confirm(`Remove sharing with "${entityName}"? This cannot be undone.`)) return;
    setLoading(true);
    const result = await revokeShare(shareId);
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
      onClick={handleRevoke}
      disabled={loading}
    >
      <RiDeleteBin7Line className="w-4 h-4 mr-1" />
      {loading ? 'Removing…' : 'Remove'}
    </Button>
  );
}
