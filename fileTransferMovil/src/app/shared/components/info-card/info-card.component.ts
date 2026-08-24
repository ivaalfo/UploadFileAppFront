import { Component, Input } from '@angular/core';
import { Info } from '../../../data/shared/info';
import { NavigationStateService } from '../../../services/navigation-state.service';

@Component({
  selector: 'm-info-card',
  templateUrl: './info-card.component.html',
  styleUrls: ['./info-card.component.scss']
})
export class InfoCardComponent  {

  @Input()
  public mainInfo = true;

  @Input()
  public infoDock = false;

  @Input()
  public qrButton = false;
  @Input()
  public data: Info = new Info();

  public showQr = false;
  public qrElementType = '';
  public qrValue = '';

  public constructor( protected navigationStateService: NavigationStateService) {}

  public QrGenerator(): void {
    this.showQr = true;
    this.qrElementType = 'img';
    this.qrValue = this.navigationStateService.getNavigationParams().number;
  }
}
