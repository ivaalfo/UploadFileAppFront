import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, AuthLayoutComponent, LoginComponent } from '@ecna_npm/entralm-shared';
import { ContentLayoutComponent } from './layout/content-layout/content-layout.component';

const routes: Routes = [
  {
    path: '',
    component: ContentLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('@modules/home/home.module').then(m => m.HomeModule)
      }
    ]
  },
  {
    path: 'auth/login',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        component: LoginComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true, enableTracing: false })],
  exports: [RouterModule],
  declarations: [],
  providers: [],
})
export class AppRoutingModule { }
