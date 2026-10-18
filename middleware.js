import { NextResponse } from 'next/server';
import { verify } from './lib/auth';
import { getStore } from './lib/stores';
// 店舗ごとの管理画面 /s/<店舗ID>、スタッフ一覧の更新、希望一覧の閲覧は、その店舗にログイン済みの場合のみ
export async function middleware(req) {
  const m = req.nextUrl.pathname.match(/^\/(api\/)?s\/([^/]+)(?:\/([^/]+))?\/?$/);
  if (!m) return NextResponse.next();
  const [, api, id, sub] = m, store = getStore(id), method = req.method;
  if (!store) return api ? NextResponse.json({ error: '店舗が見つかりません' }, { status: 404 }) : new NextResponse('店舗が見つかりません', { status: 404 });
  const guarded = api ? (sub === 'staff' && method !== 'GET') || (sub === 'requests' && method === 'GET') || sub === 'state' : !sub;
  if (!guarded || (await verify(store, req.cookies.get('session_' + id)?.value))) return NextResponse.next();
  if (api) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  return NextResponse.redirect(new URL(`/s/${id}/login`, req.url));
}
export const config = { matcher: ['/s/:path*', '/api/s/:path*'] };
