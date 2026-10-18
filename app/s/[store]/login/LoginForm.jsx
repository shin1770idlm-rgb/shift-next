'use client';
import { useState } from 'react';
export default function LoginForm({ store, name }) {
  const [user, setUser] = useState(''), [password, setPassword] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await fetch(`/api/s/${store}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user, password }) });
    if (r.ok) { location.href = `/s/${store}`; return; }
    setErr((await r.json().catch(() => ({}))).error || 'ログインできませんでした'); setBusy(false);
  };
  return (
    <main style={{ maxWidth: 380 }}>
      <h1>{name}　管理画面ログイン</h1>
      <form className="fin" style={{ maxWidth: 'none' }} onSubmit={submit}>
        <label className="r">ユーザー名<input style={{ textAlign: 'left' }} value={user} onChange={e => setUser(e.target.value)} autoComplete="username" autoFocus /></label>
        <label className="r">パスワード<input style={{ textAlign: 'left' }} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" /></label>
        {err && <div className="warn" style={{ margin: '8px 0' }}>{err}</div>}
        <button className="btn main" disabled={busy} style={{ marginTop: 8 }}>ログイン</button>
      </form>
    </main>
  );
}
