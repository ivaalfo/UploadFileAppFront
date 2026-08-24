import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from '../../../../core/components/base.component';
import { Info } from '../../../../data/shared/info';
import { ConfirmSliderService } from '../../../../shared/components/confirm-slider/confirm-slider.service';
import { Router } from '@angular/router';
import { NavigationStateService } from '../../../../services/navigation-state.service';
import { TransportService } from '../../../../services/api/transport/transport.service';
import { Transport } from '../../../../data/shared/transport';
import { take, tap, finalize } from 'rxjs/operators';
import { ActionService } from '../../../../services/api/action/action.service';
import { Subscription } from 'rxjs';
import { GasState } from '../../../../data/transport-point';
import { GlobalSpinnerService } from 'src/app/services/global-spinner/global-spinner.service';

@Component({
  selector: 'm-store-entrance',
  templateUrl: './store-entrance.component.html',
  styleUrls: ['../task.component.scss']
})
export class StoreEntranceComponent extends BaseComponent implements OnInit, OnDestroy {

  public mainInfo: Info;
  public transport: Transport = new Transport();
  public selectedLicensePlate: string;
  public selectedTranportNi: number;
  private actionSubscription: Subscription | undefined;

  public constructor(
    protected confirmSliderService: ConfirmSliderService,
    protected router: Router,
    protected navigationStateService: NavigationStateService,
    private readonly transportService: TransportService,
    private readonly actionService: ActionService,
    private readonly spinnerService: GlobalSpinnerService
  ) {
    super(confirmSliderService, router, navigationStateService);
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.getTransport();
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.actionSubscription) {
      this.actionSubscription.unsubscribe();
    }
    this.transport = null;
  }

  protected onConfirmed(): void {
    this.spinnerService.show();
    if (this.selectedLicensePlate && this.transport) {
      this.actionSubscription = this.actionService.storeEntrance(this.transport)
        .pipe(
          take(1))
        .subscribe(response => {
          if (response) {
            this.goToNext();
          } else {
            // NEW TIMER OK::
            let url = '';
            url = `timer-check/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;

            this.spinnerService.hide();
            this.router.navigate([url], {
              state: {
                title: this.selectedLicensePlate
              }
            });
          }
        });
    }
  }

  protected dataIsValid(): boolean {
    return true;
  }

  protected initData(): void {
    // Como es una pantalla de mostrar datos, no es necesario inicializar los datos
  }

  protected onDataSet(): void {
  }

  private goToNext() {
    this.spinnerService.hide();
    if (this.selectedLicensePlate && this.transport) {
      const liberado = (this.transport.gasesEstadoCod === GasState.FREE);
      const gasStateOK = (this.transport.gasesEstadoCod === GasState.Ok);
      let url: string;
      if (liberado || gasStateOK) {
        // Confirmar camión en muelle
        url = `wait-assign-dock/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
      } else {
        url = `parking-zone/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
      }
      this.router.navigate([url], {
        state: {
          title: this.selectedLicensePlate
        }
      });
    }
  }

  private getTransport(): void {
    this.selectedLicensePlate = this.navigationStateService.getNavigationParams().number;
    this.selectedTranportNi = this.navigationStateService.getNavigationParams().transportNi;
    this.transportService.getTransport(this.selectedTranportNi)
      .pipe(
        take(1),
        tap(transport => this.transport = transport),
        finalize(() => {
          this.mainInfo = new Info(this.transport.origenCod, this.transport.destinoCod, this.transport.muelleDestino, this.transport.pin);
        }))
      .subscribe();

    this.checkDataIsValid();
  }

}
