import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from '../../../../core/components/base.component';
import { ConfirmSliderService } from '../../../../shared/components/confirm-slider/confirm-slider.service';
import { Router } from '@angular/router';
import { NavigationStateService } from '../../../../services/navigation-state.service';
import { TransportService } from '../../../../services/api/transport/transport.service';
import { Transport } from '../../../../data/shared/transport';
import { take, tap, map } from 'rxjs/operators';
import { ActionService } from '../../../../services/api/action/action.service';
import { Subscription } from 'rxjs';
import { GlobalSpinnerService } from 'src/app/services/global-spinner/global-spinner.service';

export interface PifScannerComponentData {
  result: boolean;
}

@Component({
  selector: 'm-pif-scanner',
  templateUrl: './pif-scanner.component.html',
  styleUrls: ['../task.component.scss']
})
export class PifScannerComponent extends BaseComponent<PifScannerComponentData> implements OnInit, OnDestroy {

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
      this.actionSubscription = this.actionService.pifScannerResult(this.transport, this.result)
        .pipe(
          take(1),
          map(transport => this.transport = transport))
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
    if (this.selectedLicensePlate && this.transport) {
      this.router.navigate([`exit/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`], {
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
