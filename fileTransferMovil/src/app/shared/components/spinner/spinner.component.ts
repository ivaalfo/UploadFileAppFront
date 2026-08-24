import { Component, Input } from '@angular/core';

@Component({
  selector: 'm-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss']
})
export class SpinnerComponent {
  @Input()
  public color!: 'white' | 'blue';

  public get colorClass(): string {
    return this.color === 'blue' ? 'spinner--blue' : '';
  }
}
