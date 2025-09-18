'use client';

import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { Callout } from '@/components/common/Callout';
import { RiUploadLine, RiCheckboxCircleFill, RiErrorWarningFill, RiLoader2Fill } from '@remixicon/react';

interface UploadResult {
  hash: string;
  name: string;
  size: number;
}

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadResult = await response.json();
      setResult(uploadResult);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          IPFS File Upload
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Upload files to the IPFS storage cluster
        </p>
      </div>

      <Card>
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white mb-2">
            <RiUploadLine className="w-5 h-5" />
            Upload File
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Select a file to upload to the IPFS cluster. Files are automatically replicated across all storage nodes.
          </p>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Choose File
            </label>
            <Input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
              className="cursor-pointer"
            />
            {file && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <RiLoader2Fill className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <RiUploadLine className="w-4 h-4 mr-2" />
                Upload to IPFS
              </>
            )}
          </Button>

          {error && (
            <Callout title="Upload Error" variant="error" icon={RiErrorWarningFill}>
              {error}
            </Callout>
          )}

          {result && (
            <Callout title="Upload Successful!" variant="success" icon={RiCheckboxCircleFill}>
              <div className="space-y-2">
                <div className="space-y-1 text-sm">
                  <div><strong>IPFS Hash:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{result.hash}</code></div>
                  <div><strong>File:</strong> {result.name}</div>
                  <div><strong>Size:</strong> {(result.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <div className="mt-2">
                  <a 
                    href={`http://localhost:8080/ipfs/${result.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                  >
                    View file via IPFS Gateway
                  </a>
                </div>
              </div>
            </Callout>
          )}
        </div>
      </Card>
    </div>
  );
}