import type { DdysPrimitive, DdysQuery } from '../types/ddys';

export interface QuerySecurity {
  maxLimit: number;
  maxPerPage: number;
  maxPage: number;
}

export function normalizeBaseUrl(value: unknown, fallback: string): string {
  const text = String(value || '').trim();
  if (!text) return fallback.replace(/\/+$/, '');
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) return fallback.replace(/\/+$/, '');
    return url.toString().replace(/\/+$/, '');
  } catch {
    return fallback.replace(/\/+$/, '');
  }
}

export function normalizeRoutePrefix(value: unknown, fallback = ''): string {
  const text = String(value ?? fallback).trim().replace(/\/+$/, '');
  if (!text) return '';
  return text.startsWith('/') ? text : `/${text}`;
}

export function boolValue(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

export function intRange(value: unknown, fallback: number, min: number, max: number): number {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(next)));
}

export function cleanQuery(query: DdysQuery): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first === undefined || first === null || first === '') continue;
    out[key] = String(first).slice(0, 300);
  }
  return out;
}

export function buildQuery(params: DdysQuery, keys: string[], security: QuerySecurity = { maxLimit: 50, maxPage: 999, maxPerPage: 50 }): Record<string, string> {
  const clean = cleanQuery(params);
  const out: Record<string, string> = {};
  for (const key of keys) {
    if (!(key in clean)) continue;
    out[key] = clean[key];
  }
  if (out.limit) out.limit = String(intRange(out.limit, 12, 1, security.maxLimit));
  if (out.per_page) out.per_page = String(intRange(out.per_page, 12, 1, security.maxPerPage));
  if (out.page) out.page = String(intRange(out.page, 1, 1, security.maxPage));
  return out;
}

export function toSearchParams(query: Record<string, DdysPrimitive>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  return params.toString();
}

export function routeSegment(value: unknown, label: string): string {
  const text = String(value || '').trim();
  if (!text || text.includes('/') || text.includes('\\') || text.includes('..')) {
    throw new Error(`Invalid ${label}.`);
  }
  return encodeURIComponent(text);
}

export function positiveId(value: unknown, label: string): string {
  const text = String(value || '').trim();
  if (!/^[1-9][0-9]*$/.test(text)) throw new Error(`Invalid ${label}.`);
  return text;
}

export function isAllowedResourceUrl(value: unknown, protocols: string[]): boolean {
  const text = String(value || '').trim();
  if (!text) return false;
  if (text.startsWith('magnet:') || text.startsWith('ed2k:') || text.startsWith('thunder:')) {
    return protocols.includes(text.split(':', 1)[0] + ':');
  }
  try {
    const url = new URL(text);
    return protocols.includes(url.protocol);
  } catch {
    return false;
  }
}

export function safeMediaUrl(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  if (!text) return fallback;
  try {
    const url = new URL(text, 'https://ddys.io');
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

export async function formDataToObject(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await request.json().catch(() => ({}));
    return json && typeof json === 'object' ? json as Record<string, unknown> : {};
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}
