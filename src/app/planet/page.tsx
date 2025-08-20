'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseBrowser';

type Planet = {
  id: string;
  name: string;
  p_industry: number;
  p_extraction: number;
  p_pop: number;
  p_infra: number;
  p_admin: number;
  stockpiles: any;
};

export default function PlanetPage() {
  const [loading, setLoading] = useState(true);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [planet, setPlanet] = useState<Planet | null>(null);

  // On load, get session & planet
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setSessionUserId(user.id);
      const { data: planets } = await supabase
        .from('planets')
        .select('*')
        .eq('owner_id', user.id)
        .limit(1);
      setPlanet(planets?.[0] ?? null);
      setLoading(false);
    })();
  }, []);

  if (loading) return <main style={{padding:24}}>Loading…</main>;

  if (!planet) return <Onboarding userId={sessionUserId!} onCreated={setPlanet} />;

  return (
    <main style={{padding:24, fontFamily:'system-ui'}}>
      <h1>{planet.name}</h1>
      <p>Industry: {planet.p_industry} • Extraction: {planet.p_extraction} • Pop: {planet.p_pop} • Infra: {planet.p_infra} • Admin: {planet.p_admin}</p>
      <pre style={{background:'#111', color:'#0f0', padding:12, borderRadius:8}}>{JSON.stringify(planet.stockpiles, null, 2)}</pre>
      <p style={{opacity:0.7}}>Daily tick will add credits from taxes. Go to /api/tick to test.</p>
    </main>
  );
}

function Onboarding({ userId, onCreated }: { userId: string; onCreated: (p: Planet)=>void }) {
  const [name, setName] = useState('');
  const [stats, setStats] = useState({ industry: 0, extraction: 0, pop: 0, infra: 0, admin: 0 });
  const total = useMemo(() => Object.values(stats).reduce((a,b)=>a+b,0), [stats]);
  const [error, setError] = useState<string | null>(null);
  const remaining = 10 - total;

  function setStat(k: keyof typeof stats, v: number) {
    setStats(s => ({ ...s, [k]: Math.max(0, Math.min(10, v)) }));
  }

  async function createPlanet() {
    setError(null);
    if (!name) return setError('Name your planet.');
    if (remaining !== 0) return setError(`Allocate exactly 10 points. Remaining: ${remaining}`);
    const { data, error } = await supabase.from('planets').insert({
      owner_id: userId,
      name,
      p_industry: stats.industry,
      p_extraction: stats.extraction,
      p_pop: stats.pop,
      p_infra: stats.infra,
      p_admin: stats.admin
    }).select('*').single();
    if (error) setError(error.message);
    else onCreated(data as Planet);
  }

  return (
    <main style={{padding:24, fontFamily:'system-ui'}}>
      <h1>Create your planet</h1>
      <div style={{display:'grid', gap:12, maxWidth:520}}>
        <label>Planet name
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Novum Centrum" style={{display:'block', padding:8, width:'100%'}}/>
        </label>
        <p>Allocate 10 points (remaining: {remaining})</p>
        {(['industry','extraction','pop','infra','admin'] as const).map(k => (
          <div key={k} style={{display:'grid', gridTemplateColumns:'120px 1fr 60px', gap:8, alignItems:'center'}}>
            <strong style={{textTransform:'capitalize'}}>{k}</strong>
            <input type="range" min={0} max={10} value={(stats as any)[k]} onChange={e=>setStat(k, parseInt(e.target.value))}/>
            <span>{(stats as any)[k]}</span>
          </div>
        ))}
        <button onClick={createPlanet} style={{padding:10, marginTop:8}}>Create Planet</button>
        {error && <p style={{color:'crimson'}}>{error}</p>}
      </div>
    </main>
  );
}
