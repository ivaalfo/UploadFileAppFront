import { Component, Input, EventEmitter, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { ModalAction } from '@shared/components/modal/modal-action';
import { PedidoProveedor } from '@data/pedidos/pedido-proveedor';

@Component({
  selector: 'm-modal-docs-activ',
  templateUrl: './modal-docs-activ.component.html',
  styleUrls: ['./modal-docs-activ.component.scss']
})
export class ModalDocsActivComponent {

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
  public isNotFACdoc = false;

  @Input()
  public isUserExter = false;

  @Output()
  public canceled = new EventEmitter();

  @Output()
  public downloadedCMR = new EventEmitter();

  @Output()
  public downloadedFAC = new EventEmitter();

  
  public cancel(): void {
    this.opener$.next(ModalAction.Close);
    this.canceled.emit();
  }

  public downloadCMR(): void {
    this.downloadedCMR.emit();
  }

  public downloadFAC(): void {
    this.downloadedFAC.emit();
  }

}
