import { Component, Input, EventEmitter, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { ModalAction } from '@shared/components/modal/modal-action';
import { PedidoFirmador } from '@data/pedidos/pedido-firmador';

@Component({
  selector: 'm-modal-docs-firm',
  templateUrl: './modal-docs-firm.component.html',
  styleUrls: ['./modal-docs-firm.component.scss']
})
export class ModalDocsFirmComponent {

  @Input()
  public header!: string;

  @Input()
  public data!: string[];

  @Input()
  public pedidoSelected = new PedidoFirmador();

  @Input()
  public icon!: string;

  @Input()
  public opener$!: Subject<ModalAction>;

  @Input()
  public canBeClosed = true;

  @Input()
  public isUserExter = false;

  @Input()
  public isUserConsulta = false;

  @Input()
  public formularioValido = false;

  @Output()
  public signed = new EventEmitter();

  @Output()
  public downloaded = new EventEmitter();

  @Output()
  public canceled = new EventEmitter();

  public actionToConfirm!: string;
  public actionTitle!: string;
  

  public signCMR(): void {
    this.signed.emit();
  }

  public downloadCMR(): void {
    this.downloaded.emit();
  }

  public cancel(): void {
    this.opener$.next(ModalAction.Close);
    this.canceled.emit();
  }

}
