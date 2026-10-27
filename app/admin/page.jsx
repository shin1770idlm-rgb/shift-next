'use client';
import { useEffect, useState } from 'react';
const EMPTY = { id: '', name: '', user: '', password: '' };
export default function Admin() {
  const [list, setList] = useState(null), [f, setF] = useState(EMPTY), [msg, setMsg] = useState(null);
  const load = async () => {
    const r = await fetch('/api/admin/stores'), j = await r.json().catch(() => ({}));
    if (r.ok) setList(j); else setMsg({ t: j.error || '読み込めませんでした', bad: 1 });
  };
  useEffect(() => { load(); }, []);
  const call = async (method, body, okText) => {
    const r = await fetch('/api/admin/stores', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? { t: okText } : { t: j.error || '失敗しました', bad: 1 });
    if (r.ok) await load();
    return r.ok;
  };
  const add = async () => { if (await call('POST', f, `店舗「${f.name}」を追加しました。`)) setF(EMPTY); };
  const chPw = async s => { const pw = prompt(`「${s.name}」の新しいパスワード（8文字以上）`); if (pw) call('PUT', { id: s.id, password: pw }, 'パスワードを変更しました。'); };
  const chName = async s => { const n = prompt('店舗名', s.name); if (n) call('PUT', { id: s.id, name: n }, '店舗名を変更しました。'); };
  const chUser = async s => { const u = prompt('ユーザー名', s.user); if (u) call('PUT', { id: s.id, user: u }, 'ユーザー名を変更しました。'); };
  const del = async s => { if (confirm(`「${s.name}」を削除しますか？この店舗のスタッフ・シフト・提出された希望もすべて消え、元に戻せません。`)) call('DELETE', { id: s.id }, '店舗を削除しました。'); };
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return (
    <main>
      <div className="bar"><h1 style={{ margin: 0 }}>全体管理（店舗）</h1><span style={{ flex: 1 }} />
        <button className="btn" onClick={async () => { await fetch('/api/admin/login', { method: 'DELETE' }); location.href = '/admin/login'; }}>ログアウト</button></div>
      {msg && <div className={msg.bad ? 'warn' : 'sub'} style={{ marginBottom: 10 }}>{msg.t}</div>}
      <section className="fin" style={{ maxWidth: 520 }}>
        <h2>店舗を追加</h2>
        <label className="r">店舗ID<input style={{ textAlign: 'left' }} value={f.id} onChange={set('id')} placeholder="例: shibuya" /></label>
        <label className="r">店舗名<input style={{ textAlign: 'left' }} value={f.name} onChange={set('name')} placeholder="例: 渋谷店" /></label>
        <label className="r">ユーザー名<input style={{ textAlign: 'left' }} value={f.user} onChange={set('user')} autoComplete="off" /></label>
        <label className="r">パスワード<input style={{ textAlign: 'left' }} type="password" value={f.password} onChange={set('password')} autoComplete="new-password" placeholder="8文字以上" /></label>
        <div className="sub">店舗IDは半角の英数字・ハイフン・アンダースコア（URLに使われます）。ユーザー名とパスワードは、その店舗の管理画面へのログインに使います。</div>
        <div className="acts"><button className="btn main" onClick={add}>店舗を追加</button></div>
      </section>
      <section className="fin wide">
        <h2>登録済みの店舗</h2>
        {!list ? <div className="sub">読み込み中…</div> : !list.length ? <div className="sub">店舗がありません。</div> : (
          <div className="wrap"><table>
            <thead><tr><th>店舗名</th><th>店舗ID</th><th>ユーザー名</th><th>URL</th><th>操作</th></tr></thead>
            <tbody>{list.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td><td>{s.id}</td><td>{s.user}</td>
                <td className="sm"><a href={`/s/${s.id}`}>管理画面</a>　<a href={`/s/${s.id}/submit`}>希望提出</a></td>
                <td>{s.source === 'app' ? <span className="acts" style={{ margin: 0, justifyContent: 'center' }}>
                  <button className="btn" onClick={() => chName(s)}>店舗名</button><button className="btn" onClick={() => chUser(s)}>ユーザー名</button>
                  <button className="btn" onClick={() => chPw(s)}>パスワード</button><button className="btn" onClick={() => del(s)}>削除</button></span>
                  : <span className="sub">環境変数 STORES で設定（変更不可）</span>}</td>
              </tr>))}</tbody>
          </table></div>)}
      </section>
    </main>
  );
}
