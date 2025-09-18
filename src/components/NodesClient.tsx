'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { RiRefreshLine } from '@remixicon/react';

export default function NodesClient() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh(); // This refreshes the Server Component
    setTimeout(() => setIsRefreshing(false), 1000); // Reset loading state
  };

  return (
    <Button onClick={handleRefresh} disabled={isRefreshing}>
      <RiRefreshLine className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </Button>
  );
}