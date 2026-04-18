import { getStoreAsync } from '@/lib/store';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

function verifyToken(userId: string, token: string): boolean {
  const secret = process.env.AUTH_SECRET || '';
  const expected = crypto.createHmac('sha256', secret).update(userId).digest('hex');
  return token === expected;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');

  if (!userId || !token || !verifyToken(userId, token)) {
    return new Response(
      '<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Invalid activation link</h2></body></html>',
      { status: 403, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const store = await getStoreAsync();
  const user = await store.users.findById(userId);

  if (!user) {
    return new Response(
      '<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>User not found</h2></body></html>',
      { status: 404, headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (user.role === 'CUSTOMER' || user.role === 'ADMIN') {
    return new Response(
      '<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Already activated</h2><p>' + user.email + ' is already a ' + user.role + '.</p></body></html>',
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }

  await store.users.update(userId, { role: 'CUSTOMER' });

  return new Response(
    '<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Account activated</h2><p>' + user.email + ' now has full access.</p><p><a href="/admin/users">Go to admin</a></p></body></html>',
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}
