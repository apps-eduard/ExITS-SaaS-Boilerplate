import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styles: []
})
export class LoginComponent {
  error = '';

  authService = inject(AuthService);
  toastService = inject(ToastService);
  themeService = inject(ThemeService);
  router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);

  testAccounts = [
    { email: 'admin@exitsaas.com', password: 'Admin@123', label: 'System Admin' },
    { email: 'admin-1@example.com', password: 'Admin@123', label: 'Tenant 1 Admin' },
    { email: 'admin-2@example.com', password: 'Admin@123', label: 'Tenant 2 Admin' },
    { email: 'admin-3@example.com', password: 'Admin@123', label: 'Tenant 3 Admin' }
  ];

  fillCredentials(account: { email: string; password: string }) {
    this.email = account.email;
    this.password = account.password;
  }

  login() {
    if (!this.email || !this.password) {
      this.toastService.warning('Please enter email and password');
      return;
    }

    this.loading.set(true);

    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        this.loading.set(false);
        this.toastService.success(`Welcome back, ${response.data.user.first_name}!`);

        // Route based on user type
        const user = response.data.user;
        const isSystemAdmin = user.tenant_id === null || user.tenant_id === undefined;
        const targetRoute = isSystemAdmin ? '/dashboard' : '/tenant/dashboard';

        setTimeout(() => {
          this.router.navigate([targetRoute]);
        }, 100);
      },
      error: (error: any) => {
        this.loading.set(false);
        const message = error.error?.message || 'Login failed. Please check your credentials.';
        this.toastService.error(message);
        this.error = message;
      }
    });
  }

  onSubmit() {
    this.login();
  }
}
