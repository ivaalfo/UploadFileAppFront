import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from '../../../../core/components/base.component';
import { Info } from '../../../../data/shared/info';
import { ConfirmSliderService } from '../../../../shared/components/confirm-slider/confirm-slider.service';
import { Router } from '@angular/router';
import { NavigationStateService } from '../../../../services/navigation-state.service';
import { TransportService } from '../../../../services/api/transport/transport.service';
import { take, tap, finalize } from 'rxjs/operators';
import { Transport } from '../../../../data/shared/transport';
import { ActionService } from '../../../../services/api/action/action.service';
import { Subscription } from 'rxjs';
import { GlobalSpinnerService } from 'src/app/services/global-spinner/global-spinner.service';

@Component({
  selector: 'm-truck-in-dock',
  templateUrl: './truck-in-dock.component.html',
  styleUrls: ['../task.component.scss']
})
export class TruckInDockComponent extends BaseComponent implements OnInit, OnDestroy {
  protected textSlider = 'HOME.SCAN';
  public infoDock: Info;
  public transport: Transport = new Transport();
  public selectedLicensePlate: string;
  public selectedTranportNi: number;
  private actionSubscription: Subscription | undefined;
  public manual = false;

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

  // OK::
  protected onConfirmed(): void {
    this.spinnerService.show();
    let result: boolean;
    if (this.selectedLicensePlate && this.transport) {
      this.actionSubscription = this.actionService.truckInDock(this.transport)
        .pipe(
          take(1),
          finalize(() => {
            if (result) {
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
          })
        )
      .subscribe(response => result = response);
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

  private goToNext(): void {
    this.spinnerService.hide();
    if (this.manual) {
      this.checkWhereGoing();
    } else {
      if (this.selectedLicensePlate && this.transport && this.transport.muelleDestino) {
        this.router.navigate(
          [`camara-scan/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}/${this.transport.muelleDestino}`], {
          state: {
            title: this.selectedLicensePlate
          }
        });
      }
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
          this.infoDock = new Info(this.transport.origenCod, this.transport.destinoCod, this.transport.muelleDestino, this.transport.pin);
        }))
      .subscribe();

    this.checkDataIsValid();
  }

  private checkWhereGoing(): void {
    this.router.navigate([`/plate-number/${this.selectedLicensePlate}`], {
      state: {
        title: this.selectedLicensePlate
      }
    });
  }

  public manualMode(): void {
    this.manual = !this.manual;
    if (this.manual) {
      this.textSlider = 'HOME.SCAN';
    } else {
      this.textSlider = 'HOME.ACCEPT';
    }
  }

}
