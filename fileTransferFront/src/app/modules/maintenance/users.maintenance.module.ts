import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '@shared/shared.module';
import { FormsModule } from '@angular/forms';
import { UserFormComponent } from './pages/users/components/user-form/user-form.component';
import { UsersMaintenanceComponent } from './pages/users/users-maintenance.component';
import { UserMaintenanceRoutingModule } from './users.maintenance.routing';


@NgModule({
  declarations: [
    UsersMaintenanceComponent,
    UserFormComponent,
  ],
  imports: [
    UserMaintenanceRoutingModule,
    SharedModule,
    TranslateModule,
    FormsModule
  ],
  exports: [],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserMaintenanceModule { }
