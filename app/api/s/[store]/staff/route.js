import { NextResponse } from 'next/server';
import { read, write, fail } from '../../../../../lib/store';
import { getStore } from '../../../../../lib/stores';
export async function GET(req, { params }) {
  const id = (await params).store, s = await getStore(id);
  if (!s) return NextResponse.json({ error: '店舗が見つかりません' }, { status: 404 });
  try { return NextResponse.json({ name: s.name, list: (await read(id)).staff }); } catch (e) { return fail(e); }
}
export async function POST(req, { params }) {
  const id = (await params).store;
  if (!await getStore(id)) return NextResponse.json({ error: '店舗が見つかりません' }, { status: 404 });
  try {
    const { list } = await req.json(), d = await read(id);
    d.staff = (list || []).map(s => ({ id: String(s.id), name: String(s.name).slice(0, 20) }));
    await write(id, d);
    return NextResponse.json({ ok: true });
  } catch (e) { return fail(e); }
}
