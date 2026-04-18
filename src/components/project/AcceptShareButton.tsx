'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { acceptShare } from '@/actions/project-share';
import { Button } from '@/components/common/Button';
import { RiCheckLine } from '@remixicon/react';

interface AcceptShareButtonProps {
  shareId: string;
  organisationName: string;
}

export default function AcceptShareButton({ shareId, organisationName }: AcceptShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAccept = async () => {
    setLoading(true);
    const result = await acceptShare(shareId);
    setLoading(false);
    if (result.success) {
      router.refresh();
    }
  };

  return (
    <Button
      type="button"
      variant="primary"
      onClick={handleAccept}
      disabled={loading}
    >
      <RiCheckLine className="w-4 h-4 mr-1" />
      {loading ? 'Accepting…' : 'Accept'}
    </Button>
  );
}
