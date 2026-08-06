import {
  Component, Input,
  EventEmitter,
  Output
} from '@angular/core';
import { TableHeader } from './table-header';

@Component({
  selector: 'm-table-horizontal-scroll',
  templateUrl: './table-horizontal-scroll.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableHorizontalScrollComponent {

  @Input()
  public hasCheckableInitColumn = false;

  @Input()
  public hasCheckableEndColumn = false;

  @Input()
  public canSortRows = false;

  @Input()
  public showRowBorder = false;

  @Input()
  public name!: string;

  @Input()
  public canCheckMultipleInitColumns = false;

  @Input()
  public canCheckMultipleEndColumns = false;

  @Input()
  public headers: TableHeader[] = [];

  @Input()
  public allFirstColumnChecked = false;

  @Input()
  public allLastColumnChecked = false;

  @Output()
  public firstColumnChecked = new EventEmitter<boolean>();

  @Output()
  public lastColumnChecked = new EventEmitter<boolean>();

  public onInitColumnCheckboxChanged(event: UIEvent): void {
    const checkBox = event.target as HTMLInputElement;
    this.firstColumnChecked.emit(checkBox.checked);
  }

  public onEndColumnCheckboxChanged(event: UIEvent): void {
    const checkBox = event.target as HTMLInputElement;
    this.lastColumnChecked.emit(checkBox.checked);
  }
}
