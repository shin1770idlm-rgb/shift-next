'use client';
import { useEffect, useRef, useState } from 'react';
import { WD, iso, win, pkey, range, TIMES, hrs, nh, cost, lab, yen } from '../lib/period';

const KEY = 'shift-next-v1', PAL = 10, YEN = 1100;
const JC = [['#bcdcf7', '#0f4c81'], ['#f7c4c4', '#9b1c1c'], ['#fcd5a5', '#8a4a07'], ['#f8ec9c', '#6b5a00'], ['#c3e8c0', '#1d6b27'], ['#dac8f2', '#4b2a8a'], ['#b5eaf0', '#0b5e6b'], ['#f9c6e2', '#8c1d63'], ['#dcef9f', '#4a6a00'], ['#e3cdb4', '#5a3b1f']];
const CN = ['青', '赤', 'オレンジ', '黄', '緑', '紫', '水色', 'ピンク', '黄緑', '茶'];
const INIT = {
  staff: [], cells: {}, duty: {}, fin: {}, last: { a: 13, b: 22 },
  duties: ['ホール', '刺し場', '火口', '焼き場', 'ドリンク', 'フリー'].map((name, c) => ({ name, c })),
};
// ポジション色: 10色のパレット(JC)から選択。c が色の番号
const pal = x => JC[x.c % PAL];
const cvars = () => undefined;
const ucls = x => x ? ' u' + (x.c % PAL) : '';
const Opts = ({ v, onChange }) => (
  <select value={v} onChange={e => onChange(e.target.value)}>
    {TIMES.map(t => <option key={t} value={t}>{lab(t)}</option>)}
  </select>
);

