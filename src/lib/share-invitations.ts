import nodemailer from 'nodemailer';
import type { SharePermission } from '@/lib/store';

const BASE_URL = process.env.AUTH_URL || 'http://localhost:3000';

export async function sendShareInvitationEmail(
  recipientEmail: string,
  projectName: string,
  hostOrgName: string,
  permission: SharePermission,
  recipientOrgName?: string,
): Promise<void> {
  const emailServer = process.env.EMAIL_SERVER;
  const invitationsUrl = BASE_URL;

  if (!emailServer) {
    console.warn('EMAIL_SERVER not configured — skipping share invitation email');
    console.log(`Share invitation: ${recipientEmail} invited to ${projectName} by ${hostOrgName}`);
    return;
  }

  const transporter = nodemailer.createTransport(emailServer);
  const recipientLabel = recipientOrgName ? `your organisation (${recipientOrgName})` : 'you';

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@enopax.com',
    to: recipientEmail,
    subject: `${hostOrgName} has invited ${recipientOrgName ?? 'you'} to collaborate on ${projectName}`,
    html: `
      <div style="max-width:500px; margin:0 auto; font-family:Arial,sans-serif; padding:40px 20px;">
        <h2 style="color:#1f2937; margin-bottom:16px;">Project collaboration invitation</h2>
        <p style="color:#4b5563; line-height:1.6;">
          <strong>${hostOrgName}</strong> has invited ${recipientLabel} to collaborate on the project
          <strong>${projectName}</strong> with <strong>${permission}</strong> access.
        </p>
        <div style="text-align:center; margin:32px 0;">
          <a href="${invitationsUrl}"
             style="background:#3b82f6; color:white; padding:12px 32px; border-radius:8px; text-decoration:none; font-weight:600;">
            Review invitation
          </a>
        </div>
        <p style="color:#9ca3af; font-size:13px;">
          Log in to Enopax and visit your organisation's Invitations page to accept or decline.
          If you don't recognise this invitation, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
