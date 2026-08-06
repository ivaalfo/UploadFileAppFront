import { Injectable } from '@angular/core';
import { CanActivate,
         ActivatedRouteSnapshot,
         RouterStateSnapshot,
         Router,
         CanActivateChild} from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { UserRoles } from '@data/user-roles';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate, CanActivateChild  {

  public constructor(private router: Router, private readonly authService: AuthService) { }
  public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const roles = route.data.roles as string[];
    const userRoles = this.authService.getRoles();
    if (userRoles.length > 0) {
      for (const rol of roles) {
        if (userRoles.includes(rol)) {
          return true;
        }
      }
    } else {
      return true;
    }

    const regex = /(\b\/.*\b)/g;
    const url = (userRoles[0] === UserRoles.Admin/*UserRoles.Conductor*/) ? '/auth/login' : state.url.replace(regex, '');
    this.router.navigate([url]);
    return false;
  }

  public canActivateChild(route: ActivatedRouteSnapshot) {
    const roles = route.data.roles as string[];
    const userRoles = this.authService.getRoles();
    if (userRoles.length > 0) {
      for (const rol of roles) {
        if (userRoles.includes(rol)) {
          return true;
        }
      }
    } else {
      return true;
    }

/*     const regex = /(\b\/.*\b)/g;
    const url = (userRoles[0] === UserRoles.Conductor) ? '/auth/login' : state.url.replace(regex, '');
    this.router.navigate([url]); */
    return false;
  }
}
