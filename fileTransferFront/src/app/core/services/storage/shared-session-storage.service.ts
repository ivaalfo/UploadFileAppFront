// Based on https://stackoverflow.com/questions/20325763/browser-sessionstorage-share-between-tabs

import { Injectable, Inject } from '@angular/core';
import { LOCAL_STORAGE, SESSION_STORAGE } from './storage.providers';
import { SharedSessionStorageConfig, SHARED_SESSIONSTORAGE_CONFIG } from './shared-session-storage.config';
import { Logger } from '../log/logger.service';

const GET_SESSION_STORAGE = 'FT_GET_SESSION_STORAGE_V1';
const SHARED_SESSION_STORAGE_SET_PREFIX = 'FT_SHARED_SESSION_STORAGE_SET_PREFIX_V1_';
const SHARED_SESSION_STORAGE_REMOVE_PREFIX = 'FT_SHARED_SESSION_STORAGE_REMOVE_PREFIX_V1_';

@Injectable({
  providedIn: 'root'
})
export class SharedSessionStorage implements Storage {
  [name: string]: any;

  public constructor(
    private readonly logger: Logger,
    @Inject(SHARED_SESSIONSTORAGE_CONFIG) private config: SharedSessionStorageConfig,
    @Inject(SESSION_STORAGE) private sessionStorage: Storage = window.sessionStorage,
    @Inject(LOCAL_STORAGE) private localStorage: Storage = window.localStorage,
  ) {
    for (const key of this.config.allowedKeys) {
      Object.defineProperty(this, key, {
        get: () => this.getItem(key),
        set: (value: any) => this.setItem(key, value),
      });
    }
  }

  public get length(): number {
    return Object.keys(this).length;
  }

  public clear(): void {
    Object.keys(this).forEach(key => delete this[key]);
  }

  public getItem(key: string): string | null {
    return this.sessionStorage.getItem(key);
  }

  public key(index: number): string | null {
    return this.sessionStorage.key(index);
  }

  public removeItem(key: string): void {
    this.sessionStorage.removeItem(key);

    if (this.isAllowedKey(key)) {
      const prefixedKey = SHARED_SESSION_STORAGE_REMOVE_PREFIX + key;
      this.localStorage.setItem(prefixedKey, prefixedKey);
      setTimeout(() => this.localStorage.removeItem(prefixedKey), 0);
    }
  }

  public setItem(key: string, value: string): void {
    this.sessionStorage.setItem(key, value);

    if (this.isAllowedKey(key)) {
      const prefixedKey = SHARED_SESSION_STORAGE_SET_PREFIX + key;
      this.localStorage.setItem(prefixedKey, value);
      setTimeout(() => this.localStorage.removeItem(prefixedKey), 0);
    }
  }

  public onLocalStorageChanged(event: StorageEvent): void {
    if (!event || !event.newValue) {
      return;
    }

    if (event.key === GET_SESSION_STORAGE) { // another tab asked for the sessionStorage -> send it
      for (const key of this.config.allowedKeys) {
        const value = this.sessionStorage.getItem(key);
        if (value) {
          const prefixedKey = SHARED_SESSION_STORAGE_SET_PREFIX + key;
          localStorage.setItem(prefixedKey, value);
          setTimeout(() => localStorage.removeItem(prefixedKey), 0);
          this.logger.info(`[SharedSessionStorage] ${key} sent to other tabs`);
        }
      }
    } else if (event.key && event.key.indexOf(SHARED_SESSION_STORAGE_SET_PREFIX) === 0) { // another tab sent data <- get it
      const key = event.key.substr(SHARED_SESSION_STORAGE_SET_PREFIX.length);
      if (this.isAllowedKey(key)) {
        this.sessionStorage.setItem(key, event.newValue);
        this.logger.info(`[SharedSessionStorage] ${key} received from other tab`);
      }
    } else if (event.key && event.key.indexOf(SHARED_SESSION_STORAGE_REMOVE_PREFIX) === 0) { // another tab asked to remove <- remove it
      const key = event.key.substr(SHARED_SESSION_STORAGE_REMOVE_PREFIX.length);
      if (this.isAllowedKey(key)) {
        this.sessionStorage.removeItem(key);
        this.logger.info(`[SharedSessionStorage] ${key} removed asked from other tab`);
      }
    }
  }

  public askForAllStorageInfo(): void {
    localStorage.setItem(GET_SESSION_STORAGE, GET_SESSION_STORAGE);
    setTimeout(() => localStorage.removeItem(GET_SESSION_STORAGE), 0);
    this.logger.info(`[SharedSessionStorage] Asked for info to other tabs`);
  }

  private isAllowedKey(key: string): boolean {
    return this.config.allowedKeys.indexOf(key) >= 0;
  }
}
