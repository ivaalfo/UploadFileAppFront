import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from 'src/app/core/components/base.component';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ConfirmSliderService } from 'src/app/shared/components/confirm-slider/confirm-slider.service';
import { NavigationStateService } from 'src/app/services/navigation-state.service';
import { TransportService } from 'src/app/services/api/transport/transport.service';
import { ActionService } from 'src/app/services/api/action/action.service';
import { take, tap } from 'rxjs/operators';
import { Transport } from 'src/app/data/shared/transport';
import { GasState } from 'src/app/data/transport-point';
import { GlobalSpinnerService } from 'src/app/services/global-spinner/global-spinner.service';

export interface ParkingZoneComponentData {
  result: boolean;
}

@Component({
  selector: 'm-parking-zone',
  templateUrl: './parking-zone.component.html',
  styleUrls: ['../task.component.scss']
})
export class ParkingZoneComponent extends BaseComponent<ParkingZoneComponentData> implements OnInit, OnDestroy {

  public selectedLicensePlate: string;
  public selectedTranportNi: number;
  public result: boolean;
  public transport: Transport = new Transport();
  private actionSubscription: Subscription | undefined;

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
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.actionSubscription) {
      this.actionSubscription.unsubscribe();
    }
    this.transport = null;
  }

  public checkClick(value: boolean) {
    this.result = value;
    this.data.result = this.result;
    this.saveData(this.data);
    this.checkDataIsValid();
  }

  protected onConfirmed(): void {
    this.spinnerService.show();
    if (this.selectedLicensePlate && this.transport) {
      this.actionSubscription = this.actionService.selectionParkingOrGas(this.transport, this.result)
        .pipe(
          take(1))
        .subscribe(response => {
          if (response) {
            if (this.result === true) {
              this.actionService.selectionParking(this.transport)
                .pipe(
                  take(1))
                .subscribe(response2 => {
                  if (response2) {
                    this.goToNext();
                  } else {
                    this.spinnerService.hide();
                    this.onBackError(this.selectedLicensePlate);
                  }
                });
            } else {
              this.goToNext();
            }
          } else {
            this.spinnerService.hide();
            this.onBackError(this.selectedLicensePlate);
          }
        });
    }
  }

  protected dataIsValid(): boolean {
    return this.result === true || this.result === false;
  }

  protected initData(): void {
    this.data = {
      result: null
    };
  }

  protected onDataSet(): void {
    this.result = this.data.result;
  }

  private goToNext(): void {
    this.spinnerService.hide();
    let url = '';
    if (this.selectedLicensePlate && this.transport) {
      const gases = this.transport.gasesEstadoCod;
      // Gas
      if (this.result === false) {
        if (gases === GasState.Ok) {
          // Confirmar camión en muelle
          url = `wait-assign-dock/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
        } else if (gases === GasState.NOK) {
          // Ventilation
          url = `parking-zone/not/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
        } else {
          // A la espera de resultado de gases
          url = `wait-gas-state/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
        }
        // parking
      } else {
        url = `/plate-number/${this.selectedLicensePlate}`;
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
        tap(transport => this.transport = transport))
      .subscribe();

    this.checkDataIsValid();
  }

}
