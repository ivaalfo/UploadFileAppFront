import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GlobalSpinnerService {

  private readonly subject = new Subject<boolean>();

  public getSpinner(): Observable<boolean> {
    return this.subject.asObservable();
  }

  public show() {
    this.subject.next(true);
  }

  public hide() {
    this.subject.next(false);
  }

}
