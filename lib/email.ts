// Self-hosted stand-in for a transactional email provider. Emails are
// logged to the server console; swap this out for SMTP/Resend in prod.
import "server-only";

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  console.info(
    `[email] to=${message.to} subject="${message.subject}"\n${message.text}`
  );
}
