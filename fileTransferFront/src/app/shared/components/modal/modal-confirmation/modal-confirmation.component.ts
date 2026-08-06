import { Component, Input, EventEmitter, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { ModalAction } from '@shared/components/modal/modal-action';

@Component({
  selector: 'm-modal-confirmation',
  templateUrl: './modal-confirmation.component.html',
  styleUrls: ['./modal-confirmation.component.scss']
})
export class ModalConfirmationComponent {

  @Input()
  public header!: string;

  @Input()
  public icon!: string;

  @Input()
  public opener$!: Subject<ModalAction>;

  @Input()
  public canBeClosed = true;

  @Input()
  public onlyConfirm = false;
  
  @Input()
  public buttonText: string = 'BUTTONS.CONFIRM';    //Valor por defecto

  @Output()
  public canceled = new EventEmitter();

  @Output()
  public accepted = new EventEmitter();

  public submit(): void {
    this.opener$.next(ModalAction.Close);
    this.accepted.emit();
  }

  public cancel(): void {
    this.opener$.next(ModalAction.Close);
    this.canceled.emit();
  }

}
