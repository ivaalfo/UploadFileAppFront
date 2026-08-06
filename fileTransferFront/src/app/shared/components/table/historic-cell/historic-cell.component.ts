import { Component, HostBinding, Input, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'm-historic-cell',
  templateUrl: './historic-cell.component.html',
  styleUrls: ['./historic-cell.component.scss']
})
export class HistoricCellComponent {

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
  public showTooltip = false;

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

}
