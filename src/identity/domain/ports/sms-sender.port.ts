export interface SmsMessage {
  /** "+919876543210" style: optional "+", then digits. */
  to: string;
  text: string;
}

/** Sends one SMS. Throws if the provider refused it. */
export interface SmsSender {
  send(message: SmsMessage): Promise<void>;
}

export const SMS_SENDER = Symbol('SMS_SENDER');
