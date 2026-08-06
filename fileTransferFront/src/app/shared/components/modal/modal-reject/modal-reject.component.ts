import { Component, Input, EventEmitter, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { ModalAction } from '@shared/components/modal/modal-action';
import { PedidoProveedor } from '@data/pedidos/pedido-proveedor';

@Component({
  selector: 'm-modal-reject',
  templateUrl: './modal-reject.component.html',
  styleUrls: ['./modal-reject.component.scss']
})
export class ModalRejectComponent {

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
  public directRJCT = false;

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
