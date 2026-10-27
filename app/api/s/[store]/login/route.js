import { NextResponse } from 'next/server';
import { sign, checkLogin, hasSecret } from '../../../../../lib/auth';
import { getStore } from '../../../../../lib/stores';
const err = (error, status) => NextResponse.json({ error }, { status });
export async function POST(req, { params }) {
  const id = (await params).store, s = await getStore(id);
  if (!s) return err('店舗が見つかりません', 404);
  if (!hasSecret()) return err('環境変数 SUPER_ADMIN_PASSWORD（または SESSION_SECRET）が設定されていません', 500);
  if (!s.hash && (!s.password || s.password === 'change-me')) return err('この店舗のパスワードが未設定です（全体管理画面で設定してください）', 500);
  const { user, password } = await req.json().catch(() => ({}));
  if (!(await checkLogin(s, user, password))) { await new Promise(r => setTimeout(r, 800)); return err('ユーザー名またはパスワードが違います', 401); }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session_' + id, await sign('store:' + id, Date.now() + 7 * 864e5), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 7 * 86400, secure: process.env.NODE_ENV === 'production' });
  return res;
}
export async function DELETE(req, { params }) { const res = NextResponse.json({ ok: true }); res.cookies.delete('session_' + (await params).store); return res; }
