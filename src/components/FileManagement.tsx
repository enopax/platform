'use client';

import React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/common/Button';
import { Callout } from '@/components/common/Callout';
import { deleteFileAction, syncFilesAction, type ActionResult } from '@/lib/actions/file-actions';
import { deleteTeamFileAction } from '@/lib/actions/team-actions';
import { RiDeleteBinLine, RiRefreshLine, RiDownloadLine, RiLoader4Line } from '@remixicon/react';

interface FileItem {
  id: string;
  name: string;
  ipfsHash: string;
  size: number;
  uploadedAt: Date;
  isPinned: boolean;
  fileType: string;
  status: 'pinned' | 'stored';
}

interface FileManagementProps {
  files: FileItem[];
  teamId?: string;
  showSync?: boolean;
}

export default function FileManagement({
  files,
  teamId,
  showSync = true
}: FileManagementProps) {
  const [deleteState, deleteFormAction, isDeleting] = useActionState(
    teamId ? deleteTeamFileAction : deleteFileAction,
    null
  );
  const [syncState, syncFormAction, isSyncing] = useActionState(syncFilesAction, null);

  const handleDelete = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      const formData = new FormData();
      formData.append('fileId', fileId);
      if (teamId) {
        formData.append('teamId', teamId);
      } else {
        formData.append('isTeamFile', 'false');
      }
      deleteFormAction(formData);
    }
  };

  const handleSync = () => {
    const formData = new FormData();
    syncFormAction(formData);
  };

  const getDownloadUrl = (hash: string, filename: string) => {
    return `http://localhost:8080/ipfs/${hash}?filename=${encodeURIComponent(filename)}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {teamId ? 'Team Files' : 'Your Files'} ({files.length})
        </h3>

        {showSync && !teamId && (
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            variant="outline"
            size="sm"
          >
            {isSyncing ? (
              <>
                <RiLoader4Line className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RiRefreshLine className="w-4 h-4 mr-2" />
                Sync with Cluster
              </>
            )}
          </Button>
        )}
      </div>

      {/* Status Messages */}
      {deleteState?.error && (
        <Callout variant="error" title="Delete Failed">
          {deleteState.error}
        </Callout>
      )}

      {deleteState?.success && (
        <Callout variant="success" title="File Deleted">
          File deleted successfully
        </Callout>
      )}

      {syncState?.error && (
        <Callout variant="error" title="Sync Failed">
          {syncState.error}
        </Callout>
      )}

      {syncState?.success && (
        <Callout variant="success" title="Sync Complete">
          Files synced with IPFS cluster
        </Callout>
      )}

      {/* Files List */}
      {files.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No files uploaded yet
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium truncate">{file.name}</h4>
                  <span className={`px-2 py-1 rounded text-xs ${
                    file.isPinned
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {file.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {formatFileSize(file.size)} • {file.fileType} • {formatDate(file.uploadedAt)}
                </div>
                <div className="text-xs text-gray-400 mt-1 font-mono">
                  {file.ipfsHash}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Button
                  as="a"
                  href={getDownloadUrl(file.ipfsHash, file.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  size="sm"
                >
                  <RiDownloadLine className="w-4 h-4" />
                </Button>

                <Button
                  onClick={() => handleDelete(file.id)}
                  disabled={isDeleting}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isDeleting ? (
                    <RiLoader4Line className="w-4 h-4 animate-spin" />
                  ) : (
                    <RiDeleteBinLine className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}