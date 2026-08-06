import { Component, Input, EventEmitter, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { ModalAction } from '@shared/components/modal/modal-action';
import { PedidoProveedor } from '@data/pedidos/pedido-proveedor';

@Component({
  selector: 'm-modal-docs-val',
  templateUrl: './modal-docs-val.component.html',
  styleUrls: ['./modal-docs-val.component.scss']
})
export class ModalDocsValComponent {

  @Input()
  public header!: string;

  @Input()
  public data!: string[];

  @Input()
  public pedidoSelected = new PedidoProveedor();

  @Input()
  public icon!: string;

  @Input()
  public opener$!: Subject<ModalAction>;

  @Input()
  public canBeClosed = true;

  @Input()
  public isNotFACdoc= false;

  @Input()
  public isUserExter = false;

  @Input()
  public isUserConsulta = false;

  @Output()
  public validated = new EventEmitter();

  @Output()
  public rejectedCMR = new EventEmitter();

  @Output()
  public anotated = new EventEmitter();

  @Output()
  public rejectedFAC = new EventEmitter();

  @Output()
  public canceled = new EventEmitter();

  public rejectModalOpener$ = new Subject<ModalAction>();
  public anotaModalOpener$ =  new Subject<ModalAction>();
  public rejectFACmodalOpener$ = new Subject<ModalAction>();

  public actionToConfirm!: string;
  public actionTitle!: string;
  

  public validate(): void {
    this.validated.emit();
  }

  public rejectCMR(): void {
    this.rejectedCMR.emit();
  }

  public anotCMR(): void {
    this.anotated.emit();
  }

  public rejectFAC(): void {
    this.rejectedFAC.emit();
  }

  public cancel(): void {
    this.opener$.next(ModalAction.Close);
    this.canceled.emit();
  }

}
