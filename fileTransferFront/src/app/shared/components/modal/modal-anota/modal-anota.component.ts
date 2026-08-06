import { Component, Input, EventEmitter, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { ModalAction } from '@shared/components/modal/modal-action';
import { PedidoProveedor } from '@data/pedidos/pedido-proveedor';

@Component({
  selector: 'm-modal-anota',
  templateUrl: './modal-anota.component.html',
  styleUrls: ['./modal-anota.component.scss']
})
export class ModalAnotaComponent {

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
  public directANOT = false;

  @Output()
  public canceled = new EventEmitter();

  @Output()
  public accepted = new EventEmitter();

  @Output()
  public deleted = new EventEmitter();

  public submit(): void {
    this.accepted.emit();
  }

  public cancel(): void {
    this.opener$.next(ModalAction.Close);
    this.canceled.emit();
  }

  public delete(): void {
    this.deleted.emit();
  }

}
