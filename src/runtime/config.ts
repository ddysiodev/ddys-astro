import { boolValue, intRange, normalizeBaseUrl, normalizeRoutePrefix } from './utils/security';

export interface DdysCacheConfig {
  defaultTtl: number;
  dictionaryTtl: number;
  freshTtl: number;
  listTtl: number;
  detailTtl: number;
  communityTtl: number;
}

export interface DdysRequestFormConfig {
  enabled: boolean;
  csrf: boolean;
  honeypotField: string;
  rateLimitSeconds: number;
  tokenTtlSeconds: number;
  secret?: string;
}

export interface DdysProxyConfig {
  enabled: boolean;
  allowRoutes: string[];
}

export interface DdysDiagnosticsConfig {
  enabled: boolean;
}

export interface DdysSecurityConfig {
  maxLimit: number;
  maxPerPage: number;
  maxPage: number;
  allowedResourceProtocols: string[];
}

export interface DdysAstroRuntimeOptions {
  mountPath: string;
  apiPrefix: string;
  pages: boolean;
  endpoints: boolean;
  seoRoutes: boolean;
  styles: boolean;
  middleware: boolean;
  contentLoader: boolean;
}

export interface DdysConfig {
  apiBaseUrl: string;
  siteBaseUrl: string;
  apiKey?: string;
  routePrefix: string;
  iconBasePath: string;
  timeout: number;
  retryTimes: number;
  retrySleep: number;
  userAgent: string;
  cache: DdysCacheConfig;
  proxy: DdysProxyConfig;
  requestForm: DdysRequestFormConfig;
  diagnostics: DdysDiagnosticsConfig;
  security: DdysSecurityConfig;
  revalidateToken?: string;
  astro: DdysAstroRuntimeOptions;
}

export type DdysConfigInput = Partial<Omit<DdysConfig, 'cache' | 'proxy' | 'requestForm' | 'diagnostics' | 'security' | 'astro'>> & {
  cache?: Partial<DdysCacheConfig>;
  proxy?: Partial<DdysProxyConfig>;
  requestForm?: Partial<DdysRequestFormConfig>;
  diagnostics?: Partial<DdysDiagnosticsConfig>;
  security?: Partial<DdysSecurityConfig>;
  astro?: Partial<DdysAstroRuntimeOptions>;
};

type DdysRuntimeEnv = Record<string, string | undefined>;

export const DDYS_ASTRO_VERSION = '0.1.2';

export const DEFAULT_DDYS_CONFIG: DdysConfig = {
  apiBaseUrl: 'https://ddys.io/api/v1',
  siteBaseUrl: 'https://ddys.io',
  apiKey: '',
  routePrefix: '/api/ddys',
  iconBasePath: '/ddys-astro/images',
  timeout: 12,
  retryTimes: 1,
  retrySleep: 150,
  userAgent: `ddys-astro/${DDYS_ASTRO_VERSION}`,
  cache: {
    defaultTtl: 300,
    dictionaryTtl: 86400,
    freshTtl: 300,
    listTtl: 600,
    detailTtl: 1800,
    communityTtl: 120
  },
  proxy: {
    enabled: true,
    allowRoutes: [
      'movies', 'latest', 'hot', 'search', 'suggest', 'calendar',
      'movie', 'sources', 'related', 'comments',
      'collections', 'collection', 'shares', 'share',
      'requests', 'activities', 'user', 'types', 'genres', 'regions'
    ]
  },
  requestForm: {
    enabled: false,
    csrf: true,
    honeypotField: 'ddys_website',
    rateLimitSeconds: 60,
    tokenTtlSeconds: 1800
  },
  diagnostics: {
    enabled: false
  },
  security: {
    maxLimit: 50,
    maxPerPage: 50,
    maxPage: 999,
    allowedResourceProtocols: ['http:', 'https:', 'magnet:', 'ed2k:', 'thunder:']
  },
  revalidateToken: '',
  astro: {
    mountPath: '/ddys',
    apiPrefix: '/api/ddys',
    pages: true,
    endpoints: true,
    seoRoutes: true,
    styles: true,
    middleware: true,
    contentLoader: true
  }
};

