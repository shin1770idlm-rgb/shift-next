import { readStores } from './store';
// 店舗 = アプリの「全体管理」画面で追加したもの(source: app) + 環境変数 STORES(source: env)
const envStores = () => { try { const a = JSON.parse(process.env.STORES || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } };
export const allStores = async () => {
  const dyn = await readStores();
  const env = envStores().filter(e => !dyn.some(d => d.id === e.id));
  return [...dyn.map(d => ({ ...d, source: 'app' })), ...env.map(e => ({ ...e, source: 'env' }))];
};
export const getStore = async id => (await allStores()).find(s => s.id === id);
