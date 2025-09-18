import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { hash } from 'bcrypt-ts';

// Generate a secure API key
function generateApiKey(): string {
  // Generate a random key with a prefix
  const randomPart = crypto.randomBytes(32).toString('hex');
  return `sk_${randomPart}`;
}

// Hash the API key for storage
async function hashApiKey(apiKey: string): Promise<string> {
  return hash(apiKey, 12);
}

// Create preview of API key (first 8 characters)
function createKeyPreview(apiKey: string): string {
  return apiKey.substring(0, 12);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, name, permissions, expiresIn } = await request.json();

    // Validate that the user is creating a key for themselves
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate input
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 });
    }

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Valid permissions are required' }, { status: 400 });
    }

    // Validate permissions
    const validPermissions = ['read', 'write', 'admin'];
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return NextResponse.json({
        error: `Invalid permissions: ${invalidPermissions.join(', ')}`
      }, { status: 400 });
    }

    // Check if user already has too many API keys (limit to 10)
    const existingKeysCount = await prisma.apiKey.count({
      where: { userId, isActive: true },
    });

    if (existingKeysCount >= 10) {
      return NextResponse.json({
        error: 'Maximum number of API keys reached (10)'
      }, { status: 400 });
    }

    // Generate the API key
    const apiKey = generateApiKey();
    const hashedKey = await hashApiKey(apiKey);
    const keyPreview = createKeyPreview(apiKey);

    // Calculate expiration date
    let expiresAt: Date | null = null;
    if (expiresIn && expiresIn > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresIn);
    }

    // Create the API key in database
    const createdApiKey = await prisma.apiKey.create({
      data: {
        userId,
        name: name.trim(),
        keyPreview,
        hashedKey,
        permissions,
        expiresAt,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      apiKey,
      keyId: createdApiKey.id,
      keyPreview,
      expiresAt,
    });

  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}