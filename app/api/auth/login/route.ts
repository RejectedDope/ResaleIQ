import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ error: 'Missing Supabase env' }, { status: 500 });

  const resp = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await resp.json();
  if (!resp.ok) return NextResponse.json({ error: data.error_description || 'Login failed' }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set('sb-access-token', data.access_token, { httpOnly: true, sameSite: 'lax', secure: true, path: '/' });
  return res;
}
