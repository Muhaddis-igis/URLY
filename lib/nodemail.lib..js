import nodemailer from 'nodemailer';
// Create a transporter using SMTP
const testAccount = await nodemailer.createTestAccount();
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: testAccount.user,
    pass: testAccount.pass,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: testAccount.user,
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

