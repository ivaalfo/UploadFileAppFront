import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { SwUpdate } from '@angular/service-worker';

@Injectable()
export class PWAService {

  private promptEvent: Subject<Event> = new Subject<Event>();

  public constructor(private swUpdate: SwUpdate) {
    this.suscribeToEvents();
  }

  public getPrompEvent(): Observable<Event> {
    return this.promptEvent.asObservable();
  }

  private suscribeToEvents(): void {
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      this.promptEvent.next(event);
    });

    this.swUpdate.available.subscribe(() => {
      window.location.reload();
    });
  }
}
