import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Sends a transactional email via configured SMTP.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  return transporter.sendMail({
    from:    process.env.SMTP_FROM ?? '"XPO India" <noreply@xpoindia.com>',
    to,
    subject,
    html,
    text,
  });
}

/**
 * Sends a 6-digit OTP email.
 */
export async function sendOtpEmail(to: string, otp: string, type: string) {
  const typeLabel =
    type === 'password_reset'    ? 'Password Reset' :
    type === 'email_verification'? 'Email Verification' :
    'Verification';

  return sendEmail({
    to,
    subject: `Your XPO India ${typeLabel} Code: ${otp}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;">
        <h2 style="color:#E8192C;">XPO India</h2>
        <p>Your ${typeLabel} code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#222;padding:16px;background:#F7F7F7;border-radius:8px;text-align:center;">
          ${otp}
        </div>
        <p style="color:#717171;font-size:13px;margin-top:16px;">
          This code expires in 15 minutes. Do not share it with anyone.
        </p>
      </div>
    `,
    text: `Your XPO India ${typeLabel} code is ${otp}. Expires in 15 minutes.`,
  });
}
