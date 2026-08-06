import { Component, Input } from '@angular/core';
import { ControlContainer, FormGroupDirective } from '@angular/forms';

@Component({
  selector: 'm-login-input',
  templateUrl: './login-input.component.html',
  styleUrls: ['./login-input.component.scss'],
  viewProviders: [{
    provide: ControlContainer,
    useExisting: FormGroupDirective
  }]
})
export class LoginInputComponent {

  @Input()
  public label!: string;

  @Input()
  public isPassword = false;

  @Input()
  public name!: string;

  @Input()
  public icon!: string;

  public constructor(
    public form: FormGroupDirective
  ) { }

  public get type(): 'text' | 'password' {
    return this.isPassword ? 'password' : 'text';
  }

  public get input() {
    return this.form.control.get(this.name);
  }

  public get error(): string {
    if (this.input
      && this.input.invalid
      && (this.input.dirty || this.input.touched || this.form.submitted)) {

      for (const errorType in this.input.errors) {
        if (this.input.errors.hasOwnProperty(errorType)) {
          if (this.input.errors[errorType]) {
            return 'FORM_ERROR.' + errorType;
          }
        }
      }
    }

    return '';
  }
}
