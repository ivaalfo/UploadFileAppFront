import { Injectable } from '@angular/core';
import { ConfigurationService } from '../configuration/configuration.service';

export abstract class Logger {
  public abstract log(message: string, ...optionalParams: any[]): void;
  public abstract info(message: string, ...optionalParams: any[]): void;
  public abstract warn(message: string, ...optionalParams: any[]): void;
  public abstract error(message: string, ...optionalParams: any[]): void;
}

@Injectable({
  providedIn: 'root'
})
export class ConsoleLogger extends Logger {
  private readonly console: Console;

  public constructor(
    private readonly configuration: ConfigurationService
  ) {
    super();
    this.console = console;
  }

  public log(message: string, ...optionalParams: any[]): void {
    if (this.configuration.debug) {
      this.console.log(this.prefixMessage(message), ...optionalParams);
    }
  }

  public info(message: string, ...optionalParams: any[]): void {
    if (this.configuration.debug) {
      this.console.info(this.prefixMessage(message), ...optionalParams);
    }
  }

  public error(message: string, ...optionalParams: any[]): void {
    if (this.configuration.debug) {
      this.console.error(this.prefixMessage(message), ...optionalParams);
    }
  }

  public warn(message: string, ...optionalParams: any[]): void {
    if (this.configuration.debug) {
      this.console.warn(this.prefixMessage(message), ...optionalParams);
    }
  }

  private prefixMessage(message: string): string {
    return '[ZAM] ' + message;
  }
}
