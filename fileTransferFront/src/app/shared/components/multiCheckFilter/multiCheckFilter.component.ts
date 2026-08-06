import {
  Component, Input, EventEmitter, Output,
  ViewChildren, QueryList, ElementRef, HostBinding,
} from '@angular/core';

export interface MultiCheckFilter {
  code: string;
  description: string;
}

@Component({
  selector: 'm-multicheckfilter',
  templateUrl: './multiCheckFilter.component.html',
  styleUrls: ['./multiCheckFilter.component.scss']
})
export class MultiCheckFilterComponent {

  @Input()
  public id!: string;

  @Input()
  public options!: MultiCheckFilter[];

  @Input()
  public selected!: string[];

  @Output()
  public selectedOptionsChanged = new EventEmitter<string[]>();

  @ViewChildren('checkboxes')
  public checkboxes!: QueryList<ElementRef<HTMLInputElement>>;

  @HostBinding('class')
  public get MultiselectClass() {
    return 'multicheckfilter';
  }

  public onCheckboxChanged(): void {
    const values = this.checkboxes
      .map(c => c.nativeElement)
      .filter(c => c.checked)
      .map(c => c.value);

    this.selectedOptionsChanged.emit(values);
  }
}
