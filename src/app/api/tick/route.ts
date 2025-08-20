import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseServer';

const ALPHA = 0.5;
const BETA = 1.1;

function damp(tax: number) {
  return ALPHA * Math.pow(tax, BETA);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ok = url.searchParams.get('secret') === process.env.TICK_SECRET;
  if (!ok) return new NextResponse('Forbidden', { status: 403 });

  const t0 = Date.now();

  const { data: fedRow, error: fedErr } = await supabaseService
    .from('federal').select('*').eq('id', 1).single();
  if (fedErr) return NextResponse.json({ error: fedErr.message }, { status: 500 });
  const federal = fedRow ?? { tax_rate: 0, pool_credits: 0 };

  const { data: planets, error: perr } = await supabaseService
    .from('planets').select('*');
  if (perr) return NextResponse.json({ error: perr.message }, { status: 500 });

  let totalTax = 0, totalFed = 0;

  for (const p of planets as any[]) {
    const tax = Number(p.tax_rate ?? 0);
    const gdp0 = Number(p.gdp ?? 1000);
    const growthBase = 0.02;
    const growthAdmin = (Number(p.tax_eff) - 1.0);
    const growthEvents = 0;
    const g = growthBase + growthAdmin + growthEvents - damp(tax);

    const gdp = gdp0 * (1 + g);
    const planetTaxTake = gdp * tax * Number(p.tax_eff ?? 1.0);
    const federalTake = planetTaxTake * Number(federal.tax_rate ?? 0);

    const stock = { ...(p.stockpiles || {}) };
    stock.credits = Number(stock.credits ?? 0) + (planetTaxTake - federalTake);

    const { error: upErr } = await supabaseService
      .from('planets')
      .update({ gdp, stockpiles: stock })
      .eq('id', p.id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    totalTax += planetTaxTake;
    totalFed += federalTake;
  }

  const { error: fedUpErr } = await supabaseService
    .from('federal')
    .update({ pool_credits: Number(federal.pool_credits ?? 0) + totalFed, updated_at: new Date().toISOString() })
    .eq('id', 1);
  if (fedUpErr) return NextResponse.json({ error: fedUpErr.message }, { status: 500 });

  const { error: logErr } = await supabaseService
    .from('tick_log')
    .insert({ duration_ms: Date.now() - t0, aggregates: { totalTax, totalFed, planets: planets?.length || 0 } });
  if (logErr) return NextResponse.json({ error: logErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, totalTax, totalFed });
}
