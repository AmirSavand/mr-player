import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiError } from '@app/interfaces/api-error';
import { AuthResponse } from '@app/interfaces/auth-response';
import { AuthService } from '@app/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit {

  /**
   * Sign in form
   */
  form: FormGroup;

  /**
   * API loading indicator
   */
  loading = false;

  /**
   * API errors
   */
  errors: ApiError = {};

  constructor(private formBuilder: FormBuilder,
              private authService: AuthService,
              private toast: ToastrService) {
  }

  ngOnInit(): void {
    /**
     * Setup form
     */
    this.form = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  get f() {
    return this.form.controls;
  }

  submit(): void {
    this.loading = true;
    this.errors = {};
    this.authService.signIn(this.f.username.value, this.f.password.value).subscribe((data: AuthResponse) => {
      this.toast.info(`Welcome back ${data.user.account.name}`);
    }, error => {
      this.loading = false;
      this.errors = error.error as ApiError;
    });
  }
}
