import { Component, HostBinding, HostListener, ElementRef, Input, Output, EventEmitter } from '@angular/core';

export const ROW_HOVER_CLASS = 'row--hover';

@Component({
  selector: 'm-row',
  templateUrl: './row.component.html',
  styleUrls: ['./row.component.scss']
})
export class RowComponent {

  @Input()
  public isTotal = false;
  @Input()
  public isGoingToExpired = false;
  @Input()
  public isAddFilesRow = false;
  @Input()
  public isSelectedRow = false;
  @Input()
  public isMessageRow = false;
  @Input()
  public isGrupRow = false;
  @Input()
  public isSelectedGrup = false;
  @Input()
  public isNoAplicaRow = false;
  @Input()
  public isNoAplicaSelectedRow = false;
  @Input()
  public isDisabledRow = false;
  @Input()
  public isDisabledSelectedRow = false;
  @Input()
  public isDisabledComentsRow = false;


  @Input()
  public key!: string | number;

  @Output()
  public doubleClickEvent = new EventEmitter();

  @HostBinding('class')
  public get RowClass() {
    return 'row';
  }

  @HostBinding('class.row--total')
  public get RowTotalClass(): boolean {
    return this.isTotal;
  }

  @HostBinding('class.row--expiredDate')
  public get RowExpiredDateClass(): boolean {
    return this.isGoingToExpired;
  }

  @HostBinding('class.row--addFiles')
  public get RowAddFilesClass(): boolean {
    return this.isAddFilesRow;
  }

  @HostBinding('class.row--selected')
  public get RowSelectedClass(): boolean {
    return this.isSelectedRow;
  }

  @HostBinding('class.row--isMessage')
  public get RowMessageClass(): boolean {
    return this.isMessageRow;
  }

  @HostBinding('class.row--isGrup')
  public get RowGrupClass(): boolean {
    return this.isGrupRow;
  }

  @HostBinding('class.row--isSelectedGrup')
  public get RowSelectedGrupClass(): boolean {
    return this.isSelectedGrup;
  }

  @HostBinding('class.row--isNoAplicaRow')
  public get RowNoAplicaClass(): boolean {
    return this.isNoAplicaRow;
  }

  @HostBinding('class.row--isNoAplicaSelectedRow')
  public get RowNoAplicaSelectedClass(): boolean {
    return this.isNoAplicaSelectedRow;
  }

  @HostBinding('class.row--isDisabledRow')
  public get RowDisabledClass(): boolean {
    return this.isDisabledRow;
  }

  @HostBinding('class.row--isDisabledSelectedRow')
  public get RowDisabledSelectedClass(): boolean {
    return this.isDisabledSelectedRow;
  }

  @HostBinding('class.row--isDisabledComentsRow')
  public get RowDisabledComentsClass(): boolean {
    return this.isDisabledComentsRow;
  }
  

  public constructor(
    public element: ElementRef
  ) { }

  @HostListener('mouseenter')
  public onMouseEnter() {
    this.element.nativeElement.classList.add(ROW_HOVER_CLASS);
  }

  @HostListener('mouseleave')
  public onMouseOut() {
    this.element.nativeElement.classList.remove(ROW_HOVER_CLASS);
  }

  @HostListener('dblclick')
  public onDoubleClick(): void {
    this.doubleClickEvent.emit();
  }

}
