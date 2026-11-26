import { EmailMessage } from '../../domain/ports/email-sender.port';
import { SmsMessage } from '../../domain/ports/sms-sender.port';

const APP_NAME = 'Balcony';

/** The text says how long the code lives and that we never ask for it, against phishing. */
export function verificationEmail(
  to: string,
  code: string,
  ttlMinutes: number,
): EmailMessage {
  return {
    to,
    subject: `${code} is your ${APP_NAME} verification code`,
    text:
      `Your ${APP_NAME} verification code is ${code}.\n\n` +
      `It expires in ${ttlMinutes} minutes. ${APP_NAME} will never ask you for this code.\n` +
      `If you didn't create an account, you can ignore this email.`,
    html:
      `<p>Your ${APP_NAME} verification code is:</p>` +
      `<p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>` +
      `<p>It expires in ${ttlMinutes} minutes. ${APP_NAME} will never ask you for this code.</p>` +
      `<p>If you didn't create an account, you can ignore this email.</p>`,
  };
}

/** Says what to do if it wasn't them: nothing changes until the code is used. */
export function passwordResetEmail(
  to: string,
  code: string,
  ttlMinutes: number,
): EmailMessage {
  return {
    to,
    subject: `${code} is your ${APP_NAME} password reset code`,
    text:
      `Your ${APP_NAME} password reset code is ${code}.\n\n` +
      `It expires in ${ttlMinutes} minutes. ${APP_NAME} will never ask you for this code.\n` +
      `If you didn't ask to reset your password, ignore this email: your password stays the same.`,
    html:
      `<p>Your ${APP_NAME} password reset code is:</p>` +
      `<p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>` +
      `<p>It expires in ${ttlMinutes} minutes. ${APP_NAME} will never ask you for this code.</p>` +
      `<p>If you didn't ask to reset your password, ignore this email: your password stays the same.</p>`,
  };
}

export function verificationSms(
  to: string,
  code: string,
  ttlMinutes: number,
): SmsMessage {
  return {
    to,
    text: `${code} is your ${APP_NAME} verification code. It expires in ${ttlMinutes} min. Never share it.`,
  };
}
