import {
  Component, Input, ContentChildren, QueryList,
  ElementRef, ViewChildren, ViewChild, AfterViewInit, EventEmitter, Output
} from '@angular/core';
import { TableHeader } from '@shared/components/table/table-header';
import { ColumnTablesRowComponent } from '@shared/components/table/column-tables-row/column-tables-row.component';
import { chunk } from '@shared/utils/array-utils';
import { TableComponent } from '@shared/components/table/table.component';
import { getScrollbarSize } from './column-tables-scrollbar-size';

const HORIZONTAL_SCROLL_SPEED = 40;
const ROW_HEIGHT = 26;

@Component({
  selector: 'm-column-tables',
  templateUrl: './column-tables.component.html',
  styleUrls: ['./column-tables.component.scss']
})
export class ColumnTablesComponent implements AfterViewInit {

  @Input()
  public headers: TableHeader[] = [];

  @Input()
  public showRowBorder = false;

  @Input()
  public max3columns = false;

  @Input()
  public widthColum = 20;

  @Input()
  public hasCheckableInitColumn = true;

  @Input()
  public hasCheckableEndColumn = true;

  @Input()
  public allFirstColumnChecked = false;

  @Input()
  public allLastColumnChecked = false;

  @Input()
  public canCheckMultipleInitColumns = true;

  @Input()
  public canCheckMultipleEndColumns = true;

  @Output()
  public firstColumnChecked = new EventEmitter<boolean>();

  @Output()
  public lastColumnChecked = new EventEmitter<boolean>();

  @ContentChildren(ColumnTablesRowComponent)
  public originalRows !: QueryList<ColumnTablesRowComponent>;

  @ViewChildren(TableComponent)
  public tables !: QueryList<TableComponent>;

  @ViewChild('container', { static: false })
  public container!: ElementRef;

  public tablesRows !: ColumnTablesRowComponent[][];

  public constructor(
    private element: ElementRef
  ) { }

  public ngAfterViewInit(): void {
    this.originalRows.changes.subscribe(() => {
      this.calculateTables();
    });
  }

  public onResized(): void {
    this.calculateTables();
  }

  public onWheel(event: WheelEvent): void {
    this.container.nativeElement.scrollLeft += HORIZONTAL_SCROLL_SPEED * (event.deltaY > 0 ? 1 : -1);
    event.preventDefault();
  }

  private calculateTables(): void {

    this.element.nativeElement.style.setProperty('--row-height', ROW_HEIGHT + 'px');

    const rowsPerTable = Math.floor((this.element.nativeElement.clientHeight - getScrollbarSize()) / ROW_HEIGHT) - 1; // -1 for the header
    const tablesNeeded = Math.ceil(this.originalRows.length / rowsPerTable);
    const percent = ((this.widthColum / 100) * 100) + '%';

    this.element.nativeElement.style.setProperty('--num-tables', tablesNeeded);
    this.element.nativeElement.style.setProperty('--percent', percent);

    if (!this.tables || this.tables.length !== tablesNeeded) {
      this.tablesRows = chunk(this.originalRows.toArray(), rowsPerTable);
    }
  }

  public onFirstColumnCheckboxChanged(isChecked: boolean): void {
    this.firstColumnChecked.emit(isChecked);
  }

  public onLastColumnCheckboxChanged(isChecked: boolean): void {
    this.lastColumnChecked.emit(isChecked);
  }
}
