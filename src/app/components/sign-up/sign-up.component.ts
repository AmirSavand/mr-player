import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@app/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnInit {

  form: FormGroup;
  loading = false;
  errors: any = {};

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
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  get f() {
    return this.form.controls;
  }

  submit() {
    this.loading = true;
    this.authService.signUp(
      this.f.email.value,
      this.f.username.value,
      this.f.password.value,
    ).subscribe((): void => {
      this.toast.success('Welcome to PlaysEM');
      }, (data: any): void => {
        this.loading = false;
        this.errors = data.error;
      },
    );
  }
}
