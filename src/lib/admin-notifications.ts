import nodemailer from 'nodemailer';
import crypto from 'crypto';

const BASE_URL = process.env.AUTH_URL || 'http://localhost:3000';
const ADMIN_EMAIL = 'register@enopax.com';

function generateActivationToken(userId: string): string {
  const secret = process.env.AUTH_SECRET || '';
  return crypto.createHmac('sha256', secret).update(userId).digest('hex');
}

export async function sendAdminRegistrationNotification(
  userId: string,
  userEmail: string,
  userName: string,
): Promise<void> {
  const emailServer = process.env.EMAIL_SERVER;
  const activationToken = generateActivationToken(userId);
  const activateUrl = `${BASE_URL}/api/admin/activate-user?userId=${userId}&token=${activationToken}`;

  if (!emailServer) {
    console.warn('EMAIL_SERVER not configured — skipping admin notification');
    console.log(`New registration: ${userEmail} (${userName})`);
    console.log(`Activation link: ${activateUrl}`);
    return;
  }

  const transporter = nodemailer.createTransport(emailServer);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@enopax.com',
    to: ADMIN_EMAIL,
    subject: `New registration: ${userName} (${userEmail})`,
    html: `
      <div style="max-width:500px; margin:0 auto; font-family:Arial,sans-serif; padding:40px 20px;">
        <h2 style="color:#1f2937; margin-bottom:16px;">New Enopax Registration</h2>
        <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
          <tr><td style="padding:8px 0; color:#6b7280;">Name</td><td style="padding:8px 0; font-weight:600;">${userName}</td></tr>
          <tr><td style="padding:8px 0; color:#6b7280;">Email</td><td style="padding:8px 0; font-weight:600;">${userEmail}</td></tr>
          <tr><td style="padding:8px 0; color:#6b7280;">Status</td><td style="padding:8px 0;"><span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:4px; font-size:13px;">Early Access</span></td></tr>
        </table>
        <div style="text-align:center; margin:32px 0;">
          <a href="${activateUrl}"
             style="background:#3b82f6; color:white; padding:12px 32px; border-radius:8px; text-decoration:none; font-weight:600;">
            Activate Account
          </a>
        </div>
        <p style="color:#9ca3af; font-size:13px; text-align:center;">
          Clicking this link will give the user full platform access.
        </p>
      </div>
    `,
  });
}
