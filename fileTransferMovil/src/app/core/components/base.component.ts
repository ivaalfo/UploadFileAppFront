import { OnDestroy, OnInit } from '@angular/core';
import { ActivationEnd, NavigationEnd, Router, RouterEvent } from '@angular/router';
import { NavigationStateService } from '../../services/navigation-state.service';
import { ConfirmSliderService } from '../../shared/components/confirm-slider/confirm-slider.service';
import { Subscription } from 'rxjs';

export abstract class BaseComponent<TData = any> implements OnInit, OnDestroy {
  protected data: TData;
  protected confirmSliderVisible = true;
  protected textSlider = 'HOME.ACCEPT';

  private getConfirmSubscription: Subscription;

  public constructor(
    protected confirmSliderService: ConfirmSliderService,
    protected router: Router,
    protected navigationStateService: NavigationStateService) { }

  public ngOnInit(): void {
    this.confirmSliderService.setEnabled(false);
    this.confirmSliderService.setTextSlider(this.textSlider);
    this.confirmSliderService.setVisibility(this.confirmSliderVisible);
    this.getConfirmSubscription = this.confirmSliderService.getConfirm()
      .subscribe(() => this.onConfirmed());

    this.router.events
      .subscribe((event: RouterEvent) => {
        if (event instanceof NavigationEnd) {
          this.navigationStateService.saveNavigationStateUrl(event.url);
        }

        if (event instanceof ActivationEnd) {
          if (Object.entries(event.snapshot.params).length > 0) {
            this.navigationStateService.saveNavigationParams(event.snapshot.params);
          }
        }
      });

    this.initData();
    this.setData();
  }

  public ngOnDestroy(): void {
    this.getConfirmSubscription.unsubscribe();
    this.navigationStateService.removeNavigationState();
  }

  protected checkDataIsValid(): void {
    if (this.dataIsValid()) {
      this.confirmSliderService.setEnabled(true);
    }
  }

  protected saveData(data: any): void {
    this.navigationStateService.saveNavigationData(data);
  }

  protected abstract onConfirmed(): void;

  protected abstract dataIsValid(): boolean;

  protected abstract initData(): void;

  protected abstract onDataSet(): void;

  private setData(): void {
    const data: TData = this.navigationStateService.getNavigationData();
    if (data) {
      this.data = data;
      this.onDataSet();
      this.checkDataIsValid();
    }
  }

  protected onBackError(selectedLicensePlate: string): void {
    const url = `/plate-number/${selectedLicensePlate}`;
    this.router.navigate([url], {
      state: {
        title: selectedLicensePlate
      }
    });
  }

}
