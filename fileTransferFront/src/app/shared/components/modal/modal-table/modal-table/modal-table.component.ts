import { Component, Input, EventEmitter, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { ModalAction } from '@shared/components/modal/modal-action';

@Component({
  selector: 'm-modal-table',
  templateUrl: './modal-table.component.html',
  styleUrls: ['../../modal-form/modal-form.component.scss']
})
export class ModalTableComponent {

  @Input()
  public header!: string;

  @Input()
  public data!: string[];

  @Input()
  public icon!: string;

  @Input()
  public opener$!: Subject<ModalAction>;

  @Input()
  public canBeClosed = true;

  @Output()
  public canceled = new EventEmitter();

  @Output()
  public accepted = new EventEmitter();

  public submit(): void {
    this.accepted.emit();
  }

  public cancel(): void {
    this.opener$.next(ModalAction.Close);
    this.canceled.emit();
  }

}
