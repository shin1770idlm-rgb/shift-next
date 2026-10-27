import { allStores } from '../lib/stores';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const stores = await allStores();
  const lk = { textDecoration: 'none', display: 'inline-block' };
  return (
    <main style={{ maxWidth: 520 }}>
      <h1>店舗を選択</h1>
      {!stores.length && <p className="warn">環境変数 STORES が設定されていません。</p>}
      {stores.map(s => (
        <section className="fin" key={s.id} style={{ maxWidth: 'none' }}>
          <h2>{s.name}</h2>
          <div className="acts" style={{ marginTop: 0 }}>
            <a className="btn main" style={lk} href={`/s/${s.id}/submit`}>シフト希望を提出する（スタッフ）</a>
            <a className="btn" style={lk} href={`/s/${s.id}`}>管理画面（要ログイン）</a>
          </div>
        </section>
      ))}
      <p className="sub" style={{ marginTop: 24 }}><a href="/admin">全体管理（店舗の追加・削除）</a></p>
    </main>
  );
}
