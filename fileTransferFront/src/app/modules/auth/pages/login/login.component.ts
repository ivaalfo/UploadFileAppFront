import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { tap, finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { AuthService } from '@core/services/auth/auth.service';

@Component({
  selector: 'm-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  public error?: string;
  public isLoading = false;
  public loginForm: FormGroup;

  public constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      remember: [false]
    });

    this.loginForm.statusChanges.subscribe(() => {
      if (!this.loginForm.invalid) {
        this.error = undefined;
      }
    });
  }

  public login() {
    if (this.isLoading || this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.authService.login(this.loginForm.value.username, this.loginForm.value.password, this.loginForm.value.remember)
      .pipe(
        tap(isLogged => {
          if(isLogged){
            
            sessionStorage.removeItem('filteredEXP');
            sessionStorage.removeItem('filteredUSER');
            sessionStorage.removeItem('filteredFAC');
            sessionStorage.removeItem('filteredTR');
            sessionStorage.removeItem('filteredRCARGA');
            
            this.router.navigate(['/']);
          } else {
            this.error = this.authService.getErrorMessage();
          }
        }),
        finalize(() => this.isLoading = false),
        catchError(error => {
          this.error = error;
          return of(false);
        })
      ).subscribe();
  }
}
