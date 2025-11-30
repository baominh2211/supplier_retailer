import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    if (config.email.host && config.email.user) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });
    }
  }

  private async send(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      logger.warn({ to: options.to, subject: options.subject }, 'Email skipped - no transporter configured');
      if (config.isDev) {
        logger.info({ email: options }, 'Email would have been sent (development mode)');
      }
      return;
    }

    try {
      await this.transporter.sendMail({
        from: config.email.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info({ to: options.to, subject: options.subject }, 'Email sent successfully');
    } catch (error) {
      logger.error({ error, to: options.to }, 'Failed to send email');
      throw error;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${config.app.frontendUrl}/verify-email?token=${token}`;

    await this.send({
      to: email,
      subject: `Verify your email - ${config.app.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${config.app.name}</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for registering with ${config.app.name}!</p>
              <p>Please click the button below to verify your email address:</p>
              <a href="${verificationUrl}" class="button">Verify Email</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${config.app.name}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Verify Your Email Address
        
        Thank you for registering with ${config.app.name}!
        
        Please visit the following link to verify your email address:
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, you can safely ignore this email.
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${config.app.frontendUrl}/reset-password?token=${token}`;

    await this.send({
      to: email,
      subject: `Reset your password - ${config.app.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${config.app.name}</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>We received a request to reset your password.</p>
              <p>Click the button below to create a new password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${config.app.name}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Reset Your Password
        
        We received a request to reset your password.
        
        Please visit the following link to create a new password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, you can safely ignore this email.
      `,
    });
  }

  async sendSupplierVerificationEmail(email: string, companyName: string, approved: boolean, reason?: string): Promise<void> {
    const subject = approved
      ? `Your supplier account has been verified - ${config.app.name}`
      : `Supplier verification update - ${config.app.name}`;

    const content = approved
      ? `
        <h2>Congratulations!</h2>
        <p>Your supplier account for <strong>${companyName}</strong> has been verified.</p>
        <p>You can now:</p>
        <ul>
          <li>List products on the marketplace</li>
          <li>Receive inquiries from buyers</li>
          <li>Start negotiations with shops</li>
        </ul>
        <a href="${config.app.frontendUrl}/dashboard" class="button">Go to Dashboard</a>
      `
      : `
        <h2>Verification Update</h2>
        <p>Unfortunately, we were unable to verify your supplier account for <strong>${companyName}</strong> at this time.</p>
        <p><strong>Reason:</strong> ${reason || 'Additional documentation required'}</p>
        <p>Please review your submitted information and try again, or contact our support team for assistance.</p>
        <a href="${config.app.frontendUrl}/supplier/verification" class="button">Update Application</a>
      `;

    await this.send({
      to: email,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${config.app.name}</h1>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${config.app.name}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendNegotiationNotification(
    email: string,
    type: 'new' | 'message' | 'agreed' | 'cancelled',
    data: { sessionId: string; productName?: string; shopName?: string; supplierName?: string }
  ): Promise<void> {
    const subjects: Record<typeof type, string> = {
      new: 'New negotiation request',
      message: 'New message in your negotiation',
      agreed: 'Negotiation agreement reached!',
      cancelled: 'Negotiation has been cancelled',
    };

    const negotiationUrl = `${config.app.frontendUrl}/negotiations/${data.sessionId}`;

    await this.send({
      to: email,
      subject: `${subjects[type]} - ${config.app.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${config.app.name}</h1>
            </div>
            <div class="content">
              <h2>${subjects[type]}</h2>
              ${data.productName ? `<p><strong>Product:</strong> ${data.productName}</p>` : ''}
              ${data.shopName ? `<p><strong>Shop:</strong> ${data.shopName}</p>` : ''}
              ${data.supplierName ? `<p><strong>Supplier:</strong> ${data.supplierName}</p>` : ''}
              <a href="${negotiationUrl}" class="button">View Negotiation</a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${config.app.name}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendPurchaseIntentNotification(
    email: string,
    type: 'created' | 'submitted' | 'agreed' | 'cancelled' | 'expired',
    data: { intentNumber: string; productName: string; amount: string }
  ): Promise<void> {
    const subjects: Record<typeof type, string> = {
      created: 'Purchase intent created',
      submitted: 'New purchase intent received',
      agreed: 'Purchase intent agreed!',
      cancelled: 'Purchase intent cancelled',
      expired: 'Purchase intent expired',
    };

    const intentUrl = `${config.app.frontendUrl}/purchase-intents/${data.intentNumber}`;

    await this.send({
      to: email,
      subject: `${subjects[type]} - ${config.app.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${config.app.name}</h1>
            </div>
            <div class="content">
              <h2>${subjects[type]}</h2>
              <div class="details">
                <p><strong>Intent Number:</strong> ${data.intentNumber}</p>
                <p><strong>Product:</strong> ${data.productName}</p>
                <p><strong>Total Amount:</strong> ${data.amount}</p>
              </div>
              <a href="${intentUrl}" class="button">View Details</a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${config.app.name}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }
}

export const emailService = new EmailService();
