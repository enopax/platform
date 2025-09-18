'use client'

import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/Dialog';

export default function ShareDialog({
  url,
  callback,
}: {
  url: string,
  callback: () => void,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 6000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Share this place</DialogTitle>
        <div className="mt-1 inline-flex gap-2 items-center w-full">
          <Input
            readOnly
            value={url}
            className="flex-1"
          />
          <Button onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </DialogHeader>
      <DialogFooter className="mt-6">
        <DialogClose asChild>
          <Button
            className="mt-2 w-full sm:mt-0 sm:w-fit"
            variant="secondary"
          > Close
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
