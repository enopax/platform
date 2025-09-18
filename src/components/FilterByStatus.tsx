'use client';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/common/Select';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FilterByStatus({
  initialStatus
}: {
  initialStatus: string
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('status', value);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="w-64">
      <Select defaultValue={initialStatus} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="CONFIRMED">Confirmed</SelectItem>
          <SelectItem value="INTERESTED">Interested</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="CANCELLED">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
