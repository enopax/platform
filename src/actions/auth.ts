'use server';

import { signOut } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function handleSignOut() {
  revalidatePath('/', 'layout');
  await signOut({
    redirectTo: '/signin',
  });
}
