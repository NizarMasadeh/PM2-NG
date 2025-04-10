import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { NotificationService } from 'nzrm-ng';
@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  registerForm: FormGroup;
  isRegistered = false
  error = ""
  loading = false
  isRegistering = false

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private _notificationService: NotificationService
  ) {
    this.loginForm = this.fb.group({
      username: ["", [Validators.required]],
      password: ["", [Validators.required]],
    })

    this.registerForm = this.fb.group({
      username: ["", [Validators.required]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      confirmPassword: ["", [Validators.required]],
    })
  }

  ngOnInit(): void {
    this.authService.checkUserExists().subscribe(
      (exists) => {
        this.isRegistered = exists
      },
      (error) => {
        console.error("Error checking if user exists:", error)
      },
    )
  }

  onLogin(): void {
    if (this.loginForm.invalid) return

    this.loading = true
    this.error = ""

    const { username, password } = this.loginForm.value

    this.authService.login(username, password).subscribe(
      (success) => {
        this.loading = false
        if (success) {
          this.router.navigate(["/"])
        } else {
          this._notificationService.error('Error', 'Wrong username or password!')
          this.error = "Invalid username or password"
        }
      },
      (error) => {
        this.loading = false
        this.error = "Login failed. Please try again."
        console.error("Login error:", error)
      },
    )
  }

  onRegister(): void {
    if (this.registerForm.invalid) return

    const { password, confirmPassword } = this.registerForm.value
    if (password !== confirmPassword) {
      this.error = "Passwords do not match"
      return
    }

    this.loading = true
    this.error = ""

    const { username } = this.registerForm.value

    this.authService.register(username, password).subscribe(
      (success) => {
        this.loading = false
        if (success) {
          this.isRegistered = true
          this.loginForm.patchValue({ username })
        } else {
          this.error = "Registration failed. Please try again."
        }
      },
      (error) => {
        this.loading = false
        this.error = "Registration failed. Please try again."
        console.error("Registration error:", error)
      },
    )
  }

  toggleRegister(): void {
    this.isRegistering = !this.isRegistering
    this.error = ""
  }
}

