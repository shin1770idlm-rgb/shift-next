import { NextResponse } from 'next/server';
import { readState, writeState, fail } from '../../../../../lib/store';
import { getStore } from '../../../../../lib/stores';
const err = (error, status) => NextResponse.json({ error }, { status });
export async function GET(req, { params }) {
  const id = (await params).store;
  if (!getStore(id)) return err('店舗が見つかりません', 404);
  try { return NextResponse.json(await readState(id)); } catch (e) { return fail(e); }
}
export async function PUT(req, { params }) {
  const id = (await params).store;
  if (!getStore(id)) return err('店舗が見つかりません', 404);
  try {
    const { data, base } = await req.json();
    if (!data || typeof data !== 'object' || JSON.stringify(data).length > 900000) return err('データが不正、または大きすぎます', 400);
    const cur = await readState(id);
    if ((cur.v || 0) !== base) return err('他の端末で更新されています', 409);
    const v = (cur.v || 0) + 1;
    await writeState(id, { v, data });
    return NextResponse.json({ v });
  } catch (e) { return fail(e); }
}
