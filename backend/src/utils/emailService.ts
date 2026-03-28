import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[Email] Skipped (no credentials configured):', subject);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Daan Bridge" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('[Email] Sent to', to, ':', subject);
  } catch (err) {
    console.error('[Email] Failed to send:', err);
  }
}

export function buildEmailHtml(title: string, message: string, link?: string): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 20px 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🌉 Daan Bridge</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1e293b; margin-top: 0;">${title}</h2>
        <p style="color: #475569; line-height: 1.6; font-size: 15px;">${message}</p>
        ${link ? `<a href="http://localhost:5173/#${link}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">View Details</a>` : ''}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">This is an automated notification from Daan Bridge. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}
