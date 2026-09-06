import nodemailer from 'nodemailer';
import { env } from '../config/env';

// ============================================================
// SMTP транспорт — инициализация один раз
// ============================================================

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: Number(env.SMTP_PORT) === 465, // true для 465, false для 587
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // разрешить самоподписанные сертификаты для локального SMTP
  },
});

// Проверка подключения к SMTP при старте
transporter.verify((error) => {
  if (error) {
    console.warn('[EMAIL] SMTP connection error:', error.message);
    console.warn('[EMAIL] Email-функции будут недоступны до настройки SMTP');
  } else {
    console.log('[EMAIL] SMTP connection verified successfully');
  }
});

// ============================================================
// Отправка email
// ============================================================

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<{ success: boolean; messageId?: string }> => {
  try {
    const mailOptions = {
      from: env.SMTP_FROM || `"Balloo Messenger" <${env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Sent to', options.to, 'messageId:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[EMAIL] Failed to send to', options.to, ':', error.message);
    return { success: false };
  }
};

// ============================================================
// Шаблоны писем
// ============================================================

const getWelcomeEmailHtml = (username: string): string => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Добро пожаловать в Balloo!</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #1a1a2e; color: #e0e0e0;">
    <table align="center" width="600" cellpadding="0" cellspacing="0" style="margin: 40px auto; background-color: #16213e; border-radius: 12px; overflow: hidden;">
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #2db84d 0%, #1a8a3a 100%); padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: #ffffff;">🎈 Balloo Messenger</h1>
        </td>
      </tr>
      <!-- Content -->
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #2db84d;">Добро пожаловать, ${username}!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #b0b0c0;">
            Ваш аккаунт успешно создан. Теперь вы можете:
          </p>
          <ul style="font-size: 15px; line-height: 1.8; color: #b0b0c0;">
            <li>Отправлять сообщения и медиафайлы</li>
            <li>Создавать группы и каналы</li>
            <li>Использовать истории</li>
            <li>Настроить безопасность и конфиденциальность</li>
          </ul>
          <p style="font-size: 15px; line-height: 1.6; color: #b0b0c0;">
            Если у вас есть вопросы, загляните в нашу документацию или напишите нам на <a href="mailto:support@balloo.su" style="color: #2db84d;">support@balloo.su</a>.
          </p>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="background-color: #0f0f23; padding: 20px 30px; text-align: center; font-size: 13px; color: #666;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Balloo Messenger. Все права защищены.</p>
          <p style="margin: 5px 0 0 0;">
            <a href="https://balloo.su/privacy" style="color: #888; text-decoration: none;">Конфиденциальность</a> · 
            <a href="https://balloo.su/rules" style="color: #888; text-decoration: none;">Правила</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

const getVerificationEmailHtml = (token: string): string => {
  const verificationUrl = `${env.CORS_ORIGIN || 'https://balloo.su'}/verify-email?token=${token}`;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Подтверждение email — Balloo</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #1a1a2e; color: #e0e0e0;">
      <table align="center" width="600" cellpadding="0" cellspacing="0" style="margin: 40px auto; background-color: #16213e; border-radius: 12px; overflow: hidden;">
        <tr>
          <td style="background: linear-gradient(135deg, #2db84d 0%, #1a8a3a 100%); padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; color: #ffffff;">🎈 Подтверждение email</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <p style="font-size: 16px; line-height: 1.6; color: #b0b0c0;">
              Спасибо за регистрацию! Пожалуйста, подтвердите свой email-адрес, нажав на кнопку ниже:
            </p>
            <table align="center" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
              <tr>
                <td style="background-color: #2db84d; border-radius: 8px;">
                  <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 8px;">
                    Подтвердить email
                  </a>
                </td>
              </tr>
            </table>
            <p style="font-size: 14px; color: #888; text-align: center;">
              или перейдите по ссылке: ${verificationUrl}
            </p>
            <p style="font-size: 14px; color: #888;">
              Если вы не создавали аккаунт в Balloo, проигнорируйте это письмо.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #0f0f23; padding: 20px 30px; text-align: center; font-size: 13px; color: #666;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Balloo Messenger. Все права защищены.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const getResetPasswordEmailHtml = (token: string): string => {
  const resetUrl = `${env.CORS_ORIGIN || 'https://balloo.su'}/reset-password?token=${token}`;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Сброс пароля — Balloo</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #1a1a2e; color: #e0e0e0;">
      <table align="center" width="600" cellpadding="0" cellspacing="0" style="margin: 40px auto; background-color: #16213e; border-radius: 12px; overflow: hidden;">
        <tr>
          <td style="background: linear-gradient(135deg, #2db84d 0%, #1a8a3a 100%); padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; color: #ffffff;">🎈 Сброс пароля</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <p style="font-size: 16px; line-height: 1.6; color: #b0b0c0;">
              Мы получили запрос на сброс пароля для вашего аккаунта Balloo. Нажмите кнопку ниже, чтобы установить новый пароль:
            </p>
            <table align="center" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
              <tr>
                <td style="background-color: #2db84d; border-radius: 8px;">
                  <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 8px;">
                    Сбросить пароль
                  </a>
                </td>
              </tr>
            </table>
            <p style="font-size: 14px; color: #888; text-align: center;">
              или перейдите по ссылке: ${resetUrl}
            </p>
            <p style="font-size: 14px; color: #888;">
              Эта ссылка действительна в течение 1 часа.<br>
              Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #0f0f23; padding: 20px 30px; text-align: center; font-size: 13px; color: #666;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Balloo Messenger. Все права защищены.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// ============================================================
// Публичные функции
// ============================================================

/**
 * Отправить приветственное письмо после регистрации
 */
export const sendWelcomeEmail = async (email: string, username: string): Promise<boolean> => {
  const result = await sendEmail({
    to: email,
    subject: 'Добро пожаловать в Balloo Messenger! 🎈',
    html: getWelcomeEmailHtml(username),
    text: `Добро пожаловать в Balloo Messenger, ${username}! Ваш аккаунт успешно создан.`,
  });
  return result.success;
};

/**
 * Отправить письмо с токеном верификации email
 */
export const sendVerificationEmail = async (email: string, token: string): Promise<boolean> => {
  const result = await sendEmail({
    to: email,
    subject: 'Подтверждение email — Balloo Messenger',
    html: getVerificationEmailHtml(token),
    text: `Подтвердите ваш email, перейдя по ссылке: ${env.CORS_ORIGIN || 'https://balloo.su'}/verify-email?token=${token}`,
  });
  return result.success;
};

/**
 * Отправить письмо со ссылкой на сброс пароля
 */
export const sendResetPasswordEmail = async (email: string, token: string): Promise<boolean> => {
  const result = await sendEmail({
    to: email,
    subject: 'Сброс пароля — Balloo Messenger',
    html: getResetPasswordEmailHtml(token),
    text: `Сбросьте пароль, перейдя по ссылке: ${env.CORS_ORIGIN || 'https://balloo.su'}/reset-password?token=${token}\n\nЭта ссылка действительна в течение 1 часа.`,
  });
  return result.success;
};
