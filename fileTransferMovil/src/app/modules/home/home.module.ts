import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { TaskComponent } from './components/task/task.component';
import { HomeRoutingModule } from './home.routing';
import { HomeComponent } from './pages/home.component';
import { VentilationPickupComponent } from './components/ventilation-pickup/ventilation-pickup.component';
import { TranslateModule } from '@ngx-translate/core';
import { StoreEntranceComponent } from './components/store-entrance/store-entrance.component';
import { TruckInDockComponent } from './components/truck-in-dock/truck-in-dock.component';
import { TerminalExitComponent } from './components/terminal-exit/terminal-exit.component';
import { ContainerFullComponent } from './components/container-full/container-full.component';
import { ArriveComponent } from './components/arrive/arrive.component';
import { PifScannerComponent } from './components/pif-scanner/pif-scanner.component';
import { CommonModule } from '@angular/common';
import { ExitComponent } from './components/exit/exit.component';
import { ReturnTerminalComponent } from './components/return-terminal/return-terminal.component';
import { ContainerEmptyComponent } from './components/container-empty/container-empty.component';
import { DownloadVentilationComponent } from './components/download-ventilation/download-ventilation.component';
import { WaitGasStateComponent } from './components/wait-gas-state/wait-gas-state.component';
import { BarecodeScannerLivestreamModule } from 'ngx-barcode-scanner';
import { CamaraScanComponent } from './components/camaraScan/camara-scan/camara-scan.component';
import { WaitAssignDockComponent } from './components/wait-assign-dock/wait-assign-dock.component';
//import { SelectionPageComponent } from './pages/selection-page/selection-page.component';
import { ParkingZoneComponent } from './components/parking-zone/parking-zone.component';
import { ParkingZoneSelectionComponent } from './pages/parking-zone/parking-zone-selection.component';
import { StoreEntranceEmptyComponent } from './pages/store-entrance-empty/store-entrance-empty.component';
import { TransportSelectionComponent } from './pages/transport-selection/transport-selection.component';
import { PickParkingVentilationComponent } from './components/pick-parking-ventilation/pick-parking-ventilation.component';
// NEW TIMER OK
import { TimerCheckComponent } from './components/timer-check/timer-check.component';

@NgModule({
  imports: [
    HomeRoutingModule,
    SharedModule,
    TranslateModule,
    CommonModule,
    BarecodeScannerLivestreamModule
     ],
  exports: [],
  declarations: [
    HomeComponent,
    TaskComponent,
    VentilationPickupComponent,
    StoreEntranceComponent,
    TruckInDockComponent,
    TerminalExitComponent,
    ContainerFullComponent,
    ArriveComponent,
    PifScannerComponent,
    ExitComponent,
    ReturnTerminalComponent,
    ContainerEmptyComponent,
    DownloadVentilationComponent,
    WaitGasStateComponent,
    CamaraScanComponent,
    WaitAssignDockComponent,
    //SelectionPageComponent,
    ParkingZoneComponent,
    ParkingZoneSelectionComponent,
    StoreEntranceEmptyComponent,
    TransportSelectionComponent,
    PickParkingVentilationComponent,
    // NEW TIMER OK
    TimerCheckComponent
  ],
  providers: [],
})
export class HomeModule { }
