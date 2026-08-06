import { Component, Input, EventEmitter, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { ModalAction } from '@shared/components/modal/modal-action';
import { PedidoProveedor } from '@data/pedidos/pedido-proveedor';

@Component({
  selector: 'm-modal-docs-hist',
  templateUrl: './modal-docs-hist.component.html',
  styleUrls: ['./modal-docs-hist.component.scss']
})
export class ModalDocsHistComponent {

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
  public canceled = new EventEmitter();

  @Output()
  public downloadedCMR = new EventEmitter();

  @Output()
  public downloadedFAC = new EventEmitter();

  @Output()
  public anotated = new EventEmitter();
  
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

  public anotCMR(): void {
    this.anotated.emit();
  }

}
