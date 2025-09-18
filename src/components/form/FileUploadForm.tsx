'use client';

import React, { useRef, useEffect } from 'react';
import { useActionState } from 'react';
import { Label } from '@/components/common/Label';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Callout } from '@/components/common/Callout';
import { uploadFileAction, type ActionResult } from '@/lib/actions/file-actions';
import { RiUploadLine, RiLoader4Line } from '@remixicon/react';

interface FileUploadFormProps {
  teamId?: string;
  projectId?: string;
  onUploadComplete?: (result: ActionResult) => void;
}

export default function FileUploadForm({
  teamId,
  projectId,
  onUploadComplete
}: FileUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState(uploadFileAction, null);

  // Handle state changes and callbacks
  useEffect(() => {
    if (state) {
      // Reset form on success
      if (state.success && fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Call callback if provided
      if (onUploadComplete) {
        onUploadComplete(state);
      }
    }
  }, [state, onUploadComplete]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="file">Select File</Label>
        <Input
          ref={fileInputRef}
          id="file"
          name="file"
          type="file"
          required
          disabled={isPending}
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-1">
          Maximum file size: 100MB
        </p>
      </div>

      {/* Hidden fields for team/project context */}
      {teamId && <input type="hidden" name="teamId" value={teamId} />}
      {projectId && <input type="hidden" name="projectId" value={projectId} />}

      {state?.error && (
        <Callout variant="error" title="Upload Failed">
          {state.error}
        </Callout>
      )}

      {state?.success && (
        <Callout variant="success" title="Upload Successful">
          File uploaded successfully: {state.data?.name}
        </Callout>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full"
      >
        {isPending ? (
          <>
            <RiLoader4Line className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <RiUploadLine className="w-4 h-4 mr-2" />
            Upload File
          </>
        )}
      </Button>
    </form>
  );
}