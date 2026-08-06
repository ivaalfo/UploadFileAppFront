import { Component, OnInit } from '@angular/core';
import { GlobalSpinnerService } from '@core/services/global-spinner/global-spinner.service';

@Component({
  selector: 'm-global-spinner',
  templateUrl: 'global-spinner.component.html',
  styleUrls: ['./global-spinner.component.scss']
})
export class GlobalSpinnerComponent implements OnInit {

  public show = false;

  public constructor(
    private readonly globalSpinnerService: GlobalSpinnerService
  ) { }

  public ngOnInit() {
    this.globalSpinnerService.getSpinner()
      .subscribe(show => {
        this.show = show;
      });
  }

}
