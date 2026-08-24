import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponent } from '../../../../core/components/base.component';
import { NavigationStateService } from '../../../../services/navigation-state.service';
import { ConfirmSliderService } from '../../../../shared/components/confirm-slider/confirm-slider.service';

@Component({
  selector: 'm-task',
  templateUrl: './task.component.html',
  styleUrls: ['../task.component.scss']
})

export class TaskComponent extends BaseComponent {

  public constructor(
    protected confirmSliderService: ConfirmSliderService,
    protected router: Router,
    protected navigationStateService: NavigationStateService) {
    super(confirmSliderService, router, navigationStateService);
  }

  protected dataIsValid(): boolean {
    return true;
  }

  protected onConfirmed(): void {
  }

  protected initData(): void {
  }

  protected onDataSet(): void {
  }

}
