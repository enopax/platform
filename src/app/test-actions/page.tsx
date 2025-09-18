import { auth } from '@/lib/auth';
import { userFilesService } from '@/lib/services/user-files';
import FileUploadForm from '@/components/form/FileUploadForm';
import FileManagement from '@/components/FileManagement';
import { Card } from '@/components/common/Card';
import { redirect } from 'next/navigation';

export default async function TestActionsPage() {
  const session = await auth();

  if (!session) {
    redirect('/signin');
  }

  // Get user's files for display
  const userFiles = await userFilesService.getUserFiles(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Test Server Actions</h1>

      <div className="grid gap-8">
        {/* Upload Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
          <FileUploadForm
            onUploadComplete={(result) => {
              if (result.success) {
                // Page will auto-refresh due to revalidation
                console.log('Upload completed:', result.data);
              }
            }}
          />
        </Card>

        {/* File Management Section */}
        <Card className="p-6">
          <FileManagement
            files={userFiles}
            showSync={true}
          />
        </Card>

        {/* Stats Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Storage Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {userFiles.length}
              </div>
              <div className="text-sm text-gray-500">Total Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {userFiles.filter(f => f.isPinned).length}
              </div>
              <div className="text-sm text-gray-500">Pinned Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(userFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024 * 100) / 100} MB
              </div>
              <div className="text-sm text-gray-500">Total Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {new Set(userFiles.map(f => f.fileType)).size}
              </div>
              <div className="text-sm text-gray-500">File Types</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Debug Info */}
      <Card className="p-6 mt-8 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Debug Information</h3>
        <div className="space-y-2 text-sm">
          <div><strong>User ID:</strong> {session.user.id}</div>
          <div><strong>Session Email:</strong> {session.user.email}</div>
          <div><strong>Files Count:</strong> {userFiles.length}</div>
          <div><strong>Server Actions:</strong> ✅ Active</div>
          <div><strong>Services:</strong> ✅ Using existing services</div>
          <div><strong>Validation:</strong> ✅ Zod schemas active</div>
        </div>
      </Card>
    </div>
  );
}