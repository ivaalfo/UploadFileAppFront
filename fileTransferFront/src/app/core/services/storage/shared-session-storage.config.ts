import { InjectionToken } from '@angular/core';

export interface SharedSessionStorageConfig {
  allowedKeys: string[];
}

export const SHARED_SESSIONSTORAGE_CONFIG = new InjectionToken<SharedSessionStorageConfig>('SharedSessionStorageConfig');
