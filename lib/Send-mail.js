import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await resend.emails.send({
      from: 'Website <website@resend.dev>',
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