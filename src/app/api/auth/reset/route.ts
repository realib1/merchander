import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const response = NextResponse.redirect(new URL('/login', request.url));

  // Clear all cookies
  allCookies.forEach((c) => {
    response.cookies.set(c.name, '', { maxAge: 0, path: '/' });
  });

  return response;
}
