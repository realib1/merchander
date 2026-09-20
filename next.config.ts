import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import { assertProductionReady } from './src/config/env';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let extraConnectOrigins = '';
if (supabaseUrl) {
  try {
    const parsed = new URL(supabaseUrl);
    const wsProto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    extraConnectOrigins = `${parsed.origin} ${wsProto}//${parsed.host}`;
  } catch {
    // Ignore URL parse error
  }
}

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: http://localhost:* http://127.0.0.1:* https://*.supabase.co https://*.supabase.in;
  font-src 'self' data:;
  connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* https://*.supabase.co wss://*.supabase.co https://*.supabase.in wss://*.supabase.in https://api.paystack.co https://api.hubtel.com ${extraConnectOrigins};
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Content-Security-Policy', value: cspHeader.replace(/\n/g, '') },
];
const remotePatterns: NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> = [
  {
    protocol: 'http',
    hostname: '127.0.0.1',
    pathname: '/storage/v1/object/public/**',
  },
  {
    protocol: 'http',
    hostname: '127.0.0.1',
    port: '64321',
    pathname: '/storage/v1/object/public/**',
  },
  {
    protocol: 'http',
    hostname: '127.0.0.1',
    port: '54321',
    pathname: '/storage/v1/object/public/**',
  },
  {
    protocol: 'http',
    hostname: 'localhost',
    pathname: '/storage/v1/object/public/**',
  },
  {
    protocol: 'http',
    hostname: 'localhost',
    port: '64321',
    pathname: '/storage/v1/object/public/**',
  },
  {
    protocol: 'http',
    hostname: 'localhost',
    port: '54321',
    pathname: '/storage/v1/object/public/**',
  },
  {
    protocol: 'https',
    hostname: '*.supabase.co',
    pathname: '/storage/v1/object/public/**',
  },
];

if (supabaseUrl) {
  try {
    const parsed = new URL(supabaseUrl);
    const protocol = parsed.protocol.replace(':', '') as 'http' | 'https';
    remotePatterns.push({
      protocol,
      hostname: parsed.hostname,
      ...(parsed.port ? { port: parsed.port } : {}),
      pathname: '/storage/v1/object/public/**',
    });
  } catch {
    // Ignore URL parse error
  }
}

const nextConfigOptions: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowLocalIP: true,
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

const nextConfig = (phase: string): NextConfig => {
  if (phase !== PHASE_PRODUCTION_BUILD) {
    assertProductionReady();
  }

  return nextConfigOptions;
};

export default nextConfig;
