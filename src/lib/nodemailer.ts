import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { EmailTemplate } from '@/lib/constants/email';
import Camp from '@/models/Camp';
import Participant from '@/models/Participant';

const url = process.env.AUTH_URL;

export const sendDoubleOptEmail = async (
  email: string,
  participationId: string,
) => {
  const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);
  const confirmationToken = crypto.createHash('sha256')
  .update(participationId.toString() + process.env.SECRET_SALT)
  .digest('hex');

  const htmlTemplate = EmailTemplate(`
    <div>
      <h2 class="text-xl font-bold text-gray-800 mb-4">
        Please confirm your email address
      </h2>
      
      <p class="mb-4 text-base text-gray-700">
        Hi there,
      </p>
      
      <p class="mb-4 text-base text-gray-700">
        Thanks for your interest in <strong>Nomad Camp</strong>! We need to confirm your email address before we can send you updates about upcoming camps.
      </p>

      <div class="text-center mb-6">
        <a href="${url}/api/email/confirm?token=${confirmationToken}" class="inline-block bg-green-600 text-white font-medium py-3 px-6 rounded hover:bg-green-700 text-lg">
          Confirm Email Address
        </a>
      </div>

      <p class="mb-4 text-base text-gray-700">
        Once confirmed, you'll receive:
      </p>
      
      <div class="bg-gray-50 p-4 rounded-lg mb-4">
        <ul class="space-y-2 text-sm text-gray-700">
          <li>Early access to new camp locations</li>
          <li>Exclusive updates and announcements</li>
          <li>Special offers for community members</li>
        </ul>
      </div>

      <p class="text-sm text-gray-600 mb-4">
        If you didn't sign up for this, you can safely ignore this email.
      </p>
      
      <p class="text-sm text-gray-600">
        Questions? Contact us at info@nomadcamp.org
      </p>
    </div>
  `);

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Nomad Camp – Confirm your email`,
    html: htmlTemplate,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Double-Opt email sent successfully to ${email}`);
  } catch (error) {
    console.error('Failed to send double-opt email:', error);
    throw new Error('Email sending failed');
  }
}

export const sendConfirmEmail = async (
  address: string,
  name: string,
  camp: Camp
) => {
  const formatDate = (date: string | Date) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);

  const htmlTemplate = EmailTemplate(`
    <div>
      <h2 class="text-xl font-bold text-gray-800 mb-4">
        Participation Confirmed
      </h2>
      
      <p class="mb-4 text-base text-gray-700">
        Hi ${name},
      </p>
      
      <p class="mb-4 text-base text-gray-700">
        Your participation in <strong>${camp.name}</strong> has been confirmed.
      </p>

      <div class="bg-gray-50 p-4 rounded-lg mb-4">
        <div class="space-y-2 text-sm">
          ${camp.location ? `<p><strong>Location:</strong> ${camp.location}</p>` : ''}
          ${camp.startDate ? `<p><strong>Start:</strong> ${formatDate(camp.startDate)}</p>` : ''}
          ${camp.endDate ? `<p><strong>End:</strong> ${formatDate(camp.endDate)}</p>` : ''}
          ${camp.description ? `<p><strong>Description:</strong> ${camp.description}</p>` : ''}
        </div>
      </div>

      <div class="text-center mb-4">
        <a
          href="${url}/camp/${camp.shortId || camp._id || 'details'}"
          class="inline-block bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700"
        >
          View Details
        </a>
      </div>

      <p class="text-sm text-gray-600">
        Questions? Contact us at info@nomadcamp.org
      </p>
    </div>
  `);

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: address,
    subject: `Participation Confirmed - ${camp.name}`,
    html: htmlTemplate,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent successfully to ${address} for camp: ${camp.name}`);
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    throw new Error('Email sending failed');
  }
}

export const sendEmailToMe = async (participant: Participant) => {
  const formatDate = (date: string | Date) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);

  const htmlTemplate = EmailTemplate(`
    <div>
      <p><strong>New Camp Application</strong></p>
      <p>Name: ${participant.firstname} ${participant.lastname}</p>
      <p>Group size: ${participant.groupSize}</p>
      <p>Stays for: ${participant.stayDuration}</p>
      <p>Preferred start: ${formatDate(participant.preferredStartDate)}</p>
    </div>
  `);

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_FROM,
    subject: `New Application: ${participant.firstname} ${participant.lastname}`,
    html: htmlTemplate,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Short notification email sent for ${participant.firstname} ${participant.lastname}`);
  } catch (error) {
    console.error('Failed to send short notification email:', error);
    throw new Error('Email sending failed');
  }
};