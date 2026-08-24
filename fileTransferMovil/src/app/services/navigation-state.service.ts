import { Injectable } from '@angular/core';

const NAVIGATION_STATE_URL = 'NAVIGATION_STATE_URL';
const NAVIGATION_STATE_DATA = 'NAVIGATION_STATE_DATA';
const NAVIGATION_STATE_PARAMS = 'NAVIGATION_STATE_PARAMS';

@Injectable()
export class NavigationStateService {

  public saveNavigationStateUrl(url: string): void {
    localStorage.setItem(NAVIGATION_STATE_URL, url);
  }

  public getNavigationStateUrl(): string {
    return localStorage.getItem(NAVIGATION_STATE_URL);
  }

  public saveNavigationData(data: any): void {
    localStorage.setItem(NAVIGATION_STATE_DATA, JSON.stringify(data));
  }

  public saveNavigationParams(params: any): void {
    localStorage.setItem(NAVIGATION_STATE_PARAMS, JSON.stringify(params));
  }

  public getNavigationParams(): any {
    return JSON.parse(localStorage.getItem(NAVIGATION_STATE_PARAMS));
  }

  public getNavigationData<TData>(): TData {
    return JSON.parse(localStorage.getItem(NAVIGATION_STATE_DATA));
  }

  public removeNavigationState(): void {
    localStorage.removeItem(NAVIGATION_STATE_DATA);
    localStorage.removeItem(NAVIGATION_STATE_PARAMS);
  }

}
