import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from 'src/app/core/components/base.component';
import { Store } from 'src/app/data/shared/store';
import { Subscription } from 'rxjs';
import { ConfirmSliderService } from 'src/app/shared/components/confirm-slider/confirm-slider.service';
import { Router } from '@angular/router';
import { NavigationStateService } from 'src/app/services/navigation-state.service';
import { MasterTablesService } from 'src/app/services/api/masterTables/master-tables.service';
import { ActionService } from 'src/app/services/api/action/action.service';
import { take, tap, finalize } from 'rxjs/operators';
import { Transport } from '../../../../data/shared/transport';
import { GlobalSpinnerService } from 'src/app/services/global-spinner/global-spinner.service';
export interface StoreEntranceEmptyComponentData {
  selectedLicensePlate: string;
  selectedStore: string;
}

@Component({
  selector: 'm-store-entrance-empty',
  templateUrl: './store-entrance-empty.component.html',
  styleUrls: ['./store-entrance-empty.component.scss']
})
export class StoreEntranceEmptyComponent extends BaseComponent<StoreEntranceEmptyComponentData> implements OnInit, OnDestroy {

  public selectedLicensePlate: string;
  public stores: Store[] = [];
  public selectedStore!: Store;

  public titleLabel!: string;
  private actionSubscription: Subscription | undefined;

  public constructor(
    protected confirmSliderService: ConfirmSliderService,
    protected router: Router,
    protected navigationStateService: NavigationStateService,
    private readonly storeService: MasterTablesService,
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
  public onStoreSelected(value: Store): void {
    if (value) {
      this.selectedStore = value;
      this.data.selectedStore = this.selectedStore.codigo;
      // Guarda los datos de entrada en localStorage, si estos son necesarios
      this.saveData(this.data);
      // funcion que se lanza cuando se quiere validar lo que hay en dataIsValid, normalmente cuando insertamos datos
      this.checkDataIsValid();
    }

  }

  protected dataIsValid(): boolean {
    return !!this.selectedStore;
  }

  protected onConfirmed(): void {
    this.spinnerService.show();
    if (this.selectedLicensePlate && this.selectedStore) {
      this.actionSubscription = this.actionService.storeEntranceEmpty(this.selectedLicensePlate, this.selectedStore.codigo )
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
  private goToNext(): void {
    this.spinnerService.hide();
    if (this.selectedLicensePlate) {
      this.router.navigate([`/plate-number/${this.selectedLicensePlate}`], {
        state: {
          title: this.selectedLicensePlate
        }
      });
    }

  }
  protected initData(): void {
    this.data = {
      selectedLicensePlate: null,
      selectedStore: null
    };
  }

  protected onDataSet(): void {
    this.selectedLicensePlate = this.data.selectedLicensePlate;
  }
  public getStores() {
    this.selectedLicensePlate = this.navigationStateService.getNavigationParams().number;
    this.storeService.getStores()
      .pipe(
        take(1),
        tap(stores => this.stores = stores),
        finalize( () => {
          this.titleLabel = 'HOME.SELECT_STORE';
        }))
      .subscribe();
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
}
