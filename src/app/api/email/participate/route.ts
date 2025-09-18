import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { EmailTemplate } from '@/lib/constants/email';
import { auth } from '@/lib/auth';

const url = process.env.AUTH_URL;

export async function POST(request: Request): Promise<NextResponse> {
  const { to, subject, name, campName, campLocation, startDate, endDate, campId } = await request.json();
  
  const session = await auth();
  if (!session) return NextResponse.json({
    error: 'No access'
  });

  if (!to || !subject || !name || !campName) {
    return NextResponse.json({ error: 'Missing required fields' });
  }

  const transporter = nodemailer.createTransporter(process.env.EMAIL_SERVER);

  // Format dates for display
  const formatDate = (date: string) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const htmlTemplate = EmailTemplate(`
    <div>
      <h2 class="text-xl font-bold text-gray-800 mb-4">
        Participation Confirmed
      </h2>
      
      <p class="mb-4 text-base text-gray-700">
        Hi ${name},
      </p>
      
      <p class="mb-4 text-base text-gray-700">
        Your participation in <strong>${campName}</strong> has been confirmed.
      </p>

      <div class="bg-gray-50 p-4 rounded-lg mb-4">
        <div class="space-y-2 text-sm">
          ${campLocation ? `<p><strong>Location:</strong> ${campLocation}</p>` : ''}
          ${startDate ? `<p><strong>Start:</strong> ${formatDate(startDate)}</p>` : ''}
          ${endDate ? `<p><strong>End:</strong> ${formatDate(endDate)}</p>` : ''}
        </div>
      </div>

      <div class="text-center mb-4">
        <a
          href="${url}/camps/${campId || 'details'}"
          class="inline-block bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700"
        >
          View Details
        </a>
      </div>

      <p class="text-sm text-gray-600">
        Questions? Contact us at support@yourcamp.com
      </p>
    </div>
  `);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: subject || `Participation Confirmed - ${campName}`,
    html: htmlTemplate,
  };

  try {
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ 
      message: 'Participation confirmation email sent successfully!',
      campName,
      participant: name
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ error: 'Failed to send confirmation email' });
  }
}