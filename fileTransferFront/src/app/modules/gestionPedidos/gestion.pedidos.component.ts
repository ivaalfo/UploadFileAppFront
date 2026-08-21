import { Component, OnInit } from '@angular/core';
import { AuthService } from '@core/services/auth/auth.service';
import { UserRoles } from '@data/user-roles';

@Component({
  selector: 'm-gestion-pedidos',
  templateUrl: './gestion.pedidos.component.html',
  styleUrls: ['./gestion.pedidos.component.scss']
})
export class GestionPedidosComponent implements OnInit {

  public constructor(
    private readonly authService: AuthService,
  ) { }

  public ngOnInit() {
  }

  public get canViewPedidosActivos(): boolean {
    return (this.authService.hasRole(UserRoles.Admin) 
      || this.authService.hasRole(UserRoles.Interno)
      || this.authService.hasRole(UserRoles.Consulta)
      || this.authService.hasRole(UserRoles.Externo)
    );
  }

  public get canViewPedidosValidador(): boolean {
    return (this.authService.hasRole(UserRoles.Admin) 
      || this.authService.hasRole(UserRoles.Interno)
      || this.authService.hasRole(UserRoles.Consulta)
    );
  }
  
  public get canViewPedidosHistorico(): boolean {
    return (this.authService.hasRole(UserRoles.Admin) 
      || this.authService.hasRole(UserRoles.Interno)
      || this.authService.hasRole(UserRoles.Consulta)
      || this.authService.hasRole(UserRoles.Externo)
    );
  }

}
