import { NextResponse } from 'next/server';
import { verify } from './lib/auth';
// ログイン済み(Cookie)の場合のみ通す: 全体管理(/admin)、店舗の管理画面(/s/<ID>)、店舗のスタッフ更新・希望一覧・保存データのAPI
export async function middleware(req) {
  const { pathname } = req.nextUrl, method = req.method;
  if (pathname === '/admin' || pathname === '/api/admin/stores') {
    if (await verify('admin', req.cookies.get('session_admin')?.value)) return NextResponse.next();
    return pathname.startsWith('/api') ? NextResponse.json({ error: '認証が必要です' }, { status: 401 }) : NextResponse.redirect(new URL('/admin/login', req.url));
  }
  const m = pathname.match(/^\/(api\/)?s\/([^/]+)(?:\/([^/]+))?\/?$/);
  if (!m) return NextResponse.next();
  const [, api, id, sub] = m;
  const guarded = api ? (sub === 'staff' && method !== 'GET') || (sub === 'requests' && method === 'GET') || sub === 'state' : !sub;
  if (!guarded || (await verify('store:' + id, req.cookies.get('session_' + id)?.value))) return NextResponse.next();
  if (api) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  return NextResponse.redirect(new URL(`/s/${id}/login`, req.url));
}
export const config = { matcher: ['/admin', '/api/admin/stores', '/s/:path*', '/api/s/:path*'] };
