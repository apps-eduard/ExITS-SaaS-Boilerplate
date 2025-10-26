import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
    { email: 'admin@exitsaas.com', password: 'Admin@123', label: 'System Admin', role: 'system' },
    { email: 'admin-2@example.com', password: 'Admin@123', label: 'Tenant Admin', role: 'tenant' }
  ];

  fillCredentials(account: { email: string; password: string }) {
    this.email = account.email;
    this.password = account.password;
  }

  // Quick login - auto submit
  quickLogin(account: { email: string; password: string }) {
    this.email = account.email;
    this.password = account.password;
    this.login();
  }

  onSubmit() {
    this.login();
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

        const user = response.data.user;
        const roles = response.data.roles || [];
        const platforms = response.data.platforms || [];

        const isSystemAdmin = user.tenant_id === null || user.tenant_id === undefined;
        const isTenantAdmin = roles.some((r: any) => 
          r.name === 'Tenant Admin' && r.space === 'tenant'
        );

        // Allow System Admins AND Tenant Admins
        if (!isSystemAdmin && !isTenantAdmin) {
          this.error = 'This login is for System Admins and Tenant Admins only. Employees and Customers should use Platform Login.';
          this.toastService.error('Please use Platform Login');
          this.authService.logout().subscribe();
          return;
        }

        // System Admin → System Dashboard
        if (isSystemAdmin) {
          this.router.navigate(['/dashboard']);
          return;
        }

        // Tenant Admin → Tenant Dashboard
        if (isTenantAdmin) {
          this.router.navigate(['/tenant/dashboard']);
          return;
        }
      },
      error: (error: any) => {
        this.loading.set(false);
        const message = error.error?.message || 'Login failed. Please check your credentials.';
        this.toastService.error(message);
        this.error = message;
      }
    });
  }
}
