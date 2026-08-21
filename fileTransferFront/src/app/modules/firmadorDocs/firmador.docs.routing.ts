import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PantallaFirmaComponent } from './pages/pantallaFirma/pages/pantallaFirma/pantalla.firma.component';

export const routes: Routes = [
  {
    path: '',
    component: PantallaFirmaComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FirmadorDocsRoutingModule { }
