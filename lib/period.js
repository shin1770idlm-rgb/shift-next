export const WD = ['日', '月', '火', '水', '木', '金', '土'];
export const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const pkey = (y, m, h) => `${y}-${m + 1}-${h}`;
// 提出期間: 前半(1-15日)=前月8〜23日 / 後半(16日〜末)=前月24日〜当月7日
export const win = (y, m, h) => h ? [new Date(y, m - 1, 24), new Date(y, m, 7, 23, 59, 59)] : [new Date(y, m - 1, 8), new Date(y, m - 1, 23, 23, 59, 59)];
export const range = (y, m, h) => { const l = new Date(y, m + 1, 0).getDate(); return [...Array(h ? l - 15 : 15)].map((_, i) => new Date(y, m, (h ? 16 : 1) + i)); };
// サーバー(UTC)でも日本時間で判定できるよう、日本時間の日時を持つDateを返す
export const jstNow = () => new Date(Date.now() + 9 * 36e5 + new Date().getTimezoneOffset() * 6e4);
export const openPeriod = (now = jstNow()) => {
  for (let o = -1; o <= 2; o++) for (let h = 0; h < 2; h++) {
    const d = new Date(now.getFullYear(), now.getMonth() + o, 1), y = d.getFullYear(), m = d.getMonth(), [a, b] = win(y, m, h);
    if (now >= a && now <= b) return { y, m, h, a, b };
  }
};
export const TIMES = Array.from({ length: 34 }, (_, i) => 13 + i / 2); // 13〜29.5 (0.5刻み)
export const lab = v => `${v}（${Math.floor(v)}:${v % 1 ? '30' : '00'}）`;
const ab = v => v && v.includes('-') ? v.split('-').map(Number) : null;
export const hrs = v => { const r = ab(v); return r ? r[1] - r[0] : 0; };
export const nh = v => { const r = ab(v); return r ? Math.max(0, r[1] - Math.max(r[0], 22)) : 0; }; // 22時以降
export const cost = (v, w) => (hrs(v) + nh(v) * 0.25) * w; // 22時以降は1.25倍
export const yen = n => '¥' + Math.round(n).toLocaleString('ja-JP');

// 日本の祝日（振替休日・国民の休日を含む。2022年以降の通常ルール。春分・秋分は近似式で2099年まで）
const pad2 = n => String(n).padStart(2, '0');
const nthMon = (y, m, n) => 1 + ((8 - new Date(y, m, 1).getDay()) % 7) + (n - 1) * 7;
const hcache = {};
export function holidays(y) {
  if (hcache[y]) return hcache[y];
  const k = (m, d) => `${y}-${pad2(m)}-${pad2(d)}`, s = new Set(), t = y - 1980;
  const vernal = Math.floor(20.8431 + 0.242194 * t - Math.floor(t / 4)), autumn = Math.floor(23.2488 + 0.242194 * t - Math.floor(t / 4));
  [[1, 1], [1, nthMon(y, 0, 2)], [2, 11], [3, vernal], [4, 29], [5, 3], [5, 4], [5, 5], [7, nthMon(y, 6, 3)], [9, nthMon(y, 8, 3)], [9, autumn], [10, nthMon(y, 9, 2)], [11, 3], [11, 23]].forEach(([m, d]) => s.add(k(m, d)));
  if (y >= 2016) s.add(k(8, 11));
  if (y >= 2020) s.add(k(2, 23));
  [...s].forEach(x => { // 日曜と重なった祝日は、次の平日(祝日でない日)が振替休日
    const d = new Date(x + 'T00:00:00');
    if (d.getDay() === 0) { const n = new Date(d); do { n.setDate(n.getDate() + 1); } while (s.has(iso(n))); s.add(iso(n)); }
  });
  for (let m = 0; m < 12; m++) for (let d = 1; d <= 31; d++) { // 前日と翌日が祝日の平日は国民の休日
    const c = new Date(y, m, d);
    if (c.getMonth() !== m || c.getDay() === 0 || s.has(iso(c))) continue;
    if (s.has(iso(new Date(y, m, d - 1))) && s.has(iso(new Date(y, m, d + 1)))) s.add(iso(c));
  }
  return (hcache[y] = s);
}
export const isHoliday = d => holidays(d.getFullYear()).has(iso(d));
