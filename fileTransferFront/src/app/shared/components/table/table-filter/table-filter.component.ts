import { Component, Input, HostBinding, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'm-table-filter',
  templateUrl: './table-filter.component.html',
  styleUrls: ['./table-filter.component.scss']
})
export class TableFilterComponent {
  @Input()
  public name!: string;

  @Input()
  public label!: string;

  @Input()
  public hasValue!: boolean;

  @Input()
  public icon!: string;

  @Output()
  public clear = new EventEmitter();

  @HostBinding('class')
  public get componentClass() {
    return 'table-filter__has-icon table-filter__has-icon--' + this.icon;
  }

  public clearClicked(): void {
    this.clear.emit();
  }
}
