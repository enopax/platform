'use client';

import { useState, useEffect } from 'react';

interface ClientDateProps {
  date: Date | string;
  format?: 'short' | 'long' | 'time';
  className?: string;
}

export default function ClientDate({ date, format = 'short', className }: ClientDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    let formatted: string;
    switch (format) {
      case 'long':
        formatted = dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        break;
      case 'time':
        formatted = dateObj.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        break;
      default:
        formatted = dateObj.toLocaleDateString('en-US');
    }
    
    setFormattedDate(formatted);
  }, [date, format]);

  if (!mounted) {
    return <span className={className}>Loading...</span>;
  }

  return <span className={className}>{formattedDate}</span>;
}