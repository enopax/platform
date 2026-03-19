'use server'

import { signIn } from '@/lib/auth';
import { createDexUser } from '@/lib/dex/client';

export interface RegisterState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
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
    const name = (formData.get('name') as string)?.trim();
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const password = formData.get('password') as string;
    const password2 = formData.get('password2') as string;

    const fieldErrors: RegisterState['fieldErrors'] = {};

    if (!name || name.length < 2) {
      fieldErrors.name = 'Name must be at least 2 characters';
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

    await createDexUser(email, password, name);

    await signIn('dex', { redirectTo: '/' });

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
