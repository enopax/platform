'use client';

import React, { useRef, useEffect } from 'react';
import { useActionState } from 'react';
import { Label } from '@/components/common/Label';
import { Input } from '@/components/common/Input';
import { Callout } from '@/components/common/Callout';
import { Button } from '@/components/common/Button';
import { uploadImageAction, type ImageUploadResult } from '@/actions/image-actions';

export default function UploadImageForm({
  id,
  action,
}: {
  id: string;
  action: (id: string, urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState(uploadImageAction, null);

  // Handle successful upload
  useEffect(() => {
    if (state?.success && state.urls) {
      action(id, state.urls);
      // Reset form
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [state, id, action]);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <Callout variant="error" title="Upload failed">
          {state.error}
        </Callout>
      )}

      <div className="flex flex-col items-center gap-2">
        <Label htmlFor="file">Choose Image</Label>
        <div className="flex justify-center items-center gap-2">
          <Input
            ref={inputRef}
            type="file"
            id="file"
            name="images"
            accept="image/*"
            disabled={isPending}
          />

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </form>
  );
}
