/**
 * Securely resolve the application's base URL using Vercel system environment variables.
 * This prevents Host Header Injection vulnerabilities by relying on trusted infrastructure
 * variables instead of client-supplied HTTP headers.
 */
export const getURL = (): string => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_BRANCH_URL ??
    process.env.VERCEL_URL ??
    'http://localhost:3000';

  // Ensure it includes the protocol
  url = url.includes('http') ? url : `https://${url}`;
  
  // Remove any trailing slash
  url = url.replace(/\/$/, '');
  
  return url;
};
