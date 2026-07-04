import type { APIContext } from 'astro';
import { DdysClient } from '../client/client';
import type { DdysConfigInput } from '../config';
import { getDdysConfig } from './config';

export function createDdysServerClient(context?: APIContext | DdysConfigInput, input?: DdysConfigInput): DdysClient {
  const configInput = isApiContext(context) ? input : context;
  return new DdysClient(getDdysConfig(configInput), fetch);
}

function isApiContext(value: unknown): value is APIContext {
  return Boolean(value && typeof value === 'object' && 'request' in value && 'url' in value);
}
