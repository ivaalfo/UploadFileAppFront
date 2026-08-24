import { Component, Input } from '@angular/core';

export enum LegendSize {
  Small = 'small',
  Small2 = 'small2',
  Regular = 'regular'
}

@Component({
  selector: 'm-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.scss']
})
export class LegendComponent {

  @Input()
  public size: LegendSize = LegendSize.Regular;

  public getClass(): string {
    let classList = '';
    if (this.size === LegendSize.Small ) {
       classList = 'legend legend--small';
    } else if (this.size === LegendSize.Small2 ) {
      classList = 'legend legend--small2';
    } else {
        classList = 'legend';
    }
    return classList;
  }
}
