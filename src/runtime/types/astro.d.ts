import type { DdysClient } from '../client/client';

declare global {
  namespace App {
    interface Locals {
      ddys: DdysClient;
    }
  }
}

export {};
