import type { DdysConfigInput } from '../config';

declare module 'virtual:ddys-astro/config' {
  export const ddysAstroOptions: DdysConfigInput;
}
