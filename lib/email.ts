/**
 * Email Service for SchoolMatica
 *
 * Handles all email communications including password resets, invitations, notifications, etc.
 *
 * CONFIGURATION:
 * Set the following environment variables for production:
 * - SMTP_HOST: SMTP server hostname (e.g., smtp.gmail.com, smtp.sendgrid.net)
 * - SMTP_PORT: SMTP port (587 for TLS, 465 for SSL)
 * - SMTP_SECURE: "true" for SSL/TLS, "false" for STARTTLS
 * - SMTP_USER: SMTP username/email
 * - SMTP_PASSWORD: SMTP password or app-specific password
 * - SMTP_FROM: Default sender email (e.g., "SchoolMatica <noreply@schoolmatica.co.za>")
 */

import nodemailer from "nodemailer";

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

export interface HomeworkMissingEmailData {
  parentName: string;
  studentName: string;
  homeworkTitle: string;
  subject: string;
  className: string;
  dueDate: string;
  teacherName: string;
  teacherEmail: string;
  schoolName: string;
  customMessage?: string;
}

// Create reusable transporter (lazy initialization)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpSecure = process.env.SMTP_SECURE === "true";
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    // Validate required config in production
    if (process.env.NODE_ENV === "production") {
      if (!smtpHost || !smtpUser || !smtpPassword) {
        throw new Error(
          "Email service not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables."
        );
      }
    }

    transporter = nodemailer.createTransport({
      host: smtpHost || "localhost",
      port: smtpPort,
      secure: smtpSecure,
      auth: smtpUser && smtpPassword ? {
        user: smtpUser,
        pass: smtpPassword,
      } : undefined,
      // Connection pool for better performance
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }
  return transporter;
}

/**
 * Send an email using the configured SMTP service
 *
 * @param options - Email options (to, subject, html, etc.)
 * @returns Promise that resolves when email is sent
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const defaultFrom = process.env.SMTP_FROM || "SchoolMatica <noreply@schoolmatica.co.za>";

  // Development mode: log email details without actually sending
  if (process.env.NODE_ENV === "development" && !process.env.SMTP_HOST) {
    console.log("\n=== EMAIL (Development Mode - Not Sent) ===");
    console.log("To:", options.to);
    console.log("Subject:", options.subject);
    console.log("From:", options.from || defaultFrom);
    console.log("HTML Preview:", options.html.substring(0, 500) + "...");
    console.log("=============================================\n");
    return;
  }

  try {
    const transport = getTransporter();
    
    const mailOptions = {
      from: options.from || defaultFrom,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`[Email] Message sent: ${info.messageId} to ${options.to}`);
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
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

/**
 * Send homework missing notification email to parent
 */
export async function sendHomeworkMissingEmail(
  email: string,
  data: HomeworkMissingEmailData
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Missing Homework Notification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #fef3c7; color: #92400e; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
        ⚠️ HOMEWORK ALERT
      </span>
    </div>

    <h1 style="color: #dc2626; margin-top: 0; text-align: center;">Missing Homework</h1>

    <p>Dear ${data.parentName},</p>

    <p>This is a notification from <strong>${data.schoolName}</strong> regarding incomplete homework for your child.</p>

    <div style="background-color: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1f2937;">Assignment Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Student:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600;">${data.studentName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Assignment:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600;">${data.homeworkTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Subject:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${data.subject}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Class:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${data.className}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Due Date:</td>
          <td style="padding: 8px 0; color: #dc2626; font-weight: 600;">${data.dueDate}</td>
        </tr>
      </table>
    </div>

    ${data.customMessage ? `
    <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #713f12;"><strong>Message from teacher:</strong></p>
      <p style="margin: 10px 0 0 0; color: #78350f;">${data.customMessage}</p>
    </div>
    ` : ''}

    <p>Please ensure that ${data.studentName} completes and submits this assignment as soon as possible. Consistent homework completion is important for academic success.</p>

    <p>If you have any questions about this assignment, please contact the teacher:</p>
    
    <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>${data.teacherName}</strong></p>
      <p style="margin: 5px 0 0 0;">
        <a href="mailto:${data.teacherEmail}" style="color: #2563eb;">${data.teacherEmail}</a>
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 14px; color: #6b7280;">
      <strong>${data.schoolName}</strong><br>
      Powered by SchoolMatica<br>
      Comprehensive School Management System
    </p>

    <p style="font-size: 12px; color: #9ca3af;">
      This is an automated notification from your child's school. Please do not reply directly to this email.
    </p>
  </div>
</body>
</html>
  `;

  const text = `
Missing Homework Notification

Dear ${data.parentName},

This is a notification from ${data.schoolName} regarding incomplete homework for your child.

ASSIGNMENT DETAILS
------------------
Student: ${data.studentName}
Assignment: ${data.homeworkTitle}
Subject: ${data.subject}
Class: ${data.className}
Due Date: ${data.dueDate}

${data.customMessage ? `Message from teacher: ${data.customMessage}\n` : ''}
Please ensure that ${data.studentName} completes and submits this assignment as soon as possible.

If you have any questions, please contact:
${data.teacherName}
${data.teacherEmail}

---
${data.schoolName}
Powered by SchoolMatica
  `;

  await sendEmail({
    to: email,
    subject: `Missing Homework: ${data.homeworkTitle} - ${data.studentName}`,
    html,
    text,
  });
}
