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
import { redirect, notFound } from 'next/navigation';
import { userFilesService } from '@/lib/services/user-files';
import { syncFilesAction, deleteFileAction, getFileDownloadUrlAction } from '@/actions/file-actions';
import FileBrowserClient from '@/app/main/resources/[id]/FileBrowserClient';
import StorageUsageDisplay from '@/components/dashboard/StorageUsageDisplay';
import { OrganisationResourceBreadcrumbs } from '@/components/common/Breadcrumbs';
import { prisma } from '@/lib/prisma';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};

export default async function OrganisationResourcePage({
  params,
}: {
  params: Promise<{ id: string; resourceId: string }>;
}) {
  const { id: organisationId, resourceId } = await params;
  const session = await auth();
  if (!session) return redirect('/');

  // Check if user is admin
  const isAdmin = session.user.role === 'ADMIN';

  // Verify user has access to this organisation (unless admin)
  if (!isAdmin) {
    const membership = await prisma.organisationMember.findUnique({
      where: {
        userId_organisationId: {
          userId: session.user.id,
          organisationId: organisationId
        }
      }
    });

    if (!membership) {
      notFound();
    }
  }

  // Get the organisation details
  const organisation = await prisma.organisation.findUnique({
    where: { id: organisationId },
    select: {
      id: true,
      name: true
    }
  });

  if (!organisation) {
    notFound();
  }

  // For now, we'll use the same file service but in a real application
  // you might want to filter by organisation-specific resources
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
      <div className="mb-6">
        <OrganisationResourceBreadcrumbs
          organisationId={organisationId}
          organisationName={organisation.name}
          resourceName="File Browser"
          resourceId={resourceId}
        />
      </div>

      {/* Page Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Organisation File Browser
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Browse, upload, and manage files for {organisation.name} ({files.length} files)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/main/organisations/${organisationId}/resources/${resourceId}/analytics`}>
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