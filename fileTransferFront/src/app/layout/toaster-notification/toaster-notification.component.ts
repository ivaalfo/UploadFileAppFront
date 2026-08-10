import { Component, OnInit } from '@angular/core';

import { Notification, NotificationType } from '@core/services/notifications/toaster-notification';
import { NotificationService } from '@core/services/notifications/toaster-notification.service';

const TOASTER_NOTIFICATION_TIME = 6600;

@Component({
  selector: 'm-toaster-notification',
  templateUrl: 'toaster-notification.component.html',
  styleUrls: ['./toaster-notification.component.scss']
})
export class ToasterNotificationComponent implements OnInit {

  private notifications: Notification[] = [];

  public constructor(
    private readonly notificationService: NotificationService
  ) { }

  public get toasters(): Notification[] {
    return this.notifications;
  }

  public ngOnInit() {
    this.notificationService.getAlert()
      .subscribe((alert: Notification | undefined) => {
        if (!alert) {
          return;
        }

        this.notifications.push(alert);
        if (alert.closeAfterTime) {
          setTimeout(() => {
            this.removeNotification(alert);
          }, TOASTER_NOTIFICATION_TIME);
        }
      });
  }

  public removeNotification(notification: Notification) {
    this.notifications = this.notifications.filter(x => x !== notification);
  }

  public cssClass(notification: Notification) {
    switch (notification.type) {
      case NotificationType.Success:
        return 'toaster-notification__toast--success';
      case NotificationType.Error:
        return 'toaster-notification__toast--error';
      case NotificationType.Info:
        return 'toaster-notification__toast--info';
      case NotificationType.Warning:
        return 'toaster-notification__toast--warning';
    }
  }
}
