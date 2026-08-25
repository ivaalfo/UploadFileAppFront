/*
import { Component, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/core/components/base.component';
import { ConfirmSliderService } from 'src/app/shared/components/confirm-slider/confirm-slider.service';
import { Router } from '@angular/router';
import { NavigationStateService } from 'src/app/services/navigation-state.service';
import { Truck } from 'src/app/data/shared/truck';
import { TransportService } from 'src/app/services/api/transport/transport.service';
import { take, tap, finalize } from 'rxjs/operators';
import { Transport } from '../../../../data/shared/transport';
import { GlobalSpinnerService } from 'src/app/services/global-spinner/global-spinner.service';
export interface SelectionPageComponentData {
  selectedLicensePlate: string;
  result: string;
}
@Component({
  selector: 'm-selection-page',
  templateUrl: './selection-page.component.html',
  styleUrls: ['./selection-page.component.scss']
})
export class SelectionPageComponent extends BaseComponent<SelectionPageComponentData> implements OnInit {
  public selectedLicensePlate: string;
  public result: string;
  public trucks: Truck[] = [];

  public constructor(
    protected confirmSliderService: ConfirmSliderService,
    protected router: Router,
    protected navigationStateService: NavigationStateService,
    private readonly transportService: TransportService,
    private readonly spinnerService: GlobalSpinnerService) {

    super(confirmSliderService, router, navigationStateService);
  }
  public ngOnInit(): void {
    super.ngOnInit();
    this.getTrucks();
  }

  public checkClick(value: string) {
    this.result = value;
    this.data.result = this.result;
    this.saveData(this.data);
    this.checkDataIsValid();
  }

  protected onConfirmed(): void {
    this.spinnerService.show();
    this.goToNext();
  }

  protected dataIsValid(): boolean {
    return !!this.selectedLicensePlate && (this.result === 'T' || this.result === 'S' || this.result === 'P');
  }
  protected initData(): void {
    this.data = {
      result: null,
      selectedLicensePlate: null
    };
  }

  protected onDataSet(): void {
    this.result = this.data.result;
    this.selectedLicensePlate = this.data.selectedLicensePlate;
  }

  private goToNext(): void {
    setInterval(() => {
      this.spinnerService.hide();
      let url = '';
      if (this.result === 'T') {
        url = `transport-selection/plate-number/${this.selectedLicensePlate}`;
      } else if (this.result === 'P') {
        url = `parking-selection/plate-number/${this.selectedLicensePlate}`;
      } else if (this.result === 'S') {
        url = `store-entrance-empty/plate-number/${this.selectedLicensePlate}`;
      }

      this.router.navigate([url], {
        state: {
          title: this.selectedLicensePlate
        }
      });
    }, 1000);
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

  public getTrucks() {
    this.transportService.getTrucks()
      .pipe(
        take(1),
        tap(trucks => this.trucks = trucks),
        finalize(() => {
          this.selectedLicensePlate = this.navigationStateService.getNavigationParams().number;
        }))
      .subscribe();
  }

}

repetido con el homedir.component.ts
*/