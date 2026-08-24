import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { VentilationPickupComponent } from './components/ventilation-pickup/ventilation-pickup.component';
import { StoreEntranceComponent } from './components/store-entrance/store-entrance.component';
import { TruckInDockComponent } from './components/truck-in-dock/truck-in-dock.component';
import { TerminalExitComponent } from './components/terminal-exit/terminal-exit.component';
import { ContainerFullComponent } from './components/container-full/container-full.component';
import { ArriveComponent } from './components/arrive/arrive.component';
import { PifScannerComponent } from './components/pif-scanner/pif-scanner.component';
import { ExitComponent } from './components/exit/exit.component';
import { ReturnTerminalComponent } from './components/return-terminal/return-terminal.component';
import { ContainerEmptyComponent } from './components/container-empty/container-empty.component';
import { DownloadVentilationComponent } from './components/download-ventilation/download-ventilation.component';
import { WaitGasStateComponent } from './components/wait-gas-state/wait-gas-state.component';
import { CamaraScanComponent } from './components/camaraScan/camara-scan/camara-scan.component';
import { WaitAssignDockComponent } from './components/wait-assign-dock/wait-assign-dock.component';
import { ParkingZoneSelectionComponent } from './pages/parking-zone/parking-zone-selection.component';
import { ParkingZoneComponent } from './components/parking-zone/parking-zone.component';
import { StoreEntranceEmptyComponent } from './pages/store-entrance-empty/store-entrance-empty.component';
import { TransportSelectionComponent } from './pages/transport-selection/transport-selection.component';
import { PickParkingVentilationComponent } from './components/pick-parking-ventilation/pick-parking-ventilation.component';
// NEW TIMER OK
import { TimerCheckComponent } from './components/timer-check/timer-check.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    // NEW TIMER OK:
    path: 'timer-check/plate-number/:number/:transportNi',
    component: TimerCheckComponent
  },
  {
    path: 'plate-number/:number',
    component: HomeComponent
  },
  {
    path: 'transport-selection/plate-number/:number',
    component: TransportSelectionComponent
  },
  {
    path: 'parking-selection/plate-number/:number',
    component: ParkingZoneSelectionComponent
  },
  {
    path: 'store-entrance-empty/plate-number/:number',
    component: StoreEntranceEmptyComponent
  },
  {
    path: 'ventilation-pickUp/plate-number/:number/:transportNi',
    component: VentilationPickupComponent
  },
  {
    path: 'store-entrance/plate-number/:number/:transportNi',
    component: StoreEntranceComponent
  },
  {
    path: 'parking-zone/plate-number/:number/:transportNi',
    component: ParkingZoneComponent
  },
  {
    path: 'parking-zone/not/plate-number/:number/:transportNi',
    component: PickParkingVentilationComponent
  },
  {
    path: 'wait-assign-dock/plate-number/:number/:transportNi',
    component: WaitAssignDockComponent
  },
  {
    path: 'inDock/plate-number/:number/:transportNi',
    component: TruckInDockComponent
  },
  {
    path: 'terminal-exit/plate-number/:number/:transportNi',
    component: TerminalExitComponent
  },
  {
    path: 'container-full/plate-number/:number/:transportNi',
    component: ContainerFullComponent
  },
  {
    path: 'arrive/plate-number/:number/:transportNi',
    component: ArriveComponent
  },
  {
    path: 'pif-scanner/plate-number/:number/:transportNi',
    component: PifScannerComponent
  },
  {
    path: 'exit/plate-number/:number/:transportNi',
    component: ExitComponent
  },
  {
    path: 'returnTerminal/plate-number/:number/:transportNi',
    component: ReturnTerminalComponent
  },
  {
    path: 'container-empty/plate-number/:number/:transportNi',
    component: ContainerEmptyComponent
  },
  {
    path: 'download-ventilation/plate-number/:number/:transportNi',
    component: DownloadVentilationComponent
  },
  {
    path: 'wait-gas-state/plate-number/:number/:transportNi',
    component: WaitGasStateComponent
  },
  {
    path: 'camara-scan/plate-number/:number/:transportNi/:dock',
    component: CamaraScanComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
