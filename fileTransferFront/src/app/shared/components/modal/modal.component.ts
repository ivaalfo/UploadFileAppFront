import { Component, Input, Output, EventEmitter, HostListener, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ModalAction } from './modal-action';

@Component({
  selector: 'm-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit, OnDestroy {

  @Input()
  public header!: string;

  @Input()
  public data!: string[];

  @Input()
  public opener$!: Observable<ModalAction>;

  @Input()
  public cancelOnExternalCLick = false;

  @Input()
  public canClose = true;

  @Output()
  public closed = new EventEmitter();

  @HostBinding('class.modal--show')
  public get modalShownClass(): boolean {
    return this.isModalShown;
  }

  public isModalShown = false;
  private showSubscription!: Subscription;

  public ngOnInit(): void {
    this.showSubscription = this.opener$.subscribe(action => {
      if (action === ModalAction.Open) {
        this.isModalShown = true;
      } else {
        this.isModalShown = false;
      }
    });
  }

  public ngOnDestroy(): void {
    this.showSubscription.unsubscribe();
  }

  @HostListener('document:keydown.escape', [])
  public onEscapeKeydown() {
    this.close();
  }

  @HostListener('click', ['$event'])
  public onClick(event: Event) {
    const element = event.target as HTMLElement;
    if (this.cancelOnExternalCLick && element.tagName === 'M-MODAL') {
      this.close();
    }
  }

  public close(): void {
    if (this.canClose) {
      this.isModalShown = false;
      this.closed.emit();
    }
  }
}
