import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

function createSignoutRedirectResponse(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', req.url), {
    status: 302,
  });

  // Explicitly clear all Supabase auth and session cookies on the redirect response
  req.cookies.getAll().forEach((cookie) => {
    if (cookie.name.includes('sb-') || cookie.name.includes('auth-token')) {
      response.cookies.delete(cookie.name);
      response.cookies.set(cookie.name, '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      });
    }
  });

  return response;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.error('Sign-out error in POST handler:', err);
  }

  revalidatePath('/', 'layout');
  return createSignoutRedirectResponse(req);
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.error('Sign-out error in GET handler:', err);
  }

  revalidatePath('/', 'layout');
  return createSignoutRedirectResponse(req);
}
