'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/common/Dialog';
import {
  RiUpload2Line,
  RiCloseLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiDragDropLine
} from '@remixicon/react';
import { getUserStorageQuotaAction } from '@/actions/file-actions';

interface FileUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  teamId?: string;
  projectId?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  id: string;
  hash?: string;
}

export default function FileUpload({ isOpen, onClose, onUploadSuccess, teamId, projectId }: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [storageQuota, setStorageQuota] = useState<any>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList) => {
    // Check if uploading would exceed quota (for personal uploads only)
    if (!teamId && storageQuota) {
      const totalNewSize = Array.from(files).reduce((sum, file) => sum + file.size, 0);
      const availableBytes = parseInt(storageQuota.quota.availableBytes);

      if (totalNewSize > availableBytes) {
        alert(`Upload would exceed storage quota. Available: ${formatFileSize(availableBytes)}, Required: ${formatFileSize(totalNewSize)}`);
        return;
      }
    }

    const newFiles: UploadingFile[] = Array.from(files).map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
    }));

    setUploadingFiles(prev => [...prev, ...newFiles]);

    // Upload each file
    newFiles.forEach(uploadingFile => {
      uploadFileAction(uploadingFile);
    });
  }, [teamId, storageQuota]);

  const uploadFileAction = async (uploadingFile: UploadingFile) => {
    const formData = new FormData();
    formData.append('file', uploadingFile.file);

    // Add team and project context if provided
    if (teamId) {
      formData.append('teamId', teamId);
    }
    if (projectId) {
      formData.append('projectId', projectId);
    }

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev =>
          prev.map(f =>
            f.id === uploadingFile.id
              ? { ...f, progress: Math.min(f.progress + Math.random() * 30, 90) }
              : f
          )
        );
      }, 200);

      // Use fetch to call the API route instead of server action
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      clearInterval(progressInterval);

      if (result.success !== false && result.hash) {
        setUploadingFiles(prev =>
          prev.map(f =>
            f.id === uploadingFile.id
              ? { ...f, progress: 100, status: 'success', hash: result.hash }
              : f
          )
        );
        // Refresh parent data but don't close dialog
        onUploadSuccess();
      } else {
        setUploadingFiles(prev =>
          prev.map(f =>
            f.id === uploadingFile.id
              ? { ...f, status: 'error', error: result.error || 'Upload failed' }
              : f
          )
        );
      }
    } catch (error) {
      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === uploadingFile.id
            ? { ...f, status: 'error', error: 'Network error' }
            : f
        )
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  };

  const clearCompletedUploads = () => {
    setUploadingFiles(prev => prev.filter(f => f.status === 'uploading'));
  };

  const hasActiveUploads = uploadingFiles.some(f => f.status === 'uploading');
  const hasCompletedUploads = uploadingFiles.some(f => f.status !== 'uploading');

  const handleOpenChange = (open: boolean) => {
    // Prevent closing the dialog if there are active uploads
    if (!open && hasActiveUploads) {
      return;
    }
    onClose();
  };

  // Load storage quota when component mounts or when teamId changes
  useEffect(() => {
    if (isOpen && !teamId) {
      setQuotaLoading(true);
      getUserStorageQuotaAction()
        .then(response => {
          if (response.success) {
            setStorageQuota(response.data);
          }
        })
        .catch(error => {
          console.error('Failed to load storage quota:', error);
        })
        .finally(() => {
          setQuotaLoading(false);
        });
    } else if (teamId) {
      // For team uploads, we don't check personal quota
      setStorageQuota(null);
      setQuotaLoading(false);
    }
  }, [isOpen, teamId]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Files to IPFS</DialogTitle>
          <DialogDescription>
            {teamId
              ? `Upload files to ${projectId ? 'project' : 'team'} storage with automatic replication across nodes`
              : 'Upload files to your personal IPFS storage with automatic replication across nodes'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <RiDragDropLine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Drag and drop files here, or
            </p>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={hasActiveUploads}
              className="transition-all duration-200"
            >
              <RiUpload2Line className="mr-2 h-4 w-4" />
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>

          {/* Upload Progress */}
          {uploadingFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Upload Progress ({uploadingFiles.length} files)
                </h4>
                {hasCompletedUploads && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCompletedUploads}
                    disabled={hasActiveUploads}
                    className="transition-all duration-200"
                  >
                    Clear Completed
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {uploadingFiles.map((uploadingFile) => (
                  <div key={uploadingFile.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50/50 dark:bg-gray-800/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Status Icon */}
                        <div className="flex-shrink-0">
                          {uploadingFile.status === 'uploading' && (
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          )}
                          {uploadingFile.status === 'success' && (
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <RiCheckLine className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {uploadingFile.status === 'error' && (
                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <RiErrorWarningLine className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* File Name */}
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {uploadingFile.file.name}
                        </span>
                      </div>
                      
                      {/* File Size */}
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                        {formatFileSize(uploadingFile.file.size)}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    {uploadingFile.status === 'uploading' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <span>Uploading...</span>
                          <span>{Math.round(uploadingFile.progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${uploadingFile.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Success Message */}
                    {uploadingFile.status === 'success' && uploadingFile.hash && (
                      <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-200 dark:border-green-800">
                        <div className="font-medium mb-1">✓ Upload successful</div>
                        <div className="font-mono text-xs opacity-75">
                          IPFS Hash: {uploadingFile.hash}
                        </div>
                      </div>
                    )}
                    
                    {/* Error Message */}
                    {uploadingFile.status === 'error' && uploadingFile.error && (
                      <div className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                        <div className="font-medium mb-1">✗ Upload failed</div>
                        <div className="text-xs opacity-75">{uploadingFile.error}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Storage Quota Warning */}
          {!quotaLoading && storageQuota && !teamId && (
            <div className="mb-4">
              {storageQuota.quota.usagePercentage >= 90 ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <RiErrorWarningLine className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                        Storage Almost Full
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        You're using {storageQuota.quota.usagePercentage.toFixed(1)}% of your storage quota.
                        Only {formatFileSize(parseInt(storageQuota.quota.availableBytes))} remaining.
                      </p>
                    </div>
                  </div>
                </div>
              ) : storageQuota.quota.usagePercentage >= 75 ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <RiErrorWarningLine className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Storage Running Low
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        You have {formatFileSize(parseInt(storageQuota.quota.availableBytes))} available space remaining.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Available storage: {formatFileSize(parseInt(storageQuota.quota.availableBytes))} of {formatFileSize(parseInt(storageQuota.quota.allocatedBytes))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Info */}
          <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="space-y-1">
              <p>• Supported formats: All file types</p>
              <p>• Maximum file size: 100MB per file</p>
              <p>• Files will be automatically replicated across IPFS nodes</p>
              <p>• Upload creates permanent IPFS hash for your files</p>
              {!teamId && (
                <p>• Uploads count towards your personal storage quota</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <div className="flex justify-between items-center w-full">
            <div>
              {hasCompletedUploads && !hasActiveUploads && (
                <Button
                  variant="ghost"
                  onClick={clearCompletedUploads}
                  className="transition-all duration-200"
                >
                  Clear Completed
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {hasActiveUploads && (
                <Button variant="outline" disabled className="min-w-[120px]">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </Button>
              )}
              <DialogClose asChild>
                <Button variant={hasActiveUploads ? "ghost" : "outline"}>
                  <RiCloseLine className="mr-2 h-4 w-4" />
                  Close
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}