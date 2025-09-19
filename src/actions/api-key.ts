'use server'

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { hash } from 'bcrypt-ts';

// Generate a secure API key
function generateApiKey(): string {
  const randomPart = crypto.randomBytes(32).toString('hex');
  return `sk_${randomPart}`;
}

// Hash the API key for storage
async function hashApiKey(apiKey: string): Promise<string> {
  return hash(apiKey, 12);
}

// Create preview of API key (first 12 characters)
function createKeyPreview(apiKey: string): string {
  return apiKey.substring(0, 12);
}

export interface CreateApiKeyState {
  success?: boolean;
  error?: string;
  apiKey?: string;
  keyId?: string;
  keyPreview?: string;
  expiresAt?: Date | null;
  fieldErrors?: {
    name?: string;
    permissions?: string;
    expiresIn?: string;
  };
}

export async function createApiKey(
  prevState: CreateApiKeyState,
  formData: FormData
): Promise<CreateApiKeyState> {
  try {
    const session = await auth();
    if (!session) {
      return {
        error: 'Unauthorized. Please sign in to create API keys.',
      };
    }

    const name = formData.get('name') as string;
    const permissions = formData.get('permissions') as string;
    const expiresIn = formData.get('expiresIn') as string;

    // Basic validation
    if (!name || !name.trim()) {
      return {
        error: 'API key name is required',
        fieldErrors: { name: 'API key name is required' }
      };
    }

    if (!permissions) {
      return {
        error: 'Permissions are required',
        fieldErrors: { permissions: 'Permissions are required' }
      };
    }

    // Validate permissions
    const validPermissions = ['read', 'write', 'admin'];
    if (!validPermissions.includes(permissions)) {
      return {
        error: `Invalid permissions: ${permissions}`,
        fieldErrors: { permissions: `Invalid permissions: ${permissions}` }
      };
    }

    // Check if user already has too many API keys (limit to 10)
    const existingKeysCount = await prisma.apiKey.count({
      where: { userId: session.user.id, isActive: true },
    });

    if (existingKeysCount >= 10) {
      return {
        error: 'Maximum number of API keys reached (10). Please delete unused keys before creating new ones.',
      };
    }

    // Generate the API key
    const apiKey = generateApiKey();
    const hashedKey = await hashApiKey(apiKey);
    const keyPreview = createKeyPreview(apiKey);

    // Calculate expiration date
    let expiresAt: Date | null = null;
    if (expiresIn && expiresIn !== '0') {
      const days = parseInt(expiresIn);
      if (days > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }
    }

    // Create the API key in database
    const createdApiKey = await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        keyPreview,
        hashedKey,
        permissions: [permissions],
        expiresAt,
        isActive: true,
      },
    });

    revalidatePath('/account/developer');
    revalidatePath('/admin/api-keys');

    return {
      success: true,
      apiKey,
      keyId: createdApiKey.id,
      keyPreview,
      expiresAt,
    };
  } catch (error) {
    console.error('Error creating API key:', error);
    return {
      error: 'Failed to create API key. Please try again.',
    };
  }
}