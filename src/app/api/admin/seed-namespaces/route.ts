import { auth } from '@/lib/auth';
import { seedNamespaces } from '@/lib/seed-namespaces';
import { NextResponse } from 'next/server';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
  }

  const result = await seedNamespaces();
  return NextResponse.json(result);
}
