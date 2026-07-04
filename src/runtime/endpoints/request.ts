import type { APIContext } from 'astro';
import { ddysAstroOptions } from 'virtual:ddys-astro/config';
import { endpointConfig } from '../server/config';
import { createRequestFormToken, submitDdysRequest } from '../server/request-service';
import { errorJson, json } from '../server/response';
import { formDataToObject } from '../utils/security';

export const prerender = false;

export async function GET(context: APIContext) {
  try {
    const config = endpointConfig(ddysAstroOptions);
    return json({
      success: true,
      enabled: config.requestForm.enabled,
      honeypotField: config.requestForm.honeypotField,
      token: await createRequestFormToken(config, identityFromContext(context))
    });
  } catch (error) {
    return errorJson(error);
  }
}

export async function POST(context: APIContext) {
  try {
    const raw = await formDataToObject(context.request);
    const config = endpointConfig(ddysAstroOptions);
    const payload = await submitDdysRequest(config, raw, {
      identity: identityFromContext(context),
      request: context.request
    });
    return json({ success: true, data: payload });
  } catch (error) {
    return errorJson(error);
  }
}

function identityFromContext(context: APIContext) {
  return context.clientAddress || context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
}
