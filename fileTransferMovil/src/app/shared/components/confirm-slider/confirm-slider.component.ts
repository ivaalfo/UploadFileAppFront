import { AfterViewInit, Component, ElementRef, ViewChild, Output, EventEmitter, OnInit } from '@angular/core';
import { ConfirmSliderService } from './confirm-slider.service';

@Component({
  selector: 'm-confirm-slider',
  templateUrl: './confirm-slider.component.html',
  styleUrls: ['./confirm-slider.component.scss']
})

export class ConfirmSliderComponent implements AfterViewInit, OnInit {

  @ViewChild('pullee', { static: true }) public pullee: ElementRef;
  private currentValue: number;
  private maxValue = 200;
  private speed = 12;
  private animationFrameID: number;
  private inputRange: any;

  public disabled = true;
  public visibility = true;
  public textSlider = 'HOME.ACCEPT';

  public constructor(private confirmSliderService: ConfirmSliderService) { }

  public ngOnInit(): void {
    this.confirmSliderService.getEnabled()
      .subscribe(enabled => this.disabled = !enabled);

    this.confirmSliderService.getVisibility()
    .subscribe(visible => this.visibility = !visible);

    this.confirmSliderService.getTextSlider()
    .subscribe(text => this.textSlider = text);
  }

  public ngAfterViewInit(): void {
    this.inputRange = this.pullee.nativeElement;

    // set min/max value
    this.inputRange.min = 0;
    this.inputRange.max = this.maxValue;

    // bind events
    this.inputRange.addEventListener('mousedown', this.unlockStartHandler.bind(this));
    this.inputRange.addEventListener('mousestart', this.unlockStartHandler.bind(this));
    this.inputRange.addEventListener('mouseup', this.unlockEndHandler.bind(this));
    this.inputRange.addEventListener('touchend', this.unlockEndHandler.bind(this));
  }

  private unlockStartHandler(): void {
    // clear raf if trying again
    window.cancelAnimationFrame(this.animationFrameID);
    // set to desired value
    this.currentValue = +this.inputRange.value;
  }

  private unlockEndHandler(): void {
    // store current value
    this.currentValue = +this.inputRange.value;
    // determine if we have reached success or not
    if (this.currentValue >= this.maxValue) {
      this.confirmedHandler();
    } else {
      this.animationFrameID = window.requestAnimationFrame(this.animateHandler.bind(this));
    }
  }

  private animateHandler(): void {
    // update input range
    this.inputRange.value = this.currentValue;

    // determine if we need to continue
    if (this.currentValue > -1) {
      window.requestAnimationFrame(this.animateHandler.bind(this));
    }
    // decrement value
    this.currentValue = this.currentValue - this.speed;
  }

  private confirmedHandler(): void {
    this.confirmSliderService.confirm();
    this.inputRange.value = 0;
  }
}
