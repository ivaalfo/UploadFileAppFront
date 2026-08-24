import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ConfirmSliderComponent } from './components/confirm-slider/confirm-slider.component';
import { LegendComponent } from './components/legend/legend.component';
import { SelectComponent } from './components/select/select.component';
import { SeparatorComponent } from './components/separator/separator.component';
import { InfoCardComponent } from './components/info-card/info-card.component';
import { TranslateModule } from '@ngx-translate/core';
import { SpinnerComponent } from '../shared/components/spinner/spinner.component';
import { NgxQRCodeModule } from 'ngx-qrcode2';
import { ContainerSelectComponent } from './components/container-select/container-select.component';
import { TruckSelectComponent } from './components/truck-select/truck-select.component';
import { StoreSelectComponent } from './components/store-select/store-select.component';

@NgModule({
  imports: [CommonModule, TranslateModule, NgxQRCodeModule],
  exports: [LegendComponent,
            SeparatorComponent,
            SelectComponent,
            ConfirmSliderComponent,
            InfoCardComponent,
            SpinnerComponent,
            ContainerSelectComponent,
            TruckSelectComponent,
            StoreSelectComponent],
  declarations: [LegendComponent,
               SeparatorComponent,
               SelectComponent,
               ConfirmSliderComponent,
               InfoCardComponent,
               SpinnerComponent,
               ContainerSelectComponent,
               TruckSelectComponent,
               StoreSelectComponent],
  providers: [],
})
export class SharedModule { }
