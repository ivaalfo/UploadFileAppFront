import { Component, HostListener, Input } from '@angular/core';

@Component({
  selector: 'm-header-submenu-gestion-pedidos',
  templateUrl: './header-submenu-gestion-pedidos.component.html',
  styleUrls: ['./header-submenu-gestion-pedidos.component.scss']
})
export class SubHeaderMenuComponentGestionPedidos {

  @Input()
  public iconSizeStyle!: string;

  @Input()
  public icon!: string;

  public isSubMenuShown = false;

  @HostListener('mouseenter')
  public onMouseEnter() {
    this.showSubMenu();
  }

  @HostListener('mouseleave')
  public onMouseLeave() {
    this.hideSubMenu();
  }

  public showSubMenu() {
    this.isSubMenuShown = true;
  }

  public hideSubMenu() {
    this.isSubMenuShown = false;
  }

}
