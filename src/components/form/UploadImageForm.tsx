'use client';

import React, { useRef, useEffect } from 'react';
import { useActionState } from 'react';
import { Label } from '@/components/common/Label';
import { Input } from '@/components/common/Input';
import { Callout } from '@/components/common/Callout';
import { Button } from '@/components/common/Button';
import { uploadImageAction, type ImageUploadResult } from '@/actions/image-actions';

interface UploadImageProps {
  onUploadComplete?: (urls: string[]) => void;
}

export default function UploadImage({
  multiple,
  id,
  action,
}: {
  multiple: boolean,
  id: string,
  action: (id: string, urls: string[]) => void,
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

      {state?.success && state.urls && state.urls.length > 0 && (
        <Callout variant="success" title="Uploaded">
          <ul>
            {state.urls.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
              </li>
            ))}
          </ul>
        </Callout>
      )}

      <Label htmlFor="file">Upload an Image</Label>
      <div className="w-full inline-flex justify-center items-center gap-2">
        <Input
          ref={inputRef}
          type="file"
          name="images"
          accept="image/*"
          disabled={isPending}
          {...(multiple ? { multiple: true } : {})}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
    </form>
  );
}
