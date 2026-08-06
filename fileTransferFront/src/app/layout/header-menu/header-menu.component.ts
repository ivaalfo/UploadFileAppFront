import { Component, Input, HostListener } from '@angular/core';

@Component({
  selector: 'm-header-menu',
  templateUrl: './header-menu.component.html',
  styleUrls: ['./header-menu.component.scss']
})
export class HeaderMenuComponent {

  @Input()
  public iconSizeStyle!: string;

  @Input()
  public icon!: string;

  public isMenuShown = false;

  @HostListener('mouseenter')
  public onMouseEnter() {
    this.showMenu();
  }

  @HostListener('mouseleave')
  public onMouseLeave() {
    this.hideMenu();
  }

  public showMenu() {
    this.isMenuShown = true;
  }

  public hideMenu() {
    this.isMenuShown = false;
  }

}
