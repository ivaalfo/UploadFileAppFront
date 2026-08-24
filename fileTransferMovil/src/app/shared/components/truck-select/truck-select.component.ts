import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Truck } from 'src/app/data/shared/truck';

@Component({
  selector: 'm-truck-select',
  templateUrl: './truck-select.component.html',
  styleUrls: ['./truck-select.component.scss']
})
export class TruckSelectComponent {

  @Input()
  public options: Truck[];

  @Input()
  public placeholder: string;

  @Input()
  public selectedValue: string;

  @Output()
  public valueSelected: EventEmitter<Truck> = new EventEmitter<Truck>();

  public onChange(value: string): void {
    const valueJ = JSON.parse(value);
    this.valueSelected.emit(valueJ);
  }

  public isSelected(value: string): boolean {
    return value === this.selectedValue;
  }

  public toStr(value: Transport) {
    return JSON.stringify(value);
  }

}
