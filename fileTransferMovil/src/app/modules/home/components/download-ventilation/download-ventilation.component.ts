import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from '../../../../core/components/base.component';
import { ConfirmSliderService } from '../../../../shared/components/confirm-slider/confirm-slider.service';
import { Router } from '@angular/router';
import { NavigationStateService } from '../../../../services/navigation-state.service';
import { Info } from '../../../../data/shared/info';
import { TransportService } from '../../../../services/api/transport/transport.service';
import { Transport } from '../../../../data/shared/transport';
import { take, tap, finalize } from 'rxjs/operators';
import { ActionService } from '../../../../services/api/action/action.service';
import { Subscription } from 'rxjs';
import { GlobalSpinnerService } from 'src/app/services/global-spinner/global-spinner.service';

@Component({
  selector: 'm-download-ventilation',
  templateUrl: './download-ventilation.component.html',
  styleUrls: ['../task.component.scss']
})
export class DownloadVentilationComponent extends BaseComponent implements OnInit, OnDestroy {

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

  protected onConfirmed(): void {
    this.spinnerService.show();
    let result: boolean;
    if (this.selectedLicensePlate && this.transport) {
      this.actionSubscription = this.actionService.ventilationDelivery(this.transport)
        .pipe(
          take(1),
          finalize(() => {
            if (result) {
              this.goToNext();
            } else {
              this.spinnerService.hide();
              this.onBackError(this.selectedLicensePlate);
            }
          }))
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
  private goToNext() {
    this.spinnerService.hide();
    this.selectedLicensePlate = this.navigationStateService.getNavigationParams().number;
    if (this.selectedLicensePlate) {
      this.router.navigate([`/plate-number/${this.selectedLicensePlate}`], {
        state: {
          title: this.selectedLicensePlate
        }
      });
    }
  }

  private getTransport(nextTransport?: boolean): void {
    this.selectedLicensePlate = this.navigationStateService.getNavigationParams().number;
    this.selectedTranportNi = this.navigationStateService.getNavigationParams().transportNi;
    this.transportService.getTransport(this.selectedTranportNi)
      .pipe(
        take(1),
        tap(transport => this.transport = transport),
        finalize(() => {
          if (!nextTransport) {
            this.mainInfo = new Info(this.transport.origenCod, this.transport.destinoCod, this.transport.muelleDestino, this.transport.pin);
          } else {
            this.checkWhereGoing();
          }
        }))
      .subscribe();

    this.checkDataIsValid();
  }

  private checkWhereGoing(): void {
    //   let url = '';
    //   if (this.transport.transporteNi) {
    //   if (this.selectedLicensePlate && this.transport) {
    //     const origin = this.transport.origenTipo;
    //     const destiny = this.transport.destinoTipo;

    //     if (origin ===  TransportPoint.Gas) {
    //       url = `ventilation-pickUp/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
    //     } else if (origin ===  TransportPoint.Terminal) {
    //       url = `terminal-exit/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
    //     } else if (origin ===  TransportPoint.Store && destiny ===  TransportPoint.Terminal) {
    //       url = `container-full/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
    //     } else {
    //       url = `store-entrance/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;

    //     }
    //   }
    // } else {
    //   url = `/plate-number/${this.selectedLicensePlate}`;
    //   }
    this.router.navigate([`/plate-number/${this.selectedLicensePlate}`], {
      state: {
        title: this.selectedLicensePlate
      }
    });
  }
}
