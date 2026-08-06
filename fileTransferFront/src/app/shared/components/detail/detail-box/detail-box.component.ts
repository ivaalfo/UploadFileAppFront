import { Component, Input } from '@angular/core';

@Component({
  selector: 'm-detail-box',
  templateUrl: './detail-box.component.html',
  styleUrls: ['./detail-box.component.scss']
})
export class DetailBoxComponent {

  @Input()
  public title!: string;

  @Input()
  public icon!: string;

}
