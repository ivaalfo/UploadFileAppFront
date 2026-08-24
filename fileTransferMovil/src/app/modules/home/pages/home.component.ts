import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponent } from '../../../core/components/base.component';
import { NavigationStateService } from '../../../services/navigation-state.service';
import { ConfirmSliderService } from '../../../shared/components/confirm-slider/confirm-slider.service';
import { take, tap, finalize } from 'rxjs/operators';
import { Transport } from '../../../data/shared/transport';
import { TransportService } from '../../../services/api/transport/transport.service';
import { Truck } from 'src/app/data/shared/truck';
import { GlobalSpinnerService } from 'src/app/services/global-spinner/global-spinner.service';

export interface HomeComponentData {
  selectedLicensePlate: string;
  result: string;
}

@Component({
  selector: 'm-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent extends BaseComponent<HomeComponentData> implements OnInit {
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
    this.spinnerService.hide();
    let url = '';
    if (this.selectedLicensePlate) {
      if (this.result === 'T') {
        url = `transport-selection/plate-number/${this.selectedLicensePlate}`;
      } else if (this.result === 'P') {
        url = `parking-selection/plate-number/${this.selectedLicensePlate}`;
      } else if (this.result === 'S') {
        url = `store-entrance-empty/plate-number/${this.selectedLicensePlate}`;
      }
    }

    this.router.navigate([url], {
      state: {
        title: this.selectedLicensePlate
      }
    });
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
          if (this.navigationStateService.getNavigationParams() &&
              this.navigationStateService.getNavigationParams().number) {
            this.selectedLicensePlate = this.navigationStateService.getNavigationParams().number;
          }
        }))
      .subscribe();
  }

}
