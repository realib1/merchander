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

/**
 * Resolves the URL dynamically from request headers on the server side.
 * It strictly validates the Host header against a trusted whitelist of Vercel 
 * environment variables and known domains to prevent Host Header Injection.
 */
export const getServerSideURL = (headersList: Headers): string => {
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  
  const defaultUrl = getURL();
  
  if (!host) return defaultUrl;

  const allowedHosts = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL,
    'merchander.sherohq.com',
    'localhost:3000'
  ]
    .filter(Boolean)
    .map(url => {
      try {
        return new URL(url!.includes('http') ? url! : `https://${url}`).host;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (allowedHosts.includes(host)) {
    return `${protocol}://${host}`;
  }

  return defaultUrl;
};
