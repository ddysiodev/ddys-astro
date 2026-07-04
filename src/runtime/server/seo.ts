import type { DdysClient } from '../client/client';
import type { DdysConfig } from '../config';
import type { DdysMovie } from '../types/ddys';
import { listFromPayload, movieDescription, moviePoster, movieSlug, movieTitle } from '../utils/display';

export interface DdysSeoInput {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: string;
}

export interface DdysSitemapOptions {
  limit?: number;
  includeDictionaries?: boolean;
}

export function createDdysSeo(config: DdysConfig, input: DdysSeoInput = {}) {
  const url = new URL(input.path || config.astro.mountPath, config.siteBaseUrl).toString();
  const title = input.title || 'DDYS';
  const description = input.description || 'DDYS movies and video resources.';
  const image = input.image || new URL(`${config.iconBasePath}/logo.png`, config.siteBaseUrl).toString();
  return {
    title,
    description,
    canonical: url,
    openGraph: { title, description, url, image, type: input.type || 'website' },
    twitter: { card: 'summary_large_image', title, description, image }
  };
}

export function createDdysMovieSeo(config: DdysConfig, movie: DdysMovie) {
  return createDdysSeo(config, {
    title: `${movieTitle(movie)} - DDYS`,
    description: movieDescription(movie),
    path: `${config.astro.mountPath}/movie/${movieSlug(movie)}`,
    image: moviePoster(movie, new URL(`${config.iconBasePath}/logo.png`, config.siteBaseUrl).toString()),
    type: 'video.movie'
  });
}

export function createDdysMovieJsonLd(config: DdysConfig, movie: DdysMovie) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movieTitle(movie),
    description: movieDescription(movie),
    image: moviePoster(movie, new URL(`${config.iconBasePath}/logo.png`, config.siteBaseUrl).toString()),
    url: new URL(`${config.astro.mountPath}/movie/${movieSlug(movie)}`, config.siteBaseUrl).toString(),
    datePublished: movie.year ? String(movie.year) : undefined
  };
}

export async function createDdysSitemap(client: DdysClient, config: DdysConfig, options: DdysSitemapOptions = {}) {
  const urls = new Set<string>([
    config.astro.mountPath,
    `${config.astro.mountPath}/latest`,
    `${config.astro.mountPath}/hot`,
    `${config.astro.mountPath}/movies`,
    `${config.astro.mountPath}/search`,
    `${config.astro.mountPath}/calendar`,
    `${config.astro.mountPath}/collections`,
    `${config.astro.mountPath}/shares`,
    `${config.astro.mountPath}/request`
  ]);
  if (options.includeDictionaries !== false) {
    urls.add(`${config.astro.mountPath}/types`);
    urls.add(`${config.astro.mountPath}/genres`);
    urls.add(`${config.astro.mountPath}/regions`);
  }
  try {
    const latest = await client.latest({ limit: options.limit || 50 });
    for (const movie of listFromPayload<DdysMovie>(latest)) {
      const slug = movieSlug(movie);
      if (slug) urls.add(`${config.astro.mountPath}/movie/${slug}`);
    }
  } catch {
    // A sitemap should still be useful when the upstream API is temporarily unavailable.
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Array.from(urls).map((path) => `  <url><loc>${escapeXml(new URL(path, config.siteBaseUrl).toString())}</loc></url>`).join('\n')}\n</urlset>\n`;
}

export function createDdysRobotsText(config: DdysConfig) {
  const sitemap = new URL('/sitemap.xml', config.siteBaseUrl).toString();
  return `User-agent: *\nAllow: ${config.astro.mountPath}/\nDisallow: ${config.routePrefix}/\nSitemap: ${sitemap}\n`;
}

export function createDdysManifest(config: DdysConfig) {
  return {
    name: 'DDYS',
    short_name: 'DDYS',
    start_url: config.astro.mountPath,
    scope: config.astro.mountPath,
    display: 'standalone',
    theme_color: '#121827',
    background_color: '#ffffff',
    icons: [
      { src: `${config.iconBasePath}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${config.iconBasePath}/icon-512.png`, sizes: '512x512', type: 'image/png' }
    ]
  };
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char] || char));
}
