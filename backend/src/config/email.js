
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@vendocare.com',
      to,
      subject,
      html,
      attachments,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

module.exports = { transporter, sendEmail };
