export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Sends one email. Throws if it couldn't be handed to the mail server. */
export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