export default function ShiftApp({ store, name }) {
  const [S, setS] = useState(INIT), [P, setP] = useState(null), [req, setReq] = useState({});
  const [dlg, setDlg] = useState(null), [nn, setNn] = useState(''), [nr, setNr] = useState('アルバイト'), [nd, setNd] = useState(''), [pick, setPick] = useState(null), [syncErr, setSyncErr] = useState(''), [blocked, setBlocked] = useState(false), [saveMsg, setSaveMsg] = useState('');
  const ver = useRef(0), skip = useRef(true), chain = useRef(Promise.resolve());
  const set = f => setS(s => { const d = structuredClone(s); f(d); return d; });

  // データはサーバーに保存し、どの端末からでも同じ内容を表示する
  useEffect(() => {
    (async () => {
      let remote = { v: 0, data: null };
      try {
        const r = await fetch(`/api/s/${store}/state`);
        const j = await r.json().catch(() => ({}));
        if (r.ok) remote = j; else { setBlocked(true); setSaveMsg(j.error || 'サーバーのデータを読み込めませんでした。ログインし直してください。'); }
      } catch { setBlocked(true); setSaveMsg('サーバーのデータを読み込めませんでした（通信エラー）。'); }
      ver.current = remote.v || 0;
      let data = remote.data;
      if (!data) { try { const l = localStorage.getItem(KEY + ':' + store); if (l) data = JSON.parse(l); } catch {} } // 初回のみ: このブラウザ内のデータをサーバーへ移行
      skip.current = !(data && !remote.data);
      if (data) setS(s => ({ ...s, ...data }));
      const n = new Date(); setP({ y: n.getFullYear(), m: n.getMonth(), h: n.getDate() > 15 ? 1 : 0 });
    })();
  }, []);
  useEffect(() => {
    if (!P || blocked) return;
    if (skip.current) { skip.current = false; return; }
    const t = setTimeout(() => {
      try { localStorage.setItem(KEY + ':' + store, JSON.stringify(S)); } catch {}
      chain.current = chain.current.then(async () => {
        try {
          const r = await fetch(`/api/s/${store}/state`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: S, base: ver.current }) });
          const j = await r.json().catch(() => ({}));
          if (r.ok) { ver.current = j.v; setSaveMsg(''); }
          else if (r.status === 409) { setBlocked(true); setSaveMsg('他の端末で更新されています。ページを再読み込みしてください（このままでは保存されません）。'); }
          else setSaveMsg(j.error || '保存に失敗しました。');
        } catch { setSaveMsg('保存に失敗しました（通信エラー）。'); }
      });
    }, 600);
    return () => clearTimeout(t);
  }, [S, P, blocked]);
  // スタッフ名簿(id・名前のみ。時給は送らない)をサーバーへ共有
  const names = JSON.stringify(S.staff.map(p => [p.id, p.name]));
  useEffect(() => {
    if (!P || blocked) return;
    fetch(`/api/s/${store}/staff`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ list: S.staff.map(({ id, name }) => ({ id, name })) }) })
      .then(async r => setSyncErr(r.ok ? '' : ((await r.json().catch(() => ({}))).error || 'スタッフ名簿を保存できませんでした。')))
      .catch(() => setSyncErr('スタッフ名簿を保存できませんでした（通信エラー）。'));
  }, [names, P, store, blocked]);
  const load = () => fetch(`/api/s/${store}/requests`).then(r => r.json()).then(setReq).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!P) return <main />;

  const ds = range(P.y, P.m, P.h), key = pkey(P.y, P.m, P.h), [wa, wb] = win(P.y, P.m, P.h), rq = req[key] || {};
  const md = d => `${d.getMonth() + 1}月${d.getDate()}日`;
  const dutyOf = n => S.duties.find(x => x.name === n);
  const cell = (p, d) => S.cells[p.id + '|' + iso(d)] || '';
  const sum = (p, days, f) => days.reduce((a, d) => a + f(cell(p, d)), 0);
  const isEmp = p => p.role === '社員';
  const mp = days => S.staff.reduce((a, p) => a + (isEmp(p) ? 0 : sum(p, days, v => cost(v, p.wage))), 0);
  const f = S.fin[P.y + '-' + P.m] || {};
  const pay0 = mp(range(P.y, P.m, 0)), pay1 = mp(range(P.y, P.m, 1));
  // 社員人件費・目標売上は月間で入力し、前半(15日)・後半(残りの日数)に日割りで配分
  const nd0 = 15, nd1 = new Date(P.y, P.m + 1, 0).getDate() - 15, ndm = nd0 + nd1;
  const empM = f.emp ?? ((f.emp0 || 0) + (f.emp1 || 0)), salesM = f.sales || 0, daily = empM / ndm;
  // 日ごとの目標売上: A=月間目標÷日数 に曜日係数(月〜木0.75/金・日1.25/土1.5)を掛け、その合計Bと月間目標の差を日数で割ったCを各日に加算（合計が月間目標と一致）
  const FAC = [1.25, 0.75, 0.75, 0.75, 0.75, 1.25, 1.5];
  const mdays = [...range(P.y, P.m, 0), ...range(P.y, P.m, 1)];
  const A = salesM / ndm, B = mdays.reduce((a, d) => a + A * FAC[d.getDay()], 0), C = (salesM - B) / ndm;
  const tgt = d => A * FAC[d.getDay()] + C;
  const dayCost = d => S.staff.reduce((a, p) => a + (isEmp(p) ? 0 : cost(cell(p, d), p.wage)), 0) + daily;
  const tsum = days => days.reduce((a, d) => a + tgt(d), 0);
  const emp0 = daily * nd0, emp1 = daily * nd1, s0 = tsum(range(P.y, P.m, 0)), s1 = tsum(range(P.y, P.m, 1));
  const pt = tsum(ds), pc = ds.reduce((a, d) => a + dayCost(d), 0);
  const t0 = pay0 + emp0, t1 = pay1 + emp1, total = t0 + t1;
  const rt = (c, sl) => sl > 0 ? (c / sl * 100).toFixed(1) + '%' : '—';
  const go = n => setP(({ y, m, h }) => { const a = y * 24 + m * 2 + h + n; return { y: Math.floor(a / 24), m: Math.floor((a % 24) / 2), h: a % 2 }; });
  const setFin = k => e => set(d => { d.fin[P.y + '-' + P.m] = { ...f, [k]: Math.max(0, +e.target.value || 0) }; });

  const open = (p, d) => {
    const v = cell(p, d), [a, b] = v.includes('-') ? v.split('-').map(Number) : [S.last.a, S.last.b];
    setDlg({ k: p.id + '|' + iso(d), a, b, t: `${p.name}　${d.getMonth() + 1}月${d.getDate()}日` });
  };
  const put = v => {
    set(d => {
      if (v) d.cells[dlg.k] = v; else delete d.cells[dlg.k];
      if (v.includes('-')) d.last = { a: dlg.a, b: dlg.b }; else delete d.duty[dlg.k];
    });
    setDlg(null);
  };
  const move = (i, j) => j >= 0 && j < S.staff.length && set(d => { [d.staff[i], d.staff[j]] = [d.staff[j], d.staff[i]]; });
  const del = p => confirm(`${p.name}さんを削除しますか？シフトも消えます。`) && set(d => {
    d.staff = d.staff.filter(x => x.id !== p.id);
    Object.keys(d.cells).forEach(k => { if (k.startsWith(p.id + '|')) { delete d.cells[k]; delete d.duty[k]; } });
  });
  const addStaff = () => { const n = nn.trim(); if (!n) return; set(d => { d.staff.push({ id: 's' + Date.now(), name: n, role: nr, wage: YEN }); }); setNn(''); };
  const addDuty = () => {
    const n = nd.trim(); if (!n) return;
    if (S.duties.some(x => x.name === n)) return alert('同じ名前のポジションがすでにあります');
    set(d => { const u = d.duties.map(x => x.c % PAL); let c = 0; while (c < PAL && u.includes(c)) c++; d.duties.push({ name: n, c: c < PAL ? c : d.duties.length % PAL }); });
    setNd('');
  };
  const delDuty = x => confirm(`「${x.name}」を削除しますか？このポジションを設定していたシフトは、ポジションが未選択に戻ります。`) && set(d => {
    d.duties = d.duties.filter(y => y.name !== x.name);
    Object.keys(d.duty).forEach(k => { if (d.duty[k] === x.name) delete d.duty[k]; });
  });
  const reflect = () => {
    if (!confirm('提出された希望をシフト表に反映します。同じ日の既存のシフトは上書きされます。よろしいですか？')) return;
    set(d => { S.staff.forEach(p => { const q = rq[p.id]; if (q) Object.entries(q.days).forEach(([k, v]) => { d.cells[p.id + '|' + k] = v; }); }); });
  };

  const exportJpg = () => {
    const NW = 116, CW = 76, HW = 60, RH = 46, HH = 44, TT = 56, pad = 16, k = 2, n = S.staff.length;
    const W = pad * 2 + NW + CW * ds.length + HW, H = pad * 2 + TT + HH + RH * n + 34 + 44;
    const cv = document.createElement('canvas'); cv.width = W * k; cv.height = H * k;
    const g = cv.getContext('2d'); g.scale(k, k);
    const F = '"Hiragino Sans","Yu Gothic",Meiryo,sans-serif';
    const tx = (t, x, y, f, co, al, mw) => { g.font = f + ' ' + F; g.fillStyle = co; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y, mw); };
    const ln = y => { g.strokeStyle = '#d6dee2'; g.lineWidth = 1; g.beginPath(); g.moveTo(pad, y); g.lineTo(W - pad, y); g.stroke(); };
    const box = (x, y, w, h, co) => { g.fillStyle = co; g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, 5); else g.rect(x, y, w, h); g.fill(); };
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    let y = pad;
    tx(`${P.y}年${P.m + 1}月 ${P.h ? '後半' : '前半'}（${ds[0].getDate()}日〜${ds.at(-1).getDate()}日）シフト表`, pad, y + TT / 2, '700 20px', '#1c2b36', 'left'); y += TT; const top = y;
    tx('スタッフ', pad + 8, y + HH / 2, '500 12px', '#667784', 'left');
    ds.forEach((d, i) => { const x = pad + NW + i * CW, w = d.getDay(); tx(WD[w], x + CW / 2, y + 13, '500 12px', w === 6 ? '#2a7bb0' : w === 0 ? '#c0392b' : '#667784'); tx(String(d.getDate()), x + CW / 2, y + 31, '700 15px', '#1c2b36'); });
    tx('勤務h', pad + NW + CW * ds.length + HW / 2, y + HH / 2, '500 12px', '#667784');
    y += HH; ln(y);
    S.staff.forEach(p => {
      tx(p.name, pad + 8, y + RH / 2 - 7, '500 14px', '#1c2b36', 'left'); tx(p.role || '', pad + 8, y + RH / 2 + 11, '400 11px', '#667784', 'left');
      ds.forEach((d, i) => {
        const key = p.id + '|' + iso(d), v = S.cells[key] || '', x = pad + NW + i * CW, u = dutyOf(S.duty[key] || '');
        if (!v) return;
        if (v === '休') { box(x + 3, y + 4, CW - 6, RH - 8, '#e4e8ea'); tx('休', x + CW / 2, y + RH / 2, '500 13px', '#7b8a95'); return; }
        const q = u ? pal(u) : JC[0]; box(x + 3, y + 4, CW - 6, RH - 8, q[0]);
        tx(v, x + CW / 2, y + RH / 2 - (u ? 7 : 0), '700 12px', q[1]); if (u) tx(S.duty[key], x + CW / 2, y + RH / 2 + 10, '500 11px', q[1], 'center', CW - 10);
      });
      tx(sum(p, ds, hrs) + 'h', pad + NW + CW * ds.length + HW / 2, y + RH / 2, '500 13px', '#667784');
      y += RH; ln(y);
    });
    tx('出勤人数', pad + 8, y + 17, '500 12px', '#667784', 'left');
    ds.forEach((d, i) => { const m = S.staff.filter(p => hrs(cell(p, d)) > 0).length; tx(m + '人', pad + NW + i * CW + CW / 2, y + 17, '500 12px', '#667784'); });
    y += 34;
    g.strokeStyle = '#d6dee2'; g.lineWidth = 1;
    for (let i = 0; i <= ds.length; i++) { const lx = pad + NW + i * CW; g.beginPath(); g.moveTo(lx, top); g.lineTo(lx, y); g.stroke(); }
    let x = pad;
    S.duties.forEach(t => { const q = pal(t); g.font = '700 12px ' + F; const w = Math.max(64, g.measureText(t.name).width + 20); box(x, y + 8, w, 22, q[0]); tx(t.name, x + w / 2, y + 19, '700 12px', q[1]); x += w + 8; });
    cv.toBlob(b => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(b);
      a.download = `shift_${P.y}-${String(P.m + 1).padStart(2, '0')}_${P.h + 1}.jpg`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, 'image/jpeg', 0.92);
  };

  let TH = 0, TP = 0;
  return (
    <main>
      <h1>{name}　シフト表</h1>
      {saveMsg && <div className="warn" style={{ marginBottom: 10 }}>{saveMsg}</div>}
      <div className="top">
      <section className="fin" style={{ flex: '1 1 460px', maxWidth: 560 }}>
        <h2>{P.y}年{P.m + 1}月の人件費</h2>
        <label className="r">目標売上（月間・円）<input type="number" min="0" step="10000" value={f.sales || ''} onChange={setFin('sales')} /></label>
        <label className="r">社員の人件費（月間・円）<input type="number" min="0" step="10000" value={f.emp ?? (empM || '')} onChange={setFin('emp')} /></label>
        <div style={{ overflowX: 'auto', margin: '8px 0 0' }}><table>
          <thead><tr><th /><th>前半<br />1〜15日（{nd0}日）</th><th>後半<br />16日〜末日（{nd1}日）</th><th>月間合計<br />（{ndm}日）</th></tr></thead>
          <tbody>
            <tr><td style={{ textAlign: 'left' }}>目標売上（曜日調整後）</td><td className="pay">{yen(s0)}</td><td className="pay">{yen(s1)}</td><td className="pay">{yen(salesM)}</td></tr>
            <tr><td style={{ textAlign: 'left' }}>アルバイト（自動）</td><td className="pay">{yen(pay0)}</td><td className="pay">{yen(pay1)}</td><td className="pay">{yen(pay0 + pay1)}</td></tr>
            <tr><td style={{ textAlign: 'left' }}>社員（日割り）</td><td className="pay">{yen(emp0)}</td><td className="pay">{yen(emp1)}</td><td className="pay">{yen(empM)}</td></tr>
            <tr><td style={{ textAlign: 'left', fontWeight: 700 }}>人件費合計</td><td className="pay">{yen(t0)}</td><td className="pay">{yen(t1)}</td><td className="pay">{yen(total)}</td></tr>
            <tr><td style={{ textAlign: 'left', fontWeight: 700 }}>人件費率</td>
              {[[t0, s0], [t1, s1], [total, salesM]].map(([c, sl], i) => <td key={i} className="pay" style={{ fontSize: 16, color: 'var(--accent)' }}>{rt(c, sl)}</td>)}</tr>
          </tbody>
        </table></div>
      </section>
      <div style={{ flex: '1 1 300px', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 14 }}>
<section className="fin" style={{ maxWidth: 'none' }}>
        <h2>ポジションの設定</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {S.duties.map(x => <span key={x.name} className={ucls(x).trim()}>
            <span className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {x.name}
              <button className="mv" style={{ color: 'inherit', textDecoration: 'underline' }} aria-label={x.name + 'の色を変更'} onClick={() => setPick(pick === x.name ? null : x.name)}>色</button>
              <button className="mv" style={{ color: 'inherit' }} aria-label={x.name + 'を削除'} onClick={() => delDuty(x)}>✕</button>
            </span></span>)}
        </div>
        {pick && S.duties.some(x => x.name === pick) && <div style={{ marginBottom: 10 }}>
          <div className="sub">「{pick}」の色を選んでください</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {JC.map((c, k) => (
              <button key={k} type="button" onClick={() => { set(d => { d.duties.find(x => x.name === pick).c = k; }); setPick(null); }}
                style={{ background: c[0], color: c[1], padding: '4px 10px', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer', border: S.duties.find(x => x.name === pick).c % PAL === k ? '3px solid var(--ink)' : '1px solid var(--line)' }}>{CN[k]}</button>
            ))}
          </div>
        </div>}
        <div className="add" style={{ margin: 0 }}>
          <input value={nd} onChange={e => setNd(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDuty()} placeholder="ポジション名を入力" maxLength={10} />
          <button className="btn main" onClick={addDuty}>ポジションを追加</button>
        </div>
      </section>
        <section className="fin" style={{ maxWidth: 'none' }}>
          <h2>スタッフの追加</h2>
      <div className="add" style={{ margin: 0, flexWrap: 'wrap' }}>
        <input value={nn} onChange={e => setNn(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStaff()} placeholder="スタッフ名を入力" maxLength={20} />
        <select value={nr} onChange={e => setNr(e.target.value)}><option>アルバイト</option><option>社員</option></select>
        <button className="btn main" onClick={addStaff}>スタッフを追加</button>
      </div>
        {syncErr && <div className="warn" style={{ marginTop: 8 }}>{syncErr}</div>}
        </section>
      </div>
      </div>

      <div className="bar">
        <button className="btn" onClick={() => go(-1)}>‹ 前へ</button>
        <div className="t">{P.y}年{P.m + 1}月 {P.h ? `後半（16日〜${ds.at(-1).getDate()}日）` : '前半（1日〜15日）'}</div>
        <button className="btn" onClick={() => go(1)}>次へ ›</button>
        <button className="btn" onClick={() => { const n = new Date(); setP({ y: n.getFullYear(), m: n.getMonth(), h: n.getDate() > 15 ? 1 : 0 }); }}>今期</button>
        <button className="btn" onClick={exportJpg}>JPG出力</button>
        <button className="btn" onClick={async () => { await fetch(`/api/s/${store}/login`, { method: 'DELETE' }); location.href = `/s/${store}/login`; }}>ログアウト</button>
      </div>

      <div className="wrap"><table>
        <thead><tr>
          <th style={{ textAlign: 'left', paddingLeft: 8 }}>スタッフ</th><th>区分</th><th>時給(円)</th>
          {ds.map(d => <th key={+d} className={d.getDay() === 6 ? 'sat' : d.getDay() === 0 ? 'sun' : ''}>{WD[d.getDay()]}<b style={{ display: 'block', fontSize: 16, color: 'var(--ink)' }}>{d.getDate()}</b></th>)}
          <th>勤務h</th><th>支給額</th>
        </tr></thead>
        <tbody>
          {S.staff.map((p, i) => {
            const t = sum(p, ds, hrs), n = sum(p, ds, nh), pay = isEmp(p) ? 0 : (t + n * 0.25) * p.wage;
            TH += t; TP += pay;
            return (
              <tr key={p.id}>
                <td className="name">
                  <button className="mv" disabled={!i} onClick={() => move(i, i - 1)} aria-label="上へ">▲</button>
                  <button className="mv" disabled={i === S.staff.length - 1} onClick={() => move(i, i + 1)} aria-label="下へ">▼</button> {p.name}
                  <button className="mv" onClick={() => del(p)} style={{ marginLeft: 6 }}>削除</button>
                </td>
                <td><select className="rl" value={p.role} onChange={e => set(d => { d.staff[i].role = e.target.value; })}><option>社員</option><option>アルバイト</option></select></td>
                <td>{isEmp(p) ? <span className="h">—</span> : <input className="w" type="number" min="0" step="10" value={p.wage} onChange={e => set(d => { d.staff[i].wage = Math.max(0, +e.target.value || 0); })} />}</td>
                {ds.map(d => {
                  const k = p.id + '|' + iso(d), v = cell(p, d), dn = S.duty[k] || '', dd = dutyOf(dn), w = hrs(v) > 0;
                  return (
                    <td key={k}><div className={'cw' + (w ? ucls(dd) : '')} style={w ? cvars(dd) : undefined}>
                      <button className="c" data-k={v ? (v === '休' ? 'o' : 'w') : ''} onClick={() => open(p, d)}>{v || '＋'}</button>
                      {w && <select className="du" value={dn} aria-label="ポジション" onChange={e => set(x => { if (e.target.value) x.duty[k] = e.target.value; else delete x.duty[k]; })}>
                        <option value="">ポジション</option>{S.duties.map(x => <option key={x.name}>{x.name}</option>)}
                      </select>}
                    </div></td>
                  );
                })}
                <td className="h">{t}h{n > 0 && <><br /><small>深夜{n}h</small></>}</td>
                <td className="pay">{isEmp(p) ? '—' : yen(pay)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr><td className="name">出勤人数</td><td /><td />
            {ds.map(d => { const n = S.staff.filter(p => hrs(cell(p, d)) > 0).length; return <td key={+d} className="h">{n}人</td>; })}
            <td /><td /></tr>
          <tr><td className="name">目標売上</td><td /><td />{ds.map(d => <td key={+d} className="sm">{salesM ? yen(tgt(d)) : '—'}</td>)}<td colSpan={2} className="sm">{salesM ? yen(pt) : '—'}</td></tr>
          <tr><td className="name">人件費（予定）</td><td /><td />{ds.map(d => <td key={+d} className="sm">{yen(dayCost(d))}</td>)}<td colSpan={2} className="sm">{yen(pc)}</td></tr>
          <tr><td className="name">人件費率</td><td /><td />{ds.map(d => <td key={+d} className="pay" style={{ color: 'var(--accent)' }}>{rt(dayCost(d), tgt(d))}</td>)}<td colSpan={2} className="pay" style={{ color: 'var(--accent)' }}>{rt(pc, pt)}</td></tr>
          <tr><td className="name">合計</td><td /><td /><td colSpan={ds.length} /><td className="h">{TH}h</td><td className="pay">{yen(TP)}</td></tr>
        </tfoot>
      </table></div>
      <p className="sub">セルをクリックして開始・終了時間を選択（例：13-25.5 ＝ 13:00〜25:30）　22時以降は時給×1.25で計算</p>

      <section className="fin wide">
        <h2>{P.y}年{P.m + 1}月 {P.h ? '後半' : '前半'}のシフト希望</h2>
        <div className="sub">提出期間：{md(wa)}〜{md(wb)}　提出済み {S.staff.filter(p => rq[p.id]).length}/{S.staff.length}人　（スタッフには /s/{store}/submit のURLを共有してください）</div>
        <div className="wrap" style={{ marginTop: 8 }}><table>
          <thead><tr><th style={{ textAlign: 'left', paddingLeft: 8 }}>スタッフ</th>{ds.map(d => <th key={+d}>{d.getDate()}</th>)}</tr></thead>
          <tbody>{S.staff.map(p => (
            <tr key={p.id}><td className="name">{p.name}{!rq[p.id] && <span className="warn" style={{ fontSize: 12 }}>　未提出</span>}</td>
              {ds.map(d => <td key={+d} className="sm">{rq[p.id]?.days[iso(d)] || ''}</td>)}</tr>
          ))}</tbody>
        </table></div>
        <div className="acts"><button className="btn main" onClick={reflect}>希望をシフト表に反映</button><button className="btn" onClick={load}>最新の状態に更新</button></div>
      </section>

      {dlg && <div className="back" onClick={() => setDlg(null)}><div className="modal" onClick={e => e.stopPropagation()}>
        <b>{dlg.t}</b>
        <div className="row">
          <label>開始<Opts v={dlg.a} onChange={x => setDlg({ ...dlg, a: +x })} /></label>
          <label>終了<Opts v={dlg.b} onChange={x => setDlg({ ...dlg, b: +x })} /></label>
        </div>
        <div className={dlg.b > dlg.a ? 'sub' : 'warn'}>{dlg.b > dlg.a ? `${dlg.a}-${dlg.b}　勤務 ${dlg.b - dlg.a} 時間` : '終了は開始より後の時間を選んでください'}</div>
        <div className="acts">
          <button className="btn main" disabled={dlg.b <= dlg.a} onClick={() => put(`${dlg.a}-${dlg.b}`)}>保存</button>
          <button className="btn" onClick={() => put('休')}>休み</button>
          <button className="btn" onClick={() => put('')}>クリア</button>
          <button className="btn" onClick={() => setDlg(null)}>キャンセル</button>
        </div>
      </div></div>}
    </main>
  );
}
