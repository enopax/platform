import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { userFilesService } from '@/lib/services/user-files';
import { teamFilesService } from '@/lib/services/team-files';
import { storageQuotaService } from '@/lib/services/storage-quota';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const teamId = formData.get('teamId') as string | null;
    const projectId = formData.get('projectId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB' },
        { status: 400 }
      );
    }

    // Check storage quota for personal uploads
    if (!teamId) {
      const quotaCheck = await storageQuotaService.checkStorageQuota(session.user.id, file.size);
      if (!quotaCheck.allowed) {
        return NextResponse.json(
          { error: quotaCheck.reason || 'Storage quota exceeded' },
          { status: 413 }
        );
      }
    }

    let uploadedFile;

    // Upload to team storage if teamId provided, otherwise personal storage
    if (teamId) {
      uploadedFile = await teamFilesService.uploadFileToTeam(
        session.user.id,
        teamId,
        projectId,
        file
      );
    } else {
      uploadedFile = await userFilesService.uploadFile(session.user.id, file);
    }

    return NextResponse.json({
      success: true,
      hash: uploadedFile.ipfsHash,
      name: uploadedFile.name,
      size: uploadedFile.size,
      id: uploadedFile.id,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}