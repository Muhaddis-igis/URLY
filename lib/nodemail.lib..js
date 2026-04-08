import nodemailer from 'nodemailer';
// Create a transporter using SMTP
const shouldUseEtherealFallback =
  !process.env.SMTP_USER || !process.env.SMTP_PASS;

const testAccount = shouldUseEtherealFallback
  ? await nodemailer.createTestAccount()
  : null;

const smtpHost = process.env.SMTP_HOST || 'smtp.ethereal.email';
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const smtpUser = process.env.SMTP_USER || testAccount?.user;
const smtpPass = process.env.SMTP_PASS || testAccount?.pass;
const fromAddress = process.env.EMAIL_FROM || smtpUser;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html
    });
    console.log('Email sent:', info.messageId)
      const verifyLink = nodemailer.getTestMessageUrl(info);
  console.log('Preview URL:', verifyLink);;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }

};

