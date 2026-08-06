import { Injectable, Inject } from '@angular/core';
import { LoginResponse } from './login.response';
import { LOCAL_STORAGE } from '@core/services/storage/storage.providers';
import { SharedSessionStorage } from '@core/services/storage/shared-session-storage.service';

export const FT_LOGIN_DATA_KEY = 'FT_LOGIN_DATA_V1';

@Injectable({
  providedIn: 'root',
})
export class AuthStorageService {
  public constructor(
    private sessionStorage: SharedSessionStorage,
    @Inject(LOCAL_STORAGE) private localStorage: Storage
  ) {}

  public saveData(response: LoginResponse, remember: boolean): void {
    this.save(response, remember);
  }

  public getData(): LoginResponse | undefined {
    let data = this.localStorage.getItem(FT_LOGIN_DATA_KEY);
    if (!data) {
      data = this.sessionStorage.getItem(FT_LOGIN_DATA_KEY);
    }

    if (data) {
      return JSON.parse(data) as LoginResponse;
    }

    return;
  }

  public removeData(): void {
    this.sessionStorage.removeItem(FT_LOGIN_DATA_KEY);
    this.localStorage.removeItem(FT_LOGIN_DATA_KEY);
    this.localStorage.clear();
  }

  public updateData(response: LoginResponse): boolean {
    let isLocalStorage = true;
    let data = this.localStorage.getItem(FT_LOGIN_DATA_KEY);
    if (!data) {
      isLocalStorage = false;
      data = this.sessionStorage.getItem(FT_LOGIN_DATA_KEY);
    }

    if (data) {
      this.save(response, isLocalStorage);
      return true;
    }

    return false;
  }

  private save(response: LoginResponse, isLocalStorage: boolean): void {
    const serializedResponse = JSON.stringify(response);
    if (isLocalStorage) {
      this.sessionStorage.removeItem(FT_LOGIN_DATA_KEY);
      this.localStorage.setItem(FT_LOGIN_DATA_KEY, serializedResponse);
    } else {
      this.localStorage.removeItem(FT_LOGIN_DATA_KEY);
      this.sessionStorage.setItem(FT_LOGIN_DATA_KEY, serializedResponse);
    }
  }
}
