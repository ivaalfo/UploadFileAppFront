import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'homeLinkLastWord'
})
export class HomeLinkLastWordPipe implements PipeTransform {
  public constructor(
    private sanitizer: DomSanitizer
  ) { }

  public transform(value: string): SafeHtml {
    /*const lastSpaceIndex = value.lastIndexOf(' ');
    if (lastSpaceIndex > -1) {
      value = value.slice(0, lastSpaceIndex) + ' ' + this.spanize(value.slice(lastSpaceIndex).trim());
      return this.sanitizer.bypassSecurityTrustHtml(value);
    }*/

    return this.sanitizer.bypassSecurityTrustHtml(this.spanize(value));
  }

  private spanize(value: string): string {
    return '<span class="home__link-last-word"><span class="home__link-last-word-inner">' + value + '</span></span>';
  }
}
