import { Component, OnInit, ViewChild, OnDestroy, AfterContentInit, AfterViewInit, Input } from '@angular/core';
import { BarecodeScannerLivestreamComponent } from 'ngx-barcode-scanner';
import { NavigationStateService } from 'src/app/services/navigation-state.service';
import { Info } from 'src/app/data/shared/info';
import { Transport } from 'src/app/data/shared/transport';
import { Subscription } from 'rxjs';
import { ConfirmSliderService } from 'src/app/shared/components/confirm-slider/confirm-slider.service';
import { Router } from '@angular/router';
import { TransportService } from 'src/app/services/api/transport/transport.service';
import { ActionService } from 'src/app/services/api/action/action.service';
import { BaseComponent } from 'src/app/core/components/base.component';
import { take, finalize, tap } from 'rxjs/operators';
import { TransportPoint } from 'src/app/data/transport-point';

@Component({
  selector: 'm-camara-scan',
  templateUrl: './camara-scan.component.html',
  styleUrls: ['../../task.component.scss']
})
export class CamaraScanComponent extends BaseComponent implements OnInit, AfterViewInit , OnDestroy {

  @ViewChild('barcodeScanner', {static: false})
  public barecodeScanner: BarecodeScannerLivestreamComponent;
  public dockToCheck!: string;
  public infoDock: Info;
  public transport: Transport = new Transport();
  public selectedLicensePlate: string;
  public selectedTranportNi: number;
  private actionSubscription: Subscription | undefined;
  public result!: boolean;
  private barcodeValue!: string;
  public cameraOn = false;
  protected confirmSliderVisible = false;
  protected textSlider = 'HOME.RESCAN';

  public constructor(
    protected confirmSliderService: ConfirmSliderService,
    protected router: Router,
    protected navigationStateService: NavigationStateService,
    private readonly transportService: TransportService,
    private readonly actionService: ActionService ) {
      super(confirmSliderService, router, navigationStateService);
    }
    public ngOnInit(): void {
      super.ngOnInit();
      this.cameraOn = true;
      this.getTransport();
    }
    public ngAfterViewInit(): void {
      this.startScanning();
    }

    public ngOnDestroy(): void {
      super.ngOnDestroy();
      this.cameraOn = false;
      if (this.actionSubscription) {
        this.actionSubscription.unsubscribe();
      }
      this.transport = null;
    }

    protected onConfirmed(): void {
    }
    protected dataIsValid(): boolean {
      return true;
    }
    protected initData(): void {
    }
    protected onDataSet(): void {

    }

  public startScanning(): void {
    this.dockToCheck = this.navigationStateService.getNavigationParams().dock;
    this.cameraOn = true;
    if (this.barecodeScanner) {
      navigator.permissions.query({name: 'camera'})
      .then( permissionStatus => {
        if ( permissionStatus.state === 'denied') {
            alert('No tenemos permiso para acceder a la camara.');
            // this.permiso = false;
        } else if (permissionStatus.state === 'granted') {
          // this.permiso = true;
        }
      });
      this.barecodeScanner.start();
    }
  }
  public stopScanning(): void {
    this.cameraOn = false;
    this.barecodeScanner.stop();
    this.goToBack();
  }
  public goToBack() {
    this.router.navigate([ `inDock/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`], {
      state: {
        title: this.selectedLicensePlate
      }
    });
  }
  public onValueChanges(value) {
    if (value) {
      this.barcodeValue = value.codeResult.code;
      if (this.dockToCheck === this.barcodeValue) {
        this.cameraOn = false;
        this.barecodeScanner.stop();
        this.result = true;
        setTimeout(() => {
          this.confirmed();
         }, 1500);
      } else {
        this.confirmSliderVisible = true;
        this.cameraOn = false;
        this.barecodeScanner.stop();
        this.result = false;
      }
    }
  }
  public onStarted() {

  }

  public confirmed() {
    let result: boolean;
    if (this.selectedLicensePlate && this.transport) {
      this.actionSubscription = this.actionService.truckInDock(this.transport)
      .pipe(
        take(1),
        finalize(() => {
          if (result) {
            this.goToNext();
          } else {
            this.onBackError(this.selectedLicensePlate);
          }
        }))
        .subscribe(response => result = response);
    }
  }
    private goToNext(): void {
     this.getTransport(true);
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
          this.infoDock = new Info(this.transport.origenCod, this.transport.destinoCod, this.transport.muelleDestino, this.transport.pin);
        } else {
          // una vez obtenido o no el transporte siguiente checkeamos donde ir
          this.checkWhereGoing();
        }
      }))
    .subscribe();

  }
  private checkWhereGoing() {
    let url = '';
    if (this.transport.transporteNi) {
      if (this.selectedLicensePlate && this.transport) {
        const origin = this.transport.origenTipo;
        const destiny = this.transport.destinoTipo;

        if (origin === TransportPoint.Gas) {
          url = `ventilation-pickUp/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
        } else if (origin === TransportPoint.Terminal) {
          url = `terminal-exit/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
        } else if (origin === TransportPoint.Store && destiny === TransportPoint.Terminal) {
          url = `container-full/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
        } else {
          url = `store-entrance/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
        }
      }
    } else {
      url = `/plate-number/${this.selectedLicensePlate}`;
      // this.selectedLicensePlate = '';
    }

    this.router.navigate([url], {
      state: {
        title: this.selectedLicensePlate
      }
    });
  }
}
