import { Injectable } from '@angular/core';
import { Observable, fromEvent, merge, Subject, timer, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IdleService {
  public expired$: Subject<boolean> = new Subject<boolean>();
  private idle$: Observable<any> = new Observable<any>();
  private timer$: Subscription = new Subscription();
  private timeOutMilliSeconds = 0;
  private idleSubscription$: Subscription = new Subscription();
  // Variables to detect user activity
  private eventInactivitySeconds = 0;
  private timeToCheckIsUserActive = 0;
  private timerIsUserActive$: Subscription = new Subscription();
  public isUserActive$: Subject<boolean> = new Subject<boolean>();
  private inactivityInterval!: ReturnType<typeof setInterval>;

  private constructor() {}

  public startWatching(timeOutBackMs: number): Observable<any> {
    this.expired$ = new Subject<boolean>();
    this.isUserActive$ = new Subject<boolean>();

    this.idle$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'click'),
      fromEvent(document, 'mousedown'),
      fromEvent(document, 'keypress'),
      fromEvent(document, 'DOMMouseScroll'),
      fromEvent(document, 'mousewheel'),
      fromEvent(document, 'touchmove'),
      fromEvent(document, 'MSPointerMove'),
      fromEvent(window, 'mousemove'),
      fromEvent(window, 'resize')
    );

    // Tiempo máximo de bloqueo
    this.timeOutMilliSeconds = timeOutBackMs;
    // le restamos 10 segundos al tiempo maximo de bloqueo del back para que continue antes de que este acabe el bloqueo
    this.timeToCheckIsUserActive = timeOutBackMs - 10000;

    this.idleSubscription$ = this.idle$.subscribe(() => {
      this.resetEventInactivitySeconds();
      this.resetTimer();
    });
    //console.log("START WATCHING HORA: " + new Date());
    this.initInactivityTemporizer();
    this.startTimerIsUserActive();

    return this.expired$;
  }

  public stopWatching() {
    //console.log('STOP WATCHING');
    this.timer$.unsubscribe();
    this.expired$.unsubscribe();
    this.idleSubscription$.unsubscribe();
    this.isUserActive$.unsubscribe();
    this.timerIsUserActive$.unsubscribe();
    this.resetEventInactivitySeconds();
    this.finishInactivityTemporizer();
  }

  private resetTimer() {
    this.timer$.unsubscribe();
  }

  private startTimerIsUserActive() {
    this.timerIsUserActive$ = timer(
      this.timeToCheckIsUserActive,
      this.timeToCheckIsUserActive
    ).subscribe(() => {
      this.isUserActive$.next(
        this.eventInactivitySeconds < this.timeOutMilliSeconds / 1000
          ? true
          : false
      );
    });
  }

  private initInactivityTemporizer() {
    this.finishInactivityTemporizer();
    this.inactivityInterval = setInterval(() => {
      //console.log('TIEMPO: ' + this.eventInactivitySeconds);
      this.addOneSecond();
      this.eventInactivityTimeOut();
    }, 1000);
  }

  private finishInactivityTemporizer() {
    if (this.inactivityInterval) {
      clearInterval(this.inactivityInterval);
    }
  }

  private addOneSecond() {
    this.eventInactivitySeconds = this.eventInactivitySeconds + 1;
  }

  private resetEventInactivitySeconds() {
    this.eventInactivitySeconds = 0;
  }

  private eventInactivityTimeOut() {
    if (this.eventInactivitySeconds >= this.timeOutMilliSeconds / 1000) {
      this.expired$.next(true);
    }
  }
}
