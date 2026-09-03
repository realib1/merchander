import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Emergency session reset: clears every cookie and sends the caller to /login.
 *
 * POST only, and same-origin only. A `GET` here let any third-party page force a
 * merchant to log out with an `<img>` tag; requiring `POST` plus an origin match
 * removes both the `<img>`/prefetch vector and a cross-site form submission.
 */
export async function POST(request: Request) {
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'none') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const origin = request.headers.get('origin');
  if (origin) {
    // Compare against the forwarded host, not `request.url`, which can carry an
    // internal host behind a reverse proxy or custom-domain edge.
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = null;
    }
    if (!originHost || originHost !== host) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const response = NextResponse.redirect(new URL('/login', request.url), 303);

  // Clear all cookies
  allCookies.forEach((c) => {
    response.cookies.set(c.name, '', { maxAge: 0, path: '/' });
  });

  return response;
}
