'use server'

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { revalidatePath } from 'next/cache';
import { auth, signIn } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { userService } from '@/lib/services/user';

export async function sendCredentials(state: object | null, formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    if (email.length < 3) throw new Error('Your email is too short!');
    await signIn('credentials', {
      email: email,
      password: password,
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
    const exists = await prisma.user.findUnique({ where: { email: email } });
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
    const user = await prisma.user.create({
      data: {
        name: username,
        firstname: firstname,
        lastname: lastname,
        email: email,
        password: hash,
        role: 'CUSTOMER',
      }
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

    const user = await prisma.user.update({
      where: { id: session?.user?.id },
      data: {
        name: username,
        firstname: firstname,
        lastname: lastname,
        email: email,
        ...(password.length > 0 && { password: hash })
      }
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

export async function findUsers(query: string) {
  try {
    const users = await userService.searchUsers(query);
    return users;
  } catch (error) {
    console.error('Failed to search users:', error);
    return [];
  }
}