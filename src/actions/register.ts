'use server'

import { signIn } from '@/lib/auth';
import { createDexUser, generateUserIdFromEmail } from '@/lib/dex/client';
import { getStoreAsync } from '@/lib/store';
import { createVerificationToken, sendVerificationEmail } from '@/lib/email-verification';
import { isBlockedName } from '@/lib/name-validation';

export interface RegisterState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    username?: string;
    name?: string;
    email?: string;
    password?: string;
    password2?: string;
  };
}

export async function register(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  try {
    const username = (formData.get('username') as string)?.trim().toLowerCase();
    const name = (formData.get('name') as string)?.trim() || null;
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const password = formData.get('password') as string;
    const password2 = formData.get('password2') as string;

    const fieldErrors: RegisterState['fieldErrors'] = {};

    if (!username || username.length < 2 || username.length > 39) {
      fieldErrors.username = 'Username must be between 2 and 39 characters';
    } else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(username) && !/^[a-z0-9]$/.test(username)) {
      fieldErrors.username = 'Username can only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen';
    } else if (isBlockedName(username)) {
      fieldErrors.username = 'This username is reserved and cannot be used';
    }

    if (!email || !email.includes('@')) {
      fieldErrors.email = 'Valid email address is required';
    }

    if (!password || password.length < 8) {
      fieldErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== password2) {
      fieldErrors.password2 = 'Passwords do not match';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { error: 'Please fix the errors below', fieldErrors };
    }

    const store = await getStoreAsync();

    const namespaceAvailable = await store.namespaces.isAvailable(username);
    if (!namespaceAvailable) {
      return { error: 'Please fix the errors below', fieldErrors: { username: 'Username is taken' } };
    }

    // Create user in Dex
    await createDexUser(email, password, name || username);

    // Pre-create TinyBase user so we have an ID for the verification token
    let user = await store.users.findByEmail(email);
    if (!user) {
      user = await store.users.create({
        name,
        email,
        slug: username,
        role: 'CUSTOMER',
      });
    }

    await store.namespaces.register({ slug: username, entityType: 'USER', entityId: user.id });

    // Send verification email
    const token = await createVerificationToken(user.id, email);
    await sendVerificationEmail(email, token);

    const inviteToken = (formData.get('inviteToken') as string)?.trim();
    const redirectTo = inviteToken ? `/accept-invite?token=${inviteToken}` : '/';

    // Sign in via OIDC
    await signIn('dex', { redirectTo });

    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') {
      return { success: true };
    }

    const message = e instanceof Error ? e.message : String(e);

    if (message.includes('already exists')) {
      return {
        error: 'A user with this email already exists',
        fieldErrors: { email: 'This email is already registered' },
      };
    }

    console.error('Registration error:', e);
    return { error: 'Registration failed. Please try again.' };
  }
}

export async function resendVerificationEmail(): Promise<{ success: boolean; error?: string }> {
  try {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return { success: false, error: 'Not authenticated' };
    }

    const store = await getStoreAsync();
    const user = await store.users.findById(session.user.id);
    if (!user) return { success: false, error: 'User not found' };
    if (user.emailVerified) return { success: false, error: 'Email already verified' };

    const token = await createVerificationToken(user.id, user.email);
    await sendVerificationEmail(user.email, token);

    return { success: true };
  } catch (e) {
    console.error('Resend verification error:', e);
    return { success: false, error: 'Failed to send verification email' };
  }
}
