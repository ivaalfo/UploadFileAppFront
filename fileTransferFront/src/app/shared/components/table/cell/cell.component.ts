import { Component, Input, HostBinding, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'm-cell',
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.scss']
})
export class CellComponent {

  @Input()
  public isHeader = false;

  @Input()
  public isNarrow = false;

  @Input()
  public highlight = false;

  @Input()
  public isMultiline = false;

  @Input()
  public tooltip = '';

  @Input()
  public isSortable = false;

  @Input()
  public isActive = false;

  @Input()
  public name = '';

  @Output()
  public sort = new EventEmitter<{key: string, sortDirection: string}>();

  public showTooltip = false;
  public sortDirection!: string;

  @ViewChild('content', { read: ElementRef, static: true })
  private content!: ElementRef;

  @HostBinding('class.cell__header')
  public get cellHeaderClass(): boolean {
    return this.isHeader;
  }

  @HostBinding('class.cell__narrow')
  public get cellNarrowClass(): boolean {
    return this.isNarrow;
  }

  @HostBinding('class.cell__highlight')
  public get cellHighlightClass(): boolean {
    return this.highlight;
  }

  @HostBinding('class.cell__multiline')
  public get cellMultilineClass(): boolean {
    return this.isMultiline;
  }

  @HostBinding('class.cell__header__sortable')
  public get cellSortableClass(): boolean {
    return this.isSortable;
  }

  @HostBinding('class.cell__sortable-asc')
  public get cellSortableAscClass(): boolean {
    return this.sortDirection === 'asc';
  }

  @HostBinding('class.cell__sortable-desc')
  public get cellSortableDescClass(): boolean {
    return this.sortDirection === 'desc';
  }

  public get originalInnerText(): string {
    return this.content.nativeElement.innerText;
  }

  public get hasToolTip(): boolean {
    return this.showTooltip;
  }

  public checkForToolTip(e: MouseEvent): void {
    if (this.isMultiline) {
      return;
    }

    const element = e.target as HTMLElement;
    this.showTooltip = element.offsetWidth < element.scrollWidth || (!!this.tooltip);
  }

  public hideToolTip(): void {
    this.showTooltip = false;
  }

  public onSortedColumn(): void {
    if ( this.isHeader && this.isSortable) {
      this.sortDirection = (this.sortDirection === 'desc' || !this.sortDirection) ? 'asc' : 'desc';
      this.sort.emit({key: this.name, sortDirection: this.sortDirection});
    }
  }
}
