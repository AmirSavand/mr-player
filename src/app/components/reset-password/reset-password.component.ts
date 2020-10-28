import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiError } from '@app/interfaces/api-error';
import { AuthService } from '@app/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {

  /**
   * Token form
   */
  tokenForm: FormGroup;

  /**
   * Success token send to the email
   */
  success: string;

  /**
   * Reset password errors
   */
  tokenError: ApiError = {};

  /**
   * User change password form
   */
  resetPasswordForm: FormGroup;

  /**
   * reset password confirm form errors
   */
  resetPasswordError: ApiError = {};

  /**
   * API loading indicator
   */
  loading: boolean;

  constructor(private formBuilder: FormBuilder,
              private authService: AuthService,
              private router: Router,
              private toast: ToastrService) {
  }

  ngOnInit(): void {
    /**
     * Setup token form
     */
    this.tokenForm = this.formBuilder.group({
      email: ['', Validators.required],
    });
    /**
     * Setup user change password form
     */
    this.resetPasswordForm = this.formBuilder.group({
      new_password1: ['', Validators.required],
      new_password2: ['', Validators.required],
      token: ['', Validators.required],
    });
  }

  /**
   * Send reset password token to user email
   */
  tokenSubmit(): void {
    this.loading = true;
    const tokenEmail = this.tokenForm.get('email').value;
    /**
     * API call
     */
    this.authService.resetPassword(tokenEmail).subscribe((data: { detail: string }) => {
      this.loading = false;
      this.success = data.detail;
      this.tokenError = {};
      this.toast.info(`Password reset email has been sent to ${tokenEmail}`);
    },  (error: HttpErrorResponse): void => {
      this.loading = false;
      this.success = '';
      this.tokenError = error.error;
    });
  }

  /**
   * reset password confirm
   */
  resetPasswordConfirm(): void {
    this.loading = true;
    const code = this.resetPasswordForm.get('token').value;
    /**
     * Get uid from token
     */
    const uid = code.split('-')[0];
    /**
     * Extraction real token of token without uid
     */
    const token = code.split('-').splice(1).join('-');
    /**
     * API call
     */
    this.authService.resetPasswordConfirm({
      new_password1: this.resetPasswordForm.get('new_password1').value,
      new_password2: this.resetPasswordForm.get('new_password2').value,
      uid,
      token,
    }).subscribe((data: { detail: string }): void => {
      this.resetPasswordError = {};
      this.resetPasswordForm.reset();
      this.toast.success(`Password has been changed successfully`);
      /**
       * Navigate to sign in page
       */
      this.router.navigateByUrl('/sign-in');
    }, (error: HttpErrorResponse): void => {
      this.loading = false;
      this.resetPasswordError = error.error;
    });
  }
}
