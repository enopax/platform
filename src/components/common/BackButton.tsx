'use client';

import { Button } from '@/components/common/Button';
import { RiArrowLeftLine } from '@remixicon/react';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  label?: string;
  href?: string;
  className?: string;
}

export default function BackButton({
  label = 'Back',
  href,
  className = ''
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`flex items-center gap-2 ${className}`}
    >
      <RiArrowLeftLine className="h-4 w-4" />
      {label}
    </Button>
  );
}