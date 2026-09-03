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
  const requestOrigin = new URL(request.url).origin;

  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'none') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const origin = request.headers.get('origin');
  if (origin && origin !== requestOrigin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const response = NextResponse.redirect(new URL('/login', request.url));

  // Clear all cookies
  allCookies.forEach((c) => {
    response.cookies.set(c.name, '', { maxAge: 0, path: '/' });
  });

  return response;
}
