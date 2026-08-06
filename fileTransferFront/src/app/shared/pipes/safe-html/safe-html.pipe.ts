import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml'
})
export class SafeHtmlPipe implements PipeTransform {
  public constructor(
    private sanitizer: DomSanitizer
  ) { }

  public transform(value: any): any {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}
