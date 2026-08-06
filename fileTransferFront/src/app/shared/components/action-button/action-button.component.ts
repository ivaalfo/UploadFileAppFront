import { Component, Input } from '@angular/core';

@Component({
  selector: 'm-action-button',
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.scss']
})
export class ActionButtonComponent {

  @Input()
  public typeSubmit!: false;

  @Input()
  public icon!: string;

  @Input()
  public rightIcon = false;

  @Input()
  public iconSize!: number;

  @Input()
  public disabled = false;

  @Input()
  public inverted = false;

}
