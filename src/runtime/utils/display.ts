import type { DdysMovie, DdysSource } from '../types/ddys';
import { safeMediaUrl } from './security';

export function movieTitle(movie: DdysMovie): string {
  return String(movie.title || movie.name || movie.slug || 'Untitled');
}

export function movieSlug(movie: DdysMovie): string {
  return String(movie.slug || movie.id || '');
}

export function moviePoster(movie: DdysMovie, fallback = '/ddys-astro/images/logo.png'): string {
  return safeMediaUrl(movie.poster || movie.cover, fallback);
}

export function movieDescription(movie: DdysMovie): string {
  return String(movie.description || movie.summary || '').replace(/\s+/g, ' ').trim();
}

export function sourceLabel(source: DdysSource): string {
  return String(source.label || source.name || source.type || 'Source');
}

export function listFromPayload<T = unknown>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const object = payload as { data?: unknown; items?: unknown; results?: unknown };
    if (Array.isArray(object.data)) return object.data as T[];
    if (Array.isArray(object.items)) return object.items as T[];
    if (Array.isArray(object.results)) return object.results as T[];
  }
  return [];
}
