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
import { GlobalSpinnerService } from 'src/app/services/global-spinner/global-spinner.service';

@Component({
  selector: 'm-arrive',
  templateUrl: './arrive.component.html',
  styleUrls: ['../task.component.scss']
})
export class ArriveComponent extends BaseComponent implements OnInit, OnDestroy {

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
    if (this.selectedLicensePlate && this.transport) {
      this.actionSubscription = this.actionService.pifScannerEntrance(this.transport)
        .pipe(
          take(1))
        .subscribe(response => {
          if (response) {
            this.goToNext();
          } else {
            this.spinnerService.hide();
            this.onBackError(this.selectedLicensePlate);
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
    if (this.selectedLicensePlate) {
      this.router.navigate([`pif-scanner/plate-number/${this.selectedLicensePlate}/${this.selectedTranportNi}`], {
        state: {
          title: this.selectedLicensePlate
        }
      });
    }
  }

  private getTransport(): void {
    this.selectedTranportNi = this.navigationStateService.getNavigationParams().transportNi;
    this.selectedLicensePlate = this.navigationStateService.getNavigationParams().number;
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
