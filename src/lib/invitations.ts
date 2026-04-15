import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { getStoreAsync } from '@/lib/store';
import type { OrganisationRole } from '@/lib/store';

const BASE_URL = process.env.AUTH_URL || 'http://localhost:3000';
const TOKEN_TTL_DAYS = 7;

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createInvitationToken(
  email: string,
  organisationId: string,
  role: OrganisationRole,
  invitedBy: string,
): Promise<{ token: string; expiresAt: Date }> {
  const store = await getStoreAsync();

  const existing = await store.invitations.findByEmailAndOrg(email, organisationId, 'PENDING');
  if (existing && existing.expiresAt > new Date()) {
    return { token: existing.token, expiresAt: existing.expiresAt };
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await store.invitations.create({
    token,
    email,
    organisationId,
    role,
    invitedBy,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function sendInvitationEmail(
  email: string,
  token: string,
  organisationName: string,
  inviterName: string,
  role: OrganisationRole,
): Promise<void> {
  const emailServer = process.env.EMAIL_SERVER;
  const acceptUrl = `${BASE_URL}/accept-invite?token=${token}`;

  if (!emailServer) {
    console.warn('EMAIL_SERVER not configured — skipping invitation email');
    console.log(`Invitation link: ${acceptUrl}`);
    return;
  }

  const transporter = nodemailer.createTransport(emailServer);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@enopax.com',
    to: email,
    subject: `You're invited to join ${organisationName} on Enopax`,
    html: `
      <div style="max-width:500px; margin:0 auto; font-family:Arial,sans-serif; padding:40px 20px;">
        <h2 style="color:#1f2937; margin-bottom:16px;">You've been invited to join ${organisationName}</h2>
        <p style="color:#4b5563; line-height:1.6;">
          ${inviterName} invited you to join <strong>${organisationName}</strong> on Enopax as <strong>${role}</strong>.
        </p>
        <div style="text-align:center; margin:32px 0;">
          <a href="${acceptUrl}"
             style="background:#3b82f6; color:white; padding:12px 32px; border-radius:8px; text-decoration:none; font-weight:600;">
            Accept invitation
          </a>
        </div>
        <p style="color:#9ca3af; font-size:13px;">
          This link expires in ${TOKEN_TTL_DAYS} days. If you don't recognise this invite, ignore this email.
        </p>
        <p style="color:#9ca3af; font-size:12px; margin-top:24px; border-top:1px solid #e5e7eb; padding-top:16px;">
          <a href="${acceptUrl}" style="color:#6b7280; word-break:break-all;">${acceptUrl}</a>
        </p>
      </div>
    `,
  });
}
