import { configFromEnv, type DdysConfigInput, type DdysConfig } from '../config';

let overrideOptions: DdysConfigInput = {};

export function setDdysAstroOptions(options: DdysConfigInput = {}) {
  overrideOptions = options;
}

export function getDdysConfig(input: DdysConfigInput = {}): DdysConfig {
  return configFromEnv({
    ...overrideOptions,
    ...input,
    cache: { ...overrideOptions.cache, ...input.cache },
    proxy: { ...overrideOptions.proxy, ...input.proxy },
    requestForm: { ...overrideOptions.requestForm, ...input.requestForm },
    diagnostics: { ...overrideOptions.diagnostics, ...input.diagnostics },
    security: { ...overrideOptions.security, ...input.security },
    astro: { ...overrideOptions.astro, ...input.astro }
  });
}

export function endpointConfig(options?: DdysConfigInput): DdysConfig {
  return getDdysConfig(options);
}
