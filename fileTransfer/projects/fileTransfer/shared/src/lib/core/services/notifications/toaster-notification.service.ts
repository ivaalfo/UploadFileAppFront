import { Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import { Notification, NotificationType } from './toaster-notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly subject = new Subject<Notification>();
  private keepAfterRouteChange = true;

  public constructor(
    router: Router
  ) {
    router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        if (this.keepAfterRouteChange) {
          this.keepAfterRouteChange = false;
        } else {
          this.clear();
        }
      }
    });
  }

  public getAlert(): Observable<Notification> {
    return this.subject.asObservable();
  }

  public success(message: string, keepAfterRouteChange = true, closeAfterTime = true) {
    this.showNotification(NotificationType.Success, message, keepAfterRouteChange, closeAfterTime);
  }

  public error(message: string, keepAfterRouteChange = true, closeAfterTime = true) {
    this.showNotification(NotificationType.Error, message, keepAfterRouteChange, closeAfterTime);
  }

  public info(message: string, keepAfterRouteChange = true, closeAfterTime = true) {
    this.showNotification(NotificationType.Info, message, keepAfterRouteChange, closeAfterTime);
  }

  public warn(message: string, keepAfterRouteChange = true, closeAfterTime = true) {
    this.showNotification(NotificationType.Warning, message, keepAfterRouteChange, closeAfterTime);
  }

  public clear() {
    this.subject.next();
  }

  private showNotification(type: NotificationType, message: string, keepAfterRouteChange = false, closeAfterTime = true) {
    this.keepAfterRouteChange = keepAfterRouteChange;
    this.subject.next(new Notification(type, message, closeAfterTime));
  }
}