export function mergeDdysConfig(input: DdysConfigInput = {}): DdysConfig {
  const routePrefix = normalizeRoutePrefix(input.routePrefix ?? input.astro?.apiPrefix ?? DEFAULT_DDYS_CONFIG.routePrefix);
  const mountPath = normalizeRoutePrefix(input.astro?.mountPath ?? DEFAULT_DDYS_CONFIG.astro.mountPath);
  return {
    ...DEFAULT_DDYS_CONFIG,
    ...input,
    apiBaseUrl: normalizeBaseUrl(input.apiBaseUrl, DEFAULT_DDYS_CONFIG.apiBaseUrl),
    siteBaseUrl: normalizeBaseUrl(input.siteBaseUrl, DEFAULT_DDYS_CONFIG.siteBaseUrl),
    routePrefix,
    iconBasePath: normalizeRoutePrefix(input.iconBasePath ?? DEFAULT_DDYS_CONFIG.iconBasePath),
    cache: { ...DEFAULT_DDYS_CONFIG.cache, ...input.cache },
    proxy: { ...DEFAULT_DDYS_CONFIG.proxy, ...input.proxy },
    requestForm: { ...DEFAULT_DDYS_CONFIG.requestForm, ...input.requestForm },
    diagnostics: { ...DEFAULT_DDYS_CONFIG.diagnostics, ...input.diagnostics },
    security: { ...DEFAULT_DDYS_CONFIG.security, ...input.security },
    astro: {
      ...DEFAULT_DDYS_CONFIG.astro,
      ...input.astro,
      apiPrefix: routePrefix,
      mountPath
    }
  };
}

export function configFromEnv(input: DdysConfigInput = {}, env: DdysRuntimeEnv = runtimeEnv()): DdysConfig {
  const envConfig: DdysConfigInput = {
    apiBaseUrl: env.DDYS_API_BASE_URL,
    siteBaseUrl: env.DDYS_SITE_BASE_URL,
    apiKey: env.DDYS_API_KEY ?? '',
    revalidateToken: env.DDYS_REVALIDATE_TOKEN ?? '',
    timeout: intRange(env.DDYS_TIMEOUT, DEFAULT_DDYS_CONFIG.timeout, 1, 60),
    retryTimes: intRange(env.DDYS_RETRY_TIMES, DEFAULT_DDYS_CONFIG.retryTimes, 0, 5),
    retrySleep: intRange(env.DDYS_RETRY_SLEEP, DEFAULT_DDYS_CONFIG.retrySleep, 0, 3000),
    requestForm: {
      enabled: boolValue(env.DDYS_REQUEST_FORM_ENABLED),
      secret: env.DDYS_FORM_SECRET,
      csrf: env.DDYS_REQUEST_FORM_CSRF === undefined ? true : boolValue(env.DDYS_REQUEST_FORM_CSRF)
    },
    diagnostics: {
      enabled: boolValue(env.DDYS_DIAGNOSTICS_ENABLED)
    }
  };
  return mergeDdysConfig({
    ...envConfig,
    ...input,
    cache: { ...envConfig.cache, ...input.cache },
    proxy: { ...envConfig.proxy, ...input.proxy },
    requestForm: { ...envConfig.requestForm, ...input.requestForm },
    diagnostics: { ...envConfig.diagnostics, ...input.diagnostics },
    security: { ...envConfig.security, ...input.security },
    astro: { ...envConfig.astro, ...input.astro }
  });
}

export function publicDdysConfig(config: DdysConfig) {
  return {
    siteBaseUrl: config.siteBaseUrl,
    routePrefix: config.routePrefix,
    iconBasePath: config.iconBasePath,
    astro: config.astro,
    requestForm: {
      enabled: config.requestForm.enabled,
      honeypotField: config.requestForm.honeypotField
    },
    diagnostics: {
      enabled: config.diagnostics.enabled
    }
  };
}

export function safeDdysConfig(config: DdysConfig) {
  return {
    ...config,
    apiKey: config.apiKey ? 'configured' : 'not configured',
    revalidateToken: config.revalidateToken ? 'configured' : 'not configured',
    requestForm: {
      ...config.requestForm,
      secret: config.requestForm.secret ? 'configured' : 'not configured'
    }
  };
}

export function cleanRuntimeQuery(query: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of query.entries()) {
    if (!['route', 'slug', 'id', 'username', 'noCache'].includes(key)) out[key] = value;
  }
  return out;
}

function runtimeEnv(): DdysRuntimeEnv {
  const runtime = globalThis as typeof globalThis & { process?: { env?: DdysRuntimeEnv } };
  const meta = import.meta as ImportMeta & { env?: DdysRuntimeEnv };
  return meta.env || runtime.process?.env || {};
}
