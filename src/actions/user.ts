'use server'

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { revalidatePath } from 'next/cache';
import { auth, signIn } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, StorageTier } from '@prisma/client';
import { userService } from '@/lib/services/user';

// Storage tier to bytes mapping
const STORAGE_TIER_BYTES: Record<StorageTier, bigint> = {
  FREE_500MB: BigInt(500 * 1024 * 1024),        // 500 MB
  BASIC_5GB: BigInt(5 * 1024 * 1024 * 1024),    // 5 GB
  PRO_50GB: BigInt(50 * 1024 * 1024 * 1024),    // 50 GB
  ENTERPRISE_500GB: BigInt(500 * 1024 * 1024 * 1024), // 500 GB
  UNLIMITED: BigInt(Number.MAX_SAFE_INTEGER),    // Unlimited (max safe integer)
};

async function createOrUpdateUserStorageQuota(userId: string, tier: StorageTier) {
  const allocatedBytes = STORAGE_TIER_BYTES[tier];

  // Check if user already has a quota record
  const existingQuota = await prisma.userStorageQuota.findUnique({
    where: { userId }
  });

  if (existingQuota) {
    // Update existing quota
    await prisma.userStorageQuota.update({
      where: { userId },
      data: {
        tier,
        allocatedBytes,
        tierUpdatedAt: new Date(),
        lastUpdated: new Date(),
      }
    });
  } else {
    // Create new quota record
    await prisma.userStorageQuota.create({
      data: {
        userId,
        tier,
        allocatedBytes,
        usedBytes: BigInt(0),
        tierUpdatedAt: new Date(),
      }
    });
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

    // Create initial storage quota for the user
    await createOrUpdateUserStorageQuota(user.id, StorageTier.FREE_500MB);

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
    const storageTier = formData.get('storageTier') as StorageTier;
    const available = formData.get('available') === 'on' ? true : false;
    const code = formData.get('code') as string;
    const password = formData.get('password') as string;
    const password2 = formData.get('password2') as string;
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    if (email.length < 3) throw new Error('Your email is too short!');
    if (password != password2) throw new Error('Passwords are not the same!');

    const user = await prisma.user.update({
      where: { id: session?.userId },
      data: {
        name: username,
        firstname: firstname,
        lastname: lastname,
        email: email,
        storageTier: storageTier,
        ...(password.length > 0 && { password: hash })
      }
    });

    // Create or update user storage quota based on tier
    await createOrUpdateUserStorageQuota(session?.userId!, storageTier);

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
    await userService.setUserAvatar(session?.userId!, images);
    revalidatePath('/account/settings');

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

export interface UpdateUserState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    firstname?: string;
    lastname?: string;
    name?: string;
    email?: string;
    role?: string;
  };
}

export async function updateUserAdmin(
  userId: string,
  prevState: UpdateUserState,
  formData: FormData
): Promise<UpdateUserState> {
  try {
    const firstname = formData.get('firstname') as string;
    const lastname = formData.get('lastname') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as UserRole;
    const adminUserId = formData.get('adminUserId') as string;

    // Basic validation
    if (!email || !email.includes('@')) {
      return {
        error: 'Valid email address is required',
        fieldErrors: { email: 'Valid email address is required' }
      };
    }

    if (!role || !['GUEST', 'NOMAD', 'ADMIN'].includes(role)) {
      return {
        error: 'Valid role is required',
        fieldErrors: { role: 'Valid role is required' }
      };
    }

    if (!adminUserId) {
      return {
        error: 'Admin user ID is required',
        fieldErrors: { name: 'Admin user ID is required' }
      };
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      return {
        error: 'Email address is already in use',
        fieldErrors: { email: 'Email address is already in use' }
      };
    }

    // Use service to update user
    await userService.updateUserAdmin(userId, {
      firstname: firstname || undefined,
      lastname: lastname || undefined,
      name: name || undefined,
      email,
      role,
    }, adminUserId);

    revalidatePath('/admin/user');
    revalidatePath(`/admin/user/${userId}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to update user:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to update user. Please try again.',
    };
  }
}