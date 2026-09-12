import { Resend } from 'resend';

// Initialize the Resend client. 
// Requires RESEND_API_KEY environment variable.
const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string; // Optional: defaults to platform setting or environment variable
}

export async function sendEmail(options: SendEmailOptions) {
  if (!resendClient) {
    console.warn('RESEND_API_KEY is not set. Email not sent.', options.subject);
    return { error: new Error('RESEND_API_KEY is not configured') };
  }

  try {
    const fromAddress = options.from || process.env.EMAIL_FROM_ADDRESS || 'noreply@merchander.sherohq.com';
    
    // Construct payload carefully to avoid TS union type errors with undefined values
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      from: `Merchander <${fromAddress}>`,
      to: options.to,
      subject: options.subject,
    };

    if (options.html) payload.html = options.html;
    if (options.text) payload.text = options.text;

    const { data, error } = await resendClient.emails.send(payload);

    if (error) {
      console.error('Resend API error:', error);
      return { error };
    }

    return { data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { error };
  }
}
