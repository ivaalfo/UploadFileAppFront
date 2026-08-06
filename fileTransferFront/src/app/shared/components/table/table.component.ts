import {
  Component, Input, ElementRef, OnInit, OnDestroy,
  Output, EventEmitter, OnChanges, SimpleChanges
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { TableScroll } from './table-scroll';
import { TableHeader } from './table-header';
import { SortablejsOptions } from 'ngx-sortablejs';
import { buildTableSortOptions } from './table-sort-options';
import { RowComponent } from '@shared/components/table/row/row.component';

@Component({
  selector: 'm-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit, OnDestroy, OnChanges {

  @Input()
  public hasCheckableColumn = false;

  @Input()
  public canSortRows = false;

  @Input()
  public showRowBorder = false;

  @Input()
  public sortItems!: any[];

  @Input()
  public canCheckMultipleColumns = false;

  @Input()
  public headers: TableHeader[] = [];

  @Input()
  public scroller$: Observable<TableScroll> | undefined;

  @Input()
  public allChecked = false;

  @Output()
  public checked = new EventEmitter<boolean>();

  @Output()
  public itemsSorted = new EventEmitter<void>();

  @Output()
  public columnSorted = new EventEmitter<{ column: TableHeader, directionSort: string }>();

  @Input()
  public disabledMultipleCheck = false;

  public sortOptions: SortablejsOptions = buildTableSortOptions(() => this.itemsSorted.emit());

  public selectedIndex!: number;

  private scrollSubscription: Subscription | undefined;
  private interval!: any;

  public constructor(
    private element: ElementRef
  ) { }

  public ngOnInit(): void {
    if (this.scroller$) {
      this.scrollSubscription = this.scroller$.subscribe(s => this.scrollTable(s));
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.canSortRows) {
      this.sortOptions = { ...this.sortOptions, disabled: !this.canSortRows };
    }
  }

  public ngOnDestroy(): void {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  public select(index: number) {
    this.selectedIndex = index;
  }

  public onCheckboxChanged(event: UIEvent): void {
    const checkBox = event.target as HTMLInputElement;
    this.checked.emit(checkBox.checked);
  }

  private scrollTable(scroll: TableScroll) {
    if (scroll === 'top') {
      this.goToStart();
    } else if (scroll === 'bottom') {
      this.goToEnd();
    } else {
      this.scrollToRow(scroll);
    }
  }

  private goToStart(): void {
    this.scrollTop(0);
  }

  private goToEnd(): void {
    this.scrollTop(this.element.nativeElement.scrollHeight);
  }

  private scrollTop(top: number): void {
    this.element.nativeElement.scrollTop = top;
  }

  private scrollToRow(row: RowComponent) {

    this.scrollTop(row.element.nativeElement.offsetTop - row.element.nativeElement.offsetHeight);
    row.element.nativeElement.classList.add('row--scroll');
    this.interval = setInterval(() => {
      row.element.nativeElement.classList.remove('row--scroll');
    }, 2500);
  }

  public sortedColumn(event: any): void {
    this.columnSorted.emit({ column: event.key, directionSort: event.sortDirection });
  }
}
