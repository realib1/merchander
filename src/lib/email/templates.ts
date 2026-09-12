export function getWelcomeEmailHtml(userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Merchander</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #111827; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 24px; }
          h1 { font-size: 20px; font-weight: 600; margin-bottom: 16px; }
          p { font-size: 16px; line-height: 1.5; color: #4b5563; margin-bottom: 24px; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; }
          .footer { margin-top: 32px; font-size: 14px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Merchander</div>
          <h1>Welcome, ${escapeHtml(userName)}!</h1>
          <p>We're thrilled to have you onboard. Merchander is your new operational hub for managing your social commerce business.</p>
          <p>Get started by setting up your store profile and adding your first products.</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://merchander.sherohq.com'}/dashboard" class="btn">Go to Dashboard</a>
          <div class="footer">
            <p>If you have any questions, simply reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Merchander. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
