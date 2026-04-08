import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const emailFrom = process.env.EMAIL_FROM || 'Website <website@resend.dev>';

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      html,
    });

    console.log('Email sent:', info.id);

  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};