import { Component, OnInit } from '@angular/core';
import { Languages } from '@ecna_npm/entralm-shared';
import { TranslateService } from '@ngx-translate/core';
import { PWAService } from './services/pwa.service';
import { NavigationStateService } from './services/navigation-state.service';
import { Router } from '@angular/router';

@Component({
  selector: 'm-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  public hasPromptEvent = false;

  private promptEvent: any;
  private userChoice: string;

  public constructor(
    translate: TranslateService,
    private pwaService: PWAService,
    private navigationStateService: NavigationStateService,
    private router: Router
  ) {
    translate.setDefaultLang(Languages.ES);
    translate.use(Languages.ES);
  }

  public ngOnInit(): void {
    this.suscribeToEvents();
    this.checkNavigationState();
  }

  public onInstallClicked(): void {
    this.promptEvent.prompt();
  }

  public get showInstallButton(): boolean {
    return this.hasPromptEvent && this.userChoice !== 'accepted';
  }

  private suscribeToEvents(): void {
    this.pwaService.getPrompEvent()
      .subscribe((promptEvent: Event) => {
        this.promptEvent = promptEvent;
        this.hasPromptEvent = true;

        this.promptEvent.userChoice
          .then(choice => {
            this.userChoice = choice.outcome;
          });
      });
  }

  private checkNavigationState(): void {
    const url = this.navigationStateService.getNavigationStateUrl();
    const params = this.navigationStateService.getNavigationParams();

    const state = this.hasParams(params)
      ? {
        state: {
          title: params[Object.keys(params)[0]]
        }
      }
      : {};

    if (url) {
      this.router.navigate([url], state);
    }
  }

  private hasParams(params: any): boolean {
    if (!params) {
      return false;
    }

    return Object.keys(params).length > 0;
  }
}
