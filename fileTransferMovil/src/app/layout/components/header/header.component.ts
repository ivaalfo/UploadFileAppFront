import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterEvent, NavigationExtras } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '@ecna_npm/entralm-shared';
import { NavigationStateService } from 'src/app/services/navigation-state.service';

@Component({
  selector: 'm-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent {

  private headerTitle: string;
  private selectedLicensePlate: string;

  public constructor(
    private router: Router,
    private authService: AuthService,
    protected navigationStateService: NavigationStateService) {
    this.router.events
      .subscribe((event: RouterEvent) => {
        if (event instanceof NavigationEnd) {
          this.headerTitle = this.getHeaderTitle();
        }
      });
  }

  public get title(): string {
    return this.headerTitle ? this.headerTitle : 'CPT';
  }

  private getHeaderTitle(): string {
    const extras: NavigationExtras = this.router.getCurrentNavigation().extras;
    return extras
      ? extras.state
        ? extras.state.title
        : null
      : null;
  }

  public logout(): void {
    this.authService.logout()
      .pipe(
        finalize(() => this.router.navigate(['/auth/login']))
      ).subscribe();
  }
  public goToNext() {
    this.selectedLicensePlate = this.navigationStateService.getNavigationParams().number;
    if (this.selectedLicensePlate) {
      this.router.navigate([`/plate-number/${this.selectedLicensePlate}`], {
        state: {
          title: this.selectedLicensePlate
        }
      });
    } else {
      this.router.navigate(['/']);
    }
  }
}
