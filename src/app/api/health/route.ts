import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Public health check and deployment smoke-test endpoint.
 * Used by Vercel deployment checks, uptime monitors, and container probes.
 */
export async function GET() {
  const uptime = typeof process.uptime === 'function' ? process.uptime() : 0;

  return NextResponse.json(
    {
      status: 'ok',
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptime * 100) / 100,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
