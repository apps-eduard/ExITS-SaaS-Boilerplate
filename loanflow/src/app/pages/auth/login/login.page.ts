import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async login(): Promise<void> {
    if (this.loginForm.invalid) {
      this.showAlert('Error', 'Please fill in all fields correctly');
      return;
    }

    this.isLoading = true;
    const loader = await this.loadingController.create({
      message: 'Logging in...',
    });
    await loader.present();

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: async (response) => {
        await loader.dismiss();
        this.isLoading = false;

        const returnUrl = localStorage.getItem('returnUrl') || '/dashboard';
        localStorage.removeItem('returnUrl');
        this.router.navigate([returnUrl]);
      },
      error: async (error) => {
        await loader.dismiss();
        this.isLoading = false;
        this.showAlert('Login Failed', error.message || 'Invalid email or password');
      },
    });
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  async showAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
