'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function login() {
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (r.ok) window.location.href = '/inventory';
    else setMsg('Sign in failed. Check credentials and try again.');
  }

  const googleUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/inventory' : '')}`;

  return <section className="max-w-md space-y-4 rounded-2xl border border-[#2A3144] bg-[#0E1320] p-6">
    <h1 className="text-2xl font-bold">Login / Signup</h1>
    <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
    <input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
    <button onClick={login} className="w-full bg-[#D6BA7A] text-[#0A0D14]">Sign in with Email</button>
    <a href={googleUrl} className="block rounded-2xl border border-[#3D445B] px-4 py-3 text-center">Continue with Google</a>
    {msg ? <p className="text-sm text-red-300">{msg}</p> : null}
  </section>;
}
