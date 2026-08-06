import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../shared/shared.module';
import { LoginInputComponent } from './components/input/login-input.component';
import { LoginComponent } from './pages/login/login.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';

@NgModule({
  declarations: [
    LoginComponent,
    LoginInputComponent,
    AuthLayoutComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    TranslateModule,
    RouterModule
  ],
  exports: [
    RouterModule,
    LoginComponent,
    LoginInputComponent,
    AuthLayoutComponent
  ]
})
export class AuthModule { }
