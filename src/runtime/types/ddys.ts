export type DdysPrimitive = string | number | boolean | null | undefined;

export type DdysQuery = Record<string, DdysPrimitive | DdysPrimitive[]>;

export interface DdysApiResponse<T = unknown> {
  success?: boolean;
  code?: number;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DdysPaginated<T = unknown> {
  data: T[];
  meta: Record<string, unknown>;
}

export interface DdysMovie {
  id?: string | number;
  slug?: string;
  title?: string;
  name?: string;
  poster?: string;
  cover?: string;
  year?: string | number;
  type?: string;
  genre?: string;
  region?: string;
  description?: string;
  summary?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface DdysSource {
  name?: string;
  label?: string;
  url?: string;
  type?: string;
  [key: string]: unknown;
}

export interface DdysRequestInput {
  title: string;
  year?: string | number;
  type?: string;
  doubanId?: string;
  imdbId?: string;
  note?: string;
  contact?: string;
  token?: string;
  honeypot?: string;
  [key: string]: unknown;
}
