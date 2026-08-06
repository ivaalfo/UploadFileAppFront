declare interface Window {
  __ftConfig?: MarticoConfig;
  DigestFetch: any;
}

declare interface MarticoConfig {
  apiBaseUrl: string;
  authBaseUrl: string;
  debug: boolean;
}

declare module 'digest-auth-request';
