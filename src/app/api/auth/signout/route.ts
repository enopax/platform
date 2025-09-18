import { NextResponse } from 'next/server';
import { auth, signOut } from '@/lib/auth';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (session) {
    await signOut();

    return NextResponse.json('Signed out!');
  }
  else return NextResponse.json('No session available!');
}