
const nodemailer = require('nodemailer');
const logger = require('../../core/utils/logger');

class EmailTemplates {
  constructor() {
    this.transporter = null;
  }

  async init() {
    const emailConfig = require('../../config/email');
    this.transporter = nodemailer.createTransport(emailConfig);
    logger.info('Email transporter initialized');
  }

  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@vendocare.com',
      to: user.email,
      subject: 'Welcome to VendoCare!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to VendoCare!</h1>
          <p>Hi ${user.name},</p>
          <p>Thank you for joining VendoCare. Your account has been created successfully.</p>
          <p><strong>Your login credentials:</strong></p>
          <ul>
            <li>Email: ${user.email}</li>
            <li>Role: ${user.role}</li>
          </ul>
          <p>Please log in and complete your profile setup.</p>
          <a href="${process.env.FRONTEND_URL || 'https://vendo-care.vercel.app'}" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            Go to Dashboard
          </a>
          <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
            Best regards,<br>
            The VendoCare Team
          </p>
        </div>
      `,
    };

    return this.send(mailOptions);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://vendo-care.vercel.app'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@vendocare.com',
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Password Reset</h1>
          <p>Hi ${user.name},</p>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <a href="${resetUrl}" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            Reset Password
          </a>
          <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    };

    return this.send(mailOptions);
  }

  async sendInvoiceNotification(vendor, invoice) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@vendocare.com',
      to: vendor.email,
      subject: `New Invoice: ${invoice.invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">New Invoice</h1>
          <p>Hi ${vendor.name},</p>
          <p>A new invoice has been generated for your services.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Invoice Number:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${invoice.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Amount:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">₹${invoice.totalAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Due Date:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
            </tr>
          </table>
          <p>Please log in to your vendor portal to view the full details.</p>
        </div>
      `,
    };

    return this.send(mailOptions);
  }

  async sendPaymentConfirmation(vendor, payment) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@vendocare.com',
      to: vendor.email,
      subject: `Payment Received: ${payment.transactionId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">Payment Received!</h1>
          <p>Hi ${vendor.name},</p>
          <p>We have received your payment. Here are the details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Transaction ID:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${payment.transactionId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Amount:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">₹${payment.amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(payment.paymentDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Method:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${payment.method.replace('_', ' ')}</td>
            </tr>
          </table>
        </div>
      `,
    };

    return this.send(mailOptions);
  }

  async sendContractExpiryNotification(vendor, contract) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@vendocare.com',
      to: vendor.email,
      subject: `Contract Expiring: ${contract.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ea580c;">Contract Expiring Soon</h1>
          <p>Hi ${vendor.name},</p>
          <p>This is a reminder that your contract is expiring soon:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Contract:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${contract.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>End Date:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(contract.endDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Amount:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">₹${contract.amount.toLocaleString()}</td>
            </tr>
          </table>
          <p>Please contact us if you wish to renew or discuss the contract terms.</p>
        </div>
      `,
    };

    return this.send(mailOptions);
  }

  async send(mailOptions) {
    if (!this.transporter) {
      await this.init();
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Email failed: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new EmailTemplates();
