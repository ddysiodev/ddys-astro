import type { DdysConfig } from '../config';
import type { DdysRequestInput } from '../types/ddys';
import { DdysError } from '../client/error';

const rateLimits = new Map<string, number>();

export interface DdysRequestSubmitOptions {
  identity?: string;
  request?: Request;
}

export async function createRequestFormToken(config: DdysConfig, identity = 'anonymous') {
  if (!config.requestForm.enabled) return '';
  if (!config.requestForm.secret) throw new DdysError('DDYS form secret is not configured.', 500, 'GET', '/request');
  const expires = Math.floor(Date.now() / 1000) + config.requestForm.tokenTtlSeconds;
  const payload = `${identity}:${expires}`;
  return `${payload}:${await hmac(config.requestForm.secret, payload)}`;
}

export async function verifyRequestFormToken(config: DdysConfig, token: unknown, identity = 'anonymous') {
  if (!config.requestForm.enabled || !config.requestForm.csrf) return true;
  if (!config.requestForm.secret) throw new DdysError('DDYS form secret is not configured.', 500, 'POST', '/request');
  const parts = String(token || '').split(':');
  if (parts.length !== 3) throw new DdysError('Invalid request token.', 403, 'POST', '/request');
  const [subject, expiresText, signature] = parts;
  if (subject !== identity) throw new DdysError('Invalid request token subject.', 403, 'POST', '/request');
  const expires = Number(expiresText);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) throw new DdysError('Request token expired.', 403, 'POST', '/request');
  const expected = await hmac(config.requestForm.secret, `${subject}:${expiresText}`);
  if (!timingSafeEqual(signature, expected)) throw new DdysError('Invalid request token signature.', 403, 'POST', '/request');
  return true;
}

export function normalizeRequestInput(input: Record<string, unknown>, config: DdysConfig): DdysRequestInput {
  const honeypot = String(input[config.requestForm.honeypotField] || input.honeypot || '');
  if (honeypot) throw new DdysError('Spam request rejected.', 400, 'POST', '/request');
  const title = String(input.title || '').trim();
  if (title.length < 1 || title.length > 120) throw new DdysError('Title must be between 1 and 120 characters.', 400, 'POST', '/request');
  const note = String(input.note || '').trim().slice(0, 1000);
  const contact = String(input.contact || '').trim().slice(0, 200);
  return {
    title,
    year: String(input.year || '').trim().slice(0, 12),
    type: String(input.type || '').trim().slice(0, 40),
    doubanId: String(input.doubanId || input.douban_id || '').trim().slice(0, 40),
    imdbId: String(input.imdbId || input.imdb_id || '').trim().slice(0, 40),
    note,
    contact,
    token: String(input.token || '')
  };
}

export function enforceRateLimit(config: DdysConfig, identity = 'anonymous') {
  const now = Date.now();
  const previous = rateLimits.get(identity) || 0;
  const wait = config.requestForm.rateLimitSeconds * 1000;
  if (previous && now - previous < wait) {
    throw new DdysError('Please wait before submitting another request.', 429, 'POST', '/request');
  }
  rateLimits.set(identity, now);
}

export async function submitDdysRequest(config: DdysConfig, raw: Record<string, unknown>, options: DdysRequestSubmitOptions = {}) {
  if (!config.requestForm.enabled) throw new DdysError('DDYS request form is disabled.', 403, 'POST', '/request');
  const identity = options.identity || 'anonymous';
  await verifyRequestFormToken(config, raw.token, identity);
  enforceRateLimit(config, identity);
  const input = normalizeRequestInput(raw, config);
  const { DdysClient } = await import('../client/client');
  const client = new DdysClient(config, options.request ? fetch : fetch);
  return client.createRequest(input);
}

async function hmac(secret: string, payload: string) {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) throw new DdysError('Web Crypto API is not available.', 500, 'POST', '/request');
  const key = await cryptoApi.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await cryptoApi.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let index = 0; index < a.length; index++) out |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return out === 0;
}
