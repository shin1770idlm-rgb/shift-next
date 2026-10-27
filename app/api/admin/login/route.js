import { NextResponse } from 'next/server';
import { sign, hasSecret } from '../../../../lib/auth';
const err = (error, status) => NextResponse.json({ error }, { status });
export async function POST(req) {
  const U = process.env.SUPER_ADMIN_USER, P = process.env.SUPER_ADMIN_PASSWORD;
  if (!U || !P) return err('環境変数 SUPER_ADMIN_USER と SUPER_ADMIN_PASSWORD が設定されていません', 500);
  if (!hasSecret()) return err('署名用の鍵がありません', 500);
  const { user, password } = await req.json().catch(() => ({}));
  if (user !== U || password !== P) { await new Promise(r => setTimeout(r, 800)); return err('ユーザー名またはパスワードが違います', 401); }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session_admin', await sign('admin', Date.now() + 7 * 864e5), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 7 * 86400, secure: process.env.NODE_ENV === 'production' });
  return res;
}
export async function DELETE() { const res = NextResponse.json({ ok: true }); res.cookies.delete('session_admin'); return res; }
