const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
// ログインCookieの署名用の秘密鍵（SESSION_SECRET、なければ全体管理者のパスワード）
const secret = () => process.env.SESSION_SECRET || process.env.SUPER_ADMIN_PASSWORD || process.env.STORES || '';
async function mac(msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode('shift:' + secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}
export const hasSecret = () => !!secret();
export const sign = async (scope, exp) => `${exp}.${await mac(scope + ':' + exp)}`;
export async function verify(scope, tok) {
  if (!secret() || !tok) return false;
  const [exp] = tok.split('.');
  return Number(exp) > Date.now() && tok === (await sign(scope, exp));
}
// 店舗のパスワードはハッシュ(PBKDF2)にして保存する
export const newSalt = () => hex(crypto.getRandomValues(new Uint8Array(16)));
export async function hashPw(pw, salt) {
  const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100000 }, k, 256));
}
export async function checkLogin(s, user, pw) {
  if (user !== s.user || typeof pw !== 'string') return false;
  if (s.hash) return (await hashPw(pw, s.salt)) === s.hash;
  return !!s.password && s.password !== 'change-me' && pw === s.password; // 環境変数 STORES の店舗
}
