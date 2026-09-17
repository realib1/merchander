import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getHealthChecks() {
  return {
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    paystack: !!process.env.PAYSTACK_SECRET_KEY,
    whatsapp:
      !!process.env.WHATSAPP_APP_SECRET && !!process.env.WHATSAPP_VERIFY_TOKEN && !!process.env.WHATSAPP_ACCESS_TOKEN,
    telegram: !!process.env.TELEGRAM_SECRET_TOKEN,
    intelligence: !!process.env.PYTHON_BRAIN_URL && !!process.env.INTELLIGENCE_SERVICE_API_KEY,
  } as const;
}

/**
 * Public health check and deployment smoke-test endpoint.
 * Used by Vercel deployment checks, uptime monitors, and container probes.
 */
export async function GET() {
  const uptime = typeof process.uptime === 'function' ? process.uptime() : 0;
  const dependencies = getHealthChecks();
  const hasMissingDeps = Object.values(dependencies).some((isConfigured) => !isConfigured);

  return NextResponse.json(
    {
      status: hasMissingDeps ? 'degraded' : 'ok',
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptime * 100) / 100,
      dependencies,
    },
    {
      status: hasMissingDeps ? 503 : 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
