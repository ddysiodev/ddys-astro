import type { DdysClient } from '../client/client';
import type { DdysConfigInput } from '../config';
import type { DdysMovie } from '../types/ddys';
import { listFromPayload, movieSlug } from '../utils/display';
import { createDdysServerClient } from '../server/client';

export interface DdysContentLoaderOptions extends DdysConfigInput {
  view?: 'latest' | 'hot' | 'movies';
  limit?: number;
}

interface AstroContentStore<T> {
  set(input: { id: string; data: T }): void | Promise<void>;
  clear?(): void | Promise<void>;
}

export function createDdysContentLoader(options: DdysContentLoaderOptions = {}) {
  return {
    name: 'ddys-astro-loader',
    async load({ store }: { store: AstroContentStore<DdysMovie> }) {
      await store.clear?.();
      const client = createDdysServerClient(options);
      const movies = await loadMovies(client, options);
      for (const movie of movies) {
        const id = movieSlug(movie);
        if (id) await store.set({ id, data: movie });
      }
    }
  };
}

export async function createDdysStaticPaths(options: DdysContentLoaderOptions = {}) {
  const client = createDdysServerClient(options);
  const movies = await loadMovies(client, options);
  return movies
    .map((movie) => movieSlug(movie))
    .filter(Boolean)
    .map((slug) => ({ params: { slug } }));
}

async function loadMovies(client: DdysClient, options: DdysContentLoaderOptions) {
  const limit = options.limit || 50;
  const view = options.view || 'latest';
  if (view === 'hot') return listFromPayload<DdysMovie>(await client.hot({ limit }));
  if (view === 'movies') return listFromPayload<DdysMovie>(await client.movies({ per_page: limit }));
  return listFromPayload<DdysMovie>(await client.latest({ limit }));
}
