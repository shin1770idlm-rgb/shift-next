// 店舗の設定は環境変数 STORES(JSON) から読み込む（パスワードをコードに含めないため）
// 例: STORES='[{"id":"shop1","name":"1号店","user":"admin1","password":"xxxx"}]'
export const allStores = () => { try { const a = JSON.parse(process.env.STORES || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } };
export const getStore = id => allStores().find(s => s.id === id);
