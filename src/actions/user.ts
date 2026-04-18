'use server'

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { revalidatePath } from 'next/cache';
import { auth, signIn } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import type { UserRole } from '@/lib/store';
import { userService } from '@/lib/services/user';
import nodemailer from 'nodemailer';

export async function sendGuestMessage(message: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return { success: false, error: 'Not authenticated' };
  }

  const fs = await import('fs');
  const path = await import('path');
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  const requestsDir = path.join(dataDir, 'guest-requests');
  fs.mkdirSync(requestsDir, { recursive: true });
  const timestamp = new Date().toISOString();
  const filename = `${Date.now()}-${session.user.id.slice(0, 8)}.json`;
  fs.writeFileSync(path.join(requestsDir, filename), JSON.stringify({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name || '',
    message,
    createdAt: timestamp,
  }, null, 2), { mode: 0o600 });

  const emailServer = process.env.EMAIL_SERVER;
  if (!emailServer) {
    return { success: true };
  }

  try {
    const transporter = nodemailer.createTransport(emailServer);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@enopax.com',
      to: 'register@enopax.com',
      replyTo: session.user.email,
      subject: `Early access message from ${session.user.name || session.user.email}`,
      html: `
        <div style="max-width:500px; margin:0 auto; font-family:Arial,sans-serif; padding:40px 20px;">
          <h2 style="color:#1f2937; margin-bottom:16px;">New message from early access user</h2>
          <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
            <tr><td style="padding:8px 0; color:#6b7280;">From</td><td style="padding:8px 0; font-weight:600;">${session.user.name || '-'}</td></tr>
            <tr><td style="padding:8px 0; color:#6b7280;">Email</td><td style="padding:8px 0; font-weight:600;">${session.user.email}</td></tr>
          </table>
          <div style="background:#f3f4f6; border-radius:8px; padding:16px; margin-bottom:24px;">
            <p style="color:#374151; white-space:pre-wrap; margin:0;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
          <p style="color:#9ca3af; font-size:13px;">Reply directly to this email to respond to the user.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (e) {
    console.error('Failed to send guest message:', e);
    return { success: false, error: 'Failed to send message' };
  }
}

export async function sendCredentials(state: object | null, formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    if (email.length < 3) throw new Error('Your email is too short!');

    await signIn('credentials', {
      email: email,
      password: password,
      redirect: false,
    });

    return {
      payload: {
        status: 'accepted',
        data: {},
      }
    }
  } catch(e: unknown) {
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') return {
      payload: {
        status: 'accepted',
        data: {},
      }
    }
    return {
      payload: {
        status: 'rejected',
        reason: 'Your credentials are not correct!',
      }
    }
  }
}

export async function sendEmail(state: object | null, formData: FormData) {
  try {
    const email = formData.get('email') as string;
    if (email.length < 3) throw new Error('Your email address is too short!');
    const store = await getStoreAsync();
    const exists = await store.users.findByEmail(email);
    if (!exists) throw new Error('Your email address is not available!');
    await signIn('nodemailer', {
      email: email,
    });

    return {
      payload: {
        status: 'accepted',
        data: {},
      }
    }
  } catch(e: unknown) {
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') return {
      payload: {
        status: 'accepted',
        data: {},
      }
    }
    return {
      payload: {
        status: 'rejected',
        reason: e,
      }
    }
  }
}

export async function register(state: object | null, formData: FormData) {
  try {
    const username = formData.get('username') as string;
    const firstname = formData.get('firstname') as string;
    const lastname = formData.get('lastname') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const password2 = formData.get('password2') as string;
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    if (email.length < 3) throw new Error('Your email is too short!');
    if (password != password2) throw new Error('Passwords are not the same!');
    const store = await getStoreAsync();
    const user = await store.users.create({
      name: username,
      firstname: firstname,
      lastname: lastname,
      email: email,
      password: hash,
      role: 'CUSTOMER',
    });

    await signIn('credentials', {
      email: email,
      password: password,
    });

    return {
      payload: {
        status: 'accepted',
        data: user,
      }
    }
  } catch(e: unknown) {
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') return {
      payload: {
        status: 'accepted',
        data: {},
      }
    }
    return {
      payload: {
        status: 'rejected',
        reason: e instanceof Error ? e.message : String(e),
      }
    }
  }
}

export async function settings(state: object | null, formData: FormData) {
  try {
    const session = await auth();
    const username = formData.get('username') as string;
    const firstname = formData.get('firstname') as string;
    const lastname = formData.get('lastname') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const password2 = formData.get('password2') as string;
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    if (email.length < 3) throw new Error('Your email is too short!');
    if (password != password2) throw new Error('Passwords are not the same!');

    const store = await getStoreAsync();
    const user = await store.users.update(session?.user?.id, {
      name: username,
      firstname: firstname,
      lastname: lastname,
      email: email,
      ...(password.length > 0 && { password: hash })
    });

    revalidatePath('/account/settings');
    return {
      payload: {
        status: 'accepted',
        data: JSON.stringify(user),
      }
    }
  } catch(e: unknown) {
    return {
      payload: {
        status: 'rejected',
        reason: e instanceof Error ? e.message : String(e),
      }
    }
  }
}

export async function activateUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
    return { success: false, error: 'Not authorised' };
  }

  const store = await getStoreAsync();
  const user = await store.users.findById(userId);
  if (!user) return { success: false, error: 'User not found' };

  await store.users.update(userId, { role: 'CUSTOMER' });
  revalidatePath('/admin/users');
  return { success: true };
}

export async function setAvatar(userId: string, images: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }
    await userService.setUserAvatar(session.user.id, images);
    revalidatePath('/account/settings');
    revalidatePath('/');

    return {
      success: true,
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export type UpdateUserState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function updateUserAdmin(userId: string, _prevState: UpdateUserState, formData: FormData): Promise<UpdateUserState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const firstname = formData.get('firstname') as string;
    const lastname = formData.get('lastname') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as string;

    if (!email) {
      return { success: false, fieldErrors: { email: 'Email is required' } };
    }

    const store = await getStoreAsync();
    await store.users.update(userId, {
      firstname: firstname || null,
      lastname: lastname || null,
      name: name || null,
      email,
      role: role as UserRole,
    });

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin/users');

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function findUsers(query: string) {
  try {
    const users = await userService.searchUsers(query);
    return users;
  } catch (error) {
    console.error('Failed to search users:', error);
    return [];
  }
}
