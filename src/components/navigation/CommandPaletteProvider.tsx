'use client';

import { useEffect } from 'react';
import { CommandPaletteProvider, useCommandPalette } from '@/hooks/useCommandPalette';
import CommandPalette from '@/components/navigation/CommandPalette';

function CommandPaletteKeyHandler() {
  const { open, close } = useCommandPalette();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        open();
      }
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, close]);

  return <CommandPalette />;
}

export default function CommandPaletteProviderWrapper() {
  return (
    <CommandPaletteProvider>
      <CommandPaletteKeyHandler />
    </CommandPaletteProvider>
  );
}