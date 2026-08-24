import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'm-install',
  templateUrl: './install.component.html',
  styleUrls: ['./installcomponent.scss']
})

export class InstallComponent {

  @Output()
  public installClicked: EventEmitter<void> = new EventEmitter<void>();

  public install(): void {
    this.installClicked.emit();
  }
}
