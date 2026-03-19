import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { getStoreAsync } from '@/lib/store';

const BASE_URL = process.env.AUTH_URL || 'http://localhost:3000';
const TOKEN_EXPIRY_HOURS = 24;

interface VerificationToken {
  token: string;
  email: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createVerificationToken(userId: string, email: string): Promise<string> {
  const store = await getStoreAsync();
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  const tinyStore = (store as any).users as any;
  const rawStore = tinyStore.store || tinyStore;

  // Store token in a dedicated table via the underlying TinyBase store
  // Access the raw store through the data-store module
  const { getStore } = await import('@/lib/store/data-store');
  const dataStore = getStore();

  // We'll store tokens in a simple in-memory map for now
  // and persist via the verification-tokens file
  const fs = await import('fs');
  const path = await import('path');

  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  const tokensDir = path.join(dataDir, 'verification-tokens');
  fs.mkdirSync(tokensDir, { recursive: true });

  const tokenData: VerificationToken = {
    token,
    email,
    userId,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  };

  const tokenFile = path.join(tokensDir, `${token}.json`);
  fs.writeFileSync(tokenFile, JSON.stringify(tokenData, null, 2), { mode: 0o600 });

  return token;
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  const fs = await import('fs');
  const path = await import('path');

  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  const tokenFile = path.join(dataDir, 'verification-tokens', `${token}.json`);

  if (!fs.existsSync(tokenFile)) return null;

  try {
    const data: VerificationToken = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));

    if (new Date(data.expiresAt) < new Date()) {
      fs.unlinkSync(tokenFile);
      return null;
    }

    // Delete token after use (single-use)
    fs.unlinkSync(tokenFile);

    return { userId: data.userId, email: data.email };
  } catch {
    return null;
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const emailServer = process.env.EMAIL_SERVER;
  if (!emailServer) {
    console.warn('EMAIL_SERVER not configured — skipping verification email');
    console.log(`Verification link: ${BASE_URL}/api/email/confirm?token=${token}`);
    return;
  }

  const transporter = nodemailer.createTransport(emailServer);
  const verifyUrl = `${BASE_URL}/api/email/confirm?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@enopax.com',
    to: email,
    subject: 'Verify your Enopax account',
    html: `
      <div style="max-width:500px; margin:0 auto; font-family:Arial,sans-serif; padding:40px 20px;">
        <h2 style="color:#1f2937; margin-bottom:16px;">Verify your email</h2>
        <p style="color:#4b5563; line-height:1.6;">
          Click the button below to verify your email address and activate your account.
        </p>
        <div style="text-align:center; margin:32px 0;">
          <a href="${verifyUrl}"
             style="background:#3b82f6; color:white; padding:12px 32px; border-radius:8px; text-decoration:none; font-weight:600;">
            Verify Email
          </a>
        </div>
        <p style="color:#9ca3af; font-size:13px;">
          This link expires in ${TOKEN_EXPIRY_HOURS} hours. If you didn't create an account, ignore this email.
        </p>
        <p style="color:#9ca3af; font-size:12px; margin-top:24px; border-top:1px solid #e5e7eb; padding-top:16px;">
          <a href="${verifyUrl}" style="color:#6b7280; word-break:break-all;">${verifyUrl}</a>
        </p>
      </div>
    `,
  });
}
