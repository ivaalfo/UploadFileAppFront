import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfirmSliderService {
  private confirmed: Subject<boolean> = new Subject<boolean>();
  private enabled: Subject<boolean> = new Subject<boolean>();
  private visibility: Subject<boolean> = new Subject<boolean>();
  private textSlider: Subject<string> = new Subject<string>();

  public confirm(): void {
    this.confirmed.next(true);
  }

  public unConfirm(): void {
    this.confirmed.next(false);
  }

  public getConfirm(): Observable<boolean> {
    return this.confirmed.asObservable();
  }

  public getEnabled(): Observable<boolean> {
    return this.enabled.asObservable();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled.next(enabled);
  }
  public getTextSlider(): Observable<string> {
    return this.textSlider.asObservable();
  }

  public setTextSlider(text: string): void {
    this.textSlider.next(text);
  }

  public getVisibility(): Observable<boolean> {
    return this.visibility.asObservable();
  }

  public setVisibility(visible: boolean): void {
    this.visibility.next(visible);
  }
}
