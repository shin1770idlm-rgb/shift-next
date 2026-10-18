import fs from 'fs/promises';
import path from 'path';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
// Vercel: Upstash Redis(環境変数 KV_REST_API_URL/TOKEN または UPSTASH_REDIS_REST_URL/TOKEN)に保存。未設定のローカル開発では data/<店舗ID>.json に保存
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL, token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;
const check = id => { if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('bad store'); return id; };
const empty = () => ({ staff: [], requests: {} });
// Vercel上でRedis未接続の場合はファイル保存ができないため、原因が分かるエラーにする
const need = () => { if (!redis && process.env.VERCEL) throw new Error('NO_STORAGE'); };
export const fail = e => NextResponse.json({ error: e?.message === 'NO_STORAGE' ? '保存先(Upstash Redis)が接続されていません。Vercelで接続して、Redeployしてください。' : '保存に失敗しました。' }, { status: 500 });
export async function read(id) {
  check(id); need();
  if (redis) return (await redis.get('shift:' + id)) || empty();
  try { return JSON.parse(await fs.readFile(path.join(process.cwd(), 'data', id + '.json'), 'utf8')); } catch { return empty(); }
}
export async function write(id, d) {
  check(id); need();
  if (redis) { await redis.set('shift:' + id, d); return; }
  const f = path.join(process.cwd(), 'data', id + '.json');
  await fs.mkdir(path.dirname(f), { recursive: true }); await fs.writeFile(f, JSON.stringify(d));
}
// 管理画面のデータ(スタッフ・時給・シフトなど)を店舗ごとにサーバーへ保存。v は更新の版番号(他端末との上書き防止)
export async function readState(id) {
  check(id); need();
  if (redis) return (await redis.get('shift:' + id + ':state')) || { v: 0, data: null };
  try { return JSON.parse(await fs.readFile(path.join(process.cwd(), 'data', id + '.state.json'), 'utf8')); } catch { return { v: 0, data: null }; }
}
export async function writeState(id, rec) {
  check(id); need();
  if (redis) { await redis.set('shift:' + id + ':state', rec); return; }
  const f = path.join(process.cwd(), 'data', id + '.state.json');
  await fs.mkdir(path.dirname(f), { recursive: true }); await fs.writeFile(f, JSON.stringify(rec));
}
