import { Component, OnInit } from '@angular/core';
import { GlobalSpinnerService } from 'src/app/services/global-spinner/global-spinner.service';

@Component({
  selector: 'm-global-spinner',
  templateUrl: 'global-spinner.component.html',
  styleUrls: ['./global-spinner.component.scss']
})
export class GlobalSpinnerComponent implements OnInit {

  public show = false;
  public global = true;

  public constructor(
    private readonly globalSpinnerService: GlobalSpinnerService
  ) { }

  public ngOnInit() {
    this.globalSpinnerService.getSpinner()
      .subscribe(show => {
        this.show = show;
      });

    this.globalSpinnerService.globalSpinner()
      .subscribe(global => {
        this.global = global;
      });
  }
}
