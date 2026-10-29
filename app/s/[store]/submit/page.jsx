'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WD, iso, pkey, range, openPeriod, TIMES, lab, isHoliday } from '../../../../lib/period';

export default function Submit() {
  const { store } = useParams();
  const [cur, setCur] = useState(null), [list, setList] = useState([]), [sid, setSid] = useState('');
  const [v, setV] = useState({}), [msg, setMsg] = useState(null), [ask, setAsk] = useState(null), [sname, setSname] = useState('');
  useEffect(() => {
    setCur(openPeriod() || false);
    setSid(localStorage.getItem('sid:' + store) || '');
    fetch(`/api/s/${store}/staff`).then(r => r.json()).then(j => { if (j.error) setMsg({ t: j.error, bad: 1 }); setList(j.list || []); setSname(j.name || ''); }).catch(() => {});
  }, []);
  if (cur === null) return <main><p>読み込み中…</p></main>;
  if (!cur) return <main><p>現在、提出できる期間はありません。</p></main>;
  const ds = range(cur.y, cur.m, cur.h), key = pkey(cur.y, cur.m, cur.h);
  const nameOf = list.find(p => p.id === sid)?.name || '';
  const set = (k, t, x) => setV(o => ({ ...o, [k]: { ...o[k], [t]: x } }));
  const send = async () => {
    if (!sid || !nameOf) return setMsg({ t: '名前を選んでください。', bad: 1 });
    const days = {}; let bad = 0;
    ds.forEach(d => {
      const k = iso(d), { a = '', b = '' } = v[k] || {};
      if (!a && !b) return;
      if (!a || !b || +b <= +a) { bad++; return; }
      days[k] = a + '-' + b;
    });
    if (bad) return setMsg({ t: `${bad}日分の時間が正しくありません。開始と終了の両方を選び、終了を開始より後にしてください。`, bad: 1 });
    setAsk({ days });
  };
  const doSend = async days => {
    setAsk(null);
    const r = await fetch(`/api/s/${store}/requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ staffId: sid, key, days }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) localStorage.setItem('sid:' + store, sid);
    setMsg(r.ok ? { t: `提出しました（${Object.keys(days).length}日分）。` } : { t: j.error || '提出できませんでした。', bad: 1 });
  };
  const opts = <>{<option value="">—</option>}{TIMES.map(t => <option key={t} value={t}>{lab(t)}</option>)}</>;
  return (
    <main style={{ maxWidth: 560 }}>
      <h1>{sname}　シフト希望の提出</h1>
      <section className="fin" style={{ maxWidth: 'none' }}>
        <h2>{cur.y}年{cur.m + 1}月 {cur.h ? '後半' : '前半'}（{ds[0].getDate()}日〜{ds.at(-1).getDate()}日）</h2>
        <div className="sub">提出期限：{cur.b.getMonth() + 1}月{cur.b.getDate()}日（{WD[cur.b.getDay()]}）まで。期限内なら何度でも出し直せます（最後に提出した内容が有効です）。</div>
        <label className="r">名前
          <select value={sid} onChange={e => setSid(e.target.value)}>
            <option value="">選択してください</option>
            {list.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        {!list.length && <div className="warn" style={{ marginBottom: 8 }}>スタッフが登録されていません。管理者に連絡してください。</div>}
        <div style={{ margin: '10px 0' }}>
          {ds.map(d => {
            const k = iso(d), w = d.getDay();
            return (
              <div className="drow" key={k}>
                <span className={'dl ' + (w === 0 || isHoliday(d) ? 'sun' : w === 6 ? 'sat' : '')}>{d.getDate()}日（{WD[w]}）</span>
                <select value={v[k]?.a || ''} onChange={e => set(k, 'a', e.target.value)} aria-label="開始">{opts}</select>
                <span>〜</span>
                <select value={v[k]?.b || ''} onChange={e => set(k, 'b', e.target.value)} aria-label="終了">{opts}</select>
              </div>
            );
          })}
        </div>
        {msg && <div className={msg.bad ? 'warn' : 'sub'} style={{ marginBottom: 8 }}>{msg.t}</div>}
        <button className="btn main" onClick={send}>希望を提出</button>
        <div className="sub" style={{ marginTop: 8 }}>出勤しない日は、開始・終了を「—」のままにしてください。</div>
      </section>
      {ask && (
        <div className="back" onClick={() => setAsk(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <b>提出前の確認</b>
            <p style={{ fontSize: 18, margin: '12px 0' }}><b>{nameOf}</b> さんとして提出します。</p>
            <p className="sub">{Object.keys(ask.days).length}日分の出勤希望を提出します。ご自身の名前ではない場合は、「戻る」を押して名前を選び直してください。</p>
            <div className="acts">
              <button className="btn main" onClick={() => doSend(ask.days)}>私は{nameOf}です。提出する</button>
              <button className="btn" onClick={() => setAsk(null)}>戻る</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
