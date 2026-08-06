import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  public readonly apiBaseUrl: string;
  public readonly authBaseUrl: string;
  public readonly debug: boolean;

  public constructor() {
    const browserWindow = window || {};
    if (browserWindow.__ftConfig === undefined) {
      const error = 'ERROR: Ensure configuration is defined';
      throw Error(error);
    }
    this.apiBaseUrl = browserWindow.__ftConfig.apiBaseUrl;
    this.authBaseUrl = browserWindow.__ftConfig.authBaseUrl;
    this.debug = browserWindow.__ftConfig.debug;
    
  }
}
