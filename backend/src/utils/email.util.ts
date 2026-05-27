import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: Number(process.env.SMTP_PORT) || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendMail = async ({ to, subject, html }: SendMailOptions) => {
  const info = await transporter.sendMail({
    from: '"Eduvi LMS" <no-reply@eduvi-lms.com>',
    to,
    subject,
    html,
  });

  console.log('[MAIL] Message sent: %s', info.messageId);
  return info;
};

export const sendPasswordResetEmail = async (
  to: string,
  fullName: string,
  resetToken: string
) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
  const resetUrl = `${frontendUrl}/user/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4F46E5; margin: 0;">Eduvi LMS</h1>
        <p style="color: #6B7280; margin-top: 5px;">Hệ thống Quản lý Học tập Trực tuyến</p>
      </div>

      <div style="background: #F9FAFB; border-radius: 8px; padding: 24px; border: 1px solid #E5E7EB;">
        <h2 style="color: #111827; margin-top: 0;">Xin chào ${fullName},</h2>
        <p style="color: #4B5563; line-height: 1.6;">
          Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
          Nhấn vào nút bên dưới để đặt mật khẩu mới:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="display: inline-block; background: #4F46E5; color: #FFFFFF; text-decoration: none;
                    padding: 12px 32px; border-radius: 8px; font-weight: bold; font-size: 15px;">
            Đặt lại mật khẩu
          </a>
        </div>

        <p style="color: #6B7280; font-size: 13px; line-height: 1.5;">
          Liên kết này sẽ hết hạn sau <strong>15 phút</strong>.
          Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #9CA3AF; font-size: 12px;">
        <p>© 2026 Eduvi LMS. Mọi quyền được bảo lưu.</p>
      </div>
    </div>
  `;

  return sendMail({
    to,
    subject: '[Eduvi LMS] Đặt lại mật khẩu tài khoản',
    html,
  });
};
