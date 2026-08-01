const nodemailer = require('nodemailer');
const crypto = require('crypto');

class SimpleEmailService {
  constructor() {
    this.transporter = null;
  }

  async initialize() {
    if (!this.transporter) {
      // Create transporter using Gmail SMTP
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER, // Your Gmail address
          pass: process.env.GMAIL_APP_PASSWORD // Gmail App Password
        }
      });
    }
  }

  // Whether mail can actually be delivered. The credentials are the real
  // determinant: without them nodemailer authenticates as `undefined` and
  // Gmail rejects the session, so "send" means "throw". Callers use this to
  // decide whether a flow that depends on email is worth starting at all.
  //
  // NODE_ENV is deliberately not part of this. The old guards keyed off it
  // (`NODE_ENV !== 'production' && !forceSend`), which made SEND_EMAILS a
  // no-op on Fargate - every method tried to send there no matter what.
  isConfigured() {
    // Explicit off switch for a deploy that has credentials but should stay
    // quiet. Anything else falls through to whether credentials exist.
    if (process.env.SEND_EMAILS === 'false') {
      return false;
    }
    return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  }

  // Origin for the pages in this service's own public/ directory -
  // verify-email.html and reset-password.html. In production CloudFront routes
  // /verify-email* and /reset-password* to the ALB, so the distribution URL
  // reaches them and the link stays same-origin with the API it calls.
  // Locally FRONTEND_URL points at the Vite dev server, which does not serve
  // these files, so fall back to the API's own port.
  backendPageOrigin() {
    if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
      return process.env.FRONTEND_URL.replace(/\/+$/, '');
    }
    return `http://localhost:${process.env.PORT || 3456}`;
  }

  // Generate verification token
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate token expiry (24 hours from now)
  generateTokenExpiry() {
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  async sendVerificationEmail(userEmail, verificationToken) {
    const verificationUrl = `${this.backendPageOrigin()}/verify-email.html?token=${verificationToken}`;

    // Always log for debugging
    console.log('=== EMAIL VERIFICATION ===');
    console.log(`To: ${userEmail}`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log('========================');

    // This method used to have no guard at all, unlike every other one here.
    // On Fargate that meant an unavoidable throw on every registration.
    if (!this.isConfigured()) {
      console.log('Email is not configured - logged the URL above instead of sending.');
      return { messageId: 'not-configured' };
    }

    // Initialize Gmail transporter
    await this.initialize();

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: userEmail,
      subject: 'Verify Your Email Address - Renting Online',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Thank you for registering with Renting Online!</p>
          <p>Please click the button below to verify your email address:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          
          <p><strong>Important:</strong> This verification link will expire in 24 hours.</p>
          
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            If you didn't create an account with us, please ignore this email.
          </p>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully to:', userEmail);
      return result;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(userEmail, resetToken) {
    // reset-password.html is served by this API, not by the SPA build.
    const resetUrl = `${this.backendPageOrigin()}/reset-password.html?token=${resetToken}`;

    // Without credentials we only log the URL, which is still enough to walk
    // through the flow by hand.
    if (!this.isConfigured()) {
      console.log('=== PASSWORD RESET ===');
      console.log(`To: ${userEmail}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('=====================');
      return { messageId: 'not-configured' };
    }

    await this.initialize();

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: userEmail,
      subject: 'Password Reset - Renting Online',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>We received a request to reset your password for your Renting Online account.</p>
          <p>Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #ff6b6b; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          
          <p><strong>Important:</strong> This reset link will expire in 1 hour.</p>
          
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully to:', userEmail);
      return result;
    } catch (error) {
      // Log the error and also output the reset URL so you can copy it for testing
      console.error('Error sending password reset email:', error);
      console.log('Fallback - reset URL (copy to browser):', resetUrl);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendOrderEmail(userEmail, order) {
    const subject = `Order ${order.orderNumber} - Status: ${order.status}`;
    const orderUrl = `${process.env.FRONTEND_URL || 'http://localhost:3456'}/orders/${order.orderNumber}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <h2 style="color:#333;">Order Confirmation</h2>
        <p>Thank you for your order. Below are your order details:</p>
        <ul style="line-height:1.7;">
          <li><strong>Order Number:</strong> ${order.orderNumber}</li>
          <li><strong>Status:</strong> ${order.status}</li>
          <li><strong>Product ID:</strong> ${order.productId}</li>
          <li><strong>Quantity:</strong> ${order.quantity}</li>
          <li><strong>Total:</strong> ${typeof order.totalAmount !== 'undefined' ? order.totalAmount : ''}</li>
        </ul>
        <div style="margin: 24px 0;">
          <a href="${orderUrl}" style="background:#4CAF50;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;display:inline-block;">View Order</a>
        </div>
        <p style="color:#666;font-size:12px;">If you did not place this order, please contact support.</p>
      </div>
    `;

    // Log instead of sending when mail is not configured.
    if (!this.isConfigured()) {
      console.log('=== ORDER EMAIL (not sent) ===');
      console.log(`To: ${userEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Order URL: ${orderUrl}`);
      console.log('==============================');
      return { messageId: 'not-configured' };
    }

    await this.initialize();

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: userEmail,
      subject,
      html,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Order email sent successfully to:', userEmail);
      return result;
    } catch (error) {
      console.error('Error sending order email:', error);
      throw new Error('Failed to send order email');
    }
  }

  async sendAdminNotificationToSeller(sellerEmail, subject, message, productName) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ff4757; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Admin Notification</h2>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
            <strong>Regarding Product:</strong> ${productName}
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff4757;">
            <p style="color: #333; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Please take the necessary action to address this matter.
          </p>
        </div>
        <div style="background: #333; color: #999; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">This is an automated message from the Admin Team.</p>
          <p style="margin: 5px 0 0 0;">Renting Online Platform</p>
        </div>
      </div>
    `;

    // Log instead of sending when mail is not configured.
    if (!this.isConfigured()) {
      console.log('=== ADMIN NOTIFICATION TO SELLER (not sent) ===');
      console.log(`To: ${sellerEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Product: ${productName}`);
      console.log(`Message: ${message}`);
      console.log('===============================================');
      return { messageId: 'not-configured', success: true };
    }

    await this.initialize();

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: sellerEmail,
      subject,
      html,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Admin notification sent successfully to seller:', sellerEmail);
      return result;
    } catch (error) {
      console.error('Error sending admin notification to seller:', error);
      throw new Error('Failed to send notification to seller');
    }
  }
}

module.exports = new SimpleEmailService();