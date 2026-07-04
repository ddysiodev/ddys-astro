import type { DdysApiResponse, DdysQuery } from '../types/ddys';
import type { DdysClient } from '../client/client';
import type { DdysCacheConfig } from '../config';

interface Entry {
  expires: number;
  tags: string[];
  value: DdysApiResponse;
}

const memory = new Map<string, Entry>();

export async function cachedDdys(client: DdysClient, route: string, query: DdysQuery = {}, noCache = false): Promise<DdysApiResponse> {
  const key = cacheKeyForRoute(route, query);
  const ttl = ttlForRoute(route, client.config.cache);
  const now = Date.now();
  const existing = memory.get(key);
  if (!noCache && existing && existing.expires > now) {
    return { ...existing.value, meta: { ...(existing.value.meta || {}), cache: 'hit' } };
  }
  const value = await client.proxy(route, query, { noCache });
  memory.set(key, { value, expires: now + ttl * 1000, tags: tagsForRoute(route, query) });
  return { ...value, meta: { ...(value.meta || {}), cache: 'miss' } };
}

export function revalidateDdysCache(input: { route?: string; tag?: string; path?: string } = {}) {
  let count = 0;
  for (const [key, entry] of memory.entries()) {
    const matchedRoute = input.route && key.startsWith(`${input.route}:`);
    const matchedPath = input.path && key.includes(input.path);
    const matchedTag = input.tag && entry.tags.includes(input.tag);
    if (!input.route && !input.path && !input.tag || matchedRoute || matchedPath || matchedTag) {
      memory.delete(key);
      count++;
    }
  }
  return { success: true, revalidated: count };
}

export function cacheKeyForRoute(route: string, query: DdysQuery = {}) {
  const params = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(',') : String(value)}`)
    .join('&');
  return `${route}:${params}`;
}

export function ttlForRoute(route: string, cache: DdysCacheConfig): number {
  if (['types', 'genres', 'regions'].includes(route)) return cache.dictionaryTtl;
  if (['latest', 'hot', 'calendar'].includes(route)) return cache.freshTtl;
  if (['movie', 'sources', 'related'].includes(route)) return cache.detailTtl;
  if (['comments', 'requests', 'activities', 'user'].includes(route)) return cache.communityTtl;
  return ['movies', 'search', 'collections', 'shares'].includes(route) ? cache.listTtl : cache.defaultTtl;
}

export function tagsForRoute(route: string, query: DdysQuery = {}): string[] {
  const tags = ['ddys', `ddys:${route}`];
  if (query.slug) tags.push(`ddys:movie:${query.slug}`);
  if (['types', 'genres', 'regions'].includes(route)) tags.push('ddys:dictionary');
  if (['comments', 'requests', 'activities', 'user'].includes(route)) tags.push('ddys:community');
  return tags;
}
