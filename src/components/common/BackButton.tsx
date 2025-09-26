'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { RiArrowLeftLine } from '@remixicon/react';

interface BackButtonProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function BackButton({ href, children = 'Back', className = '' }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
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
      onClick={handleClick}
      className={`text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 ${className}`}
    >
      <RiArrowLeftLine className="mr-2 h-4 w-4" />
      {children}
    </Button>
  );
}