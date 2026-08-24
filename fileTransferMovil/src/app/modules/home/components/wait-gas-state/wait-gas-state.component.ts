import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from 'src/app/core/components/base.component';
import { Info } from 'src/app/data/shared/info';
import { Transport } from 'src/app/data/shared/transport';
import { Subscription } from 'rxjs';
import { ConfirmSliderService } from 'src/app/shared/components/confirm-slider/confirm-slider.service';
import { Router } from '@angular/router';
import { NavigationStateService } from 'src/app/services/navigation-state.service';
import { TransportService } from 'src/app/services/api/transport/transport.service';
import { take, tap, finalize, map } from 'rxjs/operators';
import { GasState } from 'src/app/data/transport-point';
import { GlobalSpinnerService } from 'src/app/services/global-spinner/global-spinner.service';

export interface WaitGasStateComponentData {
  hasGasState: boolean;
}
@Component({
  selector: 'm-wait-gas-state',
  templateUrl: './wait-gas-state.component.html',
  styleUrls: ['../task.component.scss']
})
export class WaitGasStateComponent extends BaseComponent<WaitGasStateComponentData> implements OnInit, OnDestroy {

  private checkingInterval!: any;
  public mainInfo: Info;
  public alltransports: Transport[] = [];
  public transport: Transport = new Transport();
  public selectedLicensePlate: string;
  public selectedTranportNi: number;
  private actionSubscription: Subscription | undefined;
  protected confirmSliderVisible = false;

  public constructor(
    protected confirmSliderService: ConfirmSliderService,
    protected router: Router,
    protected navigationStateService: NavigationStateService,
    private readonly transportService: TransportService,
    private readonly spinnerService: GlobalSpinnerService
  ) {
    super(confirmSliderService, router, navigationStateService);
  }

  public get hasGasState(): boolean {
    return (this.transport.gasesEstadoCod === GasState.NOK ||
      this.transport.gasesEstadoCod === GasState.Ok ||
      this.transport.gasesEstadoCod === GasState.FREE) ? true : false;
  }

  public ngOnInit(): void {
    this.spinnerService.show(true);
    super.ngOnInit();
    this.getTransport();
    this.checkingInterval = setInterval(() => {
      this.continueChecking();
    }, 5000);
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.actionSubscription) {
      this.actionSubscription.unsubscribe();
    }
    if (this.checkingInterval) {
      clearInterval(this.checkingInterval);
      this.spinnerService.hide();
    }
    this.transport = null;
  }
  protected onConfirmed(): void {
    this.spinnerService.show();
    if (this.selectedLicensePlate && this.transport) {
      this.checkHasGasState();
    }
  }

  protected dataIsValid(): boolean {
    return true;
  }
  protected initData(): void {
    this.data = {
      hasGasState: false
    };
  }

  protected onDataSet(): void {
  }

  private goToNext() {

    if (this.selectedLicensePlate && this.transport && this.hasGasState) {
      const stateGas = this.transport.gasesEstadoCod;

      let url: string;
      if (stateGas === GasState.Ok || stateGas === GasState.FREE) {
        // Confirmar camión en muelle
        url = `wait-assign-dock/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
      } else if (stateGas === GasState.NOK) {
        // Ventilation or Parking
        url = `parking-zone/not/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
      }
      this.router.navigate([url], {
        state: {
          title: this.selectedLicensePlate
        }
      });
    }
  }
  private getTransport(checkGasState?: boolean): void {
    this.selectedLicensePlate = this.navigationStateService.getNavigationParams().number;
    this.selectedTranportNi = this.navigationStateService.getNavigationParams().transportNi;
    this.transportService.getTransport(this.selectedTranportNi)
      .pipe(
        take(1),
        tap(transport => this.transport = transport),
        finalize(() => {
          this.mainInfo = new Info(this.transport.origenCod, this.transport.destinoCod, this.transport.muelleDestino, this.transport.pin);
          if (!this.hasGasState) {
            this.continueChecking();
          }
        }))
      .subscribe();
  }

  private continueChecking(): void {
    const containerKey = this.transport.contenedorKey;
    this.transportService.getTransportsByLicense(this.selectedLicensePlate)
    .pipe(
      take(1),
      tap(trucks => this.alltransports = trucks),
      map(() => {

        this.transport = this.alltransports.find( t => t.contenedorKey === containerKey);
      }),
      finalize(() => {
        this.data.hasGasState = this.hasGasState;
        this.saveData(this.data);
        this.checkDataIsValid();
        if (this.hasGasState && this.checkingInterval) {
          clearInterval(this.checkingInterval);
          this.spinnerService.hide();
          this.goToNext();
        }
      }))
    .subscribe();
  }

  private checkHasGasState() {
    this.getTransport(true);
    this.spinnerService.hide();
  }

}
