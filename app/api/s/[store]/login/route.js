import { NextResponse } from 'next/server';
import { sign, usable } from '../../../../../lib/auth';
import { getStore } from '../../../../../lib/stores';
export async function POST(req, { params }) {
  const id = (await params).store, s = getStore(id);
  if (!s) return NextResponse.json({ error: '店舗が見つかりません' }, { status: 404 });
  if (!usable(s)) return NextResponse.json({ error: '環境変数 STORES のこの店舗のパスワードを設定・変更してください（空や change-me のままではログインできません）' }, { status: 500 });
  const { user, password } = await req.json().catch(() => ({}));
  if (user !== s.user || password !== s.password) {
    await new Promise(r => setTimeout(r, 800));
    return NextResponse.json({ error: 'ユーザー名またはパスワードが違います' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session_' + id, await sign(s, Date.now() + 7 * 864e5), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 7 * 86400, secure: process.env.NODE_ENV === 'production' });
  return res;
}
export async function DELETE(req, { params }) { const res = NextResponse.json({ ok: true }); res.cookies.delete('session_' + (await params).store); return res; }
