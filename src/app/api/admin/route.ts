import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (session) {
    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        name: 'Yannik',
      }
    });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
      });
    }

    return NextResponse.json('You are admin now!');
  } else return NextResponse.json('Not allowed!');
}