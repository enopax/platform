import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { redirect } from 'next/navigation';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const apiKeyId = formData.get('apiKeyId') as string;

    if (!apiKeyId) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 });
    }

    // Find the API key and verify ownership
    const apiKey = await (await getStoreAsync()).apiKeys.findById(apiKeyId);

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    if (apiKey.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the API key (hard delete for security)
    await (await getStoreAsync()).apiKeys.delete(apiKeyId);

    // Redirect back to developer page
    redirect('/main/developer');

  } catch (error) {
    console.error('Error deleting API key:', error);
    redirect('/main/developer?error=delete-failed');
  }
}