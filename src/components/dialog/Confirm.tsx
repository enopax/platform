'use client'

import { Button } from '@/components/common/Button';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/Dialog';

export default function ConfirmDialog({
  text,
  callback,
}: {
  text: string,
  callback: () => void,
}) {
  return (
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Confirmation</DialogTitle>
        <DialogDescription className="mt-1 text-sm leading-6">
          {text}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="mt-6">
        <DialogClose asChild>
          <Button
            className="mt-2 w-full sm:mt-0 sm:w-fit"
            variant="secondary"
          >
            Back
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button
            className="w-full sm:w-fit"
            onClick={callback}
          >
            Yes
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
