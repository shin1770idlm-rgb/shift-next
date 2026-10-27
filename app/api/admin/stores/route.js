import { NextResponse } from 'next/server';
import { readStores, writeStores, removeData, fail } from '../../../../lib/store';
import { allStores } from '../../../../lib/stores';
import { hashPw, newSalt } from '../../../../lib/auth';
const err = (error, status = 400) => NextResponse.json({ error }, { status });
const RESERVED = ['admin', 'api', 'login'];
const pub = s => ({ id: s.id, name: s.name, user: s.user, source: s.source });
const clean = v => String(v ?? '').trim();

export async function GET() {
  try { return NextResponse.json((await allStores()).map(pub)); } catch (e) { return fail(e); }
}
export async function POST(req) {
  try {
    const b = await req.json().catch(() => ({})), id = clean(b.id), name = clean(b.name), user = clean(b.user), password = String(b.password ?? '');
    if (!/^[A-Za-z0-9_-]{1,32}$/.test(id) || RESERVED.includes(id.toLowerCase())) return err('店舗IDは半角の英数字・ハイフン・アンダースコアで32文字以内にしてください（admin などは使えません）');
    if (!name || name.length > 30) return err('店舗名は1〜30文字で入力してください');
    if (!user || user.length > 64) return err('ユーザー名を入力してください');
    if (password.length < 8) return err('パスワードは8文字以上にしてください');
    if ((await allStores()).some(s => s.id === id)) return err('その店舗IDはすでに使われています', 409);
    const list = await readStores(true), salt = newSalt();
    list.push({ id, name, user, salt, hash: await hashPw(password, salt) });
    await writeStores(list);
    return NextResponse.json({ ok: true });
  } catch (e) { return fail(e); }
}
export async function PUT(req) {
  try {
    const b = await req.json().catch(() => ({})), list = await readStores(true), t = list.find(s => s.id === b.id);
    if (!t) return err('この店舗は、ここでは変更できません（環境変数 STORES で設定された店舗です）', 404);
    if (b.name != null) { const n = clean(b.name); if (!n || n.length > 30) return err('店舗名は1〜30文字で入力してください'); t.name = n; }
    if (b.user != null) { const u = clean(b.user); if (!u || u.length > 64) return err('ユーザー名を入力してください'); t.user = u; }
    if (b.password) { if (String(b.password).length < 8) return err('パスワードは8文字以上にしてください'); t.salt = newSalt(); t.hash = await hashPw(String(b.password), t.salt); }
    await writeStores(list);
    return NextResponse.json({ ok: true });
  } catch (e) { return fail(e); }
}
export async function DELETE(req) {
  try {
    const { id } = await req.json().catch(() => ({})), list = await readStores(true);
    if (!list.some(s => s.id === id)) return err('この店舗は、ここでは削除できません（環境変数 STORES で設定された店舗です）', 404);
    await writeStores(list.filter(s => s.id !== id));
    await removeData(id);
    return NextResponse.json({ ok: true });
  } catch (e) { return fail(e); }
}
