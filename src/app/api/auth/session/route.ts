import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(null, { status: 401 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}