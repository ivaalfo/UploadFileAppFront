import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Transport } from '../../../data/shared/transport';

export interface SelectOptions {
  value: string;
  label: string;
}

@Component({
  selector: 'm-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss']
})
export class SelectComponent {

  @Input()
  public options: Transport[];

  @Input()
  public placeholder: string;

  @Input()
  public selectedValue: string;

  @Output()
  public valueSelected: EventEmitter<Transport> = new EventEmitter<Transport>();

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
