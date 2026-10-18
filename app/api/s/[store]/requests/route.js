import { NextResponse } from 'next/server';
import { read, write, fail } from '../../../../../lib/store';
import { getStore } from '../../../../../lib/stores';
import { openPeriod, pkey } from '../../../../../lib/period';
const err = (error, status = 400) => NextResponse.json({ error }, { status });
export async function GET(req, { params }) {
  const id = (await params).store;
  if (!getStore(id)) return err('店舗が見つかりません', 404);
  try { return NextResponse.json((await read(id)).requests); } catch (e) { return fail(e); }
}
export async function POST(req, { params }) {
  const id = (await params).store;
  if (!getStore(id)) return err('店舗が見つかりません', 404);
  try {
    const { staffId, key, days } = await req.json(), d = await read(id), p = openPeriod();
    if (!d.staff.some(s => s.id === staffId)) return err('スタッフが見つかりません');
    if (!p || key !== pkey(p.y, p.m, p.h)) return err('提出期間外です');
    const clean = {};
    for (const [k, v] of Object.entries(days || {})) {
      const [a, b] = String(v).split('-').map(Number);
      if (!/^\d{4}-\d\d-\d\d$/.test(k) || !(a >= 13 && b <= 29.5 && b > a && (a * 2) % 1 === 0 && (b * 2) % 1 === 0)) return err('時間の形式が正しくありません');
      clean[k] = `${a}-${b}`;
    }
    (d.requests[key] ||= {})[staffId] = { at: new Date().toISOString(), days: clean };
    await write(id, d);
    return NextResponse.json({ ok: true });
  } catch (e) { return fail(e); }
}
