import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Account } from '@app/interfaces/account';
import { ApiError } from '@app/interfaces/api-error';
import { User } from '@app/interfaces/user';
import { ApiService } from '@app/services/api.service';
import { AuthService } from '@app/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss'],
})
export class UserSettingsComponent implements OnInit {

  /**
   * Authenticated user data
   */
  user: User;

  /**
   * User settings form
   */
  form: FormGroup;

  /**
   * User change password form
   */
  changePasswordForm: FormGroup;

  /**
   * Success change password message
   */
  successPasswordMessage: string;

  /**
   * Change password form errors
   */
  changePasswordError: ApiError = {};

  /**
   * API loading indicator
   */
  loading: boolean;

  constructor(private formBuilder: FormBuilder,
              private toast: ToastrService,
              private api: ApiService,
              private auth: AuthService) {
  }

  ngOnInit(): void {
    /**
     * Get user data and fill the form
     */
    this.auth.user.subscribe(user => {
      this.user = user;
      /**
       * Set up the user account form with default values
       */
      this.form = this.formBuilder.group({
        display_name: [user.account.name],
        image: [user.account.image],
        bio: [user.account.bio],
        color: [user.account.color],
      });
    });
    /**
     * Setup user change password form
     */
    this.changePasswordForm = this.formBuilder.group({
      old_password: ['', Validators.required],
      new_password1: ['', Validators.required],
      new_password2: ['', Validators.required],
    });
  }

  /**
   * Update user account data
   */
  submit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    // API call
    this.api.account.update(this.user.username, this.form.value).subscribe((account: Account): void => {
      this.loading = false;
      // Update the user account
      this.user.account = account;
      this.toast.info('Your account has been updated successfully');
      // Update the auth data too
      this.auth.setUser(this.user);
    });
  }

  /**
   * User change password
   */
  changePassword(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    // API call
    this.auth.changePassword(this.changePasswordForm.value).subscribe((data: { detail: string }): void => {
      this.loading = false;
      this.successPasswordMessage = data.detail;
      this.toast.info('Your password has been changed successfully');
      this.changePasswordError = {};
      this.changePasswordForm.reset();
    }, (error: HttpErrorResponse): void => {
      this.loading = false;
      this.successPasswordMessage = '';
      this.changePasswordError = error.error;
    });
  }

}
