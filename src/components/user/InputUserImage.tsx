import React, { useState, useEffect } from 'react';
import { Label } from '@/components/common/Label';
import { Input } from '@/components/common/Input';
import { Callout } from '@/components/common/Callout';
import { ProgressCircle } from '@/components/common/ProgressCircle';
import Avatar from '@/components/common/Avatar';

interface BlobType {
  url: string;
  // Add other properties of blob here if necessary
}

export default function InputUserImage({
  value,
}: {
  value: string;
}) {
  const [blob, setBlob] = useState<BlobType | null>(null);
  const [loading, setLoading] = useState(0);
  const errorMessage = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    setLoading(0);
    errorMessage.value = '';

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/avatar/upload?filename=${file.name}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setLoading(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const newBlob = JSON.parse(xhr.responseText) as BlobType;
        setBlob(newBlob);
        setLoading(0);
      } else {
        errorMessage.value = `Upload failed with status ${xhr.status}`;
      }
    };

    xhr.onerror = () => {
      errorMessage.value = 'Error during image upload.';
    };

    xhr.send(file);
  };

  return (
    <div className="flex flex-col items-center">
      <input type="hidden" className="hidden" name="image" value={blob?.url || value} />

      {errorMessage.value && (
        <Callout variant="error" title="Error">
          {errorMessage.value}
        </Callout>
      )}
    
      {loading ? (
        <ProgressCircle
          value={loading}
          radius={60}
        />
      ): (
        <Avatar
          name="Avatar"
          size="large"
          image={blob?.url || value}
        />
      )}

      <div className="w-full space-y-2">
        <Label htmlFor="file">Wähle dein Profilbild aus</Label>
        <Input
          type="file"
          className="mt-2"
          accept="image/*"
          onChange={handleUpload}
        />
      </div>
    </div>
  );
};
