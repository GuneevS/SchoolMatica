/**
 * Email Service for SchoolMatica
 *
 * Handles all email communications including password resets, invitations, notifications, etc.
 *
 * PRODUCTION SETUP REQUIRED:
 * This module provides a structure for email sending but requires configuration
 * of an actual email service provider. Choose one of the following:
 *
 * 1. Resend (Recommended - Modern, developer-friendly)
 *    - npm install resend
 *    - Set RESEND_API_KEY in environment
 *    - https://resend.com/docs
 *
 * 2. SendGrid (Popular, reliable)
 *    - npm install @sendgrid/mail
 *    - Set SENDGRID_API_KEY in environment
 *    - https://sendgrid.com/docs
 *
 * 3. AWS SES (Cost-effective for high volume)
 *    - npm install @aws-sdk/client-ses
 *    - Set AWS credentials in environment
 *    - https://aws.amazon.com/ses/
 *
 * 4. Nodemailer (SMTP - Generic)
 *    - npm install nodemailer
 *    - Set SMTP credentials in environment
 *    - https://nodemailer.com/
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface PasswordResetEmailData {
  recipientName: string;
  resetUrl: string;
  expiryHours: number;
}

export interface TeacherInvitationEmailData {
  recipientName: string;
  schoolName: string;
  invitationUrl: string;
  inviterName: string;
}

/**
 * Send an email using the configured email service
 *
 * @param options - Email options (to, subject, html, etc.)
 * @returns Promise that resolves when email is sent
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  // TODO: Implement actual email sending in production
  // For now, log to console in development

  if (process.env.NODE_ENV === "development") {
    console.log("\n=== EMAIL (Development Mode) ===");
    console.log("To:", options.to);
    console.log("Subject:", options.subject);
    console.log("From:", options.from || process.env.SMTP_FROM || "noreply@schoolmatica.co.za");
    console.log("HTML Preview:", options.html.substring(0, 200) + "...");
    console.log("================================\n");
    return;
  }

  // PRODUCTION IMPLEMENTATION EXAMPLES:

  // Example 1: Using Resend
  /*
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: options.from || 'SchoolMatica <noreply@schoolmatica.co.za>',
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html,
    text: options.text,
    reply_to: options.replyTo,
  });
  */

  // Example 2: Using SendGrid
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  await sgMail.send({
    to: options.to,
    from: options.from || 'noreply@schoolmatica.co.za',
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
  });
  */

  // Example 3: Using Nodemailer (SMTP)
  /*
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: options.from || process.env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
  });
  */

  throw new Error(
    "Email service not configured. Please implement sendEmail() in lib/email.ts " +
      "with your chosen email provider (Resend, SendGrid, AWS SES, or SMTP)."
  );
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  data: PasswordResetEmailData
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
    <h1 style="color: #2563eb; margin-top: 0;">Reset Your Password</h1>

    <p>Hello ${data.recipientName},</p>

    <p>We received a request to reset your password for your SchoolMatica account.</p>

    <p>Click the button below to reset your password:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.resetUrl}"
         style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 600;">
        Reset Password
      </a>
    </div>

    <p>Or copy and paste this link into your browser:</p>
    <p style="background-color: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all;">
      ${data.resetUrl}
    </p>

    <p><strong>This link will expire in ${data.expiryHours} hour${data.expiryHours !== 1 ? "s" : ""}.</strong></p>

    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 14px; color: #6b7280;">
      <strong>SchoolMatica</strong><br>
      Comprehensive School Management System<br>
      South Africa
    </p>

    <p style="font-size: 12px; color: #9ca3af;">
      This is an automated email. Please do not reply to this message.
    </p>
  </div>
</body>
</html>
  `;

  const text = `
Reset Your Password

Hello ${data.recipientName},

We received a request to reset your password for your SchoolMatica account.

Click the link below to reset your password:
${data.resetUrl}

This link will expire in ${data.expiryHours} hour${data.expiryHours !== 1 ? "s" : ""}.

If you didn't request a password reset, you can safely ignore this email.

---
SchoolMatica
Comprehensive School Management System
South Africa
  `;

  await sendEmail({
    to: email,
    subject: "Reset Your SchoolMatica Password",
    html,
    text,
  });
}

/**
 * Send teacher invitation email
 */
export async function sendTeacherInvitationEmail(
  email: string,
  data: TeacherInvitationEmailData
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Teacher Account Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
    <h1 style="color: #2563eb; margin-top: 0;">Welcome to SchoolMatica</h1>

    <p>Hello ${data.recipientName},</p>

    <p>${data.inviterName} has invited you to join <strong>${data.schoolName}</strong> on SchoolMatica.</p>

    <p>SchoolMatica is a comprehensive school management system designed for South African schools,
    helping you manage assessments, grades, and student records efficiently.</p>

    <p>Click the button below to accept the invitation and set up your account:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.invitationUrl}"
         style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 600;">
        Accept Invitation
      </a>
    </div>

    <p>Or copy and paste this link into your browser:</p>
    <p style="background-color: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all;">
      ${data.invitationUrl}
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 14px; color: #6b7280;">
      <strong>SchoolMatica</strong><br>
      Comprehensive School Management System<br>
      South Africa
    </p>

    <p style="font-size: 12px; color: #9ca3af;">
      This is an automated email. Please do not reply to this message.
    </p>
  </div>
</body>
</html>
  `;

  const text = `
Welcome to SchoolMatica

Hello ${data.recipientName},

${data.inviterName} has invited you to join ${data.schoolName} on SchoolMatica.

Click the link below to accept the invitation:
${data.invitationUrl}

---
SchoolMatica
Comprehensive School Management System
South Africa
  `;

  await sendEmail({
    to: email,
    subject: `Invitation to join ${data.schoolName} on SchoolMatica`,
    html,
    text,
  });
}
