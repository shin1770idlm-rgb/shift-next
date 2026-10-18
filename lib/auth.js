const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
async function mac(msg, secret) {
  const k = await crypto.subtle.importKey('raw', enc.encode('shift:' + secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}
export const usable = s => !!s.password && s.password !== 'change-me';
export const sign = async (s, exp) => `${exp}.${await mac(s.id + ':' + exp, s.password)}`;
export async function verify(s, tok) {
  if (!usable(s) || !tok) return false;
  const [exp] = tok.split('.');
  return Number(exp) > Date.now() && tok === (await sign(s, exp));
}
