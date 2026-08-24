import { Component, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/core/components/base.component';
import { GasState, TransportState, TransportPoint } from 'src/app/data/transport-point';
import { Transport } from '../../../../data/shared/transport';
import { ConfirmSliderService } from 'src/app/shared/components/confirm-slider/confirm-slider.service';
import { Router } from '@angular/router';
import { NavigationStateService } from 'src/app/services/navigation-state.service';
import { TransportService } from 'src/app/services/api/transport/transport.service';
import { take, tap, map, finalize } from 'rxjs/operators';
import { sortArrayBy } from 'src/app/shared/utils/array-utils';
import { GlobalSpinnerService } from 'src/app/services/global-spinner/global-spinner.service';

export interface TransportSelectionComponentData {
  selectedLicensePlate: string;
  selectedTransport: Transport;
}

@Component({
  selector: 'm-transport-selection',
  templateUrl: './transport-selection.component.html',
  styleUrls: ['./transport-selection.component.scss']
})
export class TransportSelectionComponent extends BaseComponent<TransportSelectionComponentData> implements OnInit {

  public get hasTransportsFull(): boolean {
    return (this.fulltransports.length !== 0) ? true : false;
  }
  public get hasTransports(): boolean {
    return (this.alltransports.length !== 0) ? true : false;
  }
  public get hasTransportsEmpty(): boolean {
    return (this.emptytransports.length !== 0) ? true : false;
  }
  public selectedLicensePlate: string;
  public selection: string;

  public alltransports: Transport[] = [];
  public fulltransports: Transport[] = [];
  public emptytransports: Transport[] = [];

  public firstEmptyT!: Transport;

  public selectedTransport!: Transport;
  public titleLabel!: string;

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
    this.getTransports();
  }

  public get firstFullTranport(): Transport {
    return this.fulltransports.sort(sortArrayBy('orden'))[0];
  }

  public get firstEmptyTranport(): Transport {
    //Transporte asignado:
    //El primer contenedor vacio en orden de prioridad
    this.firstEmptyT = this.emptytransports.sort(sortArrayBy('orden'))[0];

    //A menos que ya tenga uno en TRV
    for(let i=0; i<this.emptytransports.length; i++) {
      if(this.emptytransports[i].contEstadoCod === 'TRV'){
        this.firstEmptyT = this.emptytransports[i];
      }
    }

    return this.firstEmptyT;
  }

  public selectFull(): void {
    this.selection = 'F';
    this.selectedTransport = this.firstFullTranport;
    this.data.selectedTransport = this.selectedTransport;
    this.saveData(this.data);
    this.checkDataIsValid();
  }

  public selectEmpty(): void {
    this.selection = 'E';
    this.selectedTransport = this.firstEmptyTranport;
    this.data.selectedTransport = this.selectedTransport;
    this.saveData(this.data);
    this.checkDataIsValid();
  }

  protected dataIsValid(): boolean {
    return !!this.selectedTransport;
  }

  protected onConfirmed(): void {
    this.spinnerService.show();
    this.goToNext();
  }

  private goToNext(): void {
    this.spinnerService.hide();
    let url = '';
    if (this.selectedTransport) {
      const state = this.selectedTransport.hisEstadoCod;
      const origin = this.selectedTransport.origenTipo;
      const destiny = this.selectedTransport.destinoTipo;

      if (state) {
        switch (state) {
          case TransportState.RECTER:
            // al fin del paso 1
            // NEW TIMER OK::
            url = `timer-check/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
            break;
          case TransportState.ENAALM:
            // al fin del paso 2
            // NEW TIMER OK::
            url = `timer-check/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
            break;
          case TransportState.ENTPIF:
            // al fin del paso 4
            url = `pif-scanner/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
            break;
          case TransportState.RESPIF:
            // al fin del paso 5
            url = `exit/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
            break;
          case TransportState.SALPIF:
            // al fin del paso 6
            url = this.finalStept6();
            break;
          case TransportState.RECVEN:
            // al fin del paso 9
            url = `store-entrance/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
            break;
          case TransportState.RECVAC:
            // al fin del paso 10
            // NEW TIMER OK::
            url = `timer-check/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
            break;
          case TransportState.ELEPRK:
            // al fin del paso 12
            url = this.finalStept12();
            break;
          case TransportState.ENEPRK:
            // al fin del paso 12
            url = this.finalStept12();
            break;
          case TransportState.RECPRK:
            // al fin del paso 12
            // NEW TIMER OK::
            url = `timer-check/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
            break;
          case TransportState.ENEVEN:
            // al inicio del paso 9
            url = `ventilation-pickUp/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
            break;
        }
      } else {
        if (origin === TransportPoint.Gas) {
          // STEP 9
          url = `ventilation-pickUp/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
        } else if (destiny === TransportPoint.Gas) {
          // STEP 8
          url = `download-ventilation/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
        } else if (origin === TransportPoint.Terminal) {
          // STEP 1
          url = `terminal-exit/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
        } else if ((origin === TransportPoint.Store && destiny === TransportPoint.Store) ||
          (origin === TransportPoint.Pif && destiny === TransportPoint.Store)) {
          // STEP 2
          url = `store-entrance/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
        } else if (origin === TransportPoint.Store && destiny === TransportPoint.TerminalV && this.selectedTransport.devolucion) {
          // STEP 10
          url = `container-full/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
        } else if (origin === TransportPoint.Pif) {
          // al fin del paso 6
          url = this.finalStept6();
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
      selectedTransport: null
    };
  }

  protected onDataSet(): void {
    this.selectedLicensePlate = this.data.selectedLicensePlate;
    this.selectedTransport = this.data.selectedTransport;
  }

  private getTransports() {
    this.selectedLicensePlate = this.navigationStateService.getNavigationParams().number;
    this.transportService.getTransportsByLicense(this.selectedLicensePlate)
      .pipe(
        take(1),
        tap(trucks => this.alltransports = trucks),
        map(() => {
          this.fulltransports = this.alltransports.filter(a => a.devolucion === false);
          this.emptytransports = this.alltransports.filter(a => a.devolucion === true);
        }),
        finalize(() => {
          if (this.alltransports.length !== 0) {
            this.titleLabel = 'HOME.SELECT_TRANSPORT';
          } else {
            this.titleLabel = 'HOME.NOTICE';
          }
        }))
      .subscribe();
  }
  /*   private getUniqueLicensePlates(allTransports: Transport[]): Transport[] {
      const uniquePlateTransports: Transport[] = [];
      let exists = true;

      allTransports.forEach((transport, tIndex) => {
        if (uniquePlateTransports.length !== 0) {
          exists = false;
          uniquePlateTransports.forEach((unique, uIndex) => {
            if (transport.matricula === unique.matricula) {
              exists = true;
              if (transport.orden < unique.orden) {
                uniquePlateTransports[uIndex] = transport;
              }
            }
          });
        } else {
          uniquePlateTransports.push(transport);
        }
        if (!exists) {
          uniquePlateTransports.push(transport);
        }
      });
      return uniquePlateTransports;
    } */

  private finalStept6(): string {
    const destiny = this.selectedTransport.destinoTipo;
    if (destiny === TransportPoint.Terminal) {
      return `returnTerminal/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
    } else if (destiny === TransportPoint.Store) {
      return `store-entrance/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
    }
  }

  private finalStept12(): string {
    const gases = this.selectedTransport.gasesEstadoCod;
    if (gases === GasState.Ok) {
      // Confirmar camión en muelle
      return `wait-assign-dock/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
    } else if (gases === GasState.NOK) {
      // Ventilation or Parking
      return `parking-zone/not/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
    } else {
      // A la espera de resultado de gases
      return `wait-gas-state/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
    }
  }
/*   private finalStept12_1(): string {
    const gases = this.selectedTransport.gasesEstadoCod;
    if (gases === GasState.Ok) {
      // Confirmar camión en muelle
      return `wait-assign-dock/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
    } else if (gases === GasState.NOK) {
      return `download-ventilation/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
    } else {
      // A la espera de resultado de gases
      return `wait-gas-state/plate-number/${this.selectedLicensePlate}/${this.selectedTransport.transporteNi}`;
    }
  } */
}
