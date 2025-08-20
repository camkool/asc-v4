'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseBrowser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/planet' } });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main style={{padding:24, fontFamily:'system-ui'}}>
      <h1>Sign in</h1>
      <p>Enter your email to receive a magic link.</p>
      {sent ? (
        <p>Check your inbox for the sign-in link.</p>
      ) : (
        <form onSubmit={sendLink} style={{display:'grid', gap:12, maxWidth:360}}>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required style={{padding:8}}/>
          <button type="submit" style={{padding:10}}>Send magic link</button>
          {error && <p style={{color:'crimson'}}>{error}</p>}
        </form>
      )}
    </main>
  );
}
