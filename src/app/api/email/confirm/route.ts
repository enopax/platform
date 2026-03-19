import { verifyToken } from '@/lib/email-verification';
import { getStoreAsync } from '@/lib/store';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new Response('Missing verification token', { status: 400 });
  }

  const result = await verifyToken(token);

  if (!result) {
    return new Response(
      '<html><body style="font-family:sans-serif;text-align:center;padding:60px">' +
      '<h2>Invalid or expired link</h2>' +
      '<p>This verification link has expired or already been used.</p>' +
      '<p><a href="/signin">Sign in</a> to request a new one.</p>' +
      '</body></html>',
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const store = await getStoreAsync();
  await store.users.update(result.userId, {
    emailVerified: new Date(),
  });

  redirect('/signin?verified=true');
}
