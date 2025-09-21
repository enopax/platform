import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Table } from '@/components/common/Table';
import {
  RiFolderLine,
  RiFileLine,
  RiUploadLine,
  RiDownloadLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiMoreLine,
  RiFilterLine,
  RiRefreshLine,
  RiFolderAddLine,
  RiImageLine,
  RiVideoLine,
  RiFileTextLine,
  RiFileZipLine,
  RiFilePdfLine,
  RiBarChartLine
} from '@remixicon/react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { userFilesService } from '@/lib/services/user-files';
import { syncFilesAction, deleteFileAction, getFileDownloadUrlAction } from '@/actions/file-actions';
import FileBrowserClient from './FileBrowserClient';
import StorageUsageDisplay from '@/components/StorageUsageDisplay';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};

export default async function FileBrowserPage() {
  const session = await auth();
  if (!session) return redirect('/');

  // Get user's files from IPFS cluster via database
  const userFiles = await userFilesService.getUserFiles(session.user.id);

  // Transform to display format
  const files = userFiles.map(file => ({
    id: file.id,
    name: file.name,
    type: 'file' as const,
    fileType: file.fileType,
    size: formatFileSize(file.size),
    uploadedAt: file.uploadedAt.toLocaleDateString(),
    modifiedAt: file.uploadedAt.toLocaleString(),
    status: file.status,
    ipfsHash: file.ipfsHash,
    downloads: 0, // TODO: Add download tracking
    isSelected: false,
  }));

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            File Browser
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Browse, upload, and manage your IPFS files and folders ({files.length} files)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/main/files/analytics">
            <Button variant="outline" size="sm">
              <RiBarChartLine className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <form action={syncFilesAction}>
            <Button variant="outline" size="sm" type="submit">
              <RiRefreshLine className="mr-2 h-4 w-4" />
              Sync Files
            </Button>
          </form>
        </div>
      </div>

      {/* Storage Usage Display */}
      <div className="mb-6">
        <StorageUsageDisplay />
      </div>

      {/* Client Component for Interactive Features */}
      <FileBrowserClient
        files={files}
        deleteFileAction={deleteFileAction}
        downloadFileAction={getFileDownloadUrlAction}
      />
    </div>
  );
}