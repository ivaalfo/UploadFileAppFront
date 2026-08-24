import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from '../../../../core/components/base.component';
import { Info } from '../../../../data/shared/info';
import { NavigationStateService } from '../../../../services/navigation-state.service';
import { Router } from '@angular/router';
import { ConfirmSliderService } from '../../../../shared/components/confirm-slider/confirm-slider.service';
import { TransportService } from '../../../../services/api/transport/transport.service';
import { Transport } from '../../../../data/shared/transport';
import { take, tap, finalize } from 'rxjs/operators';
import { ActionService } from '../../../../services/api/action/action.service';
import { Subscription } from 'rxjs';
import { GlobalSpinnerService } from 'src/app/services/global-spinner/global-spinner.service';
import { TransportPoint, GasState, TransportState } from '../../../../data/transport-point';
import { CountdownTimer } from './countdown';

@Component({
  selector: 'm-timer-check',
  templateUrl: './timer-check.component.html',
  styleUrls: ['../task.component.scss']
})
export class TimerCheckComponent extends BaseComponent implements OnInit, OnDestroy {   // NEW TIMER Component OK 06/02/25
  public mainInfo: Info;
  public result: boolean;
  public transport: Transport = new Transport();
  public selectedLicensePlate: string;
  public selectedTransportNi: number;
  private actionSubscription: Subscription | undefined;
  public timer: number;

  public constructor(
    protected confirmSliderService: ConfirmSliderService,
    protected router: Router,
    protected navigationStateService: NavigationStateService,
    private readonly transportService: TransportService,
    private readonly actionService: ActionService,
    private readonly spinnerService: GlobalSpinnerService) {
    super(confirmSliderService, router, navigationStateService);
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.getTransport();
    this.spinnerService.hide();
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.actionSubscription) {
      this.actionSubscription.unsubscribe();
    }
    this.transport = null;
  }

  protected dataIsValid(): boolean {
    return true;
  }

  protected initData(): void {
    // Como es una pantalla de mostrar datos, no es necesario inicializar los datos
  }

  protected onDataSet(): void {
  }

  // OK::
  protected onConfirmed(): void {
    this.spinnerService.show();
    if (this.selectedLicensePlate && this.transport) {
      this.actionSubscription = this.actionService.checkTimer(this.transport)
        .pipe(
          take(1))
        .subscribe(response => {
          if (response) {
            // SI TRUE   --->
            // OK:: abrá que ir a la pantalla siguiente correspondiente
            // OK:: dependerá de dnd venga la pantalla para ir goNext
            this.goToNext();
          } else {
            // OK:: SI FALSE   --->   PANTALLA ERROR ME QUEDO DONDE ESTOY
            this.spinnerService.hide();
          }
        });
    } else {
      // OK:: Boton volver:: this result = false --> VOLVER INICIO
      this.spinnerService.hide();
      // OK:: Vuelvo a pantalla inicial
      // OK:: Y habrá que comprobar el timer antes de cada accion
      this.onBackError(this.selectedLicensePlate);
    }
  }

  // OK::
  protected goToNext(): void {
    this.spinnerService.hide();
    if (this.selectedLicensePlate && this.transport) {

      this.spinnerService.hide();
      let url = '';
      if (this.transport) {
        const state = this.transport.hisEstadoCod;
        const origin = this.transport.origenTipo;
        const destiny = this.transport.destinoTipo;

        if (state) {
          switch (state) {
            case TransportState.RECTER:
              // OK:: al fin del paso 1
              url = this.finalStep1();
              break;
            case TransportState.RECVAC:
              // OK:: al fin del paso 10
              url = `container-empty/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
              break;
            case TransportState.ENAALM:
              // OK:: al fin del paso 12
              url = this.finalStep12();
              break;
            case TransportState.RECPRK:
              // OK:: al fin del paso 12
              url = this.finalStep12();
              break;
            case TransportState.ENEPRK:
              // OK:: al fin del paso 12
              url = this.finalStep12();
              break;
          }
        }
        this.router.navigate([url], {
          state: {
            title: this.selectedLicensePlate
          }
        });
      }
    }
  }

  // OK::
  private finalStep1(): string {
    const destiny = this.transport.destinoTipo;
    if (destiny === TransportPoint.Pif || destiny === TransportPoint.Scanner) {
      // Confirmar camión en muelle
      return `arrive/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
    } else {
      return `store-entrance/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
    }
  }

  // OK::
  private finalStep12(): string {
    const gases = this.transport.gasesEstadoCod;
    const liberado = (gases === GasState.FREE);
    if (gases === GasState.Ok || liberado) {
      // Confirmar camión en muelle
      return `wait-assign-dock/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
    } else if (gases === GasState.NOK) {
      // Ventilation or Parking
      return `parking-zone/not/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
    } else {
      // A la espera de resultado de gases
      return `wait-gas-state/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
    }
  }

  // OK::
  private getTransport(checkGasState?: boolean): void {
    this.selectedLicensePlate = this.navigationStateService.getNavigationParams().number;
    this.selectedTransportNi = this.navigationStateService.getNavigationParams().transportNi;
    this.transportService.getTransport(this.selectedTransportNi)
      .pipe(
        take(1),
        tap(transport => this.transport = transport),
        finalize(() => {
          this.mainInfo = new Info(this.transport.origenCod, this.transport.destinoCod, this.transport.muelleDestino, this.transport.pin);
          // OK:: Comprobar estado, origen y destino para establecer el timer
          this.setTimer();
        })
      )
      .subscribe();

    this.checkDataIsValid();
  }

  public setTimer() {
    // OK:: Comprobar origen y destino y settear CountdownTimer
    if (this.transport) {
      const state = this.transport.hisEstadoCod;
      const origin = this.mainInfo.origin;
      const destiny = this.mainInfo.destiny;

      // OK::
      const fechaHoraReg = this.transport.fechaHoraReg;
      const resTime = this.transport.tiempoEspera;
      this.timer = resTime;

      // OK:: Mostrar contador de minutos segun la accion siguiente
      const displayElement = document.getElementById('countdown');
      if (displayElement) {
        new CountdownTimer(this.timer, displayElement);
      }
    }
  }

}
