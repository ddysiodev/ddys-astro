import type { DdysApiResponse, DdysPaginated, DdysQuery, DdysRequestInput } from '../types/ddys';
import { buildQuery, positiveId, routeSegment, toSearchParams } from '../utils/security';

export type DdysProxyFetch = <T = unknown>(url: string, options?: RequestInit) => Promise<T>;

export class DdysProxyClient {
  readonly routePrefix: string;
  private readonly fetcher: DdysProxyFetch;

  constructor(routePrefix = '/api/ddys', fetcher: DdysProxyFetch = fetchJson) {
    this.routePrefix = routePrefix.replace(/\/+$/, '');
    this.fetcher = fetcher;
  }

  async proxy<T = unknown>(route: string, query: DdysQuery = {}): Promise<DdysApiResponse<T>> {
    const params = toSearchParams({ route, ...buildQuery(query, ['slug', 'id', 'username', 'type', 'genre', 'region', 'year', 'sort', 'page', 'per_page', 'limit', 'q', 'month']) });
    return this.fetcher<DdysApiResponse<T>>(`${this.routePrefix}/proxy?${params}`);
  }

  async data<T = unknown>(route: string, query: DdysQuery = {}) {
    const payload = await this.proxy<T>(route, query);
    return (payload.data ?? payload) as T;
  }

  async paginated<T = unknown>(route: string, query: DdysQuery = {}): Promise<DdysPaginated<T>> {
    const payload = await this.proxy<T[]>(route, query);
    return { data: Array.isArray(payload.data) ? payload.data : [], meta: payload.meta ?? {} };
  }

  movies(params: DdysQuery = {}) { return this.paginated('movies', params); }
  latest(params: DdysQuery = {}) { return this.data('latest', params); }
  hot(params: DdysQuery = {}) { return this.data('hot', params); }
  search(params: DdysQuery = {}) { return this.paginated('search', params); }
  suggest(q: string, params: DdysQuery = {}) { return this.data('suggest', { ...params, q }); }
  calendar(params: DdysQuery = {}) { return this.data('calendar', params); }
  movie(slug: string) { routeSegment(slug, 'movie slug'); return this.data('movie', { slug }); }
  sources(slug: string) { return this.data('sources', { slug }); }
  related(slug: string) { return this.data('related', { slug }); }
  comments(slug: string, params: DdysQuery = {}) { return this.paginated('comments', { ...params, slug }); }
  collections(params: DdysQuery = {}) { return this.paginated('collections', params); }
  collection(slug: string, params: DdysQuery = {}) { return this.data('collection', { ...params, slug }); }
  shares(params: DdysQuery = {}) { return this.paginated('shares', params); }
  share(id: string | number) { return this.data('share', { id: positiveId(id, 'share ID') }); }
  requests(params: DdysQuery = {}) { return this.paginated('requests', params); }
  activities(params: DdysQuery = {}) { return this.paginated('activities', params); }
  user(username: string) { return this.data('user', { username }); }
  types() { return this.data('types'); }
  genres() { return this.data('genres'); }
  regions() { return this.data('regions'); }
  createRequest(input: DdysRequestInput) {
    return this.fetcher(`${this.routePrefix}/request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input)
    });
  }
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...options.headers },
    body: options.body
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.message || `DDYS proxy failed with HTTP ${response.status}.`);
  return json as T;
}
