// Based on https://github.com/devfans/digest-fetch
// Modifications needed because it doesn't work fine

import * as cryptojs from 'crypto-js';
import * as base64 from 'base-64';

const supportedAlgorithms = ['MD5', 'MD5-sess'];

const parse = (raw: string, field: string): string | undefined => {
  const regex = new RegExp(`${field}=("[^"]*"|[^,]*)`, 'i');
  const match = regex.exec(raw);
  if (match) {
    return match[1].trim().replace(/["]/g, '');
  }

  return;
};

const computeHash = (user: string, realm: string, password: string) => {
  return cryptojs.MD5(`${user}:${realm}:${password}`).toString();
};

export interface DigestClientOptions {
  algorithm?: 'MD5' | 'MD5-sess';
  logger?: Console;
  precomputedHash?: string;
  cnonceSize?: number | string;
  statusCode?: number;
  basic?: boolean;
}

interface Digest {
  algorithm: 'MD5' | 'MD5-sess';
  realm: string;
  nc: number;
  scheme?: string;
  qop?: string;
  opaque?: string;
  nonce?: string;
  cnonce?: string;
}

export class DigestClient {
  private nonceRaw = 'abcdef0123456789';
  private logger?: Console;
  private precomputedHash?: string;
  private digest: Digest;
  private hasAuth = false;
  private cnonceSize = 32;
  private statusCode: number;
  private basic: boolean;

  public constructor(
    private readonly user: string,
    private readonly password: string,
    options: DigestClientOptions = {}
  ) {

    this.logger = options.logger;
    this.precomputedHash = options.precomputedHash;

    let algorithm = options.algorithm || 'MD5';
    if (!supportedAlgorithms.includes(algorithm)) {
      if (this.logger) {
        this.logger.warn(`Unsupported algorithm ${algorithm}, will try with MD5`);
      }
      algorithm = 'MD5';
    }

    this.digest = { nc: 0, algorithm, realm: '' };

    if (options.cnonceSize) {
      const cnonceSize = parseInt(options.cnonceSize + '', 10);
      this.cnonceSize = isNaN(cnonceSize) ? 32 : cnonceSize;
    }

    // Custom authentication failure code for avoiding browser prompt:
    // https://stackoverflow.com/questions/9859627/how-to-prevent-browser-to-invoke-basic-auth-popup-and-handle-401-error-using-jqu
    this.statusCode = options.statusCode || 401;
    this.basic = options.basic || false;
  }

  public async fetch(url: string, options: RequestInit = {}) {
    if (this.basic) {
      return fetch(url, this.addBasicAuth(options));
    }

    const resp = await fetch(url, this.addAuth(url, options));
    if (resp.status === this.statusCode) {
      this.hasAuth = false;
      this.parseAuth(resp.headers.get('www-authenticate'));
      if (this.hasAuth) {
        const respFinal = await fetch(url, this.addAuth(url, options));
        if (respFinal.status === this.statusCode) {
          this.hasAuth = false;
        } else {
          this.digest.nc++;
        }
        return respFinal;
      }
    } else {
      this.digest.nc++;
    }

    return resp;
  }

  public addBasicAuth(options: RequestInit = {}) {
    const auth = 'Basic ' + base64.encode(this.user + ':' + this.password);
    options.headers = options.headers || {};

    this.setAuthorizationHeader(options, auth);

    if (this.logger) {
      this.logger.debug(options);
    }

    return options;
  }

  private addAuth(url: string, options: RequestInit) {
    if (!this.hasAuth) {
      return options;
    }

    if (this.logger) {
      this.logger.info(`requesting with auth carried`);
    }

    const transformedUrl = url.replace('//', '');
    const uri = transformedUrl.indexOf('/') === -1 ? '/' : transformedUrl.slice(transformedUrl.indexOf('/'));
    const method = options.method ? options.method.toUpperCase() : 'GET';

    let ha1 = this.precomputedHash ? this.password : computeHash(this.user, this.digest.realm, this.password);
    if (this.digest.algorithm === 'MD5-sess') {
      ha1 = cryptojs.MD5(`${ha1}:${this.digest.nonce}:${this.digest.cnonce}`).toString();
    }

    if (this.digest.qop === 'auth-int' && this.logger) {
      this.logger.warn('Sorry, auth-int is not implemented in this plugin');
    }
    const ha2 = cryptojs.MD5(`${method}:${uri}`).toString();
    const ncString = ('00000000' + this.digest.nc).slice(-8);

    let rawResponse = `${ha1}:${this.digest.nonce}:${ncString}:${this.digest.cnonce}:${this.digest.qop}:${ha2}`;
    if (!this.digest.qop) {
      rawResponse = `${ha1}:${this.digest.nonce}:${ha2}`;
    }
    const response = cryptojs.MD5(rawResponse).toString();

    const opaqueString = this.digest.opaque !== null ? `opaque="${this.digest.opaque}",` : '';
    const qopString = this.digest.qop ? `qop="${this.digest.qop}",` : '';
    const digest = `${this.digest.scheme} username="${this.user}",realm="${this.digest.realm}",\
nonce="${this.digest.nonce}",uri="${uri}",${opaqueString}${qopString}\
algorithm="${this.digest.algorithm}",response="${response}",nc=${ncString},cnonce="${this.digest.cnonce}"`;
    options.headers = options.headers || {};
    this.setAuthorizationHeader(options, digest);
    if (this.logger) {
      this.logger.debug(options);
    }

    return options;
  }

  private parseAuth(authorizationHeader: string | null) {
    if (!authorizationHeader || authorizationHeader.length < 5) {
      this.hasAuth = false;
      return;
    }

    this.hasAuth = true;
    this.digest.scheme = authorizationHeader.split(/\s/)[0];
    this.digest.realm = parse(authorizationHeader, 'realm') || '';
    this.digest.qop = this.parseQop(authorizationHeader);
    this.digest.opaque = parse(authorizationHeader, 'opaque');
    this.digest.nonce = parse(authorizationHeader, 'nonce') || '';
    this.digest.cnonce = this.makeNonce();
    this.digest.nc++;
  }

  private parseQop(rawAuth: string) {
    // Following https://en.wikipedia.org/wiki/Digest_access_authentication
    // to parse valid qop
    // Samples
    // : qop="auth,auth-init",realm=
    // : qop=auth,realm=
    const qop = parse(rawAuth, 'qop');

    if (qop !== undefined) {
      const qops = qop.split(',');
      if (qops.includes('auth')) {
        return 'auth';
      } else if (qops.includes('auth-int')) {
        return 'auth-int';
      }
    }
    // when not specified
    return;
  }

  private makeNonce() {
    let uid = '';
    for (let i = 0; i < this.cnonceSize; ++i) {
      uid += this.nonceRaw[Math.floor(Math.random() * this.nonceRaw.length)];
    }

    return uid;
  }

  private setAuthorizationHeader(options: RequestInit, auth: string) {
    if (options.headers instanceof Headers) {
      options.headers.set('Authorization', auth);
    } else if (options.headers instanceof Array) {
      options.headers.push(['Authorization', auth]);
    } else if (options.headers) {
      options.headers.Authorization = auth;
    }
  }
}
