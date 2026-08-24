import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GlobalSpinnerService {

  private readonly subject = new Subject<boolean>();
  private readonly globalSubject = new Subject<boolean>();

  public getSpinner(): Observable<boolean> {
    return this.subject.asObservable();
  }

  public globalSpinner(): Observable<boolean> {
    return this.globalSubject.asObservable();
  }

  public show(notGlobalSpinner?: boolean) {
    this.subject.next(true);
    notGlobalSpinner ? this.globalSubject.next(false) : this.globalSubject.next(true);
  }

  public hide() {
    this.subject.next(false);
    if (!this.globalSubject) {
      this.globalSubject.next(true);
    }
  }
}
