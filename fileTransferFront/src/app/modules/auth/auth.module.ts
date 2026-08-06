import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SharedModule } from '@shared/shared.module';
import { LoginComponent } from './pages/login/login.component';
import { AuthRoutingModule } from './auth.routing';
import { LoginInputComponent } from './components/input/login-input.component';

@NgModule({
  declarations: [
    LoginComponent,
    LoginInputComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    SharedModule,
    TranslateModule
  ]
})
export class AuthModule { }
