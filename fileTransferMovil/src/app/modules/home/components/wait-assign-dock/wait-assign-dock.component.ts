import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from 'src/app/core/components/base.component';
import { Info } from 'src/app/data/shared/info';
import { Transport } from 'src/app/data/shared/transport';
import { Subscription } from 'rxjs';
import { ConfirmSliderService } from 'src/app/shared/components/confirm-slider/confirm-slider.service';
import { Router } from '@angular/router';
import { NavigationStateService } from 'src/app/services/navigation-state.service';
import { TransportService } from 'src/app/services/api/transport/transport.service';
import { ActionService } from 'src/app/services/api/action/action.service';
import { GlobalSpinnerService } from 'src/app/services/global-spinner/global-spinner.service';
import { take, tap, finalize } from 'rxjs/operators';

export interface WaitAssignDockComponentData {
  hasDock: boolean;
}

@Component({
  selector: 'm-wait-assign-dock',
  templateUrl: './wait-assign-dock.component.html',
  styleUrls: ['../task.component.scss']
})
export class WaitAssignDockComponent extends BaseComponent<WaitAssignDockComponentData> implements OnInit, OnDestroy {

  private checkingInterval!: any;
  public mainInfo: Info;
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
    private readonly actionService: ActionService,
    private readonly spinnerService: GlobalSpinnerService
  ) {
    super(confirmSliderService, router, navigationStateService);
  }
  public get hasDock(): boolean {
    return (this.transport.muelleDestino) ? true : false;
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
      this.checkHasDock();
    }
  }

  protected dataIsValid(): boolean {
    return true;
  }
  protected initData(): void {
    this.data = {
      hasDock: false
    };
  }

  protected onDataSet(): void {
  }

  private goToNext() {
    if (this.selectedLicensePlate && this.transport && this.hasDock) {
      this.router.navigate([`inDock/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`], {
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
          if (!this.hasDock) {
            this.continueChecking();
          }
        }))
      .subscribe();
  }

  private continueChecking(): void {
    this.transportService.getTransport(this.selectedTranportNi)
      .pipe(
        take(1),
        tap(transport => this.transport = transport),
        finalize(() => {
          this.data.hasDock = this.hasDock;
          this.saveData(this.data);
          this.checkDataIsValid();
          if (this.hasDock && this.checkingInterval) {
            clearInterval(this.checkingInterval);
            this.spinnerService.hide();
            this.goToNext();
          }
        }))
      .subscribe();
  }

  private checkHasDock() {
    this.getTransport(true);
    this.spinnerService.hide();
  }

}
