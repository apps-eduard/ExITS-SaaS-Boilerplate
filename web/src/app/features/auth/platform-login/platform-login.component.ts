import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { PlatformSelectorModalComponent } from '../../../shared/components/platform-selector-modal/platform-selector-modal.component';
import { DevInfoComponent } from '../../../shared/components/dev-info/dev-info.component';

@Component({
  selector: 'app-platform-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PlatformSelectorModalComponent, DevInfoComponent],
  templateUrl: './platform-login.component.html',
  styles: []
})
export class PlatformLoginComponent {
  error = '';

  authService = inject(AuthService);
  toastService = inject(ToastService);
  themeService = inject(ThemeService);
  router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);

  // Platform selector state
  showPlatformSelector = signal(false);
  userPlatforms = signal<any[]>([]);

  // Test accounts for platform users (Tenant Admins and Employees only)
  testAccounts = [
    { email: 'admin-1@example.com', password: 'Admin@123', label: 'ACME - Tenant Admin' },
    { email: 'employee1@acme.com', password: 'Admin@123', label: 'ACME - Employee 1 (Loan Officer)' },
    { email: 'employee2@acme.com', password: 'Admin@123', label: 'ACME - Employee 2 (Collections)' },
  { email: 'admin-2@example.com', password: 'Admin@123', label: 'TechStart - Tenant Admin' },
    { email: 'employee1@techstart.com', password: 'Admin@123', label: 'TechStart - Employee 1 (Loan Officer)' },
    { email: 'employee2@techstart.com', password: 'Admin@123', label: 'TechStart - Employee 2 (Collections)' }
  ];

  fillCredentials(account: { email: string; password: string }) {
    this.email = account.email;
    this.password = account.password;
  }

  // Quick login - auto submit
  quickLogin(account: { email: string; password: string }) {
    this.email = account.email;
    this.password = account.password;
    this.onSubmit();
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.toastService.warning('Please enter email and password');
      return;
    }

    this.loading.set(true);

    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        this.loading.set(false);

        const user = response.data.user;
        const platforms = response.data.platforms || [];
        const roles = response.data.roles || [];

        // Show welcome message with proper name fallback
        const userName = user.firstName || user.email.split('@')[0];
        this.toastService.success(`Welcome back, ${userName}!`);

        // Check if user is System Admin (uses camelCase tenantId from API)
        const isSystemAdmin = user.tenantId === null || user.tenantId === undefined;

        if (isSystemAdmin) {
          this.error = 'This login is for platform users only. Please use the main login.';
          this.toastService.error('This login is for platform users only');
          this.authService.logout().subscribe();
          return;
        }

        // Check if user is Tenant Admin
        const isTenantAdmin = roles.some((r: any) =>
          r.name === 'Tenant Admin' && r.space === 'tenant'
        );

        // ===== TENANT ADMIN ROUTING =====
        // Tenant Admins have FULL ACCESS to tenant management
        // They can use Platform Login OR System Login
        if (isTenantAdmin) {
          // If Tenant Admin has NO platforms → Route to Tenant Dashboard
          if (platforms.length === 0) {
            console.log(`✅ Tenant Admin with no platforms → /tenant/dashboard`);
            this.router.navigate(['/tenant/dashboard']);
            return;
          }

          // If Tenant Admin has SINGLE platform → Show choice or auto-route
          if (platforms.length === 1) {
            // For now, auto-route to platform (they can navigate to admin features via menu)
            const route = this.getPlatformRoute(platforms[0].productType);
            console.log(`✅ Tenant Admin with 1 platform: ${platforms[0].productType} → ${route}`);
            this.router.navigate([route]);
            return;
          }

          // If Tenant Admin has MULTIPLE platforms → Show selector modal
          console.log(`🎯 Tenant Admin with ${platforms.length} platforms, showing selector`);
          this.userPlatforms.set(platforms);
          this.showPlatformSelector.set(true);
          return;
        }

        // ===== EMPLOYEE ROUTING =====
        // Employees MUST have platform access (they don't have tenant management access)
        if (platforms.length === 0) {
          this.error = 'No platform access found. Please contact your administrator.';
          this.toastService.error('No platform access found');
          this.authService.logout().subscribe();
          return;
        }

        // Employee with SINGLE platform → Auto-route
        if (platforms.length === 1) {
          const route = this.getPlatformRoute(platforms[0].productType);
          console.log(`✅ Employee with 1 platform: ${platforms[0].productType} → ${route}`);
          this.router.navigate([route]);
          return;
        }

        // Employee with MULTIPLE platforms → Show selector modal
        console.log(`🎯 Employee with ${platforms.length} platforms, showing selector`);
        this.userPlatforms.set(platforms);
        this.showPlatformSelector.set(true);
      },
      error: (error: any) => {
        this.loading.set(false);
        const message = error.error?.message || 'Login failed. Please check your credentials.';
        this.toastService.error(message);
        this.error = message;
      }
    });
  }

  onPlatformSelected(route: string) {
    console.log(`✅ Platform selected: ${route}`);
    this.showPlatformSelector.set(false);
    this.router.navigate([route]);
  }

  getPlatformRoute(productType: string): string {
    const routes: Record<string, string> = {
      'money_loan': '/platforms/money-loan/dashboard',
      'bnpl': '/platforms/bnpl/dashboard',
      'pawnshop': '/platforms/pawnshop/dashboard'
    };
    return routes[productType] || '/tenant/dashboard';
  }
}
