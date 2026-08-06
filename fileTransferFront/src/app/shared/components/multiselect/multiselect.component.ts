import {
  Component, HostListener, Input, EventEmitter, Output,
  ViewChildren, QueryList, ElementRef, HostBinding, forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface MultiselectOption  {
  code: string;
  description: string;
}

@Component({
  selector: 'm-multiselect',
  templateUrl: './multiselect.component.html',
  styleUrls: ['./multiselect.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiselectComponent),
      multi: true
    }
  ]
})
export class MultiselectComponent  implements ControlValueAccessor {

  @Input()
  public id!: string;

  @Input()
  public placeholder!: string;

  @Input()
  public options!: MultiselectOption[];

  @Input()
  public selected!: string[];

  @Output()
  public selectedOptionsChanged = new EventEmitter<string[]>();

  @Input()
  public disabled!: boolean;

  public popupShown = false;
  private wasInside = false;

  @ViewChildren('checkboxes')
  public checkboxes!: QueryList<ElementRef<HTMLInputElement>>;

  @HostBinding('class')
  public get MultiselectClass() {
    return 'multiselect';
  }

  @HostListener('window:keyup.esc')
  public onKeyUp() {
    this.popupShown = false;
  }

  @HostListener('click')
  public clickInside() {
    this.popupShown = true;
    this.wasInside = true;
    const values = this.checkboxes
        .map(c => c.nativeElement)
        .filter(c => c.checked)
        .map(c => c.value);

    this.selectedOptionsChanged.emit(values);
  }
  
  @HostListener('window:click')
  public clickout() {
    if (!this.wasInside) {
      this.popupShown = false;
    }
    this.wasInside = false;
  }

  public get selectedValue(): string {
    return this.selected.join(', ');
  }

  public tooglePopup(): void {
    this.popupShown = !this.popupShown;
  }

  public onCheckboxChanged(): void {
      /*const values = this.checkboxes
        .map(c => c.nativeElement)
        .filter(c => c.checked)
        .map(c => c.value);

      this.selectedOptionsChanged.emit(values);*/
  }

  public onStoresChange(values: string[]): void {
    this.selectedOptionsChanged.emit(values);
  }

  public onChange = (_: any) => { };
  public onTouch = () => { };

  public writeValue(value: any): void {
    if (value) {
      this.selected = value || '';
    }
  }
  public registerOnChange(fn: any): void {
    this.onChange = fn;
   }
  public registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }
  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
