import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from 'src/app/core/components/base.component';
import { ConfirmSliderService } from 'src/app/shared/components/confirm-slider/confirm-slider.service';
import { Router } from '@angular/router';
import { NavigationStateService } from 'src/app/services/navigation-state.service';
import { TransportService } from 'src/app/services/api/transport/transport.service';
import { Transport } from '../../../../data/shared/transport';
import { GasState } from 'src/app/data/transport-point';
import { take, tap, finalize, map } from 'rxjs/operators';
import { Truck } from 'src/app/data/shared/truck';
import { Container } from 'src/app/data/container/container';
import { Subscription } from 'rxjs';
import { ActionService } from 'src/app/services/api/action/action.service';
import { Store } from 'src/app/data/shared/store';
import { MasterTablesService } from 'src/app/services/api/masterTables/master-tables.service';
import { GlobalSpinnerService } from 'src/app/services/global-spinner/global-spinner.service';

export interface ParkingZoneSelectionComponentData {
  selectedLicensePlate: string;
  selectedContainer: number;
  selectedStore: string;
}

@Component({
  selector: 'm-parking-zone-selection',
  templateUrl: './parking-zone-selection.component.html',
  styleUrls: ['./parking-zone-selection.component.scss']
})
export class ParkingZoneSelectionComponent extends BaseComponent<ParkingZoneSelectionComponentData> implements OnInit, OnDestroy {

  public get hasContainers(): boolean {
    return (this.containers.length !== 0) ? true : false;
  }
  public selectedLicensePlate: string;
  public stores: Store[] = [];
  public selectedStore!: Store;
  public containers: Container[] = [];
  public transport: Transport = new Transport();

  public selectedContainer!: Container;

  public titleLabel!: string;
  private actionSubscription: Subscription | undefined;

  public constructor(
    protected confirmSliderService: ConfirmSliderService,
    protected router: Router,
    private readonly storeService: MasterTablesService,
    protected navigationStateService: NavigationStateService,
    private readonly transportService: TransportService,
    private readonly actionService: ActionService,
    private readonly spinnerService: GlobalSpinnerService) {
    super(confirmSliderService, router, navigationStateService);
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.getStores();
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.actionSubscription) {
      this.actionSubscription.unsubscribe();
    }
  }
  public onContainerSelected(value: Container): void {
    if (value) {
      this.selectedContainer = value;
      this.data.selectedContainer = this.selectedContainer.contenedorKey;
      // Guarda los datos de entrada en localStorage, si estos son necesarios
      this.saveData(this.data);
      // funcion que se lanza cuando se quiere validar lo que hay en dataIsValid, normalmente cuando insertamos datos
      this.checkDataIsValid();
    }

  }
  public onValueSelected(value: Transport): void {
    if (value) {
      this.selectedLicensePlate = value.matricula;
      this.data.selectedLicensePlate = this.selectedLicensePlate;
      // Guarda los datos de entrada en localStorage, si estos son necesarios
      this.saveData(this.data);
      // funcion que se lanza cuando se quiere validar lo que hay en dataIsValid, normalmente cuando insertamos datos
      this.checkDataIsValid();
    }

  }

  protected dataIsValid(): boolean {
    return !!this.selectedStore && !!this.selectedContainer;
  }

  protected onConfirmed(): void {
    this.spinnerService.show();
    if (this.selectedLicensePlate && this.selectedContainer) {
      this.actionService.parkingPickUp(this.selectedContainer, this.selectedLicensePlate)
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
  private goToNext(): void {
    this.spinnerService.hide();
    let url = '';
    if (this.selectedLicensePlate && this.selectedContainer) {

      const gasState = this.selectedContainer.gasesEstadoCod;

      if (gasState) {
        if (gasState === GasState.Ok) {
          // Confirmar camión en muelle
          url = `wait-assign-dock/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
        } else if (gasState === GasState.NOK) {
          url = `download-ventilation/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
        } else {
          // A la espera de resultado de gases
          url = `wait-gas-state/plate-number/${this.selectedLicensePlate}/${this.transport.transporteNi}`;
        }
      }
      this.router.navigate([url], {
        state: {
          title: this.selectedLicensePlate
        }
      });
    }
  }
  protected initData(): void {
    this.data = {
      selectedLicensePlate: null,
      selectedContainer: null,
      selectedStore: null
    };
  }

  protected onDataSet(): void {
    this.selectedLicensePlate = this.data.selectedLicensePlate;
  }

  private getContainers() {
    this.transportService.getAllContainersInParkingZone(this.selectedStore.codigo)
      .pipe(
        take(1),
        tap(containers => this.containers = containers),
        finalize(() => {
          if (this.containers.length !== 0) {
            this.titleLabel = 'HOME.SELECT_LICENSE_PLATE_CONTAINER';
          } else {
            this.titleLabel = 'HOME.NOTICE';
          }
        }))
      .subscribe();
  }
  public getStores() {
    this.selectedLicensePlate = this.navigationStateService.getNavigationParams().number;
    this.storeService.getStores()
      .pipe(
        take(1),
        tap(stores => this.stores = stores),
        finalize(() => {
          this.titleLabel = 'HOME.SELECT_STORE';
        }))
      .subscribe();
  }

  public onStoreSelected(value: Store): void {
    if (value) {
      this.selectedStore = value;
      this.data.selectedStore = this.selectedStore.codigo;
      this.getContainers();
      // Guarda los datos de entrada en localStorage, si estos son necesarios
      this.saveData(this.data);
      // funcion que se lanza cuando se quiere validar lo que hay en dataIsValid, normalmente cuando insertamos datos
      this.checkDataIsValid();
    }

  }
}
