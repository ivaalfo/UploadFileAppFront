import { Component, Input } from '@angular/core';

@Component({
  selector: 'm-detail-title',
  templateUrl: './detail-title.component.html',
  styleUrls: ['./detail-title.component.scss']
})
export class DetailTitleComponent {

  @Input()
  public title!: string;

  @Input()
  public name!: string;

  @Input()
  public icon!: string;

  @Input()
  public showWarningIcon!: boolean;

  @Input()
  public warningIcon!: string;

  @Input()
  public showLockIcon!: boolean;

  @Input()
  public blockIcon!: string;
}
